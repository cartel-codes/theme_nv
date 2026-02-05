import AdminUserForm from '@/components/admin/AdminUserForm';

export default function EditAdminUserPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-wide">Edit Admin User</h1>
        <p className="text-neutral-600 mt-1">Update administrator details</p>
      </div>

      <AdminUserForm userId={params.id} />
    </div>
  );
}
