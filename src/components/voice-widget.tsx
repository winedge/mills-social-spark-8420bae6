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
    const style = document.createElement('style');
    style.id = 'vw-mobile-hide-css';
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

    const updateBodyClass = () => {
      // Check both location.pathname and tanstack router state if possible
      // But pathname is most reliable for standard checks
      const isMenu = window.location.pathname === "/menu" || window.location.hash.includes("/menu");
      if (isMenu) {
        document.body.classList.add('is-menu-page');
      } else {
        document.body.classList.remove('is-menu-page');
      }
    };

    updateBodyClass();

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

    // Handle navigation changes
    const handleUrlChange = () => {
      updateBodyClass();
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('pushstate', handleUrlChange);
    window.addEventListener('replacestate', handleUrlChange);

    // Also observe the entire body for changes as widgets might inject elements later
    const observer = new MutationObserver(updateBodyClass);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Periodically check as well just in case
    const interval = setInterval(updateBodyClass, 1000);

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('is-menu-page');
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('pushstate', handleUrlChange);
      window.removeEventListener('replacestate', handleUrlChange);
    };
  }, []);

  return null;
}
