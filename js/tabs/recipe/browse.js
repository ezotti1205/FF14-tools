/* browse.js — 条件から探すビュー
 *
 * レシピDBが持つのは id / job / lvl / yields / result / ingredients だけなので、
 * 絞り込みもこの範囲で作れるものに限っている。
 *   ・製作クラス（job）        … 木工師〜調理師 / カンパニークラフト(job:0) / 特殊製作(job:-10)
 *   ・製作Lv帯（lvl を5刻み）
 *   ・産出数（yields）
 *   ・素材数（ingredients.length）
 *   ・素材としての使われ方      … Index で「他レシピの素材になるか」を判定して中間素材/最終成果物
 *   ・対応パッチ                … PatchData の値
 *
 * 公式サイトにある「秘伝書」「友好部族クエスト」「ハウジング」などの分類は
 * 元データに項目が無いため作れない（dataNote に明記している）。
 */
(function () {
  'use strict';

  var S = FF14.reverse.Shell;
  var View = FF14.reverse.View;
  var GameData = FF14.craft.GameData;
  var Index = FF14.reverse.Index;

  var $ = S.$, esc = S.esc, n = S.n;
  var RESULT_CAP = 200;
  var RESULT_STEP = 500;   // 「もっと見る」1回で足す件数。アイコンキャッシュを溢れさせないため段階的に出す

  var all = [];
  var filter = { job: 8, lv: null, yields: null, ing: null, use: null, patch: null };
  var shown = RESULT_CAP;
  var ready = false;

  /* ---------------- 判定 ---------------- */
  function lvBand(lvl) { return Math.floor((lvl - 1) / 5) * 5 + 1; }        // 1,6,11,…,96
  function lvBandLabel(start) { return '製作Lv ' + start + '-' + (start + 4); }

  function yieldKey(y) { return y > 1 ? 'multi' : 'one'; }
  function ingKey(len) { return len >= 8 ? '8+' : String(len); }
  function useKey(recipe) { return Index.isIngredient(recipe.result) ? 'mid' : 'final'; }
  function patchKeyOf(recipe) { return S.patchInfo('recipe', recipe.id).patch || '?'; }

  var FACETS = {
    lv:     { label: '製作Lv',              key: function (r) { return String(lvBand(r.lvl)); },
              text: function (k) { return lvBandLabel(+k); },
              order: function (a, b) { return (+a) - (+b); },
              skip:  function (r) { return !S.isNormalJob(r.job); } },
    yields: { label: '産出数',              key: function (r) { return yieldKey(r.yields); },
              text: function (k) { return k === 'multi' ? '1回で2個以上' : '1回で1個'; },
              order: function (a, b) { return a === 'one' ? -1 : 1; } },
    ing:    { label: '素材数',              key: function (r) { return ingKey(r.ingredients.length); },
              text: function (k) { return k === '8+' ? '素材 8種以上' : '素材 ' + k + '種'; },
              order: function (a, b) { return (a === '8+' ? 99 : +a) - (b === '8+' ? 99 : +b); } },
    use:    { label: '素材としての使われ方', key: useKey,
              text: function (k) { return k === 'mid' ? '中間素材（他レシピの素材になる）' : '最終成果物（素材にならない）'; },
              order: function (a, b) { return a === 'mid' ? -1 : 1; } },
    patch:  { label: '対応パッチ',           key: patchKeyOf,
              text: function (k) { return 'パッチ ' + k; },
              order: function (a, b) { return S.patchNum(a) - S.patchNum(b); } }
  };
  var FKEYS = Object.keys(FACETS);
  var CLEAR_ALL = '*';

  /* ---------------- 起動 ---------------- */
  function init() {
    loadAll();

    $('#rcp-jobTabs').addEventListener('click', onJobClick);
    $('#rcp-cards').addEventListener('click', onCardClick);
    $('#rcp-chips').addEventListener('click', handleClear);
    $('#rcp-results').addEventListener('click', function (e) {
      if (e.target.closest('[data-more]')) { shown += RESULT_STEP; renderResults(); return; }
      handleClear(e);
    });

    $('#rcp-dataNote').innerHTML =
      '絞り込みに使えるのは、レシピDBが実際に持っている項目だけです（製作クラス / 製作Lv / 産出数 / 素材数 / ' +
      '素材としての使われ方 / 対応パッチ）。<br>' +
      '公式サイトにある「秘伝書」「収集品取引」「友好部族クエスト」「ハウジング」「お得意様取引」などの分類は、' +
      '元データ（ffxiv-teamcraft の recipes.json）にその情報が無いため再現できません。';

    View.on('browse', function (params) { applyParams(params); render(); });
    ready = true;
  }

  function loadAll() {
    all = [];
    GameData.eachRecipe(function (r) { all.push(r); });
    all.sort(function (a, b) {
      return (a.lvl - b.lvl) ||
             GameData.nameOf(a.result).localeCompare(GameData.nameOf(b.result), 'ja');
    });
  }

  /** URL/リンクから渡された条件を反映する。壊れた値は捨てる。 */
  function applyParams(p) {
    p = p || {};
    filter = { job: 8, lv: null, yields: null, ing: null, use: null, patch: null };
    shown = RESULT_CAP;

    if (p.job !== undefined && p.job !== '') {
      var wantJob = parseInt(p.job, 10);
      if (S.JOBS.some(function (j) { return j.job === wantJob; })) filter.job = wantJob;
    }
    FKEYS.forEach(function (f) { if (p[f]) filter[f] = p[f]; });

    // 手打ちURL対策: 選んだジョブのデータに存在しない値は捨てる（幽霊チップを出さない）
    FKEYS.forEach(function (f) {
      if (filter[f] == null) return;
      var spec = FACETS[f], found = false;
      for (var i = 0; i < all.length && !found; i++) {
        var r = all[i];
        if (r.job !== filter.job) continue;
        if (spec.skip && spec.skip(r)) continue;
        if (spec.key(r) === filter[f]) found = true;
      }
      if (!found) filter[f] = null;
    });
  }

  /** filter のうち except 以外を適用したレシピ配列 */
  function subset(except) {
    return all.filter(function (r) {
      if (r.job !== filter.job) return false;
      for (var i = 0; i < FKEYS.length; i++) {
        var f = FKEYS[i];
        if (f === except) continue;
        var want = filter[f];
        if (want == null || want === '') continue;
        if (FACETS[f].key(r) !== want) return false;
      }
      return true;
    });
  }

  /* ---------------- 描画 ---------------- */
  function render() {
    renderJobTabs();
    renderChips();
    renderCards();
    renderResults();
  }

  function renderJobTabs() {
    var counts = {};
    all.forEach(function (r) { counts[r.job] = (counts[r.job] || 0) + 1; });
    $('#rcp-jobTabs').innerHTML = S.JOBS.map(function (j) {
      if (!counts[j.job]) return '';
      return '<button class="jobtab ' + S.jobClass(j.job) + (filter.job === j.job ? ' on' : '') +
        '" data-job="' + j.job + '">' +
        '<span class="jt-name">' + esc(j.name) + '</span>' +
        '<span class="jt-n">' + n(counts[j.job]) + '</span></button>';
    }).join('');
  }

  function renderChips() {
    var box = $('#rcp-chips');
    var out = [];
    FKEYS.forEach(function (f) {
      if (filter[f] == null || filter[f] === '') return;
      var label = FACETS[f].label;
      var text = FACETS[f].text(filter[f]);
      // 「製作Lv / 製作Lv 36-40」のように見出しと本文が重なる場合は前置きを落とす
      if (text.indexOf(label) === 0) text = text.slice(label.length).replace(/^[\s:：]+/, '');
      out.push('<button class="chip" data-clear="' + f + '" title="この条件を外す">' +
        '<span class="chip-k">' + esc(label) + '</span>' +
        esc(text) + ' <span class="chip-x">×</span></button>');
    });
    if (!out.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = '<span class="dim">絞り込み中:</span>' + out.join('') +
      '<button class="btn tiny ghost" data-clear="' + CLEAR_ALL + '">すべて解除</button>';
  }

  function renderCards() {
    var h = '';
    FKEYS.forEach(function (f) {
      var spec = FACETS[f];
      var pool = subset(f);
      var counts = {};
      pool.forEach(function (r) {
        if (spec.skip && spec.skip(r)) return;
        var k = spec.key(r);
        counts[k] = (counts[k] || 0) + 1;
      });
      var keys = Object.keys(counts).sort(spec.order);
      if (!keys.length) return;

      h += '<div class="bcard"><div class="bcard-h">✉ ' + esc(spec.label) + '</div><ol class="bcard-list">';
      keys.forEach(function (k) {
        var on = filter[f] === k;
        h += '<li><button class="blink' + (on ? ' on' : '') + '" data-facet="' + f + '" data-val="' + esc(k) + '">' +
          esc(spec.text(k)) + '<span class="bn">' + n(counts[k]) + '</span></button></li>';
      });
      h += '</ol></div>';
    });
    $('#rcp-cards').innerHTML = h;
  }

  function renderResults() {
    var list = subset(null);
    var box = $('#rcp-results');
    var cap = Math.min(list.length, shown);

    var h = '<div class="panel-h"><strong>' + esc(S.jobFullName(filter.job)) + ' のレシピ</strong>' +
            '<span class="count">' + n(list.length) + ' 件</span></div>';

    if (!list.length) {
      h += '<div class="empty"><div class="big">条件に合うレシピがありません</div>' +
        '<div class="why">絞り込みを外すか、別の製作クラスを選んでください。</div>' +
        '<div class="acts"><button class="btn primary" data-clear="' + CLEAR_ALL + '">すべて解除</button></div></div>';
      box.innerHTML = h;
      return;
    }

    h += '<div class="rev-head brw">' +
      '<div>完成品</div><div class="r">Lv</div><div class="r">素材</div>' +
      '<div class="r">産出</div><div class="c">使われ方</div><div class="c">パッチ</div></div>';

    var ids = [];
    for (var i = 0; i < cap; i++) {
      var r = list[i];
      var ja = GameData.nameOf(r.result);
      var en = GameData.nameEnOf(r.result);
      ids.push(r.result);
      var mid = Index.isIngredient(r.result);
      h += '<a class="rrow brw" ' + S.itemLinkAttrs(r.result) + '>' +
        '<div class="name-cell cell">' + S.placeholder(r.result, ja, 'sm') +
        '<span class="nm">' + esc(ja) + '<small>' + esc(en) + '</small></span></div>' +
        '<div class="num cell' + (S.isNormalJob(r.job) ? '' : ' dim') + '" data-label="Lv">' +
        S.lvText(r.job, r.lvl) + '</div>' +
        '<div class="num cell" data-label="素材">' + r.ingredients.length + '種</div>' +
        '<div class="num cell' + (r.yields > 1 ? '' : ' dim') + '" data-label="産出">×' + r.yields + '</div>' +
        '<div class="cell cell-c" data-label="使われ方">' +
        (mid ? '<span class="badge ok tiny-b">中間素材</span>' : '<span class="badge tiny-b">最終</span>') +
        '</div>' +
        '<div class="cell cell-c" data-label="パッチ">' + S.patchText(r.id) + '</div>' +
        '</a>';
    }
    if (cap < list.length) {
      var next = Math.min(RESULT_STEP, list.length - cap);
      h += '<button class="more" data-more="1">さらに ' + n(next) + ' 件を表示' +
           ' <span class="dim">（' + n(cap) + ' / ' + n(list.length) + ' 件を表示中）</span></button>';
    }
    box.innerHTML = h;
    S.prefetch(ids);
    S.hydrate(box);
  }

  /* ---------------- 操作 ---------------- */
  function onJobClick(e) {
    var b = e.target.closest('[data-job]');
    if (!b) return;
    // 職を変えると、その職に無い条件が残って0件になりやすいので絞り込みは外す
    go({ job: +b.getAttribute('data-job') });
  }

  function onCardClick(e) {
    var b = e.target.closest('[data-facet]');
    if (!b) return;
    var f = b.getAttribute('data-facet'), v = b.getAttribute('data-val');
    var p = currentParams();
    if (p[f] === v) delete p[f]; else p[f] = v;   // 同じものを押したら解除
    go(p);
  }

  function handleClear(e) {
    var b = e.target.closest('[data-clear]');
    if (!b) return;
    var f = b.getAttribute('data-clear');
    var p = currentParams();
    if (f === CLEAR_ALL) FKEYS.forEach(function (k) { delete p[k]; });
    else delete p[f];
    go(p);
  }

  function currentParams() {
    var p = { job: filter.job };
    FKEYS.forEach(function (k) { if (filter[k]) p[k] = filter[k]; });
    return p;
  }

  /** 条件を変えて描き直す（単体ページのときはURLにも反映される） */
  function go(params) {
    applyParams(params);
    render();
    View.setParams(currentParams());
  }

  FF14.reverse.Browse = {
    init: init,
    refresh: function () { if (!ready) return; loadAll(); render(); }
  };
})();
