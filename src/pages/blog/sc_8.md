---
layout: ../../layouts/BookLayout.astro
title: 演習と記述答案
description: 根拠から答案を作る手順、SAML・脆弱性管理・ログ・暗号を含む独自演習13題と詳解、採点講評からの改善例、2018〜2025年度の記述70問の一覧。
tags: ["SC", "科目B", "演習"]
time: 100
featured: false
timestamp: 2025-08-04T13:22:00+00:00
filename: sc_8
---

科目Bの大問は一つの分野で閉じていない。この章の演習は、複数の章の知識を組み合わせて解くように作った。解答例は折りたたんであるので、先に自分で答案を書いてから開く。演習はすべて本書で作ったもので、実際の試験問題とは関係がない。この章の演習で論点を一つずつ確かめた後は、大問の形で分野をまたぐ[第9章](/blog/sc_9)の総合演習25題に進む。

各演習では、答案を書く前に「本文の事実」「そこから成立する仕組み」「設問が求める操作」の三列を作る。解答例との文言の一致ではなく、必要な主体・対象・条件・処置が揃っているかで復習する。ここに示す確認要素は学習用であり、IPAの配点や部分点の基準ではない。

## 1. 答案の書き方

### 1.1 設問の形ごとの書き方

| 設問の形 | 書き方 | 例 |
|---|---|---|
| 理由を述べよ | 「〜なので、〜となるから」 | VPN接続後の通信先を制限していないので、侵害された端末から全サーバに届くから |
| 問題点を述べよ | 「〜していないので、〜される」 | 注文の所有者を検証していないので、他人の注文を閲覧される |
| 対策を述べよ | どこで・何を・どうする | APIサーバで、注文の利用者IDとセッションの利用者IDが一致するかを確認する |
| 防げる攻撃は何か | 攻撃名と、成立しなくなる理由 | 認可コードの横取り。横取りしてもcode_verifierがなければトークンを取得できない |
| 本文中の字句で答えよ | 問題文の言葉をそのまま抜き出す | |

### 1.2 点を落とさないために

- 問題文の名称を使う。「Aサーバ」「FW1」と書かれていれば、その名前で書く。一般的な用語に言い換えると、採点者がどれを指すか判断できない。
- 主語と対象を書く。「検証する」ではなく、「RPが、IDトークンのaudを自分のクライアントIDと照合する」。
- 根拠は本文から探す。表の注記や「〜は暫定的に許可している」のような一文に、答えの手掛かりがあることが多い。
- 個数と字数の指定を守る。「二つ」と言われたら二つ書き、関係のない候補を足さない。字数を埋めることを目的にしない。
- 聞かれたことに答える。利点を問われて定義を書く、工程を問われて製品名を書く、という失点が講評で繰り返し指摘されている。

### 1.3 150分の使い方

| 時間 | すること |
|---|---|
| 0〜10分 | 4問の設問を全部見て、2問を選ぶ |
| 10〜75分 | 1問目。本文より先に設問を読み、何を探しながら読むかを決める |
| 75〜140分 | 2問目 |
| 140〜150分 | 空欄、個数と字数の指定、問題文の名称との一致を見直す |

### 1.4 根拠から短い答案へ変える

例えば本文に「APIはログイン済みかだけ確認し、指定された注文番号で検索する」、設問に「他人の注文を閲覧できる原因を述べよ」とあるとする。根拠はログイン確認の存在ではなく、所有者の照合がないことだ。仕組みを説明するメモは「番号を他人のものへ変える → APIは本人の注文かを確認しない → 他人の注文が返る」となる。

これを「APIが注文の所有者とログイン利用者の一致を検証していないため」と答案にする。逆に「セキュリティの確認が不十分だから」は欠けた条件を特定していない。「MFAを導入する」は原因を問われた設問への答えにならない。まず長い説明で因果を確認し、最後に設問に必要な部分だけを残す。

字数を削るときは、「適切に」「厳格に」「セキュリティを強化して」等、処理を特定しない語を落とす。主体・対象・照合条件まで落とすと意味が変わる。対策を二つ求められたとき、同じ対策を「アクセス制限」「最小権限」と言い換えて二つに数えない。

### 1.5 解き直しで修正するもの

| 失点の原因 | 解き直しで行うこと | 完了の確認 |
|---|---|---|
| 仕組みを知らない | 該当章で正常処理と検証位置を描く | 資料なしで攻撃の成立条件も説明できる |
| 本文を読み落とす | 答えの根拠となる行・表・注記を特定する | なぜその記載が必要か説明できる |
| 推測を断定する | 確定事実・仮説・追加調査に分ける | ログにないことを答案へ足していない |
| 問いの種類がずれる | 理由・対策・工程・利点のどれかを明記する | 冒頭の一文が問いに直接答える |
| 対策の効く範囲がずれる | 攻撃のどの段階を止めるか書く | 本文の経路をその対策で遮断できる |

二回目は解答例を思い出して写すのでなく、元の図・設定・ログからもう一度導く。例えば「MFAがあれば解決」と覚えたなら、認証前のVPN脆弱性や、正規利用者権限での持出しに効くかも説明する。誤った一般化を残さないためである。

## 2. 演習A：VPN装置から社内へ

関連：[第4章](/blog/sc_4)、[第5章](/blog/sc_5)、[第6章](/blog/sc_6)。目安20分。

製造業のX社は、DMZにSSL-VPN装置を置いている。VPNの認証はIDとパスワードだけで、利用者には10.10.100.0/24のアドレスが割り当てられる。FWには「10.10.100.0/24 → 社内の全セグメント：全サービス許可」のルールがある。

ある日、ファイルサーバFS01で、EDRがランサムウェアによる暗号化の挙動を検知した。

```
02:10  VPN   user=sato  接続元=203.0.113.50（国外）  割当=10.10.100.23
02:14  PC-K  4624 種別3  user=sato  src=10.10.100.23
02:20  PC-K  Sysmon 10  対象=lsass.exe  元=不明な実行ファイル
02:41  DC01  4624 種別3  user=adm-it  src=10.1.20.15（PC-K）
02:55  FS01  4624 種別3  user=adm-it  src=10.1.20.15
02:56  FS01  7045  サービスのインストール  パス=C:\Windows\Temp\svc.exe
03:30  FS01  EDR  大量のファイル書換え・拡張子の変更
```

