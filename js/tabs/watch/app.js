/* app.js — 市場チェックの画面ロジック。
 *
 *   上部バー    … 検索（入力に追従する候補リスト付き）と ワールド/DC 選択。検索・登録リスト共通。
 *   検索結果    … アイコン＋現在の最安値(NQ/HQ)を一時表示。登録しなくても見られる。
 *   登録リスト  … 常時表示。手動/自動更新、閾値による強調、登録解除。
 *
 * タブUI / hub-bar は持たない（統合時に既存 tabs.js / hub.js へ載せ替える前提）。 */
(function () {
  'use strict';

  var Store = FF14.watch.Store;
  var Universalis = FF14.watch.Universalis;
  var XIVAPI = FF14.watch.XIVAPI;
  var Icons = FF14.core.Icons;   // アイコンは共通モジュールに一本化（旧 FF14.watch.icons）
  var Marketable = FF14.watch.Marketable;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    scopeType: $('scopeType'), scopeName: $('scopeName'), lang: $('lang'), scopeMsg: $('scopeMsg'),
    searchForm: $('searchForm'), searchInput: $('searchInput'), suggestList: $('suggestList'),
    searchMsg: $('searchMsg'), searchResults: $('searchResults'), searchEmpty: $('searchEmpty'),
    clearBtn: $('watchClearBtn'),   // 総資産タブの #clearBtn と衝突するので統合時に改名
    autoRefresh: $('autoRefresh'), autoInterval: $('autoInterval'), refreshBtn: $('refreshBtn'),
    favMsg: $('favMsg'), favList: $('favList'), favEmpty: $('favEmpty'),
    favToolbar: $('favToolbar'), favFilter: $('favFilter'), favSort: $('favSort'),
    favSortDir: $('favSortDir'), favShown: $('favShown'), favNoMatch: $('favNoMatch')
  };

  var settings = Object.assign({
    scopeType: 'dc', scopeName: '', lang: 'ja', autoRefresh: false, autoInterval: 600000,
    favSort: 'added', favSortDir: 'asc'
  }, Store.getSettings());

  var worldsData = null;   // { worlds:[{id,name}], dcs:[{name,region,worlds:[id]}] }
  var lastResults = [];    // 直近の検索結果（画面に出している分）
  var lastTotal = 0;       // 絞り込み後の総ヒット数（表示は MAX_SHOWN 件まで）
  var autoTimer = null;
  var lastFetch = 0;       // 直近に Universalis を叩いた時刻（自動更新の間引き用）
  var AUTO_MIN = 300000;   // 自動更新の下限 5分（レート制限に配慮）

  // ---------------------------------------------------------------- helpers
  function gil(n) { return (n == null) ? '—' : Number(n).toLocaleString('ja-JP'); }
  function scope() { return (settings.scopeName || '').trim(); }
  function saveSettings() { Store.putSettings(settings); }

  function relTime(ts) {
    if (!ts) return '';
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return s + '秒前';
    if (s < 3600) return Math.round(s / 60) + '分前';
    if (s < 86400) return Math.round(s / 3600) + '時間前';
    return Math.round(s / 86400) + '日前';
  }

  function setMsg(el, text, isErr) {
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isErr);
  }

  /* 通信を待っている間、検索欄の下にバーを走らせる（css/motion.css の .is-busy）。
     検索とfav更新が同時に走ることがあるので、数えて0になったら消す。 */
  var busyCount = 0;
  function busy(on) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    var wrap = els.searchForm && els.searchForm.parentNode;
    if (wrap) wrap.classList.toggle('is-busy', busyCount > 0);
  }

  function opt(v, label) {
    var o = document.createElement('option');
    o.value = v; o.textContent = label || v;
    return o;
  }
  function byName(a, b) { return String(a.name).localeCompare(b.name); }

  // ---------------------------------------------------------------- 価格セル
  function priceNode(rec) {
    var wrap = document.createElement('div');
    wrap.className = 'prices';
    if (rec && rec.untradable) {
      wrap.appendChild(prBlock('MARKET', null, false, '取引不可', true));
      return wrap;
    }
    wrap.appendChild(prBlock('NQ 最安', rec && rec.nq ? rec.nq.min : null, false));
    wrap.appendChild(prBlock('HQ 最安', rec && rec.hq ? rec.hq.min : null, true));
    return wrap;
  }
  function prBlock(label, val, isHq, textOverride, wide) {
    var d = document.createElement('div');
    d.className = 'pr' + (isHq ? ' hq' : '') + (wide ? ' wide' : '') +
                  ((textOverride == null && val == null) ? ' is-none' : '');
    var q = document.createElement('span'); q.className = 'q'; q.textContent = label;
    var v = document.createElement('span'); v.className = 'v';
    v.textContent = textOverride != null ? textOverride : gil(val);
    d.appendChild(q); d.appendChild(v);
    return d;
  }

  // ---------------------------------------------------------------- スコープ選択
  function populateScopeOptions() {
    var sel = els.scopeName;
    if (!sel || sel.tagName !== 'SELECT' || !worldsData) return;
    sel.innerHTML = '';
    var dcs = (worldsData.dcs || []).slice().sort(byName);

    if (settings.scopeType === 'dc') {
      // リージョンごとにまとめる
      var regions = [], seen = {};
      dcs.forEach(function (dc) {
        var r = dc.region || 'その他';
        if (!seen[r]) { seen[r] = []; regions.push(r); }
        seen[r].push(dc);
      });
      regions.forEach(function (r) {
        var g = document.createElement('optgroup');
        g.label = r;
        seen[r].forEach(function (dc) { g.appendChild(opt(dc.name, '★ ' + dc.name + '（DC全体）')); });
        sel.appendChild(g);
      });
    } else {
      var nameById = {};
      (worldsData.worlds || []).forEach(function (w) { nameById[w.id] = w.name; });
      dcs.forEach(function (dc) {
        var g = document.createElement('optgroup');
        g.label = dc.name;
        (dc.worlds || []).map(function (id) { return nameById[id]; })
          .filter(Boolean).sort()
          .forEach(function (nm) { g.appendChild(opt(nm)); });
        if (g.children.length) sel.appendChild(g);
      });
    }

    /* まだ選んだことがなければ「作る vs 買う」タブのワールドに合わせる。
       同じアプリで既定のワールドが2つに割れていると分かりにくいため。
       （キーは別々のままなので、片方だけ変えることはできる） */
    var want = settings.scopeName;
    if (!want) {
      try {
        var cs = FF14.craft.Store.getSettings();
        if (cs && cs.scopeType === settings.scopeType && cs.scopeName) want = cs.scopeName;
      } catch (e) { /* craft 側が読めなくても既定値で続行する */ }
    }

    var has = Array.prototype.some.call(sel.options, function (o) { return o.value === want; });
    if (has) {
      sel.value = want;
      if (settings.scopeName !== want) { settings.scopeName = want; saveSettings(); }
    } else {
      settings.scopeName = sel.options.length ? sel.options[0].value : '';
      saveSettings();
    }
  }

  function useFallbackScopeInput() {
    var sel = els.scopeName;
    if (!sel || sel.tagName === 'INPUT') return;
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.id = 'scopeName';
    inp.placeholder = 'ワールド名 / DC名（例: Elemental）';
    inp.value = settings.scopeName || '';
    sel.parentNode.replaceChild(inp, sel);
    els.scopeName = inp;
  }

  function loadWorlds() {
    setMsg(els.scopeMsg, 'ワールド一覧を取得中…');
    Universalis.loadWorlds().then(function (data) {
      worldsData = data;
      setMsg(els.scopeMsg, '');
      populateScopeOptions();
      onScopeChanged();
    }).catch(function () {
      setMsg(els.scopeMsg, 'ワールド一覧を取得できませんでした。対象の名前を直接入力してください。', true);
      useFallbackScopeInput();
      if (scope()) onScopeChanged();
    });
  }

  function onScopeChanged() {
    refreshFavs(false);
    if (lastResults.length) priceResults(false);
  }

  // ---------------------------------------------------------------- 候補リスト（予測変換）
  var sug = {
    items: [], sel: -1, open: false,
    seq: 0, timer: null, composing: false, cache: {}, cacheKeys: []
  };

  function closeSuggest() {
    sug.open = false;
    sug.items = [];
    sug.sel = -1;
    els.suggestList.hidden = true;
    els.suggestList.innerHTML = '';
    els.searchInput.setAttribute('aria-expanded', 'false');
  }

  function openSuggest(rows) {
    els.suggestList.innerHTML = '';
    sug.items = rows;
    sug.sel = -1;

    if (!rows.length) {
      var note = document.createElement('li');
      note.className = 'is-note';
      note.textContent = '該当するアイテムがありません';
      els.suggestList.appendChild(note);
    } else {
      rows.forEach(function (r, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.appendChild(Icons.element(r.id, r.name, 'sm'));

        var nm = document.createElement('span');
        nm.className = 's-name';
        nm.textContent = r.name;
        li.appendChild(nm);

        if (r.untradable) {
          var tag = document.createElement('span');
          tag.className = 's-tag';
          tag.textContent = '取引不可';
          li.appendChild(tag);
        }
        // blur より先に拾いたいので mousedown
        li.addEventListener('mousedown', function (e) { e.preventDefault(); pickSuggest(i); });
        els.suggestList.appendChild(li);
      });
    }

    sug.open = true;
    els.suggestList.hidden = false;
    els.searchInput.setAttribute('aria-expanded', 'true');
  }

  function moveSuggest(delta) {
    if (!sug.open || !sug.items.length) return;
    var lis = els.suggestList.querySelectorAll('li[role="option"]');
    var n = sug.items.length;
    // -1（未選択）を 0 番目として n+1 通りで巡回させる
    sug.sel = (sug.sel + 1 + delta + n + 1) % (n + 1) - 1;
    for (var i = 0; i < lis.length; i++) {
      lis[i].setAttribute('aria-selected', i === sug.sel ? 'true' : 'false');
    }
    if (sug.sel >= 0 && lis[sug.sel]) lis[sug.sel].scrollIntoView({ block: 'nearest' });
  }

  function pickSuggest(i) {
    var item = sug.items[i];
    if (!item) return;
    els.searchInput.value = item.name;
    closeSuggest();
    showResults([item]);
  }

  function cachePut(key, rows) {
    sug.cache[key] = rows;
    sug.cacheKeys.push(key);
    while (sug.cacheKeys.length > 60) delete sug.cache[sug.cacheKeys.shift()];
  }
  /* 検索結果の整形 ---------------------------------------------------------
     XIVAPI は装備・クエスト品・未使用アイテムまで拾い、その大半は相場が無い。
     出品可能なものだけに絞り、名前の当たり方が近い順に並べ直す。 */

  /** 出品可能なものだけ残す（一覧が未取得のときは素通し） */
  function onlyMarketable(rows) {
    return rows.filter(function (r) { return Marketable.has(r.id); });
  }

  /** 完全一致 → 前方/後方一致 → 部分一致、同順位なら短い名前・五十音順 */
  function rankResults(rows, q) {
    var lq = String(q || '').toLowerCase();
    function rank(name) {
      var ln = String(name).toLowerCase();
      if (ln === lq) return 0;
      if (ln.indexOf(lq) === 0 || ln.lastIndexOf(lq) === ln.length - lq.length) return 1;
      return 2;
    }
    return rows.slice().sort(function (a, b) {
      var ra = rank(a.name), rb = rank(b.name);
      if (ra !== rb) return ra - rb;
      if (a.name.length !== b.name.length) return a.name.length - b.name.length;
      return String(a.name).localeCompare(String(b.name), 'ja');
    });
  }

  function prepare(rows, q) { return rankResults(onlyMarketable(rows), q); }

  function queueSuggest() {
    clearTimeout(sug.timer);
    if (sug.composing) return;                       // IME変換中は動かさない
    var q = els.searchInput.value.trim();
    if (!q) { closeSuggest(); return; }              // 1文字から検索する
    sug.timer = setTimeout(function () { fetchSuggest(q); }, 220);
  }

  function fetchSuggest(q) {
    var key = settings.lang + ' ' + q;
    if (sug.cache[key]) { openSuggest(sug.cache[key]); return; }
    var my = ++sug.seq;
    Marketable.load().then(function () {
      return XIVAPI.searchItems(q, settings.lang);
    }).then(function (rows) {
      if (my !== sug.seq) return;                    // 古い応答は捨てる
      rows = prepare(rows, q).slice(0, 12);
      cachePut(key, rows);
      if (els.searchInput.value.trim() === q) openSuggest(rows);
    }).catch(function () {
      if (my === sug.seq) closeSuggest();
    });
  }

  // ---------------------------------------------------------------- 検索
  var MAX_SHOWN = 40;   // 1回に価格を引く件数。多すぎると Universalis 側が重くなる

  function doSearch(q) {
    q = (q || '').trim();
    if (!q) return;
    closeSuggest();
    setMsg(els.searchMsg, '「' + q + '」を検索中…');
    busy(true);
    Marketable.load().then(function () {
      return XIVAPI.searchItems(q, settings.lang, true);
    }).then(function (rows) {
      var hits = prepare(rows, q);
      showResults(hits.slice(0, MAX_SHOWN), q, hits.length);
    }).catch(function (err) {
      showResults([], null, 0);
      setMsg(els.searchMsg, 'アイテム検索に失敗しました（' + ((err && err.message) || err) + '）', true);
    }).then(function () { busy(false); });
  }

  /** 検索結果を差し替えて価格を取りに行く。total は絞り込み後の総ヒット数 */
  function showResults(rows, q, total) {
    lastResults = rows || [];
    lastTotal = (total == null) ? lastResults.length : total;
    renderResults();
    if (!lastResults.length) {
      setMsg(els.searchMsg, q ? '「' + q + '」に一致する出品可能なアイテムはありません。' : '');
      return;
    }
    setMsg(els.searchMsg, '価格を取得中…');
    priceResults(false);
  }

  function priceResults(force) {
    if (!scope()) {
      renderResults();
      setMsg(els.searchMsg, '対象ワールド/DCを選択してください。', true);
      return;
    }
    var ids = lastResults.filter(function (r) { return !r.untradable; }).map(function (r) { return r.id; });
    if (!ids.length) { renderResults(); setMsg(els.searchMsg, ''); return; }
    var opts = {
      force: !!force,
      // 件数が多いと複数リクエストに割れるので進捗を出す
      onProgress: function (done, total) {
        if (total > 1) setMsg(els.searchMsg, '価格を取得中… ' + done + '/' + total);
      }
    };
    busy(true);
    Universalis.ensurePrices(scope(), ids, opts).then(function (res) {
      lastFetch = Date.now();
      renderResults();
      if (res.errors && res.errors.length) {
        setMsg(els.searchMsg, '一部の価格取得に失敗しました（' + res.errors[0] + '）', true);
      } else {
        var more = (lastTotal > lastResults.length)
          ? '（全 ' + lastTotal + ' 件中）' : '';
        setMsg(els.searchMsg, lastResults.length + ' 件' + more + ' ・ ' + scope());
      }
    }).then(function () { busy(false); }, function () { busy(false); });
  }

  function favIdSet() {
    var set = {};
    Store.getFavs().forEach(function (f) { set[f.id] = 1; });
    return set;
  }

  /** 検索結果 / 登録リストで共通のカード骨格 */
  function itemCard(item) {
    var rec = Store.getPrice(scope(), item.id);
    var card = document.createElement('div');
    card.className = 'card';
    card.appendChild(Icons.element(item.id, item.name));

    var meta = document.createElement('div');
    meta.className = 'meta';
    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = item.name;
    var sub = document.createElement('div');
    sub.className = 'sub';
    meta.appendChild(name);
    meta.appendChild(sub);
    card.appendChild(meta);

    card.appendChild(priceNode(rec));

    var ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    card.appendChild(ctrl);

    return { card: card, name: name, sub: sub, ctrl: ctrl, rec: rec };
  }

  function renderResults() {
    var favSet = favIdSet();
    els.searchResults.innerHTML = '';
    els.searchEmpty.hidden = lastResults.length > 0;
    els.clearBtn.hidden = lastResults.length === 0;

    lastResults.forEach(function (r) {
      var c = itemCard(r);
      var bits = [];
      if (r.untradable) bits.push('マーケット取引不可');
      else if (c.rec && c.rec.t) bits.push('価格 ' + relTime(c.rec.t));
      else bits.push('価格 取得中…');
      c.sub.textContent = bits.join(' ・ ');

      if (!r.untradable) {
        var btn = document.createElement('button');
        btn.type = 'button';
        if (favSet[r.id]) {
          btn.textContent = '登録済';
          btn.className = 'btn ghost';
          btn.disabled = true;
        } else {
          btn.textContent = '登録';
          btn.className = 'btn primary';
          btn.addEventListener('click', function () { addFav(r); });
        }
        c.ctrl.appendChild(btn);
      }
      els.searchResults.appendChild(c.card);
    });
  }

  // ---------------------------------------------------------------- 登録リスト
  function addFav(r) {
    var favs = Store.getFavs();
    if (favs.some(function (f) { return f.id === r.id; })) return;
    favs.push({
      id: r.id, name: r.name, icon: r.icon,
      untradable: !!r.untradable, threshold: null, q: 'any', added: Date.now()
    });
    Store.putFavs(favs);
    renderResults();
    renderFavs();
    if (scope()) {
      Universalis.ensurePrices(scope(), [r.id], { force: false }).then(function () {
        lastFetch = Date.now();
        renderFavs();
      });
    }
  }

  function removeFav(id) {
    Store.putFavs(Store.getFavs().filter(function (f) { return f.id !== id; }));
    renderResults();
    renderFavs();
  }

  function updateFav(id, patch) {
    Store.putFavs(Store.getFavs().map(function (f) {
      return f.id === id ? Object.assign({}, f, patch) : f;
    }));
  }

  function alertHit(fav, rec) {
    if (!rec || rec.untradable || fav.threshold == null) return false;
    var nq = rec.nq && rec.nq.min;
    var hq = rec.hq && rec.hq.min;
    var cand = [];
    if ((fav.q === 'nq' || fav.q === 'any') && nq != null) cand.push(nq);
    if ((fav.q === 'hq' || fav.q === 'any') && hq != null) cand.push(hq);
    if (!cand.length) return false;
    return Math.min.apply(null, cand) <= Number(fav.threshold);
  }

  // ---------------------------------------------------------------- 登録リストの絞り込み / 並び替え
  /** 登録リストの価格ソート用の値。未取得 / 取引不可は null（呼び出し側で末尾へ寄せる） */
  function priceForSort(fav, key) {
    var rec = Store.getPrice(scope(), fav.id);
    if (!rec || rec.untradable) return null;
    var side = key === 'hq' ? rec.hq : rec.nq;
    return (side && side.min != null) ? side.min : null;
  }

  /** 手元の favs を「絞り込み」「並び替え」した結果を返す（新規API検索は一切しない） */
  function visibleFavs() {
    var favs = Store.getFavs();
    var q = (els.favFilter.value || '').trim().toLowerCase();
    var list = q
      ? favs.filter(function (f) { return String(f.name).toLowerCase().indexOf(q) !== -1; })
      : favs.slice();

    var key = settings.favSort || 'added';
    var dir = settings.favSortDir === 'desc' ? -1 : 1;

    list.sort(function (a, b) {
      if (key === 'nq' || key === 'hq') {
        var pa = priceForSort(a, key), pb = priceForSort(b, key);
        // 価格未取得(null)は昇順・降順どちらでも常に末尾
        if (pa == null && pb != null) return 1;
        if (pb == null && pa != null) return -1;
        if (pa != null && pb != null && pa !== pb) return (pa - pb) * dir;
      } else if (key === 'name') {
        var rn = String(a.name).localeCompare(String(b.name), 'ja');
        if (rn !== 0) return rn * dir;
      } else { // 'added'
        var ra = (a.added || 0) - (b.added || 0);
        if (ra !== 0) return ra * dir;
      }
      return (a.added || 0) - (b.added || 0);   // タイブレーク（登録が古い順で安定化）
    });

    return { total: favs.length, list: list, filtering: !!q };
  }

  function updateSortDirBtn() {
    var desc = settings.favSortDir === 'desc';
    els.favSortDir.textContent = desc ? '↓ 降順' : '↑ 昇順';
    els.favSortDir.setAttribute('aria-label', desc ? '降順に並び替え' : '昇順に並び替え');
  }

  function renderFavs() {
    var vf = visibleFavs();
    if (vf.total === 0 && els.favFilter.value) {
      els.favFilter.value = '';      // 登録が空になったら絞り込み文字列も畳む
      vf = visibleFavs();
    }
    els.favEmpty.hidden = vf.total > 0;
    els.favToolbar.hidden = vf.total === 0;
    els.favNoMatch.hidden = !(vf.total > 0 && vf.list.length === 0);
    els.favShown.hidden = !vf.filtering;
    if (vf.filtering) els.favShown.textContent = vf.list.length + ' / ' + vf.total + ' 件';
    els.favList.innerHTML = '';

    vf.list.forEach(function (fav) {
      var c = itemCard(fav);
      var hit = alertHit(fav, c.rec);
      if (hit) {
        c.card.classList.add('alert');
        var badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = '閾値以下';
        c.name.appendChild(badge);
      }

      var bits = [];
      bits.push(c.rec && c.rec.t ? '更新 ' + relTime(c.rec.t) : '未取得');
      if (c.rec && c.rec.nq && c.rec.nq.med != null) bits.push('NQ中央値 ' + gil(c.rec.nq.med));
      if (c.rec && c.rec.hq && c.rec.hq.med != null) bits.push('HQ中央値 ' + gil(c.rec.hq.med));
      c.sub.textContent = bits.join(' ・ ');

      // 強調の対象品質
      var qsel = document.createElement('select');
      [['any', 'NQ/HQ'], ['nq', 'NQ'], ['hq', 'HQ']].forEach(function (o) {
        qsel.appendChild(opt(o[0], o[1]));
      });
      qsel.value = fav.q || 'any';
      qsel.title = '強調表示の対象品質';
      qsel.addEventListener('change', function () {
        updateFav(fav.id, { q: qsel.value });
        renderFavs();
      });

      // 閾値
      var thr = document.createElement('input');
      thr.type = 'number';
      thr.className = 'thr';
      thr.min = '0';
      thr.placeholder = '閾値';
      thr.title = 'この価格以下になったらカードを強調';
      thr.value = fav.threshold == null ? '' : fav.threshold;
      thr.addEventListener('change', function () {
        var v = thr.value === '' ? null : Math.max(0, parseInt(thr.value, 10) || 0);
        updateFav(fav.id, { threshold: v });
        renderFavs();
      });

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn ghost danger';
      del.textContent = '解除';
      del.addEventListener('click', function () { removeFav(fav.id); });

      c.ctrl.appendChild(qsel);
      c.ctrl.appendChild(thr);
      c.ctrl.appendChild(del);
      els.favList.appendChild(c.card);
    });
  }

  function refreshFavs(force) {
    var favs = Store.getFavs();
    renderFavs();
    if (!favs.length) { setMsg(els.favMsg, ''); return; }
    if (!scope()) { setMsg(els.favMsg, '対象ワールド/DCを選択してください。', true); return; }

    setMsg(els.favMsg, '価格を更新中…');
    Universalis.ensurePrices(scope(), favs.map(function (f) { return f.id; }), { force: !!force })
      .then(function (res) {
        lastFetch = Date.now();
        renderFavs();
        if (res.errors && res.errors.length) {
          setMsg(els.favMsg, '一部の取得に失敗しました（' + res.errors[0] + '）', true);
        } else {
          setMsg(els.favMsg, scope() + ' ・ 最終更新 ' + new Date().toLocaleTimeString('ja-JP'));
        }
      });
  }

  // ---------------------------------------------------------------- 自動更新
  function applyAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (!settings.autoRefresh) return;
    var every = Math.max(AUTO_MIN, settings.autoInterval || AUTO_MIN);
    autoTimer = setInterval(function () {
      if (document.hidden) return;                     // 非表示タブでは叩かない
      if (Date.now() - lastFetch < 60000) return;      // 直近1分以内なら間引く
      if (!Store.getFavs().length || !scope()) return;
      refreshFavs(true);
    }, every);
  }

  // ---------------------------------------------------------------- 配線
  els.searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    doSearch(els.searchInput.value);
  });

  els.searchInput.addEventListener('input', queueSuggest);
  els.searchInput.addEventListener('compositionstart', function () { sug.composing = true; });
  els.searchInput.addEventListener('compositionend', function () {
    sug.composing = false;
    queueSuggest();
  });
  els.searchInput.addEventListener('focus', function () {
    if (!sug.open && els.searchInput.value.trim()) queueSuggest();
  });
  els.searchInput.addEventListener('blur', function () {
    setTimeout(closeSuggest, 120);   // 候補クリックを拾ってから閉じる
  });
  els.searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
    else if (e.key === 'Escape') { if (sug.open) { e.preventDefault(); closeSuggest(); } }
    else if (e.key === 'Enter') {
      if (e.isComposing || sug.composing) return;      // IME確定のEnterは無視
      if (sug.open && sug.sel >= 0) { e.preventDefault(); pickSuggest(sug.sel); }
    }
  });

  els.clearBtn.addEventListener('click', function () {
    els.searchInput.value = '';
    closeSuggest();
    showResults([]);
    setMsg(els.searchMsg, '');
    els.searchInput.focus();
  });

  els.scopeType.addEventListener('change', function () {
    settings.scopeType = els.scopeType.value;
    saveSettings();
    populateScopeOptions();
    onScopeChanged();
  });

  // scopeName は取得失敗時に <input> へ差し替わるのでイベント委譲で拾う
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'scopeName') {
      settings.scopeName = (e.target.value || '').trim();
      saveSettings();
      onScopeChanged();
    }
  });

  els.lang.addEventListener('change', function () {
    settings.lang = els.lang.value;
    saveSettings();
    sug.cache = {}; sug.cacheKeys = [];
    closeSuggest();
  });
  els.autoRefresh.addEventListener('change', function () {
    settings.autoRefresh = els.autoRefresh.checked;
    saveSettings();
    applyAuto();
  });
  els.autoInterval.addEventListener('change', function () {
    settings.autoInterval = parseInt(els.autoInterval.value, 10) || 600000;
    saveSettings();
    applyAuto();
  });
  els.refreshBtn.addEventListener('click', function () { refreshFavs(true); });

  // 登録リストの絞り込み: 入力のたびに手元の favs を再描画するだけ（API は叩かない）
  els.favFilter.addEventListener('input', renderFavs);
  els.favFilter.addEventListener('search', renderFavs);   // ネイティブのクリアボタン対応
  els.favSort.addEventListener('change', function () {
    settings.favSort = els.favSort.value;
    saveSettings();
    renderFavs();
  });
  els.favSortDir.addEventListener('click', function () {
    settings.favSortDir = (settings.favSortDir === 'desc') ? 'asc' : 'desc';
    saveSettings();
    updateSortDirBtn();
    renderFavs();
  });

  // ---------------------------------------------------------------- init
  /* ハブに載っているのでタブが開かれるまで走らせない（eager:false）。
     出品可能アイテム一覧（約16,800件）とワールド一覧の取得が入るため。
     イベント登録だけは上で済ませてある（要素はページ読み込み時から DOM にある）。 */
  function init() {
    els.scopeType.value = settings.scopeType;
    els.lang.value = settings.lang;
    els.autoRefresh.checked = !!settings.autoRefresh;
    els.autoInterval.value = String(settings.autoInterval || 600000);
    els.favSort.value = settings.favSort || 'added';
    updateSortDirBtn();

    /* 登録済みアイテムは icon（URL）を持っているので、共通キャッシュへ先に流し込む。
       単体版から引き継いだ ff14watch.v1.favs もこれで無駄な取り直しが起きない。 */
    Store.getFavs().forEach(function (f) {
      if (f && f.id && f.icon) Icons.prime(f.id, f.icon);
    });

    renderResults();
    renderFavs();
    applyAuto();

    // 出品可能アイテム一覧を先に温めておく（検索時の待ちを無くす。失敗しても検索は動く）
    Marketable.load();

    // 単体版のショートカット（?q=キーワード）で来た場合はその語で検索する。
    // 価格は scope 確定後（loadWorlds → onScopeChanged）に priceResults で補完される。
    var initialQ = null;
    try { initialQ = (new URLSearchParams(location.search).get('q') || '').trim(); } catch (e) {}
    if (initialQ) {
      els.searchInput.value = initialQ;
      doSearch(initialQ);
    }

    loadWorlds();
  }

  if (FF14.core && FF14.core.Tabs) {
    FF14.core.Tabs.register('watch', {
      eager: false,
      init: init,
      onShow: function () { try { els.searchInput.focus(); } catch (e) {} }
    });
  } else {
    init();
  }
})();
