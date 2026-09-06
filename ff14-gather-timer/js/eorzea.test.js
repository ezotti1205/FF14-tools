// eorzea.js の単体テスト。tests.html から実行される（クラシックスクリプト）。
window.runEorzeaTests = function (t) {
  var E = window.Eorzea;

  // --- 基本変換 ---
  t.approx('getEorzeaMs は unix×(3600/175)', E.getEorzeaMs(175000), 3600000, 1e-6);
  t.approx('現実70分 = ET1日(86,400,000ms)', E.getEorzeaMs(70 * 60 * 1000), E.ET_MS_PER_DAY, 1e-3);
  t.approx('etMsToRealMs は逆変換', E.etMsToRealMs(3600000), 175000, 1e-6);
  t.approx('現実1秒 ≒ ET20.571秒', E.getEorzeaMs(1000) / 1000, 20.5714, 1e-3);

  // --- エオルゼア時刻 ---
  t.eq('unix=0 の時 ET 00:00', E.formatEorzeaTime(0), '00:00');
  var p0 = E.getEorzeaTimeParts(0);
  t.eq('unix=0 hours', p0.hours, 0);
  t.eq('unix=0 minutes', p0.minutes, 0);
  var realFor12h = E.etMsToRealMs(12 * 3600 * 1000);
  t.eq('ET12:00 表示', E.formatEorzeaTime(realFor12h), '12:00');

  // --- nextOccurrence: 現在アクティブ ---
  var now1 = E.etMsToRealMs(3 * 3600 * 1000); // ET03:00
  var o1 = E.nextOccurrence({ startET: 0, durationET: 4 }, now1);
  t.ok('ET3時は 0-4時ウィンドウでアクティブ', o1.active);
  t.approx('終了まで現実175,000ms', o1.endsAt - now1, 175000, 5);

  // --- nextOccurrence: 未出現、当日これから ---
  var now2 = E.etMsToRealMs(6 * 3600 * 1000); // ET06:00
  var o2 = E.nextOccurrence({ startET: 12, durationET: 4 }, now2);
  t.ok('ET6時、12時開始はまだ非アクティブ', !o2.active);
  t.approx('開始まで現実 6*175,000ms', o2.startsAt - now2, 6 * 175000, 10);

  // --- nextOccurrence: 当日分は終了済み → 翌日 ---
  var now3 = E.etMsToRealMs(10 * 3600 * 1000); // ET10:00
  var o3 = E.nextOccurrence({ startET: 0, durationET: 4 }, now3);
  t.ok('ET10時、0-4時は終了済みで非アクティブ', !o3.active);
  t.approx('翌日開始まで現実 14*175,000ms', o3.startsAt - now3, 14 * 175000, 20);

  // --- nextNodeOccurrence: 複数 spawn ---
  var spawns = [{ startET: 0, durationET: 4 }, { startET: 12, durationET: 4 }];
  var now4 = E.etMsToRealMs(9 * 3600 * 1000); // ET09:00
  var o4 = E.nextNodeOccurrence(spawns, now4);
  t.ok('どちらもアクティブでない', !o4.active);
  t.approx('近い方(ET12時)を選ぶ = 3*175,000ms', o4.startsAt - now4, 3 * 175000, 20);

  var now5 = E.etMsToRealMs(13 * 3600 * 1000); // ET13:00
  var o5 = E.nextNodeOccurrence(spawns, now5);
  t.ok('ET13時は12-16時ウィンドウでアクティブ', o5.active);

  // --- formatCountdown ---
  t.eq('90秒 → "1分30秒"', E.formatCountdown(90 * 1000), '1分30秒');
  t.eq('5秒 → "0分05秒"', E.formatCountdown(5 * 1000), '0分05秒');
  t.eq('2時間3分 → "2時間3分"', E.formatCountdown((2 * 3600 + 3 * 60) * 1000), '2時間3分');
  t.eq('負値は0扱い', E.formatCountdown(-5000), '0分00秒');
};
