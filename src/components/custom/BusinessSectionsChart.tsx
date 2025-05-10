// components/custom/BusinessSectionsChart.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip 
} from "recharts";
import {
  Palette,
  Code,
  Megaphone,
  BookOpen,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Settings,
  Moon,
  Sun,
  Download,
  Timer,
  Star,
  Globe,
  Heart,
  AlertCircle
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from 'lucide-react';

// تعریف نوع برای آیکون‌های Lucide
type LucideIconType = React.ComponentType<LucideProps>;

// انواع بخش‌های کسب و کار
interface BusinessSection {
  id: string;
  name: string;
  icon: string;
  value: number;
  revenue: number;
  trend: number;
  rankingChange: number;
  yearlyComparison: number;
  miniTrend: number[];
  status: 'active' | 'inactive' | 'live';
  customColor?: string;
}

// تابع کمکی برای دریافت آیکون‌ها
const getIcon = (iconName: string): LucideIconType | null => {
  if (iconName in LucideIcons) {
    return LucideIcons[iconName as keyof typeof LucideIcons] as LucideIconType;
  }
  return null;
};

// تابع نمایش اعداد فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// فرمت کردن مبلغ
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('fa-IR').format(amount);
};

// رنگ‌های پیش‌فرض
const DEFAULT_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#a4de6c', '#ffc658', '#d0ed57', '#ffa1b5', '#b5e7a0'
];

// داده‌های نمونه (حالا خالی است)
const defaultSections: BusinessSection[] = [];

// بازه‌های زمانی
const timeRanges = [
  { id: 'current_month', label: 'ماه جاری' },
  { id: 'last_3_months', label: '۳ ماه اخیر' },
  { id: 'last_6_months', label: '۶ ماه اخیر' },
  { id: 'current_year', label: 'سال جاری' },
  { id: 'last_year', label: 'سال گذشته' },
  { id: 'year_comparison', label: 'مقایسه سالانه' }
];

interface Props {
  initialSections?: BusinessSection[];
  onSectionsChange?: (sections: BusinessSection[]) => void;
  darkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

const BusinessSectionsChart: React.FC<Props> = ({
  initialSections = defaultSections,
  onSectionsChange,
  darkMode = false,
  onDarkModeChange
}) => {
  const [sections, setSections] = useState<BusinessSection[]>(initialSections);
  const [timeRange, setTimeRange] = useState('current_month');
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<BusinessSection | null>(null);
  const [newSectionForm, setNewSectionForm] = useState({
    name: '',
    icon: 'Star',
    revenue: 0
  });

  // بارگذاری تنظیمات ذخیره شده
  useEffect(() => {
    const saved = localStorage.getItem('businessSections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSections(parsed.sections);
      } catch (error) {
        console.error('Error parsing saved data:', error);
        setSections(defaultSections);
      }
    }
  }, []);

  // ذخیره تغییرات
  const saveSettings = useCallback(() => {
    localStorage.setItem('businessSections', JSON.stringify({
      sections,
      lastModified: new Date()
    }));
    if (onSectionsChange) {
      onSectionsChange(sections);
    }
  }, [sections, onSectionsChange]);

  // کامپوننت Tooltip سفارشی
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const IconComponent = getIcon(data.icon);
      
