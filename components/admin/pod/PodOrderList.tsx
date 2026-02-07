'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PodOrderList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/print-providers/orders?limit=20');
            const data = await res.json();
            if (data.data) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-novraux-bone/60 text-xs p-4">Loading orders...</div>;

    if (orders.length === 0) {
        return (
            <div className="text-center p-8 text-novraux-bone/40 text-sm border border-dashed border-novraux-bone/10 rounded-sm">
                No Print-on-Demand orders found.
            </div>
        );
    }

    return (
        <div className="bg-novraux-bone/5 rounded-sm border border-novraux-bone/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-novraux-bone/5 text-novraux-bone/60 uppercase tracking-novraux-medium">
                        <tr>
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Ext. ID</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-novraux-bone/5">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-novraux-bone/5 transition-colors">
                                <td className="p-3 text-novraux-bone font-medium">#{order.order?.orderNumber}</td>
                                <td className="p-3 text-novraux-bone/60">{order.externalOrderNumber}</td>
                                <td className="p-3 text-novraux-bone/80">{order.shippingAddress?.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-medium
                                        ${order.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                        ${order.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : ''}
                                        ${order.status === 'shipped' ? 'bg-green-500/20 text-green-400' : ''}
                                        ${order.status === 'failed' ? 'bg-red-500/20 text-red-400' : ''}
                                    `}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-3 text-novraux-bone/60">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                    <Link href={`/admin/orders/${order.orderId}`} className="text-novraux-bone hover:underline">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
