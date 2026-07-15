import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { readProgress, writeProgress, type ProgressStatus } from "../lib/progress";

interface ProgressToggleProps {
  phaseSlug: string;
  topicSlug: string;
}

const OPTIONS: { value: ProgressStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function ProgressToggle({ phaseSlug, topicSlug }: ProgressToggleProps) {
  const key = `${phaseSlug}/${topicSlug}`;
  const [status, setStatus] = useState<ProgressStatus | null>(null);

  useEffect(() => {
    setStatus(readProgress(key).status);
  }, [key]);

  if (status === null) {
    return <div style={{ height: 34 }} />;
  }

  return (
    <div style={{ display: "flex", gap: 6 }} role="radiogroup" aria-label="Topic progress">
      {OPTIONS.map((opt) => {
        const active = status === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              writeProgress(key, opt.value);
              setStatus(opt.value);
            }}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: 999,
              border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: active ? "var(--accent-soft)" : "var(--bg-elevated)",
              color: active ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
