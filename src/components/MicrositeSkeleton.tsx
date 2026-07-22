/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, Heart, Users, MessageSquare } from 'lucide-react';

export const MicrositeSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-between selection:bg-stone-900 selection:text-white transition-all duration-300">
      
      {/* 1. Header Bar Shimmer */}
      <div className="sticky top-0 z-30 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-b border-zinc-150 dark:border-stone-850 py-3.5 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-200 dark:text-rose-950 animate-pulse" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-stone-800 rounded-md animate-pulse" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-16 bg-zinc-150 dark:bg-stone-850 rounded-md animate-pulse hidden sm:inline-block" />
            <div className="h-7 w-28 bg-zinc-250 dark:bg-stone-800 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. Main Body Content Mimicking the Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Hero Section Placeholder */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm p-6 md:p-12 flex flex-col items-center justify-center text-center min-h-[350px] md:min-h-[420px] transition-all">
          {/* Decorative floating shapes */}
          <div className="absolute top-8 left-8 w-12 h-12 rounded-full border border-dashed border-zinc-200 dark:border-stone-800 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border border-dashed border-zinc-150 dark:border-stone-800 animate-spin" style={{ animationDuration: '30s' }} />
          
          <div className="max-w-2xl flex flex-col items-center gap-4 w-full">
            {/* Wedding Icon/Badge Group */}
            <div className="flex items-center gap-2 mb-2 animate-pulse">
              <div className="h-6 w-24 bg-amber-100 dark:bg-amber-950/30 rounded-full" />
              <div className="h-6 w-16 bg-zinc-100 dark:bg-stone-850 rounded-full" />
            </div>

            {/* Event Name Shimmer */}
            <div className="h-10 w-3/4 bg-zinc-200 dark:bg-stone-850 rounded-2xl animate-pulse" />
            <div className="h-5 w-1/2 bg-zinc-150 dark:bg-stone-850/80 rounded-xl animate-pulse mt-1" />

            {/* Countdown / Meta Shimmer */}
            <div className="mt-6 flex gap-3 flex-wrap justify-center w-full max-w-sm">
              <div className="h-14 flex-1 min-w-[70px] bg-zinc-100 dark:bg-stone-850 rounded-xl animate-pulse" />
              <div className="h-14 flex-1 min-w-[70px] bg-zinc-100 dark:bg-stone-850 rounded-xl animate-pulse" />
              <div className="h-14 flex-1 min-w-[70px] bg-zinc-100 dark:bg-stone-850 rounded-xl animate-pulse" />
              <div className="h-14 flex-1 min-w-[70px] bg-zinc-100 dark:bg-stone-850 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Info Grid (Mimicking typical 3-card meta layout: Date, Location, Time) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <div className="p-3 bg-zinc-100 dark:bg-stone-850 rounded-xl shrink-0 text-zinc-300 dark:text-stone-700">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col gap-2 mt-1">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-stone-850 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-zinc-150 dark:bg-stone-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-100 dark:bg-stone-850 rounded animate-pulse" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <div className="p-3 bg-zinc-100 dark:bg-stone-850 rounded-xl shrink-0 text-zinc-300 dark:text-stone-700">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col gap-2 mt-1">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-stone-850 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-zinc-150 dark:bg-stone-800 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-100 dark:bg-stone-850 rounded animate-pulse" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <div className="p-3 bg-zinc-100 dark:bg-stone-850 rounded-xl shrink-0 text-zinc-300 dark:text-stone-700">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col gap-2 mt-1">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-stone-850 rounded animate-pulse" />
              <div className="h-5 w-5/6 bg-zinc-150 dark:bg-stone-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-100 dark:bg-stone-850 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Detailed Layout Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column A: Interactive RSVP / Registry Planners (Left Column - Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* RSVP Form Card Shimmer */}
            <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-6 bg-indigo-600 rounded-md" />
                <div className="h-5 w-44 bg-zinc-200 dark:bg-stone-850 rounded-md animate-pulse" />
              </div>

              {/* Status selectors */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-12 bg-zinc-100 dark:bg-stone-850 rounded-xl border border-dashed border-zinc-200 dark:border-stone-800 animate-pulse" />
                <div className="h-12 bg-zinc-100 dark:bg-stone-850 rounded-xl border border-dashed border-zinc-200 dark:border-stone-800 animate-pulse" />
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-24 bg-zinc-150 dark:bg-stone-850 rounded animate-pulse" />
                  <div className="h-11 bg-zinc-100 dark:bg-stone-850/50 rounded-xl border border-zinc-200 dark:border-stone-850 animate-pulse" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-32 bg-zinc-150 dark:bg-stone-850 rounded animate-pulse" />
                  <div className="h-24 bg-zinc-100 dark:bg-stone-850/50 rounded-xl border border-zinc-200 dark:border-stone-850 animate-pulse" />
                </div>

                <div className="h-11 bg-indigo-600/10 dark:bg-indigo-950/25 border border-indigo-600/10 rounded-xl w-full animate-pulse mt-4" />
              </div>
            </div>

            {/* Timeline / Celebration Schedule */}
            <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-indigo-600 rounded-md" />
                  <div className="h-5 w-40 bg-zinc-200 dark:bg-stone-850 rounded-md animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-zinc-100 dark:bg-stone-850 rounded-full animate-pulse" />
              </div>

              {/* Shimmer timeline items */}
              <div className="relative pl-6 border-l-2 border-zinc-150 dark:border-stone-850 space-y-8 ml-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative">
                    {/* Circle bullet */}
                    <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-stone-900 bg-zinc-200 dark:bg-stone-850 animate-pulse" />
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4.5 w-16 bg-amber-100 dark:bg-amber-950/20 rounded-md animate-pulse" />
                        <div className="h-5 w-44 bg-zinc-250 dark:bg-stone-800 rounded-md animate-pulse" />
                      </div>
                      <div className="h-3.5 w-5/6 bg-zinc-150 dark:bg-stone-850/80 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column B: Guestbook List (Right Column - Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            {/* Guestbook / Message Registry Shimmer */}
            <div className="bg-white dark:bg-stone-900 border border-zinc-200 dark:border-stone-850 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-zinc-300 dark:text-stone-700 animate-pulse" />
                  <div className="h-5 w-24 bg-zinc-200 dark:bg-stone-850 rounded-md animate-pulse" />
                </div>
                <div className="h-5 w-12 bg-zinc-100 dark:bg-stone-850 rounded-full animate-pulse" />
              </div>

              {/* Message cards */}
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-150 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-950/20 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-stone-800 animate-pulse" />
                        <div className="h-3.5 w-24 bg-zinc-250 dark:bg-stone-800 rounded animate-pulse" />
                      </div>
                      <div className="h-2.5 w-12 bg-zinc-100 dark:bg-stone-850 rounded animate-pulse" />
                    </div>
                    <div className="h-3.5 w-full bg-zinc-150 dark:bg-stone-850 rounded animate-pulse" />
                    <div className="h-3.5 w-4/5 bg-zinc-150 dark:bg-stone-850 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Footer Shimmer */}
      <footer className="py-8 bg-white dark:bg-stone-900 border-t border-zinc-150 dark:border-stone-850 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-4 w-44 bg-zinc-250 dark:bg-stone-800 rounded-md animate-pulse" />
        <div className="h-3 w-32 bg-zinc-150 dark:bg-stone-850 rounded-md animate-pulse" />
      </footer>

    </div>
  );
};
