/* util.js — 元 ff14-assets/js/util.js。中身は無変更で、グローバルを汚さないよう
   IIFEで包んで FF14.assets.U として公開しているだけです。 */
(function () {
/* ===== 汎用ユーティリティ（日付・数値） ===== */
var U = (function () {
  'use strict';

  /* ---- 日付（すべて 'YYYY-MM-DD' のローカル日付文字列で扱う） ---- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function dateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function today() { return dateStr(new Date()); }

  function parse(s) {
    if (typeof s !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, da = +m[3];
    var d = new Date(y, mo, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
    return d;
  }

  function isValidDate(s) { return !!parse(s); }

  function addDays(s, n) {
    var d = parse(s);
    if (!d) return null;
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }

  function addMonths(s, n) {
    var d = parse(s);
    if (!d) return null;
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return dateStr(d);
  }

  /* 週は月曜始まり */
  function startOfWeek(s) {
    var d = parse(s);
    if (!d) return null;
    var w = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - w);
    return dateStr(d);
  }

  function startOfMonth(s) {
    if (!isValidDate(s)) return null;
    return s.slice(0, 7) + '-01';
  }

  /* b - a （日数）。時刻を持たないので DST の影響を受けにくいよう丸める */
  function diffDays(a, b) {
    var da = parse(a), db = parse(b);
    if (!da || !db) return 0;
    return Math.round((db.getTime() - da.getTime()) / 86400000);
  }

  /* '2026-08-30' -> '8/30' */
  function mdLabel(s) {
    var d = parse(s);
    if (!d) return s;
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  /* '2026-08-30' -> '2026年8月30日(日)' */
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  function longLabel(s) {
    var d = parse(s);
    if (!d) return s;
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日(' + WD[d.getDay()] + ')';
  }

  /* ---- 数値 ---- */
  function fmt(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString('ja-JP');
  }

  function fmtSigned(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    var r = Math.round(n);
    return (r > 0 ? '+' : r < 0 ? '-' : '±') + Math.abs(r).toLocaleString('ja-JP');
  }

  function fmtRate(p) {
    if (p === null || p === undefined || !isFinite(p)) return '—';
    var v = Math.round(p * 10) / 10;
    return (v > 0 ? '+' : v < 0 ? '-' : '±') + Math.abs(v).toFixed(1) + '%';
  }

  function trimZero(x) {
    if (x.indexOf('.') < 0) return x;
    return x.replace(/0+$/, '').replace(/\.$/, '');
  }

  /* 軸ラベル向けの短縮表記: 12,345,678 -> '1234万' */
  function fmtShort(n) {
    if (n === null || n === undefined || !isFinite(n)) return '';
    var a = Math.abs(n), s = n < 0 ? '-' : '';
    function unit(v, u) {
      var x = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
      return s + trimZero(x) + u;
    }
    if (a >= 1e12) return unit(a / 1e12, '兆');
    if (a >= 1e8) return unit(a / 1e8, '億');
    if (a >= 1e4) return unit(a / 1e4, '万');
    return s + Math.round(a).toLocaleString('ja-JP');
  }

  /* '12,345,678' / '1.2億' / '3500万' / '12m' などを整数に */
  function parseAmount(str) {
    if (typeof str === 'number') return isFinite(str) ? Math.round(str) : null;
    var s = String(str === null || str === undefined ? '' : str).trim();
    if (!s) return null;
    /* 全角英数字・記号を半角へ */
    s = s.replace(/[０-９Ａ-Ｚａ-ｚ．＋－]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/[,，\s]/g, '');
    s = s.replace(/(ギル|gil)$/i, '');
    var m = /^([+-]?\d+(?:\.\d+)?)(兆|億|万|k|m|b)?$/i.exec(s);
    if (!m) return null;
    var v = parseFloat(m[1]);
    if (!isFinite(v)) return null;
    var u = (m[2] || '').toLowerCase();
    var mul = u === '兆' ? 1e12 : u === '億' ? 1e8 : u === '万' ? 1e4
      : u === 'k' ? 1e3 : u === 'm' ? 1e6 : u === 'b' ? 1e9 : 1;
    var out = v * mul;
    if (!isFinite(out) || Math.abs(out) > 9e15) return null;
    return Math.round(out);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    dateStr: dateStr, today: today, parse: parse, isValidDate: isValidDate,
    addDays: addDays, addMonths: addMonths, startOfWeek: startOfWeek,
    startOfMonth: startOfMonth, diffDays: diffDays,
    mdLabel: mdLabel, longLabel: longLabel,
    fmt: fmt, fmtSigned: fmtSigned, fmtRate: fmtRate, fmtShort: fmtShort,
    parseAmount: parseAmount, uid: uid, esc: esc
  };
})();
  FF14.assets.U = U;
})();
