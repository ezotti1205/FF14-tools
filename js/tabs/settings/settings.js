/* ===== タブ「設定」 =====
   3本ぶんの設定と、データの出し入れをここに集約しています。
   ・通知の一括ON/OFF は FF14.core.Hub（全タブ共通）
   ・ノード関連（通知の何分前 / exdreams更新 / 同梱に戻す）のボタンは
     id をそのまま残してあるので、配線は js/tabs/nodes/app.js 側が行います
   ・製作損益の設定は FF14.craft.Store を直接書き換え、開いていれば再描画を依頼します
     （「作る vs 買う」タブを一度も開いていなくても設定を変えられるように） */
FF14.settings = FF14.settings || {};
FF14.settings.Panel = (function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var booted = false;
  var scopeFilled = false;
  var toastTimer = null;

  function toast(msg, kind) {
    var t = $('#hubToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'hub-toast show' + (kind ? ' ' + kind : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'hub-toast'; }, 3000);
  }

  /* ---------- 通知 ---------- */
  function bindNotify() {
    var chk = $('#setNotifyEnabled');
    chk.checked = !!FF14.core.Hub.get().notifyEnabled;
    chk.addEventListener('change', function () {
      FF14.core.Hub.set({ notifyEnabled: chk.checked });
      toast(chk.checked ? '通知をONにしました' : '通知をすべて止めました');
      renderNotifyStatus();
    });
  }

  function renderNotifyStatus() {
    var s = $('#notifStatus');
    var p = FF14.core.Hub.notifyPermission();
    var on = FF14.core.Hub.get().notifyEnabled;
    var txt;
    if (p === 'unsupported') txt = 'このブラウザは通知に対応していません。';
    else if (p === 'denied') txt = 'ブラウザ側でブロックされています。サイトの設定から許可してください。';
    else if (p !== 'granted') txt = 'ブラウザの許可がまだです。「ブラウザ通知を有効にする」を押してください。';
    else if (!on) txt = '許可済みですが、上の一括スイッチがOFFなので送信しません。';
    else txt = '許可済み。通知は [ノード] のようにタブ名つきで届きます。';
    s.textContent = txt;

    var n = $('#nodeNotifyCount');
    if (n && FF14.nodes.App) {
      n.textContent = FF14.nodes.App.notifyCount() + ' 件のノードに通知を設定中';
    }
  }

  /* ---------- 製作損益（Universalis）の設定 ---------- */
  function craftSettings() { return FF14.craft.Store.getSettings(); }

  function bindCraft() {
    var s = craftSettings();
    $('#setFee').value = s.feeRate;
    $('#setBasis').value = s.saleBasis;
    $('#setCrystals').checked = !!s.crystalsHeld;

    $('#setScope').addEventListener('change', function () {
      var v = $('#setScope').value;
      var parts = v.split(':');
      FF14.craft.Store.setSettings({ scopeType: parts[0], scopeName: parts.slice(1).join(':') });
      if (FF14.craft.api) FF14.craft.api.applyScope(v);
      toast('ワールド/DCを ' + parts.slice(1).join(':') + ' にしました');
    });

    $('#setFee').addEventListener('change', function () {
      var v = Number($('#setFee').value);
      if (!isFinite(v) || v < 0) v = 0;
      if (v > 100) v = 100;
      $('#setFee').value = v;
      FF14.craft.Store.setSettings({ feeRate: v });
      if (FF14.craft.api) FF14.craft.api.reloadSettings(false);
    });

    $('#setBasis').addEventListener('change', function () {
      FF14.craft.Store.setSettings({ saleBasis: $('#setBasis').value });
      if (FF14.craft.api) FF14.craft.api.reloadSettings(false);
    });

    $('#setCrystals').addEventListener('change', function () {
      FF14.craft.Store.setSettings({ crystalsHeld: $('#setCrystals').checked });
      if (FF14.craft.api) FF14.craft.api.reloadSettings(true);
    });

    $('#btnRefreshDb').addEventListener('click', function () {
      var b = $('#btnRefreshDb');
      b.disabled = true;
      var done = function () { b.disabled = false; renderDbInfo(); };
      if (FF14.craft.api && FF14.craft.api.isBooted()) {
        FF14.craft.api.refreshDb().then(done, done);
      } else {
        FF14.craft.GameData.load({ force: true }).then(function () {
          toast('レシピDBを更新しました');
        }, function (err) {
          toast('レシピDBの更新に失敗しました: ' + (err && err.message), 'warn');
        }).then(done, done);
      }
    });

    $('#btnClearCache').addEventListener('click', function () {
      if (FF14.craft.api) FF14.craft.api.clearPriceCache();
      else FF14.craft.Store.clearPriceCache();
      renderDbInfo();
      toast('価格キャッシュを削除しました');
    });

    $('#btnClearIcons').addEventListener('click', function () {
      FF14.core.Icons.clear();
      renderIconInfo();
      toast('アイコンキャッシュを削除しました');
    });
  }

  /** ワールド一覧を取得して #setScope を埋める（1回だけ） */
  function fillScope() {
    if (scopeFilled) return;
    scopeFilled = true;
    var sel = $('#setScope');
    var s = craftSettings();
    FF14.craft.Universalis.loadWorlds().then(function (wd) {
      FF14.craft.UI.fillScopeSelect(sel, wd, s);
    }).catch(function () {
      FF14.craft.UI.fillScopeSelect(sel, null, s);
    });
  }

  function renderDbInfo() {
    var age = FF14.craft.GameData.dataAge();
    $('#dbInfo').textContent =
      'レシピDB: ' + (age ? FF14.craft.UI.rel(age) + 'に取得（' + FF14.craft.UI.absTime(age) + '）' : '未読み込み') +
      ' ／ 価格キャッシュ: ' + FF14.craft.Store.priceCacheSize() + ' 件（15分で自動失効）';
  }

  function renderIconInfo() {
    var el = $('#iconInfo');
    if (!el) return;
    var n = FF14.core.Icons.size();
    el.textContent = n
      ? 'アイコンの取得先を ' + n + ' 件おぼえています（画像そのものはブラウザのキャッシュ任せです）'
      : 'まだ何もおぼえていません（アイテムを表示すると自動でたまります）';
  }

  /* ---------- データ ---------- */
  function bindData() {
    $('#hubExportAll').addEventListener('click', function () {
      FF14.core.Backup.exportAllToFile();
      toast('5タブぶんをまとめてエクスポートしました');
    });
    $('#hubExportNodes').addEventListener('click', function () { FF14.core.Backup.exportOneToFile('nodes'); });
    $('#hubExportAssets').addEventListener('click', function () { FF14.core.Backup.exportOneToFile('assets'); });
    $('#hubExportRecipe').addEventListener('click', function () { FF14.core.Backup.exportOneToFile('recipe'); });
    $('#hubExportCraft').addEventListener('click', function () { FF14.core.Backup.exportOneToFile('craft'); });
    $('#hubExportWatch').addEventListener('click', function () { FF14.core.Backup.exportOneToFile('watch'); });

    $('#hubImportBtn').addEventListener('click', function () { $('#hubImportFile').click(); });
    $('#hubImportFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var done = FF14.core.Backup.importFromText(String(reader.result));
          renderAll();
          /* レシピ・市場は起動時にしか localStorage を読まないので、
             取り込んだだけでは画面に出ない。案内を出す。 */
          var msg = 'インポートしました（' + done.join(' / ') + '）';
          if (FF14.core.Backup.needsReload(done)) {
            msg += ' — レシピ／市場はページを再読み込みすると反映されます';
          }
          /* 一部だけ失敗した場合も、取り込めたぶんは残したうえで理由を出す */
          if (done.failures && done.failures.length) {
            toast(msg + ' / 取り込めなかったもの: ' + done.failures.join(' '), 'warn');
          } else {
            toast(msg);
          }
        } catch (err) {
          toast('インポート失敗: ' + ((err && err.message) || err), 'warn');
        }
      };
      reader.onerror = function () { toast('ファイルを読み込めませんでした', 'warn'); };
      reader.readAsText(f);
    });
  }

  function renderNodesInfo() {
    var el = $('#nodesInfo');
    if (!el || !FF14.nodes.App) return;
    el.textContent = 'ノード ' + FF14.nodes.App.nodeCount() + ' 件 / お気に入り ' +
      FF14.nodes.App.favoriteCount() + ' 件';
  }

  function renderAssetsInfo() {
    var el = $('#assetsInfo');
    if (!el) return;
    try {
      FF14.assets.Store.init();
      el.textContent = '総資産の記録 ' + FF14.assets.Store.all().length + ' 件';
    } catch (e) { el.textContent = ''; }
  }

  function renderAll() {
    renderNotifyStatus();
    renderNodesInfo();
    renderAssetsInfo();
    renderDbInfo();
    renderIconInfo();
    var chk = $('#setNotifyEnabled');
    if (chk) chk.checked = !!FF14.core.Hub.get().notifyEnabled;
    var s = craftSettings();
    $('#setFee').value = s.feeRate;
    $('#setBasis').value = s.saleBasis;
    $('#setCrystals').checked = !!s.crystalsHeld;
    if ($('#setScope').options.length) $('#setScope').value = s.scopeType + ':' + s.scopeName;
  }

  function init() {
    if (booted) return;
    booted = true;
    bindNotify();
    bindCraft();
    bindData();
    fillScope();
    renderAll();
  }

  FF14.core.Tabs.register('settings', {
    eager: false,
    init: init,
    onShow: function () { if (booted) renderAll(); }
  });

  return { init: init, render: renderAll };
})();
