import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import { Car, Loader as Loader2 } from 'lucide-react';

export interface AdminVehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  daily_return: number;
  image_url: string;
  stock: number;
  category: string;
  settlement_cycle: number;
  rental_limit: number;
  is_free_vehicle: boolean;
}

interface AdminVehicleFormProps {
  vehicle: AdminVehicle | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  name: string;
  description: string;
  price: string;
  daily_return: string;
  image_url: string;
  stock: string;
  category: string;
  settlement_cycle: string;
  rental_limit: string;
}

const categoryOptions = ['standard', 'premium', 'luxury'];

function toFormValues(v: AdminVehicle | null): FormValues {
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    price: v ? String(v.price) : '',
    daily_return: v ? String(v.daily_return) : '',
    image_url: v?.image_url ?? '',
    stock: v ? String(v.stock) : '',
    category: v?.category ?? 'standard',
    settlement_cycle: v ? String(v.settlement_cycle) : '30',
    rental_limit: v ? String(v.rental_limit) : '1',
  };
}

function validate(f: FormValues): string | null {
  if (!f.name.trim()) return 'Enter a car name';
  const price = Number(f.price);
  const dailyReturn = Number(f.daily_return);
  const stock = Number(f.stock);
  const cycle = Number(f.settlement_cycle);
  const limit = Number(f.rental_limit);
  if (f.price === '' || !Number.isFinite(price) || price < 0) return 'Enter a valid price';
  if (f.daily_return === '' || !Number.isFinite(dailyReturn) || dailyReturn < 0) return 'Enter a valid daily return';
  if (f.stock === '' || !Number.isInteger(stock) || stock < 0) return 'Stock must be a whole number of 0 or more';
  if (!Number.isInteger(cycle) || cycle < 1) return 'Settlement days must be a whole number of 1 or more';
  if (!Number.isInteger(limit) || limit < 1) return 'Rental limit must be a whole number of 1 or more';
  if (f.image_url.trim() && !/^https?:\/\//i.test(f.image_url.trim())) return 'Photo link must start with https://';
  return null;
}

export default function AdminVehicleForm({ vehicle, onClose, onSaved }: AdminVehicleFormProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(() => toFormValues(vehicle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageBroken, setImageBroken] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'image_url') setImageBroken(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const problem = validate(values);
    if (problem) {
      setError(problem);
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      daily_return: Number(values.daily_return),
      image_url: values.image_url.trim(),
      stock: Number(values.stock),
      category: values.category,
      settlement_cycle: Number(values.settlement_cycle),
      rental_limit: Number(values.rental_limit),
    };

    setSaving(true);
    setError('');
    const query = vehicle
      ? supabase.from('vehicles').update(payload).eq('id', vehicle.id).select('id')
      : supabase.from('vehicles').insert({ ...payload, is_free_vehicle: false, status: 'available' }).select('id');
    const { data, error: saveError } = await query;
    setSaving(false);

    if (saveError || !data || data.length === 0) {
      setError('Could not save the car. Check your admin session and try again.');
      return;
    }

    showToast(vehicle ? 'Car updated' : 'Car added', 'success');
    onSaved();
  }

  const inputClass = 'input-field';
  const labelClass = 'text-xs font-medium text-[#9babc6] mb-1 block';

  return (
    <Modal open onClose={onClose} title={vehicle ? 'Edit car' : 'Add car'}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-xl overflow-hidden bg-[#f0f3f8] h-40 flex items-center justify-center">
          {values.image_url.trim() && !imageBroken ? (
            <img
              src={values.image_url.trim()}
              alt="Car preview"
              className="w-full h-full object-cover"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center text-[#9babc6]">
              <Car size={28} />
              <p className="text-[11px] mt-1">{imageBroken ? 'Photo link could not be loaded' : 'No photo yet'}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="car-image" className={labelClass}>Photo link (https)</label>
          <input
            id="car-image"
            type="url"
            value={values.image_url}
            onChange={(e) => update('image_url', e.target.value)}
            className={inputClass}
            placeholder="https://example.com/car.jpg"
          />
        </div>

        <div>
          <label htmlFor="car-name" className={labelClass}>Car name</label>
          <input id="car-name" value={values.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label htmlFor="car-description" className={labelClass}>Description</label>
          <textarea
            id="car-description"
            rows={3}
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="car-price" className={labelClass}>Price (₱)</label>
            <input id="car-price" type="number" min="0" step="any" value={values.price} onChange={(e) => update('price', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="car-daily" className={labelClass}>Daily return (₱)</label>
            <input id="car-daily" type="number" min="0" step="any" value={values.daily_return} onChange={(e) => update('daily_return', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="car-stock" className={labelClass}>Stock</label>
            <input id="car-stock" type="number" min="0" step="1" value={values.stock} onChange={(e) => update('stock', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="car-category" className={labelClass}>Category</label>
            <select id="car-category" value={values.category} onChange={(e) => update('category', e.target.value)} className={inputClass}>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="car-cycle" className={labelClass}>Settlement days</label>
            <input id="car-cycle" type="number" min="1" step="1" value={values.settlement_cycle} onChange={(e) => update('settlement_cycle', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="car-limit" className={labelClass}>Rental limit per user</label>
            <input id="car-limit" type="number" min="1" step="1" value={values.rental_limit} onChange={(e) => update('rental_limit', e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && <p className="text-xs text-[#dc2626]">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {vehicle ? 'Save changes' : 'Add car'}
        </button>
      </form>
    </Modal>
  );
}
