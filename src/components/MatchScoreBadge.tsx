import React from "react";
import { Sparkles } from "lucide-react";

interface MatchScoreBadgeProps {
  score: number; // 0 - 1000 or -10000 / 10000
  label?: string;
  className?: string;
}

export function MatchScoreBadge({ score, label, className = "" }: MatchScoreBadgeProps) {
  if (score <= -9000) return null; // Safety override for swiped left (should be filtered anyway)
  
  const displayScore = score >= 10000 ? 100 : Math.max(0, Math.min(100, Math.round(score / 10)));
  const isHigh = displayScore >= 85;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm transition-all border ${
        isHigh
          ? "bg-[#FAF5E6] text-[#B08F26] border-[#EADFBF]"
          : "bg-slate-50 text-slate-600 border-slate-200"
      } ${className}`}
    >
      <Sparkles className={`h-3 w-3 ${isHigh ? "text-[#C5A85C]" : "text-slate-400"}`} />
      <span>{label ? `${label}: ` : ""}{displayScore}% Match</span>
    </div>
  );
}
