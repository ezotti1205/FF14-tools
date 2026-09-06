/* gamedata.js — アイテム名 / レシピの静的データ（ffxiv-teamcraft の公開JSONを jsDelivr 経由で取得）
 *
 * 取得元:
 *   https://cdn.jsdelivr.net/gh/ffxiv-teamcraft/ffxiv-teamcraft@staging/libs/data/src/lib/json/items.json
 *   https://cdn.jsdelivr.net/gh/ffxiv-teamcraft/ffxiv-teamcraft@staging/libs/data/src/lib/json/recipes.json
 *
 * 圧縮転送で items 約1.4MB / recipes 約0.4MB。初回のみDLし、以後は IndexedDB に保存して再利用する。
 * （localStorage は容量が足りないため、この辞書だけ IndexedDB を使う。IndexedDB が使えない環境では
 *   毎回ダウンロードにフォールバックする — ブラウザのHTTPキャッシュが効くので実害は小さい。）
 */
window.GameData = (function () {
  'use strict';

  var BASE = 'https://cdn.jsdelivr.net/gh/ffxiv-teamcraft/ffxiv-teamcraft@staging/libs/data/src/lib/json/';
  var DB_NAME = 'ff14cp';
  var DB_STORE = 'kv';
  var DB_KEY = 'dataset';
  var MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7日

  var JOB_NAME = {
    8: '木工', 9: '鍛冶', 10: '甲冑', 11: '彫金',
    12: '革細工', 13: '裁縫', 14: '錬金', 15: '調理'
  };

  var items = null;        // { id: {ja, en} }
  var recipesById = null;  // { recipeId: recipe }
  var byResult = null;     // { itemId: [recipe, ...] }
  var searchIndex = null;  // [{id, ja, en, j, e, c}]
  var loadedAt = 0;

  // ---------- IndexedDB ----------
  function idbOpen() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB非対応'));
      var req;
      try { req = indexedDB.open(DB_NAME, 1); }
      catch (e) { return reject(e); }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IndexedDBを開けません')); };
      req.onblocked = function () { reject(new Error('IndexedDBがブロックされました')); };
    });
  }

  function idbGet(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readonly');
        var r = tx.objectStore(DB_STORE).get(key);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function idbPut(key, value) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  // ---------- 取得・整形 ----------
  function fetchJSON(url) {
    return fetch(url, { cache: 'default' }).then(function (res) {
      if (!res.ok) throw new Error(url + ' が ' + res.status + ' を返しました');
      return res.json();
    });
  }

  function distillItems(raw) {
    var out = {};
    for (var id in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, id)) continue;
      var v = raw[id];
      if (!v) continue;
      var ja = v.ja || '', en = v.en || '';
      if (!ja && !en) continue;
      out[id] = { ja: ja || en, en: en || ja };
    }
    return out;
  }

  function distillRecipes(raw) {
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      if (!r || !r.result || !r.ingredients || !r.ingredients.length) continue;
      var ing = [];
      for (var k = 0; k < r.ingredients.length; k++) {
        var g = r.ingredients[k];
        if (!g || !g.id || !g.amount) continue;
        ing.push({ id: g.id, amount: g.amount });
      }
      if (!ing.length) continue;
      out.push({
        id: r.id,
        job: r.job,
        lvl: r.lvl,
        yields: r.yields || 1,
        result: r.result,
        ingredients: ing
      });
    }
    return out;
  }

  function build(dataset) {
    items = dataset.items;
    recipesById = {};
    byResult = {};
    var list = dataset.recipes;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      recipesById[r.id] = r;
      (byResult[r.result] || (byResult[r.result] = [])).push(r);
    }
    // 同一アイテムの複数レシピはレベル昇順で安定させる
    for (var key in byResult) {
      byResult[key].sort(function (a, b) { return (a.lvl - b.lvl) || (a.id - b.id); });
    }

    searchIndex = [];
    for (var id in items) {
      var it = items[id];
      var n = +id;
      searchIndex.push({
        id: n,
        ja: it.ja,
        en: it.en,
        j: norm(it.ja),
        e: norm(it.en),
        c: byResult[n] ? 1 : 0
      });
    }
    loadedAt = dataset.t || Date.now();
  }

  function norm(s) {
    if (!s) return '';
    try { s = s.normalize('NFKC'); } catch (e) {}
    return s.toLowerCase().replace(/[\s'’·・-]/g, '');
  }

  /**
   * データセットを読み込む。
   * @param {{force?:boolean, onProgress?:function(string)}} opts
   * @returns {Promise<{fromCache:boolean, stale:boolean, loadedAt:number}>}
   */
  function load(opts) {
    opts = opts || {};
    var progress = opts.onProgress || function () {};
    var cached = null;

    return Promise.resolve()
      .then(function () {
        if (opts.force) return null;
        return idbGet(DB_KEY).catch(function (e) {
          console.warn('[gamedata] IndexedDB読み込み不可:', e && e.message);
          return null;
        });
      })
      .then(function (c) {
        cached = c;
        if (cached && cached.items && cached.recipes && (Date.now() - (cached.t || 0) < MAX_AGE)) {
          progress('保存済みのレシピDBを読み込み中…');
          build(cached);
          return { fromCache: true, stale: false, loadedAt: loadedAt };
        }
        progress('レシピDBをダウンロード中…（初回のみ約2MB）');
        return Promise.all([
          fetchJSON(BASE + 'items.json'),
          fetchJSON(BASE + 'recipes.json')
        ]).then(function (res) {
          progress('レシピDBを展開中…');
          var dataset = {
            t: Date.now(),
            items: distillItems(res[0]),
            recipes: distillRecipes(res[1])
          };
          build(dataset);
          idbPut(DB_KEY, dataset).catch(function (e) {
            console.warn('[gamedata] IndexedDB保存不可（毎回DLになります）:', e && e.message);
          });
          return { fromCache: false, stale: false, loadedAt: loadedAt };
        }).catch(function (err) {
          // ダウンロード失敗 — 期限切れでもキャッシュがあれば使う
          if (cached && cached.items && cached.recipes) {
            console.warn('[gamedata] 更新に失敗、古いキャッシュを使用:', err && err.message);
            build(cached);
            return { fromCache: true, stale: true, loadedAt: loadedAt, error: err };
          }
          throw err;
        });
      });
  }

  // ---------- 参照API ----------
  function isReady() { return !!items; }
  function nameOf(itemId) {
    var it = items && items[itemId];
    return it ? it.ja : ('アイテム#' + itemId);
  }
  function nameEnOf(itemId) {
    var it = items && items[itemId];
    return it ? it.en : '';
  }
  function recipesFor(itemId) { return (byResult && byResult[itemId]) || []; }
  function recipeById(id) { return (recipesById && recipesById[id]) || null; }
  function isCraftable(itemId) { return !!(byResult && byResult[itemId]); }
  function jobName(job) { return JOB_NAME[job] || ('職' + job); }
  function isCrystal(itemId) { return itemId >= 2 && itemId <= 19; }
  function dataAge() { return loadedAt; }

  /**
   * アイテム名検索。日本語・英語・数値ID に対応。
   * @returns {Array<{id:number, ja:string, en:string, craftable:boolean}>}
   */
  function search(query, limit) {
    limit = limit || 40;
    if (!searchIndex) return [];
    var q = norm(query);
    if (!q) return [];

    var out = [];

    // 数値のみならIDとしても引く
    if (/^[0-9]+$/.test(query.trim())) {
      var idn = parseInt(query.trim(), 10);
      if (items[idn]) out.push({ id: idn, ja: items[idn].ja, en: items[idn].en, craftable: !!byResult[idn], score: -1 });
    }

    for (var i = 0; i < searchIndex.length; i++) {
      var e = searchIndex[i];
      var pj = e.j.indexOf(q);
      var pe = pj === 0 ? -1 : e.e.indexOf(q);
      if (pj < 0 && pe < 0) continue;
      var pos = pj >= 0 ? pj : pe;
      // 前方一致・短い名前・製作可能を優先
      var score = pos * 10 + (e.ja.length + e.en.length) * 0.01 + (e.c ? 0 : 300);
      out.push({ id: e.id, ja: e.ja, en: e.en, craftable: !!e.c, score: score });
      if (out.length > 4000) break;
    }

    out.sort(function (a, b) { return a.score - b.score; });
    // ID直指定の重複を除去
    var seen = {}, res = [];
    for (var k = 0; k < out.length && res.length < limit; k++) {
      if (seen[out[k].id]) continue;
      seen[out[k].id] = 1;
      res.push(out[k]);
    }
    return res;
  }

  return {
    load: load,
    isReady: isReady,
    nameOf: nameOf,
    nameEnOf: nameEnOf,
    recipesFor: recipesFor,
    recipeById: recipeById,
    isCraftable: isCraftable,
    jobName: jobName,
    isCrystal: isCrystal,
    dataAge: dataAge,
    search: search
  };
})();
