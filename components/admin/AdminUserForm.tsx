'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AdminUserFormProps {
  userId?: string;
}

export default function AdminUserForm({ userId }: AdminUserFormProps) {
  const router = useRouter();
  const isEditing = !!userId;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    isActive: true,
  });

  useEffect(() => {
    if (isEditing && userId) {
      fetchUser(userId);
    }
  }, [userId, isEditing]);

  async function fetchUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');

      const data = await res.json();
      setUser(data.user);
      setFormData({
        username: data.user.username,
        email: data.user.email,
        password: '',
        confirmPassword: '',
        role: data.user.role,
        isActive: data.user.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isEditing && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const url = isEditing ? `/api/admin/users/${userId}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save user');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-sm p-8 space-y-6 border border-novraux-ash/10 dark:border-novraux-graphite transition-colors"
      >
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-sm font-light transition-colors">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-sm font-light transition-colors">
            User saved successfully! Redirecting...
          </div>
        )}

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter username"
            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone placeholder-novraux-ash dark:placeholder-novraux-bone/50 focus:ring-2 focus:ring-novraux-gold focus:outline-none transition-colors"
            disabled={submitting}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email address"
            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone placeholder-novraux-ash dark:placeholder-novraux-bone/50 focus:ring-2 focus:ring-novraux-gold focus:outline-none transition-colors"
            disabled={submitting}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
            Password {!isEditing && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'}
            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone placeholder-novraux-ash dark:placeholder-novraux-bone/50 focus:ring-2 focus:ring-novraux-gold focus:outline-none transition-colors"
            disabled={submitting}
          />
          <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">
            {isEditing ? 'Leave blank to keep the current password' : 'Minimum 8 characters recommended'}
          </p>
        </div>

        {/* Confirm Password */}
        {formData.password && (
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone placeholder-novraux-ash dark:placeholder-novraux-bone/50 focus:ring-2 focus:ring-novraux-gold focus:outline-none transition-colors"
              disabled={submitting}
            />
          </div>
        )}

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone focus:ring-2 focus:ring-novraux-gold focus:outline-none transition-colors"
            disabled={submitting}
          >
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="w-4 h-4 rounded border-novraux-ash/30 text-novraux-gold focus:ring-2 focus:ring-novraux-gold"
            disabled={submitting}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">
            Account Active
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-sm hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-novraux-medium font-medium text-sm"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </button>
          <Link
            href="/admin/users"
            className="px-6 py-3 border border-novraux-ash/30 dark:border-novraux-graphite text-novraux-obsidian dark:text-novraux-bone rounded-sm hover:bg-novraux-ash/10 dark:hover:bg-novraux-graphite/50 transition-colors uppercase tracking-novraux-medium font-medium text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
