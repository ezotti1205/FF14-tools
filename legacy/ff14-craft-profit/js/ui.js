/* ui.js — 描画まわり */
window.UI = (function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  // ---------- 整形 ----------
  function gil(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString('ja-JP');
  }
  function gilG(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return gil(n) + ' G';
  }
  function signed(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + gil(n) + ' G';
  }
  function pct(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function rel(ts) {
    if (!ts) return '—';
    var d = Date.now() - ts;
    if (d < 0) d = 0;
    var m = Math.floor(d / 60000);
    if (m < 1) return 'たった今';
    if (m < 60) return m + '分前';
    var h = Math.floor(m / 60);
    if (h < 24) return h + '時間前';
    var day = Math.floor(h / 24);
    if (day < 30) return day + '日前';
    return Math.floor(day / 30) + 'ヶ月前';
  }
  function freshClass(ts) {
    if (!ts) return 'none';
    var d = Date.now() - ts;
    if (d < 6 * 3600e3) return 'fresh';
    if (d < 3 * 24 * 3600e3) return 'stale';
    return 'old';
  }
  function absTime(ts) {
    if (!ts) return '未取得';
    try { return new Date(ts).toLocaleString('ja-JP'); } catch (e) { return String(ts); }
  }

  // ---------- 汎用UI ----------
  var toastTimer = null;
  function toast(msg, ms) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, ms || 2600);
  }

  function banner(msg, kind, actionLabel, onAction) {
    var el = $('#banner');
    if (!msg) { el.hidden = true; el.innerHTML = ''; return; }
    el.className = 'banner' + (kind === 'err' ? ' err' : '');
    el.innerHTML = '<span>' + esc(msg) + '</span>';
    if (actionLabel) {
      var b = document.createElement('button');
      b.className = 'btn';
      b.textContent = actionLabel;
      b.onclick = onAction;
      el.appendChild(b);
    }
    el.hidden = false;
  }

  // ---------- ワールド選択 ----------
  function fillScopeSelect(sel, worldData, settings) {
    sel.innerHTML = '';
    if (!worldData) {
      var o = document.createElement('option');
      o.value = 'dc:' + settings.scopeName;
      o.textContent = settings.scopeName + '（一覧取得失敗）';
      sel.appendChild(o);
      sel.value = o.value;
      return;
    }
    var worldById = {};
    (worldData.worlds || []).forEach(function (w) { worldById[w.id] = w.name; });

    var regions = {};
    (worldData.dcs || []).forEach(function (dc) {
      (regions[dc.region] || (regions[dc.region] = [])).push(dc);
    });

    Object.keys(regions).forEach(function (region) {
      var og = document.createElement('optgroup');
      og.label = region;
      regions[region].forEach(function (dc) {
        var od = document.createElement('option');
        od.value = 'dc:' + dc.name;
        od.textContent = '★ ' + dc.name + '（DC全体）';
        og.appendChild(od);
        (dc.worlds || []).forEach(function (wid) {
          if (!worldById[wid]) return;
          var ow = document.createElement('option');
          ow.value = 'world:' + worldById[wid];
          ow.textContent = '　' + worldById[wid];
          og.appendChild(ow);
        });
      });
      sel.appendChild(og);
    });

    var want = settings.scopeType + ':' + settings.scopeName;
    sel.value = want;
    if (sel.value !== want) {
      var fb = document.createElement('option');
      fb.value = want;
      fb.textContent = settings.scopeName;
      sel.insertBefore(fb, sel.firstChild);
      sel.value = want;
    }
  }

  // ---------- 検索候補 ----------
  function renderSuggest(box, list, activeIndex) {
    if (!list.length) {
      box.innerHTML = '<div class="sg-empty">一致するアイテムがありません</div>';
      box.hidden = false;
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      html += '<div class="sg' + (i === activeIndex ? ' on' : '') + '" data-id="' + it.id + '" data-i="' + i + '">' +
              '<span class="sg-name">' + esc(it.ja) +
              (it.craftable ? '' : ' <span class="badge">レシピ無し</span>') +
              '<div class="sg-en">' + esc(it.en) + '</div></span>' +
              '<span class="sg-id">#' + it.id + '</span>' +
              '</div>';
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  // ---------- 対象バー ----------
  function renderTarget(el, result) {
    var id = result.rootId;
    var r = result.rootRecipe;
    var recipes = GameData.recipesFor(id);
    var html = '';
    html += '<div><div class="t-name">' + esc(GameData.nameOf(id)) + '</div>' +
            '<div class="t-en">' + esc(GameData.nameEnOf(id)) + ' / #' + id + '</div></div>';

    if (recipes.length > 1) {
      html += '<select class="ctl" id="recipeSel" title="使用するレシピ">';
      for (var i = 0; i < recipes.length; i++) {
        html += '<option value="' + recipes[i].id + '"' + (recipes[i].id === r.id ? ' selected' : '') + '>' +
                esc(GameData.jobName(recipes[i].job)) + ' Lv' + recipes[i].lvl + '（1回 ' + recipes[i].yields + '個）' +
                '</option>';
      }
      html += '</select>';
    } else {
      html += '<span class="badge">' + esc(GameData.jobName(r.job)) + ' Lv' + r.lvl + '</span>';
      html += '<span class="badge">1回 ' + r.yields + '個</span>';
    }

    html += '<div class="t-spacer"></div>';
    html += '<div class="t-qty"><label for="qty">作る個数</label>' +
            '<input id="qty" type="number" min="1" step="1" value="' + result.qty + '"></div>';
    html += '<div class="t-meta">製作 ' + result.crafts + ' 回 → ' + result.produced + ' 個' +
            (result.surplus > 0 ? '（余剰 ' + result.surplus + ' 個）' : '') + '</div>';
    el.className = 'target-bar';
    el.innerHTML = html;
  }

  // ---------- ツリー ----------
  function modeButtons(row) {
    var canMake = row.recipes && row.recipes.length > 0;
    function b(mode, label, title) {
      var on = row.mode === mode ? ' on' : '';
      var dis = (mode === 'make' && !canMake) ? ' disabled' : '';
      return '<button type="button" data-mode="' + mode + '" class="' + on.trim() + '"' + dis +
             ' title="' + esc(title) + '">' + label + '</button>';
    }
    return '<div class="modes">' +
      b('buy', '買う', 'マーケットで購入した価格を原価に算入') +
      b('make', '作る', 'さらにレシピを展開して素材から計算') +
      b('have', '所持', '所持済み／採集済みとして原価0で扱う') +
      '</div>';
  }

  function renderTree(el, result, state) {
    var rows = result.rows;
    var html = '';
    var hideBelow = null;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (hideBelow !== null) {
        if (row.depth > hideBelow) continue;
        hideBelow = null;
      }
      var hasChildren = !row.dup && !!(rows[i + 1] && rows[i + 1].depth === row.depth + 1);
      var collapsed = !!state.collapsed[row.path];
      if (hasChildren && collapsed) hideBelow = row.depth;

      var isRoot = row.depth === 0;
      var p = isRoot ? result.buyWhole : result.pricing[row.itemId];
      var ov = state.overrides[row.itemId];
      var hasOv = !(ov === undefined || ov === null || ov === '');

      var cls = 'trow';
      if (row.mode === 'have') cls += ' have';
      if (!isRoot && row.mode === 'buy' && p && p.missing) cls += ' missing';

      html += '<div class="' + cls + '" data-item="' + row.itemId + '" data-path="' + esc(row.path) + '">';

      // 名前
      html += '<div class="c-name-cell">';
      html += '<span class="indent" style="width:' + (row.depth * 14) + 'px"></span>';
      if (hasChildren) {
        html += '<span class="caret" data-act="toggle">' + (collapsed ? '▶' : '▼') + '</span>';
      } else {
        html += '<span class="caret blank"></span>';
      }
      html += '<span class="nm" title="' + esc(GameData.nameEnOf(row.itemId)) + ' / #' + row.itemId + '">' +
              esc(GameData.nameOf(row.itemId)) +
              (isRoot ? ' <small>完成品</small>' : '') + '</span>';
      if (row.dup) html += '<span class="badge" title="このアイテムは上の行で合算済みです">↑集計済み</span>';
      else if (row.merged) html += '<span class="badge" title="複数の枝で使われるため合算した数量です">合算</span>';
      if (row.crystal) html += '<span class="badge">クリスタル</span>';
      if (!isRoot && row.mode === 'make' && row.recipe) {
        html += '<span class="badge" title="製作回数">×' + row.crafts + '回</span>';
      }
      if (p && p.short) html += '<span class="flag" title="出品数が必要数に足りません。不足分は最高値で仮計算しています。">出品不足 ' + p.short + '</span>';
      if (p && p.source === 'history') html += '<span class="flag" title="現在出品がないため、直近取引の中央値で計算しています。">出品なし</span>';
      if (p && p.missing) html += '<span class="flag bad" title="' + esc((p.reason || '') + (p.error ? ' / ' + p.error : '')) + '">価格なし→手入力</span>';
      html += '</div>';

      // 必要数
      html += '<div class="cell cell-qty num" data-label="必要数">' + row.need.toLocaleString('ja-JP') + '</div>';

      // 扱い
      html += '<div class="cell cell-mode" data-label="扱い">';
      if (isRoot) {
        html += '<span class="badge">買った場合の総額 →</span>';
      } else {
        html += modeButtons(row);
      }
      html += '</div>';

      // 単価（手入力で上書き可）
      var marketUnit = p && p.unit !== null && p.unit !== undefined && !hasOv ? Math.round(p.unit) : '';
      var ovrDisabled = !isRoot && (row.mode === 'have' || row.mode === 'make');
      html += '<div class="cell cell-unit" data-label="単価"><input class="ovr' + (hasOv ? ' set' : '') + '" type="number" min="0" step="1"' +
              ' data-act="override" inputmode="numeric"' +
              (ovrDisabled ? ' disabled' : '') +
              ' value="' + (hasOv ? esc(ov) : '') + '"' +
              ' placeholder="' + (marketUnit === '' ? (ovrDisabled ? '—' : '手入力') : marketUnit) + '"' +
              ' title="市場価格を上書きする単価。空欄ならUniversalisの価格を使用します。"></div>';

      // 小計（重複行と「作る」行は上位/子で計上済みなので出さない）
      var sub = (row.mode === 'have' && !isRoot) ? 0 : (p ? p.total : null);
      var subCell;
      if (row.dup) subCell = '<span title="この数量は上の行に合算済みです">—</span>';
      else if (row.mode === 'make' && !isRoot) subCell = '<span title="子素材の合計として計上されます">—</span>';
      else subCell = gil(sub);
      html += '<div class="cell cell-sub num' + ((row.mode === 'have' && !isRoot) ? ' dim' : '') + '" data-label="小計">' + subCell + '</div>';

      // 更新
      var upTs = p && p.entry ? p.entry.u : (isRoot && result.sale.entry ? result.sale.entry.u : 0);
      html += '<div class="cell cell-upd" data-label="更新">';
      if (row.mode === 'make' && !isRoot) {
        html += '<span class="upd none">—</span>';
      } else if (hasOv) {
        html += '<span class="upd none" title="手入力の単価を使用中">手入力</span>';
      } else {
        html += '<span class="upd ' + freshClass(upTs) + '" title="' + esc(absTime(upTs)) + '">' + rel(upTs) + '</span>';
      }
      html += '</div>';

      html += '</div>';
    }
    el.innerHTML = html;
  }

  // ---------- 買い物リスト ----------
  function renderShop(el, result) {
    if (!result.purchase.length) {
      el.innerHTML = '<div class="kv"><span class="k">買う扱いの素材はありません</span></div>';
      return;
    }
    var html = '';
    for (var i = 0; i < result.purchase.length; i++) {
      var it = result.purchase[i];
      html += '<div class="kv"><span class="k">' + esc(GameData.nameOf(it.itemId)) +
              ' <small>× ' + it.qty.toLocaleString('ja-JP') +
              (it.price.unit ? ' ／ 単価 ' + gil(it.price.unit) : '') + '</small></span>' +
              '<span class="v' + (it.price.missing ? ' na' : '') + '">' + gilG(it.price.total) + '</span></div>';
    }
    el.innerHTML = html;
  }

  function shopText(result) {
    var lines = ['【' + GameData.nameOf(result.rootId) + ' ×' + result.produced + ' の買い物リスト】'];
    result.purchase.forEach(function (it) {
      lines.push(GameData.nameOf(it.itemId) + ' ×' + it.qty +
                 '  ' + (it.price.total === null ? '価格不明' : gilG(it.price.total)));
    });
    lines.push('合計 ' + gilG(result.materialCost));
    return lines.join('\n');
  }

  // ---------- 判定 ----------
  var TIER_LABEL = {
    high: '高利益', mid: '中利益', low: '低利益',
    even: '利益なし', loss: '損失あり'
  };
  var TIER_NOTE = {
    high: '素材から作ると買うより30%以上お得です',
    mid: '素材から作ると買うより10〜30%お得です',
    low: '素材から作ったほうがわずかにお得です',
    even: '作っても買ってもほぼ差はありません',
    loss: '素材から作ると買うより高くつきます'
  };

  function renderVerdict(el, result) {
    var v = result.verdict;
    if (v.kind === 'unknown') {
      el.className = 'verdict none';
      el.innerHTML = '<div class="v-label">判定</div><div class="v-main">判定不能</div>' +
                     '<div class="v-sub">' + esc(v.reason || '価格情報が不足しています') + '</div>';
      return;
    }
    var tier = v.tier || 'even';
    el.className = 'verdict tier-' + tier;
    el.innerHTML =
      '<div class="v-label">' + result.produced + ' 個ぶんの比較</div>' +
      '<div class="v-main">' + esc(TIER_LABEL[tier] || '—') + '</div>' +
      '<div class="v-sub">' + esc(TIER_NOTE[tier] || '') + '<br>' +
      '差額 <b>' + gilG(Math.abs(v.diff)) + '</b>' +
      '（原価 ' + gilG(v.craftCost) + ' vs 完成品 ' + gilG(v.buyCost) + '）</div>';
  }

  // ---------- サマリ ----------
  function kv(k, v, opt) {
    opt = opt || {};
    return '<div class="kv' + (opt.strong ? ' strong' : '') + '"' +
           (opt.title ? ' title="' + esc(opt.title) + '"' : '') + '>' +
           '<span class="k">' + k + (opt.sub ? '<small>' + opt.sub + '</small>' : '') + '</span>' +
           '<span class="v ' + (opt.cls || '') + '">' + v + '</span></div>';
  }

  function panel(title, body, right) {
    return '<div class="panel"><div class="panel-h"><span>' + title + '</span>' +
           (right ? '<span>' + right + '</span>' : '') + '</div>' + body + '</div>';
  }

  function renderSummary(el, result, settings) {
    var s = result.sale;
    var html = '';

    // 原価
    var costBody =
      kv('素材の合計原価', gilG(result.materialCost), { strong: true, sub: '「買う」扱いのみ合算' }) +
      kv('完成品を買う場合', gilG(result.buyWhole && !result.buyWhole.missing ? result.buyWhole.total : null),
         { sub: result.produced + ' 個ぶん・' + (s.basis === 'hq' ? 'HQ基準' : 'NQ基準') }) +
      kv('買う素材', result.purchase.length + ' 種') +
      (result.missing.length ? kv('価格未取得', '<span class="na">' + result.missing.length + ' 種</span>',
         { sub: '単価欄に手入力してください' }) : '') +
      (result.shortages.length ? kv('出品不足', result.shortages.length + ' 種',
         { sub: '不足分は最高値で仮計算' }) : '');
    html += panel('原価', costBody);

    // 完成品価格
    var priceBody =
      kv('HQ 最安値', gilG(s.hqMin), { cls: s.hqMin === null ? 'na' : '' }) +
      kv('HQ 中央値', gilG(s.hqMed), { sub: '直近取引 ' + s.hqSales + ' 件', cls: s.hqMed === null ? 'na' : '' }) +
      kv('NQ 最安値', gilG(s.nqMin), { cls: s.nqMin === null ? 'na' : '' }) +
      kv('NQ 中央値', gilG(s.nqMed), { sub: '直近取引 ' + s.nqSales + ' 件', cls: s.nqMed === null ? 'na' : '' }) +
      kv('最終更新', rel(s.lastUpload), { sub: absTime(s.lastUpload), cls: '' }) +
      (s.overridden ? kv('手入力', gilG(s.unitMin), { sub: '市場価格を上書き中' }) : '') +
      (s.usedFallback ? kv('注意', '<span class="na">HQ出品なし</span>', { sub: 'NQ価格で代替しています' }) : '');
    html += panel('完成品の相場', priceBody, esc(settings.scopeName));

    // 売却シミュレーション
    function block(label, m) {
      if (!m) return kv(label, '<span class="na">—</span>');
      return kv(label + ' 手取り', gilG(m.net), { sub: '売値 ' + gil(m.unit) + ' × ' + result.produced + ' − 手数料 ' + gil(m.fee) }) +
             kv(label + ' 利益', signed(m.profit), { cls: m.profit >= 0 ? 'pos' : 'neg' }) +
             kv(label + ' 利益率', pct(m.margin), { sub: '対原価', cls: m.margin === null ? 'na' : (m.margin >= 0 ? 'pos' : 'neg') });
    }
    var sellBody =
      kv('手数料率', (settings.feeRate) + '%') +
      block('最安値基準', result.byMin) +
      block('中央値基準', result.byMed);
    html += panel('売った場合', sellBody);

    // データ鮮度
    var freshBody =
      kv('最も古い価格', rel(result.oldestUpload), { sub: absTime(result.oldestUpload), cls: freshClass(result.oldestUpload) === 'old' ? 'neg' : '' }) +
      kv('ワールド/DC', esc(settings.scopeName));
    html += panel('データ鮮度', freshBody);

    el.innerHTML = html;
  }

  return {
    $: $,
    gil: gil, gilG: gilG, signed: signed, pct: pct, esc: esc,
    rel: rel, absTime: absTime, freshClass: freshClass,
    toast: toast, banner: banner,
    fillScopeSelect: fillScopeSelect,
    renderSuggest: renderSuggest,
    renderTarget: renderTarget,
    renderTree: renderTree,
    renderShop: renderShop,
    shopText: shopText,
    renderVerdict: renderVerdict,
    renderSummary: renderSummary
  };
})();
