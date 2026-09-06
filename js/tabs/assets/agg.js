/* agg.js — 元 ff14-assets/js/agg.js。中身は無変更で、グローバルを汚さないよう
   IIFEで包んで FF14.assets.Agg として公開しているだけです。 */
(function () {
  var U = FF14.assets.U;
/* ===== 期間の切り出し・粒度の自動選択・増減の集計 =====

   粒度の方針
     週     : 直近7日  を「日次」
     月     : 直近31日 を「日次」
     年     : 直近52週 を「週次」（各週の最終記録＝週末時点の資産）
     全期間 : 記録の全長に応じて自動（〜120日=日次 / 〜500日=週次 / それ以上=月次）

   総資産は累積値なので、バケット内は平均ではなく「最後の記録」を代表値にします。
   記録のない日は null にして線でつなぎます（0 で埋めない）。 */
var Agg = (function () {
  'use strict';

  var PERIODS = [
    { key: 'week', label: '週' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
    { key: 'all', label: '全期間' }
  ];

  var GRAN_LABEL = { day: '日次', week: '週次', month: '月次' };

  /* 日ごとの代表値（その日の最後の記録の額） */
  function dailyMap(records) {
    var map = {}, dates = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (!Object.prototype.hasOwnProperty.call(map, r.date)) dates.push(r.date);
      map[r.date] = r.amount; /* records は昇順なので後勝ち */
    }
    dates.sort();
    return { map: map, dates: dates };
  }

  function rangeOf(period, daily) {
    var today = U.today();
    var last = daily.dates.length ? daily.dates[daily.dates.length - 1] : today;
    var end = last > today ? last : today; /* 先の日付を入れていても切り落とさない */
    var start;
    if (period === 'week') start = U.addDays(end, -6);
    else if (period === 'month') start = U.addDays(end, -30);
    else if (period === 'year') start = U.addDays(U.startOfWeek(end), -7 * 51);
    else start = daily.dates.length ? daily.dates[0] : end;
    if (start > end) start = end;
    return { start: start, end: end };
  }

  function granularityOf(period, start, end) {
    if (period === 'week' || period === 'month') return 'day';
    if (period === 'year') return 'week';
    var span = U.diffDays(start, end) + 1;
    if (span <= 120) return 'day';
    if (span <= 500) return 'week';
    return 'month';
  }

  function bucketKey(g, date) {
    if (g === 'day') return date;
    if (g === 'week') return U.startOfWeek(date);
    return U.startOfMonth(date);
  }

  function buildBuckets(g, start, end) {
    var out = [], cur, limit = 5000;
    if (g === 'day') {
      cur = start;
      while (cur <= end && out.length < limit) { out.push(cur); cur = U.addDays(cur, 1); }
    } else if (g === 'week') {
      cur = U.startOfWeek(start);
      var ew = U.startOfWeek(end);
      while (cur <= ew && out.length < limit) { out.push(cur); cur = U.addDays(cur, 7); }
    } else {
      cur = U.startOfMonth(start);
      var em = U.startOfMonth(end);
      while (cur <= em && out.length < limit) { out.push(cur); cur = U.addMonths(cur, 1); }
    }
    if (!out.length) out.push(bucketKey(g, start));
    return out;
  }

  function labelOf(g, key) {
    if (g === 'day') return U.mdLabel(key);
    if (g === 'week') return U.mdLabel(key) + '〜';
    var d = U.parse(key);
    return d ? (d.getFullYear() + '/' + (d.getMonth() + 1)) : key;
  }

  function fullLabelOf(g, key) {
    if (g === 'day') return U.longLabel(key);
    if (g === 'week') {
      var e = U.addDays(key, 6);
      return U.mdLabel(key) + '〜' + U.mdLabel(e) + ' の週';
    }
    var d = U.parse(key);
    return d ? (d.getFullYear() + '年' + (d.getMonth() + 1) + '月') : key;
  }

  /* グラフ用の系列を作る */
  function series(records, period) {
    var daily = dailyMap(records);
    var r = rangeOf(period, daily);
    var g = granularityOf(period, r.start, r.end);
    var keys = buildBuckets(g, r.start, r.end);

    var idx = {};
    for (var i = 0; i < keys.length; i++) idx[keys[i]] = i;

    var values = new Array(keys.length);
    for (var j = 0; j < keys.length; j++) values[j] = null;

    var dates = [];
    for (var k = 0; k < keys.length; k++) dates[k] = null; /* そのバケットの代表日 */

    for (var n = 0; n < daily.dates.length; n++) {
      var d = daily.dates[n];
      if (d < r.start || d > r.end) continue;
      var bk = bucketKey(g, d);
      if (!Object.prototype.hasOwnProperty.call(idx, bk)) continue;
      values[idx[bk]] = daily.map[d]; /* 昇順なので後勝ち＝バケット内の最終記録 */
      dates[idx[bk]] = d;
    }

    var labels = keys.map(function (key) { return labelOf(g, key); });
    var fullLabels = keys.map(function (key) { return fullLabelOf(g, key); });

    return {
      period: period,
      granularity: g,
      granularityLabel: GRAN_LABEL[g],
      start: r.start,
      end: r.end,
      keys: keys,
      labels: labels,
      fullLabels: fullLabels,
      values: values,
      pointDates: dates,
      daily: daily
    };
  }

  /* 期間の増減サマリ
     基準額 = 期間開始より前の直近記録（あればそれ）。無ければ期間内の最初の記録。 */
  function summary(s) {
    var daily = s.daily;
    var base = null, baseDate = null;
    var firstIn = null, firstInDate = null;
    var lastIn = null, lastInDate = null;
    var min = null, max = null, minDate = null, maxDate = null, count = 0;

    for (var i = 0; i < daily.dates.length; i++) {
      var d = daily.dates[i], v = daily.map[d];
      if (d < s.start) { base = v; baseDate = d; continue; }
      if (d > s.end) break;
      if (firstIn === null) { firstIn = v; firstInDate = d; }
      lastIn = v; lastInDate = d; count++;
      if (min === null || v < min) { min = v; minDate = d; }
      if (max === null || v > max) { max = v; maxDate = d; }
    }

    if (lastIn === null) {
      return { empty: true, count: 0, totalRecords: daily.dates.length };
    }

    var startVal = (base !== null) ? base : firstIn;
    var startRef = (base !== null) ? baseDate : firstInDate;
    var delta = lastIn - startVal;
    var rate = (startVal !== 0) ? (delta / Math.abs(startVal)) * 100 : null;
    var days = U.diffDays(startRef, lastInDate);
    var perDay = days > 0 ? delta / days : null;

    return {
      empty: false,
      count: count,
      startVal: startVal,
      startRef: startRef,
      baseIsPrev: base !== null,
      endVal: lastIn,
      endDate: lastInDate,
      delta: delta,
      rate: rate,
      min: min, minDate: minDate,
      max: max, maxDate: maxDate,
      perDay: perDay,
      spanDays: days
    };
  }

  /* 一覧用: 記録ID -> 前回比（1つ前の記録との差） */
  function prevDiffMap(records) {
    var m = {}, prev = null;
    for (var i = 0; i < records.length; i++) {
      m[records[i].id] = (prev === null) ? null : records[i].amount - prev;
      prev = records[i].amount;
    }
    return m;
  }

  return {
    PERIODS: PERIODS,
    series: series,
    summary: summary,
    prevDiffMap: prevDiffMap,
    dailyMap: dailyMap
  };
})();
  FF14.assets.Agg = Agg;
})();
