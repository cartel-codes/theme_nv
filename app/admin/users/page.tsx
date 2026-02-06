'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers(search = '') {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to fetch admin users');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  async function handleDelete(id: string) {
    if (deleting) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete user'}`);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleUserActive(user: AdminUser) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      const { user: updatedUser } = await res.json();
      setUsers(users.map(u => (u.id === user.id ? updatedUser : u)));
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-novraux-bone dark:bg-novraux-obsidian transition-colors">
        <div className="text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">Loading admin users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
            Admin Users
          </h1>
          <p className="text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">
            Manage administrative user accounts
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-normal rounded-sm inline-flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          New User
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-sm font-light transition-colors">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="flex-1 px-4 py-2 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-graphite dark:text-novraux-bone bg-novraux-bone text-novraux-obsidian placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-novraux-obsidian dark:bg-novraux-graphite text-novraux-bone dark:text-novraux-bone rounded-sm text-sm hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-gold dark:hover:text-novraux-obsidian transition-colors font-normal uppercase tracking-novraux-medium"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              fetchUsers('');
            }}
            className="px-4 py-2 text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone text-sm font-normal transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Users Table */}
      <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-sm border border-novraux-ash/10 dark:border-novraux-graphite overflow-hidden transition-colors">
        {users.length === 0 ? (
          <div className="p-8 text-center text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
            No admin users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-novraux-obsidian/5 dark:bg-novraux-obsidian/20 border-b border-novraux-ash/20 dark:border-novraux-graphite transition-colors">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-novraux-ash/10 dark:divide-novraux-graphite transition-colors">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-novraux-obsidian/5 dark:hover:bg-novraux-obsidian/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-novraux-obsidian dark:text-novraux-bone font-medium transition-colors">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-novraux-gold/20 dark:bg-novraux-gold/10 text-novraux-obsidian dark:text-novraux-gold rounded-sm text-xs font-normal uppercase tracking-novraux-medium transition-colors">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => toggleUserActive(user)}
                        className={`px-3 py-1 rounded-sm text-xs font-normal uppercase tracking-novraux-medium transition-colors ${user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                          : 'bg-novraux-ash/20 text-novraux-ash dark:bg-novraux-graphite dark:text-novraux-bone/70 hover:bg-novraux-ash/30'
                          }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="px-3 py-1.5 text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone rounded-sm transition-colors text-xs uppercase tracking-novraux-medium font-normal"
                          title="Edit user"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors text-xs uppercase tracking-novraux-medium font-normal"
                          title="Delete user"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-novraux-obsidian/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors">
          <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-xl max-w-md w-full p-6 transition-colors">
            <h2 className="text-xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone mb-4 transition-colors">
              Delete User
            </h2>
            <p className="text-novraux-ash dark:text-novraux-bone/70 mb-6 font-light transition-colors">
              Are you sure you want to delete <strong>{userToDelete.username}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-ash/10 dark:hover:bg-novraux-obsidian rounded-sm transition-colors disabled:opacity-50 text-xs uppercase tracking-novraux-medium font-normal"
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && handleDelete(userToDelete.id)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 text-xs uppercase tracking-novraux-medium font-normal"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
