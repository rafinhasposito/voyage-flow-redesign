import React from "react";
import { AlertCircle, Ban } from "lucide-react";

interface ExperienceWarningProps {
  warnings: string[];
  className?: string;
  isBlocker?: boolean;
}

export function ExperienceWarning({ warnings, className = "", isBlocker = false }: ExperienceWarningProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 pt-1 ${className}`}>
      {warnings.map((warning, idx) => (
        <div
          key={idx}
          className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[9px] font-medium ${
            isBlocker
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isBlocker ? (
            <Ban className="h-2.5 w-2.5 text-red-500 shrink-0" />
          ) : (
            <AlertCircle className="h-2.5 w-2.5 text-amber-500 shrink-0" />
          )}
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}
