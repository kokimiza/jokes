---
layout: ../../layouts/BookLayout.astro
title: 複合シナリオ演習と記述答案
description: 過去8年度の採点講評を踏まえた記述の型、根拠と解答要素付きの独自演習7題、記述70大問すべての学習対応表。
tags: ["SC", "科目B", "演習"]
time: 55
featured: false
timestamp: 2025-08-04T13:22:00+00:00
filename: sc_8
---

## この章の使い方

科目Bの大問は、1つのテーマだけで完結しない。ここでは、複数の章の知識を組み合わせる独自演習7題で、**問題文から根拠を探し、設問の指定に沿って答える** 練習をする。最後に、2018〜2025年度の記述70大問すべてへの対応表を示す。

各シナリオは、まず設問だけを見て自分で答案を書き、その後で解答例と見比べること。

> 模擬シナリオは学習用に作成したもので、実際の出題とは関係ない。

---

## 1. 記述答案の型

### 1.1 設問の種類ごとの型

| 設問の形 | 型 | 例 |
|---|---|---|
| 「〜の理由を述べよ」 | 〜だから（原因）、〜となるため（結果） | 「VPN接続後の通信先を制限していないので、侵害された端末から全サーバに到達できるから」 |
| 「〜の問題点を述べよ」 | 〜していないので、〜される | 「注文の所有者を検証していないので、他人の注文を閲覧される」 |
| 「〜の対策を述べよ」 | **どこで** **何を** **どうする** | 「APIサーバで、注文の利用者IDとセッションの利用者IDの一致を確認する」 |
| 「〜によって防げる攻撃は」 | 攻撃名＋成立を妨げる理由 | 「認可コードの横取り。横取りしてもcode_verifierがないとトークンを取得できない」 |
| 「〜は何か、本文中の字句で答えよ」 | 問題文の用語をそのまま使う | |

### 1.2 減点されにくい書き方

- **問題文の用語を使う**。「AサーバとBサーバ」のように問題文の名称で書く。一般論の用語に言い換えると、採点者が対応を判断できない。
- **主語と対象を明確にする**。「検証する」ではなく「RPが、IDトークンのaudを自身のクライアントIDと照合する」。API向けアクセストークンとは区別する。
- **根拠は問題文から探す**。科目Bの解答の手掛かりは、ほとんどが問題文の中にある。表の注記や、さりげない一文（「〜は暫定的に許可している」）に注目する。
- **指定を満たす**。字数指定があれば守り、なければ必要な要素を簡潔に書く。「字数の8割を埋める」ことを目的にしない。
- **要求された個数と範囲で答える**。「二つ」と指定されたら二つ書く。「すべて」と指定されたら網羅する。無関係な候補を追加しない。

### 1.3 時間配分（150分・2問）

| 時間 | 作業 |
|---|---|
| 0〜10分 | 4問の設問に目を通し、2問を選ぶ（[sc_1](/blog/sc_1)） |
| 10〜75分 | 1問目 |
| 75〜140分 | 2問目 |
| 140〜150分 | 見直し（問題選択、空欄、設問の指定、本文の用語との一致） |

1問の中では、**問題文を読む前に設問を先に読む**。何を探しながら読めばよいかが分かる。

---

## 2. シナリオA：VPN装置を経由した社内侵害

**関連**：[sc_4](/blog/sc_4) ネットワーク、[sc_5](/blog/sc_5) インシデント対応、[sc_6](/blog/sc_6) BCP

### 状況

製造業のX社。社外から社内に接続するため、DMZにSSL-VPN装置を設置している。VPNの認証はID・パスワードのみ。VPNの利用者には 10.10.100.0/24 のアドレスが割り当てられる。FWでは「10.10.100.0/24 → 社内全セグメント：全サービス許可」の設定になっている。

ある日、EDRがファイルサーバFS01でランサムウェアの暗号化の挙動を検知した。ログは次のとおり。

```
02:10  VPN   user=sato  接続元=203.0.113.50（国外）  割当=10.10.100.23
02:14  PC-K  4624 種別3  user=sato  src=10.10.100.23
02:20  PC-K  Sysmon 10  対象=lsass.exe  元=不明な実行ファイル
02:41  DC01  4624 種別3  user=adm-it  src=10.1.20.15（PC-K）
02:55  FS01  4624 種別3  user=adm-it  src=10.1.20.15
02:56  FS01  7045  サービスのインストール  パス=C:\Windows\Temp\svc.exe
03:30  FS01  EDR  大量のファイル書換え・拡張子の変更
```

satoは普段、国内から業務時間内にのみVPNを利用している。VPN装置には、認証を回避できる脆弱性の情報が1か月前に公開されていた。

### 設問と解答例

**設問1**：攻撃者がFS01に到達するまでの経路を説明せよ。

> satoとしてVPN接続したアドレスからPC-Kへログオンし、その後PC-Kを送信元としてadm-itでDC01とFS01へログオンした。LSASSへのアクセスから、PC-Kで資格情報を窃取して横展開した可能性がある。

記録が示す接続・ログオンと、資格情報の窃取という仮説を分ける。VPNの脆弱性情報だけでは、認証回避で侵入したのか、盗んだ資格情報を使ったのかは確定しない。

**設問2**：ただちに隔離すべき端末と、無効化すべきアカウントを挙げよ。

> 端末：FS01、PC-K。DC01もadm-itがログオンしているため調査対象とする。アカウント：sato、adm-it。

ポイント：暗号化が起きたFS01だけでなく、**横展開元と疑われるPC-K** と、**不審なログオン先** に調査を広げる。アカウント名だけではドメイン管理者権限は確認できない。DC01の切離しやKRBTGTの更新は、侵害範囲・権限・業務影響を確認して判断する。

**設問3**：FWの設定の問題点と改善策を述べよ。

> VPNの利用者に社内の全セグメント・全サービスを許可しているので、侵害された端末から任意のサーバに到達できる。業務に必要なサーバとサービスだけを許可する。

**設問4**：VPNに関する再発防止策を2つ述べよ。

> ①VPN装置の脆弱性情報を収集し、公開された脆弱性のパッチを速やかに適用する。②VPNの認証にMFAを導入する。

（他に：国外からの接続の制限、通常と異なる接続元・時間帯の接続の検知）

**設問5**：生産管理システムの復旧の順序を決めるために、事前に行っておくべき分析は何か。

> BIA。業務ごとの停止の影響と許容停止時間を分析し、RTO・RPOと復旧の優先順位を決めておく。

---

## 3. シナリオB：会員向けWeb API

**関連**：[sc_2](/blog/sc_2) Web、[sc_3](/blog/sc_3) 認証

### 状況

Y社の会員サイトでは、SPAからAPIを呼び出す。ログインにはOIDCを使い、IdPから受け取ったIDトークンをAPIサーバに送って会員を識別している。会員情報の取得APIは次のとおり。

```
GET /api/members/{member_id}
Authorization: Bearer <IDトークン>
```

APIサーバは、IDトークンの署名と有効期限を検証した後、`member_id` に対応する会員情報を返す。

### 設問と解答例

**設問1**：このAPIの脆弱性と、それを悪用した攻撃を述べよ。

> member_idの会員とIDトークンの会員が一致するかを検証していないので、member_idを変更すると他の会員の情報を取得される。

**設問2**：IDトークンの検証で、署名と有効期限の他に検証すべき項目を1つ挙げ、検証しない場合のリスクを述べよ。

> aud。検証しないと、同じIdPが別のサービス向けに発行したIDトークンを流用される。

**設問3**：APIの呼出しにIDトークンを使っていることの問題点を述べよ。

> IDトークンはクライアントに会員を伝えるためのものであり、APIへのアクセスの認可にはアクセストークンを使うべきである。

**設問4**：WAFを導入すれば設問1の脆弱性に対処できるという意見について、意見の誤りを述べよ。

> 攻撃のリクエストは正規の形式で、member_idの値が違うだけなので、WAFのシグネチャでは正常なリクエストと区別できない。

---

## 4. シナリオC：CIサービスの侵害

**関連**：[sc_6](/blog/sc_6) サプライチェーン、[sc_7](/blog/sc_7) クラウド

### 状況

Z社は外部のCIサービスでアプリケーションをビルドし、クラウドの本番環境にデプロイしている。CIには、クラウドの管理者権限を持つ長期間有効なアクセスキーと、配布物のコード署名鍵を登録している。CIサービスの事業者から、一定期間、利用者の登録したSecretsが外部に漏えいした可能性があると公表された。

### 設問と解答例

**設問1**：Z社がただちに行うべき対応を2つ述べよ。

> ①アクセスキーを無効化し、署名鍵の利用を停止して鍵を更新する。署名証明書の失効と配布先への影響も確認する。②漏えいの可能性がある期間のキー利用を、クラウドの監査ログで調査する。

**設問2**：コード署名鍵が漏えいした場合に想定される被害を述べよ。

> 攻撃者が不正なプログラムにZ社の正規の署名を付けて配布でき、利用者がZ社の製品として実行してしまう。

**設問3**：今後、CIに長期間有効なアクセスキーを登録しないための方法を述べよ。

> CIとクラウドをOIDCで連携し、ジョブの実行時だけ有効な一時的な認証情報を取得する。権限はデプロイに必要な範囲に限定する。

**設問4**：コード署名鍵の保管方法の改善策を述べよ。

> 署名鍵をHSMやクラウドのKMSに保管し、CIからは署名の操作だけを依頼する。鍵そのものはCIに置かない。

---

## 5. シナリオD：メールドメインの移行

**関連**：[sc_4](/blog/sc_4) メール

### 状況

W社は社名の変更に伴い、メールのドメインを `old.example` から `new.example` に移行する。新ドメインのSPFレコードは設定済み。メールマガジンは外部の配信サービスから `new.example` を送信者として配信する予定である。

### 設問と解答例

**設問1**：メールマガジンがDMARCの認証に成功するために必要な設定を述べよ。

> 配信サービスでnew.exampleのドメインのDKIM署名を付け、その公開鍵をnew.exampleのDNSに登録する。または、エンベロープFromをnew.exampleにして、配信サービスの送信元をSPFに追加する。

**設問2**：DMARCのポリシーを最初から `p=reject` にしないのはなぜか。

> 設定漏れのある正規の送信経路のメールが受信拒否されるおそれがあるので、まずp=noneでレポートを受け取り、認証の状況を確認するため。

**設問3**：移行後、旧ドメインの扱いで注意すべき点を述べよ。

> 旧ドメインの登録を維持し、第三者による再取得を防ぐ。旧ドメインからの正規送信がすべて終了した後は、SPF（v=spf1 -all）とDMARC（p=reject）を設定する。

転送・旧システム等の正規送信が残っている移行期間に、一律で `-all` を設定しない。

---

## 6. 総仕上げのチェックリスト

試験の直前に、次の問いに即答できるか確認する。

**Web（[sc_2](/blog/sc_2)）**
- IDORの根本対策を一文で言えるか
- CSPが効かなくなる条件を3つ言えるか
- SameSite属性がCSRFを防ぐ理由を説明できるか

**認証（[sc_3](/blog/sc_3)）**
- FIDO2がフィッシングに強い理由を2つ言えるか
- state、nonce、PKCEがそれぞれ何を防ぐか言えるか
- IdPの署名鍵が漏えいした場合の影響範囲を説明できるか

**ネットワーク（[sc_4](/blog/sc_4)）**
- DNSSECとDoHの守るものの違いを言えるか
- 通信要件からFWのルールを書けるか（装置自身の通信を含めて）
- DMARCのアライメントを説明できるか

**インシデント対応（[sc_5](/blog/sc_5)）**
- 4624の種別3と10の違いを言えるか
- 電源を切らずにネットワークから隔離する理由を言えるか
- 隔離の対象を、侵害されたアカウントの観点から広げられるか

**サプライチェーン・BCP（[sc_6](/blog/sc_6)）**
- RTOとRPOの違いを例で説明できるか
- ランサムウェアに耐えるバックアップの要件を3つ言えるか
- 復旧の前に侵入経路を塞ぐ理由を言えるか

**横断（[sc_7](/blog/sc_7)）**
- HMACと署名の違いを言えるか
- 個人情報保護法で報告が必要になる4つの場合を言えるか

---

## 7. 自己点検：解答例の言い回しより、根拠と要素

以下は本書の学習用の点検項目であり、IPAの非公開の採点基準や部分点を推定したものではない。

| 演習 | 答案に必要な要素 | 避ける誤答 |
|---|---|---|
| A-1 | VPN割当アドレス→PC-K→DC01・FS01、事実と仮説の区別 | 脆弱性が公表済みというだけで侵入方法を断定 |
| A-2 | PC-K・FS01、sato・adm-it、DC01等への調査拡大 | FS01だけを調べる／アカウント名だけで全AD侵害と断定 |
| A-3・4 | 到達先とサービスの限定、パッチと認証強化の役割 | MFAだけでVPNの認証回避脆弱性も塞げるとする |
| B-1・2 | 対象会員と検証済み主体の照合、宛先の検証 | 署名検証済みだから全会員を参照できてよいとする |
| B-3・4 | IDトークンとアクセストークンの受け手、WAFの限界 | WAFで業務上の所有関係も必ず判定できるとする |
| C-1・2 | キー無効化・更新、利用履歴調査、署名偽造の影響 | CIのパスワード変更だけで、流出したキーも無効になるとする |
| C-3・4 | 一時資格情報の発行条件・最小権限、鍵本体を出さない署名 | 一時資格情報やHSMなら不正なジョブから使われても安全とする |
| D-1 | SPFまたはDKIMの成功とヘッダーFromとの整合 | 両方の成功が必須とする／SPFのpassだけで判定 |
| D-2・3 | 正規経路の確認、旧ドメインの維持、送信終了後の設定 | 移行期間中の正規送信を無視して拒否設定を入れる |

**講評を使った改善の練習**：2025年春午後問1設問4ではSBOMの定義だけを書いた解答、同年秋午後問1設問4では開発プロセスへの問いに運用対策を書いた解答が指摘された。自分の答案にも、「聞かれた利点・工程・目的」に直接答えていない箇所がないか確認する。

## 8. シナリオE：SQLは安全なのに他人の注文が表示される

**目安15分。独自問題。** 関連：[sc_2 第11節](/blog/sc_2)、[2023年春午後Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/2023r05.html)。

会員向けシステムでは、複数のHTTP要求を同じハンドラーで並行処理する。`orders` は注文番号・顧客ID・金額を持ち、利用者は自社の注文だけ閲覧できる。`currentCustomerId` はサーバで検証したセッションの顧客IDである。

```java
class OrderHandler {
    private static String orderNo;
    Order find(Request req, String currentCustomerId) {
        orderNo = req.getParameter("orderNo");
        return query("SELECT * FROM orders WHERE order_no = ?", orderNo);
    }
}
```

`query` は値を正しくバインドする。ある利用者が自分の注文番号を指定しても、まれに別の注文が表示された。また、他社の注文番号を直接指定した場合にも、注文を取得できた。

1. まれに別の注文が表示される原因を、二つの要求の実行順序から説明せよ。
2. SQLインジェクション対策とは別に必要な認可の修正を述べよ。
3. 二つの修正を確認するテストを、それぞれ一つ挙げよ。

<details>
<summary>解答例・根拠・確認要素</summary>

1. Aの要求が共有変数に注文Aの番号を入れた後、Bの要求が注文Bの番号で上書きし、Aがその値を検索に使う。要求ごとの注文番号をローカル変数として保持する。
2. `WHERE order_no = ? AND customer_id = ?` とし、二つ目の値には `currentCustomerId` を使う。リクエストから任意の顧客IDを受け取って照合を済ませない。
3. 異なる利用者の要求を並行実行して結果の混在がないこと、別顧客の注文番号への要求が拒否されることを確認する。

**根拠**：共有される `static` 変数、並行処理、顧客IDが検索条件にないこと。**必要要素**：上書きの順序、ローカル化、検証済み顧客IDによる限定、並行性と認可それぞれのテスト。

「プレースホルダーを使う」だけでは修正にならない。既に使っているためである。「IDを推測不能にする」も認可検証の代わりにはならない。

</details>

## 9. シナリオF：同一サイトのファイルでCSPを回避される

**目安15分。独自問題。** 関連：[sc_2](/blog/sc_2)、[sc_6](/blog/sc_6)、[2025年秋午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/2025r07.html)。

掲示板サイト `https://portal.example` は `script-src 'self'` を設定している。添付ファイルは拡張子 `.txt` だけ許可し、`/files/` 以下に保存する。保存したファイルは `Content-Type: application/javascript` で配信され、同じサイト内のページから読み込める。投稿本文はHTMLとしてそのまま保存・出力する。管理者が投稿を読むと、そのページからロール変更APIも実行できる。

1. 攻撃が成立する流れを、投稿と添付ファイルを結び付けて述べよ。
2. 根本対策と追加の防御を、それぞれ一つ挙げよ。
3. 再発防止のため開発工程に追加する検証を述べよ。

<details>
<summary>解答例・根拠・確認要素</summary>

1. 攻撃者がスクリプトを `.txt` として添付し、そのパスを `src` に指定するscript要素を投稿へ混入させる。同一サイトのスクリプトなのでCSPで許可され、管理者の閲覧時にロール変更APIを実行できる。
2. 投稿の出力時にHTML文脈のエスケープを行う。加えて添付の実体・配信形式を適切に検査・制御し、実行可能なスクリプトとして読み込ませない。拡張子の検査だけでは不十分。
3. 管理者が閲覧する画面まで含め、投稿・添付・ロール変更の仕様を理解したレビューと手動診断を行い、修正後に同じ経路で再テストする。

**根拠**：`'self'`、添付の配信形式、未エスケープの出力、管理者の権限。**必要要素**：保存したファイルの読込み、閲覧者の権限で起こる操作、出力処理の修正、工程としての検証。

「HttpOnlyを付ける」だけでは、管理者のブラウザーによる操作を止められない。「WAFを導入する」だけでは、開発工程の検証を問う3に答えていない。

</details>

## 10. シナリオG：工場を4時間で復旧できるか

**目安15分。独自問題。** 関連：[sc_5](/blog/sc_5)、[sc_6](/blog/sc_6)、[2025年秋午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/2025r07.html)。

工場のSCADAと事務PCは同じLANにある。SCADAの設定・加工用プログラムは毎日0時にバックアップし、管理IDは通常のAD管理者と共通である。目標はRTO 4時間、RPO 1時間。復元テストはしていない。10時に事務PCがマルウェアに感染し、大量の通信によって制御通信が妨害された。調査時点ではSCADA内のデータ改ざんは確認されていない。

1. 確認済みの被害に対して必要な封じ込めの方向を述べよ。
2. 現在のバックアップ運用でRPOを満たせるか。根拠を述べよ。
3. RTOを実証し、バックアップを守るための平常時の改善を二つ述べよ。

<details>
<summary>解答例・根拠・確認要素</summary>

1. 制御に必要な通信を維持しながら感染PCの通信を遮断し、事務系から制御系への不要な通信を制限する。安全・操業への影響を確認し、必要なら事前に用意した独立LAN等へ切り替える。
2. 0時以降の更新を復元するログ等がなく、それ以外のバックアップもないなら、最大10時間分を失い得るのでRPO 1時間を満たせない。単に「毎日取得しているから十分」としない。
3. ①再構築・復元・動作確認を含む手順を整備し、訓練で4時間以内に再開できるか測定する。②バックアップの管理資格情報を分離し、オフラインや変更・削除できない保存先と必要な世代を用意する。

**根拠**：確認されたのは通信妨害、バックアップは0時のみ、共通管理ID、未実施の復元テスト。**必要要素**：実際の攻撃に効く通信制御、時点差の評価、復旧時間の実測、削除権限の分離。

RTOとRPOは別の目標。「MFA導入」だけでは迅速な復元の準備にならず、「SCADAをすぐ初期化する」は、この段階の証拠や操業条件を考慮していない。

</details>

## 11. 講評から作った答案改善表

出典：IPAの各年度の採点講評。指摘を本書の学習課題として要約した。

| 実問・設問 | 失点につながった点 | 本書での直し方 |
|---|---|---|
| 2018秋 午後Ⅰ問2 設問2(2) | 監視位置では取得できない通信を見落とす | [sc_4](/blog/sc_4)で経路と観測範囲を書く |
| 2019春 午後Ⅰ問2 設問2(3) | 秘密鍵が盗まれないことだけで中継攻撃への耐性を説明 | [sc_3](/blog/sc_3)で署名対象と検証を確認 |
| 2020年10月 午後Ⅰ問3 設問1(3) | 想定攻撃者と異なる管理LANから診断 | [sc_2](/blog/sc_2)で診断の目的と接続位置を対応 |
| 2021春 午後Ⅰ問3 設問4(2) | EDRの名前だけで具体的な使い方を書かない | [sc_5](/blog/sc_5)で記録・条件・処置を書く |
| 2022春 午後Ⅰ問1 設問2(3) | `Statement` と `PreparedStatement` の混同 | [sc_2](/blog/sc_2)のコードを読んで使い分ける |
| 2023春 午後Ⅱ問1 設問2(2)・(3) | 入力画面と出力画面の違いを診断に反映しない | [sc_2](/blog/sc_2)で画面遷移を含めて観測 |
| 2023秋 午後問4 設問2 | 被害を評価できる具体性や、脅威主体の条件が不足 | [sc_6](/blog/sc_6)で攻撃シナリオを一文にする |
| 2024秋 午後問1 設問1(8) | どのログを確認するかが不明 | [sc_5](/blog/sc_5)で対象・記録・条件を組にする |
| 2025春 午後問1 設問4 | 利用の利点を問われてSBOMの定義だけを書く | [sc_6](/blog/sc_6)で照合対象と得られる判断を書く |
| 2025秋 午後問4 設問4 | 復旧の準備を問われて攻撃阻止の手段を書く | シナリオGで、媒体・ソフト・手順を対応させる |


## 12. 2018〜2025年度・記述70大問の全対応表

出典：IPA「情報処理安全確保支援士試験」の各問題冊子・解答例・採点講評。各行は大問単位の筆者による要約で、公式の問題名・解説・採点基準ではない。「Ⅰ・Ⅱ」は旧午後Ⅰ・Ⅱを指す。問番号のリンクは公式問題PDF、解答・講評のリンクは同じ冊子全体を開く。

対応章を読んでから実問を解き、着眼点に対応する根拠を本文から示す。全件の解答・講評のURLと注意点は[CSV](/sc/past-exam-map.csv)からも参照できる。


### 2018年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | **Use-After-Freeとメモリ保護**。解放後の参照とバイト順を追う。 | [7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | **サーバ・FWの設定強化**。メール経路と更新用の通信を列挙。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | **ネットワーク分離の設計**。分離後の感染・認証情報漏えいを評価。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_qs.pdf) | **セキュリティ対策の評価**。DOM型XSS・DB移設・情報保護方式を比較。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_qs.pdf) | **Webのガイドラインと診断内製化**。画面遷移・SQL・認可の診断を設計。 | [2](/blog/sc_2)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | **メモリ破壊攻撃と対策技術**。保護技術の適用条件をコードで確認。 | [7](/blog/sc_7) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | **ワーム感染の調査と分離**。ミラー・DHCP・無線ログを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | **ソフトウェアの脆弱性対策**。侵害調査・CVSS・WAF構成を検討。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_qs.pdf) | **クラウド環境のセキュリティ**。要件・SSO・運用管理の分担を比較。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_qs.pdf) | **対応準備とインシデント調査**。時刻・タイムライン・切離しを検討。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

公式の照合先：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_cmnt.pdf)。


### 2019年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | **Webサイト間の情報連携**。SOP・JSONP・CORSを比較。 | [2](/blog/sc_2) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | **クラウドサービスの認証強化**。中継攻撃と署名対象を追う。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | **IoT機器の認証連携・改ざん防止**。MAC・署名・TPMの役割を整理。 | [3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_qs.pdf) | **無線LAN経由の感染と調査**。証拠保全・TLS復号・無線の保護範囲を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[7](/blog/sc_7) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_qs.pdf) | **情報漏えい調査とサーバ対策**。DHCP・通信・ヒアリングを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | **電子メールの送信ドメイン認証**。SPF・DKIM・DMARCの対象を判定。 | [4](/blog/sc_4) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | **脅威インテリジェンスとC2対策**。正規実行ファイル・DNS経路を検討。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | **標的型攻撃とEDRによる対応**。未接続端末の状態と対処を判断。 | [5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_qs.pdf) | **マルウェアと開発・運用プロセス**。外向き通信・変更手順・検証を対応。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_qs.pdf) | **OTとITが混在する工場**。保守・媒体・分離・脆弱性評価を設計。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6) |

公式の照合先：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_cmnt.pdf)。


### 2020年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [10月 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | **スマートフォン決済アプリ**。メッセージ認証と会員の列挙対策を考える。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [10月 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | **S/MIMEのメールシステム設計**。暗号化・署名・失効確認を対応。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [10月 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | **ECサイトの脆弱性診断計画**。診断位置・業務影響・防御装置を確認。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[6](/blog/sc_6) |
| [10月 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_qs.pdf) | **合併後のWebサイト統合**。FW・アカウント連携・Javaをレビュー。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [10月 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_qs.pdf) | **マルチクラウドのテレワーク**。OTP・認可コード・端末の権限を追う。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |

公式の照合先：10月 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_cmnt.pdf)／10月 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_cmnt.pdf)。


### 2021年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | **OAuthを使う認証システム開発**。アカウントとコードの関連付けを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | **DNSのセキュリティ対策**。権威・キャッシュ・ゾーン転送を設計。 | [4](/blog/sc_4) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | **パッチ配信とセキュリティ運用**。検証・WoL・EDRの具体的な利用を考える。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_qs.pdf) | **インシデント対応体制の整備**。委託関係・FW・脆弱性評価を整理。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_qs.pdf) | **クラウド利用のIT統制**。DHCP・802.1X・IDaaS・端末鍵を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | **リモート保守のインシデント対応**。SSHホスト鍵・利用者認証・接続元を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | **設計文書の管理とIRM**。保護方式・権限・パスワード攻撃を評価。 | [3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | **PC感染後の通信・実行制御**。ログ・FW・許可ファイルの悪用を追う。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_qs.pdf) | **CSPとSaaS移行・FIDO認証**。出力処理・スクリプト・認証器運用を確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_qs.pdf) | **テレワークと他社を含む感染対応**。感染範囲・調査条件・対処優先度を整理。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

公式の照合先：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_cmnt.pdf)。


### 2022年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | **情報共有Webアプリの開発**。Java・SQL・プロジェクト認可を修正。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | **NAS・ルータの侵害と対策**。URL正規化・sudo・アクセスログを確認。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | **QRコード決済と本人確認**。公的個人認証・撮影・当人認証を整理。 | [3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_qs.pdf) | **Web脆弱性と開発プロセス**。XSS・CSRF・SSRF・診断手法を対応。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_qs.pdf) | **クラウド移行と各種認証**。CDN・SAML・OAuth・OIDCを追う。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | **IoT製品の開発と脆弱性**。ファームウェア・証明書・CSRFを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | **ライブラリ脆弱性の侵害対応**。親子プロセスと影響条件を確認。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | **コンテナ・CIのサプライチェーン侵害**。レジストリとビルドの権限・通信を追う。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_qs.pdf) | **脅威情報調査・動的解析・CTF**。安全な転送・ARP・オフライン解析を検討。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_qs.pdf) | **EDRとインシデント対応**。イベント・検知ルール・対応時間を確認。 | [5](/blog/sc_5)・[6](/blog/sc_6) |

公式の照合先：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_cmnt.pdf)。


### 2023年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | **Javaのセキュアプログラミング**。SQL・共有変数・レースコンディションを修正。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | **ライブラリ脆弱性とログ調査**。FTP・接続方向・プロセス・ポートを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | **クラウドプロキシへの移行**。移行前後の経路とルール順を設計。 | [4](/blog/sc_4)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_qs.pdf) | **Webサイトの脆弱性診断**。入力画面から出力画面へ遷移して判定。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_qs.pdf) | **Webのクラウド移行と機能拡張**。権限・OAuth・PKCEを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | **WebのXSS侵害と対応**。HTML・スクリプト・攻撃痕跡を追う。 | [2](/blog/sc_2)・[5](/blog/sc_5) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | **証明書・秘密鍵と無線LANの見直し**。サーバ検証・端末鍵・EAP-TLSを確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | **CIサービスの侵害対応**。コンテナ権限・WebAuthn・HSMを整理。 | [3](/blog/sc_3)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | **個人情報のリスクアセスメント**。内部者による具体的なシナリオを作る。 | [6](/blog/sc_6)・[7](/blog/sc_7) |

公式の照合先：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_cmnt.pdf)。


### 2024年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | **APIの設計と脆弱性対応**。JWTの仕様と欠落した検証を確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | **リモートワークとDDoS対策**。VPN・MFA・しきい値・CDNを検討。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [春 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | **クラウド上のWebサイトへの攻撃**。XSS・CSRF・認証情報取得を関連付ける。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | **Linux権限とJavaの実装**。例外処理とリソース解放を読む。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | **社内システムのログ調査と対処**。複数ログとファイル持出しを分析。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | **メールドメイン移行とDMARC**。SPF・DKIM署名範囲・旧ドメインを確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | **ECサイト改ざんとカード情報漏えい**。DOM改変とURL・アクセスログを追う。 | [2](/blog/sc_2)・[5](/blog/sc_5) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | **Webサイトのセキュリティ診断**。セッション固定化と攻撃の連鎖を考える。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[6](/blog/sc_6) |

公式の照合先：春 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_cmnt.pdf)。


### 2025年度

| 実問 | 題材・着眼点 | 復習する章 |
|---|---|---|
| [春 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | **サプライチェーンと開発プロセス**。委託・SBOM・SAST/DAST/IASTを評価。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | **脆弱性と対応優先度**。CVSSv3・EPSS・仕様上の条件を読む。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | **スマホアプリとクラウドストレージ**。キー・証明書・署名付きURLを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | **公開IT資産とASM**。CNAME・稼働調査・KEVを使う。 | [4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | **CSP・アップロードと権限昇格**。同一サイトでのスクリプト実行経路を追う。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | **暗号資産交換業の鍵管理**。署名・MAC・鍵の暗号化と移送を確認。 | [3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | **インターネットバンキングとVPN**。DNSSEC・DoH・認証・接続前の通信を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | **セキュリティ管理体制とOT復旧**。権限・攻撃シナリオ・備品・手順を対応。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

公式の照合先：春 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_cmnt.pdf)。
