
import { getUserSession } from '@/lib/user-auth';
import { getUserOrders } from '@/lib/orders';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const sessionToken = cookies().get('userSession')?.value;
    if (!sessionToken) redirect('/auth/login');

    const session = await getUserSession(sessionToken);
    if (!session) redirect('/auth/login');

    const orders = await getUserOrders(session.user.id);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-serif mb-8 text-novraux-black">Order History</h1>

            {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-novraux-grey/30 rounded-lg">
                    <p className="text-novraux-grey mb-4">You haven&apos;t placed any orders yet.</p>
                    <Link href="/products" className="text-novraux-black underline underline-offset-4 hover:text-novraux-gold transition-colors">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-novraux-grey/20 rounded-lg p-6 bg-white hover:border-novraux-gold/30 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-4 border-b border-novraux-grey/10">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-novraux-grey">Order ID</p>
                                    <p className="font-mono text-sm">#{order.id.slice(-8)}</p>
                                </div>
                                <div className="mt-2 md:mt-0">
                                    <p className="text-xs uppercase tracking-widest text-novraux-grey">Date</p>
                                    <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-2 md:mt-0">
                                    <p className="text-xs uppercase tracking-widest text-novraux-grey">Total</p>
                                    <p className="font-medium">${order.total.toString()}</p>
                                </div>
                                <div className="mt-2 md:mt-0">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-novraux-grey">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </span>
                                <Link
                                    href={`/account/orders/${order.id}`}
                                    className="text-sm border border-novraux-black px-4 py-2 hover:bg-novraux-black hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
