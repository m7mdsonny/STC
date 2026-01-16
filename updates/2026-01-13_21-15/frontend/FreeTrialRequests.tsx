import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, User, Mail, Phone, Building2, MessageSquare, 
  Calendar, CheckCircle2, XCircle, Clock, Send, Filter,
  ExternalLink, Sparkles, RefreshCw
} from 'lucide-react';
import { freeTrialApi, FreeTrialRequest } from '../../lib/api/freeTrial';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const FreeTrialRequests: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<FreeTrialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FreeTrialRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.is_super_admin) {
      loadRequests();
    }
  }, [user, filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : undefined;
      const data = await freeTrialApi.list(params);
      // TASK 1.C: Ensure data is always an array
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load free trial requests:', error);
      // TASK 1.C: Set empty array on error to prevent UI issues
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: FreeTrialRequest['status']) => {
    try {
      setUpdating(true);
      await freeTrialApi.update(requestId, { status: newStatus });
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await freeTrialApi.get(requestId);
        setSelectedRequest(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('فشل تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async (requestId: number) => {
    try {
      setUpdating(true);
      await freeTrialApi.update(requestId, { admin_notes: adminNotes });
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await freeTrialApi.get(requestId);
        setSelectedRequest(updated);
        setAdminNotes(updated.admin_notes || '');
      }
      showSuccess('تم الحفظ', 'تم حفظ الملاحظات بنجاح');
    } catch (error) {
      console.error('Failed to save notes:', error);
      showError('فشل الحفظ', 'فشل حفظ الملاحظات');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateOrganization = async (requestId: number) => {
    if (!confirm('هل أنت متأكد من إنشاء مؤسسة من هذا الطلب؟ سيتم إنشاء مؤسسة جديدة وإرسال بيانات الدخول للعميل.')) {
      return;
    }

    try {
      setUpdating(true);
      const result = await freeTrialApi.createOrganization(requestId);
      showSuccess('تم الإنشاء', result.message || 'تم إنشاء المؤسسة بنجاح وإرسال بيانات الدخول');
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await freeTrialApi.get(requestId);
        setSelectedRequest(updated);
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      showError('فشل الإنشاء', error.response?.data?.message || 'فشل إنشاء المؤسسة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectRequest = async (requestId: number) => {
    try {
      const request = await freeTrialApi.get(requestId);
      setSelectedRequest(request);
      setAdminNotes(request.admin_notes || '');
    } catch (error) {
      console.error('Failed to load request details:', error);
    }
  };

  const getStatusBadge = (status: FreeTrialRequest['status']) => {
    const colors: Record<string, string> = {
      new: 'badge-info',
      contacted: 'badge-warning',
      demo_scheduled: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      demo_completed: 'badge-success',
      converted: 'badge-success',
      rejected: 'badge-danger',
    };
    const labels: Record<string, string> = {
      new: 'جديد',
      contacted: 'تم التواصل',
      demo_scheduled: 'تم جدولة العرض',
      demo_completed: 'اكتمل العرض',
      converted: 'تم التحويل',
      rejected: 'مرفوض',
    };
    return (
      <span className={`badge ${colors[status] || colors.new}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!user?.is_super_admin) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-bold mb-2">غير مصرح</h3>
          <p className="text-white/60">يجب أن تكون Super Admin للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-stc-gold" />
            طلبات التجربة المجانية
          </h1>
          <p className="text-white/60 mt-1">إدارة طلبات التجربة المجانية والتحويل إلى مؤسسات</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5 text-stc-gold" />
                  الطلبات ({requests.length})
                </h2>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input max-w-xs"
                >
                  <option value="">جميع الحالات</option>
                  <option value="new">جديد</option>
                  <option value="contacted">تم التواصل</option>
                  <option value="demo_scheduled">تم جدولة العرض</option>
                  <option value="demo_completed">اكتمل العرض</option>
                  <option value="converted">تم التحويل</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-stc-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/50">جاري التحميل...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/50">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request.id)}
                    className={`p-5 cursor-pointer transition-all ${
                      selectedRequest?.id === request.id 
                        ? 'bg-stc-gold/10 border-r-4 border-stc-gold' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg truncate">{request.name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="space-y-1.5">
                          <p className="text-sm text-white/70 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-stc-gold flex-shrink-0" />
                            <span className="truncate">{request.email}</span>
                          </p>
                          
                          {request.company_name && (
                            <p className="text-sm text-white/70 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-stc-gold flex-shrink-0" />
                              <span>{request.company_name}</span>
                            </p>
                          )}
                          
                          {request.phone && (
                            <p className="text-sm text-white/70 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-stc-gold flex-shrink-0" />
                              <span dir="ltr">{request.phone}</span>
                            </p>
                          )}
                          
                          {request.selected_modules && request.selected_modules.length > 0 && (
                            <div className="flex items-start gap-2 mt-2">
                              <Sparkles className="w-4 h-4 text-stc-gold flex-shrink-0 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {request.selected_modules.slice(0, 3).map((module, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-stc-gold/20 text-stc-gold rounded text-xs">
                                    {module}
                                  </span>
                                ))}
                                {request.selected_modules.length > 3 && (
                                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs">
                                    +{request.selected_modules.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-white/40 mt-3 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(request.created_at).toLocaleDateString('ar-SA', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="card p-6 space-y-6 sticky top-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 pb-4 border-b border-white/10">
                <User className="w-5 h-5 text-stc-gold" />
                تفاصيل الطلب
              </h2>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="label text-xs">الاسم الكامل</label>
                  <p className="text-white font-medium">{selectedRequest.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="label text-xs">البريد الإلكتروني</label>
                  <p className="text-white font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stc-gold" />
                    {selectedRequest.email}
                  </p>
                </div>

                {selectedRequest.phone && (
                  <div className="space-y-2">
                    <label className="label text-xs">رقم الهاتف</label>
                    <p className="text-white font-medium flex items-center gap-2" dir="ltr">
                      <Phone className="w-4 h-4 text-stc-gold" />
                      {selectedRequest.phone}
                    </p>
                  </div>
                )}

                {selectedRequest.company_name && (
                  <div className="space-y-2">
                    <label className="label text-xs">اسم الشركة</label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-stc-gold" />
                      {selectedRequest.company_name}
                    </p>
                  </div>
                )}

                {selectedRequest.job_title && (
                  <div className="space-y-2">
                    <label className="label text-xs">المسمى الوظيفي</label>
                    <p className="text-white/80">{selectedRequest.job_title}</p>
                  </div>
                )}

                {selectedRequest.selected_modules && selectedRequest.selected_modules.length > 0 && (
                  <div className="space-y-2">
                    <label className="label text-xs">الوحدات المطلوبة</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.selected_modules.map((module, idx) => (
                        <span key={idx} className="px-3 py-1 bg-stc-gold/20 text-stc-gold rounded-lg text-sm font-medium">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.message && (
                  <div className="space-y-2">
                    <label className="label text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      الرسالة
                    </label>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{selectedRequest.message}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <label className="label text-xs mb-2 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    تغيير الحالة
                  </label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value as FreeTrialRequest['status'])}
                    disabled={updating}
                    className="input w-full"
                  >
                    <option value="new">جديد</option>
                    <option value="contacted">تم التواصل</option>
                    <option value="demo_scheduled">تم جدولة العرض</option>
                    <option value="demo_completed">اكتمل العرض</option>
                    <option value="converted">تم التحويل</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs mb-2">ملاحظات الإدارة</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="input w-full resize-none"
                    placeholder="أضف ملاحظات داخلية هنا..."
                  />
                  <button
                    onClick={() => handleSaveNotes(selectedRequest.id)}
                    disabled={updating || adminNotes === (selectedRequest.admin_notes || '')}
                    className="btn-secondary w-full mt-2"
                  >
                    {updating ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
                  </button>
                </div>

                {selectedRequest.status !== 'converted' && !selectedRequest.converted_organization_id && (
                  <button
                    onClick={() => handleCreateOrganization(selectedRequest.id)}
                    disabled={updating}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-5 h-5" />
                    <span>إنشاء مؤسسة من الطلب</span>
                  </button>
                )}

                {selectedRequest.converted_organization_id && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      تم التحويل إلى مؤسسة #{selectedRequest.converted_organization_id}
                    </p>
                    <button
                      onClick={() => window.open(`/admin/organizations?id=${selectedRequest.converted_organization_id}`, '_blank')}
                      className="mt-3 btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      عرض المؤسسة
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center sticky top-6">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <p className="text-white/50">اختر طلباً لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTrialRequests;
