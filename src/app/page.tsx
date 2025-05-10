// app/page.tsx
"use client";

import React, { useState } from "react";
import BusinessActivityChart from "@/components/custom/BusinessActivityChart";
import BusinessSectionsChart from "@/components/custom/BusinessSectionsChart";
import PersianCalendarWithNotes from "@/components/custom/PersianCalendarWithNotes";
import CollapsibleCard from "@/components/custom/CollapsibleCard";
import { TimelineCalendarIntegration } from "@/components/custom";
import { TimelineEvent, TimelineDependency } from "@/components/custom/types";

interface CalendarNote {
  id: string;
  date: string;
  title: string;
  content: string;
  type: string;
}

export default function Home() {
  // داده‌های خالی برای کامپوننت تایم‌لاین
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [dependencies, setDependencies] = useState<TimelineDependency[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);

  return (
    <main className="container mx-auto py-8 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">داشبورد کسب و کار</h1>
      
      <div className="space-y-8">
        {/* کامپوننت بالا - وسط چین شده */}
        <section className="flex justify-center">
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 text-center">تقویم و یادداشت‌ها</h2>
            <CollapsibleCard defaultCollapsed={true}>
              <PersianCalendarWithNotes />
            </CollapsibleCard>
          </div>
        </section>

        {/* دو کامپوننت پایین - کنار هم */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* بخش دوم: نمودار بخش‌های کسب و کار */}
          <div>
            <h2 className="text-2xl font-bold mb-4">بخش‌های کسب و کار</h2>
            <CollapsibleCard defaultCollapsed={true}>
              <BusinessSectionsChart />
            </CollapsibleCard>
          </div>

          {/* بخش سوم: نمودار آمار فعالیت‌ها */}
          <div>
            <h2 className="text-2xl font-bold mb-4">نمودار آمار فعالیت‌های کسب و کار</h2>
            <CollapsibleCard defaultCollapsed={true}>
              <BusinessActivityChart />
            </CollapsibleCard>
          </div>
        </section>
        
        {/* کامپوننت نقشه راه توسعه کسب و کار */}
        <section className="flex justify-center">
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-4">نقشه راه توسعه کسب و کار</h2>
            <CollapsibleCard defaultCollapsed={false}>
              <TimelineCalendarIntegration
                timelineEvents={timelineEvents}
                dependencies={dependencies}
                onTimelineEventsChange={setTimelineEvents}
                onDependenciesChange={setDependencies}
                calendarNotes={calendarNotes}
                onCalendarNotesChange={setCalendarNotes}
                showAnalytics={true}
                draggable={true}
                defaultTab="timeline"
              />
            </CollapsibleCard>
          </div>
        </section>
      </div>
    </main>
  );
}