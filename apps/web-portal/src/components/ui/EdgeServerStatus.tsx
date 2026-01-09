import { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { edgeServerService, EdgeServerStatus as ServerStatus } from '../../lib/edgeServer';
import { edgeServersApi } from '../../lib/api/edgeServers';
import { useAuth } from '../../contexts/AuthContext';

export function EdgeServerStatus() {
  const { organization } = useAuth();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchServerAndConnect();
    }
  }, [organization]);

  const fetchServerAndConnect = async () => {
    setLoading(true);

    try {
      const response = await edgeServersApi.getEdgeServers({ status: 'online', per_page: 1 });

      if (response.data && response.data.length > 0) {
        const server = response.data[0];
        if (server.ip_address) {
          // Use same protocol as current page to avoid Mixed Content errors
          const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
          const url = `${protocol}//${server.ip_address}:8000`;
          await edgeServerService.setServerUrl(url);

          const serverStatus = await edgeServerService.getStatus();
          if (serverStatus) {
            setStatus(serverStatus);
            setConnected(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching edge server:', error);
    }

    setLoading(false);
  };

  const refreshStatus = async () => {
    setLoading(true);
    const serverStatus = await edgeServerService.getStatus();
    if (serverStatus) {
      setStatus(serverStatus);
      setConnected(true);
    } else {
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
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-white/5 rounded-lg text-center">
            <p className="text-lg font-bold text-stc-gold">{status.cameras}</p>
            <p className="text-[10px] text-white/50">كاميرا</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">{status.integrations}</p>
            <p className="text-[10px] text-white/50">تكامل</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-400">{status.modules.length}</p>
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