satoは普段、国内から業務時間内にだけVPNを使う。1か月前に、このVPN装置で認証を回避できる脆弱性が公表されていた。

1. 攻撃者がFS01に到達するまでの経路を説明せよ。
2. すぐに隔離すべき端末と、無効にすべきアカウントを挙げよ。
3. FWの設定の問題点と改善策を述べよ。
4. VPNに関する再発防止策を二つ述べよ。
5. 生産管理システムを戻す順序を決めるために、事前に行っておくべき分析は何か。

<details>
<summary>解答例と考え方</summary>

1. satoとしてVPNに接続したアドレスからPC-Kにログオンし、その後PC-Kからadm-itでDC01とFS01にログオンした。PC-KでLSASSへのアクセスがあるので、PC-Kで資格情報を盗んで横展開した可能性がある。
2. 端末はPC-KとFS01。DC01もadm-itがログオンしているので調査の対象にする。アカウントはsatoとadm-it。
3. VPNの利用者に社内の全セグメント・全サービスを許可しているので、侵害された端末から任意のサーバに届く。業務に必要なサーバとサービスだけを許可する。
4. ①VPN装置の脆弱性情報を集め、公表された修正を速やかに当てる。②VPNの認証にMFAを導入する。ほかに、国外からの接続の制限、普段と違う接続元や時間帯の検知も挙げられる。
5. BIA。業務ごとに止まったときの影響と止まってよい時間を分析し、RTO・RPOと戻す順序を決めておく。

ログが示す事実（接続とログオン）と、推測（資格情報の窃取）を分けて書く。脆弱性が公表されていたことだけで、認証の回避で入ったのか、盗んだパスワードで入ったのかは決まらない。MFAを入れても、認証を回避する脆弱性は塞げないので、4では修正の適用と並べて書く。

経路の根拠は、VPNの割当アドレスとPC-Kの接続元、PC-KのIPとDC01・FS01の接続元が一致することである。LSASSへのアクセスは窃取の疑いを支えるが、窃取した値や成功まではログにない。DC01は認証基盤なので、通常端末と同じ感覚で即時隔離すると全社へ影響する。侵害の確認、代替策、停止権限者の判断を急ぐ対象として扱う。

アカウント停止後も既存のVPNセッションやチケットが残る場合がある。セッション失効と、adm-itの他の利用先の調査を続ける。暗号化を止めた後も、外部持出しやバックアップ削除がなかったことを別に確認する。

</details>

## 3. 演習B：会員向けのWeb API

関連：[第2章](/blog/sc_2)、[第3章](/blog/sc_3)。目安15分。

Y社の会員サイトでは、SPAからAPIを呼ぶ。ログインにはOIDCを使い、IdPから受け取ったIDトークンをAPIサーバに送って会員を識別している。

```
GET /api/members/{member_id}
Authorization: Bearer <IDトークン>
```

APIサーバは、IDトークンの署名と有効期限を検証した後、`member_id` の会員情報を返す。

1. このAPIの脆弱性と、それを悪用した攻撃を述べよ。
2. 署名と有効期限のほかに、IDトークンで検証すべき項目を一つ挙げ、検証しないとどうなるかを述べよ。
3. APIの呼出しにIDトークンを使っていることの問題点を述べよ。
4. 「WAFを入れれば1の脆弱性に対処できる」という意見の誤りを述べよ。

<details>
<summary>解答例と考え方</summary>

1. member_idの会員とIDトークンの会員が一致するかを検証していないので、member_idを変えると他の会員の情報を取得される。
2. aud。検証しないと、同じIdPが別のサービス向けに発行したIDトークンを流用される。
3. IDトークンはクライアントに会員が誰かを伝えるためのもので、APIを使う権限の確認にはアクセストークンを使うべきである。
4. 攻撃のリクエストは正規の形式で、member_idの値が違うだけなので、WAFのシグネチャでは正常なリクエストと区別できない。

署名を検証しているから安全、とはならない。署名はトークンが本物であることを示すだけで、そのトークンの持ち主がどのデータを読んでよいかは別に確かめる。

1の確認要素は「対象会員」「認証した会員」「両者の対応」である。IDをランダムにしても、他人のIDを知った場合に読める状態は残る。実装では信頼したアクセストークン等の主体から許可される会員を決め、URL中のIDとの関係をサーバ側で検証する。

2はaud以外にiss等も論点になるが、何を検証し、しないとどんな別用途のトークンを受け入れるかまで結び付ける。3を直しても所有者検証は自動追加されない。トークンの用途の修正と、オブジェクトの認可の修正が別であることを確認する。

</details>

## 4. 演習C：CIサービスから秘密情報が漏れた

関連：[第6章](/blog/sc_6)、[第7章](/blog/sc_7)。目安15分。

Z社は外部のCIサービスでアプリをビルドし、クラウドの本番環境にデプロイしている。CIには、クラウドの管理者権限を持つ長期間有効なアクセスキーと、配布物に付けるコード署名の鍵を登録している。CIサービスの事業者が、一定期間、利用者の登録した秘密情報が外部に漏れた可能性があると公表した。

1. Z社がすぐに行うべき対応を二つ述べよ。
2. コード署名の鍵が漏れた場合に考えられる被害を述べよ。
3. 今後、CIに長期間有効なアクセスキーを登録しないための方法を述べよ。
4. コード署名の鍵の保管方法の改善策を述べよ。

<details>
<summary>解答例と考え方</summary>

1. ①アクセスキーを無効にし、署名鍵の利用を止めて鍵を作り直す。署名用の証明書の失効と、配布先への影響も確かめる。②漏れた可能性がある期間のキーの利用を、クラウドの監査ログで調べる。
2. 攻撃者が不正なプログラムにZ社の正規の署名を付けて配布でき、利用者がそれをZ社の製品として実行してしまう。
3. CIとクラウドをOIDCで連携し、ジョブの実行時だけ有効な一時的な認証情報を取得する。権限はデプロイに必要な範囲に絞る。
4. 署名鍵をHSMやクラウドのKMSに置き、CIからは署名の操作だけを依頼する。鍵そのものはCIに置かない。

CIのパスワードを変えても、既に漏れたキーは無効にならない。また、一時的な認証情報やHSMを使っても、不正なジョブから使われれば悪用される。権限の範囲とジョブの承認もあわせて考える。

