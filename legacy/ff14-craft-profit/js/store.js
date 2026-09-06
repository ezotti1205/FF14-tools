/* store.js — localStorage 永続化 / 設定・状態・価格キャッシュ / エクスポート・インポート */
window.Store = (function () {
  'use strict';

  var KEY = {
    settings: 'ff14cp.settings',
    state:    'ff14cp.state',
    price:    'ff14cp.price',
    worlds:   'ff14cp.worlds'
  };

  var DEFAULT_SETTINGS = {
    scopeType: 'dc',        // 'dc' | 'world'
    scopeName: 'Elemental',
    feeRate: 5,             // %
    saleBasis: 'hq',        // 'hq' | 'nq' — 判定に使う完成品の品質
    crystalsHeld: true      // クリスタル類を既定で「所持済み」に
  };

  var DEFAULT_STATE = {
    itemId: null,
    qty: 1,
    recipeChoice: {},   // itemId -> recipeId
    modes: {},          // itemId -> 'buy' | 'make' | 'have'
    overrides: {},      // itemId -> 手入力単価(gil)
    collapsed: {}       // ツリーのパスキー -> true
  };

  var MAX_PRICE_ENTRIES = 900;

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && typeof v === 'object') ? v : null;
    } catch (e) {
      console.warn('[store] 読み込み失敗:', key, e);
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[store] 保存失敗:', key, e);
      return false;
    }
  }

  function merge(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    if (over) for (k in over) if (Object.prototype.hasOwnProperty.call(over, k)) out[k] = over[k];
    return out;
  }

  // ---- settings ----
  var settings = merge(DEFAULT_SETTINGS, readJSON(KEY.settings));

  function getSettings() { return settings; }
  function setSettings(patch) {
    settings = merge(settings, patch);
    writeJSON(KEY.settings, settings);
    return settings;
  }
  function scopeKey() {
    return settings.scopeName || 'Elemental';
  }

  // ---- state ----
  var state = merge(DEFAULT_STATE, readJSON(KEY.state));
  if (!state.recipeChoice) state.recipeChoice = {};
  if (!state.modes) state.modes = {};
  if (!state.overrides) state.overrides = {};
  if (!state.collapsed) state.collapsed = {};

  var stateTimer = null;
  function saveStateSoon() {
    if (stateTimer) clearTimeout(stateTimer);
    stateTimer = setTimeout(function () { writeJSON(KEY.state, state); stateTimer = null; }, 250);
  }
  function getState() { return state; }
  function setState(patch) {
    state = merge(state, patch);
    saveStateSoon();
    return state;
  }

  // ---- 価格キャッシュ ----
  // 形: { "<scope>#<itemId>": { t, u, nq:{l,min,med,n}, hq:{...} } }
  var priceCache = readJSON(KEY.price) || {};
  var priceTimer = null;

  function pKey(scope, itemId) { return scope + '#' + itemId; }

  function getPrice(scope, itemId) {
    return priceCache[pKey(scope, itemId)] || null;
  }

  function getFreshPrice(scope, itemId, ttlMs) {
    var e = priceCache[pKey(scope, itemId)];
    if (!e) return null;
    if (Date.now() - (e.t || 0) > ttlMs) return null;
    return e;
  }

  function putPrice(scope, itemId, entry) {
    priceCache[pKey(scope, itemId)] = entry;
    savePriceSoon();
  }

  function savePriceSoon() {
    if (priceTimer) clearTimeout(priceTimer);
    priceTimer = setTimeout(flushPrice, 400);
  }

  function flushPrice() {
    priceTimer = null;
    trimPrice();
    if (!writeJSON(KEY.price, priceCache)) {
      // 容量超過の可能性 — 半分に間引いて再試行
      var keys = Object.keys(priceCache).sort(function (a, b) {
        return (priceCache[a].t || 0) - (priceCache[b].t || 0);
      });
      for (var i = 0; i < Math.ceil(keys.length / 2); i++) delete priceCache[keys[i]];
      if (!writeJSON(KEY.price, priceCache)) {
        priceCache = {};
        try { localStorage.removeItem(KEY.price); } catch (e) {}
      }
    }
  }

  function trimPrice() {
    var keys = Object.keys(priceCache);
    if (keys.length <= MAX_PRICE_ENTRIES) return;
    keys.sort(function (a, b) { return (priceCache[a].t || 0) - (priceCache[b].t || 0); });
    var drop = keys.length - MAX_PRICE_ENTRIES;
    for (var i = 0; i < drop; i++) delete priceCache[keys[i]];
  }

  function clearPriceCache() {
    priceCache = {};
    try { localStorage.removeItem(KEY.price); } catch (e) {}
  }

  function priceCacheSize() { return Object.keys(priceCache).length; }

  // ---- ワールド一覧キャッシュ ----
  function getWorlds() { return readJSON(KEY.worlds); }
  function putWorlds(v) { writeJSON(KEY.worlds, { t: Date.now(), data: v }); }

  // ---- エクスポート / インポート ----
  function exportJSON() {
    return {
      app: 'ff14-craft-profit',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settings,
      state: state
    };
  }

  function importJSON(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('JSONの形式が不正です。');
    if (obj.app && obj.app !== 'ff14-craft-profit') {
      throw new Error('このアプリのエクスポートファイルではありません（app=' + obj.app + '）。');
    }
    if (!obj.settings && !obj.state) throw new Error('settings も state も含まれていません。');
    if (obj.settings) { settings = merge(DEFAULT_SETTINGS, obj.settings); writeJSON(KEY.settings, settings); }
    if (obj.state) {
      state = merge(DEFAULT_STATE, obj.state);
      if (!state.recipeChoice) state.recipeChoice = {};
      if (!state.modes) state.modes = {};
      if (!state.overrides) state.overrides = {};
      if (!state.collapsed) state.collapsed = {};
      writeJSON(KEY.state, state);
    }
  }

  window.addEventListener('beforeunload', function () {
    if (stateTimer) { clearTimeout(stateTimer); writeJSON(KEY.state, state); }
    if (priceTimer) { clearTimeout(priceTimer); flushPrice(); }
  });

  return {
    getSettings: getSettings,
    setSettings: setSettings,
    scopeKey: scopeKey,
    getState: getState,
    setState: setState,
    saveStateSoon: saveStateSoon,
    getPrice: getPrice,
    getFreshPrice: getFreshPrice,
    putPrice: putPrice,
    clearPriceCache: clearPriceCache,
    priceCacheSize: priceCacheSize,
    getWorlds: getWorlds,
    putWorlds: putWorlds,
    exportJSON: exportJSON,
    importJSON: importJSON
  };
})();
