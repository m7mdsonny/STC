import { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, AlertCircle, CheckCircle, XCircle, Package, Clock, RotateCcw } from 'lucide-react';
import { systemUpdatesApi } from '../../lib/api/systemUpdates';
import { useToast } from '../../contexts/ToastContext';
import { getDetailedErrorMessage } from '../../lib/errorMessages';
import type { SystemUpdate, UpdateManifest } from '../../lib/api/systemUpdates';

export function SystemUpdates() {
  const { showSuccess, showError, showWarning } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const data = await systemUpdatesApi.getUpdates();
      console.log('Fetched updates data:', data);
      
      // Ensure we have valid data
      if (data && Array.isArray(data.updates)) {
        setUpdates(data.updates);
        setCurrentVersion(data.current_version || '1.0.0');
      } else {
        console.warn('Invalid updates data structure:', data);
        setUpdates([]);
        setCurrentVersion('1.0.0');
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      setUpdates([]);
      setCurrentVersion('1.0.0');
      const { title, message } = getDetailedErrorMessage(error, 'تحميل التحديثات', 'فشل تحميل قائمة التحديثات');
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      showError('نوع ملف غير صحيح', 'يجب أن يكون ملف التحديث بصيغة ZIP');
      return;
    }

    setUploading(true);
    try {
      console.log('Uploading update package:', file.name, file.size);
      const result = await systemUpdatesApi.uploadPackage(file);
      console.log('Upload result:', result);
      
      showSuccess('تم رفع التحديث بنجاح', `تم رفع التحديث ${result.version} بنجاح. معرف التحديث: ${result.update_id}`);
      
      // Refresh updates list after successful upload (with delay to ensure file system is updated)
      setTimeout(() => {
        console.log('Refreshing updates list...');
        fetchUpdates();
      }, 1000);
    } catch (error) {
      console.error('Error uploading update:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل رفع حزمة التحديث';
      const { title, message } = getDetailedErrorMessage(error, 'رفع التحديث', errorMessage);
      showError(title, message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleInstall = async (updateId: string, version: string) => {
    if (!confirm(`هل أنت متأكد من تثبيت التحديث ${version}؟\nسيتم إنشاء نسخة احتياطية تلقائياً.`)) {
      return;
    }

    setInstalling(updateId);
    try {
      await systemUpdatesApi.installUpdate(updateId);
      showSuccess('تم التثبيت بنجاح', `تم تثبيت التحديث ${version} بنجاح`);
      await fetchUpdates();
    } catch (error) {
      console.error('Error installing update:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تثبيت التحديث', 'فشل تثبيت التحديث');
      showError(title, message);
    } finally {
      setInstalling(null);
    }
  };

  const getVersionTypeColor = (type?: string) => {
    switch (type) {
      case 'major': return 'bg-red-500/20 text-red-400';
      case 'minor': return 'bg-blue-500/20 text-blue-400';
      case 'patch': return 'bg-green-500/20 text-green-400';
      case 'hotfix': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getVersionTypeLabel = (type?: string) => {
    switch (type) {
      case 'major': return 'تحديث رئيسي';
      case 'minor': return 'تحديث ثانوي';
      case 'patch': return 'إصلاح';
      case 'hotfix': return 'إصلاح عاجل';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">نظام التحديثات</h1>
          <p className="text-white/60">إدارة وتثبيت تحديثات النظام</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-stc-gold/20 border border-stc-gold/50 rounded-lg">
            <span className="text-sm text-white/60">الإصدار الحالي:</span>
            <span className="text-stc-gold font-mono font-bold ml-2">{currentVersion}</span>
          </div>
          <button
            onClick={fetchUpdates}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-stc-gold" />
          رفع حزمة تحديث جديدة
        </h2>
        <div className="flex items-center gap-4">
          <label className="btn-primary cursor-pointer flex items-center gap-2" htmlFor="update-upload">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'جاري الرفع...' : 'اختر ملف ZIP'}</span>
            <input
              id="update-upload"
              type="file"
              accept=".zip"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-sm text-white/60">
            يجب أن يحتوي ملف ZIP على manifest.json وملفات التحديث
          </p>
        </div>
      </div>

      {/* Updates List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-stc-gold" />
          التحديثات المتاحة
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-stc-gold animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>لا توجد تحديثات متاحة</p>
            <p className="text-sm mt-2">قم برفع حزمة تحديث جديدة لبدء التثبيت</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`p-5 rounded-lg border ${
                  update.installed
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{update.manifest.title}</h3>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                        v{update.manifest.version}
                      </span>
                      {update.manifest.version_type && (
                        <span className={`px-3 py-1 rounded text-xs ${getVersionTypeColor(update.manifest.version_type)}`}>
                          {getVersionTypeLabel(update.manifest.version_type)}
                        </span>
                      )}
                      {update.installed && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          مثبت
                        </span>
                      )}
                    </div>

                    {update.manifest.description && (
                      <p className="text-sm text-white/70 mb-3">{update.manifest.description}</p>
                    )}

                    {update.manifest.requires_version && (
                      <div className="flex items-center gap-2 text-xs text-orange-400 mb-2">
                        <AlertCircle className="w-3 h-3" />
                        يتطلب الإصدار {update.manifest.requires_version} أو أحدث
                      </div>
                    )}

                    {update.manifest.affected_modules && update.manifest.affected_modules.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-white/50 mb-1">الوحدات المتأثرة:</p>
                        <div className="flex flex-wrap gap-2">
                          {update.manifest.affected_modules.map((module) => (
                            <span
                              key={module}
                              className="px-2 py-1 bg-white/5 rounded text-xs"
                            >
                              {module}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {update.manifest.release_notes && (
                      <details className="mt-3">
                        <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                          ملاحظات الإصدار
                        </summary>
                        <div className="mt-2 p-3 bg-white/5 rounded text-sm text-white/70 whitespace-pre-wrap">
                          {update.manifest.release_notes}
                        </div>
                      </details>
                    )}

                    {update.manifest.changelog && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                          سجل التغييرات
                        </summary>
                        <div className="mt-2 p-3 bg-white/5 rounded text-sm text-white/70 whitespace-pre-wrap">
                          {update.manifest.changelog}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!update.installed && (
                      <button
                        onClick={() => handleInstall(update.id, update.manifest.version)}
                        disabled={installing === update.id}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                      >
                        {installing === update.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري التثبيت...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>تثبيت</span>
                          </>
                        )}
                      </button>
                    )}
                    <div className="text-xs text-white/50 text-center">
                      ID: {update.id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/30">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          تعليمات إنشاء حزمة تحديث
        </h3>
        <div className="space-y-2 text-sm text-white/70">
          <p>1. قم بإنشاء مجلد باسم التحديث (مثال: 2025-01-15-120000)</p>
          <p>2. أضف ملف manifest.json يحتوي على معلومات التحديث</p>
          <p>3. أضف مجلد migrations/ للـ database migrations (اختياري)</p>
          <p>4. أضف مجلد files/ للملفات المحدثة (اختياري)</p>
          <p>5. أضف مجلد scripts/ للسكريبتات (اختياري)</p>
          <p>6. قم بضغط كل شيء في ملف ZIP</p>
          <p>7. ارفع الملف من هنا</p>
        </div>
      </div>
    </div>
  );
}

