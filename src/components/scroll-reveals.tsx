import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

/** Progressive enhancement: content stays visible without JS or with reduced motion. */
export function ScrollReveals() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/admin" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const marked = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "true");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    const register = () => {
      document.querySelectorAll("section > div, main > div > section, [data-media-reveal]").forEach((element) => {
        if (marked.has(element) || element.closest("header, footer, [role=dialog]")) return;
        // Reveal gallery tiles independently, not behind a second parent animation.
        if (!element.matches("[data-media-reveal]") && element.querySelector(".media-masonry")) return;
        marked.add(element);
        if (element.getBoundingClientRect().top < window.innerHeight - 24) {
          if (element.matches(".media-tile")) {
            element.setAttribute("data-scroll-reveal", "true");
            element.setAttribute("data-revealed", "true");
          }
          return;
        }
        element.setAttribute("data-scroll-reveal", "true");
        observer.observe(element);
      });
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
      marked.forEach((element) => {
        element.removeAttribute("data-scroll-reveal");
        element.removeAttribute("data-revealed");
      });
    };
  }, [pathname]);
  return null;
}