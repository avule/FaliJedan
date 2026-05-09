"use client";

import { useEffect, useState } from "react";

export function CountUp({
  value,
  duration = 800,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;

    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (to - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{shown}</span>;
}
