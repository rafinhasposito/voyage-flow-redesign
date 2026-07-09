import React from "react";
import { AlertCircle } from "lucide-react";

interface ExperienceWarningProps {
  warnings: string[];
  className?: string;
}

export function ExperienceWarning({ warnings, className = "" }: ExperienceWarningProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 pt-1 ${className}`}>
      {warnings.map((warning, idx) => (
        <div
          key={idx}
          className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-medium"
        >
          <AlertCircle className="h-2.5 w-2.5 text-amber-500 shrink-0" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}
