/* universalis.js — Universalis API v2 クライアント
 *
 * GET https://universalis.app/api/v2/{world|dc}/{itemIds}
 *   - itemIds はカンマ区切りで最大100件を1リクエストにまとめる
 *   - 結果は localStorage に15分キャッシュ（Store.getFreshPrice / putPrice）
 *
 * 識別情報について:
 *   ブラウザの fetch は User-Agent ヘッダの上書きを仕様で禁止しているため、
 *   代わりに識別用のクエリパラメータ appName / contact を付与している。
 *   Universalis 側は未知のパラメータを無視する（動作確認済み）が、
 *   アクセスログ上でこのアプリからのリクエストだと判別できる。
 */
window.Universalis = (function () {
  'use strict';

  var API = 'https://universalis.app/api/v2/';
  var APP_NAME = 'ff14-craft-profit';
  var APP_VER = '1.0';
  var CHUNK = 100;
  var TTL = 15 * 60 * 1000;      // 15分
  var LISTINGS = 20;             // 取得する出品件数
  var ENTRIES = 20;              // 取得する取引履歴件数
  var TIMEOUT = 20000;

  var failed = {};               // itemId -> エラーメッセージ（メモリのみ / スコープ変更でクリア）
  var failedScope = null;

  function ident() {
    return 'appName=' + encodeURIComponent(APP_NAME + '/' + APP_VER) +
           '&contact=' + encodeURIComponent(APP_NAME + ' (single-user browser tool)');
  }

  function fetchWithTimeout(url) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
    var opts = { cache: 'no-store' };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      throw (err && err.name === 'AbortError') ? new Error('タイムアウト') : err;
    });
  }

  function median(arr) {
    if (!arr || !arr.length) return null;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = a.length >> 1;
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
  }

  /** APIの1アイテム分のレスポンスを、キャッシュ用のコンパクトな形に圧縮する */
  function distill(o) {
    var nqL = [], hqL = [], nqH = [], hqH = [], i, l, h;
    var listings = o.listings || [];
    for (i = 0; i < listings.length; i++) {
      l = listings[i];
      (l.hq ? hqL : nqL).push([l.pricePerUnit, l.quantity]);
    }
    var hist = o.recentHistory || [];
    for (i = 0; i < hist.length; i++) {
      h = hist[i];
      (h.hq ? hqH : nqH).push(h.pricePerUnit);
    }
    nqL.sort(function (a, b) { return a[0] - b[0]; });
    hqL.sort(function (a, b) { return a[0] - b[0]; });

    return {
      t: Date.now(),
      u: o.lastUploadTime || 0,
      nq: { l: nqL, min: nqL.length ? nqL[0][0] : null, med: median(nqH), n: nqH.length },
      hq: { l: hqL, min: hqL.length ? hqL[0][0] : null, med: median(hqH), n: hqH.length }
    };
  }

  function chunkArray(arr, size) {
    var out = [], i;
    for (i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  /**
   * 指定アイテムの価格を、キャッシュを見つつ必要な分だけ取得する。
   * 失敗しても例外は投げず、失敗したIDを返す（呼び出し側は手入力にフォールバックできる）。
   *
   * @param {string} scope ワールド名 または DC名
   * @param {number[]} itemIds
   * @param {{force?:boolean, onProgress?:function(number,number)}} opts
   * @returns {Promise<{fetched:number[], failed:number[], errors:string[]}>}
   */
  function ensurePrices(scope, itemIds, opts) {
    opts = opts || {};
    if (failedScope !== scope) { failed = {}; failedScope = scope; }

    var uniq = {}, need = [], i, id;
    for (i = 0; i < itemIds.length; i++) {
      id = itemIds[i];
      if (!id || uniq[id]) continue;
      uniq[id] = 1;
      if (!opts.force && Store.getFreshPrice(scope, id, TTL)) continue;
      need.push(id);
    }

    if (opts.force) failed = {};

    if (!need.length) return Promise.resolve({ fetched: [], failed: [], errors: [] });

    var chunks = chunkArray(need, CHUNK);
    var done = 0, fetched = [], failedIds = [], errors = [];
    var progress = opts.onProgress || function () {};
    progress(0, chunks.length);

    // 直列に処理してレート制限に配慮する
    return chunks.reduce(function (p, ids) {
      return p.then(function () {
        var url = API + encodeURIComponent(scope) + '/' + ids.join(',') +
                  '?listings=' + LISTINGS + '&entries=' + ENTRIES + '&' + ident();
        return fetchWithTimeout(url).then(function (json) {
          // 複数IDなら {itemIDs, items:{...}}、1IDなら単一オブジェクトが返る
          var map = json && json.items ? json.items : null;
          if (!map && json && json.itemID) { map = {}; map[json.itemID] = json; }
          if (!map) throw new Error('想定外のレスポンス形式');

          for (var k = 0; k < ids.length; k++) {
            var it = map[ids[k]] || map[String(ids[k])];
            if (it) {
              Store.putPrice(scope, ids[k], distill(it));
              delete failed[ids[k]];
              fetched.push(ids[k]);
            } else {
              // マーケット非対応アイテム（取引不可）などはここに来る
              Store.putPrice(scope, ids[k], { t: Date.now(), u: 0, untradable: true,
                nq: { l: [], min: null, med: null, n: 0 }, hq: { l: [], min: null, med: null, n: 0 } });
              fetched.push(ids[k]);
            }
          }
        }).catch(function (err) {
          var msg = (err && err.message) || String(err);
          errors.push(msg);
          for (var k = 0; k < ids.length; k++) {
            failed[ids[k]] = msg;
            failedIds.push(ids[k]);
          }
        }).then(function () {
          done++;
          progress(done, chunks.length);
        });
      });
    }, Promise.resolve()).then(function () {
      return { fetched: fetched, failed: failedIds, errors: errors };
    });
  }

  function errorFor(itemId) { return failed[itemId] || null; }
  function hasFailures() { return Object.keys(failed).length > 0; }
  function clearFailures() { failed = {}; }
  function ttlMs() { return TTL; }

  /** ワールド / データセンター一覧（7日キャッシュ） */
  function loadWorlds() {
    var cached = Store.getWorlds();
    if (cached && cached.data && (Date.now() - cached.t < 7 * 24 * 3600 * 1000)) {
      return Promise.resolve(cached.data);
    }
    return Promise.all([
      fetchWithTimeout(API + 'worlds?' + ident()),
      fetchWithTimeout(API + 'data-centers?' + ident())
    ]).then(function (r) {
      var data = { worlds: r[0], dcs: r[1] };
      Store.putWorlds(data);
      return data;
    }).catch(function (err) {
      if (cached && cached.data) {
        console.warn('[universalis] ワールド一覧の更新に失敗、キャッシュを使用:', err.message);
        return cached.data;
      }
      throw err;
    });
  }

  return {
    ensurePrices: ensurePrices,
    errorFor: errorFor,
    hasFailures: hasFailures,
    clearFailures: clearFailures,
    loadWorlds: loadWorlds,
    ttlMs: ttlMs
  };
})();
