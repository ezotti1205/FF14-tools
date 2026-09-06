/*
 * FF14 時間限定採集ノードのデータファイル。
 * このファイルを書き換えてページをリロードするだけでノードを追加・編集できます（ビルド不要）。
 * ※ JSON ではなく JS にしているのは、ローカルサーバーなしで index.html を直接ブラウザで開いても
 *    読み込めるようにするためです。書式は素の配列なので JSON とほぼ同じ感覚で編集できます。
 *
 * 【出典】 このデータは「ギャザラータイマー：FF14俺Tools」(https://ffxiv.gt.exdreams.net) の
 *          公開データ(js/gt_point.js, js/define.js)を変換して生成したものです
 *          （採集時刻・座標・最寄りエーテライトなどのゲーム内事実情報）。
 *          最終取り込み: 2026-08-30 / エフェメラル(刻限)・未知・伝説のみ / 225ノード
 *          最寄りエーテライトは「同一エリア内で座標がいちばん近いエーテライト」を計算したものです。
 *          アプリ内の「exdreamsから更新」ボタンで最新データに更新できます（localStorage に保存）。
 *
 * 1件のスキーマ:
 * {
 *   id:        文字列。一意。お気に入り/通知設定はこの id で保存されます。
 *   name:      アイテム名（表示名）。
 *   job:       "BTN"(園芸) / "MIN"(採掘)。
 *   level:     数値。採集レベル。
 *   zone:      エリア名。
 *   coords:    "X:12.3 Y:34.5" 形式。
 *   aetheryte: 最寄りエーテライト名（街／拠点名）。
 *   spawns:    [{ startET: 開始ET時(0-23), durationET: 継続ET時間 }]。ET時刻で毎エオルゼア日くり返し。
 *              未知/伝説は12時間おきの2窓、刻限は1日1窓(4時間)が基本。
 *   ptype:     "刻限" | "未知" | "伝説"（絞り込み・表示用の追加情報）。
 *   patch:     実装パッチ（例 "6.3"）。
 *   subNode:   採集地点名（"Lv90 ???" 等）。
 *   items:     その地点で採れる関連アイテム名の配列（検索対象）。
 *   note:      備考。
 * }
 */
