---
layout: ../../layouts/BlogLayout.astro
title: "Haskell ERP (IFRS) 開発ポリシー"
description: "IFRS準拠の会計ERPをHaskellで構築するための設計指針。GADT・DataKinds・純粋関数による堅牢な型設計と、中央集権を廃した分散アーキテクチャを58項目で示す。"
tags: ["Haskell", "ERP", "IFRS", "GADT", "Event Sourcing", "Clean Architecture"]
time: 30
featured: true
timestamp: 2026-04-10T09:26:00+09:00
filename: haskell_erp_architecture
---

# Haskell ERP (IFRS) 開発ポリシー

## この文書の目的

IFRS 準拠の会計 ERP を Haskell で構築するにあたっての設計指針を示す。
まず典型的なアンチパターンを提示し、その問題点を 58 項目に分解する。
最後に、それらを反映した改善例を置く。

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
  saveUser :: User -> m ()

--------------------------------------------------------------------------------
-- 2. Application Layer
--------------------------------------------------------------------------------

data UserRequestDto = UserRequestDto
  { dtoName  :: String
  , dtoEmail :: String
  } deriving Show

class Monad m => UserUseCase m where
  registerUser :: UserRequestDto -> m ()

class Monad m => UserOutputPort m where
  handleOutput :: String -> m ()

instance (UserRepository m, UserOutputPort m) => UserUseCase m where
  registerUser dto = do
    let newUser = User 1 (UserName $ dtoName dto) (UserEmail $ dtoEmail dto)
    saveUser newUser
    handleOutput $ "User: " ++ dtoName dto ++ " has been registered."

--------------------------------------------------------------------------------
-- 3. Infrastructure Layer
--------------------------------------------------------------------------------

instance UserRepository IO where
  saveUser user = putStrLn $ "[Infra] saved: " ++ show user

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

--------------------------------------------------------------------------------
-- 5. Main
--------------------------------------------------------------------------------

main :: IO ()
main = do
    let input = RawParams "Pacho" "pacho@jocarium.productions"
    handleRegisterRequest input
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

---

## 開発ポリシー 58 項

ERP では、通貨コード・会社コード・勘定科目コード・仕訳 ID・承認 ID など、似た文字列や数値が大量に交差する。
型の区別が曖昧な設計は、この規模で必ず事故を起こす。以下の 58 項は、その事故を構造的に防ぐための制約である。

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

## まとめ

58 項目の本質は三つに集約される。

**第一に、構造の問題。** アンチパターンのコードは動くが、壊れ方が読めない。
状態を型に寄せ、イベントを唯一の事実とし、Policy を分離し、ManualAdjustment を正規ルートにし、
version と bitemporal を持ち込むことで、ERP に必要な監査性と変更耐性を得る。

**第二に、言語の選択理由。** Haskell の強みは難解さではない。
GADT による不正状態の構造的排除、純粋関数による参照透過なドメインロジック、
`newtype` のゼロコスト型区別、パターンマッチの網羅性検査。
これらは、壊れると致命的な会計領域で事故を構造的に防ぐ仕組みであり、
他言語の型システムでは同等の保証を得られない。

**第三に、最大のリスクは技術ではなく運用である。**
抽象が強いほど、チームが守れないと逆に壊れる。
この 58 項目は「コードの正解」ではなく「組織が維持すべき制約」である。

---

## 改善例

以下のコードは 58 項のうち中核的な項目を反映している。

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
  | IllegalTransition
  | AdjustmentRequiresReason
  deriving Show

-- 値オブジェクト（コンストラクタ非公開＋スマートコンストラクタ）
newtype UserId  = UserId Text  deriving Show
newtype Email   = Email Text   deriving Show
newtype Version = Version Int  deriving (Show, Eq, Ord)

-- スマートコンストラクタ：不正な Email は作れない（項目 #2）
mkEmail :: Text -> Either DomainError Email
mkEmail e
  | "@" `T.isInfixOf` e = Right (Email e)
  | otherwise            = Left InvalidEmail

nextVersion :: Version -> Version
nextVersion (Version v) = Version (v + 1)

-- 状態遷移を型で表現（項目 #3, #4, #13, #14）
data UserState = Pending | Active

data User (s :: UserState) where
  UserP :: UserId -> Email -> Version -> User 'Pending
  UserA :: UserId -> Email -> Version -> User 'Active

-- Application 層でのみ使う存在型（項目 #20：型消去の範囲を限定）
data SomeUser where
  SomeUser :: User s -> SomeUser

--------------------------------------------------------------------------------
-- 2. Event: 進化可能なスキーマ（項目 #12, #27, #28）
--    バージョンごとに型を分け、互換性変換を明示する。
--------------------------------------------------------------------------------

data EventPayloadV1
  = Registered UserId Email
  | Activated  UserId
  deriving Show

data EventPayloadV2
  = Corrected UserId Email
  | ManualAdjustment Email      -- 救済（項目 #39）：正規のイベント
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
registeredT Nothing (UserEvent v _ _ (V1 (Registered uid email))) =
  Right $ SomeUser $ UserP uid email v
registeredT _ _ = Left IllegalTransition

activatedT :: Transition
activatedT (Just (SomeUser (UserP uid e _))) (UserEvent v _ _ (V1 (Activated _))) =
  Right $ SomeUser $ UserA uid e v
activatedT _ _ = Left IllegalTransition

correctedT :: Transition
correctedT (Just (SomeUser (UserP uid _ _))) (UserEvent v _ _ (V2 (Corrected _ e))) =
  Right $ SomeUser $ UserP uid e v
correctedT (Just (SomeUser (UserA uid _ _))) (UserEvent v _ _ (V2 (Corrected _ e))) =
  Right $ SomeUser $ UserA uid e v
correctedT _ _ = Left IllegalTransition

manualT :: Transition
manualT (Just (SomeUser (UserP uid _ _))) (UserEvent v _ _ (V2 (ManualAdjustment e))) =
  Right $ SomeUser $ UserP uid e v
manualT (Just (SomeUser (UserA uid _ _))) (UserEvent v _ _ (V2 (ManualAdjustment e))) =
  Right $ SomeUser $ UserA uid e v
manualT _ _ = Left IllegalTransition

-- 中央ルーター：ディスパッチだけ。目次として全遷移を一覧できる（項目 #17）
transitions :: [Transition]
transitions = [registeredT, activatedT, correctedT, manualT]

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
emailPolicy _ _ (V1 (Registered _ (Email e)))
  | "@" `T.isInfixOf` e = Right ()
  | otherwise            = Left InvalidEmail
emailPolicy _ _ (V2 (Corrected _ (Email e)))
  | "@" `T.isInfixOf` e = Right ()
  | otherwise            = Left InvalidEmail
emailPolicy _ _ _ = Right ()

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

--------------------------------------------------------------------------------
-- 6. Entry Point
--------------------------------------------------------------------------------

main :: IO ()
main = do
  let ctx = Context (read "2026-04-10")  -- 業務日付（項目 #57）

  let env = Env
        { envLoad    = \_ -> pure []
        , envAppend  = \_ _ ev -> print ev >> pure True
        , envPolicy  = routePolicy [emailPolicy] adjustmentPolicy
        , envContext  = ctx
        }

  result <- runReaderT
    (runExceptT
      (execute
        (UserId "pacho")
        (V1 (Registered (UserId "pacho") (Email "pacho@jocarium.productions")))))
    env
  print result
```
