"use client";

import * as React from "react";

interface GreetingProps {
  name: string;
  timezone?: string | null;
}

export function Greeting({ name, timezone }: GreetingProps) {
  const [greeting, setGreeting] = React.useState(`Welcome, ${name}`);

  React.useEffect(() => {
    const localOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      hourCycle: "h23",
    };
    const options = timezone ? { ...localOptions, timeZone: timezone } : localOptions;
    const frame = window.requestAnimationFrame(() => {
      let hour: number;
      try {
        hour = Number(new Intl.DateTimeFormat("en", options).format(new Date()));
      } catch (error) {
        if (!(error instanceof RangeError) || !timezone) throw error;
        hour = Number(new Intl.DateTimeFormat("en", localOptions).format(new Date()));
      }
      const timeGreeting =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      setGreeting(`${timeGreeting}, ${name}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [name, timezone]);

  return <p className="mb-1 text-sm font-semibold text-primary" aria-live="polite">{greeting}</p>;
}
