/* ===== タブバー右端の共通時計 =====
   ET計算は js/core/eorzea.js（元・ノードツールのもの）を共通モジュールとして使い回します。
   どのタブを開いていても常駐します。 */
FF14.core.Clock = (function () {
  'use strict';

  var etEl = null, realEl = null, timer = null;

  function tick() {
    var now = Date.now();
    if (etEl) etEl.textContent = window.Eorzea.formatEorzeaTime(now);
    if (realEl) realEl.textContent = new Date(now).toLocaleTimeString('ja-JP');
  }

  function start() {
    etEl = document.getElementById('hubEtClock');
    realEl = document.getElementById('hubRealClock');
    tick();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
    /* 非アクティブタブや復帰直後は setInterval が間引かれるので、戻ってきたら即座に合わせ直す */
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  }

  return { start: start, tick: tick };
})();
