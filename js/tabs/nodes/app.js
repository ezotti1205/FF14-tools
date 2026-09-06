/* ===== タブ「ノード」: 時間限定ノードのカウントダウン =====
   元 ff14-gather-timer/index.html のインラインスクリプトを、そのままモジュール化したものです。
   変更点は3つだけ:
     ・ET/現実時刻の表示は共通のタブバー（js/core/clock.js）へ移したので、ここでは更新しない
     ・通知は FF14.core.Hub.notify() 経由（一括ON/OFFとラベル付けのため）
     ・起動処理を init() にまとめ、タブ登録時に呼ばれるようにした
   カウントダウンと通知判定は setInterval で回り続けるので、他のタブを見ている間も止まりません。 */
FF14.nodes.App = (function () {
  'use strict';
  var E = window.Eorzea;
  var $ = function (s) { return document.querySelector(s); };
  var LEVEL_BANDS = ['1-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'];

  // ---------- 設定ストア (localStorage) ----------
  var KEY = 'ff14-gather-timer/v1';
  var DEFAULTS = {
    leadMinutes: 5, showFavoritesOnly: false,
    filterJob: 'ALL', filterLevel: 'ALL', filterPtype: 'ALL', search: '',
    favorites: {}, notify: {},
  };
  // exdreams から取り込んだノード一覧（localStorage）。あれば data/nodes.js より優先。
  var NODES_KEY = 'ff14-gather-timer/nodes/v1';
  var state = loadState();
  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('設定の保存に失敗しました', e); }
  }
  function update(patch) { state = Object.assign({}, state, patch); persist(); }
  function toggleKey(mapName, id) {
    var m = Object.assign({}, state[mapName]);
    if (m[id]) delete m[id]; else m[id] = true;
    var p = {}; p[mapName] = m; update(p);
  }
  function exportJson() {
    return JSON.stringify({ type: 'ff14-gather-timer/settings', version: 1, state: state }, null, 2);
  }
  function importJson(text) {
    try {
      var parsed = JSON.parse(text);
      var incoming = (parsed && parsed.state) ? parsed.state : parsed;
      if (typeof incoming !== 'object' || incoming === null) throw new Error('形式が不正です');
      state = Object.assign({}, DEFAULTS, incoming);
      persist();
      return { ok: true };
    } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  }

  // ---------- ブラウザ通知 ----------
  // 送信は FF14.core.Hub.notify() 経由。タイトルに [ノード] が付き、
  // 設定タブの「通知を一括で止める」でまとめてOFFにできます。
  var fired = {};
  function notifSupported() { return FF14.core.Hub.notifySupported(); }
  function notifPermission() { return FF14.core.Hub.notifyPermission(); }
  function requestNotif() { return FF14.core.Hub.requestNotifyPermission(); }
  function maybeNotify(node, occ, leadMs, nowMs) {
    if (!occ || occ.active) return;
    if (notifPermission() !== 'granted') return;
    if (!FF14.core.Hub.get().notifyEnabled) return;
    var untilStart = occ.startsAt - nowMs;
    if (untilStart > leadMs || untilStart < 0) return;
    var key = node.id + '@' + Math.round(occ.startsAt);
    if (fired[key]) return;
    fired[key] = true;
    for (var k in fired) {
      var ts = Number(k.split('@')[1]);
      if (isFinite(ts) && ts < nowMs - 3600000) delete fired[k];
    }
    var mins = Math.max(1, Math.round(untilStart / 60000));
    FF14.core.Hub.notify('ノード', 'まもなく出現: ' + node.name, {
      body: '約' + mins + '分後 / ' + node.zone + ' ' + node.coords
        + (node.aetheryte ? '\n最寄り: ' + node.aetheryte : ''),
      tag: node.id,
    });
  }

  // ---------- ノードデータ ----------
  var NODES = [];
  var rowEls = {};

  function validate(n, i) {
    var ok = n && typeof n.id === 'string' && Array.isArray(n.spawns);
    if (!ok) console.warn('nodes: ' + i + '件目の形式が不正です', n);
    return ok;
  }

  // 同一エリア内で座標がいちばん近いエーテライトを選ぶ（exdreams の getNearestAetheryte と同じ考え方）
  function nearestAetheryte(zone, coords, aeList) {
    if (!Array.isArray(aeList)) return '';
    var m = /X:([\d.]+)\s*Y:([\d.]+)/.exec(coords || '');
    var x = m ? Number(m[1]) : 0, y = m ? Number(m[2]) : 0;
    var cand = aeList.filter(function (a) {
      return a.pointM === zone || (zone === '低地ドラヴァニア' && a.pointM === 'イディルシャイア');
    });
    var best = '', bd = Infinity;
    cand.forEach(function (a) {
      var d = Math.pow(x - a.x, 2) + Math.pow(y - a.y, 2);
      if (d < bd) { bd = d; best = a.name; }
    });
    return best;
  }

  // exdreams.net の gt_point.js (window.pointData) をこのアプリのノード形式へ変換
  // aeList は define.js の aetheryteList（無ければ aetheryte は空）
  function gtConvert(pointData, aeList) {
    function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
    var KEEP = { '刻限': 1, '未知': 1, '伝説': 1 };
    var map = {};
    for (var i = 0; i < pointData.length; i++) {
      var p = pointData[i];
      if (!KEEP[p.ptype]) continue;
      var key = [p.type, p.pointL, p.pointM, p.pointS, p.mainItem].join('|');
      (map[key] = map[key] || []).push(p);
    }
    var nodes = [];
    Object.keys(map).forEach(function (key) {
      var arr = map[key], p0 = arr[0], seen = {}, spawns = [], itemSet = {};
      arr.forEach(function (p) {
        var s = { startET: Number(p.timeFrom.split(':')[0]), durationET: Number(p.timeLimit) };
        var k = s.startET + '/' + s.durationET;
        if (!seen[k]) { seen[k] = 1; spawns.push(s); }
        (p.items || []).concat(p.hiddens || []).forEach(function (it) { if (it && it !== '-') itemSet[it] = 1; });
      });
      spawns.sort(function (a, b) { return a.startET - b.startET; });
      var coords = 'X:' + p0.mapX + ' Y:' + p0.mapY;
      nodes.push({
        id: 'gt-' + hash(key), name: p0.mainItem, job: p0.type === '園芸師' ? 'BTN' : 'MIN',
        level: Number(p0.lv), zone: p0.pointM, coords: coords,
        aetheryte: nearestAetheryte(p0.pointM, coords, aeList),
        spawns: spawns, ptype: p0.ptype, patch: p0.patch, subNode: p0.pointS,
        items: Object.keys(itemSet), note: '',
      });
    });
    nodes.sort(function (a, b) {
      return a.job.localeCompare(b.job) || a.level - b.level || a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name);
    });
    return nodes;
  }

  // ノード一覧をロード: localStorage（取り込み済み）> data/nodes.js
  function loadNodeList() {
    try {
      var saved = JSON.parse(localStorage.getItem(NODES_KEY) || 'null');
      if (saved && Array.isArray(saved.nodes) && saved.nodes.length) {
        return { nodes: saved.nodes.filter(validate), meta: saved.meta || null, from: 'localStorage' };
      }
    } catch (e) { /* fallthrough */ }
    var raw = Array.isArray(window.FF14_NODES) ? window.FF14_NODES : [];
    return { nodes: raw.filter(validate), meta: window.FF14_NODES_META || null, from: 'file' };
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') < 0 ? '?' : '&') + Date.now();
      s.onload = res;
      s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function updateFromExdreams() {
    var btn = $('#update-data');
    btn.disabled = true; btn.textContent = '取得中…';
    var BASE = 'https://ffxiv.gt.exdreams.net/js/';
    // define.js（aetheryteList）→ gt_point.js（pointData）の順に読み込む
    Promise.resolve()
      .then(function () { return loadScript(BASE + 'define.js'); })
      .then(function () { return loadScript(BASE + 'gt_point.js'); })
      .then(function () {
      try {
        if (!Array.isArray(window.pointData)) throw new Error('pointData が取得できませんでした');
        var nodes = gtConvert(window.pointData, window.aetheryteList);
        if (!nodes.length) throw new Error('変換結果が空です');
        var meta = { source: 'https://ffxiv.gt.exdreams.net', importedAt: new Date().toISOString().slice(0, 10), count: nodes.length };
        localStorage.setItem(NODES_KEY, JSON.stringify({ nodes: nodes, meta: meta }));
        NODES = nodes;
        renderDataInfo(meta, 'localStorage');
        renderList();
        btn.textContent = '更新しました（' + nodes.length + '件）';
      } catch (e) {
        alert('更新に失敗しました: ' + ((e && e.message) || e));
        btn.textContent = 'exdreamsから更新';
      }
      btn.disabled = false;
    })
      .catch(function () {
        alert('exdreams.net からデータを取得できませんでした（ネットワーク/接続をご確認ください）。');
        btn.textContent = 'exdreamsから更新'; btn.disabled = false;
      });
  }

  function renderDataInfo(meta, from) {
    var el = $('#data-info');
    $('#reset-data').hidden = (from !== 'localStorage');
    if (!meta) { el.textContent = ''; return; }
    el.textContent = 'ノード: ' + (meta.count || NODES.length) + '件 / 取込 ' + (meta.importedAt || '-')
      + (from === 'localStorage' ? '（更新済み）' : '（同梱）');
  }

  function resetNodeData() {
    localStorage.removeItem(NODES_KEY);
    location.reload();
  }

  // ---------- UI 構築 ----------
  function buildFilters() {
    var sel = $('#filter-level');
    LEVEL_BANDS.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b; o.textContent = 'Lv ' + b;
      sel.appendChild(o);
    });
  }

  function bindControls() {
    $('#filter-job').value = state.filterJob;
    $('#filter-level').value = state.filterLevel;
    $('#filter-ptype').value = state.filterPtype;
    $('#search').value = state.search;
    $('#fav-only').checked = state.showFavoritesOnly;
    $('#lead-minutes').value = state.leadMinutes;

    $('#filter-job').addEventListener('change', function (e) { update({ filterJob: e.target.value }); renderList(); });
    $('#filter-level').addEventListener('change', function (e) { update({ filterLevel: e.target.value }); renderList(); });
    $('#filter-ptype').addEventListener('change', function (e) { update({ filterPtype: e.target.value }); renderList(); });
    $('#search').addEventListener('input', function (e) { update({ search: e.target.value }); renderList(); });
    $('#fav-only').addEventListener('change', function (e) { update({ showFavoritesOnly: e.target.checked }); renderList(); });
    $('#lead-minutes').addEventListener('change', function (e) {
      var v = Math.max(0, Math.min(60, Number(e.target.value) || 0));
      e.target.value = v; update({ leadMinutes: v });
    });
    $('#enable-notif').addEventListener('click', function () { requestNotif().then(refreshPermissionUi); });
    $('#update-data').addEventListener('click', function () {
      if (confirm('exdreams.net (ffxiv.gt.exdreams.net) の公開データからノード一覧を取得して更新します。よろしいですか？')) updateFromExdreams();
    });
    $('#reset-data').addEventListener('click', function () {
      if (confirm('取り込んだノード一覧を破棄して、同梱の data/nodes.js に戻します。よろしいですか？')) resetNodeData();
    });
    /* エクスポート/インポートは「設定」タブの js/core/backup.js に集約したので、
       ここでは配線しない（exportJson / importJson は下の返り値から使う） */
  }

  function refreshPermissionUi() {
    var btn = $('#enable-notif');
    var p = notifPermission();
    if (!notifSupported()) { btn.textContent = '通知: 非対応ブラウザ'; btn.disabled = true; return; }
    if (p === 'granted') { btn.textContent = '通知: 許可済み'; btn.disabled = true; }
    else if (p === 'denied') { btn.textContent = '通知: ブロック中（ブラウザ設定で許可）'; btn.disabled = true; }
    else { btn.textContent = 'ブラウザ通知を有効にする'; btn.disabled = false; }
  }

  function inBand(level, band) {
    if (band === 'ALL') return true;
    var parts = band.split('-'); return level >= Number(parts[0]) && level <= Number(parts[1]);
  }

  function filteredNodes() {
    var q = state.search.trim().toLowerCase();
    return NODES.filter(function (n) {
      if (state.filterJob !== 'ALL' && n.job !== state.filterJob) return false;
      if (!inBand(n.level, state.filterLevel)) return false;
      if (state.filterPtype !== 'ALL' && n.ptype !== state.filterPtype) return false;
      if (state.showFavoritesOnly && !state.favorites[n.id]) return false;
      if (q) {
        var hay = (n.name + ' ' + n.zone + ' ' + (n.subNode || '') + ' ' + n.aetheryte + ' '
          + (n.ptype || '') + ' ' + (n.note || '') + ' ' + ((n.items || []).join(' '))).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderList() {
    var list = $('#list');
    list.innerHTML = '';
    rowEls = {};
    var nodes = filteredNodes();
    $('#count').textContent = nodes.length + ' 件';
    if (!nodes.length) { list.innerHTML = '<p class="empty">条件に一致するノードがありません。</p>'; return; }

    nodes.forEach(function (n) {
      var root = document.createElement('div');
      root.className = 'row';
      root.dataset.id = n.id;
      var fav = state.favorites[n.id] ? '★' : '☆';
      var notifyOn = !!state.notify[n.id];
      root.innerHTML =
        '<button class="star" title="お気に入り">' + fav + '</button>' +
        '<div class="main">' +
          '<div class="line1">' +
            '<span class="job job-' + n.job + '">' + (n.job === 'BTN' ? '園芸' : '採掘') + '</span>' +
            '<span class="lv">Lv' + n.level + '</span>' +
            (n.ptype ? '<span class="ptype">' + escapeHtml(n.ptype) + '</span>' : '') +
            '<span class="name">' + escapeHtml(n.name) + '</span>' +
          '</div>' +
          '<div class="line2">' +
            '<span class="zone">' + escapeHtml(n.zone) + '</span>' +
            (n.aetheryte ? '<span class="aeth">' + escapeHtml(n.aetheryte) + '</span>' : '') +
            '<span class="loc-coords">' + escapeHtml(n.coords || '') + '</span>' +
            (n.subNode ? '<span class="subnode">' + escapeHtml(n.subNode) + '</span>' : '') +
          '</div>' +
          (n.items && n.items.length ? '<div class="note">' + escapeHtml(n.items.join('、')) + '</div>' : '') +
          (n.note ? '<div class="note">' + escapeHtml(n.note) + '</div>' : '') +
        '</div>' +
        '<div class="right">' +
          '<div class="status">—</div>' +
          '<label class="bell" title="このノードの通知">' +
            '<input type="checkbox"' + (notifyOn ? ' checked' : '') + '> 通知</label>' +
        '</div>';
      root.querySelector('.star').addEventListener('click', function () {
        toggleKey('favorites', n.id); renderList();
      });
      root.querySelector('.bell input').addEventListener('change', function () {
        toggleKey('notify', n.id);
      });
      list.appendChild(root);
      rowEls[n.id] = { root: root, status: root.querySelector('.status') };
    });
    tick();
  }

  function tick() {
    var now = Date.now();

    var leadMs = state.leadMinutes * 60 * 1000;
    var order = [];
    NODES.forEach(function (n) {
      var occ = E.nextNodeOccurrence(n.spawns, now);
      var entry = rowEls[n.id];
      if (state.notify[n.id]) maybeNotify(n, occ, leadMs, now);
      if (!entry) return;
      if (occ && occ.active) {
        var left = occ.endsAt - now;
        entry.status.textContent = '出現中 あと ' + E.formatCountdown(left);
        entry.root.classList.add('active');
        entry.root.classList.toggle('ending', left <= 60000);
        entry.root.classList.remove('soon');
        order.push({ id: n.id, active: true, sortKey: occ.endsAt });
      } else if (occ) {
        var until = occ.startsAt - now;
        entry.status.textContent = '次の出現まで ' + E.formatCountdown(until);
        entry.root.classList.remove('active');
        entry.root.classList.remove('ending');
        entry.root.classList.toggle('soon', until <= leadMs);
        order.push({ id: n.id, active: false, sortKey: occ.startsAt });
      }
    });

    order.sort(function (a, b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.sortKey - b.sortKey;
    });
    var list = $('#list');
    order.forEach(function (o) {
      var entry = rowEls[o.id];
      if (entry) list.appendChild(entry.root);
    });
  }

  // ---------- 起動 ----------
  var timer = null;

  function init() {
    buildFilters();
    bindControls();
    refreshPermissionUi();

    var loaded = loadNodeList();
    NODES = loaded.nodes;
    renderDataInfo(loaded.meta, loaded.from);
    if (!NODES.length) {
      var banner = $('#data-banner');
      banner.hidden = false;
      banner.textContent = 'ノードデータを読み込めませんでした。data/nodes.js の配置と書式を確認するか、「exdreamsから更新」を押してください。';
    }
    renderList();
    tick();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);

    /* 裏に回っている間はブラウザがタイマーを間引くので、戻ってきたら即座に計算し直す */
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    FF14.core.Tabs.onShow(function (id) { if (id === 'nodes') tick(); });
  }

  return {
    init: init,
    tick: tick,
    /* 設定タブから使うAPI */
    getLeadMinutes: function () { return state.leadMinutes; },
    setLeadMinutes: function (v) {
      v = Math.max(0, Math.min(60, Number(v) || 0));
      update({ leadMinutes: v });
      var input = $('#lead-minutes');
      if (input) input.value = v;
      return v;
    },
    nodeCount: function () { return NODES.length; },
    notifyCount: function () { return Object.keys(state.notify || {}).length; },
    favoriteCount: function () { return Object.keys(state.favorites || {}).length; },
    updateFromExdreams: updateFromExdreams,
    resetNodeData: resetNodeData,
    exportObject: function () { return JSON.parse(exportJson()); },
    importObject: function (obj) {
      var res = importJson(JSON.stringify(obj));
      if (res.ok) { bindControls(); renderList(); }
      return res;
    }
  };
})();

FF14.core.Tabs.register('nodes', {
  /* 裏でもカウントダウン・通知判定を続けたいので eager */
  eager: true,
  init: FF14.nodes.App.init
});
