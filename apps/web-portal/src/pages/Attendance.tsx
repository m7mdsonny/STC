import { useState, useEffect } from 'react';
import { UserCheck, Clock, Calendar, Search, Download, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { attendanceApi } from '../lib/api/attendance';
import { peopleApi } from '../lib/api/people';
import { useAuth } from '../contexts/AuthContext';
import type { AttendanceRecord, RegisteredFace } from '../types/database';

export function Attendance() {
  const { organization } = useAuth();
  const [records, setRecords] = useState<(AttendanceRecord & { person?: RegisteredFace })[]>([]);
  const [people, setPeople] = useState<RegisteredFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, peopleRes] = await Promise.all([
        attendanceApi.getRecords({ date: selectedDate, per_page: 100 }),
        peopleApi.getPeople({ per_page: 500 }),
      ]);

      const peopleData = peopleRes.data || [];
      setPeople(peopleData);

      if (recordsRes.data) {
        const enrichedRecords = recordsRes.data.map(record => ({
          ...record,
          person: peopleData.find(p => p.id === record.person_id),
        }));
        setRecords(enrichedRecords);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
    setLoading(false);
  };

  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    const personName = record.person?.person_name.toLowerCase() || '';
    const employeeId = record.person?.employee_id?.toLowerCase() || '';
    return personName.includes(searchQuery.toLowerCase()) || employeeId.includes(searchQuery.toLowerCase());
  });

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '-';
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}س ${minutes}د`;
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.check_in && !r.check_out).length,
    left: records.filter(r => r.check_out).length,
    avgHours: records.length > 0
      ? (records.filter(r => r.check_out).reduce((acc, r) => {
          const start = new Date(r.check_in).getTime();
          const end = new Date(r.check_out!).getTime();
          return acc + (end - start);
        }, 0) / records.filter(r => r.check_out).length / (1000 * 60 * 60)).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">سجل الحضور</h1>
          <p className="text-white/60">متابعة حضور وانصراف الموظفين</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          <span>تصدير التقرير</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <UserCheck className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">اجمالي التسجيلات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <LogIn className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.present}</p>
              <p className="text-sm text-white/60">متواجد حاليا</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <LogOut className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.left}</p>
              <p className="text-sm text-white/60">غادر</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgHours}س</p>
              <p className="text-sm text-white/60">متوسط الساعات</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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
          <div className="flex items-center gap-2">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <Calendar className="w-5 h-5 text-stc-gold" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-white/10 rounded-lg"
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCheck className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد سجلات</h3>
          <p className="text-white/60">لا توجد سجلات حضور لهذا اليوم</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-4 font-medium text-white/70">الموظف</th>
                <th className="text-right p-4 font-medium text-white/70">الرقم الوظيفي</th>
                <th className="text-right p-4 font-medium text-white/70">وقت الحضور</th>
                <th className="text-right p-4 font-medium text-white/70">وقت الانصراف</th>
                <th className="text-right p-4 font-medium text-white/70">المدة</th>
                <th className="text-right p-4 font-medium text-white/70">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stc-gold/20 flex items-center justify-center">
                        <span className="text-stc-gold font-semibold">
                          {record.person?.person_name?.charAt(0) || '؟'}
                        </span>
                      </div>
                      <span className="font-medium">{record.person?.person_name || 'غير معروف'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white/60">{record.person?.employee_id || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <LogIn className="w-4 h-4" />
                      <span>{formatTime(record.check_in)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {record.check_out ? (
                      <div className="flex items-center gap-2 text-blue-400">
                        <LogOut className="w-4 h-4" />
                        <span>{formatTime(record.check_out)}</span>
                      </div>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="p-4 text-white/60">
                    {calculateDuration(record.check_in, record.check_out)}
                  </td>
                  <td className="p-4">
                    {record.check_out ? (
                      <span className="badge badge-success">انصرف</span>
                    ) : (
                      <span className="badge badge-gold">متواجد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
