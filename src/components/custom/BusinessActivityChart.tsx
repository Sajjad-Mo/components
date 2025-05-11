// components/custom/BusinessActivityChart.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter 
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  Bar,
  ComposedChart,
  ReferenceLine,
  ReferenceArea
} from "recharts";
import {
  Calendar as CalendarIcon,
  Download,
  Eye,
  EyeOff,
  Plus,
  Settings,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  Save,
  AlertCircle,
  BarChart2,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { faIR } from "date-fns/locale";

// انواع دادی‌های نمودار
interface ActivityData {
  date: string;
  [key: string]: any;
  events?: {
    id: string;
    type: 'milestone' | 'campaign' | 'release';
    title: string;
    description: string;
  }[];
}

interface MetricDefinition {
  id: string;
  name: string;
  englishName: string;
  unit: 'IRR' | 'number' | 'percentage';
  color: string;
  chartType: 'line' | 'area';
  yAxis: 'left' | 'right';
  enabled: boolean;
  isCustom: boolean;
}

interface TimeRangeOption {
  id: string;
  label: string;
  days?: number;
  type: 'preset' | 'custom';
}

interface LegendPayload {
  value: string;
  type: string;
  color: string;
}

// داده‌های خالی (صفر)
const generateEmptyData = (days: number): ActivityData[] => {
  const data: ActivityData[] = [];
  const startDate = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: 0,
      projects: 0,
      newCustomers: 0,
      avgProjectValue: 0,
      revenueGrowth: 0,
      efficiency: 0,
      events: undefined
    });
  }
  
  return data;
};

// نامگذاری واحدهای داده
const unitLabels = {
  IRR: 'تومان',
  number: 'عدد',
  percentage: '%'
};

// متریک‌های پیش‌فرض
const defaultMetrics: MetricDefinition[] = [
  {
    id: 'revenue',
    name: 'درآمد ماهیانه',
    englishName: 'Monthly Revenue',
    unit: 'IRR',
    color: '#0088FE',
    chartType: 'area',
    yAxis: 'left',
    enabled: true,
    isCustom: false
  },
  {
    id: 'projects',
    name: 'تعداد پروژه‌ها',
    englishName: 'Projects Count',
    unit: 'number',
    color: '#00C49F',
    chartType: 'line',
    yAxis: 'right',
    enabled: true,
    isCustom: false
  },
  {
    id: 'newCustomers',
    name: 'مشتریان جدید',
    englishName: 'New Customers',
    unit: 'number',
    color: '#FFBB28',
    chartType: 'line',
    yAxis: 'right',
    enabled: true,
    isCustom: false
  },
  {
    id: 'avgProjectValue',
    name: 'متوسط ارزش پروژه',
    englishName: 'Average Project Value',
    unit: 'IRR',
    color: '#FF8042',
    chartType: 'line',
    yAxis: 'left',
    enabled: false,
    isCustom: false
  },
  {
    id: 'revenueGrowth',
    name: 'نرخ رشد درآمد',
    englishName: 'Revenue Growth',
    unit: 'percentage',
    color: '#8884d8',
    chartType: 'line',
    yAxis: 'right',
    enabled: false,
    isCustom: false
  }
];

// بازه‌های زمانی
const timeRanges: TimeRangeOption[] = [
  { id: 'week', label: '7 روز گذشته', days: 7, type: 'preset' },
  { id: 'month', label: '30 روز گذشته', days: 30, type: 'preset' },
  { id: '3months', label: '3 ماه اخیر', days: 90, type: 'preset' },
  { id: '6months', label: '6 ماه اخیر', days: 180, type: 'preset' },
  { id: 'year', label: '1 سال اخیر', days: 365, type: 'preset' },
  { id: 'custom', label: 'محدوده سفارشی', type: 'custom' }
];

