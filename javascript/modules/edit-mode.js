// =====================================================================
// EDIT MODE — toolbar and draggable element setup
// =====================================================================
//
// Only activates when the URL contains #edit.
// Normal visitors never see any of this — initEditMode() is only
// called from app.js when the hash check passes.
//
// initEditMode({ onBeforeDrag, onAfterDrag, onResetNotePosition })
//   Builds the edit toolbar, enables body.edit-mode CSS class,
//   and wires up draggable elements from DRAGGABLE_ITEMS.
//   Callbacks are injected by app.js so drag.js stays independent
//   of todo-note.js (no circular imports).
//
// =====================================================================

import { LayoutStorage, DRAGGABLE_ITEMS,
         applyPosition, makeDraggable, addDragHandle } from './drag.js';


// ------------------------------------------------------------------
// initEditMode
// Entry point — called by app.js when #edit is in the URL.
//
// callbacks.onBeforeDrag()                   snapshot working state before drag
// callbacks.onAfterDrag(xPct, yPct)          update working state after drag
// callbacks.onResetNotePosition(defaultPos)  reset workingState layout to default
// ------------------------------------------------------------------
export function initEditMode(callbacks = {}) {
  document.body.classList.add('edit-mode');
  _buildToolbar(callbacks);

  const savedLayout = LayoutStorage.load();

  DRAGGABLE_ITEMS.forEach(function (item) {
    const el = document.querySelector(item.selector);
    if (!el) return;

    addDragHandle(el);

    // Restore saved position if it uses the current xPercent/yPercent format;
    // otherwise fall back to the item's default (silently ignores old x/y values)
    const saved = savedLayout[item.id];
    const pos   = (saved && saved.xPercent != null) ? saved : item.defaultPos;
    applyPosition(el, pos);

    makeDraggable(el, item, callbacks);
  });
}


// ------------------------------------------------------------------
// _buildToolbar (private)
// Injects the edit mode control bar into the DOM.
// admin.js may later augment this toolbar with admin-specific buttons.
// ------------------------------------------------------------------
function _buildToolbar(callbacks) {
  const bar  = document.createElement('div');
  bar.id     = 'edit-toolbar';
  bar.innerHTML = `
    <span class="edit-toolbar-label"># edit mode</span>
    <button id="edit-reset-pos-btn">Reset note position</button>
    <button id="edit-reset-btn">Reset layout</button>
    <button id="edit-copy-btn">Copy layout JSON</button>
  `;
  document.body.appendChild(bar);

  // Reset note position: clears the note's saved position and returns it to default
  document.getElementById('edit-reset-pos-btn').addEventListener('click', function () {
    const noteItem = DRAGGABLE_ITEMS.find(function (i) { return i.id === 'todo-note'; });
    if (!noteItem) return;

    const el = document.querySelector(noteItem.selector);
    const pos = noteItem.defaultPos;

    // Remove the saved position from localStorage
    const layout = LayoutStorage.load();
    delete layout[noteItem.id];
    LayoutStorage.save(layout);

    // Snap the note back to the default percentage position
    if (el) applyPosition(el, pos);

    // Notify app.js so workingState.layout stays in sync
    if (callbacks.onResetNotePosition) callbacks.onResetNotePosition(pos);
  });

  // Reset layout: clear all saved positions and snap every item to its default
  document.getElementById('edit-reset-btn').addEventListener('click', function () {
    LayoutStorage.clear();
    DRAGGABLE_ITEMS.forEach(function (item) {
      const el = document.querySelector(item.selector);
      if (el) applyPosition(el, item.defaultPos);
    });
  });

  // Copy: write current positions to clipboard as JSON
  document.getElementById('edit-copy-btn').addEventListener('click', function () {
    const json = JSON.stringify(LayoutStorage.load(), null, 2);
    navigator.clipboard.writeText(json).then(function () {
      const btn = document.getElementById('edit-copy-btn');
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(function () { btn.textContent = original; }, 1800);
    });
  });
}
