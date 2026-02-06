import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getUserAuditLogs } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function currencyFmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function dateFmt(d: Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

function dayLabel(d: Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function AdminDashboard() {
    /* ---- data fetching (parallel) -------------------------------- */
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
        productCount,
        categoryCount,
        totalOrders,
        paidOrders,
        pendingOrders,
        ordersToday,
        recentOrders,
        recentProducts,
        avgPrice,
        userCount,
        newUsersMonth,
        postCount,
        lowStockItems,
        last7DaysOrders,
        auditLogsData,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'paid' } }),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.order.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, firstName: true, lastName: true } }, items: { include: { product: true } } },
        }),
        prisma.product.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        }),
        prisma.product.aggregate({ _avg: { price: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.post.count(),
        prisma.inventory.findMany({
            where: { quantity: { lte: 5 } },
            include: { product: true, variant: true },
            take: 6,
            orderBy: { quantity: 'asc' },
        }),
        prisma.order.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { total: true, createdAt: true, status: true },
            orderBy: { createdAt: 'asc' },
        }),
        // Fetch real audit logs
        getUserAuditLogs({ limit: 8 }),
    ]);

    /* ---- derived metrics ----------------------------------------- */
    const totalRevenue = paidOrders > 0
        ? (await prisma.order.aggregate({ where: { status: 'paid' }, _sum: { total: true } }))._sum.total ?? 0
        : 0;

    const avgOrderValue = paidOrders > 0 ? Number(totalRevenue) / paidOrders : 0;

    // Build a 7-day revenue sparkline
    const dayBuckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dayBuckets[dayLabel(d)] = 0;
    }
    last7DaysOrders.forEach(o => {
        const key = dayLabel(o.createdAt);
        if (key in dayBuckets) dayBuckets[key] += Number(o.total);
    });
    const sparkData = Object.entries(dayBuckets);
    const sparkMax = Math.max(...sparkData.map(([, v]) => v), 1);

    /* ---- format activity feed ------------------------------------ */
    // Helper to format action text and icon
    function formatLogAction(log: any) {
        switch (log.action) {
            case 'LOGIN_SUCCESS': return { icon: '🔓', text: `Login successful: ${log.email}` };
            case 'LOGIN_FAILED': return { icon: '🚫', text: `Failed login attempt: ${log.email}` };
            case 'PASSWORD_RESET_REQUESTED': return { icon: '🔑', text: `Password reset requested: ${log.email}` };
            case 'PASSWORD_RESET_COMPLETED': return { icon: '✅', text: `Password reset completed: ${log.email}` };
            case 'EMAIL_VERIFIED': return { icon: '📧', text: `Email verified: ${log.email}` };
            case 'USER_REGISTERED': // Fallthrough
            case 'SIGNUP': return { icon: '👤', text: `New user registered: ${log.email}` };
            case 'ORDER_PURCHASED': return { icon: '🛍️', text: `Order placed by ${log.email}` };
            default: return { icon: '📝', text: `${log.action.replace(/_/g, ' ')}: ${log.email}` };
        }
    }

    const activityFeed = auditLogsData.logs.map(log => {
        const { icon, text } = formatLogAction(log);

        // Calculate relative time (e.g., "2 hours ago")
        const diffMs = now.getTime() - new Date(log.createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeStr = 'Just now';
        if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        return { icon, text, time: timeStr };
    });

    return (
        <div className="space-y-8 max-w-[1400px]">
            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50 mb-1 font-normal">Overview</p>
                    <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Dashboard</h1>
                    <p className="text-novraux-ash dark:text-novraux-bone/60 mt-2 font-light text-sm transition-colors">
                        Welcome back to the atelier. Here&apos;s what&apos;s happening today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/products/new"
                        className="px-6 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-normal rounded-sm"
                    >
                        + New Product
                    </Link>
                    <Link
                        href="/admin/posts/new"
                        className="px-6 py-3 border border-novraux-ash/30 dark:border-novraux-bone/20 text-novraux-obsidian dark:text-novraux-bone text-xs uppercase tracking-novraux-medium hover:bg-novraux-obsidian hover:text-novraux-bone dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors font-normal rounded-sm"
                    >
                        + New Article
                    </Link>
                </div>
            </div>

            {/* ── KPI Cards (row 1) ───────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Revenue</h3>
                        <span className="text-lg">💰</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{currencyFmt(Number(totalRevenue))}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">From {paidOrders} paid orders</p>
                </div>

                {/* Orders Today */}
                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Orders Today</h3>
                        <span className="text-lg">🛍️</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{ordersToday}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">{pendingOrders} pending</p>
                </div>

                {/* Avg Order Value */}
                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Avg Order</h3>
                        <span className="text-lg">📊</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-gold">{currencyFmt(avgOrderValue)}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">Per transaction</p>
                </div>

                {/* Customers */}
                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Customers</h3>
                        <span className="text-lg">👥</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{userCount}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">+{newUsersMonth} this month</p>
                </div>
            </div>

            {/* ── KPI Cards (row 2) ───────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Products</h3>
                        <span className="text-lg">🏷️</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{productCount}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">Avg {currencyFmt(Number(avgPrice._avg.price || 0))}</p>
                </div>

                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Collections</h3>
                        <span className="text-lg">📂</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{categoryCount}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">Active groups</p>
                </div>

                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Articles</h3>
                        <span className="text-lg">📝</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{postCount}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">Published posts</p>
                </div>

                <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/60 font-normal">Total Orders</h3>
                        <span className="text-lg">📋</span>
                    </div>
                    <p className="text-3xl font-serif text-novraux-obsidian dark:text-novraux-bone">{totalOrders}</p>
                    <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 mt-1 uppercase tracking-wider">All time</p>
                </div>
            </div>

            {/* ── Revenue Sparkline (last 7 days) ─────────────────── */}
            <div className="bg-white dark:bg-novraux-graphite p-6 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-xl font-light text-novraux-obsidian dark:text-novraux-bone">Revenue — Last 7 Days</h2>
                    <span className="text-[10px] uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/50">Daily breakdown</span>
                </div>
                <div className="flex items-end gap-2 h-32">
                    {sparkData.map(([day, val]) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-novraux-ash dark:text-novraux-bone/50 font-normal">{currencyFmt(val)}</span>
                            <div
                                className="w-full bg-novraux-gold/80 dark:bg-novraux-gold/60 rounded-sm transition-all"
                                style={{ height: `${Math.max((val / sparkMax) * 100, 4)}%` }}
                            />
                            <span className="text-[9px] text-novraux-ash dark:text-novraux-bone/50 font-normal">{day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main Grid: Orders + Sidebar ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders (2 cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                        <h2 className="font-serif text-xl font-light text-novraux-obsidian dark:text-novraux-bone">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-[10px] uppercase tracking-novraux-medium text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors">
                            View All →
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-novraux-ash dark:text-novraux-bone/60 font-light">No orders yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-novraux-ash/10 dark:bg-novraux-obsidian flex items-center justify-center text-xs font-serif text-novraux-obsidian dark:text-novraux-bone">
                                            {(order.user?.firstName?.[0] || order.user?.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone truncate">
                                                {order.user?.firstName
                                                    ? `${order.user.firstName} ${order.user.lastName || ''}`
                                                    : order.user?.email || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50 truncate">
                                                {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {dateFmt(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                                            {order.status}
                                        </span>
                                        <span className="text-sm font-serif text-novraux-obsidian dark:text-novraux-bone w-20 text-right">
                                            {currencyFmt(Number(order.total))}
                                        </span>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-[10px] uppercase tracking-wider text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Low-Stock Alerts */}
                    <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                        <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                            <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone flex items-center gap-2">
                                <span className="text-base">⚠️</span> Low Stock
                            </h2>
                        </div>
                        {lowStockItems.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">All items well-stocked</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                                {lowStockItems.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-novraux-obsidian dark:text-novraux-bone truncate">{inv.product?.name || 'Unknown'}</p>
                                            {inv.variant && (
                                                <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50">{inv.variant.name}: {inv.variant.value}</p>
                                            )}
                                        </div>
                                        <span className={`text-sm font-serif ${inv.quantity === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {inv.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Feed (static) */}
                    <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                        <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                            <h2 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone">Activity</h2>
                        </div>
                        <div className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                            {activityFeed.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 px-6 py-3">
                                    <span className="text-base mt-0.5">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-novraux-obsidian dark:text-novraux-bone">{item.text}</p>
                                        <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Row: Products + Quick Actions ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Products */}
                <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                        <h2 className="font-serif text-xl font-light text-novraux-obsidian dark:text-novraux-bone">Latest Products</h2>
                        <Link href="/admin/products" className="text-[10px] uppercase tracking-novraux-medium text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors">
                            All Products →
                        </Link>
                    </div>
                    {recentProducts.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-novraux-ash dark:text-novraux-bone/60 font-light">No products yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-novraux-ash/10 dark:divide-novraux-obsidian">
                            {recentProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between px-6 py-4 hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-novraux-obsidian dark:text-novraux-bone truncate">{product.name}</p>
                                        <p className="text-[10px] text-novraux-ash dark:text-novraux-bone/50">
                                            {product.category?.name || 'Uncategorized'} • {currencyFmt(Number(product.price))}
                                        </p>
                                    </div>
                                    <Link href={`/admin/products/${product.id}`} className="text-[10px] uppercase tracking-wider text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors">
                                        Edit
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links / Admin Shortcuts */}
                <div className="bg-white dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <div className="px-6 py-5 border-b border-novraux-ash/10 dark:border-novraux-obsidian">
                        <h2 className="font-serif text-xl font-light text-novraux-obsidian dark:text-novraux-bone">Quick Actions</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-3">
                        <Link
                            href="/admin/products/new"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">🏷️</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Add Product</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">Create new listing</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/collections/new"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">📂</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Collection</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">New category</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/posts/new"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">📝</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Write Article</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">Blog / Journal</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">📋</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Orders</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">Manage & fulfill</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">👥</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Customers</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">View accounts</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/profile"
                            className="flex items-center gap-3 p-4 rounded-sm border border-novraux-ash/10 dark:border-novraux-obsidian hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/30 transition-colors group"
                        >
                            <span className="text-xl">⚙️</span>
                            <div>
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold transition-colors">Settings</p>
                                <p className="text-[9px] text-novraux-ash dark:text-novraux-bone/50">Admin profile</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
