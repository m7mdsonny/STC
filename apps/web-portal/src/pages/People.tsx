import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Trash2, Edit2, UserCheck, UserX, Shield, Star, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { peopleApi } from '../lib/api/people';
import { edgeServersApi } from '../lib/api/edgeServers';
import { edgeServerService } from '../lib/edgeServer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import type { RegisteredFace } from '../types/database';

const CATEGORIES = [
  { id: 'employee', name: 'موظف', color: 'bg-blue-500' },
  { id: 'vip', name: 'VIP', color: 'bg-stc-gold' },
  { id: 'visitor', name: 'زائر', color: 'bg-emerald-500' },
  { id: 'blacklist', name: 'قائمة سوداء', color: 'bg-red-500' },
];

export function People() {
  const { organization, canManage } = useAuth();
  const { showSuccess, showError } = useToast();
  const [people, setPeople] = useState<RegisteredFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RegisteredFace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [encodingStatus, setEncodingStatus] = useState<'idle' | 'encoding' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    person_name: '',
    employee_id: '',
    department: '',
    category: 'employee' as RegisteredFace['category'],
  });

  useEffect(() => {
    if (organization) {
      fetchPeople();
      setupEdgeServer();
    }
  }, [organization]);

  const setupEdgeServer = async () => {
    try {
      const result = await edgeServersApi.getEdgeServers({ status: 'online' });
      const servers = result.data || [];

      if (servers.length > 0 && servers[0].ip_address) {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        await edgeServerService.setServerUrl(`${protocol}//${servers[0].ip_address}:8000`);
      }
    } catch (error) {
      console.error('Failed to setup edge server:', error);
    }
  };

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const result = await peopleApi.getPeople({
        organization_id: organization?.id,
      });
      setPeople(result.data || []);
    } catch (error) {
      console.error('Failed to fetch people:', error);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setEncodingStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) {
      showError('خطأ في تسجيل الدخول', 'يرجى التأكد من تسجيل الدخول بشكل صحيح');
      return;
    }

    if (!formData.person_name.trim()) {
      showError('بيانات غير مكتملة', 'يرجى إدخال اسم الشخص');
      return;
    }

    try {
      let faceId: string | null = null;

      if (selectedFile && !editingPerson) {
        setEncodingStatus('encoding');
        try {
          faceId = await edgeServerService.encodeFace(
            formData.person_name,
            formData.category,
            selectedFile,
            formData.employee_id || undefined,
            formData.department || undefined
          );

          if (!faceId) {
            setEncodingStatus('error');
            showError('فشل معالجة الصورة', 'فشل في معالجة الصورة. يرجى المحاولة مرة أخرى أو التحقق من اتصال Edge Server');
            return;
          }
          setEncodingStatus('success');
        } catch (faceError) {
          console.error('Face encoding error:', faceError);
          setEncodingStatus('error');
          showError('تحذير', 'فشل معالجة الصورة في Edge Server، سيتم حفظ البيانات بدون معالجة الوجه');
          // Continue without face encoding if Edge Server is unavailable
        }
      }

      const payload = {
        person_name: formData.person_name,
        employee_id: formData.employee_id || undefined,
        department: formData.department || undefined,
        category: formData.category,
        ...(previewUrl && { photo_url: previewUrl }),
      };

      if (editingPerson) {
        await peopleApi.updatePerson(editingPerson.id, payload);
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات ${formData.person_name} بنجاح`);
      } else {
        await peopleApi.createPerson(payload);
        showSuccess('تم الإضافة بنجاح', `تم إضافة ${formData.person_name} إلى النظام بنجاح`);
      }

      setShowModal(false);
      setEditingPerson(null);
      resetForm();
      setSelectedFile(null);
      setPreviewUrl(null);
      setEncodingStatus('idle');
      fetchPeople();
    } catch (error: any) {
      console.error('Failed to save person:', error);
      setEncodingStatus('error');
      const { title, message } = getDetailedErrorMessage(error, 'حفظ الشخص', 'حدث خطأ في حفظ الشخص');
      showError(title, message);
    }
  };

  const handleDelete = async (id: string) => {
    const person = people.find(p => p.id === id);
    if (!confirm(`هل أنت متأكد من حذف ${person?.person_name || 'هذا الشخص'}؟`)) return;
    try {
      await peopleApi.deletePerson(id);
      showSuccess('تم الحذف بنجاح', `تم حذف ${person?.person_name || 'الشخص'} من النظام`);
      fetchPeople();
    } catch (error) {
      console.error('Failed to delete person:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف الشخص', 'حدث خطأ في حذف الشخص');
      showError(title, message);
    }
  };

  const toggleActive = async (person: RegisteredFace) => {
    try {
      await peopleApi.toggleActive(person.id);
      const newStatus = person.is_active ? 'تعطيل' : 'تفعيل';
      showSuccess('تم التحديث', `تم ${newStatus} ${person.person_name} بنجاح`);
      fetchPeople();
    } catch (error) {
      console.error('Failed to toggle person status:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تغيير حالة الشخص', 'حدث خطأ في تغيير حالة الشخص');
      showError(title, message);
    }
  };

  const resetForm = () => {
    setFormData({
      person_name: '',
      employee_id: '',
      department: '',
      category: 'employee',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEncodingStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditModal = (person: RegisteredFace) => {
    setEditingPerson(person);
    setFormData({
      person_name: person.person_name,
      employee_id: person.employee_id || '',
      department: person.department || '',
      category: person.category,
    });
    setShowModal(true);
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (person.department?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || person.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const stats = {
    total: people.length,
    employees: people.filter(p => p.category === 'employee').length,
    vip: people.filter(p => p.category === 'vip').length,
    blacklist: people.filter(p => p.category === 'blacklist').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الاشخاص</h1>
          <p className="text-white/60">ادارة قاعدة بيانات الوجوه</p>
        </div>
        {canManage && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>اضافة شخص</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Users className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">الاجمالي</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <UserCheck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.employees}</p>
              <p className="text-sm text-white/60">الموظفين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Star className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.vip}</p>
              <p className="text-sm text-white/60">VIP</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.blacklist}</p>
              <p className="text-sm text-white/60">قائمة سوداء</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث بالاسم او الرقم الوظيفي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="all">كل الفئات</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد سجلات</h3>
          <p className="text-white/60 mb-4">ابدا باضافة اشخاص لقاعدة البيانات</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              اضافة شخص
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPeople.map((person) => {
            const category = getCategoryInfo(person.category);
            return (
              <div key={person.id} className="card overflow-hidden group">
                <div className="aspect-square bg-white/5 relative">
                  {person.photo_url ? (
                    <img src={person.photo_url} alt={person.person_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white ${category.color}`}>
                    {category.name}
                  </div>
                  {!person.is_active && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium bg-gray-500/80 text-white">
                      غير نشط
                    </div>
                  )}
                  {canManage && (
                    <div className="absolute bottom-3 right-3 left-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(person)}
                        className="p-2 bg-black/50 rounded hover:bg-black/70"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(person)}
                        className="p-2 bg-black/50 rounded hover:bg-black/70"
                      >
                        {person.is_active ? (
                          <UserX className="w-4 h-4 text-red-400" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="p-2 bg-black/50 rounded hover:bg-red-500/50"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{person.person_name}</h3>
                  <div className="text-sm text-white/60 mt-1 space-y-0.5">
                    {person.employee_id && <p>ID: {person.employee_id}</p>}
                    {person.department && <p>{person.department}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPerson(null); resetForm(); }}
        title={editingPerson ? 'تعديل الشخص' : 'اضافة شخص جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 bg-white/5 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden relative"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-white/40 mb-2" />
                  <span className="text-sm text-white/40">رفع صورة</span>
                </>
              )}
            </div>
          </div>
          {encodingStatus !== 'idle' && (
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
              encodingStatus === 'encoding' ? 'bg-blue-500/20 text-blue-400' :
              encodingStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {encodingStatus === 'encoding' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تشفير الوجه...</span>
                </>
              )}
              {encodingStatus === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>تم تشفير الوجه بنجاح</span>
                </>
              )}
              {encodingStatus === 'error' && (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>فشل تشفير الوجه - تاكد من اتصال السيرفر</span>
                </>
              )}
            </div>
          )}

          <div>
            <label className="label">الاسم</label>
            <input
              type="text"
              value={formData.person_name}
              onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الرقم الوظيفي</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">القسم</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">الفئة</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id as RegisteredFace['category'] })}
                  className={`p-3 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                    formData.category === cat.id
                      ? 'bg-stc-gold/20 border-stc-gold text-stc-gold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingPerson(null); resetForm(); }}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingPerson ? 'حفظ التعديلات' : 'اضافة الشخص'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
