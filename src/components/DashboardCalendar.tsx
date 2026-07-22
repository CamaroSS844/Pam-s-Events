/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Clock, ArrowRight, Sparkles, Users, ClipboardCheck, CheckCircle2 
} from 'lucide-react';
import { EventModel } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardCalendarProps {
  events: EventModel[];
  onSelectEvent: (eventId: string) => void;
}

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  events,
  onSelectEvent
}) => {
  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine starting month/year. Default to earliest event date if available, otherwise current date.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (sortedEvents.length > 0) {
      const firstEventDate = new Date(sortedEvents[0].date);
      if (!isNaN(firstEventDate.getTime())) {
        return firstEventDate;
      }
    }
    return new Date();
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (sortedEvents.length > 0) {
      const firstEventDate = new Date(sortedEvents[0].date);
      if (!isNaN(firstEventDate.getTime())) {
        return firstEventDate;
      }
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month-browsing navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate Calendar Days
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 6 is Saturday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Previous month filler days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: totalDaysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, totalDaysInPrevMonth - i),
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month filler days to align grid (total multiple of 7, standard 42 days)
  const totalGridCells = Math.ceil(days.length / 7) * 7;
  const remainingCells = totalGridCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  // Match events to a specific date
  const getEventsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return events.filter(e => e.date === dateStr);
  };

  // Check if two dates are the same day
  const isSameDay = (dateA: Date, dateB: Date) => {
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Filter events occurring in current viewed month for summary sidebar
  const currentMonthEvents = events.filter(evt => {
    const evtDate = new Date(evt.date);
    return evtDate.getFullYear() === year && evtDate.getMonth() === month;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-zinc-200 dark:border-stone-850 shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
      
      {/* 1. Calendar Header / Month Switcher */}
      <div className="p-5 border-b border-zinc-150 dark:border-stone-850 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-sans font-extrabold tracking-tight text-slate-800 dark:text-stone-100">
              {monthNames[month]} {year}
            </h4>
            <p className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-stone-500 uppercase">
              Schedule Overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-250 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-zinc-50 dark:hover:bg-stone-850 text-slate-700 dark:text-stone-300 transition-all shadow-sm"
          >
            Today
          </button>
          
          <div className="flex items-center border border-zinc-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-zinc-50 dark:hover:bg-stone-850 text-slate-500 dark:text-stone-400 transition-colors border-r border-zinc-150 dark:border-stone-850"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-zinc-50 dark:hover:bg-stone-850 text-slate-500 dark:text-stone-400 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Calendar Grid Container (Span 8) */}
        <div className="lg:col-span-8 p-5 border-r border-zinc-150 dark:border-stone-850">
          
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-2">
            {weekdayNames.map((name) => (
              <span 
                key={name} 
                className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-stone-500 uppercase py-1"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 bg-zinc-100 dark:bg-stone-850 p-1 rounded-2xl overflow-hidden">
            {days.map(({ day, isCurrentMonth, date }, index) => {
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const currentDayIsToday = isToday(date);

              return (
                <button
                  key={`${date.toISOString()}-${index}`}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    min-h-[72px] sm:min-h-[85px] p-2 flex flex-col justify-between text-left rounded-xl transition-all duration-150 relative outline-none group
                    ${isCurrentMonth 
                      ? 'bg-white dark:bg-stone-900 hover:bg-slate-50 dark:hover:bg-stone-850/80 text-slate-800 dark:text-stone-200' 
                      : 'bg-stone-50/50 dark:bg-stone-950/20 hover:bg-slate-50 dark:hover:bg-stone-850/30 text-slate-400 dark:text-stone-600'
                    }
                    ${isSelected 
                      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-stone-900 z-10 shadow-sm' 
                      : ''
                    }
                    ${currentDayIsToday 
                      ? 'bg-indigo-50/30 dark:bg-indigo-950/15' 
                      : ''
                    }
                  `}
                >
                  {/* Cell Top-Header: Day Number + Indicators */}
                  <div className="flex items-center justify-between w-full">
                    <span 
                      className={`
                        text-xs font-mono font-extrabold px-1.5 py-0.5 rounded-md transition-colors
                        ${currentDayIsToday 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-slate-700 dark:text-stone-300'
                        }
                        ${!isCurrentMonth ? '!text-slate-400 dark:!text-stone-600' : ''}
                      `}
                    >
                      {day}
                    </span>

                    {/* Quick status dot on mobile / small headers */}
                    {hasEvents && (
                      <div className="flex gap-0.5 sm:hidden">
                        {dayEvents.map((e, idx) => (
                          <span 
                            key={e.id || idx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              e.type === 'wedding' 
                                ? 'bg-rose-500' 
                                : 'bg-violet-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cell Content: Event Badges (shown only on medium+ screens) */}
                  <div className="hidden sm:flex flex-col gap-1 w-full mt-2 overflow-hidden">
                    {dayEvents.map((evt) => (
                      <div 
                        key={evt.id}
                        className={`
                          text-[9px] font-bold px-1.5 py-1 rounded-md truncate border leading-tight transition-all
                          ${evt.type === 'wedding' 
                            ? 'bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/45 hover:border-rose-300' 
                            : 'bg-violet-50/80 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900/45 hover:border-violet-300'
                          }
                        `}
                        title={`${evt.name} (${evt.time})`}
                      >
                        {evt.name}
                      </div>
                    ))}
                  </div>

                  {/* Decorative selection checkmark indicator for aesthetic finish */}
                  {isSelected && (
                    <div className="absolute right-1.5 bottom-1.5 text-indigo-600 dark:text-indigo-400 opacity-50 sm:opacity-100">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Date Agenda Pane (Span 4) */}
        <div className="lg:col-span-4 bg-stone-50/60 dark:bg-stone-950/40 p-5 flex flex-col justify-between border-t lg:border-t-0 border-zinc-150 dark:border-stone-850">
          
          <div className="space-y-5">
            {/* Active Selected Date Banner */}
            <div className="border-b border-zinc-200/80 dark:border-stone-800 pb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-stone-500 uppercase block">
                Agenda Detail
              </span>
              <h5 className="text-sm font-sans font-extrabold text-slate-800 dark:text-stone-200 mt-1">
                {selectedDate 
                  ? selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No Date Selected'
                }
              </h5>
            </div>

            {/* Event Cards rendering */}
            <AnimatePresence mode="wait">
              <div className="space-y-4">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((evt) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white dark:bg-stone-900 rounded-2xl border border-zinc-200 dark:border-stone-800 p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                      {/* Event Banner preview inside side panel */}
                      <div className="h-24 w-full rounded-xl overflow-hidden mb-3.5 relative bg-stone-100">
                        <img 
                          src={evt.coverImage} 
                          alt={evt.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className={`absolute top-2 right-2 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wider uppercase ${
                          evt.type === 'wedding'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                        }`}>
                          {evt.type}
                        </span>
                      </div>

                      <h6 className="text-xs font-sans font-bold text-slate-800 dark:text-stone-100 tracking-tight leading-snug line-clamp-2">
                        {evt.name}
                      </h6>

                      <div className="space-y-1.5 mt-3 text-[10px] font-semibold text-slate-500 dark:text-stone-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{evt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 truncate" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </div>

                      {/* Guest responses micro summaries */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-zinc-100 dark:border-stone-850 text-[10px] font-bold font-mono">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{evt.guestCount} invited</span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <ClipboardCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{evt.rsvpCount} RSVPs</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectEvent(evt.id)}
                        className="w-full mt-4 bg-stone-900 hover:bg-stone-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Manage Invitation Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center border border-dashed border-zinc-200 dark:border-stone-850 rounded-2xl flex flex-col items-center justify-center"
                  >
                    <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-stone-800 mb-2" />
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-stone-600">
                      No events registered on this day.
                    </span>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>

            {/* Mini Summary of current month's events */}
            {currentMonthEvents.length > 0 && (
              <div className="pt-4 border-t border-zinc-200/80 dark:border-stone-800">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 dark:text-stone-500 uppercase block mb-2.5">
                  Month's Events ({currentMonthEvents.length})
                </span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                  {currentMonthEvents.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedDate(new Date(evt.date))}
                      className="w-full flex items-center justify-between text-left p-2 rounded-xl hover:bg-white dark:hover:bg-stone-900 border border-transparent hover:border-zinc-150 dark:hover:border-stone-850 transition-all group"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-stone-300 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {evt.name}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-stone-500 mt-0.5 block">
                          {new Date(evt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} — {evt.time}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0 font-bold">
                        View &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick tips label at bottom */}
          <div className="mt-6 pt-3 border-t border-zinc-200/60 dark:border-stone-800/60 text-[10px] text-zinc-400 dark:text-stone-500 leading-normal flex items-start gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <span>Click any calendar date cell to display the registered wedding or party itinerary detail immediately.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
