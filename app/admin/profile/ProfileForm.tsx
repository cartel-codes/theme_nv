'use client';

import { useState } from 'react';

interface ProfileFormProps {
  initialEmail: string;
  initialUsername: string;
}

export default function ProfileForm({ initialEmail, initialUsername }: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
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
        body: JSON.stringify({ username: username || undefined, email }),
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
      <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm shadow-sm border border-novraux-ash/10 dark:border-novraux-graphite max-w-md transition-colors">
        <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone mb-8 transition-colors">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold focus:border-novraux-gold transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
              placeholder="Your username"
            />
          </div>
          <div>
            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold focus:border-novraux-gold transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
            />
          </div>
          {profileMessage && (
            <p className={`text-sm font-light transition-colors ${profileMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {profileMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={profileLoading}
            className="px-8 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors disabled:opacity-50 font-normal rounded-sm"
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm shadow-sm border border-novraux-ash/10 dark:border-novraux-graphite max-w-md transition-colors">
        <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone mb-8 transition-colors">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold focus:border-novraux-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold focus:border-novraux-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold focus:border-novraux-gold transition-colors"
            />
          </div>
          {passwordMessage && (
            <p className={`text-sm font-light transition-colors ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-8 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors disabled:opacity-50 font-normal rounded-sm"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
