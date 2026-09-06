/* ===== タブ「総資産」: 総資産記録帳 =====
   元 ff14-assets/js/app.js。中身は無変更で、先頭に名前空間からの別名だけ足しています。
   末尾の自動起動を、タブ登録（初回表示時に init）へ差し替えました。 */
(function () {
  'use strict';
  var U = FF14.assets.U, Store = FF14.assets.Store,
      Agg = FF14.assets.Agg, ChartView = FF14.assets.ChartView;


  /* ---------- 汎用モーダル ---------- */
  var Modal = (function () {
    var back, titleEl, bodyEl, btnsEl, resolve = null;

    function ensure() {
      if (back) return;
      back = document.getElementById('modal');
      titleEl = document.getElementById('modalTitle');
      bodyEl = document.getElementById('modalBody');
      btnsEl = document.getElementById('modalButtons');
      back.addEventListener('click', function (e) {
        if (e.target === back) close(null);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && back.classList.contains('open')) close(null);
      });
    }

    function close(value) {
      if (!back) return;
      back.classList.remove('open');
      var r = resolve; resolve = null;
      if (r) r(value);
    }

    /* opts: {title, html, buttons:[{label,value,variant}]} */
    function open(opts) {
      ensure();
      titleEl.textContent = opts.title || '';
      bodyEl.innerHTML = opts.html || '';
      btnsEl.innerHTML = '';
      (opts.buttons || []).forEach(function (b) {
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'btn ' + (b.variant || '');
        el.textContent = b.label;
        el.addEventListener('click', function () { close(b.value); });
        btnsEl.appendChild(el);
      });
      back.classList.add('open');
      var first = btnsEl.querySelector('button');
      if (first) first.focus();
      return new Promise(function (res) { resolve = res; });
    }

    return { open: open, close: close };
  })();

  /* ---------- トースト ---------- */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  /* ---------- 要素 ---------- */
  var el = {};
  var editingId = null;

  function $(id) { return document.getElementById(id); }

  function cache() {
    ['form', 'date', 'amount', 'memo', 'submitBtn', 'cancelEdit', 'formHint', 'formError',
      'editBadge', 'todayBtn', 'currentAmount', 'currentSub', 'periodTabs', 'granularity',
      'statDelta', 'statRate', 'statRange', 'statCount', 'statMax', 'statMin', 'statPerDay',
      'chartCanvas', 'chartFallback', 'chartEmpty', 'tableBody', 'tableEmpty', 'tableLimit',
      'exportBtn', 'importBtn', 'importFile', 'sampleBtn', 'clearBtn', 'storageInfo', 'recordCount',
      'calcToggle', 'calcPanel', 'calcRows', 'calcAddRow', 'calcClear', 'calcTotal', 'calcCopyBtn'
    ].forEach(function (id) { el[id] = $(id); });
  }

  /* ---------- 表示 ---------- */
  function currentPeriod() { return Store.settings().period; }

  function renderHeader() {
    var last = Store.latest();
    if (!last) {
      el.currentAmount.textContent = '—';
      el.currentSub.textContent = 'まだ記録がありません';
      el.recordCount.textContent = '0';
      return;
    }
    el.currentAmount.textContent = U.fmt(last.amount);
    var prev = Store.lastBefore(last.date);
    var sub = U.longLabel(last.date) + ' 時点';
    if (prev) {
      var d = last.amount - prev.amount;
      var r = prev.amount !== 0 ? (d / Math.abs(prev.amount)) * 100 : null;
      sub += ' ／ 前回比 ' + U.fmtSigned(d) + (r === null ? '' : '（' + U.fmtRate(r) + '）');
    }
    el.currentSub.textContent = sub;
    el.recordCount.textContent = String(Store.all().length);
  }

  function setDeltaClass(node, v) {
    node.classList.remove('up', 'down', 'flat');
    node.classList.add(v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
  }

  function renderChart() {
    var s = Agg.series(Store.all(), currentPeriod());
    var sum = Agg.summary(s);

    el.granularity.textContent = s.granularityLabel;

    if (sum.empty) {
      el.statDelta.textContent = '—';
      el.statDelta.className = 'stat-value';
      el.statRate.textContent = '—';
      el.statRange.textContent = s.start + ' 〜 ' + s.end;
      el.statCount.textContent = '0 日';
      el.statMax.textContent = '—';
      el.statMin.textContent = '—';
      el.statPerDay.textContent = '—';
    } else {
      el.statDelta.textContent = U.fmtSigned(sum.delta) + ' ギル';
      el.statDelta.className = 'stat-value';
      setDeltaClass(el.statDelta, sum.delta);
      el.statRate.textContent = U.fmtRate(sum.rate);
      el.statRate.className = 'stat-rate';
      setDeltaClass(el.statRate, sum.delta);
      el.statRange.textContent = s.start + ' 〜 ' + s.end +
        (sum.baseIsPrev ? '（基準: ' + sum.startRef + ' の ' + U.fmt(sum.startVal) + '）'
          : '（基準: 期間内最初の ' + U.fmt(sum.startVal) + '）');
      el.statCount.textContent = sum.count + ' 日';
      el.statMax.textContent = U.fmtShort(sum.max) + '（' + U.mdLabel(sum.maxDate) + '）';
      el.statMin.textContent = U.fmtShort(sum.min) + '（' + U.mdLabel(sum.minDate) + '）';
      el.statPerDay.textContent = sum.perDay === null ? '—' : U.fmtSigned(sum.perDay) + ' /日';
    }

    var hasPoint = false;
    for (var i = 0; i < s.values.length; i++) if (s.values[i] !== null) { hasPoint = true; break; }

    if (!ChartView.available()) {
      el.chartFallback.hidden = false;
      el.chartEmpty.hidden = true;
      return;
    }
    el.chartFallback.hidden = true;
    el.chartEmpty.hidden = hasPoint;
    ChartView.render(s);
  }

  function renderTable() {
    var recs = Store.all().slice().reverse(); /* 新しい順 */
    var diffs = Agg.prevDiffMap(Store.all());
    var limit = Store.settings().tableLimit;
    var shown = limit > 0 ? recs.slice(0, limit) : recs;

    if (!shown.length) {
      el.tableBody.innerHTML = '';
      el.tableEmpty.hidden = false;
      return;
    }
    el.tableEmpty.hidden = true;

    var sameDay = {};
    Store.all().forEach(function (r) { sameDay[r.date] = (sameDay[r.date] || 0) + 1; });

    var html = shown.map(function (r) {
      var d = diffs[r.id];
      var cls = d === null || d === undefined ? 'flat' : d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
      var diffTxt = (d === null || d === undefined) ? '—' : U.fmtSigned(d);
      var multi = sameDay[r.date] > 1 ? ' <span class="pill">同日' + sameDay[r.date] + '件</span>' : '';
      return '<tr>' +
        '<td class="c-date">' + U.esc(r.date) + multi + '</td>' +
        '<td class="c-amount">' + U.fmt(r.amount) + '</td>' +
        '<td class="c-diff ' + cls + '">' + diffTxt + '</td>' +
        '<td class="c-memo">' + U.esc(r.memo) + '</td>' +
        '<td class="c-act">' +
        '<button type="button" class="mini" data-act="edit" data-id="' + U.esc(r.id) + '">編集</button>' +
        '<button type="button" class="mini danger" data-act="del" data-id="' + U.esc(r.id) + '">削除</button>' +
        '</td></tr>';
    }).join('');

    if (limit > 0 && recs.length > limit) {
      html += '<tr class="more"><td colspan="5">ほか ' + (recs.length - limit) + ' 件（表示件数を変えると増やせます）</td></tr>';
    }
    el.tableBody.innerHTML = html;
  }

  function renderStorage() {
    var b = Store.usageBytes();
    el.storageInfo.textContent = '記録 ' + Store.all().length + ' 件 / localStorage 約 ' +
      (b / 1024).toFixed(1) + ' KB（キー: ' + Store.KEY_REC + '）';
  }

  function renderAll() {
    renderHeader();
    renderChart();
    renderTable();
    renderStorage();
    updateFormHint();
  }

  /* ---------- フォーム ---------- */
  function prevForDate(date, excludeId) {
    var recs = Store.all(), found = null;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.id === excludeId) continue;
      if (r.date <= date) found = r; else break;
    }
    return found;
  }

  function updateFormHint() {
    var date = el.date.value;
    var raw = el.amount.value;
    var amount = U.parseAmount(raw);

    if (raw && amount === null) {
      el.formHint.textContent = '数値として読み取れません（例: 12345678 / 12,345,678 / 1.2億）';
      el.formHint.className = 'form-hint warn';
      return;
    }
    if (!U.isValidDate(date)) {
      el.formHint.textContent = '';
      el.formHint.className = 'form-hint';
      return;
    }
    var prev = prevForDate(date, editingId);
    if (amount === null) {
      el.formHint.textContent = prev
        ? '直前の記録: ' + prev.date + ' ' + U.fmt(prev.amount) + ' ギル'
        : '最初の記録になります';
      el.formHint.className = 'form-hint';
      return;
    }
    if (!prev) {
      el.formHint.textContent = U.fmt(amount) + ' ギル（最初の記録）';
      el.formHint.className = 'form-hint';
      return;
    }
    var d = amount - prev.amount;
    var r = prev.amount !== 0 ? (d / Math.abs(prev.amount)) * 100 : null;
    el.formHint.textContent = U.fmt(amount) + ' ギル ／ ' + prev.date + ' から ' +
      U.fmtSigned(d) + (r === null ? '' : '（' + U.fmtRate(r) + '）');
    el.formHint.className = 'form-hint ' + (d > 0 ? 'up' : d < 0 ? 'down' : '');
  }

  function showError(msg) {
    el.formError.textContent = msg || '';
    el.formError.hidden = !msg;
  }

  function enterEdit(id) {
    var r = Store.get(id);
    if (!r) return;
    editingId = id;
    el.date.value = r.date;
    el.amount.value = String(r.amount);
    el.memo.value = r.memo;
    el.submitBtn.textContent = '更新する';
    el.editBadge.hidden = false;
    el.cancelEdit.hidden = false;
    showError('');
    updateFormHint();
    el.amount.focus();
    el.amount.select();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exitEdit() {
    editingId = null;
    el.submitBtn.textContent = '記録する';
    el.editBadge.hidden = true;
    el.cancelEdit.hidden = true;
    el.amount.value = '';
    el.memo.value = '';
    el.date.value = U.today();
    showError('');
    updateFormHint();
  }

  function afterSave(msg) {
    exitEdit();
    renderAll();
    toast(msg);
  }

  function onSubmit(e) {
    e.preventDefault();
    var date = el.date.value;
    var amount = U.parseAmount(el.amount.value);
    var memo = el.memo.value.trim();

    if (!U.isValidDate(date)) { showError('日付を正しく入力してください。'); el.date.focus(); return; }
    if (amount === null) { showError('総資産額を数値で入力してください（例: 12345678 / 1.2億）。'); el.amount.focus(); return; }
    if (amount < 0) { showError('総資産額に負の値は入力できません。'); el.amount.focus(); return; }
    showError('');

    if (editingId) {
      Store.update(editingId, { date: date, amount: amount, memo: memo });
      afterSave('記録を更新しました');
      return;
    }

    var same = Store.byDate(date);
    if (!same.length) {
      Store.add({ date: date, amount: amount, memo: memo });
      afterSave('記録しました');
      return;
    }
    askDuplicate(date, same, { date: date, amount: amount, memo: memo });
  }

  function askDuplicate(date, same, data) {
    var rows = same.map(function (r) {
      return '<li><b>' + U.fmt(r.amount) + '</b> ギル' +
        (r.memo ? ' <span class="dim">' + U.esc(r.memo) + '</span>' : '') + '</li>';
    }).join('');

    var html =
      '<p>' + U.longLabel(date) + ' には既に <b>' + same.length + '件</b> の記録があります。</p>' +
      '<ul class="modal-list">' + rows + '</ul>' +
      '<p class="dim">これから記録する額: <b>' + U.fmt(data.amount) + '</b> ギル</p>' +
      '<p class="dim">グラフと集計はその日の<b>最後の記録</b>を使います。</p>';

    Modal.open({
      title: '同じ日の記録があります',
      html: html,
      buttons: [
        { label: '上書きする', value: 'replace', variant: 'primary' },
        { label: '追記する', value: 'append', variant: '' },
        { label: 'キャンセル', value: null, variant: 'ghost' }
      ]
    }).then(function (v) {
      if (v === 'replace') {
        Store.replaceDate(date, data);
        afterSave('その日の記録を上書きしました');
      } else if (v === 'append') {
        Store.add(data);
        afterSave('同じ日に追記しました');
      }
    });
  }

  /* ---------- 一覧の操作 ---------- */
  function onTableClick(e) {
    var btn = e.target.closest ? e.target.closest('button[data-act]') : null;
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    if (act === 'edit') { enterEdit(id); return; }
    if (act === 'del') {
      var r = Store.get(id);
      if (!r) return;
      Modal.open({
        title: '記録を削除しますか？',
        html: '<p>' + U.longLabel(r.date) + '<br><b>' + U.fmt(r.amount) + '</b> ギル' +
          (r.memo ? '<br><span class="dim">' + U.esc(r.memo) + '</span>' : '') + '</p>',
        buttons: [
          { label: '削除する', value: 'yes', variant: 'danger' },
          { label: 'キャンセル', value: null, variant: 'ghost' }
        ]
      }).then(function (v) {
        if (v !== 'yes') return;
        if (editingId === id) exitEdit();
        Store.remove(id);
        renderAll();
        toast('削除しました');
      });
    }
  }

  /* ---------- 期間タブ ---------- */
  function setPeriod(p) {
    Store.saveSettings({ period: p });
    Array.prototype.forEach.call(el.periodTabs.querySelectorAll('button'), function (b) {
      var on = b.getAttribute('data-period') === p;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderChart();
  }

  /* ---------- データ管理 ---------- */
  function doExport() {
    var obj = Store.exportObject();
    if (!obj.records.length) { toast('記録がまだありません', 'warn'); return; }
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ff14-assets-' + U.today() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(obj.records.length + ' 件をエクスポートしました');
  }

  function doImportText(text) {
    var parsed = Store.parseImport(text);
    if (!parsed.ok) { toast(parsed.error, 'warn'); return; }

    var html =
      '<p>読み込んだ記録: <b>' + parsed.records.length + ' 件</b>' +
      (parsed.skipped ? '<br><span class="dim">形式が不正な ' + parsed.skipped + ' 件は除外しました</span>' : '') + '</p>' +
      '<p class="dim">期間: ' + parsed.records[0].date + ' 〜 ' + parsed.records[parsed.records.length - 1].date + '</p>' +
      '<p class="dim">現在の記録: ' + Store.all().length + ' 件</p>';

    Modal.open({
      title: 'インポート方法を選んでください',
      html: html,
      buttons: [
        { label: '置き換える', value: 'replace', variant: 'primary' },
        { label: '追加する（マージ）', value: 'merge', variant: '' },
        { label: 'キャンセル', value: null, variant: 'ghost' }
      ]
    }).then(function (mode) {
      if (!mode) return;
      var res = Store.applyImport(parsed, mode);
      exitEdit();
      renderAll();
      toast(mode === 'replace'
        ? res.added + ' 件で置き換えました'
        : res.added + ' 件を追加しました' + (res.duplicated ? '（重複 ' + res.duplicated + ' 件はスキップ）' : ''));
    });
  }

  function onImportFile(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { doImportText(String(reader.result)); };
    reader.onerror = function () { toast('ファイルを読み込めませんでした', 'warn'); };
    reader.readAsText(f);
    e.target.value = '';
  }

  function doSample() {
    Modal.open({
      title: 'サンプルデータを生成',
      html: '<p>動作確認用に <b>365日分</b> の日次記録を生成します。</p>' +
        '<p class="dim">現在の記録はすべて置き換えられます。必要なら先にエクスポートしてください。</p>',
      buttons: [
        { label: '生成する', value: 'yes', variant: 'primary' },
        { label: 'キャンセル', value: null, variant: 'ghost' }
      ]
    }).then(function (v) {
      if (v !== 'yes') return;
      var memos = ['零式ドロップ売却', '素材まとめ買い', '週課消化', 'マケボ整理', '',
        '', '', 'ハウジング支払い', '討滅戦周回', ''];
      var recs = [];
      var amount = 8000000;
      var now = Date.now();
      var start = U.addDays(U.today(), -364);
      for (var i = 0; i < 365; i++) {
        var date = U.addDays(start, i);
        var drift = 45000;
        var noise = (Math.random() - 0.42) * 900000;
        amount = Math.max(200000, Math.round(amount + drift + noise));
        if (Math.random() < 0.03) amount = Math.max(200000, amount - Math.round(Math.random() * 4000000));
        recs.push({
          date: date,
          amount: amount,
          memo: memos[Math.floor(Math.random() * memos.length)],
          /* 「その日の夜に記録した」体で、ただし未来にはしない */
          createdAt: new Date(Math.min(U.parse(date).getTime() + 23 * 3600000, now - 60000)).toISOString()
        });
      }
      Store.replaceAll(recs);
      exitEdit();
      renderAll();
      toast('365件のサンプルを生成しました');
    });
  }

  function doClear() {
    Modal.open({
      title: 'すべての記録を削除しますか？',
      html: '<p>現在 <b>' + Store.all().length + ' 件</b> の記録があります。この操作は元に戻せません。</p>' +
        '<p class="dim">先にエクスポートしておくことをおすすめします。</p>',
      buttons: [
        { label: 'すべて削除', value: 'yes', variant: 'danger' },
        { label: 'キャンセル', value: null, variant: 'ghost' }
      ]
    }).then(function (v) {
      if (v !== 'yes') return;
      Store.clearAll();
      exitEdit();
      renderAll();
      toast('すべて削除しました');
    });
  }

  /* ---------- 電卓（手持ち・リテイナー・倉庫などの内訳合計） ----------
     行の状態は id で管理する。入力のたびに全体を再描画するとフォーカスが
     飛ぶので、入力中は state の更新のみ行い、行の追加/削除のときだけ描き直す。 */
  var calcRows = [];
  var calcPersistTimer = null;

  function calcBlankRow() { return { id: U.uid(), label: '', amount: '' }; }

  function calcFindRow(id) {
    for (var i = 0; i < calcRows.length; i++) if (calcRows[i].id === id) return calcRows[i];
    return null;
  }

  function calcTotalValue() {
    var sum = 0;
    for (var i = 0; i < calcRows.length; i++) {
      var v = U.parseAmount(calcRows[i].amount);
      if (v !== null) sum += v;
    }
    return sum;
  }

  function calcRecalc() {
    el.calcTotal.textContent = U.fmt(calcTotalValue());
  }

  function calcRenderRows() {
    el.calcRows.innerHTML = calcRows.map(function (r) {
      return '<div class="calc-row" data-id="' + U.esc(r.id) + '">' +
        '<input type="text" class="calc-label" placeholder="手持ち / リテイナー / 倉庫 など" value="' + U.esc(r.label) + '">' +
        '<input type="text" class="calc-amount" inputmode="numeric" placeholder="0" value="' + U.esc(r.amount) + '">' +
        '<button type="button" class="mini calc-del" aria-label="この行を削除">×</button>' +
        '</div>';
    }).join('');
    calcRecalc();
  }

  function calcPersist() {
    var meaningful = calcRows.filter(function (r) { return r.label.trim() !== '' || r.amount.trim() !== ''; });
    Store.saveCalcDraft(meaningful.map(function (r) { return { label: r.label, amount: r.amount }; }));
  }

  function calcPersistSoon() {
    if (calcPersistTimer) clearTimeout(calcPersistTimer);
    calcPersistTimer = setTimeout(calcPersist, 400);
  }

  function calcSetOpen(open) {
    el.calcPanel.hidden = !open;
    el.calcToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    el.calcToggle.classList.toggle('active', open);
    el.calcToggle.textContent = open ? '閉じる' : '電卓';
    if (open && el.calcRows.children.length) {
      var first = el.calcRows.querySelector('.calc-label');
      if (first) first.focus();
    }
  }

  function calcInit() {
    var draft = Store.calcDraft();
    calcRows = draft.length
      ? draft.map(function (r) { return { id: U.uid(), label: r.label, amount: r.amount }; })
      : [calcBlankRow(), calcBlankRow()];
    calcRenderRows();
    /* 前回入力の途中があれば、最初から開いておく */
    calcSetOpen(draft.length > 0);
  }

  function calcBindEvents() {
    el.calcToggle.addEventListener('click', function () {
      calcSetOpen(el.calcPanel.hidden);
    });

    el.calcRows.addEventListener('input', function (e) {
      var row = e.target.closest ? e.target.closest('.calc-row') : null;
      if (!row) return;
      var r = calcFindRow(row.getAttribute('data-id'));
      if (!r) return;
      if (e.target.classList.contains('calc-label')) r.label = e.target.value;
      else if (e.target.classList.contains('calc-amount')) r.amount = e.target.value;
      calcRecalc();
      calcPersistSoon();
    });

    el.calcRows.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.calc-del') : null;
      if (!btn) return;
      var row = btn.closest('.calc-row');
      var id = row.getAttribute('data-id');
      calcRows = calcRows.filter(function (r) { return r.id !== id; });
      calcRenderRows();
      calcPersist();
    });

    el.calcAddRow.addEventListener('click', function () {
      calcRows.push(calcBlankRow());
      calcRenderRows();
      var labels = el.calcRows.querySelectorAll('.calc-label');
      if (labels.length) labels[labels.length - 1].focus();
    });

    el.calcClear.addEventListener('click', function () {
      calcRows = [calcBlankRow(), calcBlankRow()];
      calcRenderRows();
      calcPersist();
    });

    el.calcCopyBtn.addEventListener('click', function () {
      var total = calcTotalValue();
      el.amount.value = String(total);
      updateFormHint();
      toast('合計 ' + U.fmt(total) + ' ギルを総資産額にコピーしました');
    });
  }

  /* ---------- 初期化 ---------- */
  function bind() {
    el.form.addEventListener('submit', onSubmit);
    el.cancelEdit.addEventListener('click', exitEdit);
    el.todayBtn.addEventListener('click', function () {
      el.date.value = U.today();
      updateFormHint();
    });
    el.amount.addEventListener('input', updateFormHint);
    el.date.addEventListener('change', updateFormHint);

    el.periodTabs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-period]') : null;
      if (b) setPeriod(b.getAttribute('data-period'));
    });

    el.tableBody.addEventListener('click', onTableClick);
    el.tableLimit.addEventListener('change', function () {
      Store.saveSettings({ tableLimit: Number(el.tableLimit.value) });
      renderTable();
    });

    el.exportBtn.addEventListener('click', doExport);
    el.importBtn.addEventListener('click', function () { el.importFile.click(); });
    el.importFile.addEventListener('change', onImportFile);
    el.sampleBtn.addEventListener('click', doSample);
    el.clearBtn.addEventListener('click', doClear);

    calcBindEvents();

    var rt = null;
    window.addEventListener('resize', function () {
      if (rt) clearTimeout(rt);
      rt = setTimeout(function () { ChartView.resize(); }, 150);
    });

    /* Chart.js は非同期に読み込むので、届いたら描き直す */
    document.addEventListener('chartjs-ready', renderChart);
    document.addEventListener('chartjs-failed', renderChart);

    /* 別タブでの更新を反映 */
    window.addEventListener('storage', function (e) {
      if (e.key === Store.KEY_REC) { Store.init(); renderAll(); }
    });
  }

  function start() {
    cache();
    Store.init();
    ChartView.init(el.chartCanvas);
    bind();
    calcInit();

    el.date.value = U.today();
    el.date.max = U.addDays(U.today(), 365);
    el.tableLimit.value = String(Store.settings().tableLimit);
    setPeriod(Store.settings().period);
    renderAll();
  }

  /* 起動はタブが最初に開かれたときに1回だけ（グラフは表示された状態で作りたいので遅延）。
     再表示のたびに描き直して、非表示中に変わったサイズにも追従させる。 */
  FF14.assets.App = { init: start, render: renderAll };

  FF14.core.Tabs.register('assets', {
    eager: false,
    init: start,
    onShow: function () { renderChart(); ChartView.resize(); }
  });
})();
