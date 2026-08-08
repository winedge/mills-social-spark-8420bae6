import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
    // The widget provider's exact recommended implementation
    // Using a self-invoking function to match the requested format precisely
    (function(w, d, s, o, f, js) {
      // @ts-ignore
      if (w[o]) return;
      // @ts-ignore
      w[o] = w[o] || function() {
        // @ts-ignore
        (w[o].q = w[o].q || []).push(arguments);
      };
      js = d.createElement(s);
      // @ts-ignore
      js.id = o;
      // @ts-ignore
      js.src = f;
      // @ts-ignore
      js.async = 1;
      (d.head || d.body).appendChild(js);
    }(window, document, 'script', 'vw', 'https://n2nverse.ai/widget/embed.js'));

    // @ts-ignore
    window.vw('init', 'wgt_5KLotoIys-h1lAeQGlM1lokn');
  }, []);

  return null;
}
