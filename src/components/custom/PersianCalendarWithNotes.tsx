// components/custom/PersianCalendarWithNotes.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import jalaali from "jalaali-js";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  Plus, 
  Trash2,
  Languages,
  Edit
} from "lucide-react";

// ساختار یادداشت مبتنی بر اهمیت عددی (0-100)
interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  importance: number; // عدد بین 0 تا 100 برای نشان دادن میزان اهمیت
}

// تابع تبدیل میزان اهمیت به رنگ
const getColorFromImportance = (importance: number): string => {
  // ایجاد رنگ‌های مختلف بر اساس میزان اهمیت
  if (importance <= 20) {
    return "bg-red-400 text-red-800 border-red-400"; // اهمیت کم - قرمز
  } else if (importance <= 40) {
    return "bg-orange-400 text-orange-800 border-orange-400"; // اهمیت متوسط رو به کم - نارنجی
  } else if (importance <= 60) {
    return "bg-yellow-400 text-yellow-800 border-yellow-400"; // اهمیت متوسط - زرد
  } else if (importance <= 80) {
    return "bg-green-400 text-green-800 border-green-400"; // اهمیت بالای متوسط - سبز
  } else {
    return "bg-blue-500 text-blue-800 border-blue-500"; // اهمیت بالا - آبی
  }
};

// تابع تبدیل میزان اهمیت به متن توضیحی
const getImportanceLabel = (importance: number): string => {
  if (importance <= 20) {
    return "اهمیت کم";
  } else if (importance <= 40) {
    return "اهمیت متوسط رو به کم";
  } else if (importance <= 60) {
    return "اهمیت متوسط";
  } else if (importance <= 80) {
    return "اهمیت بالای متوسط";
  } else {
    return "اهمیت بالا";
  }
};

// تابع تبدیل میزان اهمیت به رنگ خالص (برای استایل‌های مستقیم)
const getColorForStyle = (importance: number): string => {
  // ایجاد رنگ‌های مختلف بر اساس میزان اهمیت
  if (importance <= 20) {
    return "#f87171"; // اهمیت کم - قرمز
  } else if (importance <= 40) {
    return "#fb923c"; // اهمیت متوسط رو به کم - نارنجی
  } else if (importance <= 60) {
    return "#facc15"; // اهمیت متوسط - زرد
  } else if (importance <= 80) {
    return "#4ade80"; // اهمیت بالای متوسط - سبز
  } else {
    return "#3b82f6"; // اهمیت بالا - آبی
  }
};

// تابع تبدیل میزان اهمیت به رنگ بک‌گراند کمرنگ
const getBackgroundColorFromImportance = (importance: number): string => {
  // ایجاد رنگ‌های کمرنگ بر اساس میزان اهمیت
  if (importance <= 20) {
    return "bg-red-100"; // اهمیت کم - قرمز کمرنگ
  } else if (importance <= 40) {
    return "bg-orange-100"; // اهمیت متوسط رو به کم - نارنجی کمرنگ
  } else if (importance <= 60) {
    return "bg-yellow-100"; // اهمیت متوسط - زرد کمرنگ
  } else if (importance <= 80) {
    return "bg-green-100"; // اهمیت بالای متوسط - سبز کمرنگ
  } else {
    return "bg-blue-100"; // اهمیت بالا - آبی کمرنگ
  }
};

// تابع تبدیل میزان اهمیت به رنگ متن پررنگ
const getTextColorFromImportance = (importance: number): string => {
  // ایجاد رنگ‌های پررنگ برای متن بر اساس میزان اهمیت
  if (importance <= 20) {
    return "text-red-700"; // اهمیت کم - قرمز
  } else if (importance <= 40) {
    return "text-orange-700"; // اهمیت متوسط رو به کم - نارنجی
  } else if (importance <= 60) {
    return "text-yellow-700"; // اهمیت متوسط - زرد
  } else if (importance <= 80) {
    return "text-green-700"; // اهمیت بالای متوسط - سبز
  } else {
    return "text-blue-700"; // اهمیت بالا - آبی
  }
};

