/* calc.js — 元 ff14-craft-profit/js/calc.js。中身は無変更で、グローバルを汚さないよう
   IIFEで包んで FF14.craft.Calc として公開しているだけです。 */
(function () {
  var Store = FF14.craft.Store, GameData = FF14.craft.GameData, Universalis = FF14.craft.Universalis;
/* calc.js — レシピ展開・必要数集計・原価計算・損得判定
 *
 * 設計メモ:
 *  - 「買う/作る/所持済み」の切替は itemId 単位。同じ素材が別の枝に出てきても扱いが食い違わないようにするため。
 *  - 必要数は「アイテム単位で合算してから製作回数を切り上げる」方式。
 *    枝ごとに切り上げると同じ中間素材を余分に作る計算になり、原価を過大評価するため。
 *  - ツリー表示では、2回目以降に登場した同じアイテムは「上位で集計済み」の参照行にして
 *    二重計上を防ぐ。合算された行には「合算」バッジを付ける。
 *  - 素材の購入価格は NQ の出品を安い順に必要数ぶん積み上げた実額。出品が足りない分は
 *    最後（最も高い）の単価で埋め、不足フラグを立てる。出品が皆無なら直近取引の中央値にフォールバック。
 */
var Calc = (function () {
  'use strict';

  var MAX_DEPTH = 12;

  /**
   * 節約率（完成品を買う場合に対して、素材から作るとどれだけ浮くか）から利益段階を判定する。
   * 詳細ビューの判定と「掘り出し物ランキング」の両方から共通で使う。
   *   高利益: 30%以上お得 / 中利益: 10〜30% / 低利益: 0〜10%
   *   利益なし: -5〜0%（市場変動の誤差程度とみなす）/ 損失あり: -5%を超えて悪化
   */
  function tierFromRate(rate) {
    if (rate === null || rate === undefined || !isFinite(rate)) return 'unknown';
    if (rate >= 0.30) return 'high';
    if (rate >= 0.10) return 'mid';
    if (rate > 0) return 'low';
    if (rate >= -0.05) return 'even';
    return 'loss';
  }

  function modeOf(itemId, state, settings) {
    var m = state.modes[itemId];
    if (m === 'buy' || m === 'make' || m === 'have') return m;
    if (settings.crystalsHeld && GameData.isCrystal(itemId)) return 'have';
    return 'buy';
  }

  function chosenRecipe(itemId, state) {
    var list = GameData.recipesFor(itemId);
    if (!list.length) return null;
    var want = state.recipeChoice[itemId];
    for (var i = 0; i < list.length; i++) if (list[i].id === want) return list[i];
    return list[0];
  }

  /** 展開対象（modeが'make'でレシピがある）のアイテム集合と辺を洗い出す */
  function collectGraph(rootId, state, settings) {
    var nodes = {};     // itemId -> {recipe|null, expand:boolean}
    var edges = {};     // itemId -> [{id, amount}]
    var guard = 0;

    function visit(itemId, depth, isRoot) {
      if (nodes[itemId]) return;
      var mode = isRoot ? 'make' : modeOf(itemId, state, settings);
      var recipe = (mode === 'make') ? chosenRecipe(itemId, state) : null;
      var expand = !!recipe && depth < MAX_DEPTH;
      nodes[itemId] = { recipe: expand ? recipe : null, expand: expand, mode: isRoot ? 'make' : mode };
      if (!expand) return;
      edges[itemId] = recipe.ingredients;
      for (var i = 0; i < recipe.ingredients.length; i++) {
        if (++guard > 20000) return;
        visit(recipe.ingredients[i].id, depth + 1, false);
      }
    }
    visit(rootId, 0, true);
    return { nodes: nodes, edges: edges };
  }

  /** 全ての親が処理済みになる順（Kahn法）。循環があれば残りを後ろに付ける。 */
  function topoOrder(rootId, nodes, edges) {
    var indeg = {}, id, i;
    for (id in nodes) indeg[id] = 0;
    for (id in edges) {
      var ing = edges[id];
      for (i = 0; i < ing.length; i++) {
        if (indeg[ing[i].id] !== undefined) indeg[ing[i].id]++;
      }
    }
    var queue = [], out = [];
    for (id in nodes) if (!indeg[id]) queue.push(+id);
    if (queue.indexOf(rootId) < 0) queue.unshift(rootId);

    var seen = {};
    while (queue.length) {
      var cur = queue.shift();
      if (seen[cur]) continue;
      seen[cur] = 1;
      out.push(cur);
      var e = edges[cur] || [];
      for (i = 0; i < e.length; i++) {
        var c = e[i].id;
        if (indeg[c] === undefined) continue;
        indeg[c]--;
        if (indeg[c] <= 0 && !seen[c]) queue.push(c);
      }
    }
    // 循環などで漏れたものを回収
    for (id in nodes) if (!seen[id]) out.push(+id);
    return out;
  }

  /** アイテム単位の必要数を集計する */
  function aggregate(rootId, rootQty, nodes, edges) {
    var need = {}, crafts = {}, produced = {};
    need[rootId] = rootQty;
    var order = topoOrder(rootId, nodes, edges);

    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      var n = need[id] || 0;
      var info = nodes[id];
      if (!info || !info.expand || n <= 0) continue;
      var r = info.recipe;
      var c = Math.ceil(n / (r.yields || 1));
      crafts[id] = c;
      produced[id] = c * (r.yields || 1);
      for (var k = 0; k < r.ingredients.length; k++) {
        var g = r.ingredients[k];
        need[g.id] = (need[g.id] || 0) + g.amount * c;
      }
    }
    return { need: need, crafts: crafts, produced: produced };
  }

  /**
   * 出品を安い順に必要数ぶん積み上げて総額を出す。
   * @returns {{total:number|null, unit:number|null, source:string, short:number, listingsUsed:number}}
   */
  function walkListings(listings, qty) {
    var remain = qty, total = 0, last = null, used = 0;
    for (var i = 0; i < listings.length && remain > 0; i++) {
      var ppu = listings[i][0], q = listings[i][1];
      var take = Math.min(remain, q);
      total += take * ppu;
      remain -= take;
      last = ppu;
      used++;
    }
    if (remain > 0) {
      if (last === null) return null;               // 出品ゼロ
      total += remain * last;                       // 足りない分は最高値で仮置き
      return { total: total, unit: total / qty, source: 'listing', short: remain, listingsUsed: used };
    }
    return { total: total, unit: total / qty, source: 'listing', short: 0, listingsUsed: used };
  }

  /**
   * 1アイテムの購入原価。
   * @param {object|null} entry 価格キャッシュのエントリ
   * @param {number} qty
   * @param {number|null} override 手入力単価
   * @param {'nq'|'hq'} quality
   */
  function priceItem(entry, qty, override, quality) {
    if (override !== null && override !== undefined && isFinite(override)) {
      return { total: override * qty, unit: override, source: 'manual', short: 0, missing: false };
    }
    if (!entry) {
      return { total: null, unit: null, source: 'none', short: 0, missing: true, reason: '価格未取得' };
    }
    if (entry.untradable) {
      return { total: null, unit: null, source: 'none', short: 0, missing: true, reason: '市場取引不可' };
    }
    var side = entry[quality] || entry.nq;
    var r = walkListings(side.l || [], qty);
    if (r) { r.missing = false; return r; }

    if (side.med) {
      return { total: side.med * qty, unit: side.med, source: 'history', short: 0, missing: false };
    }
    // HQ在庫が無い場合はNQへフォールバック
    if (quality === 'hq') {
      var nq = entry.nq || {};
      var r2 = walkListings(nq.l || [], qty);
      if (r2) { r2.missing = false; r2.source = 'listing-nq'; return r2; }
      if (nq.med) return { total: nq.med * qty, unit: nq.med, source: 'history-nq', short: 0, missing: false };
    }
    return { total: null, unit: null, source: 'none', short: 0, missing: true, reason: '出品・取引履歴なし' };
  }

  /**
   * メイン。ツリー・原価・判定をまとめて返す。
   * @param {{itemId:number, qty:number, scope:string, settings:object, state:object}} input
   */
  function compute(input) {
    var rootId = input.itemId;
    var qty = Math.max(1, Math.floor(input.qty || 1));
    var scope = input.scope;
    var settings = input.settings;
    var state = input.state;

    var rootRecipe = chosenRecipe(rootId, state);
    if (!rootRecipe) return { error: 'このアイテムには製作レシピがありません。' };

    var g = collectGraph(rootId, state, settings);
    var agg = aggregate(rootId, qty, g.nodes, g.edges);

    var rootCrafts = agg.crafts[rootId] || 0;
    var rootProduced = agg.produced[rootId] || 0;

    // ---- 表示ツリー（重複アイテムは初出のみ展開） ----
    var seen = {};
    var appearCount = {};
    (function countAppear(id, depth) {
      appearCount[id] = (appearCount[id] || 0) + 1;
      if (appearCount[id] > 1 || depth > MAX_DEPTH) return;
      var info = g.nodes[id];
      if (!info || !info.expand) return;
      var ing = info.recipe.ingredients;
      for (var i = 0; i < ing.length; i++) countAppear(ing[i].id, depth + 1);
    })(rootId, 0);

    var rows = [];
    (function walk(id, depth, path, branchQty) {
      var info = g.nodes[id] || { expand: false, mode: 'buy', recipe: null };
      var dup = !!seen[id];
      var row = {
        itemId: id,
        depth: depth,
        path: path,
        dup: dup,
        merged: !dup && appearCount[id] > 1,
        branchQty: branchQty,
        need: dup ? branchQty : (agg.need[id] || branchQty),
        // 展開できない（レシピが無い / 深さ上限）のに 'make' が残っている場合は買う扱いに倒す
        mode: depth === 0 ? 'make'
            : (info.expand ? 'make'
                           : (modeOf(id, state, settings) === 'have' ? 'have' : 'buy')),
        recipe: info.recipe,
        recipes: GameData.recipesFor(id),
        crystal: GameData.isCrystal(id),
        crafts: agg.crafts[id] || 0,
        produced: agg.produced[id] || 0,
        children: []
      };
      rows.push(row);
      if (dup) return;
      seen[id] = true;
      if (!info.expand) return;
      var ing = info.recipe.ingredients;
      var c = agg.crafts[id] || 0;
      for (var i = 0; i < ing.length; i++) {
        walk(ing[i].id, depth + 1, path + '/' + ing[i].id, ing[i].amount * c);
      }
    })(rootId, 0, 'r' + rootId, qty);

    // ---- 価格計算 ----
    var pricing = {};       // itemId -> 結果
    var purchase = [];      // 買う扱いのアイテム
    var materialCost = 0;
    var missing = [];
    var shortages = [];
    var oldest = null;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.dup || row.depth === 0) continue;
      if (row.mode !== 'buy') continue;
      if (pricing[row.itemId]) continue;

      var entry = Store.getPrice(scope, row.itemId);
      var ov = state.overrides[row.itemId];
      var p = priceItem(entry, row.need, (ov === undefined || ov === null || ov === '') ? null : Number(ov), 'nq');
      p.qty = row.need;
      p.entry = entry;
      p.error = Universalis.errorFor(row.itemId);
      pricing[row.itemId] = p;
      purchase.push({ itemId: row.itemId, qty: row.need, price: p });

      if (p.missing) missing.push(row.itemId);
      else materialCost += p.total;
      if (p.short) shortages.push(row.itemId);
      if (entry && entry.u && p.source !== 'manual') {
        if (oldest === null || entry.u < oldest) oldest = entry.u;
      }
    }

    // ---- 完成品の価格 ----
    var rootEntry = Store.getPrice(scope, rootId);
    var basis = settings.saleBasis === 'nq' ? 'nq' : 'hq';
    var rootOv = state.overrides[rootId];
    var rootOverride = (rootOv === undefined || rootOv === null || rootOv === '') ? null : Number(rootOv);

    var sale = {
      entry: rootEntry,
      error: Universalis.errorFor(rootId),
      basis: basis,
      hqMin: rootEntry && rootEntry.hq ? rootEntry.hq.min : null,
      hqMed: rootEntry && rootEntry.hq ? rootEntry.hq.med : null,
      hqSales: rootEntry && rootEntry.hq ? rootEntry.hq.n : 0,
      nqMin: rootEntry && rootEntry.nq ? rootEntry.nq.min : null,
      nqMed: rootEntry && rootEntry.nq ? rootEntry.nq.med : null,
      nqSales: rootEntry && rootEntry.nq ? rootEntry.nq.n : 0,
      lastUpload: rootEntry ? rootEntry.u : 0,
      overridden: rootOverride !== null
    };
    if (rootEntry && rootEntry.u && (oldest === null || rootEntry.u < oldest)) oldest = rootEntry.u;

    var basisMin = rootOverride !== null ? rootOverride
                 : (basis === 'hq' ? (sale.hqMin !== null ? sale.hqMin : sale.nqMin)
                                   : sale.nqMin);
    var basisMed = rootOverride !== null ? rootOverride
                 : (basis === 'hq' ? (sale.hqMed !== null ? sale.hqMed : sale.nqMed)
                                   : sale.nqMed);
    sale.usedFallback = (basis === 'hq' && sale.hqMin === null && sale.nqMin !== null && rootOverride === null);
    sale.unitMin = basisMin;
    sale.unitMed = basisMed;

    var feeRate = Math.min(100, Math.max(0, Number(settings.feeRate) || 0)) / 100;

    function money(unit) {
      if (unit === null || unit === undefined) return null;
      var revenue = unit * rootProduced;
      var net = revenue * (1 - feeRate);
      return {
        unit: unit,
        revenue: revenue,
        fee: revenue - net,
        net: net,
        profit: net - materialCost,
        margin: materialCost > 0 ? (net - materialCost) / materialCost : null
      };
    }

    var byMin = money(basisMin);
    var byMed = money(basisMed);

    // ---- 判定: 素材から作る総原価 vs 完成品を同数買う総額 ----
    var buyWhole = null;
    if (rootOverride !== null) {
      buyWhole = { total: rootOverride * rootProduced, unit: rootOverride, source: 'manual', short: 0, missing: false };
    } else if (rootEntry) {
      buyWhole = priceItem(rootEntry, rootProduced, null, basis);
    }

    var verdict = { kind: 'unknown', tier: 'unknown', reason: '' };
    if (missing.length) {
      verdict.reason = '価格が取れていない素材が ' + missing.length + ' 件あります。手入力してください。';
    }
    if (!buyWhole || buyWhole.missing) {
      verdict.reason = verdict.reason || '完成品の市場価格が取得できていません。';
    } else if (!missing.length) {
      var diff = buyWhole.total - materialCost;
      // savingsRate: 完成品を買う場合と比べて、素材から作るとどれだけ浮くか（買値に対する割合）
      var savingsRate = buyWhole.total > 0 ? diff / buyWhole.total
                       : (materialCost > 0 ? -1 : 0);
      verdict.kind = diff > 0 ? 'make' : 'buy';
      verdict.diff = diff;
      verdict.craftCost = materialCost;
      verdict.buyCost = buyWhole.total;
      verdict.ratio = buyWhole.total > 0 ? materialCost / buyWhole.total : null;
      verdict.savingsRate = savingsRate;
      verdict.tier = tierFromRate(savingsRate);
    }

    return {
      rootId: rootId,
      rootRecipe: rootRecipe,
      qty: qty,
      crafts: rootCrafts,
      produced: rootProduced,
      surplus: rootProduced - qty,
      rows: rows,
      pricing: pricing,
      purchase: purchase.sort(function (a, b) {
        var ta = a.price.total || 0, tb = b.price.total || 0;
        return tb - ta;
      }),
      materialCost: materialCost,
      missing: missing,
      shortages: shortages,
      oldestUpload: oldest,
      sale: sale,
      buyWhole: buyWhole,
      byMin: byMin,
      byMed: byMed,
      feeRate: feeRate,
      verdict: verdict
    };
  }

  /** 価格取得が必要なアイテムID一覧（完成品＋買う扱いの素材） */
  function neededItemIds(rootId, qty, state, settings) {
    var g = collectGraph(rootId, state, settings);
    var ids = [rootId], seen = {};
    seen[rootId] = 1;
    for (var id in g.nodes) {
      var n = +id;
      if (seen[n]) continue;
      var info = g.nodes[id];
      if (info.expand) continue;           // 展開される＝それ自体は買わない
      seen[n] = 1;
      ids.push(n);
    }
    // 「所持済み」も含めて取っておく（切り替えた瞬間に再取得せず即計算できるように）
    return ids;
  }

  return {
    compute: compute,
    neededItemIds: neededItemIds,
    modeOf: modeOf,
    chosenRecipe: chosenRecipe
  };
})();
  FF14.craft.Calc = Calc;
})();
