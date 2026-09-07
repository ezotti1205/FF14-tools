/* patchdata.js — パッチ台帳（手管理）
 *
 * ■ これは何か
 *   gamedata.js（= ffxiv-teamcraft の全DBを実行時に取得）は「いつのデータか」を
 *   エントリ単位では持っていない。そこを補うための、アイテムID / レシピID ごとの
 *   「どのパッチで実装 or 更新されたか」を書き留めておく台帳。
 *
 * ■ 構造をあえて浅く保っている理由
 *   将来パッチ後に別セッションへ「更新して」と頼むとき、このファイルだけ渡せば
 *   差分が一目で分かるようにするため。値は素の文字列（パッチ番号）だけにしてある。
 *   メモを残したい時だけ items/recipes の値をオブジェクト { patch, note } にしてもよい
 *   （読み取り側は両対応）。ネストはここまで。生成ロジックは持ち込まない。
 *
 * ■ 更新のしかた（パッチ後）
 *   1. meta.updated と meta.datasetLabel を更新
 *   2. meta.defaultPatch を「今回のパッチ」に更新（台帳に個別エントリが無いものの
 *      暫定表示に使われる。＝「少なくともこのパッチ時点のデータ」の意味）
 *   3. 変更・追加されたアイテム / レシピを items / recipes に追記
 *      （ツール画面下部の「パッチ台帳」パネルで、未登録エントリの雛形を書き出せる）
 *
 * ■ キー
 *   items   … アイテムID（文字列） → "7.2"  または  { patch:"7.2", note:"..." }
 *   recipes … レシピID（文字列）   → "7.2"  または  { patch:"7.2", note:"..." }
 *   ID は gamedata.js が扱う teamcraft の数値ID。ツール上でアイテム/レシピを選ぶと
 *   その ID が画面に出るので、それをそのままキーにする。
 */
(function () {
  window.FF14 = window.FF14 || {};
  window.FF14.reverse = window.FF14.reverse || {};

  window.FF14.reverse.PATCH = {
    meta: {
      // 台帳そのものを最後に手で更新した日
      updated: '2026-09-07',
      // どの時点の gamedata（teamcraft）を前提に台帳を書いたか
      datasetLabel: 'ffxiv-teamcraft staging',
      // 個別エントリが無いものの暫定表示に使うパッチ（「≧ このパッチ」の意味）
      defaultPatch: '7.2'
    },

    // 例: "44234": "7.2",   ← このアイテムは 7.2 実装 / 更新
    items: {
    },

    // 例: "35600": "7.2",   ← このレシピは 7.2 実装 / 更新
    recipes: {
    }
  };

  var PATCH = window.FF14.reverse.PATCH;
  var LS_ITEMS = 'ff14reverse.v1.patch.items';     // ファイルを直さず画面から補記した分
  var LS_RECIPES = 'ff14reverse.v1.patch.recipes';

  function readLS(key) {
    try {
      var raw = localStorage.getItem(key);
      var o = raw ? JSON.parse(raw) : null;
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeLS(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  var over = { items: readLS(LS_ITEMS), recipes: readLS(LS_RECIPES) };

  function norm(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'string') return { patch: v, note: '' };
    return { patch: v.patch || '', note: v.note || '' };
  }

  /** @returns {{patch:string, note:string, source:'file'|'local'|'default'}} */
  function lookup(kind, id) {
    id = String(id);
    var local = norm(over[kind][id]);
    if (local) return { patch: local.patch, note: local.note, source: 'local' };
    var file = norm(PATCH[kind][id]);
    if (file) return { patch: file.patch, note: file.note, source: 'file' };
    return { patch: PATCH.meta.defaultPatch, note: '', source: 'default' };
  }

  function set(kind, id, patch, note) {
    id = String(id);
    if (!patch) { delete over[kind][id]; }
    else { over[kind][id] = note ? { patch: patch, note: note } : patch; }
    writeLS(kind === 'items' ? LS_ITEMS : LS_RECIPES, over[kind]);
  }

  /** ファイル本体＋ローカル補記をまとめた、patchdata.js に貼れる形の JSON 文字列 */
  function exportMerged(extraItemIds, extraRecipeIds) {
    function merge(kind, extra) {
      var out = {};
      var k;
      for (k in PATCH[kind]) out[k] = PATCH[kind][k];
      for (k in over[kind]) out[k] = over[kind][k];
      (extra || []).forEach(function (id) {
        id = String(id);
        if (!(id in out)) out[id] = '';   // 未登録は空文字で雛形だけ置く
      });
      return sortKeys(out);
    }
    function sortKeys(o) {
      var r = {};
      Object.keys(o).sort(function (a, b) { return (+a) - (+b); }).forEach(function (k) { r[k] = o[k]; });
      return r;
    }
    var merged = {
      meta: PATCH.meta,
      items: merge('items', extraItemIds),
      recipes: merge('recipes', extraRecipeIds)
    };
    return JSON.stringify(merged, null, 2);
  }

  function localCount() {
    return Object.keys(over.items).length + Object.keys(over.recipes).length;
  }
  function clearLocal() {
    over = { items: {}, recipes: {} };
    try { localStorage.removeItem(LS_ITEMS); localStorage.removeItem(LS_RECIPES); } catch (e) {}
  }

  window.FF14.reverse.PatchData = {
    meta: PATCH.meta,
    itemPatch: function (id) { return lookup('items', id); },
    recipePatch: function (id) { return lookup('recipes', id); },
    setItemPatch: function (id, patch, note) { set('items', id, patch, note); },
    setRecipePatch: function (id, patch, note) { set('recipes', id, patch, note); },
    hasFileEntry: function (kind, id) { return String(id) in (PATCH[kind] || {}); },
    exportMerged: exportMerged,
    localCount: localCount,
    clearLocal: clearLocal
  };
})();
