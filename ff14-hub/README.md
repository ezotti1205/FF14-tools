# FF14 ギャザクラ支援ツール（統合版）

これまで別々に作った3本を、**タブ切り替えの1ページ**にまとめたものです。ブラウザのタブは1つで完結します。

| タブ | 中身 | 統合前 |
| --- | --- | --- |
| ノード | 時間限定ノード（刻限／未知／伝説）のカウントダウンと出現通知 | `ff14-gather-timer/` |
| 総資産 | 総資産額の推移を記録・グラフ化する帳簿 | `ff14-assets/` |
| 作る vs 買う | 素材から作るか完成品を買うかの損益判定（Universalis） | `ff14-craft-profit/` |
| 設定 | 3本ぶんの設定と、データのまとめてエクスポート／インポート | （新規） |

タブバーの右端に、**エオルゼア時間（ET）と現実時刻**が常駐します。

統合前の3フォルダはそのまま残してあります（バックアップ兼、元コードの参照用）。

## 起動

`index.html` をブラウザで開くだけです。ビルド不要・サーバー不要で、`file://`（ダブルクリック）でも動くように
**ES Modules ではなくクラシックスクリプト**のまま分割しています。

うまく動かないときや、`作る vs 買う` のレシピDB（IndexedDB）がブラウザに拒否される場合は、
同梱の簡易サーバー経由で開いてください。

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

起動後 `http://localhost:8124/` を開きます。

> なお `作る vs 買う` は統合前から `file://` は未検証のままです（ブラウザによっては `file://` で IndexedDB が
> 使えず、レシピDBを毎回ダウンロードすることになります）。挙動は統合前と変わりません。

## ファイル構成

```
index.html                画面。4タブぶんのHTMLがここに並んでいます
favicon.svg               タブ・ピン留め用アイコン（青いクリスタル）
serve.ps1                 動作確認用の簡易HTTPサーバ（Windows標準のPowerShellのみ）

css/base.css              外枠（タブバー・パネル）と全体リセット。ここだけが :root を持ちます
css/tab-nodes.css         ┐ 元アプリのCSSを #panel-xxx 配下に限定したもの
css/tab-assets.css        │ （元の :root / body は #panel-xxx に置き換わっています）
css/tab-craft.css         ┘
css/tab-settings.css      設定タブ

js/core/eorzea.js         ET計算（共通モジュール。時計も各タブもこれを使います）
js/core/hub.js            名前空間 window.FF14 と、通知の一括ON/OFF・ラベル付き通知
js/core/tabs.js           タブ切り替え、最後のタブの記憶、初期化のタイミング管理
js/core/clock.js          タブバー右端の ET / 現実時刻
js/core/icons.js          アイテムアイコン（XIVAPI v2）。取得・キャッシュ・DOMへの差し込み
js/core/backup.js         まとめてエクスポート／インポート（個別ファイルの自動判別つき）

js/tabs/nodes/app.js      ノードタブ（元 gather-timer のインラインスクリプト）
data/nodes.js             ノード一覧（225件）。書き換えてリロードするだけで追加できます

js/tabs/assets/*.js       総資産タブ（util / store / agg / chart / app）
js/tabs/craft/*.js        作る vs 買うタブ（store / gamedata / universalis / calc / ui / main）
js/tabs/settings/*.js     設定タブ

tools/scope-css.awk       CSSを #panel-xxx 配下に機械的に限定するフィルタ（下記）
vendor/                   （任意）Chart.js をオフラインで使う場合の置き場
```

### なぜ ES Modules にしなかったか

`file://` のダブルクリック起動を維持するためです。ESM にすると CORS で読み込めなくなり、
毎回ローカルサーバー経由でしか開けなくなります。

一方で、統合前は `総資産` と `作る vs 買う` が**どちらも `Store` というグローバル**を定義していて、
1ページに同居させると衝突します。そこで、各ファイルを IIFE で包み、`window.FF14` という
名前空間ひとつだけにぶら下げる形にしました。

```
FF14.core   … Hub / Tabs / Clock / Icons / Backup（共通）
FF14.nodes  … App
FF14.assets … U / Store / Agg / ChartView / App
FF14.craft  … Store / GameData / Universalis / Calc / UI / api
```

