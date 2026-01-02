import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Key,
  CreditCard,
  Bell,
  Settings,
  Camera,
  AlertTriangle,
  BarChart3,
  Users,
  UserCog,
  Car,
  Zap,
  UserCheck,
  LogOut,
  MonitorPlay,
  Globe,
  Link2,
  MessageSquare,
  Server,
  Activity,
  Handshake,
  Sparkles,
  Cpu,
  Palette,
  Shield,
  Sliders,
  Database,
  UploadCloud,
  Type,
  BookOpen,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrganization, canEdit, normalizeRole } from '../../lib/rbac';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, organization, signOut, isSuperAdmin } = useAuth();
  const location = useLocation();
  
  const userRole = normalizeRole(profile?.role);
  const canManage = canManageOrganization(profile?.role);
  const canEditResources = canEdit(profile?.role);

  const superAdminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/admin/monitor', icon: Activity, label: 'مراقبة النظام' },
    { to: '/admin/organizations', icon: Building2, label: 'المؤسسات' },
    { to: '/admin/users', icon: UserCog, label: 'المستخدمين' },
    { to: '/admin/edge-servers', icon: Server, label: 'سيرفرات Edge' },
    { to: '/admin/licenses', icon: Key, label: 'التراخيص' },
    { to: '/admin/resellers', icon: Handshake, label: 'الموزعين' },
    { to: '/admin/plans', icon: CreditCard, label: 'الباقات' },
    { to: '/admin/ai-modules', icon: Sparkles, label: 'موديولات الذكاء الاصطناعي' },
    { to: '/admin/model-training', icon: Cpu, label: 'تدريب النماذج' },
    { to: '/admin/integrations', icon: Link2, label: 'التكاملات' },
    { to: '/admin/sms', icon: MessageSquare, label: 'الرسائل' },
    { to: '/admin/landing', icon: Globe, label: 'صفحة الهبوط' },
    { to: '/admin/notifications', icon: Bell, label: 'الاشعارات' },
    { to: '/admin/settings', icon: Settings, label: 'الاعدادات' },
    { to: '/admin/super-settings', icon: Sliders, label: 'تحكمات السوبر ادمن' },
    { to: '/admin/wordings', icon: Type, label: 'نصوص المنصة' },
    { to: '/admin/updates', icon: UploadCloud, label: 'إعلانات التحديثات' },
    { to: '/admin/system-updates', icon: UploadCloud, label: 'نظام التحديثات' },
    { to: '/admin/backups', icon: Database, label: 'النسخ الاحتياطية' },
  ];

  const orgLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/live', icon: MonitorPlay, label: 'البث المباشر', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/cameras', icon: Camera, label: 'الكاميرات', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/alerts', icon: AlertTriangle, label: 'التنبيهات', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/analytics', icon: BarChart3, label: 'التحليلات', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/people', icon: Users, label: 'الاشخاص', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/vehicles', icon: Car, label: 'المركبات', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/attendance', icon: UserCheck, label: 'الحضور', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/market', icon: ShoppingBag, label: 'Market', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/automation', icon: Zap, label: 'اوامر الذكاء الاصطناعي', roles: ['owner', 'admin', 'editor', 'viewer'] },
    { to: '/team', icon: UserCog, label: 'فريق العمل', roles: ['owner', 'admin'] }, // Only owners and admins
    { to: '/guide', icon: BookOpen, label: 'دليل المالك', roles: ['owner', 'admin'] },
    { to: '/settings', icon: Settings, label: 'الاعدادات', roles: ['owner', 'admin', 'editor', 'viewer'] },
  ];

  // Filter links based on role
  const getFilteredLinks = () => {
    if (isSuperAdmin) {
      return superAdminLinks;
    }
    
    return orgLinks.filter(link => {
      if (!link.roles) return true;
      return link.roles.includes(userRole);
    });
  };

  const links = getFilteredLinks();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 right-0 h-full w-72 bg-stc-navy z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        border-l border-white/10 flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <img
              src="/stc_solutions_logo.png"
              alt="STC Solutions"
              className="h-12 mx-auto"
            />
            <p className="text-center text-sm text-stc-gold mt-2">
              منصة تحليل الفيديو بالذكاء الاصطناعي
            </p>
          </div>

          {organization && !isSuperAdmin && (
            <div className="px-4 py-3 bg-stc-navy-light/50 border-b border-white/10">
              <p className="text-xs text-white/50">المؤسسة</p>
              <p className="font-medium text-white truncate">{organization.name}</p>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => `
                  sidebar-link
                  ${isActive || location.pathname === link.to ? 'active' : ''}
                `}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-stc-gold/20 flex items-center justify-center">
                <span className="text-stc-gold font-semibold">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {profile?.name || 'مستخدم'}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
