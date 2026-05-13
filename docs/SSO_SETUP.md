# Microsoft SSO セットアップ手順

このアプリは Microsoft Entra ID (旧 Azure AD) による SSO に対応しています。
ログイン成功後、サインインしたユーザーのみがトークスクリプトを閲覧できます。

---

## 1. Entra ID 側でアプリ登録する

1. [Azure ポータル](https://portal.azure.com) → **Microsoft Entra ID** → **アプリの登録** → **新規登録**
2. 入力:
    - 名前: `Talk Script Flow`（任意）
    - サポートされているアカウントの種類: **この組織ディレクトリのみ（シングルテナント）**
    - リダイレクト URI:
        - プラットフォーム: **シングルページ アプリケーション (SPA)**
        - URI: `http://localhost:5177`（開発時）
3. 登録完了後の画面で以下をメモ:
    - **アプリケーション (クライアント) ID**
    - **ディレクトリ (テナント) ID**
4. 本番環境にデプロイする場合は **認証** タブに本番 URL のリダイレクト URI を追加

> 「シングルページ アプリケーション」プラットフォームを選ぶことで、暗黙的フローではなく
> 安全な **Authorization Code + PKCE** フローが使われます。

---

## 2. ローカル環境変数を設定

```powershell
cd C:\Users\000367\dev\talkscript-flow
Copy-Item .env.example .env.local
```

`.env.local` を開いて以下を埋める:

```env
VITE_AZURE_CLIENT_ID=<上でメモしたクライアントID>
VITE_AZURE_TENANT_ID=<上でメモしたテナントID>
VITE_AZURE_REDIRECT_URI=http://localhost:5177
```

`.env.local` は `.gitignore` で除外されているので、コミットされません。

---

## 3. 起動して確認

```powershell
npm install
npm run dev
```

ブラウザで `http://localhost:5177` を開く → 「Microsoft でサインイン」ボタンが表示される
→ クリックして Microsoft アカウントでログイン → トークスクリプトの画面に遷移すれば成功。

右上のチップに表示名が出て、サインアウトもそこから可能です。

---

## 4. 仕組み（参考）

- `src/auth/msalConfig.ts`: MSAL の設定（環境変数から読む）
- `src/auth/AuthGate.tsx`: 未ログインなら SignIn 画面、ログイン後は子要素を表示
- `src/main.tsx`: アプリ全体を `MsalProvider` + `AuthGate` でラップ

認証フロー:

```
[未ログイン]
  ↓ ボタン押下
[Microsoft へリダイレクト]
  ↓ 認証
[アプリへ戻る + JWT 取得]
  ↓
[AuthGate が子要素を表示]
```

ユーザー情報（氏名・メール・oid）は JWT に含まれているため、ユーザーマスタ DB は不要です。
DB に保存したい場合は `accounts[0].homeAccountId` または JWT の `oid` クレームをキーにすると安定です。

---

## 5. よくあるエラー

| 症状 | 原因 / 対処 |
|---|---|
| `AADSTS50011: redirect URI ... does not match` | Entra ID 側のリダイレクト URI と `VITE_AZURE_REDIRECT_URI` が一致していない |
| `interaction_in_progress` | sessionStorage に古い状態が残っている。ブラウザの開発者ツール → Application → Clear storage |
| ボタンを押しても何も起きない | `.env.local` 未設定。コンソールに警告が出ているはず |
| 社内ネットからログインできない | `login.microsoftonline.com` への HTTPS アウトバウンドを許可する必要あり |
