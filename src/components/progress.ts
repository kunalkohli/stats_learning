"use client";
import { useEffect, useState } from "react";
import { restoreProgress, type Progress } from "@/lib/progress";

const KEY = "statsconcepts-progress-v2";
export type { Progress } from "@/lib/progress";
const empty: Progress = { understood: [], notes: {}, lastLesson: 1 };

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const current = localStorage.getItem(KEY);
      const raw = current ?? localStorage.getItem("statsconcepts-progress-v1") ?? localStorage.getItem("fieldnotes-progress-v1");
      if (raw) {
        const restored = restoreProgress(JSON.parse(raw), current === null);
        setProgress(restored);
        if (current === null) localStorage.setItem(KEY, JSON.stringify(restored));
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, []);
  function update(fn: (p: Progress) => Progress) {
    setProgress(current => {
      const next = fn(current);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { setStorageError(true); }
      return next;
    });
  }
  return { progress, ready, storageError, update };
}
