/* home.js — ホームビュー
 *   検索ボックスから直接アイテムへ飛べるほか、
 *   「条件から探す」「検索・逆引き」への導線と最近見たアイテムを出す。
 */
(function () {
  'use strict';

  var S = FF14.reverse.Shell;
  var View = FF14.reverse.View;
  var GameData = FF14.craft.GameData;
  var Index = FF14.reverse.Index;

  var EXAMPLES = ['アイアンインゴット', 'エルム材', 'ハイスチールインゴット', 'アースクリスタル'];
  var sg = null;

  function init() {
    var q = S.$('#rcp-qhome');
    q.disabled = false;
    q.placeholder = 'アイテム名で検索（日本語 / 英語 / アイテムID）';

    sg = FF14.reverse.Suggest.attach(q, S.$('#rcp-suggesthome'), {
      onPick: function (id) { View.show('search', { item: id }); }
    });

    var ex = S.$('#rcp-heroEx');
    ex.innerHTML = '<span class="faint">例:</span> ' + EXAMPLES.map(function (name) {
      return '<button class="btn tiny" data-ex="' + S.esc(name) + '">' + S.esc(name) + '</button>';
    }).join('');
    ex.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ex]');
      if (b) sg.setQuery(b.getAttribute('data-ex'));
    });

    S.$('#rcp-clearRecent').addEventListener('click', function () {
      S.writeJSON('ff14reverse.v1.recent', []);
      renderRecent();
    });

    View.on('home', function () {
      renderRecent();
      try { q.focus(); } catch (e) {}
    });
  }

  function renderRecent() {
    var panel = S.$('#rcp-recentPanel');
    var box = S.$('#rcp-recentList');
    var ids = S.recent().filter(function (id) {
      return GameData.nameOf(id).indexOf('アイテム#') !== 0;
    });
    if (!ids.length) { panel.hidden = true; return; }
    panel.hidden = false;

    box.innerHTML = ids.map(function (id) {
      var ja = GameData.nameOf(id);
      var uses = Index.useCount(id);
      var makes = GameData.recipesFor(id).length;
      return '<a class="recent" ' + S.itemLinkAttrs(id) + '>' +
        S.placeholder(id, ja, 'sm') +
        '<span class="nm">' + S.esc(ja) + '</span>' +
        '<span class="recent-meta">' +
        (makes ? '<span class="badge ok">作' + makes + '</span>' : '') +
        (uses ? '<span class="badge hot">素材' + uses + '</span>' : '') +
        '</span></a>';
    }).join('');
    S.prefetch(ids);
    S.hydrate(box);
  }

  FF14.reverse.Home = { init: init, refresh: renderRecent };
})();
