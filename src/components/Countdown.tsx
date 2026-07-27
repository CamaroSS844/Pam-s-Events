/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  themeFontHeading: string;
  themeColor: string;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, themeFontHeading, themeColor }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  useEffect(() => {
    const calculateTime = () => {
      const targetTimestamp = +new Date(targetDate);
      if (isNaN(targetTimestamp)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });
        return;
      }

      const difference = targetTimestamp - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)) || 0,
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24) || 0,
        minutes: Math.floor((difference / 1000 / 60) % 60) || 0,
        seconds: Math.floor((difference / 1000) % 60) || 0,
        isOver: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  if (timeLeft.isOver) {
    return (
      <div className={`text-center py-4 text-xl font-semibold tracking-wide ${themeFontHeading}`} style={{ color: themeColor }}>
        The Event has Begun! 🎉
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6 py-2 px-2 max-w-full select-none overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center shrink-0">
          <div 
            className={`text-xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold font-mono tracking-tight tabular-nums min-w-[2.2rem] sm:min-w-[3.5rem] text-center`}
            style={{ color: themeColor }}
          >
            {String(item.value).padStart(2, '0')}
          </div>
          <span className="text-[9px] sm:text-xs uppercase font-medium tracking-widest text-neutral-400 mt-1 truncate max-w-[4rem] sm:max-w-none text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
