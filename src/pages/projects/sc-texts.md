---
layout: ../../layouts/ProjectLayout.astro
title: 🛡️情報処理安全確保支援士 科目Bテキスト
description: 正常処理・検証・攻撃・証拠・復旧から学ぶ情報処理安全確保支援士の科目Bテキスト。認証・通信・インシデント・管理の詳説、独自演習13題、記述70問の索引付き。
tags: ["SC"]
timestamp: 2025-08-04T12:41:00+00:00
featured: false
filename: sc-texts
---

[本として読む →](/sc/)

## 目次

| 章 | 内容 |
|---|---|
| 1 | [学習ガイドと2026年度の対策](/blog/sc_1)：試験の形、新形式5回20問、知識体系と学習順序 |
| 2 | [WebアプリとAPIの脆弱性](/blog/sc_2)：認可不備、インジェクション、XSS・CSRF・CSP、SSRF、JWT |
| 3 | [認証・ID・鍵管理](/blog/sc_3)：パスキー、OAuth・OIDC、SAML、証明書、鍵管理 |
| 4 | [ネットワークと通信](/blog/sc_4)：FWのルール、DNS、VPNとZTNA、TLS、メール認証 |
| 5 | [インシデント対応とログ調査](/blog/sc_5)：ランサムウェア、ログの突合せ、封じ込め |
| 6 | [脆弱性管理・委託先・事業継続](/blog/sc_6)：SBOM・CVSS・EPSS・KEV、CI/CD、BCP |
| 7 | [暗号・クラウド・法律と基礎知識](/blog/sc_7)：暗号の使い分け、IAM、個人情報保護法、科目A |
| 8 | [演習と記述答案](/blog/sc_8)：独自演習13題と詳解、根拠から答案を作る手順、記述70問の一覧 |

## 出典

- [IPA 過去問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html)：2018〜2025年度の問題冊子・解答例・採点講評。2020年度は10月試験のみ。
- [IPA 2026年度の実施期間](https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html)：CBTの日程と申込み。2026年度の試験問題は公開されない。
- [記述70問の一覧（CSV）](/sc/past-exam-map.csv)、[参照した公式資料135点（CSV）](/sc/source-manifest.csv)。

今回の詳説に用いた一次資料は、各章の該当箇所にリンクした。主なものは次のとおり。

- [W3C WebAuthn](https://www.w3.org/TR/webauthn-3/)、[OAuth Security BCP（RFC 9700）](https://www.rfc-editor.org/rfc/rfc9700.html)、[OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html)。
- [OASIS SAML Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf)、[SAML Security and Privacy Considerations](https://docs.oasis-open.org/security/saml/v2.0/saml-sec-consider-2.0-os.pdf)。
- [DNSSEC（RFC 4033）](https://www.rfc-editor.org/rfc/rfc4033.html)、[TLS 1.3（RFC 8446）](https://www.rfc-editor.org/rfc/rfc8446.html)、[DMARC（RFC 7489）](https://www.rfc-editor.org/rfc/rfc7489.html)、[MTA-STS（RFC 8461）](https://www.rfc-editor.org/rfc/rfc8461.html)。
- [FIRST CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document)、[EPSS FAQ](https://www.first.org/epss/faq)、[NIST SP 800-61 Rev.3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)。
- [個人情報保護委員会の漏えい等対応](https://www.ppc.go.jp/personalinfo/legal/leakAction/)、[通則編](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)。クラウド等の仕様は第7章に公式文書のリンクを置いた。

分析、優先順位、演習は筆者が作成したもので、IPAの公式な解説や採点基準ではない。今回の改訂に使った試験案内・仕様・法令資料は2026年11月6日に確認した。既存の過去問資料の取得記録は上記CSVのchecked_onに記載している。過去問は出題当時の制度と本文の前提で解き、現在の制度との差を区別する。
