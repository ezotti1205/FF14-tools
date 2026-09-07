/* suggest.js — 検索ボックスの候補リスト（ホームと検索ページで共用）
 *
 * GameData.search は「製作可能か」でしか重み付けしないので、ここで
 * 「素材として使われる件数」を足して絞り込み・表示をする。
 * 全50,000件のうち素材になるのは3,500件ほどしかないため、
 * この絞り込みが無いとほとんどの検索が逆引き0件に見えてしまう。
 */
(function () {
  'use strict';

  var GameData = FF14.craft.GameData;
  var Index = FF14.reverse.Index;
  var S = FF14.reverse.Shell;

  /**
   * @param {HTMLInputElement} input
   * @param {HTMLElement} box     候補の入れ物
   * @param {{onPick:function(number), onlyIng?:function():boolean}} opts
   */
  function attach(input, box, opts) {
    opts = opts || {};
    var list = [], idx = -1, timer = null;

    function onlyIng() { return opts.onlyIng ? !!opts.onlyIng() : false; }

    function search() {
      var v = input.value.trim();
      if (!v) { hide(); return; }
      var raw = GameData.search(v, 300);
      var only = onlyIng();

      var out = [];
      for (var i = 0; i < raw.length; i++) {
        var e = raw[i];
        e.hits = Index.useCount(e.id);
        if (only && !e.hits) continue;
        out.push(e);
        if (out.length >= 50) break;
      }
      // 絞り込みの結果が空なら、全件から出し直して「素材ではない」と分かる形で見せる
      var fellBack = false;
      if (only && !out.length) {
        fellBack = true;
        out = raw.slice(0, 50);
        for (var k = 0; k < out.length; k++) out[k].hits = Index.useCount(out[k].id);
      }

      list = out;
      idx = list.length ? 0 : -1;
      paint(fellBack, raw.length);
    }

    function hide() { box.hidden = true; list = []; idx = -1; }

    function paint(fellBack, rawTotal) {
      var h = '';
      if (!list.length) {
        box.innerHTML = '<div class="sg-empty">「<b>' + S.esc(input.value.trim()) +
          '</b>」に一致するアイテムがありません。<br>' +
          '<span class="faint">FF14のアイテム名は英語のカタカナ読みが多めです（例: 鉄インゴット → アイアンインゴット）。</span></div>';
        box.hidden = false;
        return;
      }
      if (fellBack) {
        h += '<div class="sg-empty">素材として使われるアイテムは見つかりませんでした。' +
             '<span class="faint">（全' + S.n(rawTotal) + '件から表示中）</span></div>';
      }
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        h += '<div class="sg' + (i === idx ? ' on' : '') + '" data-id="' + e.id + '">' +
          S.placeholder(e.id, e.ja, 'sm') +
          '<span class="sg-name">' + S.esc(e.ja) + '</span>' +
          '<span class="sg-en">' + S.esc(e.en) + '</span>' +
          (e.craftable ? '<span class="sg-mk" title="クラフトで作れます">作</span>' : '') +
          '<span class="sg-hit' + (e.hits ? '' : ' zero') + '" title="このアイテムを素材に使うレシピの数">' +
          '素材 ' + e.hits + '</span>' +
          '</div>';
      }
      box.innerHTML = h;
      box.hidden = false;
      S.hydrate(box);
    }

    function pick(id) { hide(); input.value = ''; opts.onPick(id); }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(search, 110);
    });
    input.addEventListener('focus', function () { if (input.value.trim()) search(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!box.hidden && idx >= 0 && list[idx]) { pick(list[idx].id); return; }
        search();                                   // デバウンス前のEnterでも拾えるように
        if (list.length) pick(list[0].id);
        return;
      }
      if (box.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!list.length) return;
        idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        paint();
        var on = box.querySelector('.sg.on');
        if (on) on.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Escape') {
        hide();
      }
    });
    box.addEventListener('click', function (e) {
      var row = e.target.closest('.sg');
      if (row && row.dataset.id) pick(+row.dataset.id);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap')) hide();
    });

    return {
      refresh: function () { if (input.value.trim()) search(); else hide(); },
      /** 外から語をセットして候補を開く（例文ボタン用） */
      setQuery: function (v) {
        input.value = v;
        input.focus();
        // document の click ハンドラより後に開くため1tick遅らせる
        setTimeout(search, 0);
      }
    };
  }

  FF14.reverse.Suggest = { attach: attach };
})();
