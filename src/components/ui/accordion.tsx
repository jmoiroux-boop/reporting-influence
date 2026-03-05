"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-seb-cream/50 transition-colors"
      >
        <div className="text-left">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {subtitle && (
            <p className="text-xs text-seb-gray mt-0.5">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-seb-gray transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5 pt-1 border-t border-border">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
