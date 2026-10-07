# Uchinoko Match UI v11

今回の調整版です。

## v11 の主な変更
- 各画面の主要要素を **1つの白い角丸カード** の中に統合
- 黒背景 + 白カードの基本トーンは維持
- スタート画面の総柄画像を、同じ角丸カードの上部に内包
- 質問画面もブランド表示と設問を1カードに統合
- 結果画面の主要セクションを1カードに統合
- 結果画面の並びを以下へ変更
  1. 結果導入文
  2. 1位キャラ画像
  3. キャラ名（ふりがな）
  4. セリフ
  5. キャラ説明
  6. 相性スコア
  7. 2位・3位
  8. シェアボタン
  9. もう一度診断するボタン
  10. 選んだ選択肢（折りたたみ）
  11. 診断分析
- 既存のキャラ画像、キャラ色、比較グラフ、6人切替、v1共有URL互換は維持

## 公開方法
このフォルダの中身を GitHub リポジトリ直下へ上書きし、Cloudflare Pages の既存設定でデプロイしてください。


## v11 changes
- Share text always includes the canonical result URL, including when testing from a local file.
- Enlarged gray helper/description text on the result screen to about 15px.
- Enlarged gray labels and notes inside the comparison breakdown to 12px.


- Google Sheets「画面文言」の最新表示文言（次点の好相性キャラ／診断分析／比較凡例の{name}など）を反映。
- 結果画面に「選んだ選択肢」を折りたたみ表示し、Q./A.形式で全8問を振り返れます。


## v13 OGP
- `assets/ogp.png` (1200×630) を追加
- Open Graph / X Card メタタグを `index.html` に追加
- SNSへURLを貼ったときに共通サムネイルが表示される構成

## v14 changes
- マリの1位結果名にはふりがなを表示しません。
- 1位の結果画像を140pxに縮小しました。
- 1位のキャラ名と相性スコアも少し小さく調整しました。