元アプリのロジック（ET計算、Universalis連携、資産グラフの集計）は**中身を変えていません**。
各ファイルの先頭に「名前空間からの別名」を数行足し、末尾で名前空間に登録しているだけです。

## タブの動き

- **裏のタブも止まりません。** ノードタブはページを開いた時点で動き出し（`eager: true`）、
  他のタブを見ている間もカウントダウンと通知判定を続けます。
  ブラウザが非表示タブのタイマーを間引くことがあるので、画面に戻ったとき
  （`visibilitychange` とタブ切り替え）に必ず計算し直します。
- **総資産・作る vs 買う・設定は、最初に開かれたときに初期化**します（`eager: false`）。
  特に `作る vs 買う` はレシピDBの初回ダウンロードが約1.8MBあるため、開くまで取りに行きません。
- 入力中のフォームやツリーの状態は、タブを切り替えても消えません（パネルを隠しているだけです）。
- タブごとのスクロール位置も覚えています。
- **最後に開いていたタブは `localStorage` に保存**され、次回はそこから開きます。

## 通知

- 通知は `[ノード] まもなく出現: ○○` のように、**どのタブからの通知か分かるラベル**が付きます。
- 設定タブの「通知を有効にする（すべてのタブまとめて）」で一括ON/OFFできます。
  OFFの間は、ブラウザの許可があっても送信しません。
- ノードごとの通知は「ノード」タブの各行の「通知」チェックで選び、
  何分前に知らせるかは設定タブで指定します。

## アイテムアイコン

