---
layout: ../../layouts/BlogLayout.astro
title: "Haskell ERP (IFRS) 開発ポリシー"
description: "IFRS準拠の会計ERPをHaskellで構築するための設計指針。GADT・DataKinds・純粋関数による堅牢な型設計と、中央集権を廃した分散アーキテクチャを58項目で示す。"
tags: ["Haskell", "ERP", "IFRS", "GADT", "Event Sourcing", "Clean Architecture"]
time: 30
featured: true
timestamp: 2026-04-10T10:52:00+09:00
filename: haskell_erp_architecture
---

## この文書の目的

IFRS 準拠の会計 ERP を Haskell で構築するにあたっての設計指針を示す。
まず典型的なアンチパターンを提示し、その問題点を 69 項目に分解する。
最後に、それらを反映した改善例を置く。

### 前提：ローカル完結のオフラインアーキテクチャ

本システムはネットワークに依存しない。
Write DB に **SQLite**、Read DB に **RocksDB** を採用し、すべてローカルのファイルベースで完結する。
サーバもコンテナも不要。実行バイナリとデータファイルだけで動く。

Write API が SQLite にイベントを書き込むと、非同期のイベントハンドラ（Projector）が RocksDB を更新する。
Haskell の軽量スレッド（green thread）と STM により、この非同期パイプラインは安全かつ低コストに実現できる。
GHC ランタイムは数万スレッドを OS スレッド数本で多重化するため、
Projection の非同期化にスレッドプールやメッセージブローカーのような外部インフラは不要である。

SQLite は単一ファイルでトランザクション ACID を保証し、イベントの append-only ストアとして十分な性能を持つ。
RocksDB は LSM-Tree ベースの KV ストアであり、非正規化された Read モデルの高速参照に適する。
どちらも組み込み型であり、プロセス内で直接操作できる。

### 二つの原則

本文書を貫く原則は二つある。

**1. 中央集権の廃止**
型クラスによる暗黙の DI、巨大な `applyEvent`、グローバルなインスタンス解決。
これらは一見エレガントだが、依存の出所が見えない。
ERP では依存先が数十に達する。暗黙解決に頼ると、変更時の影響範囲が読めなくなる。
依存は値として渡す。ルーティングは目次に留め、処理は各関数に分散する。

**2. Haskell でしか書けない堅牢さ**
`newtype` で型を包む程度なら他言語でもできる。
本文書が求めるのは、GADT・DataKinds による状態機械、
幽霊型による不正状態の構造的排除、純粋関数によるドメインの参照透過性である。
これらはコンパイル時に業務ルール違反を検出する仕組みであり、
Java や TypeScript の型システムでは表現できない。

---

## アンチパターン

以下のコードは「動くが、壊れ方が読めない」構造の典型である。

```hs
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE UndecidableInstances #-}

--------------------------------------------------------------------------------
-- 1. Domain Layer
--------------------------------------------------------------------------------

newtype UserName = UserName String deriving Show
newtype UserEmail = UserEmail String deriving Show

data User = User
  { userId    :: Int
  , userName  :: UserName
  , userEmail :: UserEmail
  } deriving Show

class Monad m => UserRepository m where
  saveUser   :: User -> m ()
  deleteUser :: Int -> m ()   -- ★問題(#21): 物理削除。監査証跡が消える

--------------------------------------------------------------------------------
-- 2. Application Layer
--------------------------------------------------------------------------------

data UserRequestDto = UserRequestDto
  { dtoName  :: String
  , dtoEmail :: String
  } deriving Show

class Monad m => UserUseCase m where
  registerUser :: UserRequestDto -> m ()
  correctUserName :: Int -> String -> m ()   -- ユーザ名修正
  searchUserByName :: String -> m [User]     -- ユーザ名検索
  deactivateUser :: Int -> m ()              -- ユーザ無効化

class Monad m => UserOutputPort m where
  handleOutput :: String -> m ()

-- ★問題：findUser が IO 型クラスとして Domain に露出（項目 #47）
class Monad m => UserFinder m where
  findUser     :: Int -> m (Maybe User)
  searchByName :: String -> m [User]

instance (UserRepository m, UserOutputPort m, UserFinder m) => UserUseCase m where
  registerUser dto = do
    let newUser = User 1 (UserName $ dtoName dto) (UserEmail $ dtoEmail dto)
    saveUser newUser
    handleOutput $ "User: " ++ dtoName dto ++ " has been registered."

  -- ★問題だらけのユーザ名修正
  correctUserName uid newName = do
    -- 問題(#2): バリデーションが後段。空文字でも UserName が作れる
    -- 問題(#3): 状態がない。停止中ユーザの名前も変更できてしまう
    -- 問題(#7): エラーが String。呼び出し元で分岐できない
    -- 問題(#21): 上書き。訂正の事実が消える
    -- 問題(#24): 履歴なし。誰が・いつ変えたか分からない
    let updated = User uid (UserName newName) (UserEmail "unknown")
    saveUser updated
    handleOutput $ "User " ++ show uid ++ " name corrected to: " ++ newName

  -- ★問題だらけのユーザ名検索
  searchUserByName name = do
    -- 問題(#59): Read モデルがない。Write 用エンティティをそのまま返す
    -- 問題(#62): DTO がない。内部構造がそのまま外に漏れる
    -- 問題(#63): Domain 型を Read に再利用。表示要件が Domain を汚す
    -- 問題(#2):  入力バリデーションなし
    users <- searchByName name
    handleOutput $ "Found " ++ show (length users) ++ " users."
    pure users

  -- ★問題だらけのユーザ無効化
  deactivateUser uid = do
    -- 問題(#3):  状態がない。既に無効化済みでも再度無効化できる
    -- 問題(#21): 物理削除。事実の記録が消える。監査不可
    -- 問題(#24): 履歴なし。誰が・いつ・なぜ無効化したか分からない
    -- 問題(#39): 復旧手段がない。削除は取り消せない
    deleteUser uid
    handleOutput $ "User " ++ show uid ++ " has been deactivated (deleted)."

--------------------------------------------------------------------------------
-- 3. Infrastructure Layer
--------------------------------------------------------------------------------

instance UserRepository IO where
  saveUser user = putStrLn $ "[Infra] saved: " ++ show user
  deleteUser uid = putStrLn $ "[Infra] DELETED user: " ++ show uid

-- ★問題(#45): findUser も暗黙 DI。依存が増えるほど推論が不透明
instance UserFinder IO where
  findUser uid = do
    putStrLn $ "[Infra] loading user: " ++ show uid
    pure $ Just (User uid (UserName "Old Name") (UserEmail "old@example.com"))
  searchByName name = do
    putStrLn $ "[Infra] searching users by name: " ++ name
    pure [User 1 (UserName name) (UserEmail "found@example.com")]

--------------------------------------------------------------------------------
-- 4. Adapter Layer
--------------------------------------------------------------------------------

instance UserOutputPort IO where
  handleOutput msg = putStrLn $ "[Adapter] " ++ msg

data RawParams = RawParams { pName :: String, pEmail :: String }

handleRegisterRequest :: (UserUseCase m) => RawParams -> m ()
handleRegisterRequest params = do
    let dto = UserRequestDto (pName params) (pEmail params)
    registerUser dto

-- ★ユーザ名修正コントローラ
-- 問題(#50): Controller が生の ID/文字列をそのまま UseCase に渡す
-- 問題(#9):  Int の uid は仕訳 ID と取り違えても型が通る
-- 問題(#2):  バリデーションなし。空文字や制御文字もそのまま通過
-- 問題(#62): 修正結果を返さない。Controller が出力を握ると肥大化する
handleCorrectNameRequest :: (UserUseCase m) => Int -> String -> m ()
handleCorrectNameRequest uid newName =
    correctUserName uid newName

-- ★ユーザ名検索コントローラ
-- 問題(#59): Write 用 User をそのまま返す。Read モデル・DTO 分離なし
-- 問題(#9):  戻り値の [User] にドメイン内部がそのまま露出
handleSearchRequest :: (UserUseCase m) => String -> m [User]
handleSearchRequest = searchUserByName

-- ★ユーザ無効化コントローラ
-- 問題(#9):  Int の uid に型安全性がない
-- 問題(#24): 理由 (reason) を受け取る口がない。監査不可
handleDeactivateRequest :: (UserUseCase m) => Int -> m ()
handleDeactivateRequest = deactivateUser

--------------------------------------------------------------------------------
-- 5. Main
--------------------------------------------------------------------------------

main :: IO ()
main = do
    let input = RawParams "Pacho" "pacho@jocarium.productions"
    handleRegisterRequest input
    -- ★上書き修正。履歴なし、監査証跡なし、Policy 検証なし
    handleCorrectNameRequest 1 "Pacho Corrected"
    -- ★検索：Write 用エンティティがそのまま返る。DTO 分離なし
    results <- handleSearchRequest "Pacho"
    putStrLn $ "[Main] search results: " ++ show results
    -- ★物理削除。イベントも状態遷移もなし。復旧不可
    handleDeactivateRequest 1
```

