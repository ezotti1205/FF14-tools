/* ===== 永続化（localStorage） =====
   旧実装 ff14-ledger（ff14ledger.v1.*）とはキーが完全に別なので干渉しません。 */
var Store = (function () {
  'use strict';

  var KEY_REC = 'ff14assets.v1.records';
  var KEY_SET = 'ff14assets.v1.settings';
  var KEY_CALC = 'ff14assets.v1.calcdraft';

  var DEFAULT_SETTINGS = { period: 'month', tableLimit: 30 };
  var PERIOD_KEYS = ['week', 'month', 'year', 'all'];
  var LIMITS = [30, 100, 0];

  var state = { records: [], settings: null };

  /* ---- 低レベル ---- */
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return (v === null || v === undefined) ? fallback : v;
    } catch (e) {
      console.warn('読み込み失敗:', key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('保存失敗:', key, e);
      return false;
    }
  }

  /* ---- 正規化 ---- */
  function normalize(r) {
    if (!r || typeof r !== 'object') return null;

    var date = null;
    if (typeof r.date === 'string') {
      var s = r.date.trim();
      if (/^\d{4}-\d{2}-\d{2}T/.test(s)) s = s.slice(0, 10); /* ISO日時も受け付ける */
      s = s.replace(/\//g, '-');
      if (U.isValidDate(s)) date = s;
    }
    if (!date) return null;

    var amount = U.parseAmount(r.amount);
    if (amount === null) return null;

    var createdAt = null;
    if (typeof r.createdAt === 'string') {
      var d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) createdAt = d.toISOString();
    }

    return {
      id: (typeof r.id === 'string' && r.id) ? r.id : U.uid(),
      date: date,
      amount: amount,
      memo: String(r.memo === null || r.memo === undefined ? '' : r.memo).slice(0, 300),
      createdAt: createdAt || new Date().toISOString()
    };
  }

  /* 日付昇順、同日は登録順 */
  function cmp(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return 0;
  }
  function sortAll() { state.records.sort(cmp); }

  function normalizeSettings(s) {
    var out = { period: DEFAULT_SETTINGS.period, tableLimit: DEFAULT_SETTINGS.tableLimit };
    if (s && typeof s === 'object') {
      if (PERIOD_KEYS.indexOf(s.period) >= 0) out.period = s.period;
      var n = Math.round(Number(s.tableLimit));
      if (LIMITS.indexOf(n) >= 0) out.tableLimit = n;
    }
    return out;
  }

  /* ---- 初期化 ---- */
  function init() {
    state.settings = normalizeSettings(readJSON(KEY_SET, null));
    var raw = readJSON(KEY_REC, []);
    var recs = [];
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i++) {
        var n = normalize(raw[i]);
        if (n) recs.push(n);
      }
    }
    state.records = recs;
    sortAll();
  }

  function persist() { return writeJSON(KEY_REC, state.records); }

  /* ---- 参照 ---- */
  function all() { return state.records; }

  function get(id) {
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].id === id) return state.records[i];
    }
    return null;
  }

  function byDate(date) {
    return state.records.filter(function (r) { return r.date === date; });
  }

  /* 最新の記録（= 現在の総資産） */
  function latest() {
    return state.records.length ? state.records[state.records.length - 1] : null;
  }

  /* 指定日より前の直近の記録（前回比のベース） */
  function lastBefore(date) {
    var found = null;
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].date < date) found = state.records[i];
      else break;
    }
    return found;
  }

  /* ---- 更新 ---- */
  function add(data) {
    var r = normalize(data);
    if (!r) return null;
    r.id = U.uid();

    /* 同じ日に既存の記録があれば、必ずその後ろに並ぶようにする。
       「あとから入れ直したものがその日の最新」を保証するため
       （インポートしたデータの createdAt が未来を指していても壊れない）。 */
    var maxT = 0;
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].date !== r.date) continue;
      var t = Date.parse(state.records[i].createdAt);
      if (isFinite(t) && t > maxT) maxT = t;
    }
    var mine = Date.parse(r.createdAt);
    if (!isFinite(mine)) mine = Date.now();
    if (maxT >= mine) r.createdAt = new Date(maxT + 1).toISOString();

    state.records.push(r);
    sortAll();
    persist();
    return r;
  }

  /* その日の記録をすべて消してから1件だけ入れ直す（上書き） */
  function replaceDate(date, data) {
    state.records = state.records.filter(function (r) { return r.date !== date; });
    return add(data);
  }

  function update(id, data) {
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].id === id) {
        var merged = normalize({
          id: id,
          date: data.date,
          amount: data.amount,
          memo: data.memo,
          createdAt: state.records[i].createdAt
        });
        if (!merged) return null;
        state.records[i] = merged;
        sortAll();
        persist();
        return merged;
      }
    }
    return null;
  }

  function remove(id) {
    var before = state.records.length;
    state.records = state.records.filter(function (r) { return r.id !== id; });
    if (state.records.length !== before) { persist(); return true; }
    return false;
  }

  function replaceAll(records) {
    var out = [];
    for (var i = 0; i < records.length; i++) {
      var n = normalize(records[i]);
      if (n) out.push(n);
    }
    state.records = out;
    sortAll();
    persist();
  }

  function clearAll() {
    state.records = [];
    persist();
  }

  /* ---- 設定 ---- */
  function settings() { return state.settings; }
  function saveSettings(patch) {
    state.settings = normalizeSettings(Object.assign({}, state.settings, patch));
    writeJSON(KEY_SET, state.settings);
    return state.settings;
  }

  /* ---- 電卓の下書き（手持ち・リテイナー・倉庫などの内訳） ----
     記録そのものではないので records/settings とは別キーに保存する。 */
  function normalizeCalcRows(rows) {
    if (!Array.isArray(rows)) return [];
    var out = [];
    for (var i = 0; i < rows.length && out.length < 50; i++) {
      var r = rows[i];
      if (!r || typeof r !== 'object') continue;
      out.push({
        label: String(r.label === null || r.label === undefined ? '' : r.label).slice(0, 60),
        amount: String(r.amount === null || r.amount === undefined ? '' : r.amount).slice(0, 40)
      });
    }
    return out;
  }
  function calcDraft() { return normalizeCalcRows(readJSON(KEY_CALC, [])); }
  function saveCalcDraft(rows) { writeJSON(KEY_CALC, normalizeCalcRows(rows)); }

  /* ---- エクスポート / インポート ---- */
  function exportObject() {
    return {
      app: 'ff14-assets',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: state.records.length,
      records: state.records.map(function (r) {
        return { date: r.date, amount: r.amount, memo: r.memo, id: r.id, createdAt: r.createdAt };
      })
    };
  }

  /* 戻り値: {ok, error, records, skipped} */
  function parseImport(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'JSONとして読み取れませんでした。' };
    }
    var raw = null;
    if (Array.isArray(data)) raw = data;                              /* 配列だけでも受け付ける */
    else if (data && Array.isArray(data.records)) raw = data.records;
    if (!raw) return { ok: false, error: 'records が見つかりません。' };

    var recs = [], skipped = 0;
    for (var i = 0; i < raw.length; i++) {
      var n = normalize(raw[i]);
      if (n) recs.push(n); else skipped++;
    }
    if (!recs.length) return { ok: false, error: '取り込める記録が1件もありませんでした。' };
    recs.sort(cmp);
    return { ok: true, records: recs, skipped: skipped };
  }

  /* mode: 'replace' | 'merge' */
  function applyImport(parsed, mode) {
    if (mode === 'replace') {
      state.records = parsed.records.slice();
      sortAll();
      persist();
      return { added: parsed.records.length, duplicated: 0 };
    }
    var seenId = {}, seenKey = {};
    state.records.forEach(function (r) {
      seenId[r.id] = true;
      seenKey[r.date + '|' + r.amount + '|' + r.memo] = true;
    });
    var added = 0, dup = 0;
    parsed.records.forEach(function (r) {
      var k = r.date + '|' + r.amount + '|' + r.memo;
      if (seenId[r.id] || seenKey[k]) { dup++; return; }
      state.records.push(r);
      seenId[r.id] = true;
      seenKey[k] = true;
      added++;
    });
    sortAll();
    persist();
    return { added: added, duplicated: dup };
  }

  function usageBytes() {
    var total = 0;
    [KEY_REC, KEY_SET, KEY_CALC].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v) total += v.length;
    });
    return total;
  }

  return {
    KEY_REC: KEY_REC, KEY_SET: KEY_SET, KEY_CALC: KEY_CALC,
    init: init, all: all, get: get, byDate: byDate, latest: latest, lastBefore: lastBefore,
    add: add, replaceDate: replaceDate, update: update, remove: remove,
    replaceAll: replaceAll, clearAll: clearAll,
    settings: settings, saveSettings: saveSettings,
    calcDraft: calcDraft, saveCalcDraft: saveCalcDraft,
    exportObject: exportObject, parseImport: parseImport, applyImport: applyImport,
    usageBytes: usageBytes
  };
})();
