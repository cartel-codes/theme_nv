
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(currentStatus);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update');

            router.refresh(); // Refresh server data
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
            setStatus(currentStatus); // Revert
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-novraux-grey uppercase tracking-wide">Status:</span>
            <select
                value={status}
                onChange={handleStatusChange}
                disabled={isLoading}
                className={`px-4 py-2 rounded border border-novraux-grey/20 bg-white text-sm font-medium uppercase focus:ring-1 focus:ring-novraux-gold outline-none
                    ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
            >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
            </select>
            {isLoading && <span className="text-xs text-novraux-gold animate-pulse">Updating...</span>}
        </div>
    );
}
