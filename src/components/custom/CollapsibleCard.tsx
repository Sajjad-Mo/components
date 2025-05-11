// components/custom/CollapsibleCard.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleCardProps {
  title?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  defaultCollapsed = true,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <Card 
        className={`
          transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
          ${isExpanded 
            ? 'scale-100 opacity-100 shadow-lg' 
            : isHovered 
              ? 'scale-95 opacity-90 shadow-md' 
              : 'scale-70 opacity-40 shadow'
          }
        `}
        style={{
          transformOrigin: 'center',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !isExpanded && handleToggle()}
      >
        {/* دکمه گسترش/جمع کردن در گوشه */}
        {!isExpanded && (
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* دکمه بستن در حالت گسترش */}
        {isExpanded && (
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* محتوای کامپوننت */}
        <div className={`${!isExpanded ? 'pointer-events-none' : ''}`}>
          {children}
        </div>
      </Card>

      {/* راهنما در حالت hover */}
      {!isExpanded && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-white px-4 py-2 rounded-lg opacity-80">
            کلیک کنید برای بزرگ کردن
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleCard;
