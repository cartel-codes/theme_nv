export default function SyncStatus({ provider }: { provider: string }) {
    return (
        <div className="bg-novraux-bone/5 rounded-sm p-6 border border-novraux-bone/10">
            <h3 className="text-lg font-serif text-novraux-bone mb-4">Integration Status</h3>

            <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between text-xs pb-4 border-b border-novraux-bone/5">
                    <span className="text-novraux-bone/60 uppercase tracking-novraux-medium">Connection</span>
                    <span className="flex items-center gap-2 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Active
                    </span>
                </div>

                {/* Provider Info */}
                <div className="space-y-2">
                    <p className="text-xs text-novraux-bone/40 uppercase tracking-widest">Active Provider</p>
                    <p className="text-novraux-bone text-sm capitalize">{provider}</p>
                </div>

                {/* Last Sync */}
                <div className="space-y-2">
                    <p className="text-xs text-novraux-bone/40 uppercase tracking-widest">Last Sync</p>
                    <p className="text-novraux-bone text-sm">{new Date().toLocaleDateString()}</p>
                </div>

                {/* Stats (Mock for now) */}
                <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="bg-novraux-bone/5 p-3 rounded-sm">
                        <p className="text-xs text-novraux-bone/40 mb-1">Products</p>
                        <p className="text-xl text-novraux-bone">--</p>
                    </div>
                    <div className="bg-novraux-bone/5 p-3 rounded-sm">
                        <p className="text-xs text-novraux-bone/40 mb-1">Orders</p>
                        <p className="text-xl text-novraux-bone">--</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
