import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import AdminVehicleForm, { type AdminVehicle } from '@/pages/admin/AdminVehicleForm';
import { Car, Plus, Pencil } from 'lucide-react';

export default function AdminCars() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminVehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('vehicles').select('*').order('price', { ascending: true });
    if (data) setVehicles(data as AdminVehicle[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(v: AdminVehicle) {
    setEditing(v);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  if (loading) return <LoadingSpinner label="Loading cars..." />;

  return (
    <div className="space-y-3">
      <button onClick={openNew} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={16} />
        Add car
      </button>

      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No cars yet" />
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <button key={v.id} onClick={() => openEdit(v)} className="card card-hover w-full text-left flex gap-3 items-center">
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#f0f3f8] flex-shrink-0 flex items-center justify-center">
                {v.image_url ? (
                  <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                ) : (
                  <Car size={20} className="text-[#9babc6]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#323643] truncate">{v.name}</p>
                <p className="text-[11px] text-[#9babc6]">
                  {v.is_free_vehicle ? 'Free trial' : `₱${formatCurrency(v.price)}`} • Return ₱{formatCurrency(v.daily_return)}/day
                </p>
                <p className="text-[10px] text-[#9babc6]">Stock {v.stock} • {v.category}</p>
              </div>
              <Pencil size={16} className="text-[#9babc6] flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {formOpen && (
        <AdminVehicleForm
          key={editing?.id ?? 'new'}
          vehicle={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
