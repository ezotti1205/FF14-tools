/* reverse.js — 素材の逆引きインデックス
 *
 * gamedata.js が持つ全レシピを1回走査して
 *   byIngredient: { 素材ID: [ { recipe, amount }, ... ] }
 * を作るだけ。recipe は gamedata.js の整形済みオブジェクト
 *   { id, job, lvl, yields, result, ingredients:[{id, amount}] }
 * をそのまま参照で持つ（コピーしない＝データの二重管理を避ける）。
 */
(function () {
  'use strict';
  window.FF14 = window.FF14 || {};
  window.FF14.reverse = window.FF14.reverse || {};

  var GameData = window.FF14.craft.GameData;

  var byIngredient = null;
  var builtAt = 0;

  function build() {
    byIngredient = {};
    GameData.eachRecipe(function (r) {
      if (!r || !r.ingredients) return;
      for (var i = 0; i < r.ingredients.length; i++) {
        var g = r.ingredients[i];
        if (!g || !g.id) continue;
        var list = byIngredient[g.id] || (byIngredient[g.id] = []);
        // 同じ完成品が同じ素材を複数行に分けて持つことは基本ないが、
        // 念のため amount を足し込む
        var hit = null;
        for (var k = 0; k < list.length; k++) {
          if (list[k].recipe.id === r.id) { hit = list[k]; break; }
        }
        if (hit) hit.amount += g.amount;
        else list.push({ recipe: r, amount: g.amount });
      }
    });

    // 表示安定のため: ジョブ → レベル → 完成品名 で並べる
    for (var key in byIngredient) {
      byIngredient[key].sort(function (a, b) {
        return (a.recipe.job - b.recipe.job) ||
               (a.recipe.lvl - b.recipe.lvl) ||
               cmp(GameData.nameOf(a.recipe.result), GameData.nameOf(b.recipe.result));
      });
    }
    builtAt = Date.now();
  }

  function cmp(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }

  function ensure() { if (!byIngredient) build(); }

  /** この素材IDを使う完成品レシピ一覧（1階層） */
  function usedBy(itemId) {
    ensure();
    return byIngredient[itemId] || [];
  }

  /** この素材IDが「どこかのレシピの素材」になっているか */
  function isIngredient(itemId) {
    ensure();
    return !!(byIngredient[itemId] && byIngredient[itemId].length);
  }

  /** 何件のレシピで使われるか（0なら逆引き結果なし） */
  function useCount(itemId) {
    ensure();
    var l = byIngredient[itemId];
    return l ? l.length : 0;
  }

  /** 「どこかで素材として使われている」アイテムの総数。
      全アイテム数に対してかなり少ないので、検索の絞り込みに使う。 */
  function ingredientItemCount() {
    ensure();
    return Object.keys(byIngredient).length;
  }

  window.FF14.reverse.Index = {
    build: build,
    usedBy: usedBy,
    useCount: useCount,
    isIngredient: isIngredient,
    ingredientItemCount: ingredientItemCount,
    builtAt: function () { return builtAt; }
  };
})();