漏えいしたキーの利用先は、元のCIのIPだけに限らない。キーIDやロール・セッションで監査ログを検索し、新しい管理者やキーの作成、権限変更、ログ無効化、成果物の差替えまで確認する。不正な永続化があれば、最初のキーを消すだけでは終わらない。

OIDCの信頼条件は、CIサービス全体ではなくZ社の対象リポジトリ・ブランチ・環境へ絞る。署名では、承認したコミットから作った成果物のハッシュを対象にする。HSMの署名APIを呼べる権限が管理者の長期キーに残れば、保管先だけを変えても不正署名は防げない。

</details>

## 5. 演習D：メールのドメインを変える

関連：[第4章](/blog/sc_4)。目安10分。

W社は社名の変更に合わせて、メールのドメインを `old.example` から `new.example` に移す。新ドメインのSPFレコードは設定済みである。メールマガジンは外部の配信サービスから、`new.example` を送信者として送る予定だ。

1. メールマガジンがDMARCの認証に成功するために必要な設定を述べよ。
2. DMARCのポリシーを最初から `p=reject` にしないのはなぜか。
3. 移行後の旧ドメインの扱いで注意すべき点を述べよ。

<details>
<summary>解答例と考え方</summary>

1. 配信サービスでnew.exampleのDKIM署名を付け、その公開鍵をnew.exampleのDNSに登録する。または、エンベロープFromをnew.exampleにして、配信サービスの送信元をSPFに追加する。
2. 設定が漏れている正規の送信経路のメールまで受信拒否されるおそれがあるので、まずp=noneでレポートを受け取り、認証の状況を確かめるため。
3. 旧ドメインの契約を続け、第三者に取得されないようにする。旧ドメインからの正規の送信がすべて終わったら、SPF（v=spf1 -all）とDMARC（p=reject）を設定する。

DMARCはSPFとDKIMの両方の成功を求めない。どちらかが成功し、そのドメインがヘッダーFromと一致すればよい。移行の途中で正規の送信が残っているうちに `-all` を設定しない。

設定を読むときは、画面に表示するヘッダーFrom、SPFで使うエンベロープFrom、DKIMのdの三つを分ける。外部サービスのドメインでSPFが成功していても、new.exampleと整合しなければDMARCの成功条件を満たさない。サブドメインを使う場合はstrict・relaxedの指定も確認する。

旧ドメインの維持にはWebのリンク、過去のメール、アカウント復旧の宛先への影響もある。メール送信を止める設定と、ドメイン契約を解約する判断は別である。DMARCが成功したメールでも、振込先変更の業務承認まで保証されるわけではない。

</details>

## 6. 演習E：SQLは安全なのに他人の注文が出る

関連：[第2章](/blog/sc_2)。目安15分。

会員向けシステムでは、複数のHTTPリクエストを同じハンドラーで並行して処理する。`orders` には注文番号・顧客ID・金額があり、利用者は自社の注文だけを閲覧できる仕様である。`currentCustomerId` は、サーバが検証したセッションの顧客IDである。

```java
class OrderHandler {
    private static String orderNo;
    Order find(Request req, String currentCustomerId) {
        orderNo = req.getParameter("orderNo");
        return query("SELECT * FROM orders WHERE order_no = ?", orderNo);
    }
}
```

`query` は値を正しくバインドする。自分の注文番号を指定しても、まれに別の注文が表示された。また、他社の注文番号を直接指定すると、その注文を取得できた。

1. まれに別の注文が表示される原因を、二つのリクエストの実行順序で説明せよ。
2. SQLインジェクション対策とは別に必要な、認可の修正を述べよ。
3. 二つの修正を確かめるテストを、それぞれ一つ挙げよ。

<details>
<summary>解答例と考え方</summary>

1. Aのリクエストが共有変数に注文Aの番号を入れた後、Bのリクエストが注文Bの番号で上書きし、Aがその値で検索する。注文番号はリクエストごとのローカル変数に置く。
2. 条件を `WHERE order_no = ? AND customer_id = ?` にし、二つ目の値に `currentCustomerId` を使う。顧客IDをリクエストから受け取らない。
3. 別々の利用者のリクエストを並行して実行し、結果が混ざらないことを確かめる。別の顧客の注文番号を指定したリクエストが拒否されることを確かめる。

「プレースホルダーを使う」は答えにならない。既に使っているからだ。「注文番号を推測できない値にする」も、認可の代わりにはならない。

1の原因は複数リクエストが共有する状態、2の原因は検索条件の不足であり、独立した欠陥である。ローカル変数に変えるだけでは直接他社番号を指定する攻撃が残り、所有者条件だけを足しても同じ顧客内の別注文へ取り違える競合が残りうる。両方を直す。

並行テストは、一度成功しただけで競合の不存在を証明しない。処理の実行順序を制御する等で、上書きが起こるタイミングを作って修正を確かめる。認可テストは自分の注文が返る正常系に加え、他社IDの拒否を確認する。

</details>

## 7. 演習F：同じサイトのファイルでCSPを回避される

関連：[第2章](/blog/sc_2)、[第6章](/blog/sc_6)。目安15分。

掲示板サイト `https://portal.example` は `script-src 'self'` を設定している。添付ファイルは拡張子 `.txt` だけを受け付け、`/files/` の下に保存する。保存したファイルは `Content-Type: application/javascript` で配信され、同じサイトのページから読み込める。投稿の本文はHTMLとしてそのまま保存・出力される。管理者が投稿を読むと、そのページからロール変更のAPIも実行できる。

1. 攻撃が成立する流れを、投稿と添付ファイルを結び付けて述べよ。
2. 根本的な対策と、追加の防御を一つずつ挙げよ。
3. 再発を防ぐために開発工程に加える検証を述べよ。

<details>
<summary>解答例と考え方</summary>

1. 攻撃者がスクリプトを `.txt` として添付し、そのパスを `src` に指定したscript要素を投稿に入れる。同じサイトのスクリプトなのでCSPで許可され、管理者が閲覧するとロール変更のAPIが実行される。
2. 根本対策は、投稿を出力するときにHTMLとしてエスケープすること。追加の防御として、添付ファイルの中身と配信時のContent-Typeを確かめ、スクリプトとして読み込ませない。拡張子の確認だけでは足りない。
3. 管理者が見る画面まで含めて、投稿・添付・ロール変更の仕様を理解した人がレビューと手動の診断を行い、修正後に同じ経路で再テストする。

