/* universalis.js — このタブ用の Universalis クライアントを1つ作るだけのファイル。
   実装は js/core/universalis.js（「作る vs 買う」タブと共有）にあります。

   価格キャッシュの localStorage キーは FF14.watch.Store の中にあるので、
   単体版と同じ ff14watch.v1.prices のままです。 */
(function () {
  'use strict';

  FF14.watch.Universalis = FF14.core.createUniversalis({
    store: FF14.watch.Store,
    appName: 'ff14-market-watch'
  });
})();
