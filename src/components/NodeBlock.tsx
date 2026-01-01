import React from 'react';
import type { ParentConnection, WorkflowState } from '../lib/workflowTypes';
import NodeCard from './NodeCard';
import EmptySlot from './EmptySlot';

export type AddRequest = {
  parentId: string;
  connection: ParentConnection;
  anchor: { x: number; y: number };
};

type Props = {
  nodeId: string;
  workflow: WorkflowState;
  onRequestAdd: (req: AddRequest) => void;
  onDelete: (nodeId: string) => void;
  onChangeLabel: (nodeId: string, label: string) => void;
};

function posFromButton(e: React.MouseEvent<HTMLButtonElement>) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.bottom };
}

export default function NodeBlock({ nodeId, workflow, onRequestAdd, onDelete, onChangeLabel }: Props) {
  const node = workflow.nodes[nodeId];
  if (!node) return null;

  const canDelete = nodeId !== workflow.rootId;

  return (
    <div className="node-block">
      <NodeCard
        node={node}
        canDelete={canDelete}
        onDelete={() => onDelete(nodeId)}
        onChangeLabel={(label) => onChangeLabel(nodeId, label)}
      />

      {(node.kind === 'start' || node.kind === 'action') && (
        <div className="seq">
          <div className="conn">
            <div className="conn__line" />
            <button
              type="button"
              className="conn__add"
              title="Add step"
              onClick={(e) =>
                onRequestAdd({
                  parentId: nodeId,
                  connection: { type: 'next' },
                  anchor: posFromButton(e),
                })
              }
            >
              +
            </button>
          </div>

          <div className="seq__child">
            {node.next ? (
              <NodeBlock
                nodeId={node.next}
                workflow={workflow}
                onRequestAdd={onRequestAdd}
                onDelete={onDelete}
                onChangeLabel={onChangeLabel}
              />
            ) : (
              <EmptySlot
                hint="No next step"
                onAdd={(e) =>
                  onRequestAdd({
                    parentId: nodeId,
                    connection: { type: 'next' },
                    anchor: posFromButton(e),
                  })
                }
              />
            )}
          </div>
        </div>
      )}

      {node.kind === 'branch' && (
        <div className="branch">
          <div className="conn conn--short">
            <div className="conn__line" />
          </div>

          <div className="branch__row">
            {node.branches.map((br) => (
              <div key={br.id} className="branch__col">
                <div className="branch__label">{br.label}</div>

                <div className="conn">
                  <div className="conn__line" />
                  <button
                    type="button"
                    className="conn__add"
                    title={`Add step to ${br.label}`}
                    onClick={(e) =>
                      onRequestAdd({
                        parentId: nodeId,
                        connection: { type: 'branch', branchId: br.id },
                        anchor: posFromButton(e),
                      })
                    }
                  >
                    +
                  </button>
                </div>

                <div className="branch__child">
                  {br.childId ? (
                    <NodeBlock
                      nodeId={br.childId}
                      workflow={workflow}
                      onRequestAdd={onRequestAdd}
                      onDelete={onDelete}
                      onChangeLabel={onChangeLabel}
                    />
                  ) : (
                    <EmptySlot
                      hint="Empty path"
                      onAdd={(e) =>
                        onRequestAdd({
                          parentId: nodeId,
                          connection: { type: 'branch', branchId: br.id },
                          anchor: posFromButton(e),
                        })
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.kind === 'end' && <div className="end-cap"> </div>}
    </div>
  );
}
