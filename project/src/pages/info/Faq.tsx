import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import { Circle as HelpCircle, ChevronDown } from 'lucide-react';

export default function Faq() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadFaqs(); }, []);

  async function loadFaqs() {
    const { data } = await supabase.from('faqs').select('*').order('created_at', { ascending: true });
    if (data) setFaqs(data);
    setLoading(false);
  }

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <AppLayout>
      <PageHeader title="FAQ" backPath="/home" />
      <div className="px-4 py-4">
        {loading ? (
          <LoadingSpinner label="Loading FAQs..." />
        ) : faqs.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No FAQs found" />
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-[#9babc6] uppercase mb-2 px-1">{cat}</h3>
                <div className="space-y-2">
                  {faqs.filter((f) => f.category === cat).map((f) => (
                    <div key={f.id} className="card">
                      <button
                        onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="text-sm font-medium text-[#323643] pr-2">{f.question}</span>
                        <ChevronDown
                          size={18}
                          className={`text-[#9babc6] transition-transform flex-shrink-0 ${expanded === f.id ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {expanded === f.id && (
                        <p className="text-sm text-[#9babc6] mt-3 leading-relaxed animate-fadeIn">
                          {f.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