      return (
        <div className={`p-4 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {IconComponent && <IconComponent size={20} />}
            <h3 className="font-bold">{data.name}</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p>درصد: {toPersianNumber(data.value)}٪</p>
            <p>درآمد: {formatMoney(data.revenue)} تومان</p>
            <p className={`flex items-center gap-1 ${data.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {data.trend > 0 ? 'رشد' : 'کاهش'}: {toPersianNumber(Math.abs(data.trend))}٪
            </p>
            <p>رتبه: {data.rankingChange > 0 && '⬆️'}{data.rankingChange < 0 && '⬇️'}{data.rankingChange === 0 && '➖'}</p>
            <p>مقایسه سالانه: {toPersianNumber(data.yearlyComparison)}٪</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // کامپوننت Legend سفارشی
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-3">
        {payload?.map((entry: any, index: number) => {
          const section = sections[index];
          const IconComponent = getIcon(section?.icon || '');
          const isActive = section?.status !== 'inactive';
          
          return (
            <li
              key={`item-${index}`}
              className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                !isActive ? 'opacity-50 line-through' : ''
              }`}
              onClick={() => toggleSection(index)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              {IconComponent && <IconComponent size={16} />}
              <span>{entry.value}</span>
              {section?.status === 'live' && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // تغییر وضعیت بخش
  const toggleSection = useCallback((index: number) => {
    const newSections = [...sections];
    newSections[index].status = newSections[index].status === 'active' ? 'inactive' : 'active';
    setSections(newSections);
  }, [sections]);

  // افزودن بخش جدید
  const addNewSection = useCallback(() => {
    if (!newSectionForm.name || !newSectionForm.revenue) return;

    const newSection: BusinessSection = {
      id: `section-${Date.now()}`,
      name: newSectionForm.name,
      icon: newSectionForm.icon,
      value: 0, // مقدار بر اساس درآمد محاسبه می‌شود
      revenue: newSectionForm.revenue,
      trend: 0,
      rankingChange: 0,
      yearlyComparison: 0,
      miniTrend: [],
      status: 'active'
    };

    setSections([...sections, newSection]);
    setNewSectionForm({ name: '', icon: 'Star', revenue: 0 });
  }, [newSectionForm, sections]);

  // حذف بخش
  const deleteSection = useCallback((id: string) => {
    setSections(sections.filter(s => s.id !== id));
  }, [sections]);

  // بازیابی پیش‌فرض
  const resetToDefault = useCallback(() => {
    setSections(defaultSections);
    localStorage.removeItem('businessSections');
  }, []);

  // محاسبه کل درآمد
  const totalRevenue = sections.reduce((sum, section) => sum + section.revenue, 0);

  // محاسبه درصد بر اساس درآمد
  const chartData = sections.map(section => ({
    ...section,
    value: Math.round((section.revenue / totalRevenue) * 100)
  }));

  // کامپوننت نمایش وضعیت خالی
  const EmptyState = () => (
    <div className="h-[400px] w-full flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">هنوز داده‌ای وارد نشده است</h3>
        <p className="text-gray-500">برای اضافه کردن داده از دکمه تنظیمات استفاده کنید</p>
        <Button 
          className="mt-4"
          onClick={() => setIsManagerOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          تنظیمات
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* هدر */}
      <Card className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">بخش‌های کسب و کار</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="انتخاب بازه زمانی" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={() => setIsManagerOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                if (onDarkModeChange) onDarkModeChange(!isDarkMode);
              }}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button variant="outline" size="icon" disabled={sections.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* نمودار */}
      <Card className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <CardContent className="pt-6">
          {sections.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-[400px] w-full flex justify-center">
              <PieChart width={800} height={400}>
                <Pie
                  data={chartData}
                  cx={400}
                  cy={200}
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.customColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      stroke={activeIndex === index ? '#fff' : 'none'}
                      strokeWidth={activeIndex === index ? 3 : 0}
                      style={{ 
                        cursor: 'pointer',
                        opacity: entry.status === 'inactive' ? 0.5 : 1 
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} verticalAlign="bottom" height={36} />
              </PieChart>
            </div>
          )}
          
          {sections.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Timer className="h-4 w-4" />
                آخرین به‌روزرسانی: {lastUpdate.toLocaleTimeString('fa-IR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* جزئیات - فقط نمایش داده می شود اگر داده وجود داشته باشد */}
      {sections.length > 0 && (
        <Card className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <CardHeader>
            <CardTitle>جزئیات عملکرد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((section) => {
                const IconComponent = getIcon(section.icon);
                return (
                  <div key={section.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {IconComponent && <IconComponent size={20} />}
                      <div>
                        <h3 className="font-medium">{section.name}</h3>
                        <p className="text-sm text-gray-500">
                          درآمد: {formatMoney(section.revenue)} تومان
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{toPersianNumber(section.value)}٪</p>
                        <p className={`text-sm ${section.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {section.trend > 0 ? '+' : ''}{toPersianNumber(section.trend)}٪
                        </p>
                      </div>
                      <Badge className={`${section.status === 'live' ? 'bg-green-500' : section.status === 'active' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                        {section.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* دیالوگ مدیریت بخش‌ها */}
      <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>مدیریت بخش‌های کسب و کار</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* فرم افزودن بخش جدید */}
            <div className="space-y-4">
              <h3 className="font-medium">افزودن بخش جدید</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="نام بخش"
                  value={newSectionForm.name}
                  onChange={e => setNewSectionForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <Select
                  value={newSectionForm.icon}
                  onValueChange={value => setNewSectionForm(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب آیکون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Star">ستاره</SelectItem>
                    <SelectItem value="Palette">طراحی</SelectItem>
                    <SelectItem value="Code">برنامه‌نویسی</SelectItem>
                    <SelectItem value="Megaphone">مارکتینگ</SelectItem>
                    <SelectItem value="BookOpen">مشاوره</SelectItem>
                    <SelectItem value="Globe">جهانی</SelectItem>
                    <SelectItem value="Heart">مراقبت‌های بهداشتی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                placeholder="درآمد (تومان)"
                value={newSectionForm.revenue}
                onChange={e => setNewSectionForm(prev => ({ ...prev, revenue: Number(e.target.value) }))}
              />
              <Button onClick={addNewSection} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                افزودن بخش
              </Button>
            </div>
            
            {sections.length > 0 && <Separator />}
            
            {/* لیست بخش‌های موجود */}
            {sections.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">بخش‌های موجود</h3>
                {sections.map(section => {
                  const IconComponent = getIcon(section.icon);
                  return (
                    <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {IconComponent && <IconComponent size={20} />}
                        <div>
                          <p className="font-medium">{section.name}</p>
                          <p className="text-sm text-gray-500">درآمد: {formatMoney(section.revenue)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSection(section.id)}
                          disabled={sections.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetToDefault}>
              بازیابی پیش‌فرض
            </Button>
            <Button onClick={() => { saveSettings(); setIsManagerOpen(false); }}>
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessSectionsChart;