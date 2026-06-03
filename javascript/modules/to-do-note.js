// =====================================================================
// TO-DO NOTE — working state, rendering, persistence, undo/redo wiring
// =====================================================================
//
// Imports:
//   undo-redo.js  createUndoSystem — generic undo/redo factory
//   drag.js       syncLayoutPosition — keeps LayoutStorage current after undo
//
// THREE STATE LAYERS (defined in detail in app.js header):
//   1. Official Supabase state  → set once via setOfficialDefaults()
//   2. Local working state      → workingState (in-memory + localStorage)
//   3. Undo/redo history        → session-only, managed by createUndoSystem
//
// LAYOUT FORMAT
//   workingState.layout = { xPercent, yPercent, rotation }
//   Positions are workspace-relative percentages (see drag.js for details).
//   On mobile (≤767px) applyLayoutToDOM() is a no-op; CSS handles static flow.
//   Backward compat: if an old Supabase record has only { x, y }, the caller
//   (to-do-official.js) converts it before passing here.
//
// =====================================================================

import { createUndoSystem  } from './undo-redo.js';
import { syncLayoutPosition } from './drag.js';


// Mobile breakpoint — must match the value in drag.js and main.css
const MOBILE_BREAKPOINT = 767;

// Default layout — must match the CSS fallback values on .todo-note in main.css
export const DEFAULT_NOTE_POS = { xPercent: 65, yPercent: 40, rotation: -1.8 };


// -----------------------------------------------------------------------
// OFFICIAL DEFAULTS
// The baseline items shown on first visit and after a thumbtack reset.
// Replaced at runtime by setOfficialDefaults() once Supabase responds.
// -----------------------------------------------------------------------
let _officialDefaults = [
  { text: 'create second sketch',              done: true  },
  { text: 'create to-do list',                 done: true  },
  { text: 'make personalized font',            done: true  },
  { text: 'lay out items in CSS grid',         done: true  },
  { text: 'make piano (hello-p5-song)',         done: false },
  { text: 'add playable filters (like koala)', done: false },
  { text: 'redesign homepage',                 done: false },
  { text: 'add improv video section',          done: false },
  { text: 'add song rental library',           done: false },
  { text: 'add beat playground',               done: false },
  { text: 'play a live show!',                 done: false },
];

// Called by app.js once the official Supabase items are loaded.
// Replaces the hardcoded list so thumbtack reset restores the server version.
export function setOfficialDefaults(supabaseItems) {
  _officialDefaults = supabaseItems.map(function (item) {
    return { text: item.text, done: item.completed };
  });
}

export const STORAGE_KEY = 'camTodoList';


// =====================================================================
// WORKING STATE
// Single source of truth for the current browser session.
// All functions in this module read from and write to this object.
// =====================================================================
export const workingState = {
  items:  [],
  // Workspace-relative percentage positioning; overwritten by Supabase on load.
  layout: { xPercent: DEFAULT_NOTE_POS.xPercent, yPercent: DEFAULT_NOTE_POS.yPercent, rotation: DEFAULT_NOTE_POS.rotation },
};


// =====================================================================
// UNDO / REDO
// createUndoSystem wires getState/applyState to workingState.
// takeUndoSnapshot / undoState / redoState are exported for use by
// the render functions and app.js keyboard handler.
// =====================================================================
const history = createUndoSystem({
  getState:   _cloneState,
  applyState: _applySnapshot,
  maxHistory: 50,
});

export const takeUndoSnapshot = history.takeSnapshot;
export const undoState        = history.undo;
export const redoState        = history.redo;
export const clearUndoHistory = history.clearHistory;

function _cloneState() {
  return {
    items:  workingState.items.map(function (i) {
      return { text: i.text, done: i.done };
    }),
    layout: {
      xPercent: workingState.layout.xPercent,
      yPercent: workingState.layout.yPercent,
      rotation: workingState.layout.rotation,
    },
  };
}

function _applySnapshot(snap) {
  workingState.items  = snap.items;
  workingState.layout = snap.layout;
  renderList();
  applyLayoutToDOM(snap.layout);
  saveList();
}


// =====================================================================
// PERSISTENCE
// saveList  — writes workingState.items to localStorage
// loadList  — returns visitor's saved items, or a copy of the defaults
// =====================================================================

export function saveList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workingState.items));
}

export function loadList() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  return _officialDefaults.map(function (item) {
    return { text: item.text, done: item.done };
  });
}


// =====================================================================
// LAYOUT HELPERS
// Read/write the note card's position.
//
// Desktop: the note is position:absolute within <main>; JS sets left/top
//   via applyPosition(), which converts percent→px with edge clamping so
//   the note stays reachable even if the window shrinks after saving.
// Mobile (≤767px): position:static — applyPosition() is a no-op so the
//   saved desktop position never disrupts the stacked mobile layout.
// =====================================================================

export function applyLayoutToDOM(layout) {
  const note = document.querySelector('.todo-note');
  if (!note) return;

  // Skip absolute positioning on mobile; CSS handles static flow there
  if (window.innerWidth <= MOBILE_BREAKPOINT) return;

  note.style.left = layout.xPercent + '%';
  note.style.top  = layout.yPercent + '%';

  // Keep LayoutStorage in sync so the next drag starts from the right baseline
  syncLayoutPosition('todo-note', layout.xPercent, layout.yPercent);
}

export function readLayoutFromDOM() {
  const note      = document.querySelector('.todo-note');
  const workspace = document.querySelector('main');
  if (!note || !workspace) return { ...DEFAULT_NOTE_POS };

  // Convert the element's current px offset into workspace-relative percentages
  const xPercent = note.offsetLeft / workspace.offsetWidth  * 100;
  const yPercent = note.offsetTop  / workspace.offsetHeight * 100;
  return { xPercent, yPercent, rotation: workingState.layout.rotation ?? DEFAULT_NOTE_POS.rotation };
}


// =====================================================================
// RENDER
// Rebuilds the <ul> from workingState.items.
// Called on: initial load, undo/redo, reset.
// NOT called on every keystroke — contentEditable updates the DOM
// live, and we just update workingState.items in the input handler.
// =====================================================================
export function renderList() {
  const ul = document.getElementById('todo-items');
  if (!ul) return;
  ul.innerHTML = '';

  workingState.items.forEach(function (item, index) {
    const li = document.createElement('li');
    if (item.done) li.classList.add('done');

    // --- Checkbox ---
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked   = item.done;
    checkbox.setAttribute('aria-label', 'Mark as done');

    checkbox.addEventListener('change', function () {
      takeUndoSnapshot();
      workingState.items[index].done = checkbox.checked;
      li.classList.toggle('done', checkbox.checked);
      saveList();
    });

    // --- Text span ---
    const span = document.createElement('span');
    span.className       = 'todo-text';
    span.contentEditable = 'true';
    span.textContent     = item.text;

    // Snapshot before typing starts (on focus).
    // Deduplication in takeUndoSnapshot prevents a push if nothing changed.
    span.addEventListener('focus', function () {
      takeUndoSnapshot();
    });

    // Live update on every keystroke. Empty text is allowed — do NOT restore.
    span.addEventListener('input', function () {
      workingState.items[index].text = span.textContent;
      saveList();
    });

    // Enter = commit (blur), not a line break
    span.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    ul.appendChild(li);
  });
}


// =====================================================================
// RESET (thumbtack click)
// Clears localStorage, wipes undo history, and re-renders from defaults.
// =====================================================================
export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  clearUndoHistory();
  workingState.items = _officialDefaults.map(function (item) {
    return { text: item.text, done: item.done };
  });
  renderList();
}


// =====================================================================
// THUMBTACK SETUP
// =====================================================================
export function setupThumbtack() {
  const tack = document.getElementById('todo-thumbtack');
  if (!tack) return;
  tack.addEventListener('click', function () {
    tack.classList.add('tack-wiggle');
    tack.addEventListener('animationend', function onEnd() {
      tack.classList.remove('tack-wiggle');
      tack.removeEventListener('animationend', onEnd);
      resetToDefaults();
    });
  });
}


// =====================================================================
// KEYBOARD SHORTCUTS  Cmd/Ctrl+Z = undo, +Shift+Z or Ctrl+Y = redo
//
// Suppressed when focus is inside a .todo-text contentEditable span —
// the browser's own text undo handles character-level undoes there.
// Once the span is blurred, these shortcuts operate on the full
// working-state undo history.
// =====================================================================
export function setupUndoKeyboard() {
  document.addEventListener('keydown', function (e) {
    const isMac = /mac/i.test(navigator.platform);
    const mod   = isMac ? e.metaKey : e.ctrlKey;
    if (!mod) return;

    const active = document.activeElement;
    if (active && active.classList.contains('todo-text')) return;
    if (active && (
      active.id === 'admin-email-input'    ||
      active.id === 'admin-password-input' ||
      active.id === 'mce-EMAIL'
    )) return;

    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      e.shiftKey ? redoState() : undoState();
      return;
    }

    // Ctrl+Y — Windows redo convention
    if (!isMac && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      redoState();
    }
  });
}
