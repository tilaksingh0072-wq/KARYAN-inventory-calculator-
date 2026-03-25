import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface WheelPickerProps {
  items: { label: string; value: any }[];
  value: any;
  onChange: (value: any) => void;
  height?: number;
  itemHeight?: number;
}

export function WheelPicker({
  items,
  value,
  onChange,
  height = 200,
  itemHeight = 40,
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const selectedIndex = items.findIndex((item) => item.value === value);

  // Initialize scroll position
  useEffect(() => {
    if (containerRef.current && selectedIndex !== -1) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Snap to nearest item when scrolling stops
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const onScrollEnd = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const index = Math.round(container.scrollTop / itemHeight);
        if (items[index] && items[index].value !== value) {
          onChange(items[index].value);
        }
      }, 150);
    };

    container.addEventListener("scroll", onScrollEnd);
    return () => {
      container.removeEventListener("scroll", onScrollEnd);
      clearTimeout(timeoutId);
    };
  }, [itemHeight, items, onChange, value]);

  const centerOffset = height / 2 - itemHeight / 2;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200 shadow-inner"
      style={{ height }}
    >
      {/* Selection Highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none border-y border-slate-300/50 bg-slate-200/50"
        style={{
          top: centerOffset,
          height: itemHeight,
        }}
      />

      {/* Fade Gradients */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
        style={{
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
        }}
      >
        {items.map((item, i) => {
          const itemCenter = i * itemHeight;
          const distance = Math.abs(scrollTop - itemCenter);
          const maxDistance = height / 2;
          const ratio = Math.min(distance / maxDistance, 1);
          
          // Calculate 3D rotation and opacity
          const rotateX = ((itemCenter - scrollTop) / maxDistance) * -60;
          const opacity = 1 - ratio * 0.6;
          const scale = 1 - ratio * 0.1;

          return (
            <div
              key={item.value}
              className="flex items-center justify-center snap-center cursor-pointer"
              style={{ height: itemHeight }}
              onClick={() => {
                containerRef.current?.scrollTo({
                  top: i * itemHeight,
                  behavior: "smooth",
                });
                onChange(item.value);
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  rotateX,
                  opacity,
                  scale,
                  y: rotateX * 0.2, // Slight vertical shift for depth
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "text-lg font-medium transition-colors duration-200",
                  value === item.value ? "text-slate-900" : "text-slate-400"
                )}
                style={{ transformOrigin: "center center -50px" }}
              >
                {item.label}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
