import { supabase } from '@/lib/supabase';

interface TableWatch {
  table: string;
  filter?: string;
}

export function watchTable(name: string, watch: TableWatch, onChange: () => void) {
  const channel = supabase
    .channel(`${name}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: watch.table, filter: watch.filter }, () => onChange())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
