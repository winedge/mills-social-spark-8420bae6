import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
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
      if (window.location.pathname === "/menu") {
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

    // Handle navigation changes for body class
    const observer = new MutationObserver(updateBodyClass);
    observer.observe(document.querySelector('title')!, { subtree: true, characterData: true, childList: true });

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('is-menu-page');
      observer.disconnect();
    };
  }, []);

  return null;
}
