import AdminUserForm from '@/components/admin/AdminUserForm';

export default async function EditAdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Edit Admin User</h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">Update administrator details</p>
      </div>

      <AdminUserForm userId={id} />
    </div>
  );
}
