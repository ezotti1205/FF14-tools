/* chart.js — 元 ff14-assets/js/chart.js。中身は無変更で、グローバルを汚さないよう
   IIFEで包んで FF14.assets.ChartView として公開しているだけです。 */
(function () {
  var U = FF14.assets.U;
/* ===== グラフ描画（Chart.js ラッパ） =====
   バケット化のおかげで描画点は最大でも 120 点程度に収まるため、
   365件の日次記録でも再描画は軽いままです。 */
var ChartView = (function () {
  'use strict';

  var chart = null;
  var canvas = null;
  var current = null; /* 直近の series */
  var hasData = false;

  var COLORS = {
    line: '#7ab8ff',
    lineDown: '#f2a25c',
    fillTop: 'rgba(122,184,255,0.28)',
    fillBottom: 'rgba(122,184,255,0.02)',
    grid: 'rgba(255,255,255,0.07)',
    tick: '#8b97ad',
    point: '#cfe4ff'
  };

  function available() { return typeof window.Chart !== 'undefined'; }

  function gradient(ctx, area) {
    if (!area) return COLORS.fillTop;
    var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, COLORS.fillTop);
    g.addColorStop(1, COLORS.fillBottom);
    return g;
  }

  function pointRadius(s) {
    var n = 0;
    for (var i = 0; i < s.values.length; i++) if (s.values[i] !== null) n++;
    if (n <= 1) return 5;
    if (n <= 40) return 3;
    if (n <= 80) return 2;
    return 0;
  }

  function maxTicks() {
    var w = canvas ? canvas.clientWidth : 360;
    if (w < 420) return 5;
    if (w < 700) return 8;
    return 12;
  }

  function buildConfig(s) {
    return {
      type: 'line',
      data: {
        labels: s.labels,
        datasets: [{
          label: '総資産',
          data: s.values,
          borderColor: COLORS.line,
          borderWidth: 2,
          pointRadius: pointRadius(s),
          pointHoverRadius: 5,
          pointBackgroundColor: COLORS.point,
          pointBorderColor: COLORS.line,
          tension: 0.22,
          spanGaps: true,
          fill: true,
          backgroundColor: function (c) {
            var ch = c.chart;
            return gradient(ch.ctx, ch.chartArea);
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        normalized: true,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 8, right: 6, bottom: 0, left: 0 } },
        scales: {
          x: {
            grid: { color: COLORS.grid, drawTicks: false },
            border: { color: COLORS.grid },
            ticks: {
              color: COLORS.tick,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: maxTicks()
            }
          },
          y: {
            grid: { color: COLORS.grid, drawTicks: false },
            border: { display: false },
            ticks: {
              color: COLORS.tick,
              font: { size: 11 },
              maxTicksLimit: 6,
              /* 記録が1件もない期間では 0 ばかりの目盛りを出さない */
              callback: function (v) { return hasData ? U.fmtShort(v) : ''; }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(16,20,28,0.95)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            titleColor: '#e7edf7',
            bodyColor: '#c6d2e4',
            padding: 10,
            displayColors: false,
            callbacks: {
              title: function (items) {
                if (!items.length || !current) return '';
                return current.fullLabels[items[0].dataIndex] || '';
              },
              label: function (item) {
                var lines = [U.fmt(item.parsed.y) + ' ギル'];
                if (current) {
                  var i = item.dataIndex, prev = null;
                  for (var k = i - 1; k >= 0; k--) {
                    if (current.values[k] !== null) { prev = current.values[k]; break; }
                  }
                  if (prev !== null) {
                    var d = item.parsed.y - prev;
                    var r = prev !== 0 ? (d / Math.abs(prev)) * 100 : null;
                    lines.push('前の点から ' + U.fmtSigned(d) + (r === null ? '' : '（' + U.fmtRate(r) + '）'));
                  }
                }
                return lines;
              }
            }
          }
        }
      }
    };
  }

  function init(el) {
    canvas = el;
  }

  function render(s) {
    current = s;
    hasData = false;
    for (var n = 0; n < s.values.length; n++) {
      if (s.values[n] !== null) { hasData = true; break; }
    }
    if (!available() || !canvas) return false;

    if (!chart) {
      chart = new window.Chart(canvas.getContext('2d'), buildConfig(s));
      return true;
    }
    /* 作り直さず差し替えるほうが軽い */
    chart.data.labels = s.labels;
    chart.data.datasets[0].data = s.values;
    chart.data.datasets[0].pointRadius = pointRadius(s);
    chart.options.scales.x.ticks.maxTicksLimit = maxTicks();
    chart.update('none');
    return true;
  }

  function resize() {
    if (chart) {
      chart.options.scales.x.ticks.maxTicksLimit = maxTicks();
      chart.resize();
      chart.update('none');
    }
  }

  return { init: init, render: render, resize: resize, available: available };
})();
  FF14.assets.ChartView = ChartView;
})();
