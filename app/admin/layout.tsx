import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/session';
import AdminLogoutButton from './AdminLogoutButton';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const pathname = (await headers()).get('x-pathname') || '';

    // Redirect to login if no valid session on protected pages
    if (!session && !pathname.includes('/admin/login') && !pathname.includes('/admin/signup')) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-novraux-charcoal text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <Link href="/" className="font-serif text-2xl tracking-widest uppercase">
                        Novraux
                    </Link>
                    <span className="text-xs text-novraux-grey block mt-1 uppercase tracking-wider">Backoffice</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/products"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors"
                    >
                        Products
                    </Link>
                    <Link
                        href="/admin/collections"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors"
                    >
                        Collections
                    </Link>
                    <Link
                        href="/admin/posts"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors"
                    >
                        Articles
                    </Link>
                    <Link
                        href="/admin/orders"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors opacity-50 cursor-not-allowed"
                    >
                        Orders (Soon)
                    </Link>
                    <Link
                        href="/admin/profile"
                        className="block px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors"
                    >
                        Profile
                    </Link>
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-white/10 space-y-3">
                    {session && (
                        <div className="text-xs">
                            <p className="text-white/70">Signed in as</p>
                            <p className="text-white font-medium truncate">{session.email}</p>
                        </div>
                    )}
                    <AdminLogoutButton />
                    <Link href="/" className="text-xs text-novraux-grey hover:text-white transition-colors block">
                        &larr; Return to Store
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
