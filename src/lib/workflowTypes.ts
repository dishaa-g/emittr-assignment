export type NodeKind = 'start' | 'action' | 'branch' | 'end';

export type BranchId = string;

export type Branch = {
  id: BranchId;
  label: string;
  childId: string | null;
};

export type BaseNode = {
  id: string;
  kind: NodeKind;
  label: string;
};

export type StartNode = BaseNode & {
  kind: 'start';
  next: string | null;
};

export type ActionNode = BaseNode & {
  kind: 'action';
  next: string | null;
};

export type BranchNode = BaseNode & {
  kind: 'branch';
  branches: Branch[];
};

export type EndNode = BaseNode & {
  kind: 'end';
};

export type WorkflowNode = StartNode | ActionNode | BranchNode | EndNode;

export type WorkflowState = {
  rootId: string;
  nodes: Record<string, WorkflowNode>;
};

export type NodeCreateKind = Exclude<NodeKind, 'start'>;

export type ParentConnection =
  | { type: 'next' }
  | { type: 'branch'; branchId: BranchId };

export type ParentPointer = {
  parentId: string;
  connection: ParentConnection;
};
