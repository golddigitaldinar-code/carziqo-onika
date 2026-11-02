import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Headphones, MessageCircle, Mail, Clock, Phone } from 'lucide-react';

export default function Service() {
  const channels = [
    { icon: MessageCircle, label: 'Online Chat', desc: 'Chat with our support team', color: '#16a35a', action: 'Start Chat' },
    { icon: Mail, label: 'Email Support', desc: 'support@carziqo.com', color: '#2979ff', action: 'Send Email' },
    { icon: Phone, label: 'Phone Support', desc: '+63 2 8888 8888', color: '#ef9100', action: 'Call Now' },
  ];

  return (
    <AppLayout>
      <PageHeader title="Customer Service" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white text-center">
          <Headphones size={32} className="mx-auto mb-2" />
          <h2 className="text-lg font-bold">How can we help?</h2>
          <p className="text-xs text-white/70 mt-1">Contact customer service for any inquiries</p>
        </div>

        <div className="space-y-3 mb-4">
          {channels.map((ch) => (
            <div key={ch.label} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ch.color}15` }}>
                <ch.icon size={22} style={{ color: ch.color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#323643]">{ch.label}</h3>
                <p className="text-xs text-[#9babc6]">{ch.desc}</p>
              </div>
              <button className="btn-outline !px-3 !py-1.5 text-xs">{ch.action}</button>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#323643] mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#16a35a]" /> Service Hours
          </h3>
          <div className="space-y-2 text-xs text-[#9babc6]">
            <div className="flex items-center justify-between py-1.5 border-b border-[#f0f3f8]">
              <span>Monday - Friday</span>
              <span className="text-[#323643] font-medium">9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#f0f3f8]">
              <span>Saturday</span>
              <span className="text-[#323643] font-medium">10:00 AM - 4:00 PM</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span>Sunday</span>
              <span className="text-[#ef4444] font-medium">CLOSED</span>
            </div>
          </div>
          <div className="bg-[#fff8eb] rounded-xl p-3 mt-3 flex items-center gap-2">
            <Clock size={16} className="text-[#ef9100]" />
            <p className="text-xs text-[#9babc6]">Available Every Wednesday for priority support</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