interface Props {
  darkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

const BusinessActivityChart: React.FC<Props> = ({
  darkMode = false,
  onDarkModeChange
}) => {
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricDefinition[]>(defaultMetrics);
  const [timeRange, setTimeRange] = useState('3months');
  const [customRange, setCustomRange] = useState<{start: Date | undefined, end: Date | undefined}>({
    start: undefined,
    end: undefined
  });
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  const [isMetricManagerOpen, setIsMetricManagerOpen] = useState(false);
  const [newMetricForm, setNewMetricForm] = useState({
    name: '',
    englishName: '',
    unit: 'number' as 'IRR' | 'number' | 'percentage',
    color: '#000000',
    chartType: 'line' as 'line' | 'area',
    yAxis: 'left' as 'left' | 'right'
  });
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [zoomArea, setZoomArea] = useState<{ startIndex?: number; endIndex?: number }>({});

  // بارگذاری داده‌ها بر اساس بازه زمانی
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let days = 90; // پیش‌فرض
        
        const selectedRange = timeRanges.find(r => r.id === timeRange);
        if (selectedRange?.days) {
          days = selectedRange.days;
        } else if (timeRange === 'custom' && customRange.start && customRange.end) {
          days = Math.ceil((customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        // داده‌های خالی (صفر) تولید کن
        const newData = generateEmptyData(days);
        setData(newData);
      } catch (err) {
        setError('خطا در بارگذاری داده‌ها');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [timeRange, customRange]);

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num: number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
  };

  // فرمت کردن مبالغ
  const formatValue = (value: number, unit: string): string => {
    if (unit === 'IRR') {
      return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
    } else if (unit === 'percentage') {
      return `${toPersianNumber(value)}٪`;
    } else {
      return toPersianNumber(value);
    }
  };

  // تغییر وضعیت متریک‌ها
  const toggleMetric = useCallback((id: string) => {
    setMetrics(prevMetrics =>
      prevMetrics.map(metric =>
        metric.id === id ? { ...metric, enabled: !metric.enabled } : metric
      )
    );
  }, []);

  // افزودن متریک جدید
  const addNewMetric = useCallback(() => {
    if (!newMetricForm.name || !newMetricForm.englishName) return;

    const newMetric: MetricDefinition = {
      id: `custom-${Date.now()}`,
      name: newMetricForm.name,
      englishName: newMetricForm.englishName,
      unit: newMetricForm.unit,
      color: newMetricForm.color,
      chartType: newMetricForm.chartType,
      yAxis: newMetricForm.yAxis,
      enabled: true,
      isCustom: true
    };

    setMetrics([...metrics, newMetric]);
    setNewMetricForm({
      name: '',
      englishName: '',
      unit: 'number',
      color: '#000000',
      chartType: 'line',
      yAxis: 'left'
    });
  }, [newMetricForm, metrics]);

  // حذف متریک سفارشی
  const removeCustomMetric = useCallback((id: string) => {
    setMetrics(prevMetrics => prevMetrics.filter(metric => metric.id !== id));
  }, []);

  // کامپوننت نمایش وضعیت خالی
  const EmptyState = () => (
    <div className="h-[500px] w-full flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">هنوز داده‌ای وارد نشده است</h3>
        <p className="text-gray-500">برای اضافه کردن داده از دکمه تنظیمات استفاده کنید</p>
        <Button 
          className="mt-4"
          onClick={() => setIsMetricManagerOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          تنظیمات
        </Button>
      </div>
    </div>
  );

  // رندر بخش چارت
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-[500px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">در حال بارگذاری...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-[500px] flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500 ml-2" />
          <span className="text-red-500">{error}</span>
        </div>
      );
    }

    // چک کردن اینکه آیا همه داده‌ها صفر هستند
    const allDataIsZero = data.every(d => 
      d.revenue === 0 && 
      d.projects === 0 && 
      d.newCustomers === 0 && 
      d.avgProjectValue === 0 &&
      d.revenueGrowth === 0
    );

    if (allDataIsZero) {
      return <EmptyState />;
    }

    if (!data || data.length === 0) {
      return <EmptyState />;
    }

    // فیلتر کردن داده‌های معتبر
    const validData = data.filter(d => 
      d.date && 
      !isNaN(Date.parse(d.date)) &&
      typeof d.revenue === 'number' && !isNaN(d.revenue) &&
      typeof d.projects === 'number' && !isNaN(d.projects) &&
      typeof d.newCustomers === 'number' && !isNaN(d.newCustomers)
    );

    const chartData = validData.slice(zoomArea.startIndex || 0, zoomArea.endIndex || validData.length);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              try {
                return format(parseISO(date), 'd MMM', { locale: faIR });
              } catch (error) {
                console.error('Invalid date:', date);
                return '';
              }
            }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          {/* دو محور Y */}
          <YAxis 
            yAxisId="left" 
            orientation="left"
            width={80}
            allowDataOverflow={false}
            domain={[0, 'dataMax']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            width={80}
            allowDataOverflow={false}
            domain={[0, 'dataMax']}
          />
          
          <Tooltip 
            content={(props) => {
              const { active, payload, label } = props;
              
              if (active && payload && payload.length) {
                const dataPoint = validData.find(d => d.date === label);
                
                return (
                  <div className={`p-4 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-bold mb-2">{format(parseISO(String(label)), 'dd MMMM yyyy', { locale: faIR })}</h3>
                    
                    {payload.map((entry, index) => {
                      const metric = metrics.find(m => m.id === entry.dataKey);
                      if (!metric) return null;
                      
                      return (
                        <div key={`${metric.id}-${index}`} className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                          <span className="text-sm">{metric.name}:</span>
                          <span className="font-medium">{formatValue(Number(entry.value), metric.unit)}</span>
                        </div>
                      );
                    })}
                    
                    {dataPoint?.events && dataPoint.events.length > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <h4 className="font-bold text-sm mb-1">رویدادها:</h4>
                        {dataPoint.events.map((event) => (
                          <div key={event.id} className="text-sm text-blue-600 mb-1">
                            • {event.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            content={(props) => {
              if (!props.payload) return null;
              const { payload } = props as { payload: LegendPayload[] };
              return (
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {payload.map((entry, index) => {
                    const metric = metrics.find(m => m.id === entry.value);
                    return metric ? (
                      <div key={`${metric.id}-legend-${index}`} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: metric.color }} 
                        />
                        <span>{metric.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              );
            }}
          />
          
          {/* نمایش خطوط/مناطق هر متریک */}
          {metrics.filter(m => m.enabled).map(metric => {
            const Component = metric.chartType === 'area' ? Area : Line;
            return (
              <Component
                key={metric.id}
                yAxisId={metric.yAxis}
                type="monotone"
                dataKey={metric.id}
                stroke={metric.color}
                fill={metric.chartType === 'area' ? metric.color : undefined}
                fillOpacity={metric.chartType === 'area' ? 0.3 : undefined}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            );
          })}
          
          {/* نشانگرهای رویدادها */}
          {validData.map((d, index) => 
            d.events?.map((event, eventIndex) => (
              <ReferenceLine
                key={`${d.date}-${event.id}`}
                x={d.date}
                stroke={event.type === 'milestone' ? '#FF0000' : event.type === 'campaign' ? '#00FF00' : '#0000FF'}
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )) || null
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* هدر */}
      <Card className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">آمار فعالیت‌های کسب و کار</CardTitle>
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
            
            {timeRange === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-right">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {customRange.start ? format(customRange.start, 'PPP', { locale: faIR }) : "تاریخ شروع"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customRange.start}
                      onSelect={date => setCustomRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-right">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {customRange.end ? format(customRange.end, 'PPP', { locale: faIR }) : "تاریخ پایان"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customRange.end}
                      onSelect={date => setCustomRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <Button variant="outline" size="icon" onClick={() => setIsMetricManagerOpen(true)}>
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
          </div>
        </CardHeader>
      </Card>

      {/* متریک‌های فعال */}
      <div className="flex flex-wrap gap-2">
        {metrics.filter(m => m.enabled).map(metric => (
          <Badge
            key={metric.id}
            variant="outline"
            className="cursor-pointer hover:bg-gray-100"
            style={{ borderColor: metric.color, color: metric.color }}
            onClick={() => toggleMetric(metric.id)}
          >
            {metric.name} ✓
          </Badge>
        ))}
        {metrics.filter(m => !m.enabled).map(metric => (
          <Badge
            key={metric.id}
            variant="outline"
            className="cursor-pointer opacity-50 hover:opacity-100"
            onClick={() => toggleMetric(metric.id)}
          >
            {metric.name}
          </Badge>
        ))}
      </div>

      {/* نمودار اصلی */}
      <Card className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <CardContent className="pt-6">
          <div className="h-[500px]">
            {renderChart()}
          </div>
          
          {/* کنترل‌های زوم */}
          {data.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="icon" onClick={() => setZoomArea({})} disabled={!zoomArea.startIndex}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                زوم روی ناحیه: ماوس را روی نمودار بکشید
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* فوتر: آمارهای خلاصه */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {metrics.filter(m => m.enabled).map(metric => {
            const latestValue = data[data.length - 1]?.[metric.id] || 0;
            return (
              <Card key={metric.id} className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <CardContent className="pt-6">
                  <h3 className="text-sm text-gray-500 mb-1">{metric.name}</h3>
                  <p className="text-2xl font-bold" style={{ color: metric.color }}>
                    {formatValue(latestValue, metric.unit)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* دیالوگ مدیریت متریک‌ها */}
      <Dialog open={isMetricManagerOpen} onOpenChange={setIsMetricManagerOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>مدیریت متریک‌ها</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* فرم افزودن متریک جدید */}
            <div className="space-y-4">
              <h3 className="font-medium">افزودن متریک جدید</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="نام فارسی"
                  value={newMetricForm.name}
                  onChange={e => setNewMetricForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="نام انگلیسی"
                  value={newMetricForm.englishName}
                  onChange={e => setNewMetricForm(prev => ({ ...prev, englishName: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newMetricForm.unit}
                  onValueChange={value => setNewMetricForm(prev => ({ ...prev, unit: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="واحد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">عدد</SelectItem>
                    <SelectItem value="IRR">تومان</SelectItem>
                    <SelectItem value="percentage">درصد</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={newMetricForm.chartType}
                  onValueChange={value => setNewMetricForm(prev => ({ ...prev, chartType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع نمودار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">خط</SelectItem>
                    <SelectItem value="area">مساحت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">رنگ</label>
                  <Input
                    type="color"
                    value={newMetricForm.color}
                    onChange={e => setNewMetricForm(prev => ({ ...prev, color: e.target.value }))}
                    className="h-8"
                  />
                </div>
                
                <Select
                  value={newMetricForm.yAxis}
                  onValueChange={value => setNewMetricForm(prev => ({ ...prev, yAxis: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="محور Y" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">چپ</SelectItem>
                    <SelectItem value="right">راست</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={addNewMetric} className="w-full">
                افزودن متریک
              </Button>
            </div>
            
            <Separator />
            
            {/* لیست متریک‌های موجود */}
            <div className="space-y-4">
              <h3 className="font-medium">متریک‌های موجود</h3>
              {metrics.map(metric => (
                <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: metric.color }} />
                    <div>
                      <p className="font-medium">{metric.name}</p>
                      <p className="text-sm text-gray-500">{metric.englishName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMetric(metric.id)}
                    >
                      {metric.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    {metric.isCustom && (
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomMetric(metric.id)}
                    >
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setIsMetricManagerOpen(false)}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default BusinessActivityChart;