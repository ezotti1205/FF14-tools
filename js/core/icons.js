/* ===== アイテムアイコン（XIVAPI v2） =====
   アイテムID → アイコンのgame path を XIVAPI v2 から取得し、
   https://v2.xivapi.com/api/asset?path=...&format=png をそのまま <img> に貼ります
   （XIVAPI 側がホットリンク前提の設計なので、画像を自前で持ちません）。

   タブ横断で使える共通モジュールです。使い方は2ステップだけ:

     html += FF14.core.Icons.placeholder(itemId, itemName);   // 文字列を組むとき
     el.innerHTML = html;
     FF14.core.Icons.hydrate(el);                             // 差し込んだ直後

   「作る vs 買う」タブの描画は innerHTML の作り直しなので、同期で書ける
   プレースホルダを先に置き、あとから <img> を埋める形にしています。
   解決済みのIDは localStorage のキャッシュから同期で埋まるため、
   2回目以降の再描画ではチラつきません。

   ▼ 実装メモ（XIVAPI v2 を実際に叩いて確かめたこと）
     ・GET /api/sheet/Item/{id}?fields=Icon
         → { row_id, fields: { Icon: { id, path, path_hr1 } } }
     ・GET /api/sheet/Item?rows=1,2,3&fields=Icon   … 一括取得。60件までは確認済み
         → { rows: [ { row_id, fields: { Icon: { path } } }, ... ] }
     ・一括取得は「存在しないIDが1つでも混ざるとバッチ全体が404」になります。
       そのため失敗したバッチだけ1件ずつ取り直すフォールバックを入れてあります。 */
