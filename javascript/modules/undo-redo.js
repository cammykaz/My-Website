// =====================================================================
// UNDO / REDO — generic utility, no DOM or project-specific code
// =====================================================================
//
// createUndoSystem({ getState, applyState, maxHistory })
//
//   getState()        — called to capture a snapshot of current state.
//                       Must return a value safe to JSON-stringify.
//   applyState(snap)  — called to restore the UI from a snapshot.
//   maxHistory        — max undo entries before oldest is dropped (default 50).
//
// Returns: { takeSnapshot, undo, redo, clearHistory }
//
//   takeSnapshot()  — call BEFORE making a change. Deduplicates: won't push
//                     if the state is identical to the previous snapshot.
//   undo()          — restore previous snapshot; saves current for redo.
//   redo()          — re-apply a previously undone snapshot.
//   clearHistory()  — wipe both stacks (used on thumbtack reset).
//
// =====================================================================

export function createUndoSystem({ getState, applyState, maxHistory = 50 }) {
  const undoStack = [];
  const redoStack = [];

  function takeSnapshot() {
    const snap = getState();

    // Don't push if nothing changed since the last snapshot
    if (undoStack.length > 0 &&
        JSON.stringify(undoStack[undoStack.length - 1]) === JSON.stringify(snap)) {
      return;
    }

    undoStack.push(snap);
    if (undoStack.length > maxHistory) undoStack.shift(); // drop oldest
    redoStack.length = 0; // new action discards the redo branch
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(getState());
    applyState(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(getState());
    applyState(redoStack.pop());
  }

  function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return { takeSnapshot, undo, redo, clearHistory };
}
