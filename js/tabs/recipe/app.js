/* app.js — 検索・逆引きビュー
 *
 * アイテムを選ぶと2セクションを出す:
 *   A. このアイテムのレシピ（作り方）… GameData.recipesFor() + 素材一覧
 *   B. このアイテムを素材に使うレシピ … Index.usedBy()（逆引き）
 *
 * B は「クラフター職ごとのプルダウン」にまとめてある。既定はすべて閉じた状態で、
 * 見出しに件数とレベル帯だけを出す。開くと表になり、行の ▶ でさらに上位へ辿れる。
 *
 * 表示メモ:
 *   B は入れ子DOMではなく「深さつきのフラットな行の配列」に展開してから描画する。
 *   既存「作る vs 買う」タブのツリーと同じ作りで、グリッドの列が階層をまたいで揃う。
 *   ソートは各階層の兄弟どうしに適用するので、展開しても親子関係は崩れない。
 */
(function () {
  'use strict';

  var S = FF14.reverse.Shell;
  var View = FF14.reverse.View;
  var GameData = FF14.craft.GameData;
  var Index = FF14.reverse.Index;
  var Patch = FF14.reverse.PatchData;

  var LS_LAST = 'ff14reverse.v1.lastItem';

  var GROUP_CAP = 200;   // 1ジョブグループあたりの初期表示件数
  var MAX_DEPTH = 8;     // 展開の深さ上限

  var $ = S.$, esc = S.esc, n = S.n;

  var ui = S.readJSON(S.LS_UI, { ledgerOpen: false, onlyIng: true, sortKey: 'default', sortDir: 1 });
  var currentId = null;
  var expanded = {};         // path -> true（行の ▶ 展開）
  var openJobs = {};         // job -> true（職業プルダウン）
  var showAllJobs = {};      // job -> true（件数上限の解除）
  var shownItemIds = {};     // 台帳エクスポート用
  var shownRecipeIds = {};
  var suggest = null;

  /* ---------------- 起動 ---------------- */
  function init() {
    var q = $('#rcp-q');
    q.disabled = false;
    q.placeholder = 'アイテム名で検索（日本語 / 英語 / アイテムID）';
    $('#rcp-onlyIng').checked = ui.onlyIng !== false;

    suggest = FF14.reverse.Suggest.attach(q, $('#rcp-suggest'), {
      onlyIng: function () { return $('#rcp-onlyIng').checked; },
      onPick: function (id) { selectItem(id); }
    });

    $('#rcp-onlyIng').addEventListener('change', function () {
      ui.onlyIng = $('#rcp-onlyIng').checked;
      S.writeJSON(S.LS_UI, ui);
      suggest.refresh();
    });

    $('#rcp-result').addEventListener('click', onResultClick);
    $('#rcp-ledger').addEventListener('click', onLedgerClick);
    renderLedger();

    View.on('search', function (params) {
      // item=ID があればそれを、無ければ前回見ていたアイテムを開く
      var want = parseInt(params && params.item, 10);
      if (!want) { try { want = parseInt(localStorage.getItem(LS_LAST), 10); } catch (e) {} }
      if (want && GameData.nameOf(want).indexOf('アイテム#') !== 0) {
        if (want !== currentId) selectItem(want, true);
      } else {
        renderWelcome();
        try { q.focus(); } catch (e) {}
      }
    });
  }

  /* ---------------- アイテム選択 ---------------- */
  function selectItem(id, silent) {
    currentId = id;
    expanded = {};
    openJobs = {};          // 「基本は閉じている」状態に戻す
    showAllJobs = {};
    try { localStorage.setItem(LS_LAST, String(id)); } catch (e) {}
    S.pushRecent(id);
    renderItem(id);
    // 単体ページのときだけURL(hash)に反映される。ハブ内では何も起きない。
    View.setParams({ item: id });
    if (!silent) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 逆引きテーブルのソート ----------------
     兄弟どうし（同じ親の下）を並べ替えるので、展開しても階層は崩れない。
     'default' は Index が作った並び（ジョブ → レベル → 完成品名）をそのまま使う。 */
  var SORTS = {
    name:   { get: function (e) { return GameData.nameOf(e.recipe.result); }, text: true },
    amount: { get: function (e) { return e.amount; } },
    level:  { get: function (e) { return S.isNormalJob(e.recipe.job) ? e.recipe.lvl : -1; } },
    patch:  { get: function (e) { return S.patchNum(S.patchInfo('recipe', e.recipe.id).patch); } }
  };

  function sortEntries(list) {
    var s = SORTS[ui.sortKey];
    if (!s) return list;                       // 'default' はそのまま
    var dir = ui.sortDir < 0 ? -1 : 1;
    return list.slice().sort(function (a, b) {
      var va = s.get(a), vb = s.get(b), v;
      if (s.text) v = String(va).localeCompare(String(vb), 'ja');
      else v = va - vb;
      if (!v) {   // 同値のときは完成品名で安定させる
        v = GameData.nameOf(a.recipe.result).localeCompare(GameData.nameOf(b.recipe.result), 'ja');
      }
      return v * dir;
    });
  }

  function setSort(key) {
    if (ui.sortKey === key) ui.sortDir = (ui.sortDir < 0) ? 1 : -1;
    else { ui.sortKey = key; ui.sortDir = 1; }
    S.writeJSON(S.LS_UI, ui);
    if (currentId) renderItem(currentId);
  }

  function sortHead(key, label, cls, title) {
    var on = ui.sortKey === key;
    var arrow = on ? (ui.sortDir < 0 ? '▼' : '▲') : '';
    return '<div class="' + (cls || '') + ' sortable' + (on ? ' on' : '') + '" data-sort="' + key +
           '" title="' + esc(title || (label + 'で並び替え')) + '" role="button" tabindex="0">' +
           esc(label) + '<span class="arrow">' + arrow + '</span></div>';
  }

  /* ---------------- 逆引きの行を組む ---------------- */
  /** 1ジョブぶんの行を、深さつきのフラット配列に展開する */
  function buildRows(entries, rootId, cap) {
    var out = [], truncatedAt = 0;

    (function walk(list, depth, path, ancestry) {
      var sorted = sortEntries(list);
      var limit = sorted.length;
      if (depth === 0 && cap && limit > cap) { truncatedAt = limit; limit = cap; }

      for (var i = 0; i < limit; i++) {
        var e = sorted[i];
        var rid = e.recipe.result;
        var p = path + '/' + e.recipe.id;
        var cyclic = ancestry.indexOf(rid) >= 0;
        var hasMore = !cyclic && depth + 1 < MAX_DEPTH && Index.isIngredient(rid);
        var open = hasMore && !!expanded[p];

        out.push({ itemId: rid, recipe: e.recipe, amount: e.amount,
                   depth: depth, path: p, hasMore: hasMore, open: open, cyclic: cyclic });

        if (open) walk(Index.usedBy(rid), depth + 1, p, ancestry.concat([rid]));
      }
    })(entries, 0, 'r' + rootId, [rootId]);

    return { rows: out, truncatedAt: truncatedAt };
  }

  function rowHTML(row) {
    var r = row.recipe;
    shownItemIds[row.itemId] = 1;
    shownRecipeIds[r.id] = 1;
    var ja = GameData.nameOf(row.itemId);
    var en = GameData.nameEnOf(row.itemId);

    var h = '<div class="rrow depth-' + Math.min(row.depth, 3) + '" data-path="' + esc(row.path) +
            '" data-item="' + row.itemId + '">';

    h += '<div class="name-cell cell">';
    if (row.depth) h += '<span class="indent" style="width:' + (row.depth * 15) + 'px"></span>';
    h += row.hasMore
      ? '<button class="caret" data-tw="1" title="この完成品を素材に使うレシピを開く">' + (row.open ? '▼' : '▶') + '</button>'
      : '<span class="caret blank"></span>';
    h += S.placeholder(row.itemId, ja, 'sm');
    h += '<span class="nm" title="' + esc(ja) + ' / ' + esc(en) + '">' + esc(ja) +
         '<small>' + esc(en) + '</small></span>';
    if (row.cyclic) h += '<span class="cyc" title="循環参照のため展開を止めました">循環</span>';
    h += '</div>';

    h += '<div class="num cell" data-label="必要数">×' + row.amount + '</div>';
    h += '<div class="cell cell-c" data-label="ジョブ">' + S.jobBadge(r.job) + '</div>';
    h += '<div class="num cell' + (S.isNormalJob(r.job) ? '' : ' dim') + '" data-label="Lv">' +
         S.lvText(r.job, r.lvl) + '</div>';
    h += '<div class="num cell' + (r.yields > 1 ? '' : ' dim') + '" data-label="産出">' +
         (r.yields > 1 ? '×' + r.yields : '×1') + '</div>';
    h += '<div class="cell cell-c" data-label="パッチ">' + S.patchText(r.id) + '</div>';
    h += '</div>';
    return h;
  }

  /* ---------------- 結果描画 ---------------- */
  function renderWelcome() {
    $('#rcp-result').innerHTML =
      '<div class="panel"><div class="hint">' +
      '<div class="big">アイテムを検索してください</div>' +
      '<b>作り方</b>（必要な素材）と<b>使い道</b>（そのアイテムを素材に使うレシピ）を並べて表示します。<br>' +
      '<span class="faint">↑↓ で選択、<span class="kbd">Enter</span> で決定。原料でも中間素材でも引けます。</span>' +
      '<div class="examples">' +
      ['アイアンインゴット', 'エルム材', 'ハイスチールインゴット', 'アースクリスタル'].map(function (name) {
        return '<button class="btn tiny" data-example="' + esc(name) + '">' + esc(name) + '</button>';
      }).join('') +
      '</div></div></div>';
  }

  function renderItem(id) {
    shownItemIds = {}; shownRecipeIds = {};
    shownItemIds[id] = 1;

    var ja = GameData.nameOf(id);
    var en = GameData.nameEnOf(id);
    var makeRecipes = GameData.recipesFor(id);
    var uses = Index.usedBy(id);

    var h = '';

    /* --- 対象アイテム --- */
    h += '<div class="item-card">' +
      S.placeholder(id, ja, 'lg') +
      '<div class="item-meta">' +
      '<div class="item-ja">' + esc(ja) + '</div>' +
      '<div class="item-en">' + esc(en) + ' <span class="id">#' + id + '</span></div>' +
      '<div class="item-badges">' +
      (makeRecipes.length ? '<span class="badge ok">作り方 ' + makeRecipes.length + ' レシピ</span>'
                          : '<span class="badge">クラフト不可</span>') +
      (uses.length ? '<span class="badge hot">素材として ' + uses.length + ' レシピ</span>'
                   : '<span class="badge">素材利用なし</span>') +
      (GameData.isCrystal(id) ? '<span class="badge">クリスタル類</span>' : '') +
      S.patchChip('item', id) +
      '</div></div></div>';

    h += renderMakeSection(id, ja, makeRecipes);
    h += renderUseSection(id, ja, uses, makeRecipes.length);

    $('#rcp-result').innerHTML = h;
    S.prefetch(Object.keys(shownItemIds).map(Number));
    S.hydrate($('#rcp-result'));
    renderLedger();
  }

  /* --- A. このアイテムのレシピ（作り方） --- */
  function renderMakeSection(id, ja, recipes) {
    var h = '<div class="panel">';
    h += '<div class="panel-h"><strong>このアイテムのレシピ（作り方）</strong>' +
         '<span class="count">' + (recipes.length ? recipes.length + ' 件' : 'なし') + '</span></div>';

    if (!recipes.length) {
      h += '<div class="empty">' +
        '<div class="big">「' + esc(ja) + '」はクラフトでは作れません</div>' +
        '<div class="why">レシピDBにこのアイテムの製作レシピがありません。' +
        '採集・討伐・購入・交換・クエスト報酬などで入手するアイテムです。</div>' +
        '</div></div>';
      return h;
    }

    h += '<ul class="make-list">';
    recipes.forEach(function (r) {
      shownRecipeIds[r.id] = 1;
      h += '<li class="make-recipe">';
      h += '<div class="mr-head">' +
        S.jobBadge(r.job) +
        '<span class="num mr-lv">' + S.lvText(r.job, r.lvl) + '</span>' +
        '<span class="dim">素材 ' + r.ingredients.length + ' 種' +
        (r.yields > 1 ? ' · 1回で ×' + r.yields + ' 産出' : '') + '</span>' +
        '<span class="mr-patch">' + S.patchChip('recipe', r.id) + '</span>' +
        '</div>';
      h += '<ul class="ing-list">';
      r.ingredients.forEach(function (g) {
        shownItemIds[g.id] = 1;
        var gja = GameData.nameOf(g.id);
        var gen = GameData.nameEnOf(g.id);
        h += '<li class="ing" data-goto="' + g.id + '" title="' + esc(gja) + ' に移動">' +
          S.placeholder(g.id, gja, 'sm') +
          '<span class="nm">' + esc(gja) + '<small>' + esc(gen) + '</small></span>' +
          (GameData.isCraftable(g.id) ? '<span class="badge ok tiny-b">中間素材</span>' : '') +
          '<span class="num ing-qty">×' + g.amount + '</span>' +
          '</li>';
      });
      h += '</ul></li>';
    });
    h += '</ul></div>';
    return h;
  }

  /* --- B. 逆引き（クラフター職ごとのプルダウン） --- */
  function renderUseSection(id, ja, uses, makeCount) {
    var h = '<div class="panel">';
    h += '<div class="panel-h"><strong>このアイテムを素材に使うレシピ</strong>' +
         '<span class="count">' + uses.length + ' 件</span></div>';

    if (!uses.length) {
      h += emptyUseHTML(id, ja, makeCount) + '</div>';
      return h;
    }

    // ジョブごとに束ねる（並びは Shell.JOBS の順）
    var byJob = {};
    uses.forEach(function (e) { (byJob[e.recipe.job] || (byJob[e.recipe.job] = [])).push(e); });
    var groups = S.JOBS.filter(function (j) { return byJob[j.job]; })
      .map(function (j) { return { job: j.job, name: j.name, entries: byJob[j.job] }; });

    var anyOpen = groups.some(function (g) { return openJobs[g.job]; });
    h += '<div class="grp-bar">' +
      '<span class="dim">クラフター職ごとにまとまっています。見出しをクリックで開閉。</span>' +
      '<span class="grp-bar-r">' +
      '<button class="btn tiny" data-allgrp="' + (anyOpen ? 'close' : 'open') + '">' +
      (anyOpen ? '全て閉じる' : '全て開く') + '</button></span></div>';

    groups.forEach(function (g) {
      var open = !!openJobs[g.job];
      var lvs = g.entries.filter(function (e) { return S.isNormalJob(e.recipe.job); })
                         .map(function (e) { return e.recipe.lvl; });
      var lvTxt = lvs.length ? 'Lv' + Math.min.apply(null, lvs) +
                  (Math.min.apply(null, lvs) === Math.max.apply(null, lvs) ? '' : '〜' + Math.max.apply(null, lvs))
                : '—';

      h += '<div class="jobgrp' + (open ? ' open' : '') + '" data-job="' + g.job + '">';
      h += '<button class="jobgrp-h" data-grp="' + g.job + '" aria-expanded="' + open + '">' +
        '<span class="jg-caret">' + (open ? '▼' : '▶') + '</span>' +
        S.jobBadge(g.job) +
        '<span class="jg-name">' + esc(g.name) + '</span>' +
        '<span class="jg-lv dim">' + esc(lvTxt) + '</span>' +
        '<span class="jg-count">' + g.entries.length + ' 件</span>' +
        '</button>';

      h += '<div class="jobgrp-body"' + (open ? '' : ' hidden') + '>';
      if (open) {
        var cap = showAllJobs[g.job] ? 0 : GROUP_CAP;
        var built = buildRows(g.entries, id, cap);
        h += '<div class="rev-head">' +
          sortHead('name', '完成品', '', '完成品名で並び替え') +
          sortHead('amount', '必要数', 'r') +
          '<div class="c">ジョブ</div>' +
          sortHead('level', 'Lv', 'r', 'クラスレベルで並び替え') +
          '<div class="r">産出</div>' +
          sortHead('patch', 'パッチ', 'c', '対応パッチで並び替え') +
          '</div>';
        for (var i = 0; i < built.rows.length; i++) h += rowHTML(built.rows[i]);
        if (built.truncatedAt) {
          h += '<button class="more" data-showall="' + g.job + '">残り ' +
               (built.truncatedAt - GROUP_CAP) + ' 件を表示（全 ' + built.truncatedAt + ' 件）</button>';
        }
      }
      h += '</div></div>';
    });

    h += '</div>';
    return h;
  }

  /** 逆引き0件のときに「壊れている」と誤解されないよう、理由と次の一手を出す */
  function emptyUseHTML(id, ja, makeCount) {
    var h = '<div class="empty">';
    h += '<div class="big">「' + esc(ja) + '」を素材に使うレシピはありません</div>';
    h += '<div class="why">';
    h += 'このアイテムは<b>完成品側</b>か、製作に使われないアイテムです。';
    if (makeCount) h += '（作り方は上のセクションにあります）';
    h += '<br>FF14のアイテム ' + n(GameData.itemCount()) + ' 件のうち、どこかのレシピで素材として使われるのは <b>' +
         n(Index.ingredientItemCount()) + ' 件</b>だけなので、装備やミニオンなどはここが 0 件になります。';
    h += '<br><span class="faint">検索欄の「素材になるものだけ」にチェックを入れると、逆引きできるアイテムだけが候補に出ます。</span>';
    h += '</div>';
    h += '<div class="acts"><button class="btn primary" data-focus-search="1">別のアイテムを検索</button>' +
         '<a class="btn" ' + S.viewLinkAttrs('browse') + '>条件から探す</a></div>';
    h += '</div>';
    return h;
  }

  /* ---------------- 操作 ---------------- */
  function onResultClick(e) {
    var grp = e.target.closest('[data-grp]');
    if (grp) {
      var j = +grp.getAttribute('data-grp');
      if (openJobs[j]) delete openJobs[j]; else openJobs[j] = true;
      renderItem(currentId);
      var again = $('#rcp-result').querySelector('.jobgrp[data-job="' + j + '"]');
      if (again) again.scrollIntoView({ block: 'nearest' });
      return;
    }

    var all = e.target.closest('[data-allgrp]');
    if (all) {
      if (all.getAttribute('data-allgrp') === 'open') {
        Index.usedBy(currentId).forEach(function (x) { openJobs[x.recipe.job] = true; });
      } else openJobs = {};
      renderItem(currentId);
      return;
    }

    var sortEl = e.target.closest('[data-sort]');
    if (sortEl) { setSort(sortEl.getAttribute('data-sort')); return; }

    var tw = e.target.closest('[data-tw]');
    if (tw) {
      var row = tw.closest('.rrow');
      var p = row.dataset.path;
      if (expanded[p]) delete expanded[p]; else expanded[p] = true;
      renderItem(currentId);
      var back = $('#rcp-result').querySelector('.rrow[data-path="' + p.replace(/"/g, '\\"') + '"]');
      if (back) back.scrollIntoView({ block: 'nearest' });
      return;
    }

    var more = e.target.closest('[data-showall]');
    if (more) { showAllJobs[+more.getAttribute('data-showall')] = true; renderItem(currentId); return; }

    var ep = e.target.closest('[data-edit-patch]');
    if (ep) { editPatch(ep.getAttribute('data-edit-patch'), ep.getAttribute('data-pid')); return; }

    var goto = e.target.closest('[data-goto]');
    if (goto) { selectItem(+goto.getAttribute('data-goto')); return; }

    var ex = e.target.closest('[data-example]');
    if (ex) { suggest.setQuery(ex.getAttribute('data-example')); return; }

    if (e.target.closest('[data-focus-search]')) { $('#rcp-q').focus(); return; }

    var nm = e.target.closest('.nm');
    if (nm) {
      var r2 = nm.closest('.rrow');
      if (r2) selectItem(+r2.dataset.item);
    }
  }

  /* ---------------- パッチ台帳 ---------------- */
  function editPatch(kind, id) {
    var cur = S.patchInfo(kind, id);
    var rec = kind === 'recipe' ? GameData.recipeById(id) : null;
    var name = kind === 'item' ? GameData.nameOf(id)
             : (rec ? GameData.nameOf(rec.result) + ' のレシピ' : 'レシピ#' + id);
    var v = window.prompt(
      name + '\n' + (kind === 'item' ? 'アイテム' : 'レシピ') + 'ID: ' + id +
      '\n\nパッチ番号を入力してください（空欄で削除）。\n' +
      '※ ここでの編集は localStorage 保存です。恒久化するには\n' +
      '　 台帳パネルから書き出して js/patchdata.js に貼ってください。',
      cur.source === 'default' ? '' : cur.patch);
    if (v === null) return;
    v = v.trim();
    if (kind === 'item') Patch.setItemPatch(id, v); else Patch.setRecipePatch(id, v);
    if (currentId) renderItem(currentId);
  }

  function renderLedger() {
    var m = Patch.meta;
    var open = !!ui.ledgerOpen;
    var h = '';
    h += '<div class="panel-h" data-ledger-toggle="1">' +
      '<strong>' + (open ? '▼' : '▶') + ' パッチ台帳 / データ更新</strong>' +
      '<span>台帳更新 ' + esc(m.updated) + ' · 既定 P≧' + esc(m.defaultPatch) +
      ' · ローカル補記 <b>' + Patch.localCount() + '</b> 件</span></div>';
    h += '<div class="ledger-body"' + (open ? '' : ' hidden') + '>';
    h += '<p>前提データ: ' + esc(m.datasetLabel) + '。パッチ台帳（<code>js/patchdata.js</code>）は手管理です。' +
      '逆引きテーブルのパッチ列は<b>表示・並び替え専用</b>で、値を直したいときは' +
      '「作り方」セクションや対象アイテムの <code>P…</code> ボタンから補記してください' +
      '（<code>≧</code> 付きは台帳未登録の暫定表示）。</p>';
    h += '<div class="ledger-btns">';
    h += '<button class="btn" data-export="shown">表示中のアイテム/レシピを雛形に含めて書き出す</button>';
    h += '<button class="btn ghost" data-export="file">現在の台帳をそのまま書き出す</button>';
    if (Patch.localCount()) h += '<button class="btn danger" data-clear-local="1">ローカル補記を消す</button>';
    h += '</div>';
    h += '<textarea class="ledger-out" readonly hidden placeholder="ここに出力されます"></textarea>';
    h += '</div>';
    $('#rcp-ledger').innerHTML = h;
  }

  function onLedgerClick(e) {
    if (e.target.closest('[data-ledger-toggle]')) {
      ui.ledgerOpen = !ui.ledgerOpen;
      S.writeJSON(S.LS_UI, ui);
      renderLedger();
      return;
    }
    var ex = e.target.closest('[data-export]');
    if (ex) {
      var out = $('.ledger-out', $('#rcp-ledger'));
      var shown = ex.getAttribute('data-export') === 'shown';
      out.value = Patch.exportMerged(shown ? Object.keys(shownItemIds) : [],
                                     shown ? Object.keys(shownRecipeIds) : []);
      out.hidden = false;
      out.focus();
      out.select();
      return;
    }
    if (e.target.closest('[data-clear-local]')) {
      if (window.confirm('画面から補記したパッチ情報（localStorage）を全て消します。よろしいですか？')) {
        Patch.clearLocal();
        renderLedger();
        if (currentId) renderItem(currentId);
      }
    }
  }

  FF14.reverse.Search = {
    init: init,
    refresh: function () { if (currentId) renderItem(currentId); renderLedger(); }
  };
})();
