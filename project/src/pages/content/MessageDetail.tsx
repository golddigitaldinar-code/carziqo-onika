import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { CircleAlert as AlertCircle, MessageSquare } from 'lucide-react';

export default function MessageDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadMessage();
  }, [id]);

  async function loadMessage() {
    const { data } = await supabase.from('messages').select('*').eq('id', id).maybeSingle();
    if (data) {
      setMessage(data);
      if (!data.is_read) {
        await supabase.from('messages').update({ is_read: true }).eq('id', id);
      }
    }
    setLoading(false);
  }

  if (loading) return <AppLayout><PageHeader title="Message detail" backPath="/messages" /><div className="flex justify-center py-8">Loading...</div></AppLayout>;
  if (!message) return (
    <AppLayout><PageHeader title="Message detail" backPath="/messages" />
      <div className="flex flex-col items-center py-20">
        <AlertCircle size={48} className="text-[#9babc6] mb-3" />
        <p className="text-sm text-[#9babc6]">Message not found</p>
        <button onClick={() => navigate('/messages')} className="btn-primary mt-4">Back to Messages</button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <PageHeader title="Message detail" backPath="/messages" />
      <div className="px-5 py-4">
        <h1 className="text-lg font-bold text-[#323643] mb-2">{message.subject}</h1>
        <p className="text-xs text-[#9babc6] mb-4">{formatDateTime(message.created_at)}</p>

        <div className="card mb-4">
          <p className="text-sm text-[#323643] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.response ? (
          <div className="card bg-[#e6f7ee]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-[#16a35a]" />
              <h3 className="text-sm font-semibold text-[#16a35a]">Email Response</h3>
            </div>
            <p className="text-sm text-[#323643] leading-relaxed whitespace-pre-wrap">{message.response}</p>
            <p className="text-[10px] text-[#9babc6] mt-2">{formatDateTime(message.created_at)}</p>
          </div>
        ) : (
          <div className="card text-center">
            <MessageSquare size={32} className="text-[#9babc6] mx-auto mb-2" />
            <p className="text-sm text-[#9babc6]">Awaiting support response</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
