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

    // Allow login and signup pages without authentication
    const isPublicPage = pathname.includes('/admin/login') || pathname.includes('/admin/signup');

    // Redirect to login if no valid session on protected pages
    if (!session && !isPublicPage) {
        redirect('/admin/login');
    }

    // Render public pages (login/signup) without sidebar
    if (isPublicPage) {
        return <>{children}</>;
    }

    // At this point, we have a valid session - render full layout
    return (
        <div className="min-h-screen bg-novraux-bone dark:bg-novraux-obsidian flex font-sans transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-novraux-obsidian dark:bg-black text-novraux-bone flex-shrink-0 hidden md:flex flex-col transition-colors sticky top-0 h-screen overflow-y-auto">
                <div className="p-6 border-b border-novraux-bone/10">
                    <Link href="/" className="font-serif text-2xl tracking-widest uppercase text-novraux-bone">
                        Novraux
                    </Link>
                    <span className="text-xs text-novraux-bone/60 dark:text-novraux-bone/50 block mt-1 uppercase tracking-novraux-medium font-normal transition-colors">Backoffice</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/orders"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Orders
                    </Link>
                    <Link
                        href="/admin/products"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Products
                    </Link>
                    <Link
                        href="/admin/collections"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Collections
                    </Link>
                    <Link
                        href="/admin/posts"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Articles
                    </Link>
                    <Link
                        href="/admin/print-providers"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Print Providers
                    </Link>
                    <Link
                        href="/admin/ai-tools"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        AI Tools
                    </Link>
                    <Link
                        href="/admin/profile"
                        className="block px-4 py-2 rounded-sm text-xs font-normal text-novraux-bone hover:bg-novraux-bone/10 dark:hover:bg-novraux-bone/5 transition-colors uppercase tracking-novraux-medium"
                    >
                        Profile
                    </Link>
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-novraux-bone/10 space-y-3">
                    {session && (
                        <div className="text-xs">
                            <p className="text-novraux-bone/60 dark:text-novraux-bone/50 transition-colors">Signed in as</p>
                            <p className="text-novraux-bone font-normal truncate transition-colors">{session.email}</p>
                        </div>
                    )}
                    <AdminLogoutButton />
                    <Link href="/" className="text-xs text-novraux-bone/60 dark:text-novraux-bone/50 hover:text-novraux-bone transition-colors block font-normal">
                        &larr; Return to Store
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto bg-novraux-bone dark:bg-novraux-obsidian transition-colors">
                {children}
            </main>
        </div>
    );
}
