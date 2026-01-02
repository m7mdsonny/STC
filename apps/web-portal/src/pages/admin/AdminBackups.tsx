import { useEffect, useState } from 'react';
import { HardDrive, Download, RotateCcw, PlusCircle, Loader2 } from 'lucide-react';
import { backupsApi } from '../../lib/api/backups';
import { useToast } from '../../contexts/ToastContext';
import type { SystemBackup } from '../../types/database';

export function AdminBackups() {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await backupsApi.list();
      setBackups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading backups:', error);
      showError('خطأ في التحميل', 'فشل تحميل قائمة النسخ الاحتياطية');
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
      await backupsApi.create();
      showSuccess('تم الإنشاء', 'تم إنشاء النسخة الاحتياطية بنجاح');
      await load();
    } catch (error) {
      console.error('Error creating backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء النسخة الاحتياطية';
      showError('خطأ في الإنشاء', errorMessage);
    } finally {
      setWorking(false);
    }
  };

  const restore = async (id: number) => {
    if (!confirm('استعادة النسخة الاحتياطية ستستبدل البيانات الحالية. هل انت متأكد؟')) return;
    setRestoring(id);
    try {
      await backupsApi.restore(id);
      showSuccess('تم الاستعادة', 'تم استعادة النسخة الاحتياطية بنجاح');
      await load();
    } catch (error) {
      console.error('Error restoring backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل استعادة النسخة الاحتياطية';
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
      a.download = backup.file_path.split('/').pop() || 'backup.sql';
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
                    <p className="font-semibold">{backup.file_path.split('/').pop() || backup.file_path}</p>
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
                    onClick={() => restore(backup.id)}
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
    </div>
  );
}
