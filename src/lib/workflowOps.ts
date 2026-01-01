import { uid } from './id';
import type {
  Branch,
  BranchNode,
  NodeCreateKind,
  ParentConnection,
  ParentPointer,
  WorkflowNode,
  WorkflowState,
} from './workflowTypes';

export function createInitialWorkflow(): WorkflowState {
  const rootId = uid('start');
  return {
    rootId,
    nodes: {
      [rootId]: { id: rootId, kind: 'start', label: 'Start', next: null },
    },
  };
}

export function cloneWorkflow(wf: WorkflowState): WorkflowState {
  // deep copy for history snapshots
  return {
    rootId: wf.rootId,
    nodes: JSON.parse(JSON.stringify(wf.nodes)) as WorkflowState['nodes'],
  };
}

export function defaultBranches(existing?: Branch[]): Branch[] {
  if (existing && existing.length >= 2) {
    return existing.map((b) => ({ ...b }));
  }
  return [
    { id: 'true', label: 'True', childId: null },
    { id: 'false', label: 'False', childId: null },
  ];
}

export function getOutgoingChildIds(node: WorkflowNode): string[] {
  if (node.kind === 'start' || node.kind === 'action') {
    return node.next ? [node.next] : [];
  }
  if (node.kind === 'branch') {
    return node.branches.map((b) => b.childId).filter(Boolean) as string[];
  }
  return [];
}

export function getChildIdAtConnection(
  wf: WorkflowState,
  parentId: string,
  connection: ParentConnection,
): string | null {
  const parent = wf.nodes[parentId];
  if (!parent) return null;

  if (connection.type === 'next') {
    if (parent.kind === 'start' || parent.kind === 'action') return parent.next;
    return null;
  }

  if (parent.kind !== 'branch') return null;
  const br = parent.branches.find((b) => b.id === connection.branchId);
  return br?.childId ?? null;
}

export function setChildIdAtConnection(
  wf: WorkflowState,
  parentId: string,
  connection: ParentConnection,
  childId: string | null,
): WorkflowState {
  const parent = wf.nodes[parentId];
  if (!parent) return wf;

  if (connection.type === 'next') {
    if (parent.kind === 'start' || parent.kind === 'action') {
      return {
        ...wf,
        nodes: {
          ...wf.nodes,
          [parentId]: { ...parent, next: childId },
        },
      };
    }
    return wf;
  }

  if (parent.kind !== 'branch') return wf;
  const branches = parent.branches.map((b) =>
    b.id === connection.branchId ? { ...b, childId } : b,
  );
  return {
    ...wf,
    nodes: {
      ...wf.nodes,
      [parentId]: { ...parent, branches },
    },
  };
}

export function updateNodeLabel(
  wf: WorkflowState,
  nodeId: string,
  label: string,
): WorkflowState {
  const node = wf.nodes[nodeId];
  if (!node) return wf;
  return {
    ...wf,
    nodes: {
      ...wf.nodes,
      [nodeId]: { ...node, label },
    },
  };
}

export function addNodeAfter(
  wf: WorkflowState,
  parentId: string,
  connection: ParentConnection,
  kind: NodeCreateKind,
): WorkflowState {
  const existingChildId = getChildIdAtConnection(wf, parentId, connection);
  const newId = uid(kind);

  let newNode: WorkflowNode;
  if (kind === 'action') {
    newNode = { id: newId, kind: 'action', label: 'Action', next: existingChildId };
  } else if (kind === 'branch') {
    const branches = defaultBranches();
    // If we are inserting into an existing chain, preserve the old continuation
    branches[0] = { ...branches[0], childId: existingChildId };
    newNode = { id: newId, kind: 'branch', label: 'Branch', branches };
  } else {
    // end
    newNode = { id: newId, kind: 'end', label: 'End' };
  }

  let nextWf: WorkflowState = {
    ...wf,
    nodes: {
      ...wf.nodes,
      [newId]: newNode,
    },
  };

  nextWf = setChildIdAtConnection(nextWf, parentId, connection, newId);
  return pruneUnreachable(nextWf);
}

export function findParentPointer(
  wf: WorkflowState,
  targetId: string,
): ParentPointer | null {
  const visited = new Set<string>();

  function dfs(nodeId: string): ParentPointer | null {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = wf.nodes[nodeId];
    if (!node) return null;

    if (node.kind === 'start' || node.kind === 'action') {
      if (node.next === targetId) return { parentId: nodeId, connection: { type: 'next' } };
      if (node.next) return dfs(node.next);
      return null;
    }

    if (node.kind === 'branch') {
      for (const br of node.branches) {
        if (br.childId === targetId)
          return { parentId: nodeId, connection: { type: 'branch', branchId: br.id } };
        if (br.childId) {
          const found = dfs(br.childId);
          if (found) return found;
        }
      }
    }

    return null;
  }

  if (targetId === wf.rootId) return null;
  return dfs(wf.rootId);
}

export function deleteNode(wf: WorkflowState, nodeId: string): WorkflowState {
  if (nodeId === wf.rootId) return wf;
  const ptr = findParentPointer(wf, nodeId);
  if (!ptr) return wf;

  const node = wf.nodes[nodeId];
  if (!node) return wf;

  let replacement: string | null = null;
  if (node.kind === 'start' || node.kind === 'action') {
    replacement = node.next;
  } else if (node.kind === 'branch') {
    const nonNull = node.branches.map((b) => b.childId).filter(Boolean) as string[];
    if (nonNull.length === 0) {
      replacement = null;
    } else if (nonNull.length === 1) {
      replacement = nonNull[0];
    } else {
      // Parent pointers only support a single child reference, so we preserve multiple paths
      // by inserting a replacement branch node.
      const newId = uid('branch');
      const branches = node.branches.map((b) => ({ ...b }));
      const replacementNode: BranchNode = {
        id: newId,
        kind: 'branch',
        label: 'Branch',
        branches,
      };
      wf = {
        ...wf,
        nodes: {
          ...wf.nodes,
          [newId]: replacementNode,
        },
      };
      replacement = newId;
    }
  } else {
    replacement = null;
  }

  let nextWf = setChildIdAtConnection(wf, ptr.parentId, ptr.connection, replacement);

  const rest = { ...nextWf.nodes };
  delete rest[nodeId];
  nextWf = { ...nextWf, nodes: rest };
  return pruneUnreachable(nextWf);
}

export function pruneUnreachable(wf: WorkflowState): WorkflowState {
  const reachable = new Set<string>();

  function walk(nodeId: string | null): void {
    if (!nodeId) return;
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    const node = wf.nodes[nodeId];
    if (!node) return;

    if (node.kind === 'start' || node.kind === 'action') {
      walk(node.next);
    } else if (node.kind === 'branch') {
      for (const br of node.branches) walk(br.childId);
    }
  }

  walk(wf.rootId);

  const nextNodes: WorkflowState['nodes'] = {};
  for (const id of Object.keys(wf.nodes)) {
    if (reachable.has(id)) nextNodes[id] = wf.nodes[id];
  }

  return { ...wf, nodes: nextNodes };
}

export function serializeWorkflow(wf: WorkflowState): string {
  return JSON.stringify(wf, null, 2);
}
