-- Z-Chat Supabase/Postgres Schema
-- Run with: supabase db push

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,
  nonce TEXT NOT NULL,
  sender_public_key TEXT NOT NULL,
  ttl INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'viewed', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
