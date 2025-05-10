// components/custom/dependency-line.tsx
import React from 'react';
import { TimelineDependency, TimelineEvent, DependencyType } from './types';

interface DependencyLineProps {
  dependency: TimelineDependency;
  events: TimelineEvent[];
}

// رنگ خطوط وابستگی بر اساس نوع
const getDependencyColor = (type: DependencyType): string => {
  switch (type) {
    case 'finish-to-start':
      return '#2563eb'; // آبی
    case 'start-to-start':
      return '#16a34a'; // سبز
    case 'finish-to-finish':
      return '#9333ea'; // بنفش
    case 'start-to-finish':
      return '#dc2626'; // قرمز
    default:
      return '#6b7280'; // خاکستری
  }
};

export const DependencyLine: React.FC<DependencyLineProps> = ({ dependency, events }) => {
  const sourceEvent = events.find(e => e.id === dependency.sourceId);
  const targetEvent = events.find(e => e.id === dependency.targetId);
  
  if (!sourceEvent || !targetEvent) return null;
  
  // لازم است که موقعیت دقیق المان‌ها را در DOM پیدا کنیم
  // این کد در حالت واقعی باید از useEffect و useRef استفاده کند
  // اینجا فقط ظاهر خط را نشان می‌دهیم
  
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
      <path
        d={`M 0,0 C 50,0 50,50 100,50`} // این مسیر باید دینامیک باشد
        stroke={getDependencyColor(dependency.type)}
        strokeWidth={2}
        fill="none"
        strokeDasharray={dependency.type === 'start-to-finish' ? "5,5" : "none"}
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={getDependencyColor(dependency.type)}
          />
        </marker>
      </defs>
    </svg>
  );
};

export default DependencyLine;