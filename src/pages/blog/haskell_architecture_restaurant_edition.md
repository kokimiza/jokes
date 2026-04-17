---
layout: ../../layouts/BlogLayout.astro
title: Haskell Architecture Blueprint - Restaurant Edition
description: Exploring the evolution of Haskell design patterns from Type-class DI to ReaderT + Env.
tags: ["Haskell", "Architecture", "Functional Programming", "Design Patterns"]
time: 20
featured: true
timestamp: 2026-04-17T09:46:49+00:00
filename: haskell_architecture_restaurant_edition
---

## 0. Haskellの基本

* **カリー化**: Haskellの関数はすべて引数を1つずつ受け取る「一引数関数の連鎖」です。これにより、引数を途中まで適用した「部分適用」の関数を値として保持でき、後から残りの引数（DB設定など）を注入する柔軟な設計を可能にします。
* **モナド**: 「失敗の可能性」や「副作用」といった計算の付随情報を「文脈」として管理する仕組みです。`do` 構文の中で `<-`（バインド）を使うことで、文脈を維持したまま中身の値だけをリレーできます。
* **pure**: 生の値を、余計な効果を付け加えずに「モナドの文脈」へと持ち込む（リフトする）関数です。

---

## 1. 旧パターン：型クラスDI（インターフェース・命令スタイル）
**「キッチンがホールに直接指示を出す」スタイル**

```haskell
{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE OverloadedRecordDot #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE UndecidableInstances #-}

import Data.List (find)
import Data.Text (Text)
import Data.Text qualified as T
import System.Environment (getArgs)
import Text.Read (readMaybe)

-- ==========================================
-- 共通ログ定義（Single Source of Truth）
-- ==========================================
logReceived = "【システム】注文リクエストを受信しました。"

logTableConfirmed t = "【確認】テーブル番号 " <> t <> " のお客様ですね。"

logCheckMenu = "【厨房】メニューに料理が存在するか照会中..."

logNotFound = "【ログ】エラー：指定された料理はメニューに存在しません。"

logCooking1 = "【調理】フライパンを熱しています..."

logCooking2 = "【調理】具材を投入しました。"

logCooking3 = "【調理】味付けを調整しています..."

logPlating = "【厨房】盛り付けを開始しました。"

logCallStaff = "【配膳】ホールスタッフを呼び出しています。"

logMoveCounter = "【配膳】料理をカウンターへ移動しました。"

successMsg d = "お待たせしました！" <> d <> " です。"

failureMsg d = "料理「" <> d <> "」はメニューにございません。"

-- ==========================================
-- ドメイン層
-- ==========================================
newtype TableNumber = TableNumber Int deriving (Show)

mkTableNumber n =
    if n >= 1 && n <= 9
        then Right (TableNumber n)
        else Left "テーブル番号は1〜9の間で指定してください。"

newtype DishId = DishId Text deriving (Show)

newtype DishName = DishName Text deriving (Show)

data Dish = Dish {dishId :: DishId, dishName :: DishName} deriving (Show)

-- ==========================================
-- アプリケーション層
-- ==========================================
data OrderReqDto = OrderReqDto {tableNo :: TableNumber, dishName :: Text}

class (Monad m) => OrderPresenter m where
    reportProgress :: Text -> m ()
    presentSuccess :: Text -> m ()
    presentFailure :: Text -> m ()

class (Monad m) => OrderRepository m where
    findDishByName :: Text -> m (Maybe Dish)

class (Monad m) => OrderUseCase m where
    executeOrder :: OrderReqDto -> m ()

instance (Monad m, OrderRepository m, OrderPresenter m) => OrderUseCase m where
    executeOrder dto = do
        reportProgress logReceived
        reportProgress $ logTableConfirmed (T.pack $ show dto.tableNo)

        reportProgress logCheckMenu
        dishOpt <- findDishByName dto.dishName

        case dishOpt of
            Nothing -> do
                reportProgress logNotFound
                presentFailure $ failureMsg dto.dishName
            Just _ -> do
                reportProgress logCooking1
                reportProgress logCooking2
                reportProgress logCooking3
                reportProgress logPlating
                reportProgress logCallStaff
                reportProgress logMoveCounter
                presentSuccess $ successMsg dto.dishName

-- ==========================================
-- アダプター層
-- ==========================================
instance OrderRepository IO where
    findDishByName name = do
        let menu = [Dish (DishId "D01") (DishName "BACON")]
        pure $ find (\d -> case d.dishName of DishName n -> n == name) menu

instance OrderPresenter IO where
    reportProgress msg = putStrLn $ " [PROGRESS] " ++ T.unpack msg
    presentSuccess res = putStrLn $ " ★★★ SUCCESS: " ++ T.unpack res
    presentFailure err = putStrLn $ " !!! FAILURE: " ++ T.unpack err

-- ==========================================
-- エントリーポイント
-- ==========================================
main :: IO ()
main = do
    args <- getArgs
    case args of
        [t, d] ->
            case ( do
                    tInt <- maybe (Left "数値で") Right (readMaybe t)
                    tNo <- mkTableNumber tInt
                    pure $ OrderReqDto tNo (T.pack d)
                 ) of
                Left e -> putStrLn $ "【ERROR】" ++ T.unpack e
                Right dto -> executeOrder dto
        _ -> putStrLn "Usage: runhaskell A.hs <1-9> <Dish>"
```

キッチン（Interactor）がホールのインターフェース（Output Port）に依存し、処理の過程で直接「進捗報告」や「成功通知」などのメソッドを呼び出す形式です。

#### 構造
* **Input Port**: `class OrderUseCase m`
* **Output Port**: `class OrderPresenter m`（進捗報告 `reportProgress` や最終通知 `presentSuccess` などの抽象メソッドを持つ）
* **Interactor**: `executeOrder` 関数内で、Presenter のメソッドを適切なタイミングで直接叩く「ストーリーテラー」として振る舞う。

#### 特徴
* **制御の主導権**: キッチン（Interactor）が持つ。いつ、どのタイミングでユーザーに情報を提示するかは、キッチン側のロジックで決定される。
* **メリット**: 依存関係が「型制約（Constraints）」として抽象化されるため、関数の型シグネチャが `(Monad m, OrderPresenter m) => ...` のように宣言的で簡潔に保たれる。また、特定の具体的なデータ構造（Envレコードなど）に縛られない。
* **デメリット**: キッチンが「どの副作用をどの順番で呼び出すか」という実行フローの全権を握るため、実装が IO などの「実行コンテキスト」に強く結びつきやすい。テスト時には、対象の型クラスに対するモックインスタンスを個別に定義する必要がある。

---

## 2. 新パターン：ReaderT + Env（値変換スタイル）
**「キッチンは完成した皿（値）をカウンターに置くだけ」スタイル**

```haskell
{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE OverloadedRecordDot #-}
{-# LANGUAGE OverloadedStrings #-}

import Control.Monad.Except
import Control.Monad.Reader
import Data.List (find)
import Data.Text (Text)
import Data.Text qualified as T
import System.Environment (getArgs)
import Text.Read (readMaybe)

-- ==========================================
-- 共通ログ定義
-- ==========================================
logReceived = "【システム】注文リクエストを受信しました。"

logTableConfirmed t = "【確認】テーブル番号 " <> t <> " のお客様ですね。"

logCheckMenu = "【厨房】メニューに料理が存在するか照会中..."

logNotFound = "【ログ】エラー：指定された料理はメニューに存在しません。"

logCooking1 = "【調理】フライパンを熱しています..."

logCooking2 = "【調理】具材を投入しました。"

logCooking3 = "【調理】味付けを調整しています..."

logPlating = "【厨房】盛り付けを開始しました。"

logCallStaff = "【配膳】ホールスタッフを呼び出しています。"

logMoveCounter = "【配膳】料理をカウンターへ移動しました。"

successMsg d = "お待たせしました！" <> d <> " です。"

failureMsg d = "料理「" <> d <> "」はメニューにございません。"

-- ==========================================
-- ドメイン層
-- ==========================================
newtype TableNumber = TableNumber Int deriving (Show)

mkTableNumber :: Int -> Either Text TableNumber
mkTableNumber n
    | n >= 1 && n <= 9 = Right (TableNumber n)
    | otherwise = Left "テーブル番号は1〜9の間で指定してください。"

newtype DishId = DishId Text deriving (Show)

newtype DishName = DishName Text deriving (Show)

data Dish = Dish {dishId :: DishId, dishName :: DishName} deriving (Show)

-- ==========================================
-- アプリケーション層
-- ==========================================
data OrderReqDto = OrderReqDto {tableNo :: TableNumber, dishName :: Text}

toOrderReqDto :: String -> String -> Either Text OrderReqDto
toOrderReqDto rawT rawD = do
    tInt <- maybe (Left "テーブル番号は数値で入力してください。") Right (readMaybe rawT)
    tNo <- mkTableNumber tInt
    pure $ OrderReqDto tNo (T.pack rawD)

data AppEnv = AppEnv
    { envFindDish :: Text -> IO (Maybe Dish)
    , envReport :: Text -> IO ()
    }

type AppM = ExceptT Text (ReaderT AppEnv IO)

executeOrder :: OrderReqDto -> AppM Text
executeOrder dto = do
    env <- ask
    let report = liftIO . env.envReport

    report logReceived
    report $ logTableConfirmed (T.pack $ show dto.tableNo)

    report logCheckMenu
    dishOpt <- liftIO $ env.envFindDish dto.dishName

    case dishOpt of
        Nothing -> do
            report logNotFound
            throwError $ failureMsg dto.dishName
        Just _ -> do
            report logCooking1
            report logCooking2
            report logCooking3
            report logPlating
            report logCallStaff
            report logMoveCounter
            pure $ successMsg dto.dishName

-- ==========================================
-- アダプター層
-- ==========================================
orderPresenter :: Either Text Text -> IO ()
orderPresenter (Left err) = putStrLn $ " !!! FAILURE: " ++ T.unpack err
orderPresenter (Right res) = putStrLn $ " ★★★ SUCCESS: " ++ T.unpack res

-- ==========================================
-- エントリーポイント
-- ==========================================
main :: IO ()
main = do
    args <- getArgs
    case args of
        [rawT, rawD] -> do
            let env =
                    AppEnv
                        { envFindDish = \name -> do
                            let menu = [Dish (DishId "D01") (DishName "BACON")]
                            pure $ find (\d -> case d.dishName of DishName n -> n == name) menu
                        , envReport = \msg -> putStrLn $ " [PROGRESS] " ++ T.unpack msg
                        }

            case toOrderReqDto rawT rawD of
                Left err -> putStrLn $ "【ERROR】" ++ T.unpack err
                Right dto -> do
                    result <- runReaderT (runExceptT (executeOrder dto)) env
                    orderPresenter result
        _ -> putStrLn "Usage: runhaskell B.hs <1-9> <Dish>"
```

### パターン2：ReaderT + Env（値変換 ＋ 環境活用スタイル）

キッチン（Interactor）はホールの具体的な姿を知りません。手元にある「道具箱（Env）」の中の関数を使い、調理の進捗を報告しながら、最終的な「料理（値）」を完成させてカウンターに置くことに徹します。

#### 構造
* **Env**: 外部サービス（DB検索等）や進捗報告（Output Port）の実装を保持するレコード。
* **AppM**: `ExceptT`（エラー処理）と `ReaderT`（環境参照）を組み合わせた合成モナド。
* **Interactor**: `executeOrder` は `AppM Text` という**型**を返す。これは「環境を使い、途中で報告を送りつつ、最終的に結果かエラーを出す」という一連の物語をパッケージ化したものです。

#### 特徴
* **制御の主導権**: ホール（Adapter/呼び出し側）が持つ。計算（ストーリー）をいつ、どの環境で実行するかは呼び出し側が決める。
* **メリット**: Interactorが副作用の「直接の実行者」から、環境を通じた「記述者」へとシフトする。テスト時は `Env` の関数をモックに差し替えるだけで、全ての進捗ログの順序や成否を簡単に検証できる。
* **注意点（Envの管理）**: 依存が増えると `Env` が巨大化（God Object化）しがちです。小規模なら一括管理で良いですが、大規模化してきたら機能単位で `Env` を分割し、必要な部品だけを合成して渡す設計への移行を検討してください。

---

## 3. 対比まとめ

| 役割 | パターン1 (型クラスDI) | パターン2 (ReaderT + Env) |
| :--- | :--- | :--- |
| **Input Port** | `class OrderUseCase m` | `executeOrder` 関数の型シグネチャ |
| **Interactor** | インスタンス内の「振る舞い」 | 関数本体による「環境を用いた変換」 |
| **Output Port** | **`OrderPresenter` クラスのメソッド** | **`Env` 内の報告用関数** ＋ **戻り値の `Either`** |
| **進捗報告** | `reportProgress` 命令の直接実行 | `env.envReport` 道具の活用 |
| **主導権** | キッチン（Interactor）が命令を出す | ホール（Adapter/呼び出し側）が実行を制御 |
| **抽象化の対象** | 副作用を伴う「インターフェース」 | 実行に必要な「環境データ」 |

---

### 設計の総括

今回の改修により、両パターンは**「SSOT（共通ログ）」という一つの台本を共有し、異なる舞台装置（アーキテクチャ）で演じられる同質の劇**となりました。

* **型クラスDI** は、物語の「語り口（メソッド）」を型で定義し、誰が演じても同じ物語になることを保証します。
* **ReaderT + Env** は、物語に必要な「小道具（関数）」をデータとして渡し、キッチンがそれを使って物語を完結させます。
