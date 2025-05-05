// app/page.tsx
"use client";

import React from "react";
import BusinessActivityChart from "@/components/custom/BusinessActivityChart";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">تست نمودار تک تک</h1>
      <div>
        <h2 className="text-xl font-bold mb-4">نمودار آمار فعالیت‌های کسب و کار</h2>
        <BusinessActivityChart />
      </div>
    </main>
  );
}