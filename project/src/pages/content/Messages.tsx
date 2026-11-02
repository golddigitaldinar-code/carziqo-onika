import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { timeAgo } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import { MessageSquare, Plus, Loader as Loader2 } from 'lucide-react';

export default function Messages() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.user_id) loadMessages();
  }, [profile]);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  }

  async function handleSend() {
    if (!subject || !content) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('messages').insert({
      user_id: profile!.user_id,
      subject,
      content,
      is_read: false,
    });
    setSubmitting(false);
    if (error) {
      showToast('Failed to send message', 'error');
    } else {
      showToast('Message sent successfully', 'success');
      setShowNew(false);
      setSubject('');
      setContent('');
      loadMessages();
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Messages" backPath="/home" rightAction={
        <button onClick={() => setShowNew(true)} className="w-9 h-9 rounded-full bg-[#e6f7ee] flex items-center justify-center">
          <Plus size={18} className="text-[#16a35a]" />
        </button>
      } />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages" subtitle="Contact customer service to start a conversation" />
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/message-detail?id=${m.id}`)}
                className="card w-full text-left"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`text-sm ${m.is_read ? 'font-medium text-[#9babc6]' : 'font-semibold text-[#323643]'}`}>
                    {m.subject}
                  </h3>
                  {!m.is_read && <span className="w-2 h-2 rounded-full bg-[#16a35a]" />}
                </div>
                <p className="text-xs text-[#9babc6] line-clamp-2">{m.content}</p>
                <p className="text-[10px] text-[#9babc6] mt-1">{timeAgo(m.created_at)}</p>
                {m.response && (
                  <div className="mt-2 bg-[#e6f7ee] rounded-lg p-2">
                    <p className="text-[10px] text-[#16a35a] font-medium">Support Response:</p>
                    <p className="text-xs text-[#323643] line-clamp-2">{m.response}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Message">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Subject</label>
            <input className="input-field" placeholder="Message subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Message</label>
            <textarea className="input-field min-h-[100px] resize-none" placeholder="Type your message..." value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <button onClick={handleSend} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            Send Message
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