HttpOnlyを付けても、管理者のブラウザーでの操作は止まらない。3で「WAFを入れる」と書くと、開発工程を問う設問に答えていない。

CSPのselfは「そのファイルを安全性審査した」という意味ではない。同じオリジンへ攻撃者がファイルを置けるため、許可された場所から攻撃コードを読める。保存・配信の権限と、投稿本文の出力処理を結び付けて考える。

添付を別オリジンで配信し、そのオリジンをscript-srcへ許可しない方法も追加防御になる。ただし、投稿のHTML挿入自体の修正は必要である。リッチテキストを認めるなら、全面エスケープの代わりに許可要素・属性によるサニタイズを設計し、その実装を検証する。

</details>

## 8. 演習G：工場を4時間で戻せるか

関連：[第5章](/blog/sc_5)、[第6章](/blog/sc_6)。目安15分。

工場のSCADAと事務用PCは同じLANにある。SCADAの設定と加工用プログラムは毎日0時にバックアップしており、バックアップの管理IDはふだんのAD管理者と共通である。目標はRTO 4時間、RPO 1時間で、復元のテストはしたことがない。10時に事務用PCがマルウェアに感染し、大量の通信で制御の通信が妨げられた。調査の時点では、SCADAのデータの改ざんは確認されていない。

1. 確認された被害に対して、必要な封じ込めの方向を述べよ。
2. 今のバックアップの運用でRPOを満たせるか。根拠とともに述べよ。
3. RTOを満たせることを確かめ、バックアップを守るための平常時の改善を二つ述べよ。

<details>
<summary>解答例と考え方</summary>

1. 制御に必要な通信を保ちながら、感染したPCの通信を止め、事務系から制御系への不要な通信を絞る。安全と操業への影響を確かめ、必要なら事前に用意した独立したLANに切り替える。
2. 0時より後の更新を戻すログなどがなければ、最大10時間分を失いうるので、RPO 1時間を満たせない。
3. ①再構築・復元・動作確認を含む手順を整え、訓練で4時間以内に再開できるかを測る。②バックアップの管理IDをADと分け、オフラインや削除できない保存先に、必要な世代を残す。

RTOとRPOは別々に確かめる。「MFAを入れる」は侵入を防ぐ対策で、早く戻すための準備にはならない。「SCADAをすぐ初期化する」は、証拠と操業の条件を考えていない。

確認された障害は大量通信による制御妨害であり、データ破壊は未確認である。まず通信を止めて制御を回復できるかを評価し、根拠なくSCADAデータの復元を最初の処置にしない。一方、未確認を無改ざんの証明とはせず、制御設定と設備の安全状態を確認する。

RPOを満たすには、バックアップや更新ログから1時間以内の正常な状態へ戻せることが必要になる。RTOの訓練では、担当者招集、代替機の準備、鍵・設定・プログラムの復元、設備の安全確認まで含める。ADと同じ管理IDならバックアップまで消されうるので、復旧速度の改善と保存先の保護を分ける。

</details>

## 9. 演習H：画像の取込み機能からクラウドへ

関連：[第2章](/blog/sc_2)、[第7章](/blog/sc_7)。目安15分。クラウド権限へWebの欠陥が波及する題材。

V社のECサイトには、出品者が画像のURLを入力すると、Webサーバがその画像を取得して保存する機能がある。WebサーバはクラウドのVM上で動き、VMにはロールが割り当てられている。Webサーバが使うのは商品画像のストレージだけだが、ロールには、対象を限定しないストレージの読み書きと一覧取得の権限が付いている。メタデータサービスは、トークンなしでアクセスできる旧方式のままになっている。

取込み処理はHTTPで取得した本文を画像として検証せず、要求した出品者が後で取得できる場所へ保存する。このため、メタデータの応答本文も攻撃者が読めるものとする。

ある日、監査ログに、普段はアクセスのない顧客データのストレージに対して、一覧の取得とダウンロードが大量に記録されていた。呼出し元はWebサーバのロールの一時的な認証情報だが、送信元のIPアドレスはV社のものではなかった。

1. 攻撃者が一時的な認証情報を手に入れた方法を述べよ。
2. 顧客データをダウンロードできた原因を、ロールの権限から二つ述べよ。
3. 画像取込み機能での対策を二つ、クラウドの設定での対策を一つ述べよ。

<details>
<summary>解答例と考え方</summary>

1. 画像のURLとしてメタデータサービスのアドレスを入力し、Webサーバ自身にアクセスさせて、ロールの一時的な認証情報を応答として取得した（SSRF）。
2. ①一覧取得の権限があるので、顧客データのストレージの存在と中のファイル名を知られた。②読取りの権限の対象が商品画像のストレージに限られていないので、顧客データのストレージも読めた。
3. 画像取込み機能では、取得先を許可したドメインに限る、名前解決後のIPアドレスがプライベートやリンクローカルなら拒否する。クラウドでは、メタデータサービスをトークンが必要な方式に切り替える（ほかに、ロールの権限を商品画像のストレージの読み書きだけに絞る）。

送信元がV社のIPアドレスでないことは、認証情報がVMの外で使われた疑いを支える。調査では、正規のプロキシや実行環境の可能性も含め、監査ログの主体・送信元・時間帯・操作と、VMの要求ログを突き合わせる。ログだけで初期侵入の方法まで確定したとはしない。

一覧権限がなくてもオブジェクト名を知っていれば読める場合があるので、一覧だけを削るのでは不十分である。ロールの読取り対象そのものを商品画像へ絞る。SSRF対策では最初のURLだけでなく、リダイレクト先や名前解決後の接続先も検証し、許可範囲外へ到達させない。

</details>

## 10. 演習I：OAuthによる銀行口座の連携

関連：[第3章](/blog/sc_3)。目安15分。要求と応答の対応付けを確認する題材。

U社の家計簿サービスは、外部の認可サーバを使ったOAuth 2.0の認可コードフローで、利用者の銀行口座の残高を取得する。U社のサービスは、認可サーバに `redirect_uri` として `https://app.u.example/` を登録しており、認可サーバは前方一致でリダイレクト先を確かめている。U社のサービスは `state` を送っておらず、PKCEも使っていない。また、`https://app.u.example/forum/` には利用者が自由にリンクを書ける掲示板がある。

この掲示板は `Referrer-Policy: unsafe-url` を返し、外部のHTTPSリンクを開くと元のURLのクエリ文字列もRefererに含まれるものとする。ブラウザーの通常の既定値ではクロスオリジンへクエリを送らないことがあるため、この演習では漏えいの成立条件を明示する。

1. `redirect_uri` の確認方法が原因で、認可コードが漏れる流れを述べよ。
2. `state` を使っていないことで成立する攻撃を述べよ。
3. 認可サーバとU社のサービスのそれぞれで行うべき対策を述べよ。

<details>
<summary>解答例と考え方</summary>

1. 攻撃者が `redirect_uri` を掲示板のページ（`https://app.u.example/forum/...`）にした認可要求のURLを利用者に踏ませる。前方一致なので認可サーバは受け入れ、認可コード付きで掲示板へ戻す。掲示板に攻撃者が置いた外部リンクを利用者がたどると、Refererなどで認可コードが攻撃者に渡る。
2. 攻撃者が自分の口座で得た認可コードを、被害者のブラウザーでU社のサービスに送らせる。被害者のアカウントに攻撃者の口座が結び付けられる（CSRF）。
3. 認可サーバは、登録したURIとの完全一致で `redirect_uri` を確かめる。U社のサービスは、推測できない `state` を付けて戻りで照合し、PKCEを使って、横取りされた認可コードだけではトークンを取れないようにする。

この例はAPI権限の連携であり、OAuth自体をログイン方式と呼んでいるわけではない。nonceによるIDトークンの照合は、OIDCで認証結果も扱う場合の別の論点である。stateは開始した要求との結び付け、PKCEはコードの取得要求と交換要求の結び付けを担う。条件を満たすPKCEをCSRF防止へ使える場合もある。

Refererを制限すればこの漏えい経路を減らせるが、不適切なリダイレクト先検証を直すことは依然必要である。またコードが漏れたことと、攻撃者がトークン交換に成功したことは別で、クライアント認証やコードの有効期限・使用済み状態にも依存する。解答では、本文が示していない交換成功まで断定しない。

</details>

## 11. 演習J：署名が正しくてもSAMLで侵入される

関連：[第3章](/blog/sc_3)。目安20分。

R社は社内IdPと、経費SP・人事SPを連携している。両SPは同じIdPの署名鍵を信頼する。経費SPはSP起点のPOST方式で、発行した要求IDをログイン開始のブラウザーセッションに対応付けて保存する。ただし受信時は署名と時刻しか検証せず、Audience・Recipient・InResponseTo・使用済みIDは確認しない。

IdPは人事SP向けに、`Audience=hr-sp`、`Recipient=https://hr.r.example/acs`、`InResponseTo=q-hr-10` のアサーションAを発行した。アサーションは有効期間内で署名も正しい。攻撃者はブラウザー上で自分用のAを取得できる。またR社ではIdPのアカウントを止めても、SPの既存セッションは期限まで続く。

1. Aを経費SPのACSへPOSTした際、署名と時刻だけでは拒否できない理由を説明せよ。
2. 別SP向けのAの流用、別要求への差込み、同一Aの二回目の使用を防ぐ検証をそれぞれ述べよ。
3. 署名検証済みのXML要素と、利用者名を読む要素が異なる実装の危険と対策を述べよ。
4. IdPの署名秘密鍵が漏れた場合、利用者パスワードの変更だけでは不十分な理由と、停止すべき信頼・セッションを述べよ。

<details>
<summary>解答例と検証の順序</summary>

1. AはR社IdPが正規に作り、期限内なので、同じ鍵を信頼する経費SPの署名・時刻検証も通る。署名の正しさは経費SP宛てであることを意味しない。
2. 経費SPがAudienceに自分の識別子が含まれること、Recipientが自分のACSであることを確認する。SP起点ではInResponseToを、そのセッションに対応する未完了の要求IDへ照合する。受け入れたアサーション等のIDを有効期間中保存し、再使用を拒否する。
3. 正規の署名付き要素を残し、別の未検証要素から管理者名を読ませるXML署名ラッピングが成立しうる。認証・認可へ使う要素そのものが署名検証済みであることを保証し、重複ID・想定外の構造を拒否する。
4. 攻撃者は利用者パスワードなしで認証結果を偽造できる。各SPで旧署名鍵への信頼を停止して新鍵へ切り替え、不正なSPセッションを失効させて利用履歴を調査する。

この演習でいう別SP向け流用は、Audience等の省略を確認するためのもので、実際に得る権限はSPのアカウント対応付けにも依存する。Aを送れば必ず他人の管理者になる、とは断定しない。

Audienceは利用先、RecipientはBearerの主張の受取先、InResponseToは要求との対応、使用済みIDは同一主張の再利用という違いを説明できればよい。どれも「署名をもっと厳格にする」と書くだけでは欠けた検証を特定できない。

IdPの停止とSPセッションの失効も別である。ログイン済みセッションはSAMLアサーションを毎回再検証するとは限らないため、アサーションの短命化だけで、作成済みセッションを即時に止められるとは限らない。

</details>

## 12. 演習K：CVSSの高い順に修正してよいか

関連：[第6章](/blog/sc_6)。目安15分。数値・条件は架空のものである。

| 資産 | CVSS v3.1基本値 | EPSS | 状況 |
|---|---|---|---|
| 公開VPN-A | 8.1 | 0.75 | 認証前に悪用可能。KEV掲載、修正版あり |
| 検証VM-B | 9.8 | 0.03 | 脆弱機能は無効、外部経路なし。本番データなし |
| 生産機器-C | 9.0 | 0.40 | 社内保守端末から到達。修正には操業停止と互換性検証が必要 |

Cにはパッチを当てるまで、保守用踏み台から必要時だけ接続できるようFWを変更できる。Bの機能変更は構成管理で承認する。全資産の修正に一日以上かかる。

1. 最初に対応する資産と理由を述べよ。
2. Cをすぐ修正できない場合、必要な暫定対応と管理上の記録を述べよ。
3. BのEPSSが低いことを理由に、修正不要としてよいか。
4. 「パッチ配布成功」の記録だけで完了にしない理由と、追加の確認を述べよ。

<details>
<summary>解答例と優先順位の根拠</summary>

1. 公開VPN-A。外部から認証前に到達でき、実悪用の情報があり、侵入口となるため。修正または即時の公開制限を行い、既存の侵害も調べる。
2. Cへの通信を承認した踏み台・必要なポート・作業期間へ限定し監視する。残るリスク、責任者、例外期限、検証と適用予定、再評価条件を記録して承認する。
3. 不可。EPSSは悪用の見込みであり、影響の大きさや自社の安全を保証しない。機能無効と到達制限の前提を維持し、変更時に再評価して計画修正する。
4. 再起動待ちや適用漏れ、古い版の再展開がありうる。実稼働版、対象全台の状態、再スキャン、業務動作を確認する。

基本値の順ならBが最初だが、この本文ではAの実際の攻撃可能性が高い。Cは「止められないから何もしない」ではなく、使える暫定措置と期限付きの是正を選ぶ。Bも永久除外でなく、前提を管理した上での後順位となる。

EPSS 0.75はAが75%で侵害されるという意味ではない。KEVも、自社が侵害済みという証明ではない。自社の該当性・到達性・重要度と、指標が意味する範囲を混同しないことが確認点である。

</details>

## 13. 演習L：同じIPから送られたのは誰か

関連：[第4章](/blog/sc_4)、[第5章](/blog/sc_5)。目安15分。

時計は同期しており、外部サービスの時刻だけUTC、他はJSTである。NAPTの行は送信元の変換を示す。

```text
外部サービス  01:15:20 UTC  接続元=198.51.100.20:62000  大量アップロード
NAPT          10:15:20 JST  10.1.2.30:51000 -> 198.51.100.20:62000
DHCP          09:00-11:00   10.1.2.30 を PC30 に貸出し
DHCP          11:05-13:00   10.1.2.30 を PC31 に貸出し
EDR PC30      10:14:40 JST  user=tanaka、プロセスPがarchive.zipを作成
```

境界FWにはPC30と外部サービスの通信は残っているが、同一VLAN内のPC30とPC40の通信は通らない。archive.zipの中身と、PC30でプロセスPを起動した経緯はまだ分からない。

1. 外部サービスへ接続した端末を、記録の対応を示して特定せよ。
2. tanaka本人による意図的な機密情報の持出しと断定できるか。
3. PC40に感染がないと、境界FWのログだけで判断できるか。
4. 内容と実行経緯を確かめる追加調査を二つ述べよ。

<details>
<summary>解答例と断定できる範囲</summary>

1. PC30。UTCの01:15:20はJSTの10:15:20であり、外部IP・ポートをNAPTで10.1.2.30へ対応付け、その時刻のDHCP貸出し先がPC30である。
2. 断定できない。ユーザー名でのプロセス実行と通信は材料になるが、マルウェアや盗まれた認証情報の可能性がある。圧縮内容も不明で、機密情報の送信とはまだ決められない。
3. できない。同一VLAN内の通信は観測点を通らないため、FWの記録がなくてもPC30からの横展開がありうる。
4. ①PC30のファイル操作記録・保全した圧縮ファイルから対象ファイルを確認する。②EDRでPの親プロセス・引数・起動時刻と前後の認証記録を確認する。

現在10.1.2.30を使うPC31を調べるだけでは、発生時の端末を取り違える。外部IPだけで同じNAPT配下の全端末を犯人とするのも誤りである。時刻とポートを使うことが設問1の要点になる。

4で「ログを見る」とだけ書くと、何を確かめるか不明になる。対象・記録・確認する項目を揃える。圧縮ファイル作成と大量送信の時間が近くても、同一のファイルが送られた証拠がまだないことも意識する。

</details>

## 14. 演習M：署名とバックアップは何を守るか

関連：[第3章](/blog/sc_3)、[第6章](/blog/sc_6)、[第7章](/blog/sc_7)。目安15分。

T社は配布プログラムとSHA-256の値を同じWebサーバで公開している。機密DBはDEKで暗号化し、DEKをKMSのKEKで暗号化している。ランサムウェア発生後、DEKの平文が持ち出されたと確認した。バックアップは毎日0時、DB更新ログはなく、業務は10時に停止した。目標はRPO 1時間、RTO 4時間である。

1. Webサーバを改ざんできる攻撃者に対し、公開したハッシュだけでは不足する理由と対策を述べよ。
2. KEKだけを変更しても既存の暗号文を保護し直せない理由を述べよ。
3. RPOを満たせるか。またデータ復元に2時間かかると分かっただけでRTO達成と判断できるか。

<details>
<summary>解答例と三つの保護目的</summary>

1. 攻撃者は配布物とハッシュ値を両方作り直せる。保護した署名鍵で成果物へ署名し、利用者が別途信頼した公開鍵で検証できるようにする。
2. 持ち出されたDEKで既存の暗号文を復号できるため。新しいDEKでデータを再暗号化し、漏えいしたコピーによる被害も評価する。
3. 更新を再現する手段がなければ最大10時間分を失いうるので、RPO 1時間は満たせない。RTOは環境準備・鍵復元・データ復元・動作確認を含むため、復元時間だけでは判断できない。

1は完全性と発行元、2は機密性、3は業務を戻すためのデータ損失と時間の問題である。異なる目的の技術を答えに混ぜない。署名鍵が侵害されたビルド環境から自由に使えるなら不正署名が残るので、署名の保管・承認・対象固定も必要になる。

2ではKEKの定期更新と、DEK漏えいの対応を区別する。3ではRPOの達成とRTOの達成を個別に判定する。復旧できても既に持ち出された情報が元に戻るわけではなく、漏えい対応は別に続く。

</details>

## 15. 講評から作った答案の直し方

各年度の採点講評で指摘された失点を、次に同じ失点をしないための直し方にまとめた。

