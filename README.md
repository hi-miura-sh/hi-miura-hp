# 三浦秀芳 (Hideyoshi Miura) - Personal Website

岡山大学 工学部 情報・電気・数理データサイエンス系 助教の個人ウェブサイトです。

## 概要

このウェブサイトは、三浦秀芳の研究業績、経歴、研究内容を紹介するための個人ページです。

## 特徴

- **レスポンシブデザイン**: デスクトップ、タブレット、モバイルに対応
- **BibTeX連携**: 論文データをBibTeXファイルから自動読み込み
- **カテゴリ別表示**: 論文誌、国際会議、国内発表、研究助成等に分類
- **DOIリンク**: DOIがある論文は直接リンクでアクセス可能
- **日本語対応**: 日本語著者名の適切な表示

## 技術スタック

- HTML5
- CSS3 (Flexbox, Grid)
- JavaScript (ES6+)
- BibTeX

## ファイル構成

```
├── index.html          # メインページ
├── css/
│   └── styles.css      # スタイルシート
├── js/
│   └── main.js         # JavaScript
├── images/
│   └── miura.jpg       # プロフィール画像
├── publications.bib    # 論文データ（BibTeX形式）
└── README.md           # このファイル
```

## 使用方法

1. ローカルサーバーを起動:
   ```bash
   python3 -m http.server 8000
   ```

2. ブラウザで `http://localhost:8000` にアクセス

## 論文データの更新

`publications.bib` ファイルを編集することで、論文データを更新できます。

### カテゴリ分類

- `category = {journal}` - 論文誌
- `category = {international_reviewed}` - 国際会議（査読有）
- `category = {international_other}` - 国際会議（その他）
- `category = {domestic}` - 国内発表
- `category = {grant}` - 研究助成等

## ライセンス

このプロジェクトは個人使用目的で作成されています。

## 連絡先

- 所属: 岡山大学 工学部 情報・電気・数理データサイエンス系
- 研究室: 医用情報ネットワーク学研究室
