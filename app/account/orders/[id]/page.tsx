
import { getUserSession } from '@/lib/user-auth';
import { getUserOrder } from '@/lib/orders';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('userSession')?.value;
    if (!sessionToken) redirect('/auth/login');

    const session = await getUserSession(sessionToken);
    if (!session) redirect('/auth/login');

    const { id } = await params;
    const order = await getUserOrder(session.user.id, id);

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <h1 className="text-2xl font-serif mb-4">Order Not Found</h1>
                <p className="text-novraux-grey mb-8">The order you are looking for does not exist or you do not have permission to view it.</p>
                <Link href="/account/orders" className="text-novraux-black underline underline-offset-4">Back to Orders</Link>
            </div>
        );
    }

    let shippingAddress: any = {};
    try {
        shippingAddress = JSON.parse(order.shippingAddress as string);
    } catch (e) {
        // Fallback for parsing error
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-novraux-grey/20">
                <div>
                    <Link href="/account/orders" className="text-xs text-novraux-grey hover:text-novraux-black mb-2 inline-block">
                        ← Back to History
                    </Link>
                    <h1 className="text-3xl font-serif text-novraux-black">Order #{order.id.slice(-8)}</h1>
                    <p className="text-sm text-novraux-grey mt-2">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                    </span>
                    <p className="text-xs text-novraux-grey mt-2">Payment ID: {order.paymentId || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                    {/* Items List */}
                    <div className="bg-white rounded-lg border border-novraux-grey/20 p-6">
                        <h2 className="text-sm font-medium uppercase tracking-widest mb-6 pb-2 border-b border-novraux-grey/10">Items Purchased</h2>
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {/* Placeholder for Product Image - ideally fetch optimized image */}
                                        <div className="w-16 h-16 bg-novraux-grey/10 rounded flex items-center justify-center text-xs text-novraux-grey/50">
                                            Img
                                        </div>
                                        <div>
                                            <p className="font-medium text-novraux-black">{item.product?.name || 'Product'}</p>
                                            {item.variantId && (
                                                <p className="text-sm text-novraux-grey">Variant: {item.variant?.name || 'Standard'}</p>
                                            )}
                                            <p className="text-sm text-novraux-grey">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono text-sm">${item.priceAtPurchase.toString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="bg-white rounded-lg border border-novraux-grey/20 p-6">
                        <h2 className="text-sm font-medium uppercase tracking-widest mb-6 pb-2 border-b border-novraux-grey/10">Shipping Details</h2>
                        <div className="text-sm text-novraux-grey leading-relaxed">
                            <p className="font-medium text-novraux-black mb-1">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                            <p>{shippingAddress.street}</p>
                            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                            <p>{shippingAddress.country}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    {/* Order Summary */}
                    <div className="bg-novraux-cream/20 rounded-lg p-6 sticky top-8">
                        <h2 className="text-sm font-medium uppercase tracking-widest mb-6 pb-2 border-b border-novraux-grey/10">Summary</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-novraux-grey">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toString()}</span>
                            </div>
                            <div className="flex justify-between text-novraux-grey">
                                <span>Shipping</span>
                                <span>${order.shipping.toString()}</span>
                            </div>
                            <div className="flex justify-between text-novraux-grey">
                                <span>Tax</span>
                                <span>${order.tax.toString()}</span>
                            </div>
                            <div className="flex justify-between font-medium text-lg pt-4 border-t border-novraux-grey/10 mt-4">
                                <span>Total</span>
                                <span>${order.total.toString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
