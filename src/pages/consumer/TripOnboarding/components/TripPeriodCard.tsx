import React, { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '../../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';
import { DateRange } from 'react-day-picker';

interface TripPeriodCardProps {
  startDate: string;
  endDate: string;
  destinationName: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  calculatedNights: number | null;
}

export default function TripPeriodCard({ 
  startDate, 
  endDate, 
  destinationName, 
  onStartDateChange, 
  onEndDateChange, 
  calculatedNights 
}: TripPeriodCardProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  // Sync internal state with external props
  useEffect(() => {
    let from: Date | undefined;
    let to: Date | undefined;
    if (startDate) {
      const [year, month, day] = startDate.split('T')[0].split('-');
      from = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
    }
    if (endDate) {
      const [year, month, day] = endDate.split('T')[0].split('-');
      to = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
    }
    setDate({ from, to });
  }, [startDate, endDate]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from) {
      onStartDateChange(format(range.from, 'yyyy-MM-dd'));
    } else {
      onStartDateChange('');
    }
    if (range?.to) {
      onEndDateChange(format(range.to, 'yyyy-MM-dd'));
    } else {
      onEndDateChange('');
    }
  };

  const applyShortcut = (nights: number) => {
    if (!startDate) {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      onStartDateChange(todayStr);
      onEndDateChange(format(addDays(today, nights), 'yyyy-MM-dd'));
      return;
    }
    const sDate = new Date(startDate);
    const newEnd = new Date(Date.UTC(sDate.getFullYear(), sDate.getMonth(), sDate.getDate() + nights));
    onEndDateChange(newEnd.toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Selecionar';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      if (!year || !month || !day) return 'Data inválida';
      const localDate = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
      return format(localDate, "dd MMM yyyy", { locale: ptBR }).toUpperCase();
    } catch {
      return 'Data inválida';
    }
  };

  const formatDisplayDay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      if (!year || !month || !day) return '';
      const localDate = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
      return format(localDate, "EEEE", { locale: ptBR }).toUpperCase();
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full relative bg-[#fafafa] rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden group hover:border-[#D7F24B] transition-all text-left">
            
            {/* Ticket Cutouts */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-b-2 border-l-2 border-r-2 border-slate-200 group-hover:border-[#D7F24B] transition-colors z-10" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-white rounded-full border-t-2 border-l-2 border-r-2 border-slate-200 group-hover:border-[#D7F24B] transition-colors z-10" />

            <div className="flex flex-col md:flex-row relative z-0">
              
              {/* IDA */}
              <div className="flex-1 p-6 md:p-8 hover:bg-slate-50 transition-colors">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Ida</span>
                {formatDisplayDay(startDate) && (
                   <span className="block text-xs font-bold text-slate-500 mb-1">{formatDisplayDay(startDate)}</span>
                )}
                <div className={`font-extrabold text-2xl lg:text-3xl transition-colors ${startDate ? 'text-[#171717]' : 'text-slate-300'}`}>
                  {formatDisplayDate(startDate)}
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500 truncate">{destinationName || 'Origem'}</p>
              </div>

              {/* DIVIDER & BADGE */}
              <div className="relative md:w-px flex flex-col items-center justify-center py-4 md:py-0 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-slate-200">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-[#D7F24B] text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md whitespace-nowrap z-20">
                   <Plane className="w-3 h-3" />
                   {calculatedNights !== null 
                      ? `${calculatedNights} ${calculatedNights === 1 ? 'NOITE' : 'NOITES'}` 
                      : (startDate || endDate) ? 'PERÍODO' : ''}
                 </div>
              </div>

              {/* VOLTA */}
              <div className="flex-1 p-6 md:p-8 hover:bg-slate-50 transition-colors text-left md:text-right">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Volta</span>
                {formatDisplayDay(endDate) && (
                   <span className="block text-xs font-bold text-slate-500 mb-1">{formatDisplayDay(endDate)}</span>
                )}
                <div className={`font-extrabold text-2xl lg:text-3xl transition-colors ${endDate ? 'text-[#171717]' : 'text-slate-300'}`}>
                  {formatDisplayDate(endDate)}
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500 truncate">{destinationName || 'Destino'}</p>
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* ATALHOS */}
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {[3, 7, 10, 14].map(n => (
          <button
            key={n}
            onClick={() => applyShortcut(n)}
            className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-colors ${calculatedNights === n ? 'bg-slate-900 text-[#D7F24B] border-slate-900' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
          >
            +{n} noites
          </button>
        ))}
      </div>
    </div>
  );
}
