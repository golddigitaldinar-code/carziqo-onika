import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Megaphone } from 'lucide-react';

export default function Broadcast() {
  const { profile } = useAuth();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${profile?.user_id || ''}`)
      .order('created_at', { ascending: false });
    if (data) setBroadcasts(data);
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Broadcast" backPath="/home" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : broadcasts.length === 0 ? (
          <EmptyState icon={Megaphone} title="No broadcasts" />
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#fff8eb] flex items-center justify-center">
                    <Megaphone size={16} className="text-[#ef9100]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#323643] flex-1">{b.title}</h3>
                  {!b.is_read && <span className="w-2 h-2 rounded-full bg-[#ef9100]" />}
                </div>
                <p className="text-xs text-[#9babc6] leading-relaxed">{b.content}</p>
                <p className="text-[10px] text-[#9babc6] mt-2">{timeAgo(b.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
