/* main.js — 起動と操作の配線 */
(function () {
  'use strict';

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
    summary: $('#summary'),
    settings: $('#settings'),
    setScope: $('#setScope'),
    setFee: $('#setFee'),
    setBasis: $('#setBasis'),
    setCrystals: $('#setCrystals'),
    btnExport: $('#btnExport'),
    btnImport: $('#btnImport'),
    btnRefreshDb: $('#btnRefreshDb'),
    btnClearCache: $('#btnClearCache'),
    fileImport: $('#fileImport'),
    dbInfo: $('#dbInfo')
  };

  var settings = Store.getSettings();
  var state = Store.getState();
  var worldData = null;
  var lastResult = null;
  var busy = false;

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
    busy = true;
    el.reload.disabled = true;
    UI.banner('価格を取得中…', null);

    return Universalis.ensurePrices(settings.scopeName, ids, {
      force: !!force,
      onProgress: function (done, total) {
        if (total > 1) UI.banner('価格を取得中… ' + done + '/' + total, null);
      }
    }).then(function (res) {
      busy = false;
      el.reload.disabled = false;
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
      busy = false;
      el.reload.disabled = false;
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
  var qtyTimer = null;
  el.targetBar.addEventListener('input', function (e) {
    if (e.target.id !== 'qty') return;
    var v = parseInt(e.target.value, 10);
    if (!isFinite(v) || v < 1) return;
    state.qty = v;
    Store.saveStateSoon();
    if (qtyTimer) clearTimeout(qtyTimer);
    qtyTimer = setTimeout(recalcAndTopUp, 250);
  });
  el.targetBar.addEventListener('change', function (e) {
    if (e.target.id === 'recipeSel') {
      state.recipeChoice[state.itemId] = +e.target.value;
      Store.saveStateSoon();
      recalcAndTopUp();
    } else if (e.target.id === 'qty') {
      var v = parseInt(e.target.value, 10);
      state.qty = (isFinite(v) && v >= 1) ? v : 1;
      e.target.value = state.qty;
      Store.saveStateSoon();
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
    el.setScope.value = value;
    refresh(false);
  }
  el.scope.addEventListener('change', function () { applyScope(el.scope.value); });
  el.setScope.addEventListener('change', function () { applyScope(el.setScope.value); });

  el.reload.addEventListener('click', function () {
    if (busy) return;
    Universalis.clearFailures();
    refresh(true).then(function () { UI.toast('価格を再取得しました'); });
  });

  el.openSettings.addEventListener('click', function () {
    el.setFee.value = settings.feeRate;
    el.setBasis.value = settings.saleBasis;
    el.setCrystals.checked = !!settings.crystalsHeld;
    el.setScope.value = settings.scopeType + ':' + settings.scopeName;
    updateDbInfo();
    if (el.settings.showModal) el.settings.showModal();
    else el.settings.setAttribute('open', '');
  });

  el.setFee.addEventListener('change', function () {
    var v = Number(el.setFee.value);
    if (!isFinite(v) || v < 0) v = 0;
    if (v > 100) v = 100;
    el.setFee.value = v;
    settings = Store.setSettings({ feeRate: v });
    render();
  });
  el.setBasis.addEventListener('change', function () {
    settings = Store.setSettings({ saleBasis: el.setBasis.value });
    render();
  });
  el.setCrystals.addEventListener('change', function () {
    settings = Store.setSettings({ crystalsHeld: el.setCrystals.checked });
    recalcAndTopUp();
  });

  function updateDbInfo() {
    var age = GameData.dataAge();
    el.dbInfo.textContent =
      'レシピDB: ' + (age ? UI.rel(age) + 'に取得（' + UI.absTime(age) + '）' : '未読み込み') +
      ' ／ 価格キャッシュ: ' + Store.priceCacheSize() + ' 件（15分で自動失効）';
  }

  el.btnExport.addEventListener('click', function () {
    var data = Store.exportJSON();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ff14-craft-profit-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    UI.toast('設定と状態をエクスポートしました');
  });

  el.btnImport.addEventListener('click', function () { el.fileImport.click(); });
  el.fileImport.addEventListener('change', function () {
    var file = el.fileImport.files && el.fileImport.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        Store.importJSON(JSON.parse(reader.result));
        settings = Store.getSettings();
        state = Store.getState();
        el.scope.value = settings.scopeType + ':' + settings.scopeName;
        el.setScope.value = el.scope.value;
        el.setFee.value = settings.feeRate;
        el.setBasis.value = settings.saleBasis;
        el.setCrystals.checked = !!settings.crystalsHeld;
        UI.toast('インポートしました');
        refresh(false);
      } catch (err) {
        UI.toast('インポート失敗: ' + err.message, 4000);
      }
      el.fileImport.value = '';
    };
    reader.onerror = function () { UI.toast('ファイルを読めませんでした'); el.fileImport.value = ''; };
    reader.readAsText(file);
  });

  el.btnRefreshDb.addEventListener('click', function () {
    el.btnRefreshDb.disabled = true;
    UI.banner('レシピDBを再取得中…', null);
    GameData.load({ force: true }).then(function () {
      UI.banner(null);
      UI.toast('レシピDBを更新しました');
      updateDbInfo();
      render();
    }).catch(function (err) {
      UI.banner('レシピDBの更新に失敗しました: ' + err.message, 'err');
    }).then(function () { el.btnRefreshDb.disabled = false; });
  });

  el.btnClearCache.addEventListener('click', function () {
    Store.clearPriceCache();
    Universalis.clearFailures();
    updateDbInfo();
    UI.toast('価格キャッシュを削除しました');
    refresh(true);
  });

  // ---------------- 起動 ----------------
  function boot() {
    UI.banner('レシピDBを読み込み中…', null);

    // ワールド一覧（失敗しても致命的ではない）
    Universalis.loadWorlds().then(function (wd) {
      worldData = wd;
      UI.fillScopeSelect(el.scope, worldData, settings);
      UI.fillScopeSelect(el.setScope, worldData, settings);
    }).catch(function (err) {
      console.warn('[main] ワールド一覧取得失敗:', err && err.message);
      UI.fillScopeSelect(el.scope, null, settings);
      UI.fillScopeSelect(el.setScope, null, settings);
    });

    GameData.load({
      onProgress: function (msg) { UI.banner(msg, null); }
    }).then(function (info) {
      el.q.disabled = false;
      el.q.focus();
      if (info.stale) {
        UI.banner('レシピDBの更新に失敗したため、保存済みの古いデータを使っています。', 'err',
                  '再取得', function () { el.btnRefreshDb.click(); });
      } else {
        UI.banner(null);
      }
      if (state.itemId && GameData.isCraftable(state.itemId)) refresh(false);
      else { state.itemId = null; render(); }
    }).catch(function (err) {
      console.error(err);
      UI.banner('レシピDBを取得できませんでした（' + (err && err.message) + '）。' +
                'ネットワークを確認して再試行してください。', 'err',
                '再試行', function () { location.reload(); });
    });
  }

  boot();
})();
