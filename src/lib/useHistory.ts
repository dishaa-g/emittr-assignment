import { useCallback, useMemo, useRef, useState } from 'react';

export type HistoryControls<T> = {
  state: T;
  set: (next: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: (next: T) => void;
};

export function useHistory<T>(initial: T, opts?: { limit?: number }): HistoryControls<T> {
  const limit = opts?.limit ?? 50;
  const [present, setPresent] = useState<T>(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setPresent((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        pastRef.current.push(prev);
        if (pastRef.current.length > limit) pastRef.current.shift();
        futureRef.current = [];
        return resolved;
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setPresent((prev) => {
      const past = pastRef.current;
      if (past.length === 0) return prev;
      const previous = past[past.length - 1];
      pastRef.current = past.slice(0, -1);
      futureRef.current = [prev, ...futureRef.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((prev) => {
      const future = futureRef.current;
      if (future.length === 0) return prev;
      const next = future[0];
      futureRef.current = future.slice(1);
      pastRef.current = [...pastRef.current, prev];
      if (pastRef.current.length > limit) pastRef.current.shift();
      return next;
    });
  }, [limit]);

  const clear = useCallback((next: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setPresent(next);
  }, []);

  const canUndo = useMemo(() => pastRef.current.length > 0, [present]);
  const canRedo = useMemo(() => futureRef.current.length > 0, [present]);

  return { state: present, set, undo, redo, canUndo, canRedo, clear };
}
