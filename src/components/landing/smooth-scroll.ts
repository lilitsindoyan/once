"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

let lenis: Lenis | null = null;

const ease = (t: number) => 1 - Math.pow(1 - t, 4);

/** Smooth scroll to a section (used by the side menu). Falls back to native scrolling. */
export function scrollToSection(el: HTMLElement) {
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: ease });
  else el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** The loader holds the page still until it fades out. */
export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();

/**
 * Landing scroll feel:
 *  - inertia smoothing of wheel / trackpad scrolling (Lenis; touch keeps the phone's own scrolling)
 *  - on desktop, when scrolling stops near a section edge, it settles so the section fills the screen.
 *    Tall scroll scenes ([data-snap="scene"]) settle on their start or end, never in the middle of the animation.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const l = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
    lenis = l;
    if (document.documentElement.style.overflow === "hidden") l.stop(); // loader still showing
    let raf = requestAnimationFrame(function loop(time) {
      l.raf(time);
      raf = requestAnimationFrame(loop);
    });

    let idle: ReturnType<typeof setTimeout>;
    let snapping = false;

    const settle = () => {
      if (snapping || window.innerWidth < 1024 || window.innerHeight < 560) return;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const points: number[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("[data-snap]")) {
        const top = el.getBoundingClientRect().top + y;
        const end = top + el.offsetHeight - vh;
        if (el.dataset.snap === "scene") {
          if (y > top + 40 && y < end - 40) return; // inside an animation: leave it where the user put it
          points.push(top, end);
        } else {
          points.push(top);
          if (end > top + 40) points.push(end);
        }
      }
      let best = y;
      let dist = Infinity;
      for (const p of points) {
        const d = Math.abs(p - y);
        if (d < dist) {
          dist = d;
          best = p;
        }
      }
      if (dist < 3 || dist > vh * 0.42) return;
      snapping = true;
      l.scrollTo(best, { duration: 0.9, easing: ease, onComplete: () => (snapping = false) });
      setTimeout(() => (snapping = false), 1200);
    };

    l.on("scroll", () => {
      clearTimeout(idle);
      idle = setTimeout(settle, 160);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      l.destroy();
      lenis = null;
    };
  }, []);
}
