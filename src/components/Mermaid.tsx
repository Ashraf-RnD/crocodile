import { useEffect, useId, useRef } from "react";

interface MermaidProps {
  code: string;
}

export default function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `mermaid-${useId().replace(/[:]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({
        startOnLoad: false,
        theme: prefersDark ? "dark" : "neutral",
        securityLevel: "strict",
      });
      const { svg } = await mermaid.render(id, code.trim());
      if (!cancelled && ref.current) {
        ref.current.innerHTML = svg;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, id]);

  return <div className="mermaid-wrap" ref={ref} aria-label="Diagram" />;
}
