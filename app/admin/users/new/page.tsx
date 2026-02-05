import AdminUserForm from '@/components/admin/AdminUserForm';

export default function NewAdminUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-wide">Create New Admin User</h1>
        <p className="text-neutral-600 mt-1">Add a new administrator to your store</p>
      </div>

      <AdminUserForm />
    </div>
  );
}
