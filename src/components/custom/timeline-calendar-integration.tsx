// components/custom/timeline-calendar-integration.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersianCalendarWithNotes from '@/components/custom/PersianCalendarWithNotes';
import { BusinessTimeline } from './Timeline';
import { TimelineEvent, TimelineStatus, TimelineDependency } from './types';
import jalaali from "jalaali-js";

// نوع یادداشت در کامپوننت تقویم
export interface CalendarNote {
  id: string;
  date: string;
  title: string;
  content: string;
  type: string;
  [key: string]: any; // پشتیبانی از فیلدهای دلخواه
}

// تبدیل وضعیت تایم‌لاین به نوع یادداشت
export const mapStatusToNoteType = (status: TimelineStatus): string => {
  switch (status) {
    case 'completed': return 'event';
    case 'ongoing': return 'task';
    case 'planned': return 'deadline';
    default: return 'reminder';
  }
};

// تبدیل نوع یادداشت به وضعیت تایم‌لاین
export const mapNoteTypeToStatus = (type: string): TimelineStatus => {
  switch (type) {
    case 'event': return 'completed';
    case 'task': return 'ongoing';
    case 'deadline': 
    case 'reminder': 
    default: return 'planned';
  }
};

// تبدیل تاریخ شمسی به فرمت میلادی برای تقویم
export const convertToCalendarDate = (persianDateStr: string): string => {
  if (!persianDateStr) return '';
  
  const [year, month, day] = persianDateStr.split('/').map(Number);
  
  const gregorianDate = jalaali.toGregorian(year, month, day);
  return `${gregorianDate.gy}-${String(gregorianDate.gm).padStart(2, '0')}-${String(gregorianDate.gd).padStart(2, '0')}`;
};

// تبدیل تاریخ میلادی به فرمت شمسی برای تایم‌لاین
export const convertToTimelineDate = (gregorianDateStr: string): string => {
  if (!gregorianDateStr) return '';
  
  const [year, month, day] = gregorianDateStr.split('-').map(Number);
  const gregorianDate = new Date(year, month - 1, day);
  
  const persianDate = jalaali.toJalaali(
    gregorianDate.getFullYear(),
    gregorianDate.getMonth() + 1,
    gregorianDate.getDate()
  );
  
  return `${persianDate.jy}/${String(persianDate.jm).padStart(2, '0')}/${String(persianDate.jd).padStart(2, '0')}`;
};

interface TimelineCalendarIntegrationProps {
  // پراپ‌های اصلی
  timelineEvents: TimelineEvent[];
  dependencies?: TimelineDependency[];
  onTimelineEventsChange?: (events: TimelineEvent[]) => void;
  onDependenciesChange?: (dependencies: TimelineDependency[]) => void;
  calendarNotes?: CalendarNote[];
  onCalendarNotesChange?: (notes: CalendarNote[]) => void;
  
  // پراپ‌های پیکربندی
  showAnalytics?: boolean;
  draggable?: boolean;
  defaultTab?: 'timeline' | 'calendar';
  timelineTitle?: string;
  calendarTitle?: string;
  
  // تابع‌های سفارشی برای کنترل بیشتر بر روی نحوه تبدیل داده‌ها
  customMapStatusToNoteType?: (status: TimelineStatus) => string;
  customMapNoteTypeToStatus?: (type: string) => TimelineStatus;
  customConvertToCalendarDate?: (persianDateStr: string) => string;
  customConvertToTimelineDate?: (gregorianDateStr: string) => string;
  
  // سایر پراپ‌های دلخواه
  [key: string]: any;
}

