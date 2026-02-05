'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login');
          } else {
            setError('Failed to load profile');
          }
          return;
        }
        const data = await response.json();
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || 'Failed to update profile');
        return;
      }

      setProfile(responseData.user);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error updating profile');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-novraux-cream/30 py-20">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="bg-white rounded-lg border border-novraux-beige p-8">
            <p className="text-center text-novraux-charcoal/60">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-novraux-cream/30 py-20">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-lg border border-novraux-beige p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-medium text-novraux-charcoal mb-2">My Account</h1>
            <p className="text-sm text-novraux-charcoal/60">Manage your profile information</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Profile Section */}
          <div className="mb-8 pb-8 border-b border-novraux-beige">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-novraux-charcoal mb-4">Personal Information</h2>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium text-white bg-novraux-charcoal rounded-lg hover:bg-novraux-charcoal/90 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-novraux-charcoal mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-novraux-charcoal mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-novraux-charcoal mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-novraux-charcoal text-white rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-novraux-charcoal/60 uppercase tracking-editorial">First Name</p>
                    <p className="text-base text-novraux-charcoal mt-1">
                      {profile?.firstName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-novraux-charcoal/60 uppercase tracking-editorial">Last Name</p>
                    <p className="text-base text-novraux-charcoal mt-1">
                      {profile?.lastName || '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-novraux-charcoal/60 uppercase tracking-editorial">Email Address</p>
                  <p className="text-base text-novraux-charcoal mt-1">
                    {profile?.email || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-novraux-charcoal/60 uppercase tracking-editorial">Phone Number</p>
                  <p className="text-base text-novraux-charcoal mt-1">
                    {profile?.phone || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-novraux-charcoal/60 uppercase tracking-editorial">Member Since</p>
                  <p className="text-base text-novraux-charcoal mt-1">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : '—'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Account Security */}
          <div className="mb-8 pb-8 border-b border-novraux-beige">
            <h2 className="text-lg font-medium text-novraux-charcoal mb-4">Account Security</h2>
            <Link
              href="/account/change-password"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-novraux-charcoal rounded-lg hover:bg-novraux-charcoal/90 transition-colors"
            >
              Change Password
            </Link>
          </div>

          {/* Orders Section */}
          <div>
            <h2 className="text-lg font-medium text-novraux-charcoal mb-4">Your Orders</h2>
            <Link
              href="/orders"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-novraux-charcoal rounded-lg hover:bg-novraux-charcoal/90 transition-colors"
            >
              View Order History
            </Link>
          </div>

          {/* Back Link */}
          <div className="mt-8 pt-8 border-t border-novraux-beige">
            <Link href="/" className="text-novraux-charcoal/60 hover:text-novraux-charcoal transition-colors">
              ← Back to shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
