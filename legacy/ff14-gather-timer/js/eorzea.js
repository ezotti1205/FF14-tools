// エオルゼア時間(ET)計算ユーティリティ（クラシックスクリプト: file:// でもそのまま動く）
// 現実の1秒 = ET 約20.571秒 / 1エオルゼア日 = 現実70分
// unixミリ秒 × (3600 / 175) を「エオルゼア時刻のミリ秒」として扱う
window.Eorzea = (function () {
  'use strict';

  var ET_TO_REAL = 175 / 3600;   // ETミリ秒 → 現実ミリ秒
  var REAL_TO_ET = 3600 / 175;   // 現実ミリ秒 → ETミリ秒
  var ET_MS_PER_HOUR = 60 * 60 * 1000;
  var ET_MS_PER_DAY = 24 * ET_MS_PER_HOUR;

  /** unixミリ秒をエオルゼア時刻のミリ秒(エポックからの通算)に変換 */
  function getEorzeaMs(unixMs) {
    if (unixMs === undefined) unixMs = Date.now();
    return unixMs * REAL_TO_ET;
  }

  /** ETミリ秒の差分を現実ミリ秒の差分に変換 */
  function etMsToRealMs(etMs) {
    return etMs * ET_TO_REAL;
  }

  /** その瞬間のエオルゼア時刻(時・分・秒) */
  function getEorzeaTimeParts(unixMs) {
    var etMs = getEorzeaMs(unixMs);
    var inDay = ((etMs % ET_MS_PER_DAY) + ET_MS_PER_DAY) % ET_MS_PER_DAY;
    var totalSeconds = Math.floor(inDay / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }

  /** "HH:MM" 形式のエオルゼア時刻 */
  function formatEorzeaTime(unixMs) {
    var p = getEorzeaTimeParts(unixMs);
    return String(p.hours).padStart(2, '0') + ':' + String(p.minutes).padStart(2, '0');
  }

  /**
   * 1つの spawn ({ startET, durationET } 単位: ET時。ET時刻で毎日繰り返し) について、
   * 「今アクティブか」「開始/終了の現実時刻(unixミリ秒)」を返す。
   */
  function nextOccurrence(spawn, unixMs) {
    if (unixMs === undefined) unixMs = Date.now();
    var etNow = getEorzeaMs(unixMs);
    var dayStart = Math.floor(etNow / ET_MS_PER_DAY) * ET_MS_PER_DAY;
    var startOffset = spawn.startET * ET_MS_PER_HOUR;
    var duration = spawn.durationET * ET_MS_PER_HOUR;
    var base = dayStart + startOffset;
    var candidates = [base - ET_MS_PER_DAY, base, base + ET_MS_PER_DAY];
    for (var i = 0; i < candidates.length; i++) {
      var winStart = candidates[i];
      var winEnd = winStart + duration;
      if (etNow < winEnd) {
        return {
          active: etNow >= winStart,
          startsAt: unixMs + etMsToRealMs(winStart - etNow),
          endsAt: unixMs + etMsToRealMs(winEnd - etNow),
        };
      }
    }
    return {
      active: false,
      startsAt: unixMs + etMsToRealMs(base + ET_MS_PER_DAY - etNow),
      endsAt: unixMs + etMsToRealMs(base + ET_MS_PER_DAY + duration - etNow),
    };
  }

  /**
   * ノードの spawns 配列から「最も注目すべき」出現を選ぶ。
   * アクティブなものを優先し、複数あれば終了が早い順 / 未出現なら開始が早い順。
   */
  function nextNodeOccurrence(spawns, unixMs) {
    var best = null;
    var list = spawns || [];
    for (var i = 0; i < list.length; i++) {
      var o = nextOccurrence(list[i], unixMs);
      if (!best) { best = o; continue; }
      if (o.active && !best.active) { best = o; continue; }
      if (o.active === best.active) {
        var key = o.active ? 'endsAt' : 'startsAt';
        if (o[key] < best[key]) best = o;
      }
    }
    return best;
  }

  /** ミリ秒を "X分Y秒" / 1時間以上は "H時間M分" で表記 */
  function formatCountdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + '時間' + m + '分';
    return m + '分' + String(sec).padStart(2, '0') + '秒';
  }

  return {
    ET_TO_REAL: ET_TO_REAL,
    REAL_TO_ET: REAL_TO_ET,
    ET_MS_PER_HOUR: ET_MS_PER_HOUR,
    ET_MS_PER_DAY: ET_MS_PER_DAY,
    getEorzeaMs: getEorzeaMs,
    etMsToRealMs: etMsToRealMs,
    getEorzeaTimeParts: getEorzeaTimeParts,
    formatEorzeaTime: formatEorzeaTime,
    nextOccurrence: nextOccurrence,
    nextNodeOccurrence: nextNodeOccurrence,
    formatCountdown: formatCountdown,
  };
})();
