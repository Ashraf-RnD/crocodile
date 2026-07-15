import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { readProgress } from "../lib/progress";

interface PhaseProgressBarProps {
  phaseSlug: string;
  topicSlugs: string[];
}

export default function PhaseProgressBar({ phaseSlug, topicSlugs }: PhaseProgressBarProps) {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      if (topicSlugs.length === 0) {
        setPercent(0);
        return;
      }
      const done = topicSlugs.filter(
        (slug) => readProgress(`${phaseSlug}/${slug}`).status === "done"
      ).length;
      setPercent(Math.round((done / topicSlugs.length) * 100));
    };
    compute();
    window.addEventListener("crocodile:progress-changed", compute);
    return () => window.removeEventListener("crocodile:progress-changed", compute);
  }, [phaseSlug, topicSlugs]);

  return (
    <div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent ?? 0}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
        {percent ?? 0}% complete · {topicSlugs.length} topics
      </p>
    </div>
  );
}