// کامپوننت اسلایدر رنگی
interface ColorSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const ColorSlider: React.FC<ColorSliderProps> = ({ value, onChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // محاسبه موقعیت مارکر بر اساس مقدار
  const handlePositionUpdate = useCallback((clientX: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const sliderWidth = rect.width;
      const offsetX = clientX - rect.left;
      
      // محدودسازی مقدار بین 0 تا 100
      let newValue = Math.round((offsetX / sliderWidth) * 100);
      newValue = Math.max(0, Math.min(100, newValue));
      
      onChange(newValue);
    }
  }, [onChange]);

  // هندلرهای موس برای رویدادهای کلیک و درگ
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handlePositionUpdate(e.clientX);
  }, [handlePositionUpdate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handlePositionUpdate(e.clientX);
    }
  }, [isDragging, handlePositionUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // هندلرهای لمسی برای دستگاه‌های موبایل
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handlePositionUpdate(e.touches[0].clientX);
  }, [handlePositionUpdate]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      handlePositionUpdate(e.touches[0].clientX);
    }
  }, [isDragging, handlePositionUpdate]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // تنظیم رویدادهای مربوط به درگ کردن
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="w-full">
      <div 
        ref={sliderRef}
        className="h-8 rounded-md cursor-pointer relative"
        style={{ 
          background: 'linear-gradient(to right, #f87171, #fb923c, #facc15, #4ade80, #3b82f6)',
          marginBottom: '12px' 
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* مارکر نشانگر موقعیت اسلایدر */}
        <div 
          className="absolute top-0 bottom-0 w-3 border-2 border-white rounded-sm"
          style={{ 
            left: `calc(${value}% - 6px)`,
            boxShadow: '0 0 5px rgba(0,0,0,0.3)',
            backgroundColor: getColorForStyle(value)
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>اهمیت کم</span>
        <span>اهمیت بالا</span>
      </div>
    </div>
  );
};

// ماه‌های شمسی
const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", 
  "مرداد", "شهریور", "مهر", "آبان", 
  "آذر", "دی", "بهمن", "اسفند"
];

// ماه‌های میلادی
const gregorianMonths = [
  "January", "February", "March", "April", 
  "May", "June", "July", "August", 
  "September", "October", "November", "December"
];

// روزهای هفته شمسی - اصلاح شده، از شنبه شروع می‌شود
const persianWeekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// روزهای هفته میلادی - اصلاح شده، از یکشنبه شروع می‌شود
const gregorianWeekDays = ["S", "M", "T", "W", "T", "F", "S"];

// تبدیل اعداد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

interface Props {
  defaultView?: "persian" | "gregorian";
  notes?: Note[];
  onNotesChange?: (notes: Note[]) => void;
}

