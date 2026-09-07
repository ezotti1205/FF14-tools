/* ===== まとめてエクスポート / インポート =====
   3タブぶんの設定・データを1つのJSONにまとめて書き出し / 読み込みます。
   個別タブのエクスポート（各タブ内のボタン）もそのまま使えます。
   個別ファイル（ff14-assets / ff14-craft-profit / ff14-gather-timer のもの）を
   読み込ませた場合も、中身を見て自動で振り分けます。 */
FF14.core.Backup = (function () {
  'use strict';

  var APP = 'ff14-hub';
  var VERSION = 1;

  function download(obj, name) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() { return new Date().toISOString().slice(0, 10); }

  /* ---------- 収集 ---------- */
  function nodesExport() {
    try { return FF14.nodes.App.exportObject(); }
    catch (e) { console.warn('[backup] ノード設定を取得できませんでした', e); return null; }
  }
  function assetsExport() {
    try { FF14.assets.Store.init(); return FF14.assets.Store.exportObject(); }
    catch (e) { console.warn('[backup] 総資産データを取得できませんでした', e); return null; }
  }
  function craftExport() {
    try { return FF14.craft.Store.exportJSON(); }
    catch (e) { console.warn('[backup] 製作損益の設定を取得できませんでした', e); return null; }
  }

  /* レシピ・市場の2本は Store に export の口を持たないので、localStorage の
     キーをそのまま読み書きします（キー名は単体版と同じままにしてあります）。
     価格・ワールド・出品可否のキャッシュは取り直せるうえ大きいので載せません。 */
  var RECIPE_KEYS = [
    'ff14reverse.v1.lastItem',
    'ff14reverse.v1.recent',
    'ff14reverse.v1.ui',
    'ff14reverse.v1.patch.items',
    'ff14reverse.v1.patch.recipes'
  ];
  var WATCH_KEYS = [
    'ff14watch.v1.favs',
    'ff14watch.v1.settings'
  ];

  function keysExport(keys) {
    var out = {}, found = false;
    keys.forEach(function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v !== null) { out[k] = v; found = true; }
      } catch (e) { /* 読めないキーは黙って飛ばす */ }
    });
    return found ? out : null;
  }

  function keysImport(obj, keys, label) {
    if (!obj || typeof obj !== 'object') throw new Error(label + ': 形式が不正です');
    var n = 0;
    keys.forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) return;
      var v = obj[k];
      if (v === null || v === undefined) return;
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        n++;
      } catch (e) { throw new Error(label + ': 保存に失敗しました（' + k + '）'); }
    });
    if (!n) throw new Error(label + ': 取り込める中身がありませんでした');
  }

  function recipeExport() { return keysExport(RECIPE_KEYS); }
  function watchExport() { return keysExport(WATCH_KEYS); }

  function exportAll() {
    return {
      app: APP,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      hub: FF14.core.Hub.get(),
      tools: {
        nodes: nodesExport(),
        assets: assetsExport(),
        craft: craftExport(),
        recipe: recipeExport(),
        watch: watchExport()
      }
    };
  }

  function exportAllToFile() {
    download(exportAll(), 'ff14-hub-all-' + stamp() + '.json');
  }

  function exportOneToFile(tool) {
    if (tool === 'nodes') { download(nodesExport(), 'ff14-hub-nodes-' + stamp() + '.json'); return; }
    if (tool === 'assets') { download(assetsExport(), 'ff14-hub-assets-' + stamp() + '.json'); return; }
    if (tool === 'craft') { download(craftExport(), 'ff14-hub-craft-' + stamp() + '.json'); return; }
    if (tool === 'recipe') { download(wrap('recipe', recipeExport()), 'ff14-hub-recipe-' + stamp() + '.json'); return; }
    if (tool === 'watch') { download(wrap('watch', watchExport()), 'ff14-hub-watch-' + stamp() + '.json'); return; }
  }

  /* 単体エクスポートしたレシピ／市場のファイルは、素のキー羅列だと
     読み込むときにどのツールのものか判別できないので目印を付ける。 */
  function wrap(tool, keys) {
    return { app: APP, version: VERSION, tool: tool, exportedAt: new Date().toISOString(), keys: keys };
  }

  /* ---------- 取り込み ---------- */
  function importNodes(obj) {
    var res = FF14.nodes.App.importObject(obj);
    if (!res.ok) throw new Error('ノード設定: ' + res.error);
  }

  function importAssets(obj) {
    var S = FF14.assets.Store;
    S.init();
    var parsed = S.parseImport(JSON.stringify(obj));
    if (!parsed.ok) throw new Error('総資産: ' + parsed.error);
    S.applyImport(parsed, 'replace');
    if (FF14.assets.App && FF14.core.Tabs.current() === 'assets') FF14.assets.App.render();
  }

  function importCraft(obj) {
    FF14.craft.Store.importJSON(obj);
    if (FF14.craft.api) FF14.craft.api.reloadAll();
  }

  /** どの形式のJSONかを判定して取り込む。戻り値: 取り込んだ項目名の配列 */
  function importAny(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('JSONの形式が不正です。');
    var done = [];

    // 統合版のまとめファイル
    if (obj.app === APP && obj.tools) {
      if (obj.hub) FF14.core.Hub.set(obj.hub);

      /* 1タブが失敗しても残りは取り込む。ここで throw すると、
         後ろに並んでいるタブが丸ごと取り込まれないため。 */
      var failures = [];
      function step(label, fn) {
        try { fn(); done.push(label); }
        catch (e) { failures.push(label + '（' + ((e && e.message) || e) + '）'); }
      }
      if (obj.tools.nodes)  step('ノード', function () { importNodes(obj.tools.nodes); });
      if (obj.tools.assets) step('総資産', function () { importAssets(obj.tools.assets); });
      if (obj.tools.craft)  step('作る vs 買う', function () { importCraft(obj.tools.craft); });
      if (obj.tools.recipe) step('レシピ', function () { keysImport(obj.tools.recipe, RECIPE_KEYS, 'レシピ'); });
      if (obj.tools.watch)  step('市場', function () { keysImport(obj.tools.watch, WATCH_KEYS, '市場'); });

      if (!done.length) {
        throw new Error(failures.length
          ? '取り込めませんでした: ' + failures.join(' / ')
          : '取り込める中身がありませんでした。');
      }
      if (failures.length) done.failures = failures;
      return done;
    }

    // 統合版の個別エクスポート（レシピ / 市場）
    if (obj.app === APP && obj.tool === 'recipe') { keysImport(obj.keys, RECIPE_KEYS, 'レシピ'); return ['レシピ']; }
    if (obj.app === APP && obj.tool === 'watch') { keysImport(obj.keys, WATCH_KEYS, '市場'); return ['市場']; }

    // 個別ツールのエクスポートファイル
    if (obj.app === 'ff14-assets' || Array.isArray(obj.records)) { importAssets(obj); return ['総資産']; }
    if (obj.app === 'ff14-craft-profit' || obj.settings && obj.state) { importCraft(obj); return ['作る vs 買う']; }
    if (obj.type === 'ff14-gather-timer/settings' || obj.state && obj.state.favorites) { importNodes(obj); return ['ノード']; }
    if (Array.isArray(obj)) { importAssets({ records: obj }); return ['総資産']; }

    throw new Error('どのツールのデータか判別できませんでした。');
  }

  /* レシピ・市場は起動時に localStorage を読むので、取り込んだあとは
     再読み込みしないと画面に出ません。呼び出し側の案内用。 */
  function needsReload(done) {
    return done.indexOf('レシピ') >= 0 || done.indexOf('市場') >= 0;
  }

  function importFromText(text) {
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) { throw new Error('JSONとして読み取れませんでした。'); }
    return importAny(obj);
  }

  return {
    exportAll: exportAll,
    exportAllToFile: exportAllToFile,
    exportOneToFile: exportOneToFile,
    importFromText: importFromText,
    needsReload: needsReload
  };
})();
