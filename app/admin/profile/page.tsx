import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-novraux-charcoal">Profile</h1>
        <p className="mt-2 text-novraux-grey">Manage your account information.</p>
      </div>

      <ProfileForm
        initialEmail={session.email}
        initialUsername={session.username || ''}
      />
    </div>
  );
}