| 過去問・設問 | 失点した書き方 | 直し方 |
|---|---|---|
| 2018秋 午後Ⅰ問2 設問2(2) | 監視している位置を通らない通信を見落とした | 通信の経路と観測できる範囲を図に描く（[第4章](/blog/sc_4)） |
| 2019春 午後Ⅰ問2 設問2(3) | 秘密鍵が盗まれないことだけで、中継攻撃への強さを説明した | 署名の対象と、誰が何を検証するかを書く（[第3章](/blog/sc_3)） |
| 2021春 午後Ⅰ問3 設問4(2) | EDRの名前だけで、具体的な使い方を書かなかった | 使う記録・条件・処置を書く（[第5章](/blog/sc_5)） |
| 2023秋 問1 設問1(1) | DOMを使っていたのでDOM Based XSSと答えた | HTMLを組み立てたのがサーバかブラウザーかで判定する（[第2章](/blog/sc_2)） |
| 2023秋 問4 設問2 | リスクが具体的でなく、被害の大きさや頻度を評価できない | 「誰が・どこから・何をして・何が困るか」で書く（[第6章](/blog/sc_6)） |
| 2024春 問3 設問1(2) | XSSが実行される画面の利用者（管理者）を読み落とした | 誰のブラウザーで動き、その人の権限で何ができるかを追う（[第2章](/blog/sc_2)） |
| 2024秋 問1 設問1(8) | どのログを確認するかを書かなかった | 対象・記録・条件をそろえて書く（[第5章](/blog/sc_5)） |
| 2024秋 問2 設問2 | SMTPの暗号化に「S/MIME」と答えた | 通信の暗号化と、メッセージの暗号化を分ける（[第4章](/blog/sc_4)） |
| 2025春 問1 設問4 | SBOMの利点を問われて定義を書いた | 照合する対象と、それで何が分かるかを書く（[第6章](/blog/sc_6)） |
| 2025春 問2 設問4(1) | CVSSのACをCと取り違えた | 略号ではなく指標の意味で覚える（[第6章](/blog/sc_6)） |
| 2025秋 問1 設問4 | 開発プロセスを問われてWAFやログ分析を書いた | 検出・修正・再テストという工程で書く（[第2章](/blog/sc_2)） |
| 2025秋 問3 設問4(2) | VPN接続前に必要な通信を見落とした | 初期設定時・接続前・接続後で通信を分けて洗い出す（[第4章](/blog/sc_4)） |
| 2025秋 問4 設問4 | 復旧の準備を問われて、攻撃を止める手段を書いた | 平常時に用意する媒体・手順・訓練を書く（[第6章](/blog/sc_6)） |

## 16. 2018〜2025年度・記述70問の一覧

IPAの問題冊子・解答例・採点講評をもとに、大問ごとの題材と見どころを短くまとめた。題名は公式のものではなく本書の要約である。「Ⅰ・Ⅱ」は旧午後Ⅰ・Ⅱを指し、問番号のリンクは公式の問題PDFを開く。全件のURLは[CSV](/sc/past-exam-map.csv)でも配布している。

### 2018年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | Use-After-Freeとメモリ保護。解放後の参照とバイト順を追う。 | [7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | サーバ・FWの設定強化。メール経路と更新用の通信を列挙。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_qs.pdf) | ネットワーク分離の設計。分離後の感染・認証情報漏えいを評価。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_qs.pdf) | セキュリティ対策の評価。DOM型XSS・DB移設・情報保護方式を比較。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_qs.pdf) | Webのガイドラインと診断内製化。画面遷移・SQL・認可の診断を設計。 | [2](/blog/sc_2)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | メモリ破壊攻撃と対策技術。保護技術の適用条件をコードで確認。 | [7](/blog/sc_7) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | ワーム感染の調査と分離。ミラー・DHCP・無線ログを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_qs.pdf) | ソフトウェアの脆弱性対策。侵害調査・CVSS・WAF構成を検討。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_qs.pdf) | クラウド環境のセキュリティ。要件・SSO・運用管理の分担を比較。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_qs.pdf) | 対応準備とインシデント調査。時刻・タイムライン・切離しを検討。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

解答例と講評：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_sc_pm2_cmnt.pdf)。

### 2019年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | Webサイト間の情報連携。SOP・JSONP・CORSを比較。 | [2](/blog/sc_2) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | クラウドサービスの認証強化。中継攻撃と署名対象を追う。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_qs.pdf) | IoT機器の認証連携・改ざん防止。MAC・署名・TPMの役割を整理。 | [3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_qs.pdf) | 無線LAN経由の感染と調査。証拠保全・TLS復号・無線の保護範囲を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[7](/blog/sc_7) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_qs.pdf) | 情報漏えい調査とサーバ対策。DHCP・通信・ヒアリングを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | 電子メールの送信ドメイン認証。SPF・DKIM・DMARCの対象を判定。 | [4](/blog/sc_4) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | 脅威インテリジェンスとC2対策。正規実行ファイル・DNS経路を検討。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_qs.pdf) | 標的型攻撃とEDRによる対応。未接続端末の状態と対処を判断。 | [5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_qs.pdf) | マルウェアと開発・運用プロセス。外向き通信・変更手順・検証を対応。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_qs.pdf) | OTとITが混在する工場。保守・媒体・分離・脆弱性評価を設計。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6) |

解答例と講評：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_sc_pm2_cmnt.pdf)。

### 2020年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [10月 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | スマートフォン決済アプリ。メッセージ認証と会員の列挙対策を考える。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [10月 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | S/MIMEのメールシステム設計。暗号化・署名・失効確認を対応。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [10月 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_qs.pdf) | ECサイトの脆弱性診断計画。診断位置・業務影響・防御装置を確認。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[6](/blog/sc_6) |
| [10月 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_qs.pdf) | 合併後のWebサイト統合。FW・アカウント連携・Javaをレビュー。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [10月 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_qs.pdf) | マルチクラウドのテレワーク。OTP・認可コード・端末の権限を追う。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |

解答例と講評：10月 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm1_cmnt.pdf)／10月 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_sc_pm2_cmnt.pdf)。

### 2021年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | OAuthを使う認証システム開発。アカウントとコードの関連付けを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | DNSのセキュリティ対策。権威・キャッシュ・ゾーン転送を設計。 | [4](/blog/sc_4) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_qs.pdf) | パッチ配信とセキュリティ運用。検証・WoL・EDRの具体的な利用を考える。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_qs.pdf) | インシデント対応体制の整備。委託関係・FW・脆弱性評価を整理。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_qs.pdf) | クラウド利用のIT統制。DHCP・802.1X・IDaaS・端末鍵を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | リモート保守のインシデント対応。SSHホスト鍵・利用者認証・接続元を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | 設計文書の管理とIRM。保護方式・権限・パスワード攻撃を評価。 | [3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_qs.pdf) | PC感染後の通信・実行制御。ログ・FW・許可ファイルの悪用を追う。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_qs.pdf) | CSPとSaaS移行・FIDO認証。出力処理・スクリプト・認証器運用を確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_qs.pdf) | テレワークと他社を含む感染対応。感染範囲・調査条件・対処優先度を整理。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

