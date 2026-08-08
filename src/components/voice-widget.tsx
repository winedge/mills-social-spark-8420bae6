import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
    // Check if script already exists to avoid duplicate injection
    if (document.getElementById("vw-script")) return;

    // Define the initialization function as per the provided snippet
    // @ts-ignore
    window.vw = window.vw || function() {
      // @ts-ignore
      (window.vw.q = window.vw.q || []).push(arguments);
    };

    const script = document.createElement("script");
    script.id = "vw-script";
    script.src = "https://n2nverse.ai/widget/embed.js";
    script.async = true;
    
    // Append to head or body
    const target = document.head || document.body;
    if (target) {
      target.appendChild(script);
    }

    // Call init immediately (it gets queued if script isn't loaded yet)
    // @ts-ignore
    window.vw('init', 'wgt_5KLotoIys-h1lAeQGlM1lokn');
  }, []);

  return null;
}
