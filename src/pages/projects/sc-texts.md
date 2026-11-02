---
layout: ../../layouts/ProjectLayout.astro
title: 🛡️情報処理安全確保支援士 科目Bテキスト
description: 2018〜2025年度の記述70問と採点講評を読んで分野ごとにまとめ直した、情報処理安全確保支援士試験の科目B向けテキスト。2026年度の出題予想付き。
tags: ["SC"]
timestamp: 2025-08-04T12:41:00+00:00
featured: false
filename: sc-texts
---

[本として読む →](/sc/)

## 目次

| 章 | 内容 |
|---|---|
| 1 | [学習ガイドと2026年度の出題予想](/blog/sc_1)：試験の形、新形式6回24問の中身、予想 |
| 2 | [WebアプリとAPIの脆弱性](/blog/sc_2)：認可不備、インジェクション、XSS・CSRF・CSP、SSRF、JWT |
| 3 | [認証・ID・鍵管理](/blog/sc_3)：パスキー、OAuth・OIDC、SAML、証明書、鍵管理 |
| 4 | [ネットワークと通信](/blog/sc_4)：FWのルール、DNS、VPNとZTNA、TLS、メール認証 |
| 5 | [インシデント対応とログ調査](/blog/sc_5)：ランサムウェア、ログの突合せ、封じ込め |
| 6 | [脆弱性管理・委託先・事業継続](/blog/sc_6)：SBOM・CVSS・EPSS・KEV、CI/CD、BCP |
| 7 | [暗号・クラウド・法律と基礎知識](/blog/sc_7)：暗号の使い分け、IAM、個人情報保護法、科目A |
| 8 | [演習と記述答案](/blog/sc_8)：独自演習9題、講評から作った答案の直し方、記述70問の一覧 |

## 出典

- [IPA 過去問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html)：2018〜2025年度の問題冊子・解答例・採点講評。2020年度は10月試験のみ。
- [IPA 2026年度の実施期間](https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html)：CBTの日程と申込み。2026年度の試験問題は公開されない。
- [記述70問の一覧（CSV）](/sc/past-exam-map.csv)、[参照した公式資料135点（CSV）](/sc/source-manifest.csv)。

分析、出題予想、演習は筆者が作ったもので、IPAの公式な解説や採点基準ではない。法令やサービスの仕様は2026年11月2日時点で確認した。過去問は出題当時の制度で作られているので、現在の制度と違う場合がある。
