/* main.js — このタブの起動口
 *
 * ・レシピDBの読み込みは1回だけ（shell.boot）
 * ・そのあとビュールーターと3つのビューを初期化する
 * ・ハブに載っているときは FF14.core.Tabs に登録し、タブが開かれるまで起動しない
 *   （レシピDBの初回取得が約2MBあるため。craftタブと同じ方針）
 */
(function () {
  'use strict';

  var S = FF14.reverse.Shell;
  var View = FF14.reverse.View;

  var root = document.querySelector('.rcp-root');
  var inHub = !!(FF14.core && FF14.core.Tabs);   // ハブのタブに載っているか
  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    S.setRoot(root);
    // 単体ページのときだけ URL(hash) に同期する。ハブ内ではURLに触らない。
    View.init(root, { useHash: !inHub });

    S.boot({
      ready: function () {
        FF14.reverse.Home.init();
        FF14.reverse.Search.init();
        FF14.reverse.Browse.init();
        View.start();
      },
      onReload: function () {
        FF14.reverse.Home.refresh();
        FF14.reverse.Search.refresh();
        FF14.reverse.Browse.refresh();
      }
    });
  }

  if (inHub) {
    FF14.core.Tabs.register('recipe', {
      eager: false,          // 開かれたときに初めてDBを取りに行く
      init: boot,
      onShow: function () { S.focusSearch(); }
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
