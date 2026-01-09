import { useEffect, useState } from 'react';
import { HardDrive, Download, RotateCcw, PlusCircle, Loader2 } from 'lucide-react';
import { backupsApi } from '../../lib/api/backups';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { SystemBackup } from '../../types/database';

export function AdminBackups() {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ open: boolean; backupId: number | null }>({ open: false, backupId: null });
  const [confirmRestoreFinal, setConfirmRestoreFinal] = useState<{ open: boolean; backupId: number | null }>({ open: false, backupId: null });
  const { showSuccess, showError } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // CRITICAL FIX: backupsApi.list() now handles normalization internally
      const data = await backupsApi.list();
      setBackups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading backups:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل تحميل قائمة النسخ الاحتياطية';
      showError('خطأ في التحميل', errorMessage);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBackup = async () => {
    setWorking(true);
    try {
      const backup = await backupsApi.create();
      showSuccess('تم الإنشاء', `تم إنشاء النسخة الاحتياطية بنجاح: ${backup.file_path}`);
      await load();
    } catch (error: any) {
      console.error('Error creating backup:', error);
      // CRITICAL FIX: Extract error message properly
      let errorMessage = 'فشل إنشاء النسخة الاحتياطية';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      showError('خطأ في الإنشاء', errorMessage);
    } finally {
      setWorking(false);
    }
  };

  const handleRestoreClick = (id: number) => {
    // FIXED: Use ConfirmDialog instead of window.confirm
    setConfirmRestore({ open: true, backupId: id });
  };

  const handleRestoreConfirm = () => {
    if (confirmRestore.backupId !== null) {
      // First confirmation passed, show final confirmation
      setConfirmRestore({ open: false, backupId: null });
      setConfirmRestoreFinal({ open: true, backupId: confirmRestore.backupId });
    }
  };

  const handleRestoreFinalConfirm = async () => {
    if (confirmRestoreFinal.backupId === null) return;
    
    const id = confirmRestoreFinal.backupId;
    setConfirmRestoreFinal({ open: false, backupId: null });
    setRestoring(id);
    
    try {
      // CRITICAL FIX: Send confirmed=true parameter (required by backend)
      await backupsApi.restore(id, true);
      showSuccess('تم الاستعادة', 'تم استعادة النسخة الاحتياطية بنجاح');
      await load();
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'فشل استعادة النسخة الاحتياطية';
      showError('خطأ في الاستعادة', errorMessage);
    } finally {
      setRestoring(null);
    }
  };

  const downloadBackup = async (backup: SystemBackup) => {
    try {
      const response = await fetch(`/api/v1/backups/${backup.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // CRITICAL FIX: Ensure file_path is a string before calling split
      const filePath = typeof backup.file_path === 'string' ? backup.file_path : String(backup.file_path || '');
      a.download = filePath.split('/').pop() || 'backup.sql';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('تم التحميل', 'تم تحميل النسخة الاحتياطية بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل تحميل النسخة الاحتياطية');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">النسخ الاحتياطي</h1>
          <p className="text-white/60">انشاء، تحميل، واستعادة النسخ الاحتياطية</p>
        </div>
        <button onClick={createBackup} className="btn-primary flex items-center gap-2" disabled={working}>
          {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          <span>{working ? 'جاري الإنشاء...' : 'نسخ الآن'}</span>
        </button>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-stc-gold animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <p className="text-white/60 text-center py-8">لا توجد نسخ احتياطية بعد.</p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-stc-gold" />
                  <div>
                    {/* CRITICAL FIX: Ensure file_path is a string before calling split */}
                    <p className="font-semibold">
                      {(() => {
                        const filePath = typeof backup.file_path === 'string' ? backup.file_path : String(backup.file_path || '');
                        return filePath.split('/').pop() || filePath || 'backup.sql';
                      })()}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(backup.created_at).toLocaleString('ar-EG')}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      backup.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      backup.status === 'restored' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {backup.status === 'completed' ? 'مكتمل' :
                       backup.status === 'restored' ? 'مستعاد' : backup.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadBackup(backup)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تحميل
                  </button>
                  <button
                    onClick={() => handleRestoreClick(backup.id)}
                    className="btn-secondary flex items-center gap-2"
                    disabled={restoring === backup.id || working}
                  >
                    {restoring === backup.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    استعادة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIXED: Use ConfirmDialog instead of window.confirm */}
      <ConfirmDialog
        open={confirmRestore.open}
        title="⚠️ تحذير: استعادة النسخة الاحتياطية"
        message="استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية.\n\nهذه العملية لا يمكن التراجع عنها.\n\nهل أنت متأكد تماماً؟"
        type="danger"
        confirmText="نعم، متأكد"
        cancelText="إلغاء"
        onConfirm={handleRestoreConfirm}
        onCancel={() => setConfirmRestore({ open: false, backupId: null })}
      />

      <ConfirmDialog
        open={confirmRestoreFinal.open}
        title="تأكيد نهائي"
        message="هل أنت متأكد 100% من الاستعادة؟\n\nسيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية."
        type="danger"
        confirmText="نعم، استعادة الآن"
        cancelText="إلغاء"
        onConfirm={handleRestoreFinalConfirm}
        onCancel={() => setConfirmRestoreFinal({ open: false, backupId: null })}
      />
    </div>
  );
}
