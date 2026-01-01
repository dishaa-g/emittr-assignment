import { useEffect, useMemo, useState } from 'react';
import type { WorkflowNode } from '../lib/workflowTypes';

const KIND_LABEL: Record<WorkflowNode['kind'], string> = {
  start: 'Start',
  action: 'Action',
  branch: 'Branch',
  end: 'End',
};

type Props = {
  node: WorkflowNode;
  canDelete: boolean;
  onDelete: () => void;
  onChangeLabel: (label: string) => void;
};

export default function NodeCard({ node, canDelete, onDelete, onChangeLabel }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(node.label);

  useEffect(() => {
    setDraft(node.label);
  }, [node.label]);

  function commit() {
    const trimmed = draft.trim();
    onChangeLabel(trimmed.length ? trimmed : node.label);
    setIsEditing(false);
  }

  const badge = useMemo(() => KIND_LABEL[node.kind], [node.kind]);

  return (
    <div className={`node-card node-card--${node.kind}`}>
      <div className="node-card__top">
        <div className={`node-badge node-badge--${node.kind}`}>{badge}</div>
        <div className="node-card__actions">
          <button
            type="button"
            className="icon-btn"
            title="Edit label"
            onClick={() => setIsEditing(true)}
          >
            ✎
          </button>
          {canDelete && (
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              title="Delete node"
              onClick={onDelete}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="node-card__label" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            className="node-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(node.label);
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span>{node.label}</span>
        )}
      </div>
    </div>
  );
}
