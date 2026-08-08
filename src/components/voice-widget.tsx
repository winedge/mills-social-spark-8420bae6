import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
    // Exact logic from the snippet, but typed for TS safely
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
  }, []);

  return null;
}
