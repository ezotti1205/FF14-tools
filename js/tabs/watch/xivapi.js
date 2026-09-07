/* xivapi.js — アイテム名 → itemId / アイコン の解決だけを担当する。
 *
 * Universalis は価格APIのみで名前検索を持たないため、アイテム検索は XIVAPI v2 を使う。
 *   検索 : GET https://v2.xivapi.com/api/search?sheets=Item&query=Name~"..."&language=ja
 *   画像 : GET https://v2.xivapi.com/api/asset?path=ui/icon/020000/020801.tex&format=png
 * どちらも CORS 対応済み（access-control-allow-origin: *）。
 *
 * 旧 xivapi.com(v1) は検索クラスタが停止しており使えないため v2 を採用している。 */
(function () {
  'use strict';

  var BASE = 'https://v2.xivapi.com/api';
  var TIMEOUT = 15000;
  var LIMIT = 100;        // 候補リスト用（出品可で絞る前の取得数）
  var LIMIT_FULL = 250;   // 「検索」ボタン / Enter での全文検索用

  function fetchJSON(url) {
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
      throw (err && err.name === 'AbortError') ? new Error('タイムアウト') : err;
    });
  }

  /** XIVAPI v2 の Icon.path（"ui/icon/020000/020801.tex"）を表示可能なPNG URLにする */
  function iconUrl(iconPath) {
    if (!iconPath) return null;
    if (/^https?:/.test(iconPath)) return iconPath;
    return BASE + '/asset?path=' + encodeURIComponent(iconPath) + '&format=png';
  }

  /**
   * アイテム名で検索する。1文字から検索できる（「布」「革」「材」などは1文字が実用的）。
   * 出品可否での絞り込みや並べ替えは呼び出し側（app.js）が行う。
   *
   * @param {string} query
   * @param {string} [language]  'ja' | 'en' | 'de' | 'fr'（既定 'ja'）
   * @param {boolean} [full]     true なら多めに取得（検索ボタン用）
   * @returns {Promise<Array<{id:number, name:string, icon:string|null, untradable:boolean}>>}
   */
  function searchItems(query, language, full) {
    // XIVAPI のクエリDSLを壊す " と \ だけ落とす（正規表現を使わず退避）
    query = String(query || '').split('"').join(' ')
              .split(String.fromCharCode(92)).join(' ').trim();
    if (!query) return Promise.resolve([]);
    var lang = language || 'ja';
    var q = 'Name~"' + query + '"';
    var url = BASE + '/search'
      + '?sheets=Item'
      + '&language=' + encodeURIComponent(lang)
      + '&fields=' + encodeURIComponent('Name,Icon,IsUntradable')
      + '&limit=' + (full ? LIMIT_FULL : LIMIT)
      + '&query=' + encodeURIComponent(q);
    return fetchJSON(url).then(function (json) {
      var rows = (json && json.results) || [];
      var seen = {};
      return rows.map(function (r) {
        var f = r.fields || {};
        // hr1 は10KB / 通常は3KB。24pxで表示するので通常版で十分（一覧で56件並ぶと差が出る）
        var icon = f.Icon && (f.Icon.path || f.Icon.path_hr1) || null;
        /* 応答にアイコンのパスが入っているので、共通のアイコンキャッシュへ流し込んでおく。
           これをしないと FF14.core.Icons が同じパスを取り直してしまう。 */
        if (icon && r.row_id) FF14.core.Icons.prime(r.row_id, icon);
        return {
          id: r.row_id,
          name: f.Name || '',
          icon: iconUrl(icon),
          untradable: !!f.IsUntradable
        };
      }).filter(function (r) {
        // 名前なし / 重複ID / 未使用アイテム（先頭の † ）は捨てる
        if (!r.id || !r.name || seen[r.id]) return false;
        if (r.name.charAt(0) === '\u2020') return false;
        seen[r.id] = 1;
        return true;
      });
    });
  }

  FF14.watch.XIVAPI = {
    searchItems: searchItems,
    iconUrl: iconUrl
  };
})();
