import React from "react";

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ siteKey, onToken, resetKey = 0 }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!siteKey) return undefined;

    let disposed = false;
    let widgetId;
    let script = document.getElementById(SCRIPT_ID);

    const renderWidget = () => {
      if (disposed || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget, { once: true });
    }

    return () => {
      disposed = true;
      script?.removeEventListener("load", renderWidget);
      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
      onToken(null);
    };
  }, [siteKey, onToken, resetKey]);

  if (!siteKey) return null;
  return (
    <div
      ref={containerRef}
      style={{ minHeight: 65, display: "flex", justifyContent: "center" }}
    />
  );
}
