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

  function exportAll() {
    return {
      app: APP,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      hub: FF14.core.Hub.get(),
      tools: {
        nodes: nodesExport(),
        assets: assetsExport(),
        craft: craftExport()
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
      if (obj.tools.nodes) { importNodes(obj.tools.nodes); done.push('ノード'); }
      if (obj.tools.assets) { importAssets(obj.tools.assets); done.push('総資産'); }
      if (obj.tools.craft) { importCraft(obj.tools.craft); done.push('作る vs 買う'); }
      if (!done.length) throw new Error('取り込める中身がありませんでした。');
      return done;
    }

    // 個別ツールのエクスポートファイル
    if (obj.app === 'ff14-assets' || Array.isArray(obj.records)) { importAssets(obj); return ['総資産']; }
    if (obj.app === 'ff14-craft-profit' || obj.settings && obj.state) { importCraft(obj); return ['作る vs 買う']; }
    if (obj.type === 'ff14-gather-timer/settings' || obj.state && obj.state.favorites) { importNodes(obj); return ['ノード']; }
    if (Array.isArray(obj)) { importAssets({ records: obj }); return ['総資産']; }

    throw new Error('どのツールのデータか判別できませんでした。');
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
    importFromText: importFromText
  };
})();
