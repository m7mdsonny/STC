import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { alertsApi } from '../../lib/api/alerts';
import { getRoleLabel } from '../../lib/rbac';
import type { Alert } from '../../types/database';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { profile, organization, isSuperAdmin } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin && organization) {
      fetchRecentAlerts();

      // Poll for new alerts every 30 seconds
      const interval = setInterval(() => {
        fetchRecentAlerts();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [organization, isSuperAdmin]);

  const fetchRecentAlerts = async () => {
    try {
      const response = await alertsApi.getAlerts({
        status: 'new',
        per_page: 10,
        page: 1
      });
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const newAlertsCount = alerts.filter(a => a.status === 'new').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <header className="h-16 bg-stc-navy/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg font-semibold text-white">
            {title || (isSuperAdmin ? 'لوحة تحكم المشرف' : 'لوحة التحكم')}
          </h1>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2
                       text-white placeholder-white/40 focus:outline-none focus:border-stc-gold/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
              {newAlertsCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full
                               text-xs flex items-center justify-center font-semibold">
                  {newAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-stc-navy rounded-xl
                            border border-white/10 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold">التنبيهات الاخيرة</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="p-4 text-center text-white/50">لا توجد تنبيهات</p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{alert.title}</p>
                            <p className="text-xs text-white/50 truncate">
                              {alert.description}
                            </p>
                            <p className="text-xs text-white/30 mt-1">
                              {new Date(alert.created_at).toLocaleString('ar-EG')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <a
                  href="/alerts"
                  className="block p-3 text-center text-sm text-stc-gold hover:bg-white/5"
                >
                  عرض كل التنبيهات
                </a>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-stc-gold/20 flex items-center justify-center">
              <span className="text-stc-gold font-semibold text-sm">
                {profile?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-white/50">
                {getRoleLabel(profile?.role)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
