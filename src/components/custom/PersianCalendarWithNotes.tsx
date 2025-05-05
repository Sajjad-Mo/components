// components/custom/PersianCalendarWithNotes.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import jalaali from "jalaali-js";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  Plus, 
  Trash2,
  Languages 
} from "lucide-react";

// انواع یادداشت‌ها برای رنگ‌بندی متفاوت
const NOTE_TYPES = [
  { id: "meeting", label: "جلسه", color: "bg-blue-100 text-blue-800 border-blue-400" },
  { id: "task", label: "وظیفه", color: "bg-green-100 text-green-800 border-green-400" },
  { id: "deadline", label: "مهلت", color: "bg-red-100 text-red-800 border-red-400" },
  { id: "event", label: "رویداد", color: "bg-purple-100 text-purple-800 border-purple-400" },
  { id: "reminder", label: "یادآوری", color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
];

// نوع یادداشت
interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  type: string;
}

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

// روزهای هفته شمسی
const persianWeekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// روزهای هفته میلادی
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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    type: "task",
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

  // دریافت روزهای ماه
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
      firstDayOfMonth = firstDayJsDate.getDay();
    } else {
      const firstDayJsDate = new Date(year, month - 1, 1);
      daysInMonth = new Date(year, month, 0).getDate();
      firstDayOfMonth = firstDayJsDate.getDay();
    }

    return { daysInMonth, firstDayOfMonth };
  }, [calendarView, getCurrentCalendarInfo]);

  // بررسی وجود یادداشت در یک تاریخ خاص
  const getNotesForDate = useCallback((date: string): Note[] => {
    return notes.filter(note => note.date === date);
  }, [notes]);

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

      days.push(
        <div
          key={day}
          className={`
            relative h-10 w-full border border-gray-200 p-1 cursor-pointer
            hover:bg-blue-50 transition-colors rounded-lg
            ${isTodayDate ? 'bg-blue-100 border-blue-400' : ''}
            ${hasNotes ? 'bg-red-50' : ''}
          `}
          onClick={() => {
            if (calendarView === "persian") {
              const gregorianDate = jalaali.toGregorian(year, month, day);
              const date = new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd);
              setSelectedDate(date);
            } else {
              const date = new Date(year, month - 1, day);
              setSelectedDate(date);
            }
            setIsDialogOpen(true);
          }}
        >
          <div className="flex justify-center items-center h-full">
            <span className={`${isTodayDate ? 'font-bold text-blue-700' : ''}`}>
              {calendarView === "persian" ? toPersianNumber(day) : day}
            </span>
          </div>
          {hasNotes && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
              {dayNotes.slice(0, 3).map((note, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${
                    NOTE_TYPES.find(t => t.id === note.type)?.color.split(' ')[0] || 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  }, [getMonthDays, getCurrentCalendarInfo, calendarView, getNotesForDate, isToday, generateDateString]);

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
        type: noteForm.type,
      };
      setNotes(prevNotes => [...prevNotes, newNote]);
    }

    // ریست فرم
    setNoteForm({ title: "", content: "", type: "task" });
    setEditingNote(null);
    setIsDialogOpen(false);
  }, [selectedDate, noteForm, editingNote]);

  // حذف یادداشت
  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    if (editingNote?.id === noteId) {
      setEditingNote(null);
      setNoteForm({ title: "", content: "", type: "task" });
    }
  }, [editingNote]);

  // ویرایش یادداشت
  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      type: note.type,
    });
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
            یادداشت‌های من
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-center text-gray-500 py-4">هیچ یادداشتی وجود ندارد</p>
            ) : (
              notes.slice().reverse().map(note => {
                const noteType = NOTE_TYPES.find(t => t.id === note.type);
                return (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{note.title}</span>
                        <Badge className={noteType?.color}>
                          {noteType?.label}
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
              <label className="text-sm font-medium">نوع</label>
              <Select
                value={noteForm.type}
                onValueChange={(value) => setNoteForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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