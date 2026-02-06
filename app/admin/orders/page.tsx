
import { getAdminOrders } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminOrdersPage() {
    const admin = await getSession();
    if (!admin) redirect('/admin/login');

    const orders = await getAdminOrders();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-serif text-novraux-black mb-8">Order Management</h1>

            <div className="bg-white rounded-lg shadow-sm border border-novraux-grey/10 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-novraux-cream/20 text-novraux-grey uppercase tracking-wider text-xs font-medium border-b border-novraux-beige">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-novraux-grey/10">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-novraux-cream/10 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-novraux-black">
                                        {order.user?.firstName} {order.user?.lastName}
                                    </div>
                                    <div className="text-novraux-grey text-xs">{order.user?.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">${order.total.toString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/admin/orders/${order.id}`} className="text-novraux-charcoal hover:text-novraux-gold font-medium">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-novraux-grey">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
