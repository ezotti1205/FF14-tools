/* marketable.js — 「マーケットボードに出品できるアイテム」のID一覧。
 *
 *   GET https://universalis.app/api/v2/marketable  →  [2,3,4,...]（約16800件 / 95KB）
 *
 * XIVAPI の検索は装備・クエストアイテム・未使用アイテムまで拾ってしまい、
 * その大半は相場が存在しない。この一覧で絞り込むと検索結果が実用的なものだけになる。
 * 取得できなかった場合は「全部通す」ので、リストが無くても検索自体は壊れない。 */
(function () {
  'use strict';

  var Store = FF14.watch.Store;
  var URL = 'https://universalis.app/api/v2/marketable';
  var TTL = 7 * 24 * 3600 * 1000;   // 7日
  var TIMEOUT = 20000;

  var set = null;        // { itemId: 1 } / 未取得なら null（= 絞り込みしない）
  var pending = null;

  function toSet(ids) {
    var m = {}, i;
    for (i = 0; i < ids.length; i++) m[ids[i]] = 1;
    return m;
  }

  function fetchWithTimeout(url) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
    var opts = { cache: 'no-store' };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /** 一覧を用意する。失敗しても reject しない（絞り込み無しで続行できる） */
  function load() {
    if (set) return Promise.resolve(true);
    if (pending) return pending;

    var cached = Store.getMarketable();
    if (cached && cached.ids && cached.ids.length && (Date.now() - cached.t < TTL)) {
      set = toSet(cached.ids);
      return Promise.resolve(true);
    }

    pending = fetchWithTimeout(URL).then(function (ids) {
      if (!Array.isArray(ids) || !ids.length) throw new Error('想定外のレスポンス形式');
      Store.putMarketable(ids);
      set = toSet(ids);
      pending = null;
      return true;
    }).catch(function (err) {
      pending = null;
      // 期限切れでも手元にあれば使う
      if (cached && cached.ids && cached.ids.length) {
        console.warn('[marketable] 更新に失敗、キャッシュを使用:', err.message);
        set = toSet(cached.ids);
        return true;
      }
      console.warn('[marketable] 取得に失敗、絞り込みなしで続行:', err.message);
      return false;
    });
    return pending;
  }

  /** 一覧が無いうちは true（絞り込みしない） */
  function has(id) { return !set || !!set[id]; }

  /** 一覧を持っているか */
  function ready() { return !!set; }

  FF14.watch.Marketable = { load: load, has: has, ready: ready };
})();
