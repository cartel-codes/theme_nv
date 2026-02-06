
import { getAdminOrders } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

function currencyFmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function dateFmt(d: Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

export default async function AdminOrdersPage() {
    const admin = await getSession();
    if (!admin) redirect('/admin/login');

    const orders = await getAdminOrders();

    const totalOrders = orders.length;
    const paidCount = orders.filter(o => o.status === 'paid').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

    return (
        <div className="space-y-8 max-w-[1400px]">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 mb-1 font-normal">Management</p>
                    <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Orders</h1>
                    <p className="text-novraux-ash dark:text-novraux-bone/60 mt-2 font-light text-sm transition-colors">
                        {totalOrders} order{totalOrders !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors"
                >
                    ← Dashboard
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-novraux-graphite p-5 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal mb-2">Total Orders</h3>
                    <p className="text-2xl font-serif text-novraux-obsidian dark:text-novraux-bone">{totalOrders}</p>
                </div>
                <div className="bg-white dark:bg-novraux-graphite p-5 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal mb-2">Paid</h3>
                    <p className="text-2xl font-serif text-emerald-600 dark:text-emerald-400">{paidCount}</p>
                </div>
                <div className="bg-white dark:bg-novraux-graphite p-5 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal mb-2">Pending</h3>
                    <p className="text-2xl font-serif text-amber-600 dark:text-amber-400">{pendingCount}</p>
                </div>
                <div className="bg-white dark:bg-novraux-graphite p-5 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal mb-2">Revenue</h3>
                    <p className="text-2xl font-serif text-novraux-gold">{currencyFmt(totalRevenue)}</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                            <tr>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal">Order</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal">Date</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal">Customer</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal">Items</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal">Status</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 font-normal text-right">Total</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-novraux-obsidian dark:text-novraux-bone">#{order.id.slice(-8)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-novraux-ash dark:text-novraux-bone/60">
                                        {dateFmt(new Date(order.createdAt))}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-novraux-ash/10 dark:bg-novraux-obsidian flex items-center justify-center text-xs font-serif text-novraux-obsidian dark:text-novraux-bone flex-shrink-0">
                                                {(order.user?.firstName?.[0] || order.user?.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone truncate">
                                                    {order.user?.firstName
                                                        ? `${order.user.firstName} ${order.user.lastName || ''}`
                                                        : 'Unknown'}
                                                </p>
                                                <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 truncate">{order.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {order.items.slice(0, 3).map((item, i) => (
                                                    <div key={item.id} className="w-7 h-7 rounded-sm border border-white dark:border-novraux-graphite overflow-hidden flex-shrink-0 bg-novraux-ash/5 dark:bg-novraux-obsidian" style={{ zIndex: 3 - i }}>
                                                        {item.product?.imageUrl ? (
                                                            <Image src={item.product.imageUrl} alt={item.product.name} width={28} height={28} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center w-full h-full text-[7px] text-novraux-ash dark:text-novraux-bone/40">N</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs text-novraux-ash dark:text-novraux-bone/60">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-serif text-sm text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(order.total))}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-[10px] uppercase tracking-wider text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-medium"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <p className="text-novraux-ash dark:text-novraux-bone/60 font-light">No orders found</p>
                                        <p className="text-[10px] text-novraux-ash/60 dark:text-novraux-bone/40 mt-1">Orders will appear here once customers complete checkout</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