解答例と講評：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d5ru-att/2021r03h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000apad-att/2021r03a_sc_pm2_cmnt.pdf)。

### 2022年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | 情報共有Webアプリの開発。Java・SQL・プロジェクト認可を修正。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | NAS・ルータの侵害と対策。URL正規化・sudo・アクセスログを確認。 | [2](/blog/sc_2)・[4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_qs.pdf) | QRコード決済と本人確認。公的個人認証・撮影・当人認証を整理。 | [3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_qs.pdf) | Web脆弱性と開発プロセス。XSS・CSRF・SSRF・診断手法を対応。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_qs.pdf) | クラウド移行と各種認証。CDN・SAML・OAuth・OIDCを追う。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[7](/blog/sc_7) |
| [秋 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | IoT製品の開発と脆弱性。ファームウェア・証明書・CSRFを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [秋 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | ライブラリ脆弱性の侵害対応。親子プロセスと影響条件を確認。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |
| [秋 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_qs.pdf) | コンテナ・CIのサプライチェーン侵害。レジストリとビルドの権限・通信を追う。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_qs.pdf) | 脅威情報調査・動的解析・CTF。安全な転送・ARP・オフライン解析を検討。 | [3](/blog/sc_3)・[4](/blog/sc_4)・[5](/blog/sc_5)・[7](/blog/sc_7) |
| [秋 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_qs.pdf) | EDRとインシデント対応。イベント・検知ルール・対応時間を確認。 | [5](/blog/sc_5)・[6](/blog/sc_6) |

解答例と講評：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000009sgk-att/2022r04h_sc_pm2_cmnt.pdf)／秋 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm1_cmnt.pdf)／秋 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_sc_pm2_cmnt.pdf)。

### 2023年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 Ⅰ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | Javaのセキュアプログラミング。SQL・共有変数・レースコンディションを修正。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [春 Ⅰ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | ライブラリ脆弱性とログ調査。FTP・接続方向・プロセス・ポートを突合。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [春 Ⅰ問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_qs.pdf) | クラウドプロキシへの移行。移行前後の経路とルール順を設計。 | [4](/blog/sc_4)・[7](/blog/sc_7) |
| [春 Ⅱ問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_qs.pdf) | Webサイトの脆弱性診断。入力画面から出力画面へ遷移して判定。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 Ⅱ問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_qs.pdf) | Webのクラウド移行と機能拡張。権限・OAuth・PKCEを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | WebのXSS侵害と対応。HTML・スクリプト・攻撃痕跡を追う。 | [2](/blog/sc_2)・[5](/blog/sc_5) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | 証明書・秘密鍵と無線LANの見直し。サーバ検証・端末鍵・EAP-TLSを確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | CIサービスの侵害対応。コンテナ権限・WebAuthn・HSMを整理。 | [3](/blog/sc_3)・[5](/blog/sc_5)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_qs.pdf) | 個人情報のリスクアセスメント。内部者による具体的なシナリオを作る。 | [6](/blog/sc_6)・[7](/blog/sc_7) |

解答例と講評：春 Ⅰ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm1_cmnt.pdf)／春 Ⅱ [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_sc_pm2_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_sc_pm_cmnt.pdf)。

### 2024年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | APIの設計と脆弱性対応。JWTの仕様と欠落した検証を確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | リモートワークとDDoS対策。VPN・MFA・しきい値・CDNを検討。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [春 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | クラウド上のWebサイトへの攻撃。XSS・CSRF・認証情報取得を関連付ける。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_qs.pdf) | Linux権限とJavaの実装。例外処理とリソース解放を読む。 | [2](/blog/sc_2)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | 社内システムのログ調査と対処。複数ログとファイル持出しを分析。 | [4](/blog/sc_4)・[5](/blog/sc_5) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | メールドメイン移行とDMARC。SPF・DKIM署名範囲・旧ドメインを確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | ECサイト改ざんとカード情報漏えい。DOM改変とURL・アクセスログを追う。 | [2](/blog/sc_2)・[5](/blog/sc_5) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_qs.pdf) | Webサイトのセキュリティ診断。セッション固定化と攻撃の連鎖を考える。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[6](/blog/sc_6) |

解答例と講評：春 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_sc_pm_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_sc_pm_cmnt.pdf)。

### 2025年度

| 過去問 | 題材と見どころ | 章 |
|---|---|---|
| [春 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | サプライチェーンと開発プロセス。委託・SBOM・SAST/DAST/IASTを評価。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | 脆弱性と対応優先度。CVSSv3・EPSS・仕様上の条件を読む。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [春 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | スマホアプリとクラウドストレージ。キー・証明書・署名付きURLを確認。 | [2](/blog/sc_2)・[3](/blog/sc_3)・[7](/blog/sc_7) |
| [春 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_qs.pdf) | 公開IT資産とASM。CNAME・稼働調査・KEVを使う。 | [4](/blog/sc_4)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問1](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | CSP・アップロードと権限昇格。同一サイトでのスクリプト実行経路を追う。 | [2](/blog/sc_2)・[6](/blog/sc_6) |
| [秋 午後問2](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | 暗号資産交換業の鍵管理。署名・MAC・鍵の暗号化と移送を確認。 | [3](/blog/sc_3)・[6](/blog/sc_6)・[7](/blog/sc_7) |
| [秋 午後問3](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | インターネットバンキングとVPN。DNSSEC・DoH・認証・接続前の通信を確認。 | [3](/blog/sc_3)・[4](/blog/sc_4) |
| [秋 午後問4](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_qs.pdf) | セキュリティ管理体制とOT復旧。権限・攻撃シナリオ・備品・手順を対応。 | [4](/blog/sc_4)・[5](/blog/sc_5)・[6](/blog/sc_6) |

解答例と講評：春 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_sc_pm_cmnt.pdf)／秋 午後 [解答](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_ans.pdf)・[講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_sc_pm_cmnt.pdf)。
