
import { getAdminOrder } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import OrderStatusUpdater from './OrderStatusUpdater';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
    const admin = await getSession();
    if (!admin) redirect('/admin/login');

    const order = await getAdminOrder(params.id);

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-serif mb-4">Order Not Found</h1>
                <Link href="/admin/orders" className="text-novraux-gold underline">Back to Orders</Link>
            </div>
        );
    }

    let shippingAddress: any = {};
    try {
        shippingAddress = JSON.parse(order.shippingAddress as string);
    } catch (e) {
        // Fallback
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin/orders" className="text-xs text-novraux-grey hover:text-novraux-black mb-2 inline-block">
                        ← Back to List
                    </Link>
                    <h1 className="text-3xl font-serif text-novraux-black">Order #{order.id.slice(-8)}</h1>
                    <p className="text-sm text-novraux-grey mt-2">Placed: {new Date(order.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-novraux-grey">User ID: <span className="font-mono">{order.userId}</span></p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-novraux-grey/10">
                    <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Items & Customer */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Items */}
                    <div className="bg-white rounded-lg shadow-sm border border-novraux-grey/10 p-6">
                        <h2 className="text-sm font-medium uppercase tracking-widest mb-6 pb-2 border-b border-novraux-grey/10">Items</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-novraux-cream/20 rounded flex items-center justify-center text-xs text-novraux-grey">Img</div>
                                        <div>
                                            <p className="font-medium text-novraux-black">{item.product.name}</p>
                                            <p className="text-xs text-novraux-grey">
                                                {item.variantId ? `Variant: ${item.variant?.name}` : 'Standard'} • Qty: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-mono text-sm">${item.priceAtPurchase.toString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div className="bg-white rounded-lg shadow-sm border border-novraux-grey/10 p-6 flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h2 className="text-sm font-medium uppercase tracking-widest mb-4 pb-2 border-b border-novraux-grey/10">Customer</h2>
                            <p className="font-medium">{order.user?.firstName} {order.user?.lastName}</p>
                            <p className="text-novraux-grey">{order.user?.email}</p>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-medium uppercase tracking-widest mb-4 pb-2 border-b border-novraux-grey/10">Shipping Address</h2>
                            <div className="text-sm text-novraux-grey">
                                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                <p>{shippingAddress.street}</p>
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                                <p>{shippingAddress.country}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Financials */}
                <div className="space-y-8">
                    <div className="bg-novraux-cream/10 rounded-lg border border-novraux-grey/10 p-6">
                        <h2 className="text-sm font-medium uppercase tracking-widest mb-6 pb-2 border-b border-novraux-grey/10">Payment Details</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-novraux-grey">Subtotal</span>
                                <span>${order.subtotal.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-novraux-grey">Shipping</span>
                                <span>${order.shipping.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-novraux-grey">Tax</span>
                                <span>${order.tax.toString()}</span>
                            </div>
                            <div className="flex justify-between font-medium text-lg pt-4 border-t border-novraux-grey/10 mt-4">
                                <span>Total</span>
                                <span>${order.total.toString()}</span>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-novraux-grey/10">
                            <p className="text-xs text-novraux-grey uppercase tracking-wide mb-1">Payment ID (PayPal)</p>
                            <p className="font-mono text-xs bg-white p-2 rounded border border-novraux-grey/20 break-all select-all">
                                {order.paymentId}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
