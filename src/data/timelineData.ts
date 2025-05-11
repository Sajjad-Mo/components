// src/data/timelineData.ts
import { TimelineEvent, TimelineDependency } from '@/components/custom/types';

export const sampleTimelineData: TimelineEvent[] = [
  {
    id: '1',
    title: 'تأسیس شرکت',
    date: '1402/06/15',
    description: 'ثبت رسمی شرکت و شروع فعالیت',
    status: 'completed',
    details: 'در این مرحله، تمامی مدارک قانونی مورد نیاز برای ثبت شرکت آماده و به اداره ثبت شرکت‌ها ارائه شد. پس از تأیید صلاحیت‌ها و طی مراحل اداری، شرکت به صورت رسمی ثبت و فعالیت خود را آغاز کرد.',
    attachments: [
      {
        type: 'file',
        title: 'اساسنامه شرکت',
        url: '#'
      },
      {
        type: 'image',
        title: 'تصویر مجوز فعالیت',
        url: '#'
      }
    ],
    progress: 100,
    owner: 'مدیرعامل',
    priority: 'high',
    startDate: '1402/05/20',
    endDate: '1402/06/15'
  },
  {
    id: '2',
    title: 'طراحی و توسعه محصول اولیه',
    date: '1402/08/10',
    description: 'ایجاد نسخه اولیه محصول و تست داخلی',
    status: 'completed',
    details: 'تیم توسعه و طراحی، نسخه اولیه محصول را پس از تحقیقات بازار و نیازسنجی مشتریان طراحی کرد. این نسخه به صورت داخلی تست شد و بازخوردهای اولیه جمع‌آوری گردید.',
    progress: 100,
    owner: 'مدیر فنی',
    priority: 'high',
    startDate: '1402/06/20',
    endDate: '1402/08/10'
  },
  {
    id: '3',
    title: 'جذب سرمایه دور اول',
    date: '1402/10/23',
    description: 'مذاکره با سرمایه‌گذاران و جذب سرمایه اولیه',
    status: 'completed',
    attachments: [
      {
        type: 'link',
        title: 'گزارش عملکرد مالی',
        url: '#'
      }
    ],
    progress: 100,
    owner: 'مدیر مالی',
    priority: 'high',
    startDate: '1402/09/01',
    endDate: '1402/10/23',
    reminderDate: '1402/10/01'
  },
  {
    id: '4',
    title: 'راه‌اندازی وب‌سایت و فروشگاه آنلاین',
    date: '1402/12/15',
    description: 'طراحی و پیاده‌سازی سایت و فروشگاه آنلاین',
    status: 'ongoing',
    details: 'طراحی رابط کاربری و تجربه کاربری سایت با همکاری تیم‌های طراحی و توسعه در حال انجام است. بخش فروشگاه آنلاین با قابلیت پرداخت آنلاین و سیستم مدیریت سفارشات در مرحله پیاده‌سازی است.',
    progress: 65,
    owner: 'مدیر فنی',
    priority: 'medium',
    startDate: '1402/11/01',
    endDate: '1402/12/15'
  },
  {
    id: '5',
    title: 'استخدام تیم بازاریابی و فروش',
    date: '1403/01/20',
    description: 'استخدام و آموزش تیم بازاریابی و فروش',
    status: 'ongoing',
    progress: 30,
    owner: 'مدیر منابع انسانی',
    priority: 'medium',
    startDate: '1402/12/10',
    endDate: '1403/01/20'
  },
  {
    id: '6',
    title: 'ورود به بازارهای استانی',
    date: '1403/04/15',
    description: 'گسترش فعالیت به استان‌های همجوار',
    status: 'planned',
    progress: 0,
    owner: 'مدیر فروش',
    priority: 'low',
    startDate: '1403/02/01',
    endDate: '1403/04/15',
    reminderDate: '1403/01/20'
  },
  {
    id: '7',
    title: 'توسعه محصول جدید',
    date: '1403/06/10',
    description: 'طراحی و توسعه محصول دوم شرکت',
    status: 'planned',
    progress: 0,
    owner: 'مدیر محصول',
    priority: 'medium',
    startDate: '1403/04/01',
    endDate: '1403/06/10'
  },
  {
    id: '8',
    title: 'جذب سرمایه دور دوم',
    date: '1403/09/15',
    description: 'مذاکره با سرمایه‌گذاران جدید برای توسعه کسب و کار',
    status: 'planned',
    progress: 0,
    owner: 'مدیرعامل',
    priority: 'high',
    startDate: '1403/07/01',
    endDate: '1403/09/15',
    reminderDate: '1403/06/15'
  }
];

// وابستگی‌های نمونه برای رویدادها
export const sampleDependencies: TimelineDependency[] = [
  {
    id: 'dep1',
    sourceId: '1', // تأسیس شرکت
    targetId: '2', // طراحی و توسعه محصول اولیه
    type: 'finish-to-start'
  },
  {
    id: 'dep2',
    sourceId: '2', // طراحی و توسعه محصول اولیه
    targetId: '3', // جذب سرمایه دور اول
    type: 'finish-to-start'
  },
  {
    id: 'dep3',
    sourceId: '3', // جذب سرمایه دور اول
    targetId: '4', // راه‌اندازی وب‌سایت
    type: 'finish-to-start'
  },
  {
    id: 'dep4',
    sourceId: '4', // راه‌اندازی وب‌سایت
    targetId: '5', // استخدام تیم بازاریابی
    type: 'start-to-start'
  },
  {
    id: 'dep5',
    sourceId: '5', // استخدام تیم بازاریابی
    targetId: '6', // ورود به بازارهای استانی
    type: 'finish-to-start'
  },
  {
    id: 'dep6',
    sourceId: '4', // راه‌اندازی وب‌سایت
    targetId: '7', // توسعه محصول جدید
    type: 'finish-to-start'
  },
  {
    id: 'dep7',
    sourceId: '6', // ورود به بازارهای استانی
    targetId: '8', // جذب سرمایه دور دوم
    type: 'start-to-start'
  }
];