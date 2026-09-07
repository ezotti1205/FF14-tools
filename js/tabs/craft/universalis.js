/* universalis.js — このタブ用の Universalis クライアントを1つ作るだけのファイル。
   実装は js/core/universalis.js に移して「市場」タブと共有しています
   （以前はこのファイルが実装本体で、市場タブ側に複製がありました）。

   価格キャッシュの localStorage キーは FF14.craft.Store の中にあるので、
   従来どおり ff14cp.* のままです。 */
(function () {
  'use strict';

  FF14.craft.Universalis = FF14.core.createUniversalis({
    store: FF14.craft.Store,
    appName: 'ff14-craft-profit'
  });
})();
