import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, subtitle }: { icon?: typeof Inbox; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f0f3f8] flex items-center justify-center mb-3">
        <Icon size={28} className="text-[#9babc6]" />
      </div>
      <p className="text-sm font-medium text-[#9babc6]">{title}</p>
      {subtitle && <p className="text-xs text-[#9babc6] mt-1">{subtitle}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'status-active',
    pending: 'status-pending',
    approved: 'status-active',
    rejected: 'status-rejected',
    completed: 'status-completed',
    closed: 'status-closed',
    submitted: 'status-pending',
    available: 'status-active',
    rented: 'status-active',
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return <span className={`status-badge ${classes[status] || 'status-pending'}`}>{label}</span>;
}

export function SectionCard({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card mb-3">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#323643]">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
