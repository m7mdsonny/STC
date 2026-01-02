import { useEffect, useState } from 'react';
import { Send, RefreshCw, CheckCircle2, Clock4 } from 'lucide-react';
import { aiCommandsApi, organizationsApi } from '../../lib/api';
import type { AiCommand, AiCommandLog, Organization } from '../../types/database';

export function AiCommandCenter() {
  const [commands, setCommands] = useState<AiCommand[]>([]);
  const [logs, setLogs] = useState<AiCommandLog[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommand, setSelectedCommand] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    organization_id: '',
    payload: '{}',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgRes, cmdRes] = await Promise.all([
        organizationsApi.getOrganizations(),
        aiCommandsApi.list({ per_page: 50 }),
      ]);
      setOrganizations(orgRes.data);
      setCommands(cmdRes.data);
    } catch (error) {
      console.error('Error loading commands', error);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.title.trim()) {
      alert('يرجى إدخال عنوان الأمر');
      return;
    }
    try {
      const payloadObj = form.payload ? JSON.parse(form.payload) : {};
      await aiCommandsApi.create({
        title: form.title,
        organization_id: form.organization_id || undefined,
        payload: payloadObj,
      });
      setForm({ title: '', organization_id: '', payload: '{}' });
      alert('تم إنشاء الأمر بنجاح');
      loadData();
    } catch (error) {
      console.error('Error creating command', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في إنشاء الأمر';
      alert(`فشل إنشاء الأمر: ${errorMessage}`);
    }
  };

  const viewLogs = async (id: number) => {
    setSelectedCommand(id);
    try {
      const data = await aiCommandsApi.logs(id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs', error);
    }
  };

  const retry = async (id: number) => {
    await aiCommandsApi.retry(id);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مركز أوامر الذكاء الاصطناعي</h1>
          <p className="text-white/60">انشاء، مراقبة، وتأكيد الاوامر</p>
        </div>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Send className="w-5 h-5 text-stc-gold" />
          ارسال امر جديد
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="عنوان الامر"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="input"
            value={form.organization_id}
            onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
          >
            <option value="">كل المؤسسات</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
            <input
              className="input"
              placeholder='{"module":"fire"}'
              value={form.payload}
              onChange={(e) => setForm({ ...form, payload: e.target.value })}
              dir="ltr"
          />
        </div>
        <button onClick={submit} className="btn-primary w-fit" disabled={!form.title}>
          ارسال
        </button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">قائمة الاوامر</h2>
        {loading ? (
          <p className="text-white/60">جاري التحميل...</p>
        ) : commands.length === 0 ? (
          <p className="text-white/60">لا توجد أوامر حاليا.</p>
        ) : (
          <div className="space-y-3">
            {commands.map((cmd) => (
              <div key={cmd.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold">{cmd.title}</p>
                  <p className="text-xs text-white/50">
                    {cmd.organization_id ? `مؤسسة: ${cmd.organization_id}` : 'كل المؤسسات'}
                  </p>
                  <p className="text-xs text-white/40">{cmd.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => viewLogs(cmd.id)} className="btn-secondary text-sm">السجل</button>
                  <button onClick={() => retry(cmd.id)} className="btn-secondary text-sm">اعادة</button>
                  {cmd.status === 'acknowledged' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {cmd.status !== 'acknowledged' && <Clock4 className="w-5 h-5 text-white/50" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCommand && (
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">السجل للامر #{selectedCommand}</h2>
            <button onClick={() => setSelectedCommand(null)} className="btn-secondary text-sm">اغلاق</button>
          </div>
          {logs.length === 0 ? (
            <p className="text-white/60">لا يوجد سجل.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-2 bg-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{log.status}</p>
                    <p className="text-xs text-white/50">{log.message}</p>
                  </div>
                  <span className="text-xs text-white/50">{log.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
