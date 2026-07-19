import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export function createSupabaseStore() {
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const toUser = (row) => row && {
    userId: row.id,
    username: row.username,
    publicKey: row.public_key,
    createdAt: row.created_at,
  };

  const toMsg = (row) => row && {
    messageId: row.message_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    senderPublicKey: row.sender_public_key,
    ttl: row.ttl || 0,
    status: row.status,
    timestamp: row.created_at,
  };

  return {
    kind: 'supabase',
    async registerUser({ userId, username, publicKey }) {
      const { data, error } = await sb
        .from('users')
        .upsert({ id: userId, username, public_key: publicKey }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return toUser(data);
    },
    async getUser(userId) {
      const { data } = await sb.from('users').select().eq('id', userId).maybeSingle();
      return toUser(data);
    },
    async getUserByUsername(username) {
      const { data } = await sb.from('users').select().eq('username', username).maybeSingle();
      return toUser(data);
    },
    async listUsers(excludeUserId) {
      let q = sb.from('users').select();
      if (excludeUserId) q = q.neq('id', excludeUserId);
      const { data } = await q;
      return (data || []).map(toUser);
    },
    async saveMessage(msg) {
      const { error } = await sb.from('messages').insert({
        message_id: msg.messageId,
        sender_id: msg.senderId,
        recipient_id: msg.recipientId,
        ciphertext: msg.ciphertext,
        nonce: msg.nonce,
        sender_public_key: msg.senderPublicKey,
        ttl: msg.ttl || 0,
        status: msg.status || 'sent',
      });
      if (error) throw error;
    },
    async getUndelivered(recipientId) {
      const { data } = await sb
        .from('messages')
        .select()
        .eq('recipient_id', recipientId)
        .in('status', ['pending', 'sent']);
      return (data || []).map(toMsg);
    },
    async markDelivered(messageId) {
      await sb.from('messages').update({ status: 'delivered' }).eq('message_id', messageId);
    },
    async deleteMessage(messageId) {
      await sb.from('messages').update({ status: 'deleted' }).eq('message_id', messageId);
    },
  };
}
