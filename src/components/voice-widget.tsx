import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";

export function VoiceWidget() {
  const location = useLocation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Standardize path comparison
    const isMenuPage = location.pathname === "/menu" || location.href.includes("/menu");
    
    if (isMenuPage) {
      document.body.classList.add('is-menu-page');
    } else {
      document.body.classList.remove('is-menu-page');
    }
  }, [location, isClient]);

  useEffect(() => {
    if (!isClient) return;

    // Add CSS rule for mobile menu page to hide elements
    // We add this once on mount
    const styleId = 'vw-mobile-hide-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (max-width: 768px) {
          body.is-menu-page #vw-btn,
          body.is-menu-page .n2n-voice-widget-container,
          body.is-menu-page [id^="vw-"],
          body.is-menu-page [class^="n2n-voice-widget"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Initialize widget
    const w = window as any;
    const d = document;
    const s = 'script';
    const o = 'vw';
    const f = 'https://n2nverse.ai/widget/embed.js';

    if (!w[o]) {
      w[o] = function() {
        (w[o].q = w[o].q || []).push(arguments);
      };
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = o;
      js.src = f;
      js.async = true;
      (d.head || d.body).appendChild(js);
    }

    w[o]('init', 'wgt_5KLotoIys-h1lAeQGlM1lokn');

    // Mutation observer to handle any dynamically injected elements from the widget
    const checkVisibility = () => {
      const isMenuPage = document.body.classList.contains('is-menu-page');
      const isMobile = window.innerWidth <= 768;
      
      if (isMenuPage && isMobile) {
        const elements = [
          document.getElementById('vw-btn'),
          ...Array.from(document.querySelectorAll('.n2n-voice-widget-container')),
          ...Array.from(document.querySelectorAll('[id^="vw-"]')),
          ...Array.from(document.querySelectorAll('[class^="n2n-voice-widget"]'))
        ];
        
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.display = 'none';
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
          }
        });
      }
    };

    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Check periodically for safety
    const interval = setInterval(checkVisibility, 2000);

    return () => {
      const style = document.getElementById(styleId);
      if (style) document.head.removeChild(style);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [isClient]);

  return null;
}
