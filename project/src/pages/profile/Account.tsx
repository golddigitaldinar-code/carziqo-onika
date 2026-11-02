import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Loader as Loader2, User, Phone, Mail, Camera, CreditCard as Edit2, Check } from 'lucide-react';

const presetAvatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Bandit',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Loki',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Pixel',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Coco',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sage',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Onyx',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
];

export default function Account() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarUrl = profile?.avatar_url || '';
  const displayName = profile?.nickname || 'U';

  async function saveNickname() {
    if (!nickname.trim()) {
      showToast('Please enter nickname', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('user_id', profile!.user_id);
    setLoading(false);
    if (error) {
      showToast('Failed to update', 'error');
    } else {
      showToast('Nickname updated', 'success');
      await refreshProfile();
      setEditing(false);
    }
  }

  async function savePhone() {
    if (!phone.trim()) {
      showToast('Please enter phone number', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('user_id', profile!.user_id);
    setLoading(false);
    if (error) {
      showToast('Failed to update', 'error');
    } else {
      showToast('Phone number updated', 'success');
      await refreshProfile();
    }
  }

  async function uploadPhoto(file: File) {
    if (!profile?.user_id) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${profile.user_id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Profile photo updated', 'success');
      setShowAvatarPicker(false);
    } catch {
      showToast('Failed to upload photo', 'error');
    }
    setUploading(false);
  }

  async function selectPresetAvatar(url: string) {
    if (!profile?.user_id) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('user_id', profile.user_id);
    setLoading(false);
    if (error) {
      showToast('Failed to update avatar', 'error');
    } else {
      await refreshProfile();
      showToast('Avatar updated', 'success');
      setShowAvatarPicker(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
  }

  return (
    <AppLayout>
      <PageHeader title="Account" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="card flex flex-col items-center mb-4">
          <div className="relative mb-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#16a35a]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center text-white text-3xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border border-[#dfe5f0]"
            >
              {uploading ? (
                <Loader2 size={14} className="text-[#16a35a] animate-spin" />
              ) : (
                <Camera size={14} className="text-[#323643]" />
              )}
            </button>
          </div>
          <p className="text-sm font-semibold text-[#323643]">{profile?.nickname || 'Member'}</p>
          <p className="text-xs text-[#9babc6]">VIP Level {profile?.vip_level || 0}</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {showAvatarPicker && (
            <div className="w-full mt-4 pt-4 border-t border-[#f0f3f8]">
              <p className="text-xs font-semibold text-[#323643] mb-3 text-center">Choose an avatar or upload your photo</p>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAvatars.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => selectPresetAvatar(url)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      avatarUrl === url ? 'border-[#16a35a]' : 'border-transparent hover:border-[#dfe5f0]'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-outline w-full text-sm flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                Upload from Gallery
              </button>
            </div>
          )}
        </div>

        <div className="card mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#323643]">Nickname</h3>
            <button onClick={() => setEditing(!editing)} className="text-xs text-[#16a35a] font-medium flex items-center gap-1">
              <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Enter nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <button onClick={saveNickname} disabled={loading} className="btn-primary !px-4 flex items-center gap-1">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#9babc6]">{profile?.nickname || 'Not set'}</p>
          )}
        </div>

        <div className="card mb-3">
          <h3 className="text-sm font-semibold text-[#323643] mb-2 flex items-center gap-2">
            <Phone size={16} className="text-[#16a35a]" /> Phone Number
          </h3>
          <input className="input-field mb-2" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button onClick={savePhone} disabled={loading} className="btn-outline w-full text-sm flex items-center justify-center gap-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Number'}
          </button>
        </div>

        <div className="card mb-3">
          <h3 className="text-sm font-semibold text-[#323643] mb-2 flex items-center gap-2">
            <Mail size={16} className="text-[#16a35a]" /> Email Address
          </h3>
          <p className="text-sm text-[#9babc6]">{profile?.user_id ? 'Connected' : 'Not set'}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#323643] mb-2">Referral Code</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono font-semibold text-[#16a35a]">{profile?.referral_code || 'N/A'}</p>
            <button
              onClick={() => {
                if (profile?.referral_code) {
                  navigator.clipboard.writeText(profile.referral_code);
                  showToast('Referral code copied', 'success');
                }
              }}
              className="text-xs text-[#16a35a] font-medium"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
