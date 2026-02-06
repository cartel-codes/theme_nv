
import { getAdminOrder } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import OrderStatusUpdater from './OrderStatusUpdater';

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

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
    const admin = await getSession();
    if (!admin) redirect('/admin/login');

    const order = await getAdminOrder(params.id);

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <h1 className="font-serif text-3xl text-novraux-obsidian dark:text-novraux-bone mb-4">Order Not Found</h1>
                <Link href="/admin/orders" className="text-[10px] uppercase tracking-novraux-medium text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors">
                    ← Back to Orders
                </Link>
            </div>
        );
    }

    let shippingAddress: any = {};
    try {
        shippingAddress = JSON.parse(order.shippingAddress as string);
    } catch (e) {
        // Fallback
    }

    const orderDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(order.createdAt));

    return (
        <div className="space-y-8 max-w-[1200px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <Link
                        href="/admin/orders"
                        className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors inline-block mb-3"
                    >
                        ← Back to Orders
                    </Link>
                    <h1 className="font-serif text-3xl md:text-4xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                        Order #{order.id.slice(-8)}
                    </h1>
                    <p className="text-xs text-novraux-ash dark:text-novraux-bone/50 mt-2">{orderDate}</p>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded text-[10px] uppercase tracking-wider font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {order.status}
                    </span>
                    <div className="bg-white dark:bg-novraux-graphite p-3 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite">
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                        <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                            <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">
                                Items ({order.items.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-sm overflow-hidden bg-novraux-ash/5 dark:bg-novraux-obsidian flex-shrink-0 border border-novraux-ash/10 dark:border-novraux-obsidian">
                                            {(() => {
                                                const imgUrl = item.product.imageUrl || item.product.images?.[0]?.url;
                                                return imgUrl ? (
                                                    <Image src={imgUrl} alt={item.product.name} width={56} height={56} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="flex items-center justify-center w-full h-full text-[9px] text-novraux-ash dark:text-novraux-bone/40 uppercase tracking-wider">No img</span>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <Link href={`/admin/products/${item.productId}`} className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone hover:text-novraux-gold transition-colors">
                                                {item.product.name}
                                            </Link>
                                            <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-0.5">
                                                {item.variantId ? `${item.variant?.name}: ${item.variant?.value}` : 'Standard'} &middot; Qty: {item.quantity}
                                            </p>
                                            <p className="text-[9px] text-novraux-ash/60 dark:text-novraux-bone/30 font-mono mt-0.5">SKU: {item.variant?.sku || item.productId.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-serif text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(item.priceAtPurchase) * item.quantity)}</p>
                                        <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50">{currencyFmt(Number(item.priceAtPurchase))} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer */}
                        <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                            <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                                <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">Customer</h2>
                            </div>
                            <div className="px-6 py-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-novraux-ash/10 dark:bg-novraux-obsidian flex items-center justify-center text-sm font-serif text-novraux-obsidian dark:text-novraux-bone">
                                        {(order.user?.firstName?.[0] || order.user?.email?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone">
                                            {order.user?.firstName} {order.user?.lastName}
                                        </p>
                                        <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50">{order.user?.email}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/40 font-mono mt-2">ID: {order.userId}</p>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                            <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                                <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">Shipping Address</h2>
                            </div>
                            <div className="px-6 py-5 text-sm text-novraux-ash dark:text-novraux-bone/70 space-y-0.5">
                                {shippingAddress.firstName && (
                                    <p className="text-novraux-obsidian dark:text-novraux-bone font-medium">
                                        {shippingAddress.firstName} {shippingAddress.lastName}
                                    </p>
                                )}
                                <p>{shippingAddress.street}</p>
                                <p>{shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.zip || shippingAddress.zipCode}</p>
                                <p>{shippingAddress.country}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Summary */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                        <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                            <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">Payment</h2>
                        </div>
                        <div className="px-6 py-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-novraux-ash dark:text-novraux-bone/60">Subtotal</span>
                                <span className="text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(order.subtotal))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-novraux-ash dark:text-novraux-bone/60">Shipping</span>
                                <span className="text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(order.shipping))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-novraux-ash dark:text-novraux-bone/60">Tax</span>
                                <span className="text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(order.tax))}</span>
                            </div>
                            <div className="flex justify-between pt-4 mt-4 border-t border-novraux-ash/10 dark:border-novraux-obsidian">
                                <span className="font-medium text-novraux-obsidian dark:text-novraux-bone">Total</span>
                                <span className="font-serif text-xl text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(order.total))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment ID */}
                    {order.paymentId && (
                        <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                            <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                                <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">PayPal</h2>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-[9px] uppercase tracking-wider text-novraux-ash dark:text-novraux-bone/50 mb-2">Payment ID</p>
                                <p className="font-mono text-xs bg-novraux-bone dark:bg-novraux-obsidian p-3 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian break-all select-all text-novraux-obsidian dark:text-novraux-bone">
                                    {order.paymentId}
                                </p>
                                <p className="text-[9px] uppercase tracking-wider text-novraux-ash dark:text-novraux-bone/50 mt-3 mb-1">Payment Status</p>
                                <p className="text-sm text-novraux-obsidian dark:text-novraux-bone">{order.paymentStatus}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
