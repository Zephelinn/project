import { createClient } from '@supabase/supabase-js';
import config from './config.js';

const supabase = createClient(config.supabase.url, config.supabase.key);

export async function createTicket(channelId, userId, category) {
  return await supabase.from('tickets').insert({
    channel_id: channelId,
    user_id: userId,
    category: category,
    status: 'open'
  });
}

export async function closeTicket(channelId) {
  return await supabase.from('tickets')
    .update({ status: 'closed', closed_at: new Date() })
    .eq('channel_id', channelId);
}

export async function getTicket(channelId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('channel_id', channelId)
    .eq('status', 'open')
    .single();
    
  return { data, error };
}

export async function isBlacklisted(userId) {
  const { data, error } = await supabase
    .from('blacklisted_users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
    
  if (error?.code === 'PGRST116') {
    return false;
  }
  
  if (error) {
    console.error('Error checking blacklist:', error);
    return false;
  }
  return !!data;
}

export async function blacklistUser(userId, blacklistedBy) {
  return await supabase
    .from('blacklisted_users')
    .insert({
      user_id: userId,
      blacklisted_by: blacklistedBy
    });
}

export async function unblacklistUser(userId) {
  return await supabase
    .from('blacklisted_users')
    .delete()
    .eq('user_id', userId);
}