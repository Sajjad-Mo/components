// components/custom/Timeline.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, FilterIcon, Calendar, BarChart2, PlusCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TimelineProps, TimelineEvent, TimelineStatus, TimelineViewMode, TimelineDependency } from './types';
import TimelineItem from './timeline-item';
import DependencyLine from './dependency-line';
import AnalyticsPanel from './analytics-panel';

export const BusinessTimeline: React.FC<TimelineProps> = ({
  events,
  dependencies = [],
  initialViewMode = 'monthly',
  filterable = true,
  searchable = true,
  draggable = false,
  showAnalytics = false,
  showReminders = false,
  onEventChange,
  onEventsChange,
  onDependenciesChange,
  className,
  ...otherProps
}) => {
  const [viewMode, setViewMode] = useState<TimelineViewMode>(initialViewMode);
  const [statusFilter, setStatusFilter] = useState<TimelineStatus[]>(['completed', 'ongoing', 'planned']);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(showAnalytics);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // افزودن رویداد جدید
  const addNewEvent = () => {
    if (!onEventsChange) return;
    
    // ایجاد تاریخ امروز به فرمت شمسی
    const today = new Date();
    // استفاده از تاریخ میلادی به فرمت شمسی‌نما برای سادگی (در نسخه واقعی باید از کتابخانه jalaali-js استفاده شود)
    const persianDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    const newEvent: TimelineEvent = {
      id: `event-${Date.now()}`, // ایجاد یک شناسه یکتا بر اساس زمان
      title: 'رویداد جدید',
      date: persianDate,
      description: 'توضیحات رویداد را اینجا وارد کنید',
      status: 'planned', // وضعیت پیش‌فرض: برنامه‌ریزی شده
    };
    
    onEventsChange([...events, newEvent]);
  };
  
  // فیلتر رویدادها براساس وضعیت و جستجو
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => statusFilter.includes(event.status))
      .filter(event => {
        if (searchTerm === '') return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) || 
          event.description.toLowerCase().includes(searchLower) ||
          (event.details && event.details.toLowerCase().includes(searchLower)) ||
          (event.owner && event.owner.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => {
        // مرتب‌سازی براساس تاریخ (فرض بر این است که تاریخ‌ها در فرمت شمسی YYYY/MM/DD هستند)
        const dateA = a.date.split('/').map(Number);
        const dateB = b.date.split('/').map(Number);
        
        // مقایسه سال
        if (dateA[0] !== dateB[0]) return dateA[0] - dateB[0];
        // مقایسه ماه
        if (dateA[1] !== dateB[1]) return dateA[1] - dateB[1];
        // مقایسه روز
        return dateA[2] - dateB[2];
      });
  }, [events, statusFilter, searchTerm]);

  // گروه‌بندی رویدادها براساس نوع نمایش (ماهانه، فصلی، سالانه)
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    filteredEvents.forEach(event => {
      const [year, month, day] = event.date.split('/').map(Number);
      
      let groupKey: string;
      if (viewMode === 'monthly') {
        groupKey = `${year}/${month}`;
      } else if (viewMode === 'quarterly') {
        const quarter = Math.ceil(month / 3);
        groupKey = `${year} - سه‌ماهه ${quarter}`;
      } else {
        groupKey = `${year}`;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(event);
    });
    
    return groups;
  }, [filteredEvents, viewMode]);

  // توابع برای تغییر وضعیت فیلترها
  const toggleStatusFilter = (status: TimelineStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // مدیریت Drag & Drop
  const handleDragStart = (id: string) => {
    setDraggedEventId(id);
  };

  const handleDragOver = (id: string) => {
    setTargetEventId(id);
  };

  const handleDrop = (id: string) => {
    if (!draggedEventId || draggedEventId === id) return;
    
    // تغییر ترتیب رویدادها
    const updatedEvents = [...events];
    const draggedEventIndex = updatedEvents.findIndex(e => e.id === draggedEventId);
    const targetEventIndex = updatedEvents.findIndex(e => e.id === id);
    
    if (draggedEventIndex < 0 || targetEventIndex < 0) return;
    
    // جابجایی رویدادها بر اساس تاریخ
    const draggedEvent = { ...updatedEvents[draggedEventIndex] };
    const targetEvent = { ...updatedEvents[targetEventIndex] };
    
    // تبادل تاریخ‌ها
    const tempDate = draggedEvent.date;
    draggedEvent.date = targetEvent.date;
    targetEvent.date = tempDate;
    
    // همچنین تاریخ شروع و پایان را تنظیم می‌کنیم اگر وجود داشته باشند
    if (draggedEvent.startDate && targetEvent.startDate) {
      const tempStartDate = draggedEvent.startDate;
      draggedEvent.startDate = targetEvent.startDate;
      targetEvent.startDate = tempStartDate;
    }
    
    if (draggedEvent.endDate && targetEvent.endDate) {
      const tempEndDate = draggedEvent.endDate;
      draggedEvent.endDate = targetEvent.endDate;
      targetEvent.endDate = tempEndDate;
    }
    
    updatedEvents[draggedEventIndex] = draggedEvent;
    updatedEvents[targetEventIndex] = targetEvent;
    
    if (onEventsChange) {
      onEventsChange(updatedEvents);
    }
    
    setDraggedEventId(null);
    setTargetEventId(null);
  };

  // بررسی یادآوری‌ها
  useEffect(() => {
    if (!showReminders) return;
    
    // یادآوری‌های امروز را پیدا می‌کنیم
    const today = new Date();
    const todayStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    const todayReminders = events.filter(event => 
      event.reminderDate === todayStr
    );
    
    if (todayReminders.length > 0) {
      // نمایش یادآوری‌ها (در حالت واقعی می‌توان از کامپوننت نوتیفیکیشن استفاده کرد)
      console.log('یادآوری‌های امروز:', todayReminders);
    }
  }, [events, showReminders]);

  // رندر کردن خطوط وابستگی
  // این بخش در حالت واقعی باید در useEffect و با محاسبه دقیق موقعیت المان‌ها پیاده‌سازی شود
  const renderDependencyLines = () => {
    if (dependencies.length === 0) return null;
    
    return dependencies.map(dependency => (
      <DependencyLine 
        key={dependency.id} 
        dependency={dependency} 
        events={events} 
      />
    ));
  };

  return (
    <div className={cn("space-y-6", className)} ref={timelineRef} {...otherProps}>
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <h2 className="text-xl font-bold">نقشه راه توسعه کسب و کار</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* دکمه افزودن رویداد جدید */}
          {onEventsChange && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-9 bg-green-600 hover:bg-green-700"
              onClick={addNewEvent}
            >
              <PlusCircle className="h-4 w-4 ml-2" />
              افزودن رویداد جدید
            </Button>
          )}
          
          {searchable && (
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="جستجو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-8 h-9 w-full md:w-auto"
              />
            </div>
          )}
          
          {filterable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <FilterIcon className="h-4 w-4 ml-2" />
                  فیلتر وضعیت
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes('completed')}
                  onCheckedChange={() => toggleStatusFilter('completed')}
                >
                  ✅ انجام شده
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes('ongoing')}
                  onCheckedChange={() => toggleStatusFilter('ongoing')}
                >
                  🔄 در حال انجام
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes('planned')}
                  onCheckedChange={() => toggleStatusFilter('planned')}
                >
                  🕒 برنامه‌ریزی شده
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as TimelineViewMode)}>
            <SelectTrigger className="h-9 w-[130px]">
              <Calendar className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">ماهانه</SelectItem>
              <SelectItem value="quarterly">فصلی</SelectItem>
              <SelectItem value="yearly">سالانه</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
          >
            <BarChart2 className="h-4 w-4 ml-2" />
            {showAnalyticsPanel ? 'پنهان کردن آمار' : 'نمایش آمار'}
          </Button>
        </div>
      </div>

      {showAnalyticsPanel && (
        <AnalyticsPanel events={events} />
      )}

      {Object.keys(groupedEvents).length > 0 ? (
        <div className="space-y-8 relative">
          {renderDependencyLines()}
          
          {Object.entries(groupedEvents).map(([groupTitle, groupEvents], groupIndex) => (
            <div key={groupTitle} className="space-y-4">
              <h3 className="text-lg font-medium sticky top-0 bg-white py-2 z-10 border-b">
                {groupTitle}
              </h3>
              <div className="space-y-6">
                {groupEvents.map((event, eventIndex) => (
                  <TimelineItem
                    key={event.id}
                    event={event}
                    isLast={eventIndex === groupEvents.length - 1 && groupIndex === Object.keys(groupedEvents).length - 1}
                    dependencies={dependencies}
                    allEvents={events}
                    draggable={draggable}
                    onEventChange={onEventChange}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          هیچ رویدادی با معیارهای انتخاب‌شده یافت نشد.
        </div>
      )}
      
      {/* دیالوگ برای نمایش اطلاعات وابستگی‌ها (مدیریت وابستگی باید به صورت جداگانه پیاده‌سازی شود) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">مدیریت وابستگی‌ها</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مدیریت وابستگی‌ها</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* فرم مدیریت وابستگی‌ها */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessTimeline;