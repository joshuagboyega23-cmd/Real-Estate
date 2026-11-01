"use client";

import * as React from "react";

type RevealTag = "div" | "section" | "article" | "li";
type RevealVariant = "up" | "left" | "right" | "scale";

const revealElements = new Map<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          revealElements.get(entry.target)?.();
          revealElements.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
  }
  return sharedObserver;
}

function observeOnce(element: Element, reveal: () => void): () => void {
  const observer = getSharedObserver();
  if (!observer) {
    reveal();
    return () => {};
  }
  revealElements.set(element, reveal);
  observer.observe(element);
  return () => {
    revealElements.delete(element);
    observer.unobserve(element);
  };
}

interface RevealProps {
  children: React.ReactNode;
  as?: RevealTag;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}

export function Reveal({
  children,
  as = "div",
  variant = "up",
  delay = 0,
  className = "",
}: RevealProps) {
  const elementRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (reducedMotion || isInViewport) {
      element.classList.add("is-visible");
      return;
    }
    return observeOnce(element, () => element.classList.add("is-visible"));
  }, []);

  const Tag = as;
  const variantClass = variant === "up" ? "" : `reveal-${variant}`;
  const style = { "--reveal-delay": `${Math.min(Math.max(delay, 0), 400)}ms` } as React.CSSProperties;

  return (
    <Tag ref={elementRef as React.Ref<never>} className={`reveal ${variantClass} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

function formatValue(value: number, prefix: string, suffix: string): string {
  return `${prefix}${Math.round(value).toLocaleString("en-NG")}${suffix}`;
}

export function CountUp({
  value,
  duration = 1400,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const elementRef = React.useRef<HTMLSpanElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || value <= 0) return;

    const startAnimation = () => {
      const startTime = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setDisplayValue(value * eased);
        if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      };
      setDisplayValue(0);
      frameRef.current = requestAnimationFrame(animate);
    };

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      startAnimation();
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }

    const stopObserving = observeOnce(element, startAnimation);
    return () => {
      stopObserving();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [duration, value]);

  return (
    <span ref={elementRef} className={className}>
      {formatValue(displayValue, prefix, suffix)}
    </span>
  );
}

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.15, className = "" }: ParallaxProps) {
  const elementRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let enabled = false;

    const updatePosition = () => {
      if (!enabled || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const travelLimit = rect.height * 0.06;
        const y = Math.max(-travelLimit, Math.min(travelLimit, -centerOffset * speed));
        element.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    const updateEnabled = () => {
      enabled = !reducedMotion.matches && window.innerWidth >= 768;
      if (!enabled) {
        element.style.transform = "";
      } else {
        updatePosition();
      }
    };

    updateEnabled();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updateEnabled, { passive: true });
    reducedMotion.addEventListener("change", updateEnabled);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updateEnabled);
      reducedMotion.removeEventListener("change", updateEnabled);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