### 何が問題か

| 問題 | 内容 |
|------|------|
| 中央集権的 DI | `UndecidableInstances` でコンパイラにインスタンス解決を委ねている。依存の出所がコードに現れない。依存先が増えるほど推論が不透明になる。 |
| 型の区別がない | `UserName String` と `UserEmail String` は中身が同じ `String`。通貨コードと勘定科目コードを取り違えても型が通る。 |
| 状態が存在しない | `User` は常に一つの形しか取れない。未登録・有効・停止といった業務上の状態区分がなく、不正状態を構造的に排除できない。 |
| バリデーションが不在 | 値の妥当性を生成時に検証していない。不正な `Email` がドメイン内部に入り込む。 |
| IO がドメインに侵入 | `saveUser` が `IO` モナドの型クラスとしてドメイン層に定義されている。テスト時にモックが必要になり、純粋性が失われる。 |
| 全体が単一の整合性境界 | 集約境界が定義されておらず、全体が一つの塊として動く。変更が波及する範囲が不明。 |
| 修正が上書き | `correctUserName` は `saveUser` で現在値を上書きする。訂正の事実（誰が・いつ・なぜ）が消える。監査不可。 |
| 修正に状態チェックがない | 停止中ユーザの名前も修正できてしまう。状態を持たないので構造的に防げない。 |
| ID が型で守られていない | `correctUserName :: Int -> String -> m ()` の `Int` は仕訳 ID でも通る。 |
| 検索が Write モデルを返す | `searchUserByName` は Write 用の `User` をそのまま返す。Read モデルも DTO 分離もない。表示要件の変更が Domain に波及する。 |
| 無効化が物理削除 | `deleteUser` でレコードを消す。イベントも状態遷移もない。誰が・いつ・なぜ無効化したか不明。復旧手段もない。 |
| 暗黙 DI の雪だるま | `searchUserByName` の追加で `UserFinder m` 制約が増殖。`UndecidableInstances` の依存連鎖がさらに不透明になる。 |

---

## 開発ポリシー 69 項

ERP では、通貨コード・会社コード・勘定科目コード・仕訳 ID・承認 ID など、似た文字列や数値が大量に交差する。
型の区別が曖昧な設計は、この規模で必ず事故を起こす。以下の 69 項は、その事故を構造的に防ぐための制約である。

---

### 1. ドメイン設計（1〜12）

Haskell の `newtype` はゼロコスト抽象化であり、他言語のラッパークラスとは異なりランタイムペナルティがない。
GADT と DataKinds を組み合わせることで、状態ごとに許可される操作をコンパイル時に制約できる。
これが「Haskell を使っている」と「Haskell でしか書けない」の分岐点である。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 1 | 値オブジェクトの型分離 | `String` を `newtype` で包んでも中身は同じ文字列。メールアドレスと表示名を取り違えても型が通る。 | `newtype` で意味ごとに型を分ける。コンストラクタをエクスポートせず、スマートコンストラクタで妥当性を保証する。 |
| 2 | バリデーション位置 | 不正値を受け取ってから `if` で弾く構造。入力元が複数ある ERP では、弾く箇所が散在して不具合調査コストが上がる。 | `mkEmail :: Text -> Either DomainError Email` のように、値の生成時に妥当性を確定する。以後の関数は妥当な値だけを受け取る。 |
| 3 | 不正状態の表現 | 「未登録だが有効化済み」のような不正状態が構造上作れる。コンパイラが守るべき領域を実行時に押し戻している。 | ★ GADT + DataKinds で状態を型引数に置く。`User 'Pending` と `User 'Active` を別の型にし、不正な組み合わせをコンパイルエラーにする。 |
| 4 | 状態管理の曖昧さ | フラグや単一の `UserStatus` 列挙型に寄せている。承認待ち・差戻し・暫定・締め済みが増えるたびに `case` が膨張する。 | ★ 状態を型引数として表現し、遷移関数 `activate :: User 'Pending -> User 'Active` のように、呼べる操作を型で制約する。 |
| 5 | 遷移の暗黙性 | どの操作がどの状態から呼べるかが関数内部の `if`/`case` に埋もれている。読まないと分からないルール。 | 遷移ルールを独立した関数として外に出す。★ 型シグネチャ自体が「何から何へ」の仕様書になる。 |
| 6 | 部分状態の扱い | 完全な `User` だけを前提にしている。業務の途中状態（未確定・暫定・エラー含み）を表現できない。 | `PendingUser` / `DraftUser` のように、不完全な状態を別型で表す。完全状態への変換を関数として明示する。 |
| 7 | エラー型の設計 | エラーが `String` メッセージ。集計・分岐・回復処理に使えない。 | 専用 ADT でエラーを分類する：入力エラー、業務ルール違反、整合性破壊、インフラ障害。パターンマッチで網羅性検査が効く。 |
| 8 | 集約境界 | 単一の `User` に寄せすぎて整合性境界が曖昧。会社・仕訳・勘定・通貨・連結対象が密結合になる。 | Aggregate を明示する。User 単位・会計仕訳単位・連結単位で境界を分け、境界を越える操作を型で制約する。 |
| 9 | ID の扱い | `Int` や `Text` の生 ID がそのまま使われている。別ドメインの ID を誤って渡しても型で止められない。 | `newtype UserId = UserId UUID` のように ID ごとに型を分ける。外部からの生 ID は境界で検証してから内部型に変換する。 |
| 10 | ロジックの散在 | 保存・検証・出力が UseCase や Controller に分散している。会計ルール変更が複数箇所に波及する。 | ドメインルールは純粋関数に集約する。IO はアプリケーション層の外殻に限定する。★ Haskell の純粋関数は参照透過であり、副作用を含まないことがコンパイラにより保証される。 |
| 11 | 型の粒度 | 意味の違う概念が同じ型に入っている。email と status と name が同じ粒度で扱われ、仕様の曖昧さに直結する。 | 値の意味単位で型を切る。★ `newtype` はゼロコストなので、粒度を細かくしてもランタイム負荷がない。 |
| 12 | モデル進化戦略 | 構造変更がそのまま破壊的変更になる。IFRS 変更で長期進化する ERP では数年で行き詰まる。 | イベント型のバージョニングを前提にする。`V1`/`V2` のように進化させ、古いデータから新しいモデルへの変換関数を持つ。 |

---

### 2. 状態管理・FSM（13〜20）

Haskell の GADT は、各コンストラクタが異なる型を返せる。
これにより、状態遷移の正しさをパターンマッチの網羅性検査で保証できる。
巨大な `case` 式を中央に置くのではなく、状態ごと・イベントごとに小さな関数を切り、
中央には「ルーティングだけ」の目次を置く。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 13 | if/case 依存 | 状態遷移が `case`/`if` の条件分岐に依存。条件が増えるほど保守しにくい。 | ★ GADT と状態別関数で遷移可能性を型と関数の両方で表現する。不正な遷移は型が通らない。 |
| 14 | 不正遷移の検知 | 不正な遷移を実行時に弾くだけ。本番で動いてから初めて問題が見える。 | ★ 遷移関数の型シグネチャで制約する。`activate :: User 'Pending -> ...` は `User 'Active` に対してコンパイルエラーになる。 |
| 15 | 状態表現の薄さ | enum 的な表現では、状態ごとの保持データと許可操作の違いが型に現れない。 | ★ GADT の各コンストラクタに、状態固有のフィールドを持たせる。状態ごとに扱えるデータが異なることを構造で示す。 |
| 16 | FSM の中央集約不足 | 遷移ルールが散在するか、巨大な関数に集中するか、どちらも問題。 | 中央ルーターはディスパッチだけに限定する。処理本体はイベント単位・状態単位の個別関数に切り出す。 |
| 17 | 全体像の不可視 | 個々の遷移を分散させると全体の業務フローが見えない。監査で全体像を示せない。 | `transitions` リストを「目次」として残す。一覧性と分割を両立する。 |
| 18 | 拡張性 | 巨大な `applyEvent` は状態やイベントが増えるたびに壊れやすい。 | 中央はルーティングのみ。各イベント関数を追加するだけで拡張する。 |
| 19 | 状態爆発 | 正確にしようとすると状態の組み合わせが爆発する。全件を型で閉じたい誘惑に負けやすい。 | 業務上意味のある状態だけを型化する。例外は `ManualAdjustment` ルートに逃がす。 |
| 20 | 動的判定への回帰 | 存在型 `SomeUser` を使うと判定が実行時に戻る。 | ★ Domain 層では具体型 `User 'Pending` / `User 'Active` を直接扱う。存在型は Application 層のみで使い、型消去の範囲を限定する。 |

---

### 3. Event Sourcing（21〜30）

ERP では「何が今あるか」より「何が起きたか」のほうが重要である。
Event Sourcing はイベント列を唯一の事実とし、現在値を再構築結果にする。
Haskell の純粋関数は参照透過なので、同じイベント列から常に同じ状態が再現される。
この再現性の保証は、副作用を型で分離する Haskell の特性に依存している。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 21 | 真実の所在 | DB の現在値が真実。監査や遡及修正に対応できない。 | イベントを唯一の事実として保存する。現在値はイベント列からの再構築結果にすぎない。 |
| 22 | 再構築の未実装 | イベントを貯めるだけでは Event Sourcing の利点が出ない。 | `rehydrate :: [UserEvent] -> Either DomainError SomeUser` を中心に据え、履歴から状態を再生する。 |
| 23 | イベントの曖昧さ | 「変更」という曖昧なイベント名は、登録・訂正・手動修正・取消の区別を消す。 | イベントは業務の事実に対応させる。`Registered` / `Corrected` / `ManualAdjustment` を明確に分ける。 |
| 24 | 訂正の扱い | 上書きは履歴を消す。監査と再現性を破壊する。 | 訂正は新イベントとして積む。過去を消さず「修正した事実」を記録する。 |
| 25 | 監査性 | 誰が・いつ・なぜ変えたかが見えないと監査価値がない。 | `recordedAt` / `effectiveAt` と実行者・承認者のメタ情報をイベントに持たせる。 |
| 26 | 冪等性 | 同じイベントの二重適用を防ぐ仕組みがない。再送や重複登録は実運用で普通に起きる。 | version と idempotency key で二重適用を防ぐ。 |
| 27 | イベント肥大化 | 一つの型に全情報を詰め込むと、成長に伴い変換が困難になる。 | バージョンごとにイベント型を分ける。`EventPayloadV1` / `EventPayloadV2` と互換性変換を明示する。 |
| 28 | スキーマ変更 | ルール変更で既存イベントの意味が変わると過去データの再生が壊れる。 | `V1`/`V2` のようにイベントを進化させ、古い型から新しい型への変換関数を持つ。 |
| 29 | イベント粒度 | 粗すぎると監査で使えない。細かすぎると業務の意味が消える。 | 業務単位で意味のある粒度に固定する。再計算に必要な情報だけを持たせる。 |
| 30 | 再現性 | 外部条件（現在時刻、乱数）をロジックに混ぜると再現性が壊れる。 | ★ イベント本体に必要情報を閉じ込める。Haskell の純粋関数は外部状態に依存しないことが型で保証されるため、再現性が構造的に守られる。 |

---

### 4. Policy / 業務ルール（31〜38）

会計ルールは法改正・IFRS 改定・テナント差分で変化する。
ルールをコードに直書きすると、変更のたびに全体を触ることになる。
Policy を純粋関数として独立させ、`Monoid` のように合成する。
この合成可能性は、Haskell の関数が第一級値であることに依存している。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 31 | ルールの硬直化 | ルールがコードに直書き。法改正のたびにコード修正が必要。 | Policy を独立した純粋関数として外出しする。差し替え可能な単位にする。 |
| 32 | 文脈の欠如 | 「何の会社か」「いつの基準か」を見ていない。同じ処理が常に同じ結果になる。 | `Context`（テナント、日付、制度、基準年度）を引数として渡す。 |
| 33 | 合成性の不足 | ルールが単一関数だと、追加のたびに巨大 if 文になる。 | ★ `type Policy = Context -> State -> Event -> Either Error ()` とし、`combine :: [Policy] -> Policy` で合成する。Haskell では関数そのものがデータとして扱え、リストに入れて畳める。 |
| 34 | テストしづらさ | ルールが IO や状態と混ざると単体テストが重い。 | ★ Policy を純粋関数にする。入力と出力だけで検証でき、IO モックが不要。 |
| 35 | IFRS の差し替え | IFRS の変化をコード修正で受け止める前提。年度や解釈差分に対応できない。 | 基準ごとの Policy を分け、`Context` の基準年度やテナントで切り替える。 |
| 36 | 例外処理の一律化 | すべての例外を同じ扱いにしている。承認待ち・差戻し・臨時修正は別扱いが必要。 | ★ ADT でエラーを分類し、パターンマッチで網羅性を検査する。 |
| 37 | ルールの可観測性 | 何が適用されたか追いにくい。監査で「どのルールが通ったか」を示せない。 | 適用された Policy の名前をログに記録する。Policy を値として扱えるので、適用履歴を自然に残せる。 |
| 38 | 変更耐性 | ルールが散在していると法改正時に修正が局所化しない。 | ★ 合成可能な Policy にすることで、変更は一つの Policy 関数の差し替えで済む。 |

---

### 5. Manual Adjustment / 救済措置（39〜43）

型で完全に閉じると、現場で「どうしても直したい」ケースに対応できなくなる。
ルールが硬すぎるとユーザは別帳票や手作業に逃げる。ERP は使われなくなると意味がない。
解は「裏口」ではなく「型安全な救済ルート」の設計にある。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 39 | 現実対応 | 型安全に閉じると誤入力や遡及修正に対応できない。 | `ManualAdjustment` を正規のイベントとして定義する。裏口ではなく公式ルート。 |
| 40 | 監査証跡 | 裏口修正は誰が何を変えたか分からない。会計システムとして不可。 | 修正は必ずイベントとして残す。理由・承認者をフィールドに持たせる。 |
| 41 | 型安全の崩壊リスク | 裏口は型安全を回避する通路になりやすい。 | ★ 例外イベントでも GADT の型を維持する。状態を壊さず、値だけを変える遷移関数を定義する。 |
| 42 | Policy の迂回 | ManualAdjustment が単なる policy bypass になると通常ルールが無効化される。 | ★ 例外用の独立した Policy を定義し、`routePolicy` でイベント種別に応じて適用する Policy を切り替える。bypass ではなく、別の正規ルート。 |
| 43 | 運用の硬直 | ルールが硬すぎると現場が逃げる。 | 「救済可能だが監査可能」という中間点を設計する。承認と理由の記録を必須にする。 |

---

### 6. アーキテクチャ（44〜50）

アンチパターンの型クラス DI（`UndecidableInstances`）は、依存解決をコンパイラに委ねる中央集権型である。
依存先が増えるとインスタンス衝突や推論の不透明化が起きる。
改善例では `ReaderT Env` とレコード of functions で依存を値として渡す。
この方式は、何に依存しているかがコードに直接現れ、テスト時の差し替えも明示的になる。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 44 | 層の分離 | Domain / Application / Infrastructure / Adapter の境界が見えない。責務が混ざる。 | 層を明示し、依存方向を一方向に固定する。Domain は外部に依存しない。 |
| 45 | DI の暗黙化 | 型クラス DI は依存の出所が見えない。チーム運用でブラックボックス化する。 | ★ `ReaderT Env` で依存を値として渡す。Env のレコードフィールドが依存の一覧になる。 |
| 46 | Port 設計 | class ベースの Port は複雑化するとインスタンス衝突や推論難化が起きる。 | レコード of functions で Port を注入する。何に依存しているか明示される。 |
| 47 | 副作用混在 | IO がドメインに侵入する。テストも障害切り分けも困難。 | ★ Domain は純粋関数のみ。IO は Application 層の外殻に限定する。Haskell はこの分離を型で強制できる。 |
| 48 | テスト容易性 | IO とロジックが混ざるとモック地獄になる。ERP はルールが多く、検証速度が生命線。 | ★ 純粋ロジックを先に作り、IO 層を薄くする。純粋関数のテストに IO は不要。 |
| 49 | 依存方向 | アダプタやインフラが中心に寄ると、下層から上層へ依存が逆流する。 | Port/Adapter を守り、Domain が最内層で自立する構造にする。 |
| 50 | Controller の密結合 | Controller が直接ロジックや永続化に触ると、UI 変更が業務ロジックに伝播する。 | Controller は DTO を受けて UseCase を呼ぶだけにする。 |

---

### 7. 並行性・整合性（51〜55）

ERP は複数人が同時に同じデータを操作する。
楽観ロックとイベントバージョニングを組み合わせ、
競合を検知して再試行する仕組みが必要である。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 51 | 同時更新 | 単発実行前提。複数人の同時編集で衝突が起きる。 | 楽観ロックを入れる。期待バージョンと実測バージョンの差を検知する。 |
| 52 | Version 管理 | 単純な増分だけでは競合時の再試行や欠番の扱いが曖昧。 | Event に version を持たせ、append 時に一致を確認する。 |
| 53 | 整合性の保証 | 「たぶん大丈夫」の設計は障害時に何が壊れたか読めない。 | 型で守れるものは型で守る。残りは version と整合性チェックで補う。 |
| 54 | 障害検知 | 欠損・重複・順序崩れの検知がないと、壊れた履歴をそのまま再生する。 | gap 検知、重複検知、再構築時の検証を入れる。 |
| 55 | リトライ戦略 | 競合時の再試行ルールがないと運用で失敗が蓄積する。 | 再ロード → 再評価 → 再送の方針を定める。 |

---

### 8. 時間軸・IFRS（56〜58）

会計判断はシステム時刻ではなく業務上の日付に依存する。
IFRS では過去時点に遡って見直す必要があり、時間軸が一つでは破綻する。
Bitemporal（記録時刻と有効時刻の二軸）が前提になる。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 56 | 時刻の未使用 | `UTCTime` を用意しても使っていない。「いつ起きたか」が残らない。 | `recordedAt` を必須にし、処理時刻を全イベントに記録する。 |
| 57 | 業務日付の欠如 | 締め日や有効開始日を無視すると月次・四半期の整合が崩れる。 | `effectiveAt` を持ち、記録日と業務日を分離する。 |
| 58 | 遡及修正の不可能性 | 時間軸が一つしかないと過去の状態再現や訂正処理ができない。 | Bitemporal を前提にする。記録時刻と有効時刻の両方を保存し、任意時点の状態を再現可能にする。 |

---

### 9. CQRS（59〜69）

CQRS は Write モデルと Read モデルを分離する。
Write モデルはドメイン層のエンティティそのものである（GADT で状態遷移を型制約する集約）。
Read モデルは Write とは独立した構造を持ち、参照に最適化された形でデータを保持する。

本システムでは **Write 側に SQLite、Read 側に RocksDB** を使う。
SQLite はイベントの append-only ストアとして ACID を保証し、
RocksDB は非正規化された Read モデルを KV ペアとして高速に参照する。
どちらもローカルファイルベースの組み込み DB であり、外部サービスへの依存がない。

Write API が SQLite にイベントを書き込んだ後、非同期の Projector スレッドが
イベントを読み取り、RocksDB の Read モデルを更新する。
Haskell の軽量スレッドと STM（Software Transactional Memory）により、
この非同期パイプラインはメッセージブローカーなしで安全に実現できる。
`forkIO` で起動した Projector スレッドが `TBQueue` でイベント通知を受け取り、
純粋な畳み込み関数で中間レコードを構築し、RocksDB に書き込む。
GHC ランタイムが数万スレッドを OS スレッド数本で多重化するので、
Projector を集約単位・ビュー単位で並列化してもオーバーヘッドは小さい。

この分離を正しく配置しないと、CQRS は名前だけになる。

#### CQRS 崩壊パターン

以下は全て NG である。

| パターン | なぜ崩壊するか |
|----------|--------------|
| QueryService が Repository に直結 | Read が Write のストレージ構造に依存する。スキーマ変更が Read に波及し、分離の意味がない。 |
| DTO が DB 構造そのまま | 表示要件とストレージ構造が密結合する。UI 変更のたびに DB を触ることになる。 |
| Domain エンティティを Read で再利用 | Write モデルの GADT や状態遷移を Read 側が引きずる。Read は「今の値を見せる」だけなので、状態機械は不要。 |
| Projection が DTO を直接返す | UI 変更が Infrastructure 層に波及する。Projection と表示形式が密結合し、独立に進化できない。 |
| DTO が一種類しかない | QueryService が Adapter 層の外部 DTO を直接返すと、UseCase が表示層に依存する。 |

#### 正しい思考モデル

Read 側は四つの概念に分かれる。それぞれ別の責務を持つ。混ぜると壊れる。

| 概念 | 責務 | 層 |
|------|------|-----|
| **Projection** | イベント列から Read 用の中間レコードを構築する。Write の集約構造とは無関係。DTO は作らない。 | Infrastructure |
| **QueryService** | 「何を」「どの条件で」取得するかを定義し、中間レコードを内部 DTO に変換する。Projection の存在を知らない。 | Application |
| **内部 DTO** | QueryService の返り値。UseCase が扱うデータの形。外部表現ではない。 | Application |
| **外部 DTO** | API や UI に渡す最終形。内部 DTO から変換する。表示ラベルやフォーマットはここで付与する。 | Adapter |

#### 配置の原則

```
Write 側                          Read 側
─────────────────────────         ─────────────────────────
Domain   : User 'Pending          （なし：Domain は Write 専用）
           User 'Active
           遷移関数・Policy

Application : execute (Command)   QueryService (Query → 内部DTO)
              EventPayload          ↑ Port（型シグネチャのみ）

Infrastructure : SQLite (EventStore)  RocksDB (Read Store)
                 envAppend            Projection（非同期・イベント → 中間レコード）
                 envLoad              QueryPort の実装

Adapter : Controller               内部DTO → 外部DTO 変換・レスポンス生成
```

- **Write 側の SQLite** はイベントの append-only ストア。`envAppend` / `envLoad` が直接操作する。
- **Read 側の RocksDB** は非正規化された中間レコードの KV ストア。Projection が非同期で更新する。
- **Projection は Infrastructure 層にいる。** SQLite からイベントを読み、純粋関数で中間レコードを構築し、RocksDB に書き込む。DTO は作らない。
- **非同期 Projector** は `forkIO` + `TBQueue` で実装する。Write のコミット完了後にイベント通知を送り、Projector スレッドが RocksDB を更新する。Eventually Consistent。
- **QueryService の Port（型シグネチャ）は Application 層に定義する。** 実装は Infrastructure 層で RocksDB を参照する。返り値は内部 DTO。
- **外部 DTO は Adapter 層にいる。** 内部 DTO を外部表現に変換する。

#### Haskell での表現

```hs
-- Infrastructure 層：Projection が作る中間レコード（DTO ではない）
data UserSummaryRecord = UserSummaryRecord
  { recId    :: Text
  , recName  :: Text    -- ★ ユーザ名も Read モデルに保持
  , recEmail :: Text
  , recState :: Text    -- "pending" | "active"
  } deriving Show

-- Infrastructure 層：Projection（イベント列から中間レコードを構築）
projectUserSummary :: [UserEvent] -> Maybe UserSummaryRecord
projectUserSummary = foldl' go Nothing
  where
    go _ (UserEvent _ _ _ (V1 (Registered (UserId uid) (UserName n) (Email e)))) =
      Just $ UserSummaryRecord uid n e "pending"
    go (Just r) (UserEvent _ _ _ (V1 (Activated _))) =
      Just $ r { recState = "active" }
    go (Just r) (UserEvent _ _ _ (V2 (EmailCorrected _ (Email e)))) =
      Just $ r { recEmail = e }
    go (Just r) (UserEvent _ _ _ (V2 (NameCorrected _ (UserName n)))) =
      Just $ r { recName = n }   -- ★ ユーザ名訂正も Projection に反映
    go (Just r) (UserEvent _ _ _ (V2 (Deactivated _))) =
      Just $ r { recState = "inactive" }  -- ★ 無効化も Projection に反映
    go (Just r) (UserEvent _ _ _ (V2 (ManualAdjustment (Email e)))) =
      Just $ r { recEmail = e }
    go s _ = s

-- Application 層：内部 DTO（UseCase が扱う形）
data UserSummary = UserSummary
  { summaryId    :: Text
  , summaryName  :: Text
  , summaryEmail :: Text
  , summaryState :: Text
  } deriving Show

-- Application 層：QueryService の Port（レコード of functions）
data QueryPort m = QueryPort
  { findUserSummary :: UserId -> m (Maybe UserSummary)
  , listActiveUsers :: m [UserSummary]
  , searchByName    :: Text -> m [UserSummary]  -- ★ 名前検索（項目 #59, #61）
  }

-- Application 層：中間レコード → 内部 DTO 変換
toSummary :: UserSummaryRecord -> UserSummary
toSummary r = UserSummary (recId r) (recName r) (recEmail r) (recState r)

-- Adapter 層：外部 DTO（API レスポンス用）
data UserSummaryResponse = UserSummaryResponse
  { respId    :: Text
  , respName  :: Text
  , respEmail :: Text
  , respState :: Text
  , respLabel :: Text   -- 表示用ラベル（"有効" / "保留中"）
  } deriving Show

-- Adapter 層：内部 DTO → 外部 DTO 変換
toResponse :: UserSummary -> UserSummaryResponse
toResponse s = UserSummaryResponse
  (summaryId s) (summaryName s) (summaryEmail s) (summaryState s)
  (case summaryState s of
    "active"   -> "有効"
    "inactive" -> "無効"
    _          -> "保留中")
```

ポイントは四つ。

1. **Projection は中間レコードを返す。DTO を直接作らない。** UI 変更が Infrastructure に波及しない。
2. **内部 DTO（`UserSummary`）は Application 層。** QueryService のユースケースロジックがここに住む。
3. **外部 DTO（`UserSummaryResponse`）は Adapter 層。** 表示ラベルやフォーマットはここで付与する。
4. **`projectUserSummary` は純粋関数。** Write の `rehydrate` とは独立している。

| # | 観点 | 問題 | 改善 |
|---|------|------|------|
| 59 | Write/Read の未分離 | 同じエンティティを参照と更新の両方に使う。表示要件が変わるたびに集約が汚れる。 | Write モデル（GADT 集約）と Read モデル（Projection + DTO）を完全に分離する。 |
| 60 | Projection の層違反 | Projection を Application 層に置く。Application がストレージ構造を知ってしまう。 | Projection は Infrastructure 層に置く。イベントストアからの読み出しと中間レコードの生成はインフラの責務。 |
| 61 | QueryService の直結 | QueryService が Repository や DB に直接アクセスする。Write のスキーマ変更が Read に波及する。 | QueryService の Port を Application 層に定義し、実装を Infrastructure 層に置く。Write のストレージ構造から隔離する。 |
| 62 | DTO の単層化 | DTO が一種類しかなく、UseCase が表示形式に依存するか、Controller にロジックが漏れる。 | 内部 DTO（Application）と外部 DTO（Adapter）に分ける。QueryService は内部 DTO を返し、Adapter が外部 DTO に変換する。 |
| 63 | Domain の Read 再利用 | GADT やスマートコンストラクタを Read 側で再利用する。Read に不要な型制約を持ち込む。 | ★ Read モデルに GADT は使わない。Read の目的は「今の値を見せる」ことであり、状態遷移の正しさは Write が責任を持つ。 |
| 64 | Projection の純粋性 | Projection が IO に依存すると、テストや再実行が困難になる。 | ★ Projection の畳み込みロジックは純粋関数にする。IO はイベントの読み出しと結果の書き込みだけに限定する。 |
| 65 | Read の非正規化 | Read モデルを正規化すると、参照のたびに結合が必要になる。CQRS の利点が消える。 | Read は参照に最適化して非正規化する。冗長性を許容し、クエリ性能を優先する。 |
| 66 | Read の独立進化 | Read と Write のスキーマが密結合すると、一方の変更が他方を壊す。 | Read モデルは Write のイベントスキーマにのみ依存する。イベントが変わらない限り、Read は独立に進化できる。 |
| 67 | Projection が DTO を直接返す | UI 変更が Infrastructure 層に波及する。Projection と表示形式が密結合する。 | Projection は中間レコードを返す。DTO への変換は Application 層以上で行う。 |
| 68 | Read の整合性レベル | Read が常に最新であることを前提にすると、設計が壊れる。 | Read（RocksDB）は Eventually Consistent であることを明示する。最新性が必要な場合は Write 側（SQLite）に問い合わせる。 |
| 69 | Projection 更新戦略 | 同期か非同期かが未定義だと、レイテンシとスループットのトレードオフが読めない。 | 本システムでは非同期を採用する。SQLite への書き込み完了後、`forkIO` + `TBQueue` で Projector スレッドに通知し、RocksDB を更新する。Haskell の軽量スレッドと STM により、外部メッセージブローカーなしで安全に非同期化できる。 |

---

## まとめ

69 項目の本質は四つに集約される。

**第一に、構造の問題。** アンチパターンのコードは動くが、壊れ方が読めない。
状態を型に寄せ、イベントを唯一の事実とし、Policy を分離し、ManualAdjustment を正規ルートにし、
version と bitemporal を持ち込むことで、ERP に必要な監査性と変更耐性を得る。

**第二に、言語の選択理由。** Haskell の強みは難解さではない。
GADT による不正状態の構造的排除、純粋関数による参照透過なドメインロジック、
`newtype` のゼロコスト型区別、パターンマッチの網羅性検査。
さらに、GHC の軽量スレッドと STM は、Write（SQLite）から Read（RocksDB）への
非同期 Projection パイプラインを、外部インフラなしで安全に実現する。
これらは、壊れると致命的な会計領域で事故を構造的に防ぐ仕組みであり、
他言語の型システムでは同等の保証を得られない。

**第三に、インフラの最小化。**
SQLite と RocksDB はどちらもローカルファイルベースの組み込み DB である。
サーバもコンテナもメッセージブローカーも不要。実行バイナリとデータファイルだけで完結する。
オフラインで動き、デプロイは単一バイナリのコピーで済む。

**第四に、最大のリスクは技術ではなく運用である。**
抽象が強いほど、チームが守れないと逆に壊れる。
この 69 項目は「コードの正解」ではなく「組織が維持すべき制約」である。

---

## 改善例

以下のコードは 69 項のうち中核的な項目を反映している。

```hs
{-# LANGUAGE GADTs #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE KindSignatures #-}
{-# LANGUAGE RankNTypes #-}
{-# LANGUAGE OverloadedStrings #-}

import Control.Monad        (foldM, unless)
import Control.Monad.Reader  (ReaderT, ask, runReaderT)
import Control.Monad.Except  (ExceptT, throwError, runExceptT, liftEither)
import Control.Monad.IO.Class (liftIO)
import Data.Bifunctor        (first)
import Data.Text             (Text)
import qualified Data.Text as T
import Data.Time             (UTCTime, Day, getCurrentTime)

--------------------------------------------------------------------------------
-- 1. Domain: 型・状態・エラー
--    ★ GADT + DataKinds で不正状態を構造的に排除する（項目 #3, #4, #14）
--    ★ スマートコンストラクタで値の妥当性を生成時に確定する（項目 #1, #2）
--    ★ エラーは専用 ADT で分類する（項目 #7）
--------------------------------------------------------------------------------

-- エラー型（Policy・FSM 双方で使う。先に定義する）
data DomainError
  = InvalidEmail
  | InvalidUserName        -- ★ユーザ名バリデーション用（項目 #2, #7）
  | IllegalTransition
  | AdjustmentRequiresReason
  deriving Show

-- 値オブジェクト（コンストラクタ非公開＋スマートコンストラクタ）
newtype UserId   = UserId Text   deriving Show
newtype UserName = UserName Text deriving Show  -- ★ユーザ名も newtype（項目 #1, #11）
newtype Email    = Email Text    deriving Show
newtype Version  = Version Int   deriving (Show, Eq, Ord)

-- スマートコンストラクタ：不正な Email は作れない（項目 #2）
mkEmail :: Text -> Either DomainError Email
mkEmail e
  | "@" `T.isInfixOf` e = Right (Email e)
  | otherwise            = Left InvalidEmail

-- スマートコンストラクタ：空文字や長すぎるユーザ名は作れない（項目 #2）
mkUserName :: Text -> Either DomainError UserName
mkUserName n
  | T.null n         = Left InvalidUserName
  | T.length n > 100 = Left InvalidUserName
  | otherwise         = Right (UserName n)

nextVersion :: Version -> Version
nextVersion (Version v) = Version (v + 1)

-- 状態遷移を型で表現（項目 #3, #4, #13, #14）
data UserState = Pending | Active | Inactive  -- ★ 無効化状態を追加（項目 #4）

-- ★ ユーザ名を GADT の各コンストラクタに保持する（項目 #15）
data User (s :: UserState) where
  UserP :: UserId -> UserName -> Email -> Version -> User 'Pending
  UserA :: UserId -> UserName -> Email -> Version -> User 'Active
  UserD :: UserId -> UserName -> Email -> Version -> User 'Inactive

-- Application 層でのみ使う存在型（項目 #20：型消去の範囲を限定）
data SomeUser where
  SomeUser :: User s -> SomeUser

--------------------------------------------------------------------------------
-- 2. Event: 進化可能なスキーマ（項目 #12, #27, #28）
--    バージョンごとに型を分け、互換性変換を明示する。
--------------------------------------------------------------------------------

data EventPayloadV1
  = Registered UserId UserName Email   -- ★ 登録時にユーザ名を含む
  | Activated  UserId
  deriving Show

data EventPayloadV2
  = EmailCorrected UserId Email        -- メール訂正
  | NameCorrected  UserId UserName     -- ★ ユーザ名訂正（項目 #23：イベントを具体的に分ける）
  | Deactivated    UserId              -- ★ 無効化（項目 #4：状態遷移はイベントで表現）
  | ManualAdjustment Email              -- 救済（項目 #39）：正規のイベント
  deriving Show

data EventPayload
  = V1 EventPayloadV1
  | V2 EventPayloadV2
  deriving Show

data UserEvent = UserEvent
  { evVersion     :: Version    -- 楽観ロック用（項目 #51, #52）
  , evRecordedAt  :: UTCTime    -- 記録時刻（項目 #56）
  , evEffectiveAt :: Day        -- 業務日付（項目 #57, #58）
  , evPayload     :: EventPayload
  } deriving Show

--------------------------------------------------------------------------------
-- 3. FSM: イベントごとに遷移を分離し、中央はルーティングだけ
--    （項目 #16, #17, #18）
--------------------------------------------------------------------------------

type Transition = Maybe SomeUser -> UserEvent -> Either DomainError SomeUser

registeredT :: Transition
registeredT Nothing (UserEvent v _ _ (V1 (Registered uid name email))) =
  Right $ SomeUser $ UserP uid name email v
registeredT _ _ = Left IllegalTransition

activatedT :: Transition
activatedT (Just (SomeUser (UserP uid n e _))) (UserEvent v _ _ (V1 (Activated _))) =
  Right $ SomeUser $ UserA uid n e v
activatedT _ _ = Left IllegalTransition

-- ★ メール訂正遷移
emailCorrectedT :: Transition
emailCorrectedT (Just (SomeUser (UserP uid n _ _))) (UserEvent v _ _ (V2 (EmailCorrected _ e))) =
  Right $ SomeUser $ UserP uid n e v
emailCorrectedT (Just (SomeUser (UserA uid n _ _))) (UserEvent v _ _ (V2 (EmailCorrected _ e))) =
  Right $ SomeUser $ UserA uid n e v
emailCorrectedT _ _ = Left IllegalTransition

-- ★ ユーザ名訂正遷移（項目 #5：型シグネチャが仕様書）
-- Active 状態でのみ許可。Pending では名前が未確定なので修正できない。
nameCorrectedT :: Transition
nameCorrectedT (Just (SomeUser (UserA uid _ e _))) (UserEvent v _ _ (V2 (NameCorrected _ n))) =
  Right $ SomeUser $ UserA uid n e v
nameCorrectedT _ _ = Left IllegalTransition

-- ★ 無効化遷移（項目 #4, #5：Active でのみ許可。Pending/Inactive は遷移不可）
-- GADT のパターンマッチにより、UserA 以外は構造的に排除される。
deactivatedT :: Transition
deactivatedT (Just (SomeUser (UserA uid n e _))) (UserEvent v _ _ (V2 (Deactivated _))) =
  Right $ SomeUser $ UserD uid n e v
deactivatedT _ _ = Left IllegalTransition

manualT :: Transition
manualT (Just (SomeUser (UserP uid n _ _))) (UserEvent v _ _ (V2 (ManualAdjustment e))) =
  Right $ SomeUser $ UserP uid n e v
manualT (Just (SomeUser (UserA uid n _ _))) (UserEvent v _ _ (V2 (ManualAdjustment e))) =
  Right $ SomeUser $ UserA uid n e v
manualT _ _ = Left IllegalTransition

-- 中央ルーター：ディスパッチだけ。目次として全遷移を一覧できる（項目 #17）
transitions :: [Transition]
transitions = [registeredT, activatedT, emailCorrectedT, nameCorrectedT, deactivatedT, manualT]

applyEvent :: Maybe SomeUser -> UserEvent -> Either DomainError SomeUser
applyEvent st ev = go transitions
  where
    go []     = Left IllegalTransition
    go (t:ts) = case t st ev of
                  Right s -> Right s
                  Left  _ -> go ts

-- イベント列から状態を再構築する（項目 #22）
-- ★ 純粋関数なので、同じイベント列からは常に同じ結果（項目 #30）
rehydrate :: [UserEvent] -> Either DomainError SomeUser
rehydrate []     = Left IllegalTransition
rehydrate (e:es) = do
  s0 <- applyEvent Nothing e
  foldM (\s ev -> applyEvent (Just s) ev) s0 es

--------------------------------------------------------------------------------
-- 4. Policy: 純粋関数の合成（項目 #31, #33, #34, #42）
--    ★ 関数を値として扱い、リストに入れて畳める。Haskell の第一級関数。
--------------------------------------------------------------------------------

data Context = Context
  { ctxToday :: Day }

type Policy = Context -> Maybe SomeUser -> EventPayload -> Either DomainError ()

-- Policy の合成：全ポリシーが Right を返せば通過（項目 #33）
combine :: [Policy] -> Policy
combine ps ctx s e = mapM_ (\p -> p ctx s e) ps

-- メールバリデーション Policy
emailPolicy :: Policy
emailPolicy _ _ (V1 (Registered _ _ (Email e)))
  | "@" `T.isInfixOf` e = Right ()
  | otherwise            = Left InvalidEmail
emailPolicy _ _ (V2 (EmailCorrected _ (Email e)))
  | "@" `T.isInfixOf` e = Right ()
  | otherwise            = Left InvalidEmail
emailPolicy _ _ _ = Right ()

-- ★ ユーザ名バリデーション Policy（項目 #33：合成可能な Policy として追加するだけ）
namePolicy :: Policy
namePolicy _ _ (V1 (Registered _ (UserName n) _))
  | T.null n  = Left InvalidUserName
  | otherwise = Right ()
namePolicy _ _ (V2 (NameCorrected _ (UserName n)))
  | T.null n  = Left InvalidUserName
  | otherwise = Right ()
namePolicy _ _ _ = Right ()

-- ★ 無効化 Policy（項目 #4, #33：Active 状態でのみ許可。Policy の合成で追加するだけ）
deactivationPolicy :: Policy
deactivationPolicy _ (Just (SomeUser (UserA _ _ _ _))) (V2 (Deactivated _)) = Right ()
deactivationPolicy _ _ (V2 (Deactivated _)) = Left IllegalTransition
deactivationPolicy _ _ _ = Right ()

-- ManualAdjustment 用の独立した Policy（項目 #42：bypass ではなく別ルート）
adjustmentPolicy :: Policy
adjustmentPolicy _ _ (V2 (ManualAdjustment _)) = Right ()
adjustmentPolicy _ _ _                         = Right ()

-- ポリシールーティング：イベント種別に応じて適用する Policy を切り替える
routePolicy :: [Policy] -> Policy -> Policy
routePolicy _standard adjustment ctx st ev@(V2 (ManualAdjustment _)) =
  adjustment ctx st ev
routePolicy standard _adjustment ctx st ev =
  combine standard ctx st ev

--------------------------------------------------------------------------------
-- 5. Application: 楽観ロック + 明示的 DI（項目 #45, #46, #51）
--    ★ ReaderT Env で依存を値として渡す。型クラス DI を廃止。
--------------------------------------------------------------------------------

data AppError
  = DomainErr DomainError
  | VersionConflict
  deriving Show

data Env = Env
  { envLoad    :: UserId -> IO [UserEvent]
  , envAppend  :: UserId -> Version -> UserEvent -> IO Bool
  , envPolicy  :: Policy
  , envContext  :: Context
  }

type AppM = ExceptT AppError (ReaderT Env IO)

-- ドメインエラーをアプリケーションエラーに変換するヘルパー
liftDomain :: Either DomainError a -> AppM a
liftDomain = liftEither . first DomainErr

execute :: UserId -> EventPayload -> AppM ()
execute uid payload = do
  env <- ask
  history <- liftIO $ envLoad env uid
  now     <- liftIO getCurrentTime

  let ctx = envContext env

  -- イベント列から現在状態を再構築（項目 #22）
  state <- liftDomain $ case history of
    [] -> Right Nothing
    xs -> Just <$> rehydrate xs

  -- Policy 適用（項目 #31, #42）
  liftDomain $ envPolicy env ctx state payload

  -- 楽観ロック付き書き込み（項目 #51, #52）
  let currentV = Version (length history)
      ev = UserEvent (nextVersion currentV) now (ctxToday ctx) payload

  ok <- liftIO $ envAppend env uid currentV ev
  unless ok $ throwError VersionConflict

-- ★ ユーザ名修正ユースケース（項目 #50：Controller は UseCase を呼ぶだけ）
-- 呼び出し元は生の Text を渡し、UseCase がスマートコンストラクタで検証する。
correctName :: UserId -> Text -> AppM ()
correctName uid rawName = do
  -- 項目 #2：値の生成時に妥当性を確定
  name <- liftDomain $ mkUserName rawName
  -- 項目 #24：訂正は新イベントとして積む。上書きしない。
  execute uid (V2 (NameCorrected uid name))

-- ★ ユーザ無効化ユースケース（項目 #4：Active → Inactive のみ。FSM + Policy が保証）
deactivate :: UserId -> AppM ()
deactivate uid =
  execute uid (V2 (Deactivated uid))

--------------------------------------------------------------------------------
-- 6. Entry Point
--------------------------------------------------------------------------------

main :: IO ()
main = do
  let ctx = Context (read "2026-04-10")  -- 業務日付（項目 #57）

  let env = Env
        { envLoad    = \_ -> pure []
        , envAppend  = \_ _ ev -> print ev >> pure True
        , envPolicy  = routePolicy [emailPolicy, namePolicy, deactivationPolicy] adjustmentPolicy
        , envContext  = ctx
        }

  -- 登録
  r1 <- runReaderT
    (runExceptT
      (execute
        (UserId "pacho")
        (V1 (Registered (UserId "pacho") (UserName "Pacho") (Email "pacho@jocarium.productions")))))
    env
  print r1

  -- ★ ユーザ名修正（訂正イベントとして積む。上書きではない）
  r2 <- runReaderT
    (runExceptT
      (correctName (UserId "pacho") "Pacho Corrected"))
    env
  print r2

  -- ★ ユーザ無効化（Active → Inactive のみ。FSM + Policy が構造的に保証）
  r3 <- runReaderT
    (runExceptT
      (deactivate (UserId "pacho")))
    env
  print r3

  -- ★ Read 側の名前検索は QueryPort 経由（§9 CQRS セクション参照）
  -- searchByName queryPort "Pacho" >>= mapM_ (print . toResponse)
  -- Write の Domain 型には触れない。Read は Projection → 中間レコード → 内部 DTO → 外部 DTO。
```