const TimelineCalendarIntegration: React.FC<TimelineCalendarIntegrationProps> = ({
  // استفاده از پراپ‌ها با مقادیر پیش‌فرض
  timelineEvents,
  dependencies = [],
  onTimelineEventsChange,
  onDependenciesChange,
  calendarNotes: initialCalendarNotes = [],
  onCalendarNotesChange,
  
  // پراپ‌های پیکربندی
  showAnalytics = false,
  draggable = false,
  defaultTab = 'timeline',
  timelineTitle = 'نقشه راه توسعه',
  calendarTitle = 'تقویم',
  
  // تابع‌های سفارشی
  customMapStatusToNoteType,
  customMapNoteTypeToStatus,
  customConvertToCalendarDate,
  customConvertToTimelineDate,
  
  // سایر پراپ‌ها
  ...otherProps
}) => {
  // استفاده از توابع سفارشی اگر ارائه شده باشند، در غیر این صورت استفاده از توابع پیش‌فرض
  const statusToNoteType = customMapStatusToNoteType || mapStatusToNoteType;
  const noteTypeToStatus = customMapNoteTypeToStatus || mapNoteTypeToStatus;
  const toCalendarDate = customConvertToCalendarDate || convertToCalendarDate;
  const toTimelineDate = customConvertToTimelineDate || convertToTimelineDate;

  // تبدیل رویدادهای تایم‌لاین به یادداشت‌های تقویم
  const convertTimelineToNotes = useCallback((events: TimelineEvent[]): CalendarNote[] => {
    return events.map(event => ({
      id: `timeline-${event.id}`,
      date: toCalendarDate(event.date),
      title: event.title,
      content: event.description,
      type: statusToNoteType(event.status),
      
      // انتقال فیلدهای سفارشی
      originalEvent: event, // اشاره به رویداد اصلی
      // می‌توانید فیلدهای سفارشی دیگری نیز اضافه کنید
    }));
  }, [statusToNoteType, toCalendarDate]);

  // ترکیب یادداشت‌های عادی تقویم با رویدادهای تایم‌لاین
  const [combinedNotes, setCombinedNotes] = useState<CalendarNote[]>([
    ...initialCalendarNotes,
    ...convertTimelineToNotes(timelineEvents)
  ]);

  // به‌روزرسانی یادداشت‌های ترکیبی با تغییر در تایم‌لاین یا یادداشت‌های تقویم
  useEffect(() => {
    const timelineNotes = convertTimelineToNotes(timelineEvents);
    const regularNotes = combinedNotes.filter(note => !note.id.startsWith('timeline-'));
    
    setCombinedNotes([...regularNotes, ...timelineNotes]);
  }, [timelineEvents, convertTimelineToNotes]);

  // مدیریت تغییرات در یادداشت‌های تقویم
  const handleNotesChange = useCallback((notes: CalendarNote[]) => {
    // جداسازی یادداشت‌های عادی و رویدادهای تایم‌لاین
    const regularNotes = notes.filter(note => !note.id.startsWith('timeline-'));
    const timelineNotes = notes.filter(note => note.id.startsWith('timeline-'));
    
    // به‌روزرسانی یادداشت‌های عادی
    if (onCalendarNotesChange) {
      onCalendarNotesChange(regularNotes);
    }
    
    // به‌روزرسانی رویدادهای تایم‌لاین اگر تغییر کرده باشند
    if (onTimelineEventsChange) {
      // رویدادهایی که از تقویم ویرایش شده‌اند
      const updatedTimelineEvents = timelineNotes.map(note => {
        const originalId = note.id.replace('timeline-', '');
        const original = timelineEvents.find(event => event.id === originalId);
        
        if (original) {
          return {
            ...original, // حفظ سایر فیلدهای اصلی
            title: note.title,
            description: note.content,
            status: noteTypeToStatus(note.type),
            date: toTimelineDate(note.date),
            // می‌توانید فیلدهای سفارشی دیگری را نیز به‌روز کنید
            // customField: note.customField,
          };
        }
        
        // اگر این رویداد تایم‌لاین جدید باشد
        return {
          id: originalId,
          title: note.title,
          description: note.content,
          status: noteTypeToStatus(note.type),
          date: toTimelineDate(note.date),
          details: '',
          // می‌توانید فیلدهای سفارشی دیگری را نیز اضافه کنید
        };
      });
      
      // ادغام رویدادهای جدید با رویدادهای قبلی (حفظ رویدادهایی که در تقویم نبودند)
      const updatedEventIds = updatedTimelineEvents.map(e => e.id);
      const unchangedEvents = timelineEvents.filter(event => !updatedEventIds.includes(event.id));
      
      onTimelineEventsChange([...updatedTimelineEvents, ...unchangedEvents]);
    }
    
    setCombinedNotes(notes);
  }, [timelineEvents, onTimelineEventsChange, onCalendarNotesChange, convertTimelineToNotes, noteTypeToStatus, toTimelineDate]);

  // مدیریت تغییرات در رویدادهای تایم‌لاین
  const handleTimelineEventsChange = useCallback((events: TimelineEvent[]) => {
    if (onTimelineEventsChange) {
      onTimelineEventsChange(events);
    }
    
    // به‌روزرسانی یادداشت‌های تقویم بر اساس تغییرات تایم‌لاین
    const timelineNotes = convertTimelineToNotes(events);
    const regularNotes = combinedNotes.filter(note => !note.id.startsWith('timeline-'));
    
    setCombinedNotes([...regularNotes, ...timelineNotes]);
  }, [onTimelineEventsChange, convertTimelineToNotes, combinedNotes]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>مدیریت زمان‌بندی کسب و کار</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">{timelineTitle}</TabsTrigger>
            <TabsTrigger value="calendar">{calendarTitle}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="w-full">
            <BusinessTimeline 
              events={timelineEvents} 
              dependencies={dependencies}
              initialViewMode="monthly"
              filterable={true}
              searchable={true}
              draggable={draggable}
              showAnalytics={showAnalytics}
              showReminders={true}
              onEventsChange={handleTimelineEventsChange}
              onDependenciesChange={onDependenciesChange}
              {...otherProps} // انتقال سایر پراپ‌ها به کامپوننت تایم‌لاین
            />
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="pt-2">
              <PersianCalendarWithNotes 
                defaultView="persian"
                notes={combinedNotes}
                onNotesChange={handleNotesChange}
                {...otherProps} // انتقال سایر پراپ‌ها به کامپوننت تقویم
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TimelineCalendarIntegration;