# 電子署名アプリ

PDF の契約書をアップロードし、自社の署名を入れて相手にメールで署名を依頼し、相手が署名すると締結済み PDF ができるアプリです。

- Next.js 16 / Supabase（DB と Storage）/ Resend（メール）/ pdf-lib（署名の埋め込み）
- 管理画面は Basic 認証。相手の署名ページは `/sign/[token]`（リンクは30日で切れる）

## 動かし方

1. Supabase でプロジェクトを作り、`supabase/migrations/` の SQL を順に流す（`supabase link` → `supabase db push`、または SQL エディタに貼る）
2. `.env.example` を `.env.local` に写して値を入れる
3. `npm ci` → `npm run dev`（http://localhost:3000）
4. 本番は Vercel などに置き、`.env.example` と同じ環境変数を設定する

## 安全のための約束

- Supabase のテーブルと Storage には anon 向けのポリシーを作らない。DB と Storage はサーバー側の service role キーだけで触る
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーの環境変数にだけ置き、ブラウザに出さない
- 管理画面と `/api/contracts`・`/api/upload` は Basic 認証の内側（`src/proxy.ts`）
