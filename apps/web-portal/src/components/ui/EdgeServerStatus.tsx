import { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { edgeServersApi } from '../../lib/api/edgeServers';
import { useAuth } from '../../contexts/AuthContext';

interface EdgeStatus {
  online: boolean;
  last_seen_at: string | null;
  version: string | null;
  cameras_count: number;
  license: {
    modules: string[];
  };
}

export function EdgeServerStatus() {
  const { organization } = useAuth();
  const [status, setStatus] = useState<EdgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [edgeServerId, setEdgeServerId] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      fetchServerStatus();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchServerStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [organization]);

  const fetchServerStatus = async () => {
    setLoading(true);

    try {
      // Get the first edge server for this organization
      const response = await edgeServersApi.getEdgeServers({ per_page: 1 });

      if (response.data && response.data.length > 0) {
        const server = response.data[0];
        setEdgeServerId(server.id.toString());

        // Fetch status from Cloud API (NOT from Edge directly)
        // Cloud derives status from last heartbeat timestamp
        const serverStatus = await edgeServersApi.getStatus(server.id.toString());
        
        setStatus({
          online: serverStatus.online,
          last_seen_at: serverStatus.last_seen_at,
          version: serverStatus.version,
          cameras_count: serverStatus.cameras_count,
          license: {
            modules: serverStatus.license.modules,
          },
        });
        setConnected(serverStatus.online);
      } else {
        setConnected(false);
        setStatus(null);
      }
    } catch (error) {
      console.error('Error fetching edge server status:', error);
      setConnected(false);
      setStatus(null);
    }

    setLoading(false);
  };

  const refreshStatus = async () => {
    if (!edgeServerId) {
      await fetchServerStatus();
      return;
    }
    
    setLoading(true);
    try {
      const serverStatus = await edgeServersApi.getStatus(edgeServerId);
      setStatus({
        online: serverStatus.online,
        last_seen_at: serverStatus.last_seen_at,
        version: serverStatus.version,
        cameras_count: serverStatus.cameras_count,
        license: {
          modules: serverStatus.license.modules,
        },
      });
      setConnected(serverStatus.online);
    } catch (error) {
      console.error('Error refreshing edge server status:', error);
      setConnected(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-stc-gold" />
          <span className="text-white/60">جاري الاتصال بالسيرفر...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${connected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {connected ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold">السيرفر المحلي</h3>
            <p className="text-[10px] text-white/50">
              {connected ? 'متصل' : 'غير متصل'}
            </p>
          </div>
        </div>
        <button
          onClick={refreshStatus}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          title="تحديث"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {connected && status && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-white/5 rounded-lg text-center">
            <p className="text-lg font-bold text-stc-gold">{status.cameras_count}</p>
            <p className="text-[10px] text-white/50">كاميرا</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-400">{status.license.modules.length}</p>
            <p className="text-[10px] text-white/50">وحدة AI</p>
          </div>
        </div>
      )}

      {!connected && (
        <div className="text-center py-3">
          <Server className="w-10 h-10 mx-auto text-white/20 mb-2" />
          <p className="text-white/50 text-xs">لم يتم الاتصال بالسيرفر المحلي</p>
          <p className="text-white/30 text-[10px] mt-0.5">تاكد من تشغيل Edge Server</p>
        </div>
      )}
    </div>
  );
}
