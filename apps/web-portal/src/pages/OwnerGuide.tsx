import { useState } from 'react';
import { BookOpen, Server, Camera, Link2, CheckCircle, AlertCircle, Download, Code, Settings, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type StepStatus = 'pending' | 'in-progress' | 'completed';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  status: StepStatus;
  details: string[];
  codeExample?: string;
}

export function OwnerGuide() {
  const { organization } = useAuth();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const steps: GuideStep[] = [
    {
      id: '1',
      title: 'إنشاء Edge Server',
      description: 'إنشاء سيرفر Edge جديد في النظام',
      icon: Server,
      status: 'pending',
      details: [
        'انتقل إلى صفحة Settings > Edge Servers',
        'اضغط على "إضافة سيرفر"',
        'أدخل اسم السيرفر والموقع',
        'احفظ السيرفر الجديد',
        'سجل Edge ID الذي سيظهر بعد الإنشاء',
      ],
    },
    {
      id: '2',
      title: 'ربط Edge Server بالسحابة',
      description: 'ربط السيرفر المحلي بالسحابة باستخدام License Key',
      icon: Link2,
      status: 'pending',
      details: [
        'افتح تطبيق Edge Server على الجهاز المحلي',
        'انتقل إلى إعدادات الربط (Pairing)',
        'أدخل Cloud API URL: https://api.stcsolutions.online',
        'أدخل License Key من صفحة Licenses في البوابة',
        'اضغط "ربط" وانتظر تأكيد الاتصال',
        'تحقق من ظهور السيرفر في قائمة Edge Servers',
      ],
      codeExample: `# Edge Server Configuration
CLOUD_API_URL=https://api.stcsolutions.online
LICENSE_KEY=your-license-key-here
ORGANIZATION_ID=${organization?.id || 'YOUR_ORG_ID'}`,
    },
    {
      id: '3',
      title: 'إضافة الكاميرات',
      description: 'إضافة كاميرات جديدة وربطها بـ Edge Server',
      icon: Camera,
      status: 'pending',
      details: [
        'انتقل إلى صفحة Cameras',
        'اضغط "إضافة كاميرا"',
        'اختر Edge Server المرتبط',
        'أدخل RTSP URL للكاميرا',
        'أدخل اسم الكاميرا والموقع',
        'اختر الوحدات الذكية المطلوبة (Fire Detection, Face Recognition, etc.)',
        'احفظ الكاميرا',
      ],
    },
    {
      id: '4',
      title: 'تفعيل AI Modules',
      description: 'تفعيل وحدات الذكاء الاصطناعي المطلوبة',
      icon: Zap,
      status: 'pending',
      details: [
        'انتقل إلى صفحة AI Modules',
        'راجع الوحدات المتاحة حسب باقة الاشتراك',
        'اضغط "تفعيل" على الوحدات المطلوبة',
        'اضبط إعدادات كل وحدة (Confidence Threshold, Alert Threshold)',
        'احفظ الإعدادات',
      ],
    },
    {
      id: '5',
      title: 'إعداد الإشعارات',
      description: 'تكوين قنوات الإشعارات والتنبيهات',
      icon: Settings,
      status: 'pending',
      details: [
        'انتقل إلى Settings > Notifications',
        'فعّل قنوات الإشعارات المطلوبة (Push, SMS, Email)',
        'أضف أرقام الهواتف وعناوين البريد الإلكتروني',
        'اضبط أولويات التنبيهات',
        'اختبر الإشعارات',
      ],
    },
    {
      id: '6',
      title: 'إعداد التكاملات',
      description: 'ربط النظام بالأنظمة الخارجية (Arduino, SMS Gateway, etc.)',
      icon: Link2,
      status: 'pending',
      details: [
        'انتقل إلى صفحة Integrations',
        'اختر نوع التكامل المطلوب',
        'أدخل بيانات الاتصال (API Keys, URLs, etc.)',
        'اختبر الاتصال',
        'فعّل التكامل',
      ],
    },
  ];

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/50 bg-emerald-500/10';
      case 'in-progress':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-stc-gold" />
            دليل المالك
          </h1>
          <p className="page-subtitle">دليل شامل لإعداد وربط Edge Servers والكاميرات</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">مرحباً بك في دليل المالك</h2>
            <p className="text-white/70 mb-3">
              هذا الدليل سيساعدك في إعداد النظام بالكامل من ربط Edge Servers إلى إضافة الكاميرات وتفعيل وحدات الذكاء الاصطناعي.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-white/60">مكتمل</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span className="text-white/60">قيد التنفيذ</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-white/40" />
                <span className="text-white/60">لم يبدأ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isExpanded = expandedStep === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`card p-6 border-2 transition-all ${getStatusColor(step.status)}`}
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <Icon className="w-6 h-6 text-stc-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-stc-gold/20 text-stc-gold rounded-full text-sm font-semibold">
                        الخطوة {step.id}
                      </span>
                      {getStatusIcon(step.status)}
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-white/60 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 text-white/90">الخطوات التفصيلية:</h4>
                    <ol className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-white/70">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stc-gold/20 text-stc-gold flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{detail}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {step.codeExample && (
                    <div>
                      <h4 className="font-semibold mb-2 text-white/90 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        مثال على الإعدادات:
                      </h4>
                      <pre className="bg-black/30 p-4 rounded-lg overflow-x-auto text-sm text-white/80 font-mono">
                        <code>{step.codeExample}</code>
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4">
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => {
                        // Mark step as in-progress or completed
                        alert('سيتم تحديث حالة الخطوة قريباً');
                      }}
                    >
                      تم إكمال هذه الخطوة
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          موارد إضافية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert('سيتم إضافة رابط التحميل قريباً');
            }}
          >
            <h4 className="font-semibold mb-1">دليل Edge Server</h4>
            <p className="text-sm text-white/60">تحميل دليل التثبيت والإعداد</p>
          </a>
          <a
            href="#"
            className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert('سيتم إضافة رابط التحميل قريباً');
            }}
          >
            <h4 className="font-semibold mb-1">API Documentation</h4>
            <p className="text-sm text-white/60">مرجع واجهة برمجة التطبيقات</p>
          </a>
        </div>
      </div>
    </div>
  );
}

