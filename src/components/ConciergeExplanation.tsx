import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface ConciergeExplanationProps {
  justification: string;
  reasons?: string[];
  className?: string;
}

export function ConciergeExplanation({ justification, reasons = [], className = "" }: ConciergeExplanationProps) {
  if (!justification) return null;

  return (
    <div className={`bg-[#FDFCFB] border-l-2 border-[#C5A85C] p-4 rounded-r-2xl space-y-2 mt-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] ${className}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C]">
        <Sparkles className="h-3 w-3" />
        <span>Curadoria Concierge</span>
      </div>
      
      <p className="text-xs italic text-slate-600 font-serif leading-relaxed">
        "{justification}"
      </p>

      {reasons && reasons.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 text-[9px] text-slate-400 font-medium border-t border-[#F5EFE6]">
          {reasons.slice(0, 3).map((reason, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-[#C5A85C] shrink-0" />
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
