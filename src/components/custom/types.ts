// components/custom/types.ts
export type TimelineStatus = 'completed' | 'ongoing' | 'planned';
export type TimelineViewMode = 'monthly' | 'quarterly' | 'yearly';

// تعریف وابستگی بین رویدادها
export type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';

export interface TimelineDependency {
  id: string;
  sourceId: string; // شناسه رویداد مبدا
  targetId: string; // شناسه رویداد هدف
  type: DependencyType; // نوع وابستگی
  [key: string]: any; // پشتیبانی از فیلدهای دلخواه
}

export interface TimelineEvent {
  // فیلدهای اجباری
  id: string;
  title: string;
  date: string; // تاریخ شمسی YYYY/MM/DD
  description: string;
  status: TimelineStatus;
  
  // فیلدهای اختیاری پیش‌فرض
  icon?: string;
  details?: string;
  attachments?: Array<{
    type: 'link' | 'file' | 'image';
    title: string;
    url: string;
    [key: string]: any; // پشتیبانی از فیلدهای دلخواه در پیوست‌ها
  }>;
  startDate?: string;
  endDate?: string;
  progress?: number;
  owner?: string;
  priority?: 'low' | 'medium' | 'high';
  reminderDate?: string;
  
  // پشتیبانی از فیلدهای دلخواه
  [key: string]: any;
}

export interface TimelineProps {
  events: TimelineEvent[];
  dependencies?: TimelineDependency[]; 
  initialViewMode?: TimelineViewMode;
  filterable?: boolean;
  searchable?: boolean;
  draggable?: boolean;
  showAnalytics?: boolean;
  showReminders?: boolean;
  onEventChange?: (event: TimelineEvent) => void;
  onEventsChange?: (events: TimelineEvent[]) => void;
  onDependenciesChange?: (dependencies: TimelineDependency[]) => void;
  className?: string;
  [key: string]: any; // پشتیبانی از پراپ‌های دلخواه
}

export interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  dependencies?: TimelineDependency[];
  allEvents?: TimelineEvent[];
  draggable?: boolean;
  onEventChange?: (event: TimelineEvent) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
  [key: string]: any; // پشتیبانی از پراپ‌های دلخواه
}