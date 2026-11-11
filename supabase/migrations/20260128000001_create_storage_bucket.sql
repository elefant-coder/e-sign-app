-- contracts バケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage のポリシーも作らない（anon キーからは一覧・取得・削除できない）。
-- ブラウザからのアップロードは、サーバーが発行する署名付きアップロード URL（/api/upload）で行う。
