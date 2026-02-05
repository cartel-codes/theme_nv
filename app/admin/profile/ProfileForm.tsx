'use client';

import { useState } from 'react';

interface ProfileFormProps {
  initialEmail: string;
  initialName: string;
}

export default function ProfileForm({ initialEmail, initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const res = await fetch('/api/admin/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Profile section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100 max-w-md">
        <h2 className="font-serif text-xl mb-6">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-novraux-charcoal mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded focus:ring-2 focus:ring-novraux-charcoal/20 focus:border-novraux-charcoal"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-novraux-charcoal mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded focus:ring-2 focus:ring-novraux-charcoal/20 focus:border-novraux-charcoal"
            />
          </div>
          {profileMessage && (
            <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {profileMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2 bg-novraux-charcoal text-white text-sm uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100 max-w-md">
        <h2 className="font-serif text-xl mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-novraux-charcoal mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded focus:ring-2 focus:ring-novraux-charcoal/20 focus:border-novraux-charcoal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-novraux-charcoal mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-neutral-200 rounded focus:ring-2 focus:ring-novraux-charcoal/20 focus:border-novraux-charcoal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-novraux-charcoal mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-neutral-200 rounded focus:ring-2 focus:ring-novraux-charcoal/20 focus:border-novraux-charcoal"
            />
          </div>
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2 bg-novraux-charcoal text-white text-sm uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
