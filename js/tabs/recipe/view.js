/* view.js — ホーム / 条件から探す / 検索・逆引き の3ビュー切り替え
 *
 * 単体ページでは location.hash（#/browse?job=8 など）に同期し、
 * ハブのタブに載せたときは useHash:false でURLに一切触らない。
 * どちらの場合も画面の出し分けとパラメータの受け渡しは同じ経路を通る。
 */
(function () {
  'use strict';
  window.FF14 = window.FF14 || {};
  window.FF14.reverse = window.FF14.reverse || {};

  var root = null;
  var useHash = false;
  var current = null;
  var currentParams = {};
  var handlers = {};      // view名 -> [fn]
  var busy = false;       // hashchange の自己ループ防止

  var DEFAULT = 'home';
  var VIEWS = ['home', 'browse', 'search'];

  function init(rootEl, opts) {
    root = rootEl;
    useHash = !!(opts && opts.useHash);
    if (useHash) window.addEventListener('hashchange', onHashChange);

    // ビュー切り替えリンク（data-goview="browse" など）はここでまとめて拾う
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-goview]');
      if (!a) return;
      e.preventDefault();
      show(a.getAttribute('data-goview'), parseQuery(a.getAttribute('data-goparams') || ''));
    });
  }

  /** 起動時に、hash があればそれを、無ければホームを開く */
  function start() {
    var r = useHash ? parseHash(location.hash) : null;
    if (r && r.view) show(r.view, r.params, { replace: true });
    else show(DEFAULT, {}, { replace: true });
  }

  function on(name, fn) { (handlers[name] || (handlers[name] = [])).push(fn); }

  /**
   * ビューを表示する。
   * @param {string} name  home / browse / search
   * @param {object} params  そのビューに渡すパラメータ
   * @param {{replace?:boolean, silent?:boolean}} opts
   *        silent:true なら enter ハンドラを呼ばない（URLだけ直したいとき）
   */
  function show(name, params, opts) {
    if (VIEWS.indexOf(name) < 0) name = DEFAULT;
    params = params || {};
    opts = opts || {};

    current = name;
    currentParams = params;

    root.setAttribute('data-view', name);
    var panes = root.querySelectorAll('.rcp-view');
    for (var i = 0; i < panes.length; i++) {
      panes[i].hidden = (panes[i].getAttribute('data-view') !== name);
    }

    syncHash(opts.replace);
    if (!opts.silent) fire(name, params);
  }

  /** 表示は変えずに、いまのビューのパラメータ（＝URL）だけ差し替える */
  function setParams(params) {
    currentParams = params || {};
    syncHash(true);
  }

  function fire(name, params) {
    var list = handlers[name] || [];
    for (var i = 0; i < list.length; i++) {
      try { list[i](params); }
      catch (err) { console.error('[view] ' + name + ' の初期化で例外', err); }
    }
  }

  /* ---------- hash ---------- */
  function syncHash(replace) {
    if (!useHash || busy) return;
    var h = '#/' + current;
    var qs = buildQuery(currentParams);
    if (qs) h += '?' + qs;
    if (location.hash === h) return;
    busy = true;
    try {
      if (replace && history.replaceState) history.replaceState(null, '', h);
      else location.hash = h;
    } catch (e) { location.hash = h; }
    // hashchange は非同期で飛ぶので、次のタスクで解除する
    setTimeout(function () { busy = false; }, 0);
  }

  function onHashChange() {
    if (busy) return;
    var r = parseHash(location.hash);
    if (!r || !r.view) { show(DEFAULT, {}, { replace: true }); return; }
    show(r.view, r.params, { replace: true });
  }

  /** "#/browse?job=8&lv=11" → { view:'browse', params:{job:'8',lv:'11'} } */
  function parseHash(h) {
    h = String(h || '').replace(/^#\/?/, '');
    if (!h) return null;
    var qi = h.indexOf('?');
    var view = qi < 0 ? h : h.slice(0, qi);
    var params = qi < 0 ? {} : parseQuery(h.slice(qi + 1));
    // 旧形式 #/item/5057 も受ける
    var m = view.match(/^item\/(\d+)$/);
    if (m) { params.item = m[1]; view = 'search'; }
    return { view: view, params: params };
  }

  function parseQuery(s) {
    var out = {};
    String(s || '').replace(/^\?/, '').split('&').forEach(function (p) {
      if (!p) return;
      var i = p.indexOf('=');
      if (i < 0) { out[decodeURIComponent(p)] = ''; return; }
      out[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, ' '));
    });
    return out;
  }

  function buildQuery(params) {
    var qs = [];
    for (var k in params) {
      if (params[k] == null || params[k] === '') continue;
      qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    }
    return qs.join('&');
  }

  window.FF14.reverse.View = {
    init: init, start: start, on: on, show: show, setParams: setParams,
    current: function () { return current; },
    params: function () { return currentParams; },
    parseQuery: parseQuery, buildQuery: buildQuery
  };
})();
