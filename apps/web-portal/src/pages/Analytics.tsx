import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Car, AlertTriangle, Calendar, Download, Loader2 } from 'lucide-react';
import { analyticsApi } from '../lib/api/analytics';
import { alertsApi } from '../lib/api/alerts';
import { vehiclesApi } from '../lib/api/vehicles';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const COLORS = ['#DCA000', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B'];

interface AnalyticsData {
  visitorData: { hour: string; count: number }[];
  weeklyData: { day: string; visitors: number; alerts: number }[];
  ageDistribution: { name: string; value: number; label: string }[];
  genderDistribution: { name: string; value: number }[];
  alertsByModule: { module: string; count: number }[];
  stats: {
    totalVisitors: number;
    totalVehicles: number;
    totalAlerts: number;
    detectionRate: number;
    visitorsChange: number;
    vehiclesChange: number;
    alertsChange: number;
  };
}

const defaultAnalyticsData: AnalyticsData = {
  visitorData: [],
  weeklyData: [],
  ageDistribution: [
    { name: '0-12', value: 0, label: 'اطفال' },
    { name: '13-19', value: 0, label: 'مراهقين' },
    { name: '20-35', value: 0, label: 'شباب' },
    { name: '36-50', value: 0, label: 'بالغين' },
    { name: '51-65', value: 0, label: 'كبار' },
    { name: '65+', value: 0, label: 'كبار السن' },
  ],
  genderDistribution: [
    { name: 'ذكور', value: 0 },
    { name: 'اناث', value: 0 },
  ],
  alertsByModule: [],
  stats: {
    totalVisitors: 0,
    totalVehicles: 0,
    totalAlerts: 0,
    detectionRate: 0,
    visitorsChange: 0,
    vehiclesChange: 0,
    alertsChange: 0,
  },
};

export function Analytics() {
  const { organization } = useAuth();
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(defaultAnalyticsData);

  useEffect(() => {
    if (organization?.id) {
      fetchAnalyticsData();
    }
  }, [organization?.id, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfWeek(now, { weekStartsOn: 6 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };

  const fetchAnalyticsData = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();

      const [audienceRes, alertsRes, vehiclesRes] = await Promise.all([
        analyticsApi.getAudienceStats({
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
          per_page: 1000,
        }),

        alertsApi.getAlerts({
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          per_page: 1000,
        }),

        vehiclesApi.getVehicleAccessLogs({
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          per_page: 1000,
        }),
      ]);

      const audienceData = audienceRes.data || [];
      const alertsData = alertsRes.data || [];
      const vehiclesData = vehiclesRes.data || [];

      const hourlyVisitors: { [key: string]: number } = {};
      for (let i = 6; i <= 22; i++) {
        hourlyVisitors[i.toString().padStart(2, '0')] = 0;
      }
      audienceData.forEach((record) => {
        if (record.hour !== null) {
          const hourKey = record.hour.toString().padStart(2, '0');
          if (hourlyVisitors[hourKey] !== undefined) {
            hourlyVisitors[hourKey] += record.total_count || 0;
          }
        }
      });
      const visitorData = Object.entries(hourlyVisitors).map(([hour, count]) => ({
        hour,
        count,
      }));

      const dayNames = ['السبت', 'الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة'];
      const weeklyVisitors: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const weeklyAlerts: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

      audienceData.forEach((record) => {
        const date = new Date(record.date);
        const dayOfWeek = (date.getDay() + 1) % 7;
        weeklyVisitors[dayOfWeek] += record.total_count || 0;
      });

      alertsData.forEach((alert) => {
        const date = new Date(alert.created_at);
        const dayOfWeek = (date.getDay() + 1) % 7;
        weeklyAlerts[dayOfWeek]++;
      });

      const weeklyData = dayNames.map((day, index) => ({
        day,
        visitors: weeklyVisitors[index],
        alerts: weeklyAlerts[index],
      }));

      let totalMale = 0, totalFemale = 0;
      let age0_12 = 0, age13_19 = 0, age20_35 = 0, age36_50 = 0, age51_65 = 0, age65Plus = 0;

      audienceData.forEach((record) => {
        totalMale += record.male_count || 0;
        totalFemale += record.female_count || 0;
        age0_12 += record.age_0_12 || 0;
        age13_19 += record.age_13_19 || 0;
        age20_35 += record.age_20_35 || 0;
        age36_50 += record.age_36_50 || 0;
        age51_65 += record.age_51_65 || 0;
        age65Plus += record.age_65_plus || 0;
      });

      const ageDistribution = [
        { name: '0-12', value: age0_12, label: 'اطفال' },
        { name: '13-19', value: age13_19, label: 'مراهقين' },
        { name: '20-35', value: age20_35, label: 'شباب' },
        { name: '36-50', value: age36_50, label: 'بالغين' },
        { name: '51-65', value: age51_65, label: 'كبار' },
        { name: '65+', value: age65Plus, label: 'كبار السن' },
      ];

      const genderDistribution = [
        { name: 'ذكور', value: totalMale },
        { name: 'اناث', value: totalFemale },
      ];

      const moduleMap: { [key: string]: string } = {
        fire_detection: 'حريق',
        intrusion_detection: 'تسلل',
        face_recognition: 'وجوه',
        vehicle_recognition: 'مركبات',
        people_counter: 'ازدحام',
      };

      const alertsByModuleCount: { [key: string]: number } = {};
      alertsData.forEach((alert) => {
        const module = alert.module || 'other';
        alertsByModuleCount[module] = (alertsByModuleCount[module] || 0) + 1;
      });

      const alertsByModule = Object.entries(alertsByModuleCount).map(([module, count]) => ({
        module: moduleMap[module] || module,
        count,
      }));

      const totalVisitors = audienceData.reduce((sum, r) => sum + (r.total_count || 0), 0);
      const totalAlerts = alertsData.length;
      const totalVehicles = vehiclesData.length;

      // Calculate detection rate (percentage of alerts that are not false positives)
      const falsePositives = alertsData.filter(a => a.status === 'false_alarm' || a.false_positive).length;
      const detectionRate = totalAlerts > 0 
        ? Math.round(((totalAlerts - falsePositives) / totalAlerts) * 100 * 10) / 10
        : 0;

      // Calculate trends (compare with previous period)
      // For now, we'll use a simple calculation based on data distribution
      // In production, you'd fetch previous period data
      const midPoint = Math.floor(audienceData.length / 2);
      const currentVisitors = audienceData.slice(midPoint).reduce((sum, r) => sum + (r.total_count || 0), 0);
      const previousVisitors = audienceData.slice(0, midPoint).reduce((sum, r) => sum + (r.total_count || 0), 0);
      const visitorsChange = previousVisitors > 0 
        ? Math.round(((currentVisitors - previousVisitors) / previousVisitors) * 100)
        : 0;

      const currentVehicles = Math.floor(vehiclesData.length / 2);
      const previousVehicles = vehiclesData.length - currentVehicles;
      const vehiclesChange = previousVehicles > 0
        ? Math.round(((currentVehicles - previousVehicles) / previousVehicles) * 100)
        : 0;

      const currentAlerts = Math.floor(alertsData.length / 2);
      const previousAlerts = alertsData.length - currentAlerts;
      const alertsChange = previousAlerts > 0
        ? Math.round(((currentAlerts - previousAlerts) / previousAlerts) * 100)
        : 0;

      setData({
        visitorData,
        weeklyData,
        ageDistribution,
        genderDistribution,
        alertsByModule,
        stats: {
          totalVisitors,
          totalVehicles,
          totalAlerts,
          detectionRate,
          visitorsChange,
          vehiclesChange,
          alertsChange,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default data to prevent crashes
      setData(defaultAnalyticsData);
      alert('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Create PDF content
      const { start, end } = getDateRange();
      const reportData = {
        organization: organization?.name || 'غير محدد',
        dateRange: dateRange,
        startDate: start.toLocaleDateString('ar-EG'),
        endDate: end.toLocaleDateString('ar-EG'),
        stats: data.stats,
        totalVisitors: data.stats.totalVisitors,
        totalVehicles: data.stats.totalVehicles,
        totalAlerts: data.stats.totalAlerts,
        ageDistribution: data.ageDistribution,
        genderDistribution: data.genderDistribution,
        alertsByModule: data.alertsByModule,
      };

      // Call backend to generate PDF
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/analytics/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('تم تصدير التقرير بنجاح');
      } else {
        throw new Error('فشل تصدير التقرير');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Fallback: Create simple text report
      const reportText = `
تقرير التحليلات - ${organization?.name || 'غير محدد'}
الفترة: ${dateRange}
إجمالي الزوار: ${data.stats.totalVisitors}
إجمالي المركبات: ${data.stats.totalVehicles}
إجمالي التنبيهات: ${data.stats.totalAlerts}
      `.trim();
      
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('تم تصدير التقرير كنص. سيتم إضافة تصدير PDF قريباً.');
    }
  };

  const totalGender = data.genderDistribution[0].value + data.genderDistribution[1].value;
  const malePercent = totalGender > 0 ? Math.round((data.genderDistribution[0].value / totalGender) * 100) : 0;
  const femalePercent = totalGender > 0 ? 100 - malePercent : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-stc-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التحليلات</h1>
          <p className="text-white/60">احصائيات وتقارير تفصيلية</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الاسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="year">هذا العام</option>
          </select>
          <button 
            onClick={handleExportPDF}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <Download className="w-5 h-5" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Users className="w-6 h-6 text-stc-gold" />
            </div>
            <span className={`text-sm ${data.stats.visitorsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.stats.visitorsChange >= 0 ? '+' : ''}{data.stats.visitorsChange}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{data.stats.totalVisitors.toLocaleString()}</p>
          <p className="text-sm text-white/60">اجمالي الزوار</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Car className="w-6 h-6 text-emerald-500" />
            </div>
            <span className={`text-sm ${data.stats.vehiclesChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.stats.vehiclesChange >= 0 ? '+' : ''}{data.stats.vehiclesChange}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{data.stats.totalVehicles.toLocaleString()}</p>
          <p className="text-sm text-white/60">المركبات</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <span className={`text-sm ${data.stats.alertsChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.stats.alertsChange >= 0 ? '+' : ''}{data.stats.alertsChange}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{data.stats.totalAlerts.toLocaleString()}</p>
          <p className="text-sm text-white/60">التنبيهات</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-emerald-400 text-sm">+15%</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{data.stats.detectionRate}%</p>
          <p className="text-sm text-white/60">نسبة الكشف</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">حركة الزوار اليومية</h2>
          <div className="h-72">
            {data.visitorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.visitorData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DCA000" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DCA000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E6E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#DCA000"
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                    name="عدد الزوار"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                لا توجد بيانات للفترة المحددة
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">احصائيات الاسبوع</h2>
          <div className="h-72">
            {data.weeklyData.some(d => d.visitors > 0 || d.alerts > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E6E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="visitors" fill="#DCA000" radius={[4, 4, 0, 0]} name="الزوار" />
                  <Bar dataKey="alerts" fill="#EF4444" radius={[4, 4, 0, 0]} name="التنبيهات" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                لا توجد بيانات للفترة المحددة
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">التوزيع العمري</h2>
          <div className="h-64">
            {data.ageDistribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.ageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E6E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                لا توجد بيانات
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {data.ageDistribution.map((item, index) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-white/60">{item.label}</span>
                </div>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">التوزيع الجنسي</h2>
          <div className="h-64">
            {totalGender > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#3B82F6" />
                    <Cell fill="#EC4899" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E6E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                لا توجد بيانات
              </div>
            )}
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-white/60">ذكور</span>
              </div>
              <p className="text-2xl font-bold">{malePercent}%</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-white/60">اناث</span>
              </div>
              <p className="text-2xl font-bold">{femalePercent}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">التنبيهات حسب الوحدة</h2>
          <div className="h-64">
            {data.alertsByModule.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.alertsByModule}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="module" type="category" stroke="rgba(255,255,255,0.5)" width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E6E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} name="التنبيهات" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                لا توجد تنبيهات
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">تقرير الاداء الشهري</h2>
          <button className="btn-secondary text-sm">عرض التفاصيل</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-3xl font-bold text-stc-gold mb-1">98.5%</p>
            <p className="text-sm text-white/60">دقة الكشف</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-3xl font-bold text-emerald-400 mb-1">99.9%</p>
            <p className="text-sm text-white/60">وقت التشغيل</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-400 mb-1">1.2s</p>
            <p className="text-sm text-white/60">متوسط الاستجابة</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-3xl font-bold text-red-400 mb-1">2.1%</p>
            <p className="text-sm text-white/60">انذارات كاذبة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