window.FF14_NODES_META = { source: "https://ffxiv.gt.exdreams.net", importedAt: "2026-08-30", count: 225 };
window.FF14_NODES =
[
  {
    "id": "gt-yldzp9",
    "name": "ヴァンパイアプラント",
    "job": "BTN",
    "level": 50,
    "zone": "クルザス中央高地",
    "coords": "X:27 Y:23",
    "aetheryte": "ドラゴンヘッド",
    "spawns": [
      {
        "startET": 13,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ヴァンパイアプラント"
    ],
    "note": ""
  },
  {
    "id": "gt-1r3n2a8",
    "name": "サベネアミスルトゥ",
    "job": "BTN",
    "level": 50,
    "zone": "クルザス中央高地",
    "coords": "X:7 Y:11",
    "aetheryte": "ドラゴンヘッド",
    "spawns": [
      {
        "startET": 17,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "サベネアミスルトゥ"
    ],
    "note": ""
  },
  {
    "id": "gt-ciaxju",
    "name": "スプルース原木",
    "job": "BTN",
    "level": 50,
    "zone": "クルザス中央高地",
    "coords": "X:31 Y:14",
    "aetheryte": "ドラゴンヘッド",
    "spawns": [
      {
        "startET": 9,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "スプルース原木",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-34rgs8",
    "name": "各種クラスター",
    "job": "BTN",
    "level": 50,
    "zone": "モードゥナ",
    "coords": "X:31 Y:14",
    "aetheryte": "レヴナンツトール",
    "spawns": [
      {
        "startET": 1,
        "durationET": 3
      },
      {
        "startET": 5,
        "durationET": 3
      },
      {
        "startET": 9,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "コールマターG4",
      "ライトニングクラスター",
      "ファイアクラスター",
      "ウィンドクラスター",
      "ウォータークラスター",
      "アイスクラスター",
      "アースクラスター",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1b5tz9n",
    "name": "ｵｰﾙﾄﾞﾜｰﾙﾄﾞﾌｨｸﾞ/DMｸﾗｽﾀｰ",
    "job": "BTN",
    "level": 50,
    "zone": "高地ドラヴァニア",
    "coords": "X:26 Y:12",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv50 ???",
    "items": [
      "オールドワールドフィグの種",
      "オールドワールドフィグ",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-17mvhbg",
    "name": "ﾌﾞﾗｯﾄﾞｵﾚﾝｼﾞ/ﾊﾞﾝﾌﾞｰ材",
    "job": "BTN",
    "level": 50,
    "zone": "高地ラノシア",
    "coords": "X:28 Y:25",
    "aetheryte": "キャンプ・ブロンズレイク",
    "spawns": [
      {
        "startET": 7,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ブラッドオレンジ",
      "バンブー材",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-17u8r56",
    "name": "サイプレス原木",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：中央森林",
    "coords": "X:24 Y:31",
    "aetheryte": "ベントブランチ牧場",
    "spawns": [
      {
        "startET": 10,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "サイプレス原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1eynh6i",
    "name": "ティノルカ茶葉",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：中央森林",
    "coords": "X:15 Y:21",
    "aetheryte": "ベントブランチ牧場",
    "spawns": [
      {
        "startET": 2,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "マズラヤの野草",
      "ティノルカ茶葉",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1ofwcom",
    "name": "高級黒衣香木",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：中央森林",
    "coords": "X:30 Y:19",
    "aetheryte": "ベントブランチ牧場",
    "spawns": [
      {
        "startET": 6,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "高級黒衣香木",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1xhyz4e",
    "name": "トリリウム",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：東部森林",
    "coords": "X:19 Y:17",
    "aetheryte": "ホウソーン家の山塞",
    "spawns": [
      {
        "startET": 5,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "トリリウム"
    ],
    "note": ""
  },
  {
    "id": "gt-18p9t2f",
    "name": "ﾄﾘﾘｳﾑの球根/ﾐﾆﾏﾝﾄﾞﾗｺﾞﾗ",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：東部森林",
    "coords": "X:12 Y:24",
    "aetheryte": "ホウソーン家の山塞",
    "spawns": [
      {
        "startET": 21,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "マズラヤの野草",
      "ミニマンドラゴラ",
      "トリリウムの球根"
    ],
    "note": ""
  },
  {
    "id": "gt-18rag8j",
    "name": "ローズマリー",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：東部森林",
    "coords": "X:22 Y:30",
    "aetheryte": "ホウソーン家の山塞",
    "spawns": [
      {
        "startET": 17,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ローズマリー"
    ],
    "note": ""
  },
  {
    "id": "gt-p89zf3",
    "name": "生マユ",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：東部森林",
    "coords": "X:21 Y:26",
    "aetheryte": "ホウソーン家の山塞",
    "spawns": [
      {
        "startET": 1,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "生マユ",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1sezbag",
    "name": "黒衣香木",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：南部森林",
    "coords": "X:18 Y:23",
    "aetheryte": "キャンプ・トランキル",
    "spawns": [
      {
        "startET": 2,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "黒衣香木",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1e6fxbc",
    "name": "緋樹液",
    "job": "BTN",
    "level": 50,
    "zone": "黒衣森：北部森林",
    "coords": "X:15 Y:26",
    "aetheryte": "フォールゴウド",
    "spawns": [
      {
        "startET": 3,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "緋樹液",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1lquuxx",
    "name": "ﾗﾉｼｱﾘｰｷ/水鳥の羽根",
    "job": "BTN",
    "level": 50,
    "zone": "西ラノシア",
    "coords": "X:33 Y:27",
    "aetheryte": "スウィフトパーチ入植地",
    "spawns": [
      {
        "startET": 8,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "マズラヤの野草",
      "ラノシアリーキ",
      "無属性クリスタル",
      "水鳥の羽根"
    ],
    "note": ""
  },
  {
    "id": "gt-j9kzxm",
    "name": "アプリコット",
    "job": "BTN",
    "level": 50,
    "zone": "中央ラノシア",
    "coords": "X:17 Y:16",
    "aetheryte": "サマーフォード庄",
    "spawns": [
      {
        "startET": 9,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "アプリコット",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-n8hdbv",
    "name": "エボニー原木",
    "job": "BTN",
    "level": 50,
    "zone": "中央ラノシア",
    "coords": "X:25 Y:25",
    "aetheryte": "サマーフォード庄",
    "spawns": [
      {
        "startET": 4,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "エボニー原木"
    ],
    "note": ""
  },
  {
    "id": "gt-85qs9t",
    "name": "ソフトスピナッチ",
    "job": "BTN",
    "level": 50,
    "zone": "低地ラノシア",
    "coords": "X:31 Y:13",
    "aetheryte": "モラビー造船廠",
    "spawns": [
      {
        "startET": 6,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "マズラヤの野草",
      "ソフトスピナッチ",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-vgr1ud",
    "name": "ﾏｽﾞﾗﾔの野草/ﾌﾞﾗｯｸﾄﾘｭﾌ",
    "job": "BTN",
    "level": 50,
    "zone": "東ザナラーン",
    "coords": "X:12 Y:16",
    "aetheryte": "キャンプ・ドライボーン",
    "spawns": [
      {
        "startET": 13,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "マズラヤの野草",
      "ブラックトリュフ",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-2xaozy",
    "name": "ゼーメルトマト/種",
    "job": "BTN",
    "level": 50,
    "zone": "東ラノシア",
    "coords": "X:17 Y:28",
    "aetheryte": "ワインポート",
    "spawns": [
      {
        "startET": 13,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ゼーメルトマトの種",
      "ゼーメルトマト",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-ynvvkw",
    "name": "パイナップル/種",
    "job": "BTN",
    "level": 50,
    "zone": "東ラノシア",
    "coords": "X:31 Y:26",
    "aetheryte": "コスタ・デル・ソル",
    "spawns": [
      {
        "startET": 9,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "パイナップルの種",
      "パイナップル",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1nei74j",
    "name": "ハニーレモン/種",
    "job": "BTN",
    "level": 50,
    "zone": "東ラノシア",
    "coords": "X:26 Y:32",
    "aetheryte": "コスタ・デル・ソル",
    "spawns": [
      {
        "startET": 5,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ハニーレモンの種",
      "ハニーレモン"
    ],
    "note": ""
  },
  {
    "id": "gt-dzjesy",
    "name": "(収集)ﾀﾞｰｸﾁｪｽﾅｯﾄ樹液/原木/枝",
    "job": "BTN",
    "level": 51,
    "zone": "高地ドラヴァニア",
    "coords": "X:29 Y:30",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のダークチェスナットの枝",
      "収集用のダークチェスナット樹液",
      "収集用のダークチェスナット原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1eqtv5",
    "name": "ﾁｬｲﾌﾞ/ｷｬﾍﾞﾂ/ｸﾙｻﾞｽ茶葉",
    "job": "BTN",
    "level": 55,
    "zone": "クルザス西部高地",
    "coords": "X:32 Y:20",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv55 ???",
    "items": [
      "チャイブ",
      "プチキャベツの種",
      "クルザス茶樹の種",
      "プチキャベツ",
      "クルザス茶葉"
    ],
    "note": ""
  },
  {
    "id": "gt-41eqaz",
    "name": "ﾄﾞﾗｳﾞｧﾆｱﾐｽﾙﾄｩ/ﾎﾟﾙﾁｰﾆ",
    "job": "BTN",
    "level": 55,
    "zone": "ドラヴァニア雲海",
    "coords": "X:25 Y:7",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv55 ???",
    "items": [
      "ドラヴァニアミスルトゥ",
      "ポルチーニ"
    ],
    "note": ""
  },
  {
    "id": "gt-c275q4",
    "name": "(収集)ﾀﾞｰｸﾏﾛﾝ/ﾀﾞｰｸﾁｪｽﾅｯﾄ樹脂",
    "job": "BTN",
    "level": 56,
    "zone": "高地ドラヴァニア",
    "coords": "X:16 Y:36",
    "aetheryte": "不浄の三塔",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のダークマロン",
      "収集用のダークチェスナット樹脂"
    ],
    "note": ""
  },
  {
    "id": "gt-tbzwyq",
    "name": "ワットル樹皮",
    "job": "BTN",
    "level": 60,
    "zone": "アジス・ラー",
    "coords": "X:23 Y:8",
    "aetheryte": "ポート・ヘリックス",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "ワットル樹皮"
    ],
    "note": ""
  },
  {
    "id": "gt-10ggdp0",
    "name": "星綿",
    "job": "BTN",
    "level": 60,
    "zone": "アジス・ラー",
    "coords": "X:8 Y:29",
    "aetheryte": "ポート・ヘリックス",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "星綿"
    ],
    "note": ""
  },
  {
    "id": "gt-1r8ssu3",
    "name": "オレガノ",
    "job": "BTN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:13 Y:22",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 ブルーウィンドウ",
    "items": [
      "メネフィナローレル",
      "オレガノ",
      "ポットマジョラム",
      "スペアミント",
      "ウォーターミント",
      "クラリーセージ",
      "ワイルドセージ",
      "ウィンドクリスタル",
      "ウィンドクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-shuie5",
    "name": "スイートアーモンド",
    "job": "BTN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:20 Y:7",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "スイートアーモンド"
    ],
    "note": ""
  },
  {
    "id": "gt-144jdep",
    "name": "ﾍｳﾞﾝｽﾞﾄﾞﾚﾓﾝ/ｱﾊﾞﾗｼｱﾐｽﾙﾄｩ",
    "job": "BTN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:33 Y:23",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "ヘヴンズドレモン",
      "アバラシアミスルトゥ"
    ],
    "note": ""
  },
  {
    "id": "gt-17z52j2",
    "name": "ビーチの枝",
    "job": "BTN",
    "level": 60,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:11 Y:18",
    "aetheryte": "カストルム・オリエンス",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv60 ???",
    "items": [
      "ビーチの枝"
    ],
    "note": ""
  },
  {
    "id": "gt-b77j4m",
    "name": "オレガノ",
    "job": "BTN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:24 Y:31",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 0,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 ツインプールズ",
    "items": [
      "メネフィナローレル",
      "オレガノ",
      "ポットマジョラム",
      "スペアミント",
      "ウォーターミント",
      "クラリーセージ",
      "ワイルドセージ",
      "ウィンドクリスタル",
      "ウィンドクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1rodup4",
    "name": "カベイジの野菜",
    "job": "BTN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:9 Y:10",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "カベイジの野菜"
    ],
    "note": ""
  },
  {
    "id": "gt-16p6rgf",
    "name": "ﾊﾞﾆﾗﾋﾞｰﾝｽﾞ/ﾄﾞﾗｳﾞｧﾆｱﾊﾟﾌﾟﾘｶ",
    "job": "BTN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:23 Y:21",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "バニラビーンズ",
      "ドラヴァニアパプリカ",
      "雪綿"
    ],
    "note": ""
  },
  {
    "id": "gt-8cuugw",
    "name": "アストラルフラワー",
    "job": "BTN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:17 Y:36",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "アストラルフラワー"
    ],
    "note": ""
  },
  {
    "id": "gt-19rhpks",
    "name": "ブラウンマッシュルーム",
    "job": "BTN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:12 Y:37",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "ブラウンマッシュルーム"
    ],
    "note": ""
  },
  {
    "id": "gt-2di3ia",
    "name": "樹液結晶/ｶﾝﾌｧｰ古木",
    "job": "BTN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:10 Y:9",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.3",
    "subNode": "Lv60 ???",
    "items": [
      "樹液結晶",
      "カンファー古木"
    ],
    "note": ""
  },
  {
    "id": "gt-151hsxt",
    "name": "赤玉土",
    "job": "BTN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:12 Y:37",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 16,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 フォーアームズ",
    "items": [
      "メネフィナローレル",
      "ピートモス",
      "アースクリスタル",
      "赤玉土",
      "黒土",
      "腐植土",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1usk1q1",
    "name": "ノーブルセージ",
    "job": "BTN",
    "level": 60,
    "zone": "高地ドラヴァニア",
    "coords": "X:34 Y:28",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "ノーブルセージ"
    ],
    "note": ""
  },
  {
    "id": "gt-mrmj1u",
    "name": "赤玉土",
    "job": "BTN",
    "level": 60,
    "zone": "高地ドラヴァニア",
    "coords": "X:17 Y:30",
    "aetheryte": "不浄の三塔",
    "spawns": [
      {
        "startET": 8,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 アヴァロニア・フォールン",
    "items": [
      "メネフィナローレル",
      "ピートモス",
      "アースクリスタル",
      "赤玉土",
      "黒土",
      "腐植土",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-95mbnu",
    "name": "ｸﾗｳﾄﾞﾊﾞﾅﾅ/ﾓﾘｰﾕ",
    "job": "BTN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:16 Y:37",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "クラウドバナナ",
      "モリーユ"
    ],
    "note": ""
  },
  {
    "id": "gt-r4uvp0",
    "name": "スナーブルベリー",
    "job": "BTN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:38 Y:21",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "スナーブルベリー"
    ],
    "note": ""
  },
  {
    "id": "gt-t3qnag",
    "name": "チーク原木",
    "job": "BTN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:8 Y:26",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "チーク原木"
    ],
    "note": ""
  },
  {
    "id": "gt-6jfzlv",
    "name": "赤玉土",
    "job": "BTN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:8 Y:29",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 4,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 シャーレアン学士街",
    "items": [
      "メネフィナローレル",
      "ピートモス",
      "アースクリスタル",
      "赤玉土",
      "黒土",
      "腐植土",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1bpxbwh",
    "name": "(収集)ﾗｰﾁ原木/樹液",
    "job": "BTN",
    "level": 61,
    "zone": "紅玉海",
    "coords": "X:6 Y:16",
    "aetheryte": "オノコロ島",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のラーチ樹液",
      "収集用のラーチ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1w4t1by",
    "name": "(収集)椎茸",
    "job": "BTN",
    "level": 61,
    "zone": "紅玉海",
    "coords": "X:33 Y:9",
    "aetheryte": "碧のタマミズ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の椎茸"
    ],
    "note": ""
  },
  {
    "id": "gt-1grlb2t",
    "name": "タケノコ",
    "job": "BTN",
    "level": 65,
    "zone": "ヤンサ",
    "coords": "X:28 Y:25",
    "aetheryte": "ナマイ村",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv65 ???",
    "items": [
      "タケノコ"
    ],
    "note": ""
  },
  {
    "id": "gt-h9hzal",
    "name": "(収集)松脂/ﾊﾟｲﾝ原木",
    "job": "BTN",
    "level": 66,
    "zone": "ヤンサ",
    "coords": "X:18 Y:14",
    "aetheryte": "烈士庵",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の松脂",
      "収集用のパイン原木"
    ],
    "note": ""
  },
  {
    "id": "gt-hgcikr",
    "name": "オサードプラム",
    "job": "BTN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:27 Y:16",
    "aetheryte": "明けの玉座",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "オサードプラム"
    ],
    "note": ""
  },
  {
    "id": "gt-8ieqes",
    "name": "黄土/ヤンサバーベナ",
    "job": "BTN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:27 Y:28",
    "aetheryte": "再会の市",
    "spawns": [
      {
        "startET": 8,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "ヤンサバーベナ",
      "アースクリスタル",
      "黄土",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1h9b1jc",
    "name": "藍麻/アジム綿花",
    "job": "BTN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:19 Y:10",
    "aetheryte": "明けの玉座",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "藍麻",
      "アジム綿花"
    ],
    "note": ""
  },
  {
    "id": "gt-8jp296",
    "name": "ジャムメルジンジャー",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:8 Y:8",
    "aetheryte": "ポルタ・プレトリア",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "ジャムメルジンジャー"
    ],
    "note": ""
  },
  {
    "id": "gt-1eu7gge",
    "name": "トレヤの枝/ヤンサバーベナ",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:30 Y:25",
    "aetheryte": "アラミガン・クォーター",
    "spawns": [
      {
        "startET": 4,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "トレヤの枝",
      "ヤンサバーベナ",
      "ウォータークリスタル",
      "ウォータークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-q2jqxs",
    "name": "トレヤ原木",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:11 Y:13",
    "aetheryte": "ポルタ・プレトリア",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "トレヤ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1wffooa",
    "name": "ウルンダイ原木",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:33 Y:11",
    "aetheryte": "アラガーナ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.4",
    "subNode": "Lv70 ???",
    "items": [
      "ウルンダイ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-m74yjz",
    "name": "ハロードバジル",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:24 Y:16",
    "aetheryte": "アラガーナ",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "ハロードバジル"
    ],
    "note": ""
  },
  {
    "id": "gt-b51atx",
    "name": "真麻",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:24 Y:35",
    "aetheryte": "アラギリ",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.2",
    "subNode": "Lv70 ???",
    "items": [
      "真麻"
    ],
    "note": ""
  },
  {
    "id": "gt-1hinb0r",
    "name": "ブラックウィロー原木/老木樹液塊",
    "job": "BTN",
    "level": 70,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:15 Y:21",
    "aetheryte": "カストルム・オリエンス",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "老木樹液塊",
      "ブラックウィロー原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1ovvs04",
    "name": "延夏綿",
    "job": "BTN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:28 Y:35",
    "aetheryte": "ナマイ村",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.4",
    "subNode": "Lv70 ???",
    "items": [
      "延夏綿"
    ],
    "note": ""
  },
  {
    "id": "gt-1vznbpt",
    "name": "風茶葉/ヤンサバーベナ",
    "job": "BTN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:32 Y:27",
    "aetheryte": "ナマイ村",
    "spawns": [
      {
        "startET": 16,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "風茶葉",
      "姫茶葉",
      "ヤンサバーベナ",
      "ウィンドクリスタル",
      "ウィンドクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-roh0ef",
    "name": "蓮根",
    "job": "BTN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:28 Y:7",
    "aetheryte": "烈士庵",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "蓮根"
    ],
    "note": ""
  },
  {
    "id": "gt-4u4dy7",
    "name": "(収集)ﾋﾟｸｼｰｱｯﾌﾟﾙ/ﾐﾗｸﾙｱｯﾌﾟﾙ原木",
    "job": "BTN",
    "level": 71,
    "zone": "イル・メグ",
    "coords": "X:4 Y:23",
    "aetheryte": "リダ・ラーン",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のピクシーアップル",
      "収集用のミラクルアップル原木"
    ],
    "note": ""
  },
  {
    "id": "gt-8testt",
    "name": "(収集)ﾎﾜｲﾄｵｰｸ原木",
    "job": "BTN",
    "level": 71,
    "zone": "コルシア島",
    "coords": "X:28 Y:33",
    "aetheryte": "スティルタイド",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のホワイトオーク原木"
    ],
    "note": ""
  },
  {
    "id": "gt-o79bwt",
    "name": "(収集)ｻﾝﾄﾞﾁｰｸ原木/ｱﾝﾊﾞｰｸﾛｰｳﾞ",
    "job": "BTN",
    "level": 76,
    "zone": "アム・アレーン",
    "coords": "X:19 Y:20",
    "aetheryte": "モルド・スーク",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のアンバークローヴ",
      "収集用のサンドチーク原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1v0k2i",
    "name": "(収集)ｳﾙﾝﾀﾞｲ原木",
    "job": "BTN",
    "level": 76,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:31 Y:7",
    "aetheryte": "アラガーナ",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のウルンダイ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-flqyvt",
    "name": "(収集)海藻/珊瑚",
    "job": "BTN",
    "level": 76,
    "zone": "テンペスト",
    "coords": "X:37 Y:12",
    "aetheryte": "オンドの潮溜まり",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の珊瑚",
      "収集用の海藻"
    ],
    "note": ""
  },
  {
    "id": "gt-atconu",
    "name": "シルバービーチ原木",
    "job": "BTN",
    "level": 80,
    "zone": "アム・アレーン",
    "coords": "X:16 Y:11",
    "aetheryte": "トゥワイン",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "シルバービーチ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-12yczly",
    "name": "ラセットポポト",
    "job": "BTN",
    "level": 80,
    "zone": "アム・アレーン",
    "coords": "X:19 Y:17",
    "aetheryte": "モルド・スーク",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ラセットポポト"
    ],
    "note": ""
  },
  {
    "id": "gt-fzkfg9",
    "name": "紫根",
    "job": "BTN",
    "level": 80,
    "zone": "アム・アレーン",
    "coords": "X:32 Y:33",
    "aetheryte": "旅立ちの宿",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.2",
    "subNode": "",
    "items": [
      "紫根"
    ],
    "note": ""
  },
  {
    "id": "gt-ph2nvk",
    "name": "ブロードビーン",
    "job": "BTN",
    "level": 80,
    "zone": "イル・メグ",
    "coords": "X:25 Y:36",
    "aetheryte": "リダ・ラーン",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ブロードビーン"
    ],
    "note": ""
  },
  {
    "id": "gt-zt8vj3",
    "name": "メルバウ原木",
    "job": "BTN",
    "level": 80,
    "zone": "イル・メグ",
    "coords": "X:36 Y:27",
    "aetheryte": "ヴォレクドルフ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.2",
    "subNode": "",
    "items": [
      "メルバウ原木"
    ],
    "note": ""
  },
  {
    "id": "gt-xbtefw",
    "name": "ﾃﾝﾀﾞｰｲﾉﾝﾄﾞ/ﾚｶﾞﾘｽｾﾞﾝﾏｲ",
    "job": "BTN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:28 Y:21",
    "aetheryte": "スティルタイド",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "レガリスゼンマイ",
      "テンダーイノンド"
    ],
    "note": ""
  },
  {
    "id": "gt-1oijuwu",
    "name": "ホワイトオークの枝",
    "job": "BTN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:12 Y:29",
    "aetheryte": "ライト村",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ホワイトオークの枝"
    ],
    "note": ""
  },
  {
    "id": "gt-1xh2bar",
    "name": "ﾗｲﾄﾆﾝｸﾞﾐﾝﾄ/白玉土",
    "job": "BTN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:21 Y:9",
    "aetheryte": "トメラの村",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "アイスクラスター",
      "ライトニングミント",
      "白玉土"
    ],
    "note": ""
  },
  {
    "id": "gt-3g4dqe",
    "name": "リトルレモン",
    "job": "BTN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:20 Y:27",
    "aetheryte": "ライト村",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "リトルレモン"
    ],
    "note": ""
  },
  {
    "id": "gt-niv4yx",
    "name": "ｻﾝﾀﾞﾙｳｯﾄﾞ原木/樹液",
    "job": "BTN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:25 Y:36",
    "aetheryte": "スリザーバウ",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.1",
    "subNode": "",
    "items": [
      "サンダルウッド樹液",
      "サンダルウッド原木"
    ],
    "note": ""
  },
  {
    "id": "gt-x304kw",
    "name": "ミストスピナッチ",
    "job": "BTN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:34 Y:21",
    "aetheryte": "ファノヴの里",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ミストスピナッチ"
    ],
    "note": ""
  },
  {
    "id": "gt-1f53ev1",
    "name": "ﾗｲﾄﾆﾝｸﾞﾐﾝﾄ/ｽｲｰﾄﾏｼﾞｮﾗﾑ",
    "job": "BTN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:22 Y:13",
    "aetheryte": "ファノヴの里",
    "spawns": [
      {
        "startET": 4,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "ウィンドクリスタル",
      "スイートマジョラム",
      "ライトニングミント"
    ],
    "note": ""
  },
  {
    "id": "gt-u0zjfl",
    "name": "蒼綿花",
    "job": "BTN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:33 Y:13",
    "aetheryte": "ファノヴの里",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "蒼綿花"
    ],
    "note": ""
  },
  {
    "id": "gt-1u6wk8v",
    "name": "ハードワットル樹皮",
    "job": "BTN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:5 Y:26",
    "aetheryte": "オスタル厳命城",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "ハードワットル樹皮"
    ],
    "note": ""
  },
  {
    "id": "gt-1scpl0g",
    "name": "ペパーミント",
    "job": "BTN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:27 Y:20",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ペパーミント"
    ],
    "note": ""
  },
  {
    "id": "gt-1s1c38e",
    "name": "ﾗｲﾄﾆﾝｸﾞﾐﾝﾄ/ﾎﾞｯｸﾞｾｰｼﾞ",
    "job": "BTN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:31 Y:36",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 12,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "アースクリスタル",
      "ボッグセージ",
      "ライトニングミント",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1yg1n2c",
    "name": "泡マユ",
    "job": "BTN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:26 Y:10",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "泡マユ"
    ],
    "note": ""
  },
  {
    "id": "gt-9vhtni",
    "name": "収集用のレッドパイン原木",
    "job": "BTN",
    "level": 85,
    "zone": "ガレマルド",
    "coords": "X:35.0 Y:5.8",
    "aetheryte": "テルティウム駅",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用のレッドパイン原木"
    ],
    "note": ""
  },
  {
    "id": "gt-121fyq2",
    "name": "収集用のｺｺﾅｯﾂ/ﾊﾟｰﾑ原木",
    "job": "BTN",
    "level": 85,
    "zone": "サベネア島",
    "coords": "X:14.4 Y:14.5",
    "aetheryte": "デミールの遺烈郷",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用のココナッツ",
      "収集用のパーム原木"
    ],
    "note": ""
  },
  {
    "id": "gt-y6fvps",
    "name": "収集用のカエアン綿",
    "job": "BTN",
    "level": 90,
    "zone": "ウルティマ・トゥーレ",
    "coords": "X:9.4 Y:33.2",
    "aetheryte": "リア・ターラ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用のカエアン綿"
    ],
    "note": ""
  },
  {
    "id": "gt-1g2nubi",
    "name": "天然香辛料/迷い草",
    "job": "BTN",
    "level": 90,
    "zone": "ウルティマ・トゥーレ",
    "coords": "X:27.7 Y:12.9",
    "aetheryte": "イーアの里",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "天然香辛料",
      "迷い草"
    ],
    "note": ""
  },
  {
    "id": "gt-znwxr3",
    "name": "ﾊﾞﾙﾀﾞｵ原木/不定性ｽﾎﾟﾝｺﾞｽ茸",
    "job": "BTN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:10.9 Y:30.5",
    "aetheryte": "十二節の園",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "パルダオ原木",
      "不定性スポンゴス茸"
    ],
    "note": ""
  },
  {
    "id": "gt-1fe8ujq",
    "name": "収集用のｼｭｰｺﾝ/ｴﾙﾀﾞｰﾅﾂﾒｸﾞ",
    "job": "BTN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:25.0 Y:5.6",
    "aetheryte": "ポイエテーン・オイコス",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用のシューコン",
      "収集用のエルダーナツメグ"
    ],
    "note": ""
  },
  {
    "id": "gt-j7lj7q",
    "name": "天然香辛料/ﾒﾝﾋﾟｻﾝ原木",
    "job": "BTN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:33.3 Y:14.2",
    "aetheryte": "アナグノリシス天測院",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "天然香辛料",
      "メンピサン原木"
    ],
    "note": ""
  },
  {
    "id": "gt-eghq3c",
    "name": "アブラナ",
    "job": "BTN",
    "level": 90,
    "zone": "ガレマルド",
    "coords": "X:17.9 Y:12.7",
    "aetheryte": "テルティウム駅",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.4",
    "subNode": "",
    "items": [
      "アブラナ"
    ],
    "note": ""
  },
  {
    "id": "gt-856t5q",
    "name": "パームチップ",
    "job": "BTN",
    "level": 90,
    "zone": "サベネア島",
    "coords": "X:25.2 Y:14.3",
    "aetheryte": "パーラカの里",
    "spawns": [
      {
        "startET": 12,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "ファイアクリスタル",
      "パームチップ",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1t3347i",
    "name": "ミロバラン",
    "job": "BTN",
    "level": 90,
    "zone": "サベネア島",
    "coords": "X:28.7 Y:27.7",
    "aetheryte": "イェドリマン",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.2",
    "subNode": "",
    "items": [
      "ミロバラン"
    ],
    "note": ""
  },
  {
    "id": "gt-e21wgo",
    "name": "天然香辛料/ｻﾍﾞﾈｱﾝｺｰﾝ/金ﾏﾕ",
    "job": "BTN",
    "level": 90,
    "zone": "サベネア島",
    "coords": "X:25.4 Y:21.8",
    "aetheryte": "パーラカの里",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.1",
    "subNode": "",
    "items": [
      "天然香辛料",
      "サベネアンコーン",
      "金マユ"
    ],
    "note": ""
  },
  {
    "id": "gt-1tg0cmc",
    "name": "収集用の黒麦/ｱｲｽﾊﾞｰｸﾞﾚﾀｽ",
    "job": "BTN",
    "level": 90,
    "zone": "ラヴィリンソス",
    "coords": "X:9.8 Y:22.1",
    "aetheryte": "アポリア本部",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用の黒麦",
      "収集用のアイスバーグレタス"
    ],
    "note": ""
  },
  {
    "id": "gt-fe38y1",
    "name": "渋木/朝霧の樹皮",
    "job": "BTN",
    "level": 90,
    "zone": "ラヴィリンソス",
    "coords": "X:28.0 Y:11.6",
    "aetheryte": "アルケイオン保管院",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "渋木",
      "朝霧の樹皮"
    ],
    "note": ""
  },
  {
    "id": "gt-84qjym",
    "name": "水瓶土/苦参",
    "job": "BTN",
    "level": 90,
    "zone": "ラヴィリンソス",
    "coords": "X:10.0 Y:34.8",
    "aetheryte": "アポリア本部",
    "spawns": [
      {
        "startET": 8,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "ウィンドクリスタル",
      "水瓶土",
      "苦参",
      "ウィンドクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-15ul90v",
    "name": "不定性ｸｸﾙﾎﾞｰﾝ/ﾌﾞﾗｯｸﾁｪﾘｰ原木",
    "job": "BTN",
    "level": 90,
    "zone": "ラヴィリンソス",
    "coords": "X:20.0 Y:35.8",
    "aetheryte": "リトルシャーレアン",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.5",
    "subNode": "",
    "items": [
      "不定性ククルビーン",
      "ブラックチェリー原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1gshdnf",
    "name": "ラヴィングフラワー",
    "job": "BTN",
    "level": 90,
    "zone": "嘆きの海",
    "coords": "X:25.7 Y:20.1",
    "aetheryte": "ベストウェイ・バロー",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.4",
    "subNode": "",
    "items": [
      "ラヴィングフラワー"
    ],
    "note": ""
  },
  {
    "id": "gt-167hety",
    "name": "収集用の高山亜麻",
    "job": "BTN",
    "level": 95,
    "zone": "オルコ・パチャ",
    "coords": "X:5.5 Y:23.9",
    "aetheryte": "ワチュン・ペロ",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用の高山亜麻"
    ],
    "note": ""
  },
  {
    "id": "gt-1i12t1",
    "name": "ゴールデンブッシュ",
    "job": "BTN",
    "level": 95,
    "zone": "シャーローニ荒野",
    "coords": "X:16.2 Y:10.3",
    "aetheryte": "シェシェネ青燐泉",
    "spawns": [
      {
        "startET": 4,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "ゴールデンブッシュ",
      "ウィンドクリスタル"
    ],
    "note": ""
  },
  {
    "id": "gt-bw7zlp",
    "name": "菖蒲根/ｳﾞｫﾙｶﾆｯｸｸﾞﾗｽ",
    "job": "BTN",
    "level": 95,
    "zone": "リビング・メモリー",
    "coords": "X:27.4 Y:9.6",
    "aetheryte": "レイノード・ファイア",
    "spawns": [
      {
        "startET": 16,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "7.3",
    "subNode": "",
    "items": [
      "ヴォルカニックグラス",
      "ファイアクリスタル",
      "菖蒲根",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-vlnekr",
    "name": "オルコ亜麻",
    "job": "BTN",
    "level": 100,
    "zone": "オルコ・パチャ",
    "coords": "X:5.2 Y:25.4",
    "aetheryte": "ワチュン・ペロ",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "オルコ亜麻",
      "アースクリスタル"
    ],
    "note": ""
  },
  {
    "id": "gt-1vza1v1",
    "name": "イペー原木",
    "job": "BTN",
    "level": 100,
    "zone": "コザマル・カ",
    "coords": "X:6.7 Y:35.0",
    "aetheryte": "アースンシャイア",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "イペー原木"
    ],
    "note": ""
  },
  {
    "id": "gt-ge8vpt",
    "name": "ロウヤシの葉",
    "job": "BTN",
    "level": 100,
    "zone": "コザマル・カ",
    "coords": "X:15.2 Y:10.6",
    "aetheryte": "オック・ハヌ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "ロウヤシの葉",
      "ライトニングクリスタル"
    ],
    "note": ""
  },
  {
    "id": "gt-16xcmjx",
    "name": "シャーローニ・コーヒー",
    "job": "BTN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:35.1 Y:16.2",
    "aetheryte": "メワヘイゾーン",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.2",
    "subNode": "",
    "items": [
      "シャーローニ・コーヒー"
    ],
    "note": ""
  },
  {
    "id": "gt-1qymrge",
    "name": "ノパルフラワー",
    "job": "BTN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:11.0 Y:31.0",
    "aetheryte": "シェシェネ青燐泉",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "ノパルフラワー"
    ],
    "note": ""
  },
  {
    "id": "gt-v3m4a",
    "name": "収集用のｱｶｼｱ樹皮/ｱｶｼｱ原木",
    "job": "BTN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:30.7 Y:19.7",
    "aetheryte": "メワヘイゾーン",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のアカシア樹皮",
      "収集用のアカシア原木"
    ],
    "note": ""
  },
  {
    "id": "gt-f452tj",
    "name": "コチニール染料",
    "job": "BTN",
    "level": 100,
    "zone": "ヘリテージファウンド",
    "coords": "X:34.1 Y:20.6",
    "aetheryte": "ヤースラニ駅",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.2",
    "subNode": "",
    "items": [
      "コチニール染料"
    ],
    "note": ""
  },
  {
    "id": "gt-1rdogjf",
    "name": "ｺｰﾃﾞｨｱ原木/ｺｰﾃﾞｨｱ樹液塊",
    "job": "BTN",
    "level": 100,
    "zone": "ヤクテル樹海",
    "coords": "X:34.7 Y:22.7",
    "aetheryte": "マムーク",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.3",
    "subNode": "",
    "items": [
      "コーディア樹液塊",
      "コーディア原木"
    ],
    "note": ""
  },
  {
    "id": "gt-iql93",
    "name": "収集用のｽｲｰﾄｸｸﾙﾋﾞｰﾝ/ﾀﾞｰｸﾏﾎｶﾞﾆｰ原木",
    "job": "BTN",
    "level": 100,
    "zone": "ヤクテル樹海",
    "coords": "X:37.4 Y:34.6",
    "aetheryte": "マムーク",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のスイートククルビーン",
      "収集用のダークマホガニー原木"
    ],
    "note": ""
  },
  {
    "id": "gt-14uifyq",
    "name": "エレクトロパイン原木",
    "job": "BTN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:8.1 Y:9.1",
    "aetheryte": "レイノード・ウィンド",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "ファイアクリスタル",
      "エレクトロパイン原木"
    ],
    "note": ""
  },
  {
    "id": "gt-1mdq0kq",
    "name": "ｵﾌﾟﾃｨｶﾙｸﾞﾗｽ/海島綿",
    "job": "BTN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:28.8 Y:16.8",
    "aetheryte": "レイノード・ファイア",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.1",
    "subNode": "",
    "items": [
      "オプティカルグラス",
      "海島綿"
    ],
    "note": ""
  },
  {
    "id": "gt-1wsn37e",
    "name": "収集用のウィンドローレル",
    "job": "BTN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:9.2 Y:7.3",
    "aetheryte": "レイノード・ウィンド",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のウィンドローレル"
    ],
    "note": ""
  },
  {
    "id": "gt-mf68z8",
    "name": "黄銅鉱/DMｸﾗｽﾀｰ",
    "job": "MIN",
    "level": 50,
    "zone": "クルザス西部高地",
    "coords": "X:28 Y:22",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv50 ???",
    "items": [
      "黄銅鉱",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-jharla",
    "name": "闇鉄鉱",
    "job": "MIN",
    "level": 50,
    "zone": "クルザス中央高地",
    "coords": "X:27 Y:19",
    "aetheryte": "ドラゴンヘッド",
    "spawns": [
      {
        "startET": 1,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "闇鉄鉱",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-j94mwx",
    "name": "星性岩",
    "job": "MIN",
    "level": 50,
    "zone": "クルザス中央高地",
    "coords": "X:22 Y:24",
    "aetheryte": "ドラゴンヘッド",
    "spawns": [
      {
        "startET": 21,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "星性岩",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1cigjlz",
    "name": "各種クラスター",
    "job": "MIN",
    "level": 50,
    "zone": "モードゥナ",
    "coords": "X:28 Y:12",
    "aetheryte": "レヴナンツトール",
    "spawns": [
      {
        "startET": 13,
        "durationET": 3
      },
      {
        "startET": 17,
        "durationET": 3
      },
      {
        "startET": 21,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "コールマターG4",
      "ライトニングクラスター",
      "ファイアクラスター",
      "ウィンドクラスター",
      "ウォータークラスター",
      "アイスクラスター",
      "アースクラスター",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-81401n",
    "name": "霊性岩",
    "job": "MIN",
    "level": 50,
    "zone": "黒衣森：南部森林",
    "coords": "X:16 Y:31",
    "aetheryte": "キャンプ・トランキル",
    "spawns": [
      {
        "startET": 6,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "霊性岩",
      "シュラウドソイルG3",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-vtwj3e",
    "name": "ザナラーンソイルG3",
    "job": "MIN",
    "level": 50,
    "zone": "西ザナラーン",
    "coords": "X:19 Y:28",
    "aetheryte": "ホライズン",
    "spawns": [
      {
        "startET": 5,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ウォータークラスター",
      "ザナラーンソイルG3",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-gn8tj9",
    "name": "自然金/ｴﾒﾗﾙﾄﾞ/ﾀﾞｲﾔﾓﾝﾄﾞ",
    "job": "MIN",
    "level": 50,
    "zone": "中央ザナラーン",
    "coords": "X:25 Y:15",
    "aetheryte": "ブラックブラッシュ停留所",
    "spawns": [
      {
        "startET": 4,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "自然金",
      "エメラルド原石",
      "ダイヤモンド原石",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-wz33hd",
    "name": "ラノシアンソイルG3",
    "job": "MIN",
    "level": 50,
    "zone": "中央ラノシア",
    "coords": "X:23 Y:26",
    "aetheryte": "サマーフォード庄",
    "spawns": [
      {
        "startET": 19,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ファイアクラスター",
      "ラノシアンソイルG3",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1g71pj",
    "name": "ルビー/サファイア原石",
    "job": "MIN",
    "level": 50,
    "zone": "低地ラノシア",
    "coords": "X:23 Y:21",
    "aetheryte": "モラビー造船廠",
    "spawns": [
      {
        "startET": 18,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "ルビー原石",
      "サファイア原石",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1heenu7",
    "name": "強霊性岩",
    "job": "MIN",
    "level": 50,
    "zone": "東ザナラーン",
    "coords": "X:26 Y:18",
    "aetheryte": "キャンプ・ドライボーン",
    "spawns": [
      {
        "startET": 2,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "強霊性岩"
    ],
    "note": ""
  },
  {
    "id": "gt-o5vyc6",
    "name": "金鉱/ｸﾞﾚｶﾞﾘｱｽﾜｰﾑ",
    "job": "MIN",
    "level": 50,
    "zone": "東ザナラーン",
    "coords": "X:29 Y:24",
    "aetheryte": "キャンプ・ドライボーン",
    "spawns": [
      {
        "startET": 9,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "金鉱",
      "コブランラーヴァ",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-8ekpe9",
    "name": "金砂",
    "job": "MIN",
    "level": 50,
    "zone": "東ザナラーン",
    "coords": "X:27 Y:22",
    "aetheryte": "キャンプ・ドライボーン",
    "spawns": [
      {
        "startET": 5,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "金砂",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-glfwzr",
    "name": "パミスストーン",
    "job": "MIN",
    "level": 50,
    "zone": "東ラノシア",
    "coords": "X:15 Y:27",
    "aetheryte": "ワインポート",
    "spawns": [
      {
        "startET": 1,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "パミスストーン"
    ],
    "note": ""
  },
  {
    "id": "gt-m5xtps",
    "name": "ラノシア岩塩",
    "job": "MIN",
    "level": 50,
    "zone": "東ラノシア",
    "coords": "X:17 Y:34",
    "aetheryte": "ワインポート",
    "spawns": [
      {
        "startET": 17,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "ラノシア岩塩",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1qfmokj",
    "name": "白金鉱",
    "job": "MIN",
    "level": 50,
    "zone": "南ザナラーン",
    "coords": "X:15 Y:12",
    "aetheryte": "リトルアラミゴ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "白金鉱",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-5mwd3y",
    "name": "バジリスクの初卵",
    "job": "MIN",
    "level": 50,
    "zone": "北ザナラーン",
    "coords": "X:23 Y:22",
    "aetheryte": "青燐精製所",
    "spawns": [
      {
        "startET": 17,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "バジリスクの初卵"
    ],
    "note": ""
  },
  {
    "id": "gt-1tp2r2b",
    "name": "鉄重石/ﾄﾊﾟｰｽﾞ/ｱｲｵﾗｲﾄ",
    "job": "MIN",
    "level": 50,
    "zone": "北ザナラーン",
    "coords": "X:16 Y:20",
    "aetheryte": "青燐精製所",
    "spawns": [
      {
        "startET": 3,
        "durationET": 3
      }
    ],
    "ptype": "未知",
    "patch": "2.x",
    "subNode": "Lv50 ???",
    "items": [
      "グレガリアスワーム",
      "鉄重石",
      "トパーズ原石",
      "アイオライト原石",
      "無属性クリスタル",
      "ダークマタークラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1n4sch6",
    "name": "(収集)黄鉄/輝銅/褐鉄",
    "job": "MIN",
    "level": 51,
    "zone": "高地ドラヴァニア",
    "coords": "X:31 Y:32",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の輝銅鉱",
      "収集用の黄鉄鉱",
      "収集用の褐鉄鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-ybu52b",
    "name": "ｲｴﾛｰ/ｸﾞﾘｰﾝｸｫｰﾂ",
    "job": "MIN",
    "level": 55,
    "zone": "ドラヴァニア雲海",
    "coords": "X:33 Y:23",
    "aetheryte": "モグモグホーム",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv55 ???",
    "items": [
      "イエロークォーツ",
      "グリーンクォーツ"
    ],
    "note": ""
  },
  {
    "id": "gt-m90w5k",
    "name": "(収集)ｱﾊﾞﾗｼｱ天然水/皇金砂",
    "job": "MIN",
    "level": 56,
    "zone": "アバラシア雲海",
    "coords": "X:21 Y:12",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のアバラシア天然水",
      "収集用の皇金砂"
    ],
    "note": ""
  },
  {
    "id": "gt-1kpsf0p",
    "name": "アダマン鉱",
    "job": "MIN",
    "level": 60,
    "zone": "アジス・ラー",
    "coords": "X:23 Y:6",
    "aetheryte": "ポート・ヘリックス",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "アダマン鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1l5rhcu",
    "name": "レッドアルメン",
    "job": "MIN",
    "level": 60,
    "zone": "アジス・ラー",
    "coords": "X:36 Y:16",
    "aetheryte": "ポート・ヘリックス",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "レッドアルメン"
    ],
    "note": ""
  },
  {
    "id": "gt-18x4vt0",
    "name": "輝金鉱",
    "job": "MIN",
    "level": 60,
    "zone": "アジス・ラー",
    "coords": "X:6 Y:16",
    "aetheryte": "ポート・ヘリックス",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "輝金鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1dtnh4d",
    "name": "ｱﾊﾞﾗｼｱ岩塩/ﾚｯﾄﾞｸｫｰﾂ",
    "job": "MIN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:8 Y:9",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "アバラシア岩塩",
      "レッドクォーツ"
    ],
    "note": ""
  },
  {
    "id": "gt-1592ioe",
    "name": "ﾒﾃｵﾗｲﾄ/菱亜鉛鉱",
    "job": "MIN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:37 Y:14",
    "aetheryte": "オク・ズンド",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.3",
    "subNode": "Lv60 ???",
    "items": [
      "菱亜鉛鉱",
      "メテオライト"
    ],
    "note": ""
  },
  {
    "id": "gt-v6stbb",
    "name": "ライトニンググラベル",
    "job": "MIN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:23 Y:30",
    "aetheryte": "キャンプ・クラウドトップ",
    "spawns": [
      {
        "startET": 16,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 ヴール・シアンシラン",
    "items": [
      "ライトニンググラベル",
      "強雷性岩",
      "レイディアントライトニンググラベル",
      "ライトニングクリスタル",
      "レイディアントアストラルグラベル",
      "ライトニングクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-16ucp4v",
    "name": "金雲母",
    "job": "MIN",
    "level": 60,
    "zone": "アバラシア雲海",
    "coords": "X:38 Y:37",
    "aetheryte": "キャンプ・クラウドトップ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "金雲母"
    ],
    "note": ""
  },
  {
    "id": "gt-17pcqcx",
    "name": "トリフェーン原石",
    "job": "MIN",
    "level": 60,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:24 Y:7",
    "aetheryte": "カストルム・オリエンス",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv60 ???",
    "items": [
      "トリフェーン原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1qdoevn",
    "name": "アストラルグラベル",
    "job": "MIN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:37 Y:18",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "アストラルグラベル",
      "バイオレットクォーツ"
    ],
    "note": ""
  },
  {
    "id": "gt-16yhjc4",
    "name": "ライトニンググラベル",
    "job": "MIN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:21 Y:26",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 レッドリム",
    "items": [
      "ライトニンググラベル",
      "強雷性岩",
      "レイディアントライトニンググラベル",
      "レイディアントアストラルグラベル",
      "ライトニングクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1n1m6cu",
    "name": "重石華",
    "job": "MIN",
    "level": 60,
    "zone": "クルザス西部高地",
    "coords": "X:11 Y:10",
    "aetheryte": "ファルコンネスト",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "重石華"
    ],
    "note": ""
  },
  {
    "id": "gt-1onx7pj",
    "name": "ファイアグラベル",
    "job": "MIN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:17 Y:37",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 12,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 ランドロード遺構",
    "items": [
      "ファイアグラベル",
      "ファイアクリスタル",
      "レイディアントアストラルグラベル",
      "レイディアントファイアグラベル",
      "強火性岩",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-mfriy3",
    "name": "光霊銀鉱/皇金鉱",
    "job": "MIN",
    "level": 60,
    "zone": "ドラヴァニア雲海",
    "coords": "X:8 Y:33",
    "aetheryte": "白亜の宮殿",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.2",
    "subNode": "Lv60 ???",
    "items": [
      "光霊銀鉱",
      "皇金鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1nl64by",
    "name": "ファイアグラベル",
    "job": "MIN",
    "level": 60,
    "zone": "高地ドラヴァニア",
    "coords": "X:27 Y:2",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 4,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3",
    "subNode": "Lv60 アヴァロニア・フォールン",
    "items": [
      "ファイアグラベル",
      "ファイアクリスタル",
      "レイディアントアストラルグラベル",
      "レイディアントファイアグラベル",
      "強火性岩",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-l77iu9",
    "name": "輝銅鉱/黄鉄鉱/褐鉄鉱",
    "job": "MIN",
    "level": 60,
    "zone": "高地ドラヴァニア",
    "coords": "X:28 Y:18",
    "aetheryte": "テイルフェザー",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv55 ???",
    "items": [
      "輝銅鉱",
      "黄鉄鉱",
      "褐鉄鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1p6v0nn",
    "name": "ファイアグラベル",
    "job": "MIN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:26 Y:17",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 8,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "3.3",
    "subNode": "Lv60 シャーレアン工匠街",
    "items": [
      "ファイアグラベル",
      "ファイアクリスタル",
      "レイディアントアストラルグラベル",
      "レイディアントファイアグラベル",
      "強火性岩",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-wi2sft",
    "name": "ブルークォーツ",
    "job": "MIN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:12 Y:15",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "ブルークォーツ"
    ],
    "note": ""
  },
  {
    "id": "gt-12txgee",
    "name": "赤銅鉱/赤鉄鉱",
    "job": "MIN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:33 Y:30",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "3.0",
    "subNode": "Lv60 ???",
    "items": [
      "赤銅鉱",
      "赤鉄鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1gn4cun",
    "name": "沸石",
    "job": "MIN",
    "level": 60,
    "zone": "低地ドラヴァニア",
    "coords": "X:16 Y:31",
    "aetheryte": "イディルシャイア",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "3.4",
    "subNode": "Lv60 ???",
    "items": [
      "沸石"
    ],
    "note": ""
  },
  {
    "id": "gt-1orryh3",
    "name": "(収集)ﾄﾘﾌｪｰﾝ/ｶｲﾔﾅｲﾄ",
    "job": "MIN",
    "level": 61,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:30 Y:13",
    "aetheryte": "ピーリングストーンズ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のトリフェーン原石",
      "収集用のカイヤナイト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1fdl3fy",
    "name": "(収集)ｽﾀｰｽﾋﾟﾈﾙ原石",
    "job": "MIN",
    "level": 61,
    "zone": "紅玉海",
    "coords": "X:21 Y:34",
    "aetheryte": "碧のタマミズ",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のスタースピネル原石"
    ],
    "note": ""
  },
  {
    "id": "gt-198kimv",
    "name": "スタースピネル原石",
    "job": "MIN",
    "level": 65,
    "zone": "紅玉海",
    "coords": "X:15 Y:4",
    "aetheryte": "オノコロ島",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv65 ???",
    "items": [
      "スタースピネル原石"
    ],
    "note": ""
  },
  {
    "id": "gt-80vodv",
    "name": "(収集)ｱｽﾞﾗｲﾄ/清銀鉱",
    "job": "MIN",
    "level": 66,
    "zone": "アジムステップ",
    "coords": "X:36 Y:26",
    "aetheryte": "再会の市",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の清銀鉱",
      "収集用のアズライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1wfiwmx",
    "name": "アズライト原石",
    "job": "MIN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:5 Y:30",
    "aetheryte": "ドーロ・イロー",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "アズライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-xkh5tk",
    "name": "ショール/ヤンサ沃土",
    "job": "MIN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:33 Y:26",
    "aetheryte": "再会の市",
    "spawns": [
      {
        "startET": 12,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "ヤンサ沃土",
      "ショール",
      "ライトニングクリスタル",
      "ライトニングクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-7gvqds",
    "name": "清銀鉱/アジム湧水",
    "job": "MIN",
    "level": 70,
    "zone": "アジムステップ",
    "coords": "X:24 Y:37",
    "aetheryte": "再会の市",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.4",
    "subNode": "Lv70 ???",
    "items": [
      "アジム湧水",
      "清銀鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-74pbrr",
    "name": "アラミゴ塩",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:21 Y:29",
    "aetheryte": "アラミガン・クォーター",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "アラミゴ塩"
    ],
    "note": ""
  },
  {
    "id": "gt-k1zxs8",
    "name": "アルマンディン/ヤンサ沃土",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:11 Y:26",
    "aetheryte": "ポルタ・プレトリア",
    "spawns": [
      {
        "startET": 0,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "ヤンサ沃土",
      "アイスクリスタル",
      "アルマンディン",
      "ロードライト",
      "アイスクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-lmh63a",
    "name": "常輝鉱",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア湖畔地帯",
    "coords": "X:22 Y:13",
    "aetheryte": "ポルタ・プレトリア",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.4",
    "subNode": "Lv70 ???",
    "items": [
      "常輝鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-41dj2k",
    "name": "クロマイト/ギラバニア清水",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:15 Y:34",
    "aetheryte": "アラギリ",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "ギラバニア清水",
      "クロマイト"
    ],
    "note": ""
  },
  {
    "id": "gt-6966p0",
    "name": "ロードナイト原石",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア山岳地帯",
    "coords": "X:26 Y:12",
    "aetheryte": "アラガーナ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "ロードナイト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-nmftow",
    "name": "岩鉄",
    "job": "MIN",
    "level": 70,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:27 Y:30",
    "aetheryte": "ピーリングストーンズ",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.4",
    "subNode": "Lv70 ???",
    "items": [
      "岩鉄"
    ],
    "note": ""
  },
  {
    "id": "gt-375hbh",
    "name": "インペリアルジェード原石",
    "job": "MIN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:29 Y:9",
    "aetheryte": "烈士庵",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "インペリアルジェード原石"
    ],
    "note": ""
  },
  {
    "id": "gt-14eax7y",
    "name": "パーライト/ヤンサ沃土",
    "job": "MIN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:27 Y:7",
    "aetheryte": "烈士庵",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "ヤンサ沃土",
      "ファイアクリスタル",
      "パーライト",
      "デイサイト"
    ],
    "note": ""
  },
  {
    "id": "gt-1yn9ugm",
    "name": "清金鉱",
    "job": "MIN",
    "level": 70,
    "zone": "ヤンサ",
    "coords": "X:21 Y:10",
    "aetheryte": "烈士庵",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.0",
    "subNode": "Lv70 ???",
    "items": [
      "清金鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1eymqua",
    "name": "夜鉄鉱/鷹目石",
    "job": "MIN",
    "level": 70,
    "zone": "紅玉海",
    "coords": "X:11 Y:22",
    "aetheryte": "オノコロ島",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "4.3",
    "subNode": "Lv70 ???",
    "items": [
      "夜鉄鉱",
      "鷹目石"
    ],
    "note": ""
  },
  {
    "id": "gt-4sw2qi",
    "name": "(収集)ﾗｽﾞﾗｲﾄ原石",
    "job": "MIN",
    "level": 71,
    "zone": "ラケティカ大森林",
    "coords": "X:16 Y:18",
    "aetheryte": "スリザーバウ",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のラズライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1l9j47n",
    "name": "(収集)賢銅鉱/ﾍﾟﾀﾗｲﾄ",
    "job": "MIN",
    "level": 71,
    "zone": "レイクランド",
    "coords": "X:31 Y:24",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の賢銅鉱",
      "収集用のペタライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-7tqh8m",
    "name": "(収集)ｷﾞﾗﾊﾞﾆｱｱﾙﾒﾝ",
    "job": "MIN",
    "level": 76,
    "zone": "ギラバニア辺境地帯",
    "coords": "X:32 Y:31",
    "aetheryte": "ピーリングストーンズ",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のギラバニアアルメン"
    ],
    "note": ""
  },
  {
    "id": "gt-50h2ib",
    "name": "(収集)海塩/ｵﾆｷｽ原石",
    "job": "MIN",
    "level": 76,
    "zone": "テンペスト",
    "coords": "X:25 Y:4",
    "aetheryte": "オンドの潮溜まり",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用の海塩",
      "収集用のオニキス原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1j83hhz",
    "name": "(収集)海底岩/ﾀﾝｸﾞｽﾃﾝ",
    "job": "MIN",
    "level": 76,
    "zone": "テンペスト",
    "coords": "X:33 Y:21",
    "aetheryte": "オンドの潮溜まり",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "収集用のタングステン鉱",
      "収集用の海底岩"
    ],
    "note": ""
  },
  {
    "id": "gt-3ijuau",
    "name": "アッシュアルメン",
    "job": "MIN",
    "level": 80,
    "zone": "アム・アレーン",
    "coords": "X:20 Y:9",
    "aetheryte": "モルド・スーク",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.2",
    "subNode": "",
    "items": [
      "アッシュアルメン"
    ],
    "note": ""
  },
  {
    "id": "gt-9upqic",
    "name": "トリプライト原石",
    "job": "MIN",
    "level": 80,
    "zone": "アム・アレーン",
    "coords": "X:20 Y:29",
    "aetheryte": "旅立ちの宿",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "トリプライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-i59l85",
    "name": "ダイアスポア原石",
    "job": "MIN",
    "level": 80,
    "zone": "イル・メグ",
    "coords": "X:26 Y:13",
    "aetheryte": "ヴォレクドルフ",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ダイアスポア原石"
    ],
    "note": ""
  },
  {
    "id": "gt-17j56lz",
    "name": "虹結晶/ベリリウム鉱",
    "job": "MIN",
    "level": 80,
    "zone": "イル・メグ",
    "coords": "X:31 Y:21",
    "aetheryte": "ヴォレクドルフ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.1",
    "subNode": "",
    "items": [
      "ベリリウム鉱",
      "虹結晶"
    ],
    "note": ""
  },
  {
    "id": "gt-1bh6jl0",
    "name": "白夜結晶",
    "job": "MIN",
    "level": 80,
    "zone": "イル・メグ",
    "coords": "X:35 Y:8",
    "aetheryte": "ヴォレクドルフ",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "白夜結晶"
    ],
    "note": ""
  },
  {
    "id": "gt-10gx72i",
    "name": "ヘマタイト原石",
    "job": "MIN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:34 Y:23",
    "aetheryte": "スティルタイド",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ヘマタイト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-vu3avy",
    "name": "轟雷性岩/ｼｬﾄﾞｳｸｫｰﾂ",
    "job": "MIN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:33 Y:19",
    "aetheryte": "スティルタイド",
    "spawns": [
      {
        "startET": 16,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "ファイアクリスタル",
      "シャドウクォーツ",
      "轟雷性岩",
      "ファイアクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-15zpr30",
    "name": "超硬水",
    "job": "MIN",
    "level": 80,
    "zone": "コルシア島",
    "coords": "X:36 Y:12",
    "aetheryte": "スティルタイド",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "超硬水"
    ],
    "note": ""
  },
  {
    "id": "gt-bvegzv",
    "name": "オニキス原石",
    "job": "MIN",
    "level": 80,
    "zone": "テンペスト",
    "coords": "X:16 Y:21",
    "aetheryte": "マカレンサス広場",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "オニキス原石"
    ],
    "note": ""
  },
  {
    "id": "gt-dpyn5v",
    "name": "タングステン鉱",
    "job": "MIN",
    "level": 80,
    "zone": "テンペスト",
    "coords": "X:33 Y:8",
    "aetheryte": "オンドの潮溜まり",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "タングステン鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1m80tes",
    "name": "プルプラシェルチップ",
    "job": "MIN",
    "level": 80,
    "zone": "テンペスト",
    "coords": "X:34 Y:31",
    "aetheryte": "オンドの潮溜まり",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.2",
    "subNode": "",
    "items": [
      "プルプラシェルチップ"
    ],
    "note": ""
  },
  {
    "id": "gt-w94wem",
    "name": "ラズライト原石",
    "job": "MIN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:20 Y:20",
    "aetheryte": "スリザーバウ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ラズライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-ub6e7h",
    "name": "苦灰石",
    "job": "MIN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:7 Y:30",
    "aetheryte": "スリザーバウ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.4",
    "subNode": "",
    "items": [
      "苦灰石"
    ],
    "note": ""
  },
  {
    "id": "gt-m2t0ex",
    "name": "轟雷性岩/嵐性岩",
    "job": "MIN",
    "level": 80,
    "zone": "ラケティカ大森林",
    "coords": "X:22 Y:12",
    "aetheryte": "ファノヴの里",
    "spawns": [
      {
        "startET": 0,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "ウォータークラスター",
      "嵐性岩",
      "轟雷性岩"
    ],
    "note": ""
  },
  {
    "id": "gt-g3lgmm",
    "name": "ペタライト原石",
    "job": "MIN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:28 Y:33",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "5.0",
    "subNode": "",
    "items": [
      "ペタライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1t749da",
    "name": "金錫鉱/輝コバルト鉱",
    "job": "MIN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:5 Y:34",
    "aetheryte": "オスタル厳命城",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "輝コバルト鉱",
      "金錫鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-aaj9q3",
    "name": "轟雷性岩/光曜石",
    "job": "MIN",
    "level": 80,
    "zone": "レイクランド",
    "coords": "X:35 Y:29",
    "aetheryte": "ジョッブ砦",
    "spawns": [
      {
        "startET": 8,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "5.3",
    "subNode": "",
    "items": [
      "ライトニングクリスタル",
      "轟雷性岩",
      "光曜石",
      "ライトニングクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1pnwcmw",
    "name": "収集用の北洋岩塩/ｱﾒﾄﾘﾝ原石",
    "job": "MIN",
    "level": 85,
    "zone": "ラヴィリンソス",
    "coords": "X:32.4 Y:21.1",
    "aetheryte": "アルケイオン保管院",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用の北洋岩塩",
      "収集用のアメトリン原石"
    ],
    "note": ""
  },
  {
    "id": "gt-dckas0",
    "name": "収集用の蒼鉛鉱",
    "job": "MIN",
    "level": 85,
    "zone": "嘆きの海",
    "coords": "X:16.3 Y:32.6",
    "aetheryte": "涙の入り江",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用の蒼鉛鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-w3t080",
    "name": "不定性古竜の鱗/軟銀鉱",
    "job": "MIN",
    "level": 90,
    "zone": "ウルティマ・トゥーレ",
    "coords": "X:16.8 Y:29.2",
    "aetheryte": "リア・ターラ",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.5",
    "subNode": "",
    "items": [
      "不定性古竜の鱗",
      "軟銀鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-154wmcb",
    "name": "スポジュメン原石",
    "job": "MIN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:29.7 Y:18.1",
    "aetheryte": "アナグノリシス天測院",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.4",
    "subNode": "",
    "items": [
      "スポジュメン原石"
    ],
    "note": ""
  },
  {
    "id": "gt-v8kzjn",
    "name": "極硬水/ロジウム砂",
    "job": "MIN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:13.5 Y:7.2",
    "aetheryte": "ポイエテーン・オイコス",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "極硬水",
      "ロジウム砂"
    ],
    "note": ""
  },
  {
    "id": "gt-113n38b",
    "name": "収集用のﾌﾞﾙｰｼﾞﾙｺﾝ/鉄雲母",
    "job": "MIN",
    "level": 90,
    "zone": "エルピス",
    "coords": "X:8.2 Y:36.5",
    "aetheryte": "十二節の園",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用の鉄雲母",
      "収集用のブルージルコン原石"
    ],
    "note": ""
  },
  {
    "id": "gt-sex5iv",
    "name": "ﾙﾁﾙｸｫｰﾂ原石/ｿﾞｲｻｲﾄ原石",
    "job": "MIN",
    "level": 90,
    "zone": "ガレマルド",
    "coords": "X:32.8 Y:16.8",
    "aetheryte": "テルティウム駅",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "ルチルクォーツ原石",
      "ゾイサイト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1hhr42b",
    "name": "闇性岩",
    "job": "MIN",
    "level": 90,
    "zone": "ガレマルド",
    "coords": "X:10.0 Y:15.3",
    "aetheryte": "キャンプ・ブロークングラス",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "ライトニングクリスタル",
      "闇性岩",
      "ライトニングクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-yevqyx",
    "name": "極硬水/北州苦灰石/ｴﾌﾞﾗｰﾅ原石",
    "job": "MIN",
    "level": 90,
    "zone": "ガレマルド",
    "coords": "X:32.2 Y:34.6",
    "aetheryte": "テルティウム駅",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.1",
    "subNode": "",
    "items": [
      "北州苦灰石",
      "極硬水",
      "エブラーナダンビュライト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1rnkn2a",
    "name": "収集用のﾌﾘｷﾞｱﾝｺﾞｰﾙﾄﾞ/ｴﾌﾞﾗｰﾅｱﾙﾒﾝ",
    "job": "MIN",
    "level": 90,
    "zone": "ガレマルド",
    "coords": "X:12.8 Y:21.8",
    "aetheryte": "キャンプ・ブロークングラス",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用のフリギアンゴールド鉱",
      "収集用のエブラーナアルメン"
    ],
    "note": ""
  },
  {
    "id": "gt-fcuaj9",
    "name": "マグヘマイト",
    "job": "MIN",
    "level": 90,
    "zone": "サベネア島",
    "coords": "X:23.6 Y:13.3",
    "aetheryte": "パーラカの里",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.4",
    "subNode": "",
    "items": [
      "マグヘマイト"
    ],
    "note": ""
  },
  {
    "id": "gt-zfvj4b",
    "name": "収集用の白目鉱",
    "job": "MIN",
    "level": 90,
    "zone": "サベネア島",
    "coords": "X:32.5 Y:25.0",
    "aetheryte": "パーラカの里",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "収集用の白目鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1u2a5oi",
    "name": "灰緑珪藻土",
    "job": "MIN",
    "level": 90,
    "zone": "ラヴィリンソス",
    "coords": "X:11.1 Y:21.4",
    "aetheryte": "アポリア本部",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.2",
    "subNode": "",
    "items": [
      "灰緑珪藻土"
    ],
    "note": ""
  },
  {
    "id": "gt-wlv8yn",
    "name": "ｲﾙﾒﾅｲﾄ/不定性ｴｲｺﾝﾄﾞﾗｲﾄ",
    "job": "MIN",
    "level": 90,
    "zone": "嘆きの海",
    "coords": "X:29.5 Y:22.3",
    "aetheryte": "ベストウェイ・バロー",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "イルメナイト",
      "不定性エイコンドライト"
    ],
    "note": ""
  },
  {
    "id": "gt-c1kqz7",
    "name": "ﾙﾅｸｫｰﾂ/ｱｰｽｸｫｰﾂ",
    "job": "MIN",
    "level": 90,
    "zone": "嘆きの海",
    "coords": "X:21.6 Y:34.7",
    "aetheryte": "涙の入り江",
    "spawns": [
      {
        "startET": 0,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "6.3",
    "subNode": "",
    "items": [
      "ルナクォーツ",
      "アースクリスタル",
      "アースクォーツ",
      "アースクラスター"
    ],
    "note": ""
  },
  {
    "id": "gt-1sgx18s",
    "name": "極硬水/ﾙﾅｱﾀﾞﾏﾝ鉱",
    "job": "MIN",
    "level": 90,
    "zone": "嘆きの海",
    "coords": "X:9.2 Y:22.8",
    "aetheryte": "涙の入り江",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "6.0",
    "subNode": "",
    "items": [
      "極硬水",
      "ルナアダマン鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1v9tshv",
    "name": "収集用のダークアンバー原石",
    "job": "MIN",
    "level": 95,
    "zone": "コザマル・カ",
    "coords": "X:7.4 Y:6.5",
    "aetheryte": "オック・ハヌ",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のダークアンバー原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1ru4s54",
    "name": "トラルアルメン",
    "job": "MIN",
    "level": 100,
    "zone": "オルコ・パチャ",
    "coords": "X:36.8 Y:29.7",
    "aetheryte": "ウォーラーの残響",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "トラルアルメン"
    ],
    "note": ""
  },
  {
    "id": "gt-17qp73w",
    "name": "ロードクロサイト原石",
    "job": "MIN",
    "level": 100,
    "zone": "コザマル・カ",
    "coords": "X:12.1 Y:17.7",
    "aetheryte": "オック・ハヌ",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.2",
    "subNode": "",
    "items": [
      "ロードクロサイト原石"
    ],
    "note": ""
  },
  {
    "id": "gt-cdzi1b",
    "name": "ローズガーネット原石",
    "job": "MIN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:23.7 Y:27.0",
    "aetheryte": "フーサタイ宿場町",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "ファイアクリスタル",
      "ローズガーネット原石"
    ],
    "note": ""
  },
  {
    "id": "gt-1pamsgz",
    "name": "収集用のﾏｸﾞﾈｼｱ鉱石/ｺﾞｰﾙﾄﾞﾁﾀﾝ鉱",
    "job": "MIN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:9.1 Y:24.6",
    "aetheryte": "シェシェネ青燐泉",
    "spawns": [
      {
        "startET": 8,
        "durationET": 2
      },
      {
        "startET": 20,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のマグネシア鉱石",
      "収集用のゴールドチタン鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1chmhsa",
    "name": "真銀鉱",
    "job": "MIN",
    "level": 100,
    "zone": "シャーローニ荒野",
    "coords": "X:36.9 Y:27.5",
    "aetheryte": "フーサタイ宿場町",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "真銀鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-7ka9mh",
    "name": "ﾌﾙｸﾞﾗｲﾄ/ﾃﾞｻﾞｰﾄﾗﾋﾟｽ原石",
    "job": "MIN",
    "level": 100,
    "zone": "ヘリテージファウンド",
    "coords": "X:14.2 Y:16.8",
    "aetheryte": "アウトスカーツ",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.3",
    "subNode": "",
    "items": [
      "フルグライト",
      "デザートラピス原石"
    ],
    "note": ""
  },
  {
    "id": "gt-e70452",
    "name": "高密度軽銀鉱",
    "job": "MIN",
    "level": 100,
    "zone": "ヘリテージファウンド",
    "coords": "X:23.4 Y:28.5",
    "aetheryte": "エレクトロープ砕石場",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "アースクリスタル",
      "高密度軽銀鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-p25k7q",
    "name": "黒雷岩",
    "job": "MIN",
    "level": 100,
    "zone": "ヘリテージファウンド",
    "coords": "X:24.0 Y:11.5",
    "aetheryte": "アウトスカーツ",
    "spawns": [
      {
        "startET": 20,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "黒雷岩",
      "アースクリスタル"
    ],
    "note": ""
  },
  {
    "id": "gt-j14h6g",
    "name": "収集用の黒鉄鉱/ﾎﾜｲﾄｺﾞｰﾙﾄﾞ鉱",
    "job": "MIN",
    "level": 100,
    "zone": "ヘリテージファウンド",
    "coords": "X:35.6 Y:9.0",
    "aetheryte": "ヤースラニ駅",
    "spawns": [
      {
        "startET": 4,
        "durationET": 2
      },
      {
        "startET": 16,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用のホワイトゴールド鉱",
      "収集用の黒鉄鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-1rcqwax",
    "name": "オクタヘドライト鉱石",
    "job": "MIN",
    "level": 100,
    "zone": "ヤクテル樹海",
    "coords": "X:17.7 Y:36.7",
    "aetheryte": "マムーク",
    "spawns": [
      {
        "startET": 10,
        "durationET": 2
      },
      {
        "startET": 22,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.2",
    "subNode": "",
    "items": [
      "オクタヘドライト鉱石"
    ],
    "note": ""
  },
  {
    "id": "gt-15ns5t5",
    "name": "ｱﾚｸｻﾝﾄﾞﾘｱﾝ鉱/混鉄鉱",
    "job": "MIN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:9.3 Y:15.2",
    "aetheryte": "レイノード・ウィンド",
    "spawns": [
      {
        "startET": 6,
        "durationET": 2
      },
      {
        "startET": 18,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.1",
    "subNode": "",
    "items": [
      "混鉄鉱",
      "アレクサンドリアン鉱"
    ],
    "note": ""
  },
  {
    "id": "gt-aovqhj",
    "name": "ガーデン・ソフトウォーター",
    "job": "MIN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:8.6 Y:13.8",
    "aetheryte": "レイノード・ウィンド",
    "spawns": [
      {
        "startET": 2,
        "durationET": 2
      },
      {
        "startET": 14,
        "durationET": 2
      }
    ],
    "ptype": "伝説",
    "patch": "7.4",
    "subNode": "",
    "items": [
      "ガーデン・ソフトウォーター",
      "ライトニングクリスタル"
    ],
    "note": ""
  },
  {
    "id": "gt-p9v1qn",
    "name": "収集用の火山灰土",
    "job": "MIN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:25.1 Y:17.1",
    "aetheryte": "レイノード・ファイア",
    "spawns": [
      {
        "startET": 0,
        "durationET": 2
      },
      {
        "startET": 12,
        "durationET": 2
      }
    ],
    "ptype": "未知",
    "patch": "7.0",
    "subNode": "",
    "items": [
      "収集用の火山灰土"
    ],
    "note": ""
  },
  {
    "id": "gt-rtm40i",
    "name": "陽風岩/ﾗｲﾄﾆﾝｸﾞｸｫｰﾂ",
    "job": "MIN",
    "level": 100,
    "zone": "リビング・メモリー",
    "coords": "X:10.5 Y:11.0",
    "aetheryte": "レイノード・ウィンド",
    "spawns": [
      {
        "startET": 0,
        "durationET": 4
      }
    ],
    "ptype": "刻限",
    "patch": "7.3",
    "subNode": "",
    "items": [
      "陽風岩",
      "ライトニングクリスタル",
      "ライトニングクォーツ"
    ],
    "note": ""
  }
];
