/* store.js — localStorage 永続化。キーは必ず ff14watch.v1.* 。
 *
 *   ff14watch.v1.prices    { "<scope>": { "<itemId>": <distilled> } }   価格キャッシュ（15分TTLは呼び出し側）
 *   ff14watch.v1.worlds    { t, data:{ worlds, dcs } }                  ワールド/DC一覧（7日キャッシュ）
 *   ff14watch.v1.favs      [ { id, name, icon, level, untradable, threshold, q, added } ]
 *   ff14watch.v1.settings   { scopeType, scopeName, lang, autoRefresh, autoInterval, favSort, favSortDir, homeClass }
 *   ff14watch.v1.marketable { t, ids:[itemId] }                       出品可能アイテムID一覧（7日キャッシュ）
 *
 * universalis.js が期待するインターフェイス（getFreshPrice / putPrice / getWorlds / putWorlds）を
 * 元の FF14.craft.Store と同じ形で実装している。 */
(function () {
  'use strict';

  var NS = 'ff14watch.v1.';
  var K_PRICES   = NS + 'prices';
  var K_WORLDS   = NS + 'worlds';
  var K_FAVS     = NS + 'favs';
  var K_SETTINGS = NS + 'settings';
  var K_MARKET   = NS + 'marketable';

  var PRICE_MAX_AGE = 24 * 3600 * 1000;   // 24時間より古い価格は読み込み時に捨てる

  function readJSON(key, fallback) {
    try {
      var s = localStorage.getItem(key);
      return s ? JSON.parse(s) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  // 価格はまとめて1キーに入れ、メモリにキャッシュしてから書き戻す
  var priceCache = null;
  function prices() {
    if (priceCache) return priceCache;
    priceCache = readJSON(K_PRICES, {}) || {};
    var cutoff = Date.now() - PRICE_MAX_AGE;
    Object.keys(priceCache).forEach(function (sc) {
      var m = priceCache[sc] || {};
      Object.keys(m).forEach(function (id) {
        if (!m[id] || (m[id].t || 0) < cutoff) delete m[id];
      });
      if (!Object.keys(m).length) delete priceCache[sc];
    });
    return priceCache;
  }
  function flushPrices() { writeJSON(K_PRICES, priceCache || {}); }

  var Store = {
    /* ---- universalis.js が使う ---- */
    getFreshPrice: function (scope, id, ttl) {
      var m = prices()[scope];
      var rec = m && m[id];
      if (!rec) return null;
      if (ttl && (Date.now() - (rec.t || 0)) > ttl) return null;
      return rec;
    },
    putPrice: function (scope, id, rec) {
      var all = prices();
      if (!all[scope]) all[scope] = {};
      all[scope][id] = rec;
      flushPrices();
    },
    getWorlds: function () { return readJSON(K_WORLDS, null); },
    putWorlds: function (data) { writeJSON(K_WORLDS, { t: Date.now(), data: data }); },

    /* ---- このツール用 ---- */
    getPrice: function (scope, id) {
      var m = prices()[scope];
      return (m && m[id]) || null;
    },
    getFavs:     function () { return readJSON(K_FAVS, []) || []; },
    putFavs:     function (list) { writeJSON(K_FAVS, list || []); },
    getSettings: function () { return readJSON(K_SETTINGS, {}) || {}; },
    putSettings: function (obj) { writeJSON(K_SETTINGS, obj || {}); },

    getMarketable: function () { return readJSON(K_MARKET, null); },
    putMarketable: function (ids) { writeJSON(K_MARKET, { t: Date.now(), ids: ids || [] }); }
  };

  FF14.watch.Store = Store;
})();
