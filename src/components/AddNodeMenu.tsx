import React, { useEffect, useMemo, useRef } from 'react';
import type { NodeCreateKind, ParentConnection } from '../lib/workflowTypes';

export type AddMenuState = {
  isOpen: boolean;
  x: number;
  y: number;
  parentId: string;
  connection: ParentConnection;
};

type Props = {
  state: AddMenuState | null;
  onSelect: (kind: NodeCreateKind) => void;
  onClose: () => void;
};

const OPTIONS: { kind: NodeCreateKind; label: string; description: string }[] = [
  { kind: 'action', label: 'Action', description: 'A single sequential step' },
  { kind: 'branch', label: 'Branch', description: 'A decision with multiple paths' },
  { kind: 'end', label: 'End', description: 'Stops this path' },
];

export default function AddNodeMenu({ state, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const style = useMemo<React.CSSProperties>(() => {
    if (!state) return { display: 'none' };
    return {
      position: 'fixed',
      left: Math.max(12, state.x - 140),
      top: state.y + 10,
      width: 280,
      zIndex: 50,
    };
  }, [state]);

  useEffect(() => {
    if (!state?.isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    function onMouseDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [state, onClose]);

  if (!state?.isOpen) return null;

  return (
    <div ref={ref} style={style} className="add-menu">
      <div className="add-menu__title">Add step</div>
      <div className="add-menu__body">
        {OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            className="add-menu__item"
            onClick={() => onSelect(opt.kind)}
            type="button"
          >
            <div className="add-menu__itemLabel">{opt.label}</div>
            <div className="add-menu__itemDesc">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
