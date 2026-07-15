export type ProgressStatus = "not-started" | "in-progress" | "done";

export interface TopicProgress {
  status: ProgressStatus;
  updatedAt: string;
}

const STORAGE_PREFIX = "crocodile:progress:";

export function topicKey(phaseSlug: string, topicSlug: string): string {
  return `${phaseSlug}/${topicSlug}`;
}

export function readProgress(key: string): TopicProgress {
  if (typeof window === "undefined") return { status: "not-started", updatedAt: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { status: "not-started", updatedAt: "" };
    return JSON.parse(raw) as TopicProgress;
  } catch {
    return { status: "not-started", updatedAt: "" };
  }
}

export function writeProgress(key: string, status: ProgressStatus): void {
  if (typeof window === "undefined") return;
  const value: TopicProgress = { status, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("crocodile:progress-changed", { detail: { key, value } }));
}