FF14.core.Icons = (function () {
  'use strict';

  var SHEET_URL = 'https://v2.xivapi.com/api/sheet/Item';
  var ASSET_URL = 'https://v2.xivapi.com/api/asset';
  var KEY = 'ff14hub.v1.icons';

  var BATCH_SIZE = 60;          // 1リクエストあたりのID数（実測で60件OK）
  var TIMEOUT_MS = 10000;
  var MAX_ENTRIES = 2000;       // localStorage が肥大しないよう上限
  var MISSING_TTL = 24 * 3600 * 1000;   // 404（そのIDにアイコンが無い）を再挑戦するまで
  var SOFT_TTL = 5 * 60 * 1000;         // 通信エラー・タイムアウトを再挑戦するまで
  var EAGER_RETRY_MS = 1200;            // eager な枠で画像が落ちたときに張り直すまでの間

  /* paths: { itemId: "ui/icon/035000/035022.tex" }
     missing: { itemId: 404だった時刻(ms) } — こちらは localStorage に残す */
  var cache = { paths: {}, missing: {} };
  /* 通信エラーは一時的なものなので、メモリ上で数分だけ抑制する。
     オフラインになった瞬間のIDを24時間ぶん覚えてしまわないための区別です。 */
  var softMissing = {};
  var inflight = {};            // itemId -> Promise（同じIDの多重リクエストを束ねる）
  var dirty = false;
  var saveTimer = null;

  /* ---------- 永続化 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        if (o.paths && typeof o.paths === 'object') cache.paths = o.paths;
        if (o.missing && typeof o.missing === 'object') cache.missing = o.missing;
      }
    } catch (e) {
      /* 壊れていたら捨てて作り直す。ここで落ちても本体には影響させない */
      console.warn('[icons] キャッシュを読めませんでした', e);
      cache = { paths: {}, missing: {} };
    }
  }

  function trim() {
    var keys = Object.keys(cache.paths);
    if (keys.length <= MAX_ENTRIES) return;
    /* 古い順の情報は持っていないので、素直に先頭から落とす */
    var drop = keys.length - MAX_ENTRIES;
    for (var i = 0; i < drop; i++) delete cache.paths[keys[i]];
  }

  function save() {
    saveTimer = null;
    if (!dirty) return;
    dirty = false;
    try {
      trim();
      localStorage.setItem(KEY, JSON.stringify({ v: 1, paths: cache.paths, missing: cache.missing }));
    } catch (e) {
      /* 容量オーバーなど。キャッシュが無くても動作はするので握りつぶす */
      console.warn('[icons] キャッシュを保存できませんでした', e);
    }
  }

  function saveSoon() {
    dirty = true;
    if (saveTimer) return;
    saveTimer = setTimeout(save, 500);
  }

  /* ---------- 取得 ---------- */
  function normId(id) {
    var n = Number(id);
    return (isFinite(n) && n > 0) ? String(Math.floor(n)) : null;
  }

  function isMissing(id) {
    var now = Date.now();
    var hard = cache.missing[id];
    if (hard) {
      if (now - hard <= MISSING_TTL) return true;
      delete cache.missing[id];
    }
    var soft = softMissing[id];
    if (soft) {
      if (now - soft <= SOFT_TTL) return true;
      delete softMissing[id];
    }
    return false;
  }

  /** 解決済みか（キャッシュにパスがある / 取れないと分かっている） */
  function isResolved(id) {
    return !!cache.paths[id] || isMissing(id);
  }

  function fetchJson(url) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var opt = ctrl ? { signal: ctrl.signal } : {};
    return fetch(url, opt).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) {
        var e = new Error('HTTP ' + res.status);
        e.httpStatus = res.status;   // 404（=そのIDが無い）と通信断を区別するため
        throw e;
      }
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function pathFromRow(row) {
    try {
      var ic = row && row.fields && row.fields.Icon;
      return (ic && typeof ic.path === 'string' && ic.path) ? ic.path : null;
    } catch (e) { return null; }
  }

  /**
   * 結果を覚える。
   * @param {string} id
   * @param {string|null} path 取れた game path。取れなければ null
   * @param {boolean} [soft] true なら「一時的に取れなかった」扱い（保存せず数分で再挑戦）
   */
  function remember(id, path, soft) {
    if (path) {
      cache.paths[id] = path;
      delete cache.missing[id];
      delete softMissing[id];
      saveSoon();
    } else if (soft) {
      softMissing[id] = Date.now();
    } else {
      cache.missing[id] = Date.now();
      saveSoon();
    }
  }

  /** そのエラーが「一時的な失敗」か（通信断・タイムアウト・サーバ側5xx） */
  function isTransient(err) {
    var s = err && err.httpStatus;
    if (!s) return true;              // fetch自体の失敗 / abort → 一時的
    return s >= 500 || s === 429;
  }

  /** ID1件ぶんを取りに行く（バッチが失敗したときのフォールバック） */
  function fetchOne(id) {
    return fetchJson(SHEET_URL + '/' + id + '?fields=Icon')
      .then(function (json) { remember(id, pathFromRow(json)); })
      .catch(function (err) {
        console.warn('[icons] アイコンを取得できませんでした #' + id, err && err.message);
        remember(id, null, isTransient(err));
      });
  }

  /** ID複数をまとめて取りに行く。バッチが失敗したら1件ずつに切り替える */
  function fetchBatch(ids) {
    return fetchJson(SHEET_URL + '?rows=' + ids.join(',') + '&fields=Icon')
      .then(function (json) {
        var rows = (json && json.rows) || [];
        var seen = {};
        rows.forEach(function (row) {
          var rid = normId(row && row.row_id);
          if (!rid) return;
          seen[rid] = true;
          remember(rid, pathFromRow(row));
        });
        /* 返ってこなかったIDは取れなかったものとして記録 */
        ids.forEach(function (id) { if (!seen[id]) remember(id, null); });
      })
      .catch(function (err) {
        console.warn('[icons] 一括取得に失敗したので1件ずつ取り直します（' +
                     ((err && err.message) || err) + '）');
        var chain = Promise.resolve();
        ids.forEach(function (id) {
          chain = chain.then(function () { return fetchOne(id); });
        });
        return chain;
      });
  }

  /**
   * 未解決のアイテムIDを解決する。失敗しても reject しない（必ず解決する）。
   * @param {Array} ids アイテムIDの配列
   * @returns {Promise} 全部の解決が終わったら resolve
   */
  function resolve(ids) {
    var wanted = [], pending = [], seen = {};
    try {
      (ids || []).forEach(function (raw) {
        var id = normId(raw);
        if (!id || seen[id]) return;
        seen[id] = true;
        if (isResolved(id)) return;
        if (inflight[id]) { pending.push(inflight[id]); return; }
        wanted.push(id);
      });
    } catch (e) {
      console.warn('[icons] IDの整理に失敗しました', e);
      return Promise.resolve();
    }

    if (!wanted.length) return Promise.all(pending).then(noop, noop);

    var jobs = [];
    for (var i = 0; i < wanted.length; i += BATCH_SIZE) {
      (function (chunk) {
        var job = fetchBatch(chunk).catch(noop).then(function () {
          chunk.forEach(function (id) { delete inflight[id]; });
        });
        chunk.forEach(function (id) { inflight[id] = job; });
        jobs.push(job);
      })(wanted.slice(i, i + BATCH_SIZE));
    }
    return Promise.all(jobs.concat(pending)).then(noop, noop);
  }

  function noop() {}

  /* ---------- 参照 ---------- */
  function assetUrl(path) {
    return ASSET_URL + '?path=' + encodeURIComponent(path) + '&format=png';
  }

  /** キャッシュにあれば画像URLを同期で返す。無ければ null */
  function urlOf(id) {
    var key = normId(id);
    if (!key) return null;
    var p = cache.paths[key];
    return p ? assetUrl(p) : null;
  }

  /** キャッシュにあれば game path を同期で返す。無ければ null */
  function pathOf(id) {
    var key = normId(id);
    return (key && cache.paths[key]) || null;
  }

  /* ---------- DOM ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * innerHTML に差し込むアイコン枠を返す。
   * 常に同じ大きさの箱なので、画像が取れても取れなくてもレイアウトは動きません。
   * @param {number} id アイテムID
   * @param {string} [name] alt に使うアイテム名
   * @param {string} [size] 'sm'（小さめ）を指定できます
   */
  function placeholder(id, name, size) {
    var key = normId(id);
    if (!key) return '';
    return '<span class="ff14-icon' + (size ? ' ff14-icon-' + size : '') + '"' +
           ' data-icon-item="' + key + '"' +
           (name ? ' data-icon-alt="' + esc(name) + '"' : '') + '></span>';
  }

  function paint(span) {
    var id = span.getAttribute('data-icon-item');
    var url = urlOf(id);
    if (!url) return false;
    if (span.getAttribute('data-icon-done') === url) return true;

    /* data-icon-eager が付いた枠は loading="lazy" を使わず、失敗したら一度だけ張り直す。
       市場タブのように数十件が一度に並ぶ一覧では、画面外と判定されたまま読み込まれず
       アイコンが歯抜けになるため。 */
    var eager = span.hasAttribute('data-icon-eager');
    var retried = false;

    var img = document.createElement('img');
    img.alt = span.getAttribute('data-icon-alt') || '';
    img.decoding = 'async';
    if (!eager) img.loading = 'lazy';
    /* 画像だけ落ちた場合も枠を残して崩さない */
    img.onerror = function () {
      try {
        if (eager && !retried) {
          /* 同時接続が詰まっただけのことがあるので一度だけ張り直す */
          retried = true;
          setTimeout(function () {
            if (img.parentNode === span) {
              img.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'r=1';
            }
          }, EAGER_RETRY_MS);
          return;
        }
        span.removeAttribute('data-icon-done');
        if (img.parentNode === span) span.removeChild(img);
        span.classList.add('is-failed');
      } catch (e) { /* 表示だけの問題なので握りつぶす */ }
    };
    span.innerHTML = '';
    span.classList.remove('is-failed');
    span.appendChild(img);
    img.src = url;
    span.setAttribute('data-icon-done', url);
    return true;
  }

  /**
   * root 配下の placeholder を埋める。
   * キャッシュ済みは同期で、未解決のものは取得後に埋めます。
   * 取得を待っている間に再描画されても、DOMから消えた要素は触りません。
   */
  function hydrate(root) {
    var scope = root || document;
    var spans;
    try {
      spans = scope.querySelectorAll('[data-icon-item]');
    } catch (e) {
      console.warn('[icons] hydrate に失敗しました', e);
      return Promise.resolve();
    }

    var need = [];
    Array.prototype.forEach.call(spans, function (span) {
      try {
        if (!paint(span)) {
          var id = span.getAttribute('data-icon-item');
          if (!isMissing(id)) need.push(id);
        }
      } catch (e) { console.warn('[icons] アイコンの描画に失敗しました', e); }
    });

    if (!need.length) return Promise.resolve();

    return resolve(need).then(function () {
      Array.prototype.forEach.call(spans, function (span) {
        /* 待っている間に再描画されていたら、その要素はもう画面にない */
        if (!document.contains(span)) return;
        try { paint(span); } catch (e) { /* 表示だけの問題 */ }
      });
    }, noop);
  }

  /** DOMを介さずに先読みしたいとき用 */
  function prefetch(ids) { return resolve(ids); }

  /**
   * すでに分かっている game path をキャッシュへ流し込む。
   * 市場タブの検索は XIVAPI の応答に Icon.path が入っているので、
   * これを使えば同じアイテムのパスを取り直さずに済みます（リクエストが増えません）。
   *
   * @param {number} id アイテムID
   * @param {string} pathOrUrl "ui/icon/020000/020801.tex" でも、assetUrl() 済みのURLでも可
   * @returns {boolean} 取り込めたか
   */
  function prime(id, pathOrUrl) {
    var key = normId(id);
    if (!key || !pathOrUrl) return false;

    var p = String(pathOrUrl);
    if (/^https?:/.test(p)) {
      /* assetUrl() が作ったURLなら path= を取り出す。他所のURLは扱わない */
      var m = /[?&]path=([^&]+)/.exec(p);
      if (!m) return false;
      try { p = decodeURIComponent(m[1]); } catch (e) { return false; }
    }
    if (!p) return false;

    if (cache.paths[key] === p) return true;
    cache.paths[key] = p;
    delete cache.missing[key];
    delete softMissing[key];
    saveSoon();
    return true;
  }

  /**
   * アイコン枠を DOM要素として返す。文字列を組み立てずに appendChild したいとき用。
   * placeholder() と違い loading="lazy" を使わず、失敗したら一度だけ張り直します
   * （一覧に数十件並べても歯抜けにならないようにするため）。
   *
   * @param {number} id アイテムID
   * @param {string} [name] alt に使うアイテム名
   * @param {string} [size] 'sm' | 'lg'
   * @returns {HTMLSpanElement} 取得の成否にかかわらず同じ大きさの箱
   */
  function element(id, name, size) {
    var span = document.createElement('span');
    span.className = 'ff14-icon' + (size ? ' ff14-icon-' + size : '');
    var key = normId(id);
    if (!key) {
      span.classList.add('is-failed');
      return span;
    }
    span.setAttribute('data-icon-item', key);
    span.setAttribute('data-icon-eager', '1');
    if (name) span.setAttribute('data-icon-alt', name);

    if (!paint(span) && !isMissing(key)) {
      /* キャッシュに無いものだけ取りに行く。失敗しても枠はそのまま残る */
      resolve([key]).then(function () {
        if (span.isConnected === false) return;
        try { paint(span); } catch (e) { /* 表示だけの問題 */ }
      }, noop);
    }
    return span;
  }

  function clear() {
    cache = { paths: {}, missing: {} };
    softMissing = {};
    try { localStorage.removeItem(KEY); } catch (e) { /* 消せなくても実害なし */ }
  }

  function size() { return Object.keys(cache.paths).length; }

  load();
  /* 保存待ちのまま閉じられた場合の取りこぼしを防ぐ */
  window.addEventListener('beforeunload', function () {
    if (saveTimer) { clearTimeout(saveTimer); save(); }
  });

  return {
    KEY: KEY,
    placeholder: placeholder,
    hydrate: hydrate,
    prefetch: prefetch,
    prime: prime,
    element: element,
    resolve: resolve,
    urlOf: urlOf,
    pathOf: pathOf,
    assetUrl: assetUrl,
    clear: clear,
    size: size
  };
})();