const PersianCalendarWithNotes: React.FC<Props> = ({
  defaultView = "persian",
  notes: initialNotes = [],
  onNotesChange,
}) => {
  const [calendarView, setCalendarView] = useState<"persian" | "gregorian">(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNotesListDialogOpen, setIsNotesListDialogOpen] = useState(false);
  const [selectedDateNotes, setSelectedDateNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    importance: 50, // مقدار پیش‌فرض برای اهمیت (متوسط)
  });
  const [today, setToday] = useState(new Date());

  // به‌روزرسانی تاریخ امروز هر دقیقه
  useEffect(() => {
    setToday(new Date());
    
    const timer = setInterval(() => {
      setToday(new Date());
    }, 60000); // هر دقیقه

    return () => clearInterval(timer);
  }, []);

  // به‌روزرسانی یادداشت‌ها
  useEffect(() => {
    if (onNotesChange) {
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

  // ریست کردن فرم یادداشت هنگام باز شدن دیالوگ
  useEffect(() => {
    if (isDialogOpen && !editingNote) {
      setNoteForm({
        title: "",
        content: "",
        importance: 50,
      });
    }
  }, [isDialogOpen, editingNote]);

  // دریافت تاریخ فعلی بر اساس نوع تقویم
  const getCurrentCalendarInfo = useCallback(() => {
    const jsDate = new Date(currentDate);
    
    if (calendarView === "persian") {
      const persianDate = jalaali.toJalaali(
        jsDate.getFullYear(),
        jsDate.getMonth() + 1,
        jsDate.getDate()
      );
      return {
        year: persianDate.jy,
        month: persianDate.jm,
        day: persianDate.jd,
      };
    } else {
      return {
        year: jsDate.getFullYear(),
        month: jsDate.getMonth() + 1,
        day: jsDate.getDate(),
      };
    }
  }, [currentDate, calendarView]);

  // بررسی آیا تاریخ امروز است
  const isToday = useCallback((year: number, month: number, day: number) => {
    if (calendarView === "persian") {
      const todayPersian = jalaali.toJalaali(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      return (
        year === todayPersian.jy &&
        month === todayPersian.jm &&
        day === todayPersian.jd
      );
    } else {
      return (
        year === today.getFullYear() &&
        month === today.getMonth() + 1 &&
        day === today.getDate()
      );
    }
  }, [today, calendarView]);

  // تولید String تاریخ برای ذخیره
  const generateDateString = useCallback((year: number, month: number, day: number) => {
    if (calendarView === "persian") {
      // تبدیل تاریخ شمسی به میلادی برای ذخیره یکپارچه
      const gregorianDate = jalaali.toGregorian(year, month, day);
      return `${gregorianDate.gy}-${String(gregorianDate.gm).padStart(2, '0')}-${String(gregorianDate.gd).padStart(2, '0')}`;
    } else {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }, [calendarView]);

  // تبدیل تاریخ به عدد برای مقایسه
  const dateToNumber = useCallback((dateString: string): number => {
    return parseInt(dateString.replace(/-/g, ''), 10);
  }, []);

  // دریافت روزهای ماه - اصلاح شده برای نمایش صحیح روزهای هفته
  const getMonthDays = useCallback(() => {
    const { year, month } = getCurrentCalendarInfo();
    let daysInMonth: number;
    let firstDayOfMonth: number;

    if (calendarView === "persian") {
      daysInMonth = month >= 1 && month <= 6 ? 31 : month >= 7 && month <= 11 ? 30 : 29;
      
      // در سال کبیسه شمسی، اسفند 30 روز دارد
      if (month === 12 && jalaali.isLeapJalaaliYear(year)) {
        daysInMonth = 30;
      }

      // تبدیل اولین روز ماه جلالی به میلادی
      const firstDayGregorian = jalaali.toGregorian(year, month, 1);
      const firstDayJsDate = new Date(
        firstDayGregorian.gy,
        firstDayGregorian.gm - 1,
        firstDayGregorian.gd
      );
      
      // اصلاح محاسبه روز هفته برای تقویم شمسی (از شنبه)
      // شنبه: 0، یکشنبه: 1، ...، جمعه: 6
      firstDayOfMonth = (firstDayJsDate.getDay() + 1) % 7;
    } else {
      const firstDayJsDate = new Date(year, month - 1, 1);
      daysInMonth = new Date(year, month, 0).getDate();
      firstDayOfMonth = firstDayJsDate.getDay();
    }

    return { daysInMonth, firstDayOfMonth };
  }, [calendarView, getCurrentCalendarInfo]);

  // بررسی وجود یادداشت در یک تاریخ خاص
  const getNotesForDate = useCallback((date: string): Note[] => {
    // بازگرداندن همه یادداشت‌های مربوط به تاریخ مشخص شده
    return notes.filter(note => note.date === date);
  }, [notes]);

  // یافتن مهمترین یادداشت برای یک تاریخ
  const getMostImportantNoteForDate = useCallback((date: string): Note | null => {
    const dateNotes = getNotesForDate(date);
    if (dateNotes.length === 0) return null;
    
    // برای قرمز (اهمیت کم) به آبی (اهمیت بالا)، مقادیر بزرگتر مهمتر هستند
    return dateNotes.reduce((prev, current) => 
      (current.importance > prev.importance) ? current : prev, 
      dateNotes[0]
    );
  }, [getNotesForDate]);

  // تبدیل تاریخ به تاریخ شمسی (برای نمایش)
  const convertToJalaliDate = useCallback((dateString: string): { jd: number, jm: number, jy: number } => {
    const [year, month, day] = dateString.split('-').map(Number);
    const gregorianDate = new Date(year, month - 1, day);
    return jalaali.toJalaali(
      gregorianDate.getFullYear(),
      gregorianDate.getMonth() + 1,
      gregorianDate.getDate()
    );
  }, []);

  // مقایسه دو تاریخ در فرمت شمسی - برای مرتب‌سازی
  const compareDates = useCallback((a: string, b: string): number => {
    const aJalali = convertToJalaliDate(a);
    const bJalali = convertToJalaliDate(b);
    
    // مقایسه سال
    if (aJalali.jy !== bJalali.jy) return aJalali.jy - bJalali.jy;
    // مقایسه ماه
    if (aJalali.jm !== bJalali.jm) return aJalali.jm - bJalali.jm;
    // مقایسه روز
    return aJalali.jd - bJalali.jd;
  }, [convertToJalaliDate]);

  // فیلتر کردن یادداشت‌ها برای ماه جاری
  const getNotesForCurrentMonth = useCallback(() => {
    const { year, month } = getCurrentCalendarInfo();
    let startDate, endDate;
    
    if (calendarView === "persian") {
      // تبدیل اولین روز ماه شمسی به میلادی
      const firstDayGregorian = jalaali.toGregorian(year, month, 1);
      startDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
      
      // تبدیل آخرین روز ماه شمسی به میلادی
      const lastDay = month >= 1 && month <= 6 ? 31 : month >= 7 && month <= 11 ? 30 : 29;
      if (month === 12 && jalaali.isLeapJalaaliYear(year)) {
        // اسفند در سال کبیسه
        endDate = jalaali.toGregorian(year, month, 30);
      } else {
        endDate = jalaali.toGregorian(year, month, lastDay);
      }
      endDate = new Date(endDate.gy, endDate.gm - 1, endDate.gd);
    } else {
      // میلادی
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // آخرین روز ماه
    }
    
    // تبدیل به فرمت رشته برای مقایسه
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // فیلتر یادداشت‌ها برای ماه جاری و مرتب‌سازی بر اساس تاریخ
    const filteredNotes = notes.filter(note => 
      note.date >= startDateStr && note.date <= endDateStr
    );
    
    // ابتدا بر اساس تاریخ مرتب می‌کنیم (تاریخ‌های نزدیک‌تر به امروز در بالا)
    const today = new Date().toISOString().split('T')[0];
    
    // یادداشت‌ها را به گروه‌های قبل و بعد از امروز تقسیم می‌کنیم
    const futureNotes = filteredNotes.filter(note => compareDates(note.date, today) >= 0);
    const pastNotes = filteredNotes.filter(note => compareDates(note.date, today) < 0);
    
    // یادداشت‌های آینده را بر اساس نزدیکی به امروز مرتب می‌کنیم (صعودی)
    futureNotes.sort((a, b) => compareDates(a.date, b.date));
    
    // یادداشت‌های گذشته را بر اساس دوری از امروز مرتب می‌کنیم (نزولی)
    pastNotes.sort((a, b) => compareDates(b.date, a.date));
    
    // ترکیب دو آرایه: ابتدا یادداشت‌های آینده، سپس یادداشت‌های گذشته
    const sortedByDate = [...futureNotes, ...pastNotes];
    
    // سپس یادداشت‌های هر روز را بر اساس اهمیت مرتب می‌کنیم
    const groupedByDate: { [key: string]: Note[] } = {};
    
    sortedByDate.forEach(note => {
      if (!groupedByDate[note.date]) {
        groupedByDate[note.date] = [];
      }
      groupedByDate[note.date].push(note);
    });
    
    // مرتب‌سازی هر گروه بر اساس اهمیت
    Object.keys(groupedByDate).forEach(date => {
      groupedByDate[date].sort((a, b) => b.importance - a.importance);
    });
    
    // ترکیب مجدد به یک آرایه مسطح
    const result: Note[] = [];
    Object.keys(groupedByDate).forEach(date => {
      result.push(...groupedByDate[date]);
    });
    
    return result;
  }, [notes, getCurrentCalendarInfo, calendarView, compareDates]);

  // رندر تقویم
  const renderCalendar = useCallback(() => {
    const { daysInMonth, firstDayOfMonth } = getMonthDays();
    const { year, month } = getCurrentCalendarInfo();
    const days: React.ReactElement[] = [];
    
    // اضافه کردن روزهای خالی در ابتدا
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // اضافه کردن روزهای ماه
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = generateDateString(year, month, day);
      const dayNotes = getNotesForDate(dateString);
      const hasNotes = dayNotes.length > 0;
      const isTodayDate = isToday(year, month, day);
      
      // تعیین رنگ روز بر اساس اهمیت یادداشت
      let bgColor = "";
      let textColor = "";
      let borderColor = "";
      
      if (hasNotes) {
        // یافتن مهمترین یادداشت روز
        const mostImportantNote = getMostImportantNoteForDate(dateString);
        if (mostImportantNote) {
          bgColor = getBackgroundColorFromImportance(mostImportantNote.importance);
          textColor = getTextColorFromImportance(mostImportantNote.importance);
          borderColor = getColorForStyle(mostImportantNote.importance);
        }
      }

      days.push(
        <div
          key={day}
          className={`
            relative h-10 w-full border border-gray-200 p-1 cursor-pointer
            hover:bg-blue-50 transition-colors rounded-lg
            ${isTodayDate ? 'bg-blue-100 border-blue-400' : ''}
            ${hasNotes ? bgColor + ' border-2' : ''}
          `}
          style={{ borderColor: hasNotes ? borderColor : '' }}
          onClick={() => {
            if (calendarView === "persian") {
              const gregorianDate = jalaali.toGregorian(year, month, day);
              const date = new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd);
              setSelectedDate(date);
            } else {
              const date = new Date(year, month - 1, day);
              setSelectedDate(date);
            }
            
            // اگر روز دارای یادداشت است، دیالوگ لیست یادداشت‌ها را نمایش می‌دهیم
            if (hasNotes && dayNotes.length > 0) {
              setSelectedDateNotes(dayNotes);
              setIsNotesListDialogOpen(true);
            } else {
              // در غیر این صورت، دیالوگ افزودن یادداشت جدید را نمایش می‌دهیم
              setEditingNote(null);
              setNoteForm({
                title: "",
                content: "",
                importance: 50,
              });
              setIsDialogOpen(true);
            }
          }}
        >
          <div className="flex justify-center items-center h-full">
            <span className={`${isTodayDate ? 'font-bold text-blue-700' : hasNotes ? textColor + ' font-medium' : ''}`}>
              {calendarView === "persian" ? toPersianNumber(day) : day}
            </span>
          </div>
          {hasNotes && dayNotes.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
              {dayNotes.slice(0, 3).map((note, idx) => (
                <div 
                  key={idx} 
                  className="w-1.5 h-1.5 rounded-full inline-block mr-1"
                  style={{ backgroundColor: getColorForStyle(note.importance) }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  }, [getMonthDays, getCurrentCalendarInfo, calendarView, getNotesForDate, isToday, generateDateString, getMostImportantNoteForDate]);

  // تعویض ماه
  const changeMonth = useCallback((direction: "prev" | "next") => {
    const { year, month } = getCurrentCalendarInfo();
    let newYear = year;
    let newMonth = month;

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    if (calendarView === "persian") {
      const gregorianDate = jalaali.toGregorian(newYear, newMonth, 1);
      setCurrentDate(new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd));
    } else {
      setCurrentDate(new Date(newYear, newMonth - 1, 1));
    }
  }, [getCurrentCalendarInfo, calendarView]);

  // رفتن به امروز
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // افزودن یادداشت جدید
  const handleAddNewNote = useCallback(() => {
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      importance: 50,
    });
    setIsDialogOpen(true);
  }, []);

  // ذخیره یادداشت
  const handleSaveNote = useCallback(() => {
    if (!selectedDate || !noteForm.title) return;

    const dateString = selectedDate.toISOString().split('T')[0];
    
    if (editingNote) {
      // ویرایش یادداشت موجود
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === editingNote.id 
            ? { ...note, ...noteForm, date: dateString }
            : note
        )
      );
    } else {
      // افزودن یادداشت جدید
      const newNote: Note = {
        id: Date.now().toString(),
        date: dateString,
        title: noteForm.title,
        content: noteForm.content,
        importance: noteForm.importance,
      };
      setNotes(prevNotes => [...prevNotes, newNote]);
      
      // به‌روزرسانی لیست یادداشت‌های تاریخ انتخاب شده
      if (isNotesListDialogOpen) {
        setSelectedDateNotes(prevNotes => [...prevNotes, newNote]);
      }
    }

    // ریست فرم
    setNoteForm({ title: "", content: "", importance: 50 });
    setEditingNote(null);
    setIsDialogOpen(false);
  }, [selectedDate, noteForm, editingNote, isNotesListDialogOpen]);

  // حذف یادداشت
  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    
    // بروزرسانی لیست یادداشت‌های انتخاب شده
    setSelectedDateNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    
    if (editingNote?.id === noteId) {
      setEditingNote(null);
      setNoteForm({ title: "", content: "", importance: 50 });
      setIsDialogOpen(false);
    }
  }, [editingNote]);

  // ویرایش یادداشت
  const handleEditNote = useCallback((note: Note) => {
    // تنظیم تاریخ انتخاب شده براساس تاریخ یادداشت
    const [year, month, day] = note.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    
    // تنظیم یادداشت برای ویرایش
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      importance: note.importance,
    });
    
    // باز کردن دیالوگ
    setIsDialogOpen(true);
  }, []);

  // نمایش تاریخ میلادی برای یادداشت شمسی
  const getDisplayDate = useCallback((dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    
    if (calendarView === "persian") {
      const gregorianDate = new Date(year, month - 1, day);
      const persianDate = jalaali.toJalaali(
        gregorianDate.getFullYear(),
        gregorianDate.getMonth() + 1,
        gregorianDate.getDate()
      );
      return `${toPersianNumber(persianDate.jd)} ${persianMonths[persianDate.jm - 1]} ${toPersianNumber(persianDate.jy)}`;
    } else {
      const gregorianDate = new Date(year, month - 1, day);
      return gregorianDate.toLocaleDateString('fa-IR');
    }
  }, [calendarView]);

  const { year, month } = getCurrentCalendarInfo();
  const monthName = calendarView === "persian" ? persianMonths[month - 1] : gregorianMonths[month - 1];
  const yearText = calendarView === "persian" ? toPersianNumber(year) : year.toString();
  
  // یادداشت‌های ماه جاری (مرتب شده بر اساس تاریخ و اهمیت)
  const currentMonthNotes = getNotesForCurrentMonth();

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            تقویم
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              امروز
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarView(calendarView === "persian" ? "gregorian" : "persian")}
              className="flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              {calendarView === "persian" ? "میلادی" : "شمسی"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => changeMonth("prev")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold">
              {calendarView === "persian" ? `${monthName} ${yearText}` : `${monthName} ${yearText}`}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => changeMonth("next")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(calendarView === "persian" ? persianWeekDays : gregorianWeekDays).map((day, idx) => (
              <div key={idx} className="text-center font-medium text-gray-600 h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </CardContent>
      </Card>

      {/* دفترچه یادداشت */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            یادداشت‌های {monthName} {yearText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentMonthNotes.length === 0 ? (
              <p className="text-center text-gray-500 py-4">هیچ یادداشتی برای این ماه وجود ندارد</p>
            ) : (
              currentMonthNotes.map(note => {
                const importanceColor = getColorFromImportance(note.importance);
                return (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{note.title}</span>
                        <Badge className={importanceColor}>
                          {getImportanceLabel(note.importance)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{note.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getDisplayDate(note.date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* دیالوگ یادداشت‌های یک روز */}
      <Dialog open={isNotesListDialogOpen} onOpenChange={setIsNotesListDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              یادداشت‌های {selectedDate ? getDisplayDate(selectedDate.toISOString().split('T')[0]) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {selectedDateNotes.map(note => {
              const importanceColor = getColorFromImportance(note.importance);
              return (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.title}</span>
                      <Badge className={importanceColor}>
                        {getImportanceLabel(note.importance)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{note.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsNotesListDialogOpen(false)}
            >
              بستن
            </Button>
            <Button onClick={handleAddNewNote}>
              افزودن یادداشت جدید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ افزودن/ویرایش یادداشت */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "ویرایش یادداشت" : "افزودن یادداشت"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">عنوان</label>
              <Input
                value={noteForm.title}
                onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان یادداشت"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="توضیحات"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">میزان اهمیت</label>
              <ColorSlider 
                value={noteForm.importance}
                onChange={(value) => setNoteForm(prev => ({ ...prev, importance: value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                // پاک کردن فرم
                if (!editingNote) {
                  setNoteForm({ title: "", content: "", importance: 50 });
                }
              }}
            >
              لغو
            </Button>
            <Button onClick={handleSaveNote}>
              ذخیره
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersianCalendarWithNotes;