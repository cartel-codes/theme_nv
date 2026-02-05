import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginForm from './LoginForm';

export default async function LoginPage() {
    // Redirect to admin dashboard if already authenticated
    const session = await getSession();
    if (session) {
        redirect('/admin');
    }

    return <LoginForm />;
}
