#!/usr/bin/env node
/**
 * eleSign CLI — 契約をターミナルから確認/操作する。Supabase(service role)に直結。
 * 公開Web APIはVercel保護(401)配下なので、バックエンド用途はSupabase直結が正解。
 *
 * 使い方: npm run cli -- <command>   または  node scripts/cli.mjs <command>
 *   list [status] [--limit N]   契約一覧（status: draft|pending|completed|expired、省略=全件）
 *   signed [--since ISO]        締結済み(status=completed)契約（締結の検知に使う）
 *   get <id>                    契約1件の全項目
 *   stats                       ステータス別件数
 *   オプション: --json（機械可読出力）
 *
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY（.env.local も自動で読む）
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// .env.local / .env を読み込む（Next.js規約・既存envは上書きしない）
for (const f of ['.env.local', '.env']) {
  const p = join(HERE, '..', f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です（.env.local か環境変数）。');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);
const FIELDS = 'id,title,client_company,client_name,client_email,status,own_signed_at,client_signed_at,created_at,expires_at';
const fmt = (c) =>
  `${String(c.status).padEnd(9)} ${c.client_company} / ${c.title}` +
  `  [署名 ${(c.client_signed_at || '—').slice(0, 10)}]  ${c.id}`;

async function main() {
  switch (cmd) {
    case 'list': {
      const status = args[1] && !args[1].startsWith('-') && args[1] !== 'all' ? args[1] : null;
      let q = db.from('contracts').select(FIELDS).order('created_at', { ascending: false }).limit(Number(flag('--limit')) || 50);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      if (has('--json')) return console.log(JSON.stringify(data));
      console.log(`契約 ${data.length}件${status ? `（status=${status}）` : ''}`);
      data.forEach((c) => console.log('  ' + fmt(c)));
      break;
    }
    case 'signed': {
      let q = db.from('contracts').select(FIELDS).eq('status', 'completed').order('client_signed_at', { ascending: false });
      const since = flag('--since');
      if (since) q = q.gte('client_signed_at', since);
      const { data, error } = await q;
      if (error) throw error;
      if (has('--json')) return console.log(JSON.stringify(data));
      console.log(`締結済み(completed) ${data.length}件${since ? `（${since}以降）` : ''}`);
      data.forEach((c) => console.log('  ' + fmt(c)));
      break;
    }
    case 'get': {
      if (!args[1]) { console.error('使い方: get <id>'); process.exit(1); }
      const { data, error } = await db.from('contracts').select('*').eq('id', args[1]).single();
      if (error) throw error;
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case 'stats': {
      const { data, error } = await db.from('contracts').select('status');
      if (error) throw error;
      const counts = {};
      for (const r of data) counts[r.status] = (counts[r.status] || 0) + 1;
      if (has('--json')) return console.log(JSON.stringify(counts));
      console.log('ステータス別件数:', JSON.stringify(counts));
      break;
    }
    default:
      console.log('eleSign CLI — 使い方:');
      console.log('  npm run cli -- list [status] [--limit N] [--json]');
      console.log('  npm run cli -- signed [--since ISO] [--json]   # 締結(completed)検知');
      console.log('  npm run cli -- get <id>');
      console.log('  npm run cli -- stats [--json]');
  }
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
