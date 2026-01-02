import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Tag, Download, FileText, Calendar, AlertCircle } from 'lucide-react';
import { updatesApi, organizationsApi } from '../../lib/api';
import type { UpdateAnnouncement, Organization } from '../../types/database';

export function AdminUpdates() {
  const [updates, setUpdates] = useState<UpdateAnnouncement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState<Partial<UpdateAnnouncement>>({
    title: '',
    version: '',
    version_type: 'patch',
    body: '',
    release_notes: '',
    changelog: '',
    affected_modules: [],
    requires_manual_update: false,
    download_url: '',
    checksum: '',
    file_size_mb: null,
    organization_id: null,
    is_published: false,
    release_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [list, orgs] = await Promise.all([updatesApi.list(), organizationsApi.getOrganizations()]);
      setUpdates(list);
      setOrganizations(orgs.data);
    } catch (error) {
      console.error('Error loading updates', error);
    } finally {
      setLoading(false);
    }
  };

  const createUpdate = async () => {
    if (!form.title || !form.title.trim()) {
      alert('يرجى إدخال عنوان التحديث');
      return;
    }
    if (!form.version || !form.version.trim()) {
      alert('يرجى إدخال رقم الإصدار (مثال: 1.0.0)');
      return;
    }
    if (!form.version_type) {
      alert('يرجى اختيار نوع الإصدار');
      return;
    }
    setSaving(true);
    try {
      await updatesApi.create(form);
      setForm({
        title: '',
        version: '',
        version_type: 'patch',
        body: '',
        release_notes: '',
        changelog: '',
        affected_modules: [],
        requires_manual_update: false,
        download_url: '',
        checksum: '',
        file_size_mb: null,
        organization_id: null,
        is_published: false,
        release_date: new Date().toISOString().split('T')[0],
      });
      await fetchAll();
      alert('تم إنشاء الإصدار بنجاح');
    } catch (error) {
      console.error('Error creating update', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في إنشاء الإصدار');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id: number) => {
    try {
      await updatesApi.toggle(id);
      await fetchAll();
    } catch (error) {
      console.error('Error toggling publish', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في تغيير حالة النشر');
    }
  };

  const removeUpdate = async (id: number) => {
    if (!confirm('حذف التحديث؟')) return;
    try {
      await updatesApi.remove(id);
      await fetchAll();
    } catch (error) {
      console.error('Error removing update', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في حذف التحديث');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الإصدارات</h1>
          <p className="text-white/60">إدارة إصدارات المنصة وإطلاق التحديثات</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5 text-stc-gold" />
          إنشاء إصدار جديد
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="العنوان"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="رقم الإصدار (مثال: 1.0.0)"
            value={form.version || ''}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
          <select
            className="input"
            value={form.version_type || 'patch'}
            onChange={(e) => setForm({ ...form, version_type: e.target.value as any })}
          >
            <option value="major">Major (تغييرات كبيرة)</option>
            <option value="minor">Minor (ميزات جديدة)</option>
            <option value="patch">Patch (إصلاحات)</option>
            <option value="hotfix">Hotfix (إصلاحات عاجلة)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="input"
            value={form.organization_id || ''}
            onChange={(e) => setForm({ ...form, organization_id: e.target.value || null })}
          >
            <option value="">عام (لجميع المؤسسات)</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            placeholder="تاريخ الإصدار"
            value={form.release_date || ''}
            onChange={(e) => setForm({ ...form, release_date: e.target.value })}
          />
        </div>

        <textarea
          className="input min-h-[100px]"
          placeholder="الوصف"
          value={form.body || ''}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        <textarea
          className="input min-h-[120px]"
          placeholder="ملاحظات الإصدار (Release Notes)"
          value={form.release_notes || ''}
          onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
        />

        <textarea
          className="input min-h-[150px]"
          placeholder="سجل التغييرات (Changelog)"
          value={form.changelog || ''}
          onChange={(e) => setForm({ ...form, changelog: e.target.value })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="رابط التحميل (اختياري)"
            value={form.download_url || ''}
            onChange={(e) => setForm({ ...form, download_url: e.target.value })}
          />
          <input
            type="number"
            className="input"
            placeholder="حجم الملف (MB)"
            value={form.file_size_mb || ''}
            onChange={(e) => setForm({ ...form, file_size_mb: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!form.requires_manual_update}
              onChange={(e) => setForm({ ...form, requires_manual_update: e.target.checked })}
            />
            يتطلب تحديث يدوي
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            نشر مباشرة
          </label>
        </div>

        <button onClick={createUpdate} className="btn-primary w-fit flex items-center gap-2" disabled={saving || !form.title || !form.version}>
          <Plus className="w-4 h-4" />
          <span>{saving ? 'جاري الحفظ...' : 'إنشاء الإصدار'}</span>
        </button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-stc-gold" />
          سجل الإصدارات
        </h2>
        {loading ? (
          <p className="text-white/60">جاري التحميل...</p>
        ) : updates.length === 0 ? (
          <p className="text-white/60">لا توجد إصدارات.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-stc-gold" />
                      <p className="font-semibold">{update.title}</p>
                      {update.version && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">
                          v{update.version}
                        </span>
                      )}
                      {update.version_type && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          update.version_type === 'major' ? 'bg-red-500/20 text-red-400' :
                          update.version_type === 'minor' ? 'bg-blue-500/20 text-blue-400' :
                          update.version_type === 'patch' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {update.version_type === 'major' ? 'تحديث رئيسي' :
                           update.version_type === 'minor' ? 'تحديث ثانوي' :
                           update.version_type === 'patch' ? 'إصلاح' : 'إصلاح عاجل'}
                        </span>
                      )}
                      {update.is_published && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                          منشور
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mb-2">
                      {update.organization_id ? `مخصص للمؤسسة: ${organizations.find(o => o.id === update.organization_id)?.name || update.organization_id}` : 'عام لجميع المؤسسات'}
                      {update.release_date && ` • ${new Date(update.release_date).toLocaleDateString('ar-EG')}`}
                    </p>
                    {update.body && (
                      <p className="text-sm text-white/70 mb-2 line-clamp-2">{update.body}</p>
                    )}
                    {update.release_notes && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-400 cursor-pointer">ملاحظات الإصدار</summary>
                        <p className="text-sm text-white/70 mt-2 whitespace-pre-wrap">{update.release_notes}</p>
                      </details>
                    )}
                    {update.download_url && (
                      <a
                        href={update.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        <Download className="w-4 h-4" />
                        تحميل الإصدار
                        {update.file_size_mb && ` (${update.file_size_mb} MB)`}
                      </a>
                    )}
                    {update.requires_manual_update && (
                      <div className="flex items-center gap-1 text-xs text-orange-400 mt-2">
                        <AlertCircle className="w-3 h-3" />
                        يتطلب تحديث يدوي
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublish(update.id)}
                      className="p-2 rounded-lg hover:bg-white/10"
                      title={update.is_published ? 'إلغاء النشر' : 'نشر'}
                    >
                      {update.is_published ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/50" />
                      )}
                    </button>
                    <button
                      onClick={() => removeUpdate(update.id)}
                      className="p-2 rounded-lg hover:bg-white/10 text-red-400"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
