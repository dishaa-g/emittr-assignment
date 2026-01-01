import { useEffect, useMemo, useState } from 'react';
import AddNodeMenu, { AddMenuState } from './AddNodeMenu';
import WorkflowCanvas from './WorkflowCanvas';
import type { NodeCreateKind, WorkflowState } from '../lib/workflowTypes';
import { createInitialWorkflow, addNodeAfter, deleteNode, serializeWorkflow, updateNodeLabel } from '../lib/workflowOps';
import { useHistory } from '../lib/useHistory';
import type { AddRequest } from './NodeBlock';

export default function WorkflowBuilder() {
  const initial = useMemo(() => createInitialWorkflow(), []);
  const hist = useHistory<WorkflowState>(initial);
  const wf = hist.state;

  const [addMenu, setAddMenu] = useState<AddMenuState | null>(null);
  const [status, setStatus] = useState<string>('');

  function openAddMenu(req: AddRequest) {
    setAddMenu({
      isOpen: true,
      x: req.anchor.x,
      y: req.anchor.y,
      parentId: req.parentId,
      connection: req.connection,
    });
  }

  function closeAddMenu() {
    setAddMenu(null);
  }

  function handleAdd(kind: NodeCreateKind) {
    if (!addMenu) return;
    hist.set((prev) => addNodeAfter(prev, addMenu.parentId, addMenu.connection, kind));
    setStatus(`Added ${kind}`);
    closeAddMenu();
  }

  function handleDelete(nodeId: string) {
    hist.set((prev) => deleteNode(prev, nodeId));
    setStatus('Deleted node');
  }

  function handleLabel(nodeId: string, label: string) {
    hist.set((prev) => updateNodeLabel(prev, nodeId, label));
    setStatus('Updated label');
  }

  function handleSave() {
    const json = serializeWorkflow(wf);
    // eslint-disable-next-line no-console
    console.log('[workflow]', json);
    setStatus('Saved to console (see DevTools)');
  }

  function handleReset() {
    hist.clear(createInitialWorkflow());
    setStatus('Reset workflow');
  }

  useEffect(() => {
    const id = window.setTimeout(() => setStatus(''), 1800);
    return () => window.clearTimeout(id);
  }, [status]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (hist.canUndo) hist.undo();
      }

      const isRedo = e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey);
      if (isRedo) {
        e.preventDefault();
        if (hist.canRedo) hist.redo();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hist]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <div className="title">Workflow Builder</div>
          <div className="subtitle">Add, connect, edit, and delete steps</div>
        </div>

        <div className="topbar__right">
          <button type="button" className="btn" onClick={handleSave}>
            Save
          </button>
          <button type="button" className="btn" onClick={hist.undo} disabled={!hist.canUndo}>
            Undo
          </button>
          <button type="button" className="btn" onClick={hist.redo} disabled={!hist.canRedo}>
            Redo
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>

      {status && <div className="status">{status}</div>}

      <main className="main">
        <WorkflowCanvas
          workflow={wf}
          onRequestAdd={openAddMenu}
          onDelete={handleDelete}
          onChangeLabel={handleLabel}
        />
      </main>

      <AddNodeMenu state={addMenu} onSelect={handleAdd} onClose={closeAddMenu} />

      <footer className="footer">
        <div className="footer__hint">
          Tip: Double-click a node label to edit. Use Ctrl/Cmd+Z for undo.
        </div>
      </footer>
    </div>
  );
}