`作る vs 買う` の判定結果（対象バー・素材ツリー・買い物リスト）に、アイテムアイコンを表示します。
画像は [XIVAPI v2](https://v2.xivapi.com) から直接読み込みます（ホットリンク前提の設計なので、
画像をこのツールに保存することはしません）。

```
アイテムID → /api/sheet/Item?rows=...&fields=Icon → game path
game path  → /api/asset?path=...&format=png       → そのまま <img src>
```

共通モジュール `js/core/icons.js`（`FF14.core.Icons`）に切り出してあるので、他のタブからも使えます。

```js
html += FF14.core.Icons.placeholder(itemId, itemName);  // 文字列を組むとき
el.innerHTML = html;
FF14.core.Icons.hydrate(el);                            // 差し込んだ直後に1回
```

`作る vs 買う` の描画は innerHTML の作り直しなので、**同期で書けるプレースホルダを先に置き、
あとから `<img>` を埋める**形にしています。解決済みのアイテムはキャッシュから同期で埋まるため、
個数変更などの再描画でアイコンがチラつくことはありません。

実装上の要点:

- **一括取得**（`?rows=1,2,3`、60件ずつ）でリクエスト数を抑えます。同じアイテムIDへの
  同時リクエストは1本にまとめます。描画前に `prefetch()` するので、
  対象バー・ツリー・買い物リストで同じ素材が出ても**リクエストは1回**です。
- ⚠️ 一括取得は**存在しないIDが1つでも混ざるとバッチ全体が404**になります。
  そのため、失敗したバッチだけ**1件ずつ取り直す**フォールバックを入れてあります。
- アイコンが無いアイテム（404）は24時間、通信エラーは5分だけ再取得を控えます。
  一時的なオフラインを「アイコン無し」として長く覚え込まないための区別です。
- **失敗しても表示は崩れません。** アイコン枠は取得の成否にかかわらず同じ大きさの箱なので、
  画像が来なければ薄い枠のままになるだけです。通信エラーで例外が外に漏れることもありません
  （`hydrate` / `resolve` は必ず解決します）。
- キャッシュした件数の確認と削除は「設定」タブから行えます。

検索候補の一覧には、入力のたびにリクエストが出るのを避けるため入れていません。
必要なら `renderSuggest` に `Icons.placeholder(it.id, it.ja, 'sm')` を足し、
`box.innerHTML = html` の直後に `Icons.hydrate(box)` を呼ぶだけです。

## localStorage のキー

3本ぶんのキーは互いに衝突しません（統合にあたって変更もしていないので、
統合前のデータはそのまま引き継がれます）。

| タブ | キー |
| --- | --- |
| ノード | `ff14-gather-timer/v1`（設定・お気に入り・通知）、`ff14-gather-timer/nodes/v1`（取り込んだノード一覧） |
| 総資産 | `ff14assets.v1.records` / `.settings` / `.calcdraft` |
| 作る vs 買う | `ff14cp.settings` / `.state` / `.price` / `.worlds` ＋ IndexedDB `ff14cp`（レシピDB） |
| 統合版 | `ff14hub.v1.settings`（通知の一括ON/OFF）、`ff14hub.v1.ui`（最後のタブ）、`ff14hub.v1.icons`（アイテムID→アイコンのgame path） |

総資産は旧・収支ログ（`ff14ledger.v1.*`）とは完全に別のキーで、コード上にも旧キーへの参照は残っていません。

## データの出し入れ

設定タブに集約しています。

- **全部まとめてエクスポート** … 3本ぶんを1つのJSONに（`ff14-hub-all-YYYY-MM-DD.json`）
- **個別にエクスポート** … ノード／総資産／作る vs 買う を別々に
- **インポート** … まとめたファイルでも、統合前の個別ファイル
  （`ff14-assets` / `ff14-craft-profit` / `ff14-gather-timer` のもの）でも、中身を見て自動で振り分けます

総資産タブの中にも従来どおりのエクスポート／インポートがあります。
設定タブからのインポートは**置き換え**、総資産タブからのインポートは**置き換え／追記を選べる**ので、
マージしたいときは総資産タブ側を使ってください。

---

## タブを増やすとき（例: 釣りツール）

配線は4ステップだけです。`js/core/tabs.js` に手を入れる必要はありません。

1. `index.html` のタブバーにボタンを足す

   ```html
   <button type="button" role="tab" data-tab="fishing" aria-selected="false">釣り</button>
   ```

2. パネルを足す（`id` は `panel-` + タブid）

   ```html
   <section id="panel-fishing" class="hub-panel" hidden> ... </section>
   ```

3. `css/tab-fishing.css` を作って `index.html` から読み込む。
   既存アプリのCSSを流用するなら、同梱のフィルタで機械的に限定できます。

   ```bash
   awk -v PFX="#panel-fishing" -f tools/scope-css.awk 元/style.css > css/tab-fishing.css
   ```

   `:root` / `html` / `body` / `*` は `#panel-fishing` に、それ以外は
   `#panel-fishing <セレクタ>` に書き換わります。`@media` の中も対象です。
   元アプリが sticky ヘッダーを持っている場合だけ、`css/base.css` の末尾にならって
   `top: var(--hub-bar-h)` を足してください。

4. JSを読み込み、末尾でタブを登録する

   ```js
   FF14.core.Tabs.register('fishing', {
     eager: false,                 // 裏でもタイマーを回したいなら true
     init: function () { /* 最初に開かれたとき1回だけ */ },
     onShow: function () { /* 表示されるたび。再描画やサイズ再計算に */ }
   });
   ```

   グローバルを増やさないよう、ファイル全体を IIFE で包み、`FF14.fishing.xxx` に登録してください。
   まとめてエクスポートに載せたい場合は `js/core/backup.js` の
   `exportAll` / `importAny` に数行足します。

## 出どころ

- ノードデータ … [ギャザラータイマー：FF14俺Tools](https://ffxiv.gt.exdreams.net) の公開データを変換（設定タブから最新化できます）
- アイテム名・レシピ … [ffxiv-teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft) の公開JSON（jsDelivr経由）
- マーケット価格 … [Universalis API v2](https://docs.universalis.app/)
- アイテムアイコン … [XIVAPI v2](https://v2.xivapi.com)（v1 の `xivapi.com/Item/...` は非推奨なので使っていません）
- グラフ … Chart.js 4.4.1（`vendor/chart.umd.js` → jsDelivr → unpkg の順に読み込み）

ゲームクライアントには一切アクセスしません（メモリ読み取り・パケット解析・画面認識・自動操作なし）。
