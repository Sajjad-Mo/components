// components/custom/timeline-item.tsx
import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Image, AlertCircle, Clock, Users, Flag } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimelineEvent, TimelineItemProps, TimelineDependency } from './types';

const statusConfig = {
  completed: { color: "bg-green-100 text-green-800 hover:bg-green-200", icon: "✅", label: "انجام شده" },
  ongoing: { color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", icon: "🔄", label: "در حال انجام" },
  planned: { color: "bg-gray-100 text-gray-800 hover:bg-gray-200", icon: "🕒", label: "برنامه‌ریزی شده" },
};

const priorityConfig = {
  high: { color: "bg-red-100 text-red-800", icon: <Flag className="h-3 w-3" />, label: "بالا" },
  medium: { color: "bg-orange-100 text-orange-800", icon: <Flag className="h-3 w-3" />, label: "متوسط" },
  low: { color: "bg-blue-100 text-blue-800", icon: <Flag className="h-3 w-3" />, label: "پایین" },
};

export const TimelineItem: React.FC<TimelineItemProps> = ({ 
  event, 
  isLast, 
  dependencies,
  allEvents,
  draggable,
  onEventChange,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = statusConfig[event.status];
  const cardRef = useRef<HTMLDivElement>(null);

  // وابستگی‌های مربوط به این رویداد
  const relatedDependencies = dependencies?.filter(
    d => d.sourceId === event.id || d.targetId === event.id
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // ایجاد توضیحات وابستگی
  const getDependencyDescription = (dependency: TimelineDependency) => {
    const otherEventId = dependency.sourceId === event.id 
      ? dependency.targetId 
      : dependency.sourceId;
    
    const otherEvent = allEvents?.find(e => e.id === otherEventId);
    if (!otherEvent) return '';
    
    const isSource = dependency.sourceId === event.id;
    
    switch (dependency.type) {
      case 'finish-to-start':
        return isSource 
          ? `پس از پایان، "${otherEvent.title}" شروع می‌شود` 
          : `پس از پایان "${otherEvent.title}" شروع می‌شود`;
      case 'start-to-start':
        return isSource 
          ? `همزمان با شروع، "${otherEvent.title}" نیز شروع می‌شود` 
          : `همزمان با شروع "${otherEvent.title}" شروع می‌شود`;
      case 'finish-to-finish':
        return isSource 
          ? `همزمان با پایان، "${otherEvent.title}" نیز پایان می‌یابد` 
          : `همزمان با پایان "${otherEvent.title}" پایان می‌یابد`;
      case 'start-to-finish':
        return isSource 
          ? `پس از شروع، "${otherEvent.title}" پایان می‌یابد` 
          : `پس از شروع "${otherEvent.title}" پایان می‌یابد`;
      default:
        return '';
    }
  };

  // محاسبه زمان باقی‌مانده تا یادآوری
  const getReminderText = () => {
    if (!event.reminderDate) return '';
    
    const now = new Date();
    const reminderDate = new Date(event.reminderDate.split('/').reverse().join('-'));
    
    const diffDays = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'یادآوری گذشته';
    } else if (diffDays === 0) {
      return 'یادآوری امروز';
    } else if (diffDays === 1) {
      return 'یادآوری فردا';
    } else {
      return `یادآوری در ${diffDays} روز دیگر`;
    }
  };

  // برای Drag & Drop
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.setData('text/plain', event.id);
    if (onDragStart) onDragStart(event.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    if (onDragOver) onDragOver(event.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId !== event.id && onDrop) {
      onDrop(event.id);
    }
  };

  return (
    <div 
      className={cn("relative pr-10 pb-8", isLast ? "" : "before:absolute before:right-4 before:top-10 before:h-full before:w-px before:bg-gray-200")}
      ref={cardRef}
    >
      <div className="absolute right-0 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
        <span>{statusInfo.icon}</span>
      </div>

      <Card 
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          draggable ? "cursor-move" : ""
        )}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("font-normal", statusInfo.color)}>
              {statusInfo.label}
            </Badge>
            <div className="flex items-center gap-2">
              {event.priority && (
                <Badge variant="outline" className={cn("font-normal text-xs", priorityConfig[event.priority].color)}>
                  <span className="flex items-center gap-1">
                    {priorityConfig[event.priority].icon}
                    {priorityConfig[event.priority].label}
                  </span>
                </Badge>
              )}
              <span className="text-sm text-gray-500 font-vazirmatn">{event.date}</span>
            </div>
          </div>
          <CardTitle className="mt-2 text-base md:text-lg">{event.title}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
          
          {/* نمایش اطلاعات تکمیلی در بالای کارت */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
            {event.owner && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{event.owner}</span>
              </div>
            )}
            
            {event.reminderDate && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{getReminderText()}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 text-xs">
                  <div>یادآوری: {event.reminderDate}</div>
                </PopoverContent>
              </Popover>
            )}
            
            {event.startDate && event.endDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>از {event.startDate} تا {event.endDate}</span>
              </div>
            )}
          </div>
        </CardHeader>

        {(event.details || (event.attachments && event.attachments.length > 0) || 
         (relatedDependencies && relatedDependencies.length > 0)) && (
          <Button
            variant="ghost"
            size="sm"
            className="mx-auto mb-1 flex items-center text-xs text-gray-500"
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 ml-1" />
                <span>بستن جزئیات</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 ml-1" />
                <span>مشاهده جزئیات</span>
              </>
            )}
          </Button>
        )}

        {isExpanded && (
          <CardContent className="pb-2 pt-0 px-4 bg-gray-50 rounded-md mx-4 mb-4">
            {event.details && <p className="text-sm text-gray-700 mb-2">{event.details}</p>}

            {relatedDependencies && relatedDependencies.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <h4 className="text-xs font-medium text-gray-700 mb-1">وابستگی‌ها:</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  {relatedDependencies.map(dependency => (
                    <li key={dependency.id} className="flex items-start">
                      <span className="ml-1 text-primary">•</span>
                      {getDependencyDescription(dependency)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.attachments && event.attachments.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <h4 className="text-xs font-medium text-gray-700 mb-1">پیوست‌ها:</h4>
                <div className="space-y-1">
                  {event.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-primary hover:underline"
                    >
                      {attachment.type === 'link' && <ExternalLink className="h-3 w-3 ml-1" />}
                      {attachment.type === 'file' && <FileText className="h-3 w-3 ml-1" />}
                      {attachment.type === 'image' && <Image className="h-3 w-3 ml-1" />}
                      {attachment.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}

        <CardFooter className="pt-2 pb-4">
          {event.progress !== undefined ? (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>پیشرفت</span>
                <span>{event.progress}%</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${event.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  event.status === "completed" ? "bg-green-500 w-full" : 
                  event.status === "ongoing" ? "bg-yellow-500 w-1/2" : 
                  "bg-gray-300 w-0"
                )} 
              />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TimelineItem;