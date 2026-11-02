import { supabase } from '@/lib/supabase';

export const ADMIN_EMAIL_DOMAIN = 'jerome.com';

export async function isAdminSession(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}
