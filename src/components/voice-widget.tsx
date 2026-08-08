import { useEffect } from "react";

export function VoiceWidget() {
  useEffect(() => {
    // @ts-ignore
    window.vw = window.vw || function() {
      // @ts-ignore
      (window.vw.q = window.vw.q || []).push(arguments);
    };
    
    const script = document.createElement("script");
    script.id = "vw";
    script.src = "https://n2nverse.ai/widget/embed.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.vw) {
        // @ts-ignore
        window.vw('init', 'wgt_r3PcLKxueW4Z6mc0hJuyomgg');
      }
    };

    return () => {
      const existingScript = document.getElementById("vw");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}
