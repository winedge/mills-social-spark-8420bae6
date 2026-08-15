import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
    const handleWidget = () => {
      const isMenuPage = window.location.pathname === "/menu";
      const isMobile = window.innerWidth <= 768;
      const shouldHide = isMenuPage && isMobile;

      const widgetEl = document.querySelector('.n2n-voice-widget-container') as HTMLElement;
      const widgetButton = document.getElementById('vw-btn') as HTMLElement;
      
      if (shouldHide) {
        if (widgetEl) widgetEl.style.display = 'none';
        if (widgetButton) widgetButton.style.display = 'none';
      } else {
        if (widgetEl) widgetEl.style.display = 'block';
        if (widgetButton) widgetButton.style.display = 'block';
      }
    };

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

    // Handle visibility on load and window changes
    handleWidget();
    window.addEventListener('resize', handleWidget);
    
    // Check periodically since the widget might mount late
    const interval = setInterval(handleWidget, 1000);

    return () => {
      window.removeEventListener('resize', handleWidget);
      clearInterval(interval);
    };
  }, []);

  return null;
}
