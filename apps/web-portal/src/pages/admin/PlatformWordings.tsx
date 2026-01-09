import { useEffect, useState } from 'react';
import { Type, Plus, Trash2, Save, Search, Tag, Globe, Loader2, Filter } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';

interface PlatformWording {
  id: number;
  key: string;
  label: string | null;
  value_ar: string | null;
  value_en: string | null;
  category: string;
  context: string | null;
  description: string | null;
  is_customizable: boolean;
}

export function PlatformWordings() {
  const [wordings, setWordings] = useState<PlatformWording[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<PlatformWording>>({});
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchWordings();
  }, [category]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchWordings();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchWordings = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (search) params.search = search;
      
      const response = await apiClient.get('/api/v1/wordings', { params });
      setWordings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching wordings:', error);
      setWordings([]);
      showError('خطأ في التحميل', 'فشل تحميل النصوص');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      await apiClient.put(`/api/v1/wordings/${id}`, form);
      setEditing(null);
      setForm({});
      await fetchWordings();
      showSuccess('تم الحفظ', 'تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving wording:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في حفظ التغييرات';
      showError('خطأ في الحفظ', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النص؟')) return;
    try {
      await apiClient.delete(`/api/v1/wordings/${id}`);
      await fetchWordings();
      showSuccess('تم الحذف', 'تم حذف النص بنجاح');
    } catch (error) {
      console.error('Error deleting wording:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في الحذف';
      showError('خطأ في الحذف', errorMessage);
    }
  };

  const categories = Array.from(new Set(wordings.map(w => w.category).filter(Boolean))).sort();

  // Filter wordings based on category filter
  const filteredWordings = category 
    ? wordings.filter(w => w.category === category)
    : wordings;

  // Group filtered wordings by category for better organization
  const groupedWordings = filteredWordings.reduce((acc, wording) => {
    const cat = wording.category || 'غير مصنف';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(wording);
    return acc;
  }, {} as Record<string, PlatformWording[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Type className="w-6 h-6 text-stc-gold" />
            إدارة نصوص المنصة
          </h1>
          <p className="text-white/60">تعديل وإدارة جميع النصوص والعناوين في المنصة</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="بحث في النصوص..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pr-10"
            />
          </div>
          <select
            className="input w-48"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">جميع الفئات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-stc-gold animate-spin" />
          </div>
        ) : filteredWordings.length === 0 ? (
          <p className="text-white/60 text-center py-8">لا توجد نصوص.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedWordings).map(([cat, catWordings]) => (
              <div key={cat}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-stc-gold" />
                  {cat}
                  <span className="text-sm text-white/50 font-normal">({catWordings.length})</span>
                </h3>
                <div className="space-y-3">
                  {catWordings.map((wording) => (
              <div
                key={wording.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {editing === wording.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-stc-gold" />
                        <span className="font-mono text-sm text-white/60">{wording.key}</span>
                        {wording.category && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {wording.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(wording.id)}
                          disabled={saving}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          حفظ
                        </button>
                        <button
                          onClick={() => {
                            setEditing(null);
                            setForm({});
                          }}
                          disabled={saving}
                          className="btn-secondary text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">العنوان (Label)</label>
                      <input
                        type="text"
                        className="input"
                        value={form.label || wording.label || ''}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        النص بالعربية
                      </label>
                      <textarea
                        className="input min-h-[80px]"
                        value={form.value_ar !== undefined ? form.value_ar : (wording.value_ar || '')}
                        onChange={(e) => setForm({ ...form, value_ar: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        النص بالإنجليزية
                      </label>
                      <textarea
                        className="input min-h-[80px]"
                        value={form.value_en !== undefined ? form.value_en : (wording.value_en || '')}
                        onChange={(e) => setForm({ ...form, value_en: e.target.value })}
                      />
                    </div>
                    {wording.description && (
                      <p className="text-xs text-white/50">{wording.description}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{wording.label || wording.key}</span>
                        <span className="font-mono text-xs text-white/40">{wording.key}</span>
                        {wording.category && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {wording.category}
                          </span>
                        )}
                        {!wording.is_customizable && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            غير قابل للتخصيص
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-white/50">عربي:</span>
                          <p className="text-white/80">{wording.value_ar || '-'}</p>
                        </div>
                        <div>
                          <span className="text-white/50">English:</span>
                          <p className="text-white/80">{wording.value_en || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(wording.id);
                          setForm({
                            label: wording.label,
                            value_ar: wording.value_ar,
                            value_en: wording.value_en,
                          });
                        }}
                        className="btn-secondary text-sm"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(wording.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

