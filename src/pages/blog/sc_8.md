---
layout: ../../layouts/BookLayout.astro
title: 演習と記述答案
description: 答案の書き方、予想した題材を含む独自演習9題、採点講評から作った答案の直し方、2018〜2025年度の記述70問の一覧。
tags: ["SC", "科目B", "演習"]
time: 50
featured: false
timestamp: 2025-08-04T13:22:00+00:00
filename: sc_8
---

科目Bの大問は一つの分野で閉じていない。この章の演習は、複数の章の知識を組み合わせて解くように作った。解答例は折りたたんであるので、先に自分で答案を書いてから開く。演習はすべて本書で作ったもので、実際の試験問題とは関係がない。

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

</details>

## 9. 演習H：画像の取込み機能からクラウドへ

関連：[第2章](/blog/sc_2)、[第7章](/blog/sc_7)。目安15分。第1章で○を付けた題材の演習。

V社のECサイトには、出品者が画像のURLを入力すると、Webサーバがその画像を取得して保存する機能がある。WebサーバはクラウドのVM上で動き、VMにはロールが割り当てられている。Webサーバが使うのは商品画像のストレージだけだが、ロールには、対象を限定しないストレージの読み書きと一覧取得の権限が付いている。メタデータサービスは、トークンなしでアクセスできる旧方式のままになっている。

ある日、監査ログに、普段はアクセスのない顧客データのストレージに対して、一覧の取得とダウンロードが大量に記録されていた。呼出し元はWebサーバのロールの一時的な認証情報だが、送信元のIPアドレスはV社のものではなかった。

1. 攻撃者が一時的な認証情報を手に入れた方法を述べよ。
2. 顧客データをダウンロードできた原因を、ロールの権限から二つ述べよ。
3. 画像取込み機能での対策を二つ、クラウドの設定での対策を一つ述べよ。

<details>
<summary>解答例と考え方</summary>

1. 画像のURLとしてメタデータサービスのアドレスを入力し、Webサーバ自身にアクセスさせて、ロールの一時的な認証情報を応答として取得した（SSRF）。
2. ①一覧取得の権限があるので、顧客データのストレージの存在と中のファイル名を知られた。②読取りの権限の対象が商品画像のストレージに限られていないので、顧客データのストレージも読めた。
3. 画像取込み機能では、取得先を許可したドメインに限る、名前解決後のIPアドレスがプライベートやリンクローカルなら拒否する。クラウドでは、メタデータサービスをトークンが必要な方式に切り替える（ほかに、ロールの権限を商品画像のストレージの読み書きだけに絞る）。

送信元がV社のIPアドレスでないことは、認証情報がVMの外に持ち出されて使われたことを示す。調査の答案では、監査ログで、そのロールの認証情報が使われた送信元・時間帯・操作を確かめる、と具体的に書く。

</details>

## 10. 演習I：OAuthでログインするアプリ

関連：[第3章](/blog/sc_3)。目安15分。第1章で◎を付けた題材の演習。

U社の家計簿サービスは、外部の認可サーバを使ったOAuth 2.0の認可コードフローで、利用者の銀行口座の残高を取得する。U社のサービスは、認可サーバに `redirect_uri` として `https://app.u.example/` を登録しており、認可サーバは前方一致でリダイレクト先を確かめている。U社のサービスは `state` を送っておらず、PKCEも使っていない。また、`https://app.u.example/forum/` には利用者が自由にリンクを書ける掲示板がある。

1. `redirect_uri` の確認方法が原因で、認可コードが漏れる流れを述べよ。
2. `state` を使っていないことで成立する攻撃を述べよ。
3. 認可サーバとU社のサービスのそれぞれで行うべき対策を述べよ。

<details>
<summary>解答例と考え方</summary>

1. 攻撃者が `redirect_uri` を掲示板のページ（`https://app.u.example/forum/...`）にした認可要求のURLを利用者に踏ませる。前方一致なので認可サーバは受け入れ、認可コード付きで掲示板へ戻す。掲示板に攻撃者が置いた外部リンクを利用者がたどると、Refererなどで認可コードが攻撃者に渡る。
2. 攻撃者が自分の口座で得た認可コードを、被害者のブラウザーでU社のサービスに送らせる。被害者のアカウントに攻撃者の口座が結び付けられる（CSRF）。
3. 認可サーバは、登録したURIとの完全一致で `redirect_uri` を確かめる。U社のサービスは、推測できない `state` を付けて戻りで照合し、PKCEを使って、横取りされた認可コードだけではトークンを取れないようにする。

state、nonce、PKCEは、それぞれ何を守るのかを取り違えやすい。stateは要求と応答の結び付き（CSRF）、nonceはIDトークンの再利用、PKCEは認可コードの横取りを防ぐ。

</details>

## 11. 講評から作った答案の直し方

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

## 12. 2018〜2025年度・記述70問の一覧

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
