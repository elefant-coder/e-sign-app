-- contracts テーブル作成
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pdf_path TEXT NOT NULL,
  signed_pdf_path TEXT,
  client_company TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  own_signature_text TEXT NOT NULL,
  own_signature_position JSONB NOT NULL,
  own_signed_at TIMESTAMPTZ,
  client_signature_text TEXT,
  client_signature_position JSONB NOT NULL,
  client_signed_at TIMESTAMPTZ,
  sign_token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_sign_token ON contracts(sign_token);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- RLS (Row Level Security) を有効化
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ポリシーは作らない（anon キーからは読み書きできない）。
-- アプリはサーバー側の service role キーだけで contracts を読み書きする。
