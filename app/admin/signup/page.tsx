import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import SignupForm from './SignupForm';

export default async function SignupPage() {
    // Redirect to admin dashboard if already authenticated
    const session = await getSession();
    if (session) {
        redirect('/admin');
    }

    return <SignupForm />;
}
