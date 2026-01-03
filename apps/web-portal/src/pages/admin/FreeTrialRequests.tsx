import React, { useState, useEffect } from 'react';
import { freeTrialApi, FreeTrialRequest } from '../../lib/api/freeTrial';
import { useAuth } from '../../contexts/AuthContext';

const FreeTrialRequests: React.FC = () => {
  const { user } = useAuth();
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
      setRequests(data);
    } catch (error) {
      console.error('Failed to load free trial requests:', error);
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
      alert('تم حفظ الملاحظات بنجاح');
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('فشل حفظ الملاحظات');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateOrganization = async (requestId: number) => {
    if (!confirm('هل أنت متأكد من إنشاء مؤسسة من هذا الطلب؟')) {
      return;
    }

    try {
      setUpdating(true);
      const result = await freeTrialApi.createOrganization(requestId);
      alert(result.message || 'تم إنشاء المؤسسة بنجاح');
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        const updated = await freeTrialApi.get(requestId);
        setSelectedRequest(updated);
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      alert(error.response?.data?.message || 'فشل إنشاء المؤسسة');
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
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      demo_scheduled: 'bg-purple-100 text-purple-800',
      demo_completed: 'bg-green-100 text-green-800',
      converted: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
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
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.new}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!user?.is_super_admin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">غير مصرح - يجب أن تكون Super Admin للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">طلبات التجربة المجانية</h1>
        <p className="text-gray-600 mt-1">إدارة طلبات التجربة المجانية والتحويل إلى مؤسسات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">الطلبات</h2>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
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
              <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد طلبات</div>
            ) : (
              <div className="divide-y">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleSelectRequest(request.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{request.name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        {/* TASK 1.C: Display required fields - Name, Company, Phone, Email, Selected Modules, Submission Date */}
                        <p className="text-sm text-gray-600">{request.email}</p>
                        {request.company_name && (
                          <p className="text-sm text-gray-500">الشركة: {request.company_name}</p>
                        )}
                        {request.phone && (
                          <p className="text-sm text-gray-500">الهاتف: {request.phone}</p>
                        )}
                        {request.selected_modules && request.selected_modules.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            الوحدات: {request.selected_modules.join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          تاريخ الإرسال: {new Date(request.created_at).toLocaleDateString('ar-SA', { 
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">تفاصيل الطلب</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <p className="text-gray-900">{selectedRequest.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <p className="text-gray-900">{selectedRequest.email}</p>
                </div>

                {selectedRequest.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                    <p className="text-gray-900">{selectedRequest.phone}</p>
                  </div>
                )}

                {selectedRequest.company_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
                    <p className="text-gray-900">{selectedRequest.company_name}</p>
                  </div>
                )}

                {selectedRequest.selected_modules && selectedRequest.selected_modules.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوحدات المطلوبة</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.selected_modules.map((module, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                    <p className="text-gray-900 text-sm">{selectedRequest.message}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الحالة</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value as FreeTrialRequest['status'])}
                    disabled={updating}
                    className="w-full border rounded px-3 py-2"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإدارة</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                    placeholder="أضف ملاحظات..."
                  />
                  <button
                    onClick={() => handleSaveNotes(selectedRequest.id)}
                    disabled={updating}
                    className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    حفظ الملاحظات
                  </button>
                </div>

                {selectedRequest.status !== 'converted' && !selectedRequest.converted_organization_id && (
                  <button
                    onClick={() => handleCreateOrganization(selectedRequest.id)}
                    disabled={updating}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    إنشاء مؤسسة من الطلب
                  </button>
                )}

                {selectedRequest.converted_organization_id && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      تم التحويل إلى مؤسسة #{selectedRequest.converted_organization_id}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              اختر طلباً لعرض التفاصيل
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTrialRequests;
