// components/custom/analytics-panel.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TimelineEvent } from './types';

interface AnalyticsPanelProps {
  events: TimelineEvent[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ events }) => {
  // آمار وضعیت رویدادها
  const statusStats = {
    completed: events.filter(e => e.status === 'completed').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    planned: events.filter(e => e.status === 'planned').length,
  };
  
  const totalEvents = events.length;
  const completionRate = totalEvents > 0 ? (statusStats.completed / totalEvents) * 100 : 0;
  
  // داده برای نمودار دایره‌ای
  const pieData = [
    { name: 'انجام شده', value: statusStats.completed, color: '#16a34a' },
    { name: 'در حال انجام', value: statusStats.ongoing, color: '#ca8a04' },
    { name: 'برنامه‌ریزی شده', value: statusStats.planned, color: '#6b7280' },
  ];
  
  // داده برای نمودار خطی (بر اساس ماه)
  const getMonthlyData = () => {
    const monthlyData: Record<string, { month: string, completed: number, ongoing: number, planned: number }> = {};
    
    // تاریخ‌ها را بر اساس ماه گروه‌بندی می‌کنیم
    events.forEach(event => {
      const [year, month] = event.date.split('/');
      const key = `${year}/${month}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          completed: 0,
          ongoing: 0,
          planned: 0
        };
      }
      
      if (event.status === 'completed') {
        monthlyData[key].completed++;
      } else if (event.status === 'ongoing') {
        monthlyData[key].ongoing++;
      } else {
        monthlyData[key].planned++;
      }
    });
    
    // تبدیل به آرایه برای نمودار
    return Object.values(monthlyData).sort((a, b) => {
      const [yearA, monthA] = a.month.split('/').map(Number);
      const [yearB, monthB] = b.month.split('/').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
  };
  
  const monthlyData = getMonthlyData();
  
  // یافتن مسیر بحرانی (Critical Path)
  // در حالت واقعی، الگوریتم مسیر بحرانی پیچیده‌تر است
  const criticalPathEvents = events
    .filter(e => e.priority === 'high' && (e.status === 'ongoing' || e.status === 'planned'))
    .sort((a, b) => {
      const dateA = new Date(a.date.split('/').join('-'));
      const dateB = new Date(b.date.split('/').join('-'));
      return dateA.getTime() - dateB.getTime();
    });
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-2">تحلیل نقشه راه کسب و کار</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">میزان پیشرفت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">وضعیت رویدادها</CardTitle>
          </CardHeader>
          <CardContent className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  innerRadius={20}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">رویدادهای کلیدی آینده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {events
                .filter(e => e.status === 'planned' && e.priority === 'high')
                .slice(0, 2)
                .map(event => (
                  <div key={event.id} className="flex items-center justify-between">
                    <span className="truncate">{event.title}</span>
                    <span className="text-xs text-gray-500">{event.date}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">روند پیشرفت ماهانه</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ fontFamily: 'vazirmatn' }} />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#16a34a" name="انجام شده" />
              <Line type="monotone" dataKey="ongoing" stroke="#ca8a04" name="در حال انجام" />
              <Line type="monotone" dataKey="planned" stroke="#6b7280" name="برنامه‌ریزی شده" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {criticalPathEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">مسیر بحرانی پروژه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute right-0 top-0 w-1 h-full bg-red-200 z-0"></div>
              <div className="space-y-3 relative z-10">
                {criticalPathEvents.map((event, index) => (
                  <div key={event.id} className="pr-6 relative">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="pl-2 border-l-2 border-dashed border-gray-300">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPanel;