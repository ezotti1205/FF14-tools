/* ===== 統合版の土台 =====
   ・グローバル名前空間 window.FF14 を1つだけ作り、各タブはこの下にぶら下げます
     （元の3本は Store / U / UI などをグローバルに置いていて名前が衝突するため）
   ・タブ横断の設定（通知の一括ON/OFF）と、ラベル付きの通知送信をここで持ちます

   クラシックスクリプトのままなのは、file:// でダブルクリック起動できるようにするためです。
   ESモジュールにするとローカルサーバー必須になります。 */
window.FF14 = window.FF14 || {};
FF14.core = FF14.core || {};
FF14.nodes = FF14.nodes || {};
FF14.assets = FF14.assets || {};
FF14.craft = FF14.craft || {};
FF14.reverse = FF14.reverse || {};   // レシピ検索・逆引きタブ
FF14.watch = FF14.watch || {};       // 市場タブ

FF14.core.Hub = (function () {
  'use strict';

  var KEY = 'ff14hub.v1.settings';
  var DEFAULTS = {
    notifyEnabled: true      // 通知の一括ON/OFF（各タブの個別設定より優先される）
  };

  var settings = load();
  var listeners = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return copy(DEFAULTS);
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? merge(DEFAULTS, o) : copy(DEFAULTS);
    } catch (e) { return copy(DEFAULTS); }
  }
  function copy(o) { return merge(o, {}); }
  function merge(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = over[k];
    return out;
  }

  function get() { return copy(settings); }

  function set(patch) {
    settings = merge(settings, patch || {});
    try { localStorage.setItem(KEY, JSON.stringify(settings)); }
    catch (e) { console.warn('[hub] 設定の保存に失敗しました', e); }
    listeners.forEach(function (fn) { try { fn(get()); } catch (e) { console.error(e); } });
    return get();
  }

  function onChange(fn) { listeners.push(fn); }

  /* ---------- 通知 ---------- */
  function supported() { return typeof Notification !== 'undefined'; }
  function permission() { return supported() ? Notification.permission : 'unsupported'; }

  function requestPermission() {
    if (!supported()) return Promise.resolve('unsupported');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    try { return Promise.resolve(Notification.requestPermission()); }
    catch (e) { return Promise.resolve(Notification.permission); }
  }

  /* どのタブからの通知か分かるよう、タイトルに [ラベル] を付けて送る。
     裏のタブからでも呼べます（同じページなので通知APIはタブ切替の影響を受けません）。 */
  function notify(label, title, options) {
    if (!settings.notifyEnabled) return null;
    if (permission() !== 'granted') return null;
    var opts = options || {};
    var o = {};
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    o.body = (o.body === undefined ? '' : o.body);
    try {
      return new Notification('[' + label + '] ' + title, o);
    } catch (e) {
      console.warn('[hub] 通知の表示に失敗しました', e);
      return null;
    }
  }

  /* ---------- トースト ----------
     #hubToast は全タブ共通の1要素。どのタブが出しても画面下に同じ形で出ます
     （タブを切り替えても消えないので、設定タブの操作結果もそのまま読めます）。 */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = document.getElementById('hubToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'hub-toast show' + (kind ? ' ' + kind : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'hub-toast'; }, kind === 'warn' ? 5000 : 3000);
  }

  return {
    KEY: KEY,
    get: get, set: set, onChange: onChange,
    toast: toast,
    notifySupported: supported, notifyPermission: permission,
    requestNotifyPermission: requestPermission, notify: notify
  };
})();
