import type { WorkflowState } from '../lib/workflowTypes';
import NodeBlock, { AddRequest } from './NodeBlock';

type Props = {
  workflow: WorkflowState;
  onRequestAdd: (req: AddRequest) => void;
  onDelete: (nodeId: string) => void;
  onChangeLabel: (nodeId: string, label: string) => void;
};

export default function WorkflowCanvas({ workflow, onRequestAdd, onDelete, onChangeLabel }: Props) {
  return (
    <div className="canvas">
      <div className="canvas__inner">
        <NodeBlock
          nodeId={workflow.rootId}
          workflow={workflow}
          onRequestAdd={onRequestAdd}
          onDelete={onDelete}
          onChangeLabel={onChangeLabel}
        />
      </div>
    </div>
  );
}
