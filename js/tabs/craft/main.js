/* ===== タブ「作る vs 買う」: 製作損益計算 =====
   元 ff14-craft-profit/js/main.js。変更点:
     ・設定ダイアログを廃止し、中身は「設定」タブへ移動（設定タブ側で配線する）
     ・起動処理を init() にまとめ、タブが最初に開かれたときに1回だけ走らせる
       （レシピDBの初回ダウンロードが約1.8MBあるため、開くまで取りに行かない）
     ・設定タブから呼べるように FF14.craft.api を公開 */
(function () {
  'use strict';

  var Store = FF14.craft.Store, GameData = FF14.craft.GameData,
      Universalis = FF14.craft.Universalis, Calc = FF14.craft.Calc, UI = FF14.craft.UI;

  var $ = UI.$;
  var el = {
    q: $('#q'),
    suggest: $('#suggest'),
    scope: $('#scope'),
    reload: $('#reload'),
    openSettings: $('#openSettings'),
    targetBar: $('#targetBar'),
    treeWrap: $('#treeWrap'),
    tree: $('#tree'),
    shopWrap: $('#shopWrap'),
    shop: $('#shop'),
    copyShop: $('#copyShop'),
    verdict: $('#verdict'),
    summary: $('#summary')
  };

  var settings = Store.getSettings();
  var state = Store.getState();
  var worldData = null;
  var lastResult = null;
  var busy = false;

  /* 通信中は検索欄の下にバーを走らせる（css/motion.css の .is-busy）。
     busy の付け外しと必ず対にすること。 */
  function setBusy(on) {
    busy = !!on;
    el.reload.disabled = !!on;
    var wrap = document.querySelector('#panel-craft .search-wrap');
    if (wrap) wrap.classList.toggle('is-busy', !!on);
  }

  // ---------------- フォーカス保持 ----------------
  function captureFocus() {
    var a = document.activeElement;
    if (!a) return null;
    if (a.id === 'qty') return { sel: '#qty', s: a.selectionStart, e: a.selectionEnd };
    if (a.classList && a.classList.contains('ovr')) {
      var row = a.closest('.trow');
      if (row) return { sel: '.trow[data-path="' + row.dataset.path + '"] .ovr', s: a.selectionStart, e: a.selectionEnd };
    }
    return null;
  }
  function restoreFocus(f) {
    if (!f) return;
    var node = document.querySelector(f.sel);
    if (!node) return;
    node.focus();
    try { node.setSelectionRange(f.s, f.e); } catch (e) {}
  }

  // ---------------- 描画 ----------------
  function render() {
    if (!state.itemId) {
      el.targetBar.className = 'target-bar empty';
      el.targetBar.textContent = 'アイテムを検索して選んでください。';
      el.treeWrap.hidden = true;
      el.shopWrap.hidden = true;
      el.verdict.className = 'verdict none';
      el.verdict.innerHTML = '<div class="v-label">判定</div><div class="v-main">—</div><div class="v-sub">アイテム未選択</div>';
      el.summary.innerHTML = '';
      return;
    }

    var f = captureFocus();
    var result;
    try {
      result = Calc.compute({
        itemId: state.itemId, qty: state.qty, scope: settings.scopeName,
        settings: settings, state: state
      });
    } catch (err) {
      console.error(err);
      UI.banner('計算中にエラーが発生しました: ' + err.message, 'err');
      return;
    }
    if (result.error) {
      el.targetBar.className = 'target-bar empty';
      el.targetBar.textContent = result.error;
      el.treeWrap.hidden = true;
      el.shopWrap.hidden = true;
      return;
    }
    lastResult = result;

    /* 対象バー・ツリー・買い物リストで同じアイテムが出るので、
       描画前にまとめてアイコンを解決しておく（XIVAPIへのリクエストが1回で済む） */
    try {
      FF14.core.Icons.prefetch(result.rows.map(function (r) { return r.itemId; }));
    } catch (e) {
      console.warn('[main] アイコンの先読みに失敗しました', e);
    }

    UI.renderTarget(el.targetBar, result);
    el.treeWrap.hidden = false;
    UI.renderTree(el.tree, result, state);
    el.shopWrap.hidden = false;
    UI.renderShop(el.shop, result);
    UI.renderVerdict(el.verdict, result);
    UI.renderSummary(el.summary, result, settings);

    restoreFocus(f);
  }

  /** 価格を取得してから描画。force=true でキャッシュ無視。 */
  function refresh(force) {
    if (!state.itemId) { render(); return Promise.resolve(); }
    var ids;
    try {
      ids = Calc.neededItemIds(state.itemId, state.qty, state, settings);
    } catch (err) {
      console.error(err); render(); return Promise.resolve();
    }
    setBusy(true);
    UI.banner('価格を取得中…', null);

    return Universalis.ensurePrices(settings.scopeName, ids, {
      force: !!force,
      onProgress: function (done, total) {
        if (total > 1) UI.banner('価格を取得中… ' + done + '/' + total, null);
      }
    }).then(function (res) {
      setBusy(false);
      if (res.failed.length) {
        UI.banner('価格の取得に失敗した素材が ' + res.failed.length + ' 件あります（' +
                  (res.errors[0] || '不明なエラー') + '）。該当行の単価欄に手入力すれば計算を続けられます。',
                  'err', '再試行', function () { refresh(true); });
      } else {
        UI.banner(null);
      }
      render();
      return res;
    }).catch(function (err) {
      setBusy(false);
      console.error(err);
      UI.banner('価格取得で予期しないエラー: ' + (err && err.message) + '。手入力で計算を続けられます。', 'err',
                '再試行', function () { refresh(true); });
      render();
    });
  }

  /** 即時に再描画し、追加で必要になった価格は後追いで取得する */
  function recalcAndTopUp() {
    render();
    if (!state.itemId) return;
    var ids = Calc.neededItemIds(state.itemId, state.qty, state, settings);
    var missing = ids.filter(function (id) {
      return !Store.getFreshPrice(settings.scopeName, id, Universalis.ttlMs());
    });
    if (!missing.length) return;
    Universalis.ensurePrices(settings.scopeName, missing, {}).then(function (res) {
      if (res.failed.length) {
        UI.banner('一部の素材の価格を取得できませんでした。単価欄に手入力してください。', 'err',
                  '再試行', function () { refresh(true); });
      }
      render();
    });
  }

  // ---------------- 検索 ----------------
  var sgList = [], sgIndex = -1, sgTimer = null;

  function doSearch() {
    var v = el.q.value.trim();
    if (!v) { hideSuggest(); return; }
    sgList = GameData.search(v, 40);
    sgIndex = sgList.length ? 0 : -1;
    UI.renderSuggest(el.suggest, sgList, sgIndex);
  }
  function hideSuggest() { el.suggest.hidden = true; sgList = []; sgIndex = -1; }

  el.q.addEventListener('input', function () {
    if (sgTimer) clearTimeout(sgTimer);
    sgTimer = setTimeout(doSearch, 120);
  });
  el.q.addEventListener('focus', function () { if (el.q.value.trim()) doSearch(); });
  el.q.addEventListener('keydown', function (e) {
    if (el.suggest.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!sgList.length) return;
      sgIndex = (sgIndex + (e.key === 'ArrowDown' ? 1 : -1) + sgList.length) % sgList.length;
      UI.renderSuggest(el.suggest, sgList, sgIndex);
      var on = el.suggest.querySelector('.sg.on');
      if (on) on.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (sgIndex >= 0 && sgList[sgIndex]) { e.preventDefault(); selectItem(sgList[sgIndex].id); }
    } else if (e.key === 'Escape') {
      hideSuggest();
    }
  });
  el.suggest.addEventListener('click', function (e) {
    var row = e.target.closest('.sg');
    if (!row) return;
    selectItem(+row.dataset.id);
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) hideSuggest();
  });

  function selectItem(id) {
    if (!GameData.isCraftable(id)) {
      UI.toast('「' + GameData.nameOf(id) + '」には製作レシピがありません。');
      return;
    }
    state.itemId = id;
    if (!state.qty || state.qty < 1) state.qty = 1;
    Store.saveStateSoon();
    el.q.value = '';
    hideSuggest();
    refresh(false);
  }

  // ---------------- 対象バー操作 ----------------
  /* 作る個数は 1〜99。両端でスピナー / ↑↓キー / ホイールを回すと反対側へ循環する
     （1 で下げると 99、99 で上げると 1）。手入力の途中（"0" など）は確定まで待つ。 */
  var QTY_MIN = 1, QTY_MAX = 99;
  var qtyTimer = null;

  function wrapQty(v) {
    if (v < QTY_MIN) return QTY_MAX;
    if (v > QTY_MAX) return QTY_MIN;
    return v;
  }

  function setQty(v, reflect) {
    v = Math.max(QTY_MIN, Math.min(QTY_MAX, v));
    state.qty = v;
    if (reflect) {
      var inp = document.getElementById('qty');
      if (inp && inp.value !== String(v)) inp.value = v;
    }
    Store.saveStateSoon();
    if (qtyTimer) clearTimeout(qtyTimer);
    qtyTimer = setTimeout(recalcAndTopUp, 250);
  }

  /* ↑↓キーはネイティブのステップを止めて自前で循環させる（確実） */
  el.targetBar.addEventListener('keydown', function (e) {
    if (e.target.id !== 'qty') return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    var cur = parseInt(e.target.value, 10);
    if (!isFinite(cur)) cur = state.qty;
    setQty(wrapQty(cur + (e.key === 'ArrowUp' ? 1 : -1)), true);
  });

  el.targetBar.addEventListener('input', function (e) {
    if (e.target.id !== 'qty') return;
    var raw = e.target.value;
    if (raw === '') return;                         // 全消し途中は何もしない
    var v = parseInt(raw, 10);
    if (!isFinite(v)) return;

    /* スピナー / ホイールでの増減は inputType が空（Chrome は "insertReplacementText"
       を返すことがある）。文字の挿入・削除は循環させず、確定まで待つ。 */
    var stepped = (e.inputType == null || e.inputType === '' || e.inputType === 'insertReplacementText');

    if (stepped) {
      setQty(wrapQty(v), true);
    } else if (v < QTY_MIN) {
      return;                                       // 手入力の途中（"0" 等）は確定まで待つ
    } else {
      setQty(v, v > QTY_MAX);                       // 上限超過だけ即クランプして書き戻す
    }
  });

  el.targetBar.addEventListener('change', function (e) {
    if (e.target.id === 'recipeSel') {
      state.recipeChoice[state.itemId] = +e.target.value;
      Store.saveStateSoon();
      recalcAndTopUp();
    } else if (e.target.id === 'qty') {
      var v = parseInt(e.target.value, 10);
      v = Math.max(QTY_MIN, Math.min(QTY_MAX, isFinite(v) ? v : QTY_MIN));
      state.qty = v;
      e.target.value = v;
      Store.saveStateSoon();
      if (qtyTimer) clearTimeout(qtyTimer);
      recalcAndTopUp();
    }
  });

  // ---------------- ツリー操作 ----------------
  el.tree.addEventListener('click', function (e) {
    var row = e.target.closest('.trow');
    if (!row) return;

    if (e.target.dataset.act === 'toggle') {
      var path = row.dataset.path;
      if (state.collapsed[path]) delete state.collapsed[path];
      else state.collapsed[path] = true;
      Store.saveStateSoon();
      render();
      return;
    }

    var btn = e.target.closest('.modes button');
    if (btn && !btn.disabled) {
      var id = +row.dataset.item;
      state.modes[id] = btn.dataset.mode;
      Store.saveStateSoon();
      recalcAndTopUp();
    }
  });

  var ovrTimer = null;
  el.tree.addEventListener('input', function (e) {
    if (!e.target.classList.contains('ovr')) return;
    var row = e.target.closest('.trow');
    if (!row) return;
    var id = +row.dataset.item;
    var raw = e.target.value.trim();
    if (raw === '') delete state.overrides[id];
    else {
      var n = Number(raw);
      if (!isFinite(n) || n < 0) return;
      state.overrides[id] = n;
    }
    Store.saveStateSoon();
    if (ovrTimer) clearTimeout(ovrTimer);
    ovrTimer = setTimeout(render, 300);
  });

  el.copyShop.addEventListener('click', function () {
    if (!lastResult) return;
    var txt = UI.shopText(lastResult);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt)
        .then(function () { UI.toast('買い物リストをコピーしました'); })
        .catch(function () { fallbackCopy(txt); });
    } else fallbackCopy(txt);
  });
  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); UI.toast('買い物リストをコピーしました'); }
    catch (e) { UI.toast('コピーできませんでした'); }
    document.body.removeChild(ta);
  }

  // ---------------- ワールド / 設定 ----------------
  function applyScope(value) {
    var parts = value.split(':');
    settings = Store.setSettings({ scopeType: parts[0], scopeName: parts.slice(1).join(':') });
    Universalis.clearFailures();
    el.scope.value = value;
    refresh(false);
  }
  el.scope.addEventListener('change', function () { applyScope(el.scope.value); });

  el.reload.addEventListener('click', function () {
    if (busy) return;
    Universalis.clearFailures();
    refresh(true).then(function () { UI.toast('価格を再取得しました'); });
  });

  /* 設定はダイアログではなく「設定」タブへ。フィールドの配線は
     js/tabs/settings/settings.js 側で行い、こちらは切り替えるだけ。 */
  el.openSettings.addEventListener('click', function () { FF14.core.Tabs.show('settings'); });

  /** レシピDBを再取得する（設定タブの「レシピDB更新」からも呼ばれる） */
  function refreshDb() {
    UI.banner('レシピDBを再取得中…', null);
    return GameData.load({ force: true }).then(function () {
      UI.banner(null);
      UI.toast('レシピDBを更新しました');
      render();
    }).catch(function (err) {
      UI.banner('レシピDBの更新に失敗しました: ' + err.message, 'err');
      throw err;
    });
  }

  // ---------------- 起動 ----------------
  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;
    /* 旧データに 1〜99 の外の個数が残っていることがあるので直しておく */
    state.qty = Math.max(QTY_MIN, Math.min(QTY_MAX, state.qty || QTY_MIN));
    UI.banner('レシピDBを読み込み中…', null);

    // ワールド一覧（失敗しても致命的ではない）
    Universalis.loadWorlds().then(function (wd) {
      worldData = wd;
      UI.fillScopeSelect(el.scope, worldData, settings);
    }).catch(function (err) {
      console.warn('[main] ワールド一覧取得失敗:', err && err.message);
      UI.fillScopeSelect(el.scope, null, settings);
    });

    GameData.load({
      onProgress: function (msg) { UI.banner(msg, null); }
    }).then(function (info) {
      el.q.disabled = false;
      if (FF14.core.Tabs.current() === 'craft') el.q.focus();
      if (info.stale) {
        UI.banner('レシピDBの更新に失敗したため、保存済みの古いデータを使っています。', 'err',
                  '再取得', function () { refreshDb(); });
      } else {
        UI.banner(null);
      }
      if (state.itemId && GameData.isCraftable(state.itemId)) refresh(false);
      else { state.itemId = null; render(); }
      /* 設定タブの「レシピDB: …」表示を最新にしておく */
      if (FF14.settings && FF14.settings.Panel) FF14.settings.Panel.render();
    }).catch(function (err) {
      console.error(err);
      UI.banner('レシピDBを取得できませんでした（' + (err && err.message) + '）。' +
                'ネットワークを確認して再試行してください。', 'err',
                '再試行', function () { location.reload(); });
    });
  }

  /* 設定タブから触るためのAPI。設定タブは Store を直接読み書きするので、
     ここでは「変わったから読み直して描き直す」だけを受け持つ。 */
  FF14.craft.api = {
    isBooted: function () { return booted; },
    /** 設定タブが Store を更新したあとに呼ぶ。recalc=true なら価格の追加取得も行う */
    reloadSettings: function (recalc) {
      settings = Store.getSettings();
      el.scope.value = settings.scopeType + ':' + settings.scopeName;
      if (!booted) return;
      if (recalc) recalcAndTopUp(); else render();
    },
    /** インポート後など、設定も状態もまるごと読み直す */
    reloadAll: function () {
      settings = Store.getSettings();
      state = Store.getState();
      el.scope.value = settings.scopeType + ':' + settings.scopeName;
      if (booted) refresh(false);
    },
    applyScope: function (value) {
      if (!booted) { var p = value.split(':'); Store.setSettings({ scopeType: p[0], scopeName: p.slice(1).join(':') }); settings = Store.getSettings(); return; }
      applyScope(value);
    },
    refresh: refresh,
    refreshDb: refreshDb,
    clearPriceCache: function () {
      Store.clearPriceCache();
      Universalis.clearFailures();
      UI.toast('価格キャッシュを削除しました');
      if (booted) refresh(true);
    }
  };

  FF14.core.Tabs.register('craft', {
    /* レシピDBの初回取得が重いので、タブを開いたときに初めて起動する */
    eager: false,
    init: boot,
    onShow: function () { if (booted && !el.q.disabled) el.q.focus(); }
  });
})();
