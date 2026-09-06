/* ===== タブ切り替え =====
   ・各タブは FF14.core.Tabs.register(id, { eager, init, onShow }) で自分を登録します
   ・eager: true のタブはページ読み込み時に必ず init される（裏でも動き続けてほしいタブ）
     eager: false のタブは、最初に開かれたときに init される（重い初期化を後回しにする用）
   ・最後に開いていたタブは localStorage に保存し、次回はそこから開きます

   ▼ タブを増やすとき（例: 釣りツール）
     1. index.html の .hub-tabs に <button data-tab="fishing">釣り</button> を足す
     2. <section id="panel-fishing" class="hub-panel" hidden> を main に足す
     3. css/tab-fishing.css を作る（元アプリのCSSは tools/scope-css.awk で
        #panel-fishing 配下に限定できます）
     4. js/tabs/fishing/*.js を読み込み、末尾で
        FF14.core.Tabs.register('fishing', { eager: false, init: ..., onShow: ... })
     配線はこれだけです。tabs.js 側に手を入れる必要はありません。 */
FF14.core.Tabs = (function () {
  'use strict';

  var KEY = 'ff14hub.v1.ui';
  var mods = {};        // id -> { eager, init, onShow }
  var started = {};     // id -> true（init 済み）
  var currentId = null;
  var scrollPos = {};        // タブid -> スクロール位置
  var showListeners = [];

  function register(id, mod) {
    mods[id] = mod || {};
  }

  function onShow(fn) { showListeners.push(fn); }

  function saveLast(id) {
    try { localStorage.setItem(KEY, JSON.stringify({ lastTab: id })); }
    catch (e) { /* プライベートモード等。保存できなくても動作には影響しない */ }
  }

  function loadLast() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (o && typeof o.lastTab === 'string') ? o.lastTab : null;
    } catch (e) { return null; }
  }

  function panelOf(id) { return document.getElementById('panel-' + id); }

  function ensureInit(id) {
    if (started[id]) return;
    started[id] = true;
    var m = mods[id];
    if (m && typeof m.init === 'function') {
      try { m.init(); }
      catch (e) { console.error('[tabs] ' + id + ' の初期化に失敗しました', e); }
    }
  }

  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function show(id) {
    if (!panelOf(id)) id = firstTabId();
    if (!id) return;
    /* タブごとにスクロール位置を覚えておく（切り替えで見ていた場所を失わないため） */
    if (currentId && currentId !== id) scrollPos[currentId] = scrollTop();
    currentId = id;

    Array.prototype.forEach.call(document.querySelectorAll('.hub-panel'), function (p) {
      p.hidden = (p.id !== 'panel-' + id);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.hub-tabs button[data-tab]'), function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === id ? 'true' : 'false');
    });

    ensureInit(id);
    saveLast(id);
    window.scrollTo(0, scrollPos[id] || 0);

    /* 非表示の間に進んだぶんを描き直したいタブ（グラフのサイズ再計算など）に通知 */
    var m = mods[id];
    if (m && typeof m.onShow === 'function') {
      try { m.onShow(); } catch (e) { console.error('[tabs] ' + id + ' の表示処理に失敗しました', e); }
    }
    showListeners.forEach(function (fn) { try { fn(id); } catch (e) { console.error(e); } });
  }

  function firstTabId() {
    var b = document.querySelector('.hub-tabs button[data-tab]');
    return b ? b.dataset.tab : null;
  }

  function current() { return currentId; }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('.hub-tabs button[data-tab]'), function (b) {
      b.addEventListener('click', function () { show(b.dataset.tab); });
    });

    /* eager なタブは、開かれていなくても先に動かしておく（カウントダウン・通知判定） */
    Object.keys(mods).forEach(function (id) {
      if (mods[id].eager) ensureInit(id);
    });

    show(loadLast() || firstTabId());
  }

  return { register: register, start: start, show: show, current: current, onShow: onShow };
})();
