// =====================================================================
// APP — entry point, orchestrates all modules
// =====================================================================
//
// This file imports from the modules/ folder and wires everything together.
// It owns the DOMContentLoaded sequence and the Supabase loading flow.
//
// THREE LAYERS OF STATE (for reference across all modules):
//
//   1. OFFICIAL SUPABASE STATE  (server, read-only for visitors)
//      Loaded once on page load via loadOfficialTodoState().
//      Applied via applyOfficialState(), which updates setOfficialDefaults()
//      and re-renders the list. Only a logged-in admin can change it.
//
//   2. LOCAL WORKING STATE  (workingState in todo-note.js, this session)
//      workingState.items  — current to-do list content
//      workingState.layout — current note card position
//      Updated live as items are typed/checked or the note is dragged.
//      Saved to localStorage on every change so it survives page refresh.
//
//   3. UNDO / REDO HISTORY  (in-memory, session-only)
//      Managed by createUndoSystem in undo-redo.js.
//      Snapshots of working state before each change.
//      Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z or Ctrl+Y = redo.
//
// =====================================================================

import { workingState, loadList, renderList,
         setupThumbtack, setupUndoKeyboard,
         takeUndoSnapshot, readLayoutFromDOM, applyLayoutToDOM }
  from './modules/to-do-note.js';

import { loadOfficialTodoState, applyOfficialState }
  from './modules/to-do-official.js';

import { checkAdminSession, buildAdminControls, buildLoginPanel }
  from './modules/admin.js';

import { initEditMode }
  from './modules/edit-mode.js';

import { initPocketPiano }
  from './modules/pocket-piano.js';


document.addEventListener('DOMContentLoaded', async function () {

  // ---------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------
  initPocketPiano();
  setupThumbtack();
  setupUndoKeyboard();

  // Brief "..." placeholder while the Supabase fetch is in flight
  const ul = document.getElementById('todo-items');
  if (ul) {
    const ph       = document.createElement('li');
    ph.className   = 'todo-loading';
    ph.textContent = '...';
    ul.appendChild(ph);
  }

  // ---------------------------------------------------------------
  // EDIT MODE (synchronous — must run before the async Supabase
  // fetch so the toolbar exists when admin controls are added later)
  // ---------------------------------------------------------------
  const isEditMode = window.location.hash === '#edit';

  if (isEditMode) {
    initEditMode({
      // Before drag: read the real current position as percentages, then snapshot
      onBeforeDrag: function () {
        workingState.layout = readLayoutFromDOM();
        takeUndoSnapshot();
      },
      // After drag: update workingState so the next snapshot includes new position
      onAfterDrag: function (xPercent, yPercent) {
        workingState.layout.xPercent = xPercent;
        workingState.layout.yPercent = yPercent;
      },
      // Reset note position button: snap workingState back to the default layout
      onResetNotePosition: function (defaultPos) {
        workingState.layout.xPercent = defaultPos.xPercent;
        workingState.layout.yPercent = defaultPos.yPercent;
      },
    });
  }

  // ---------------------------------------------------------------
  // LOAD OFFICIAL STATE FROM SUPABASE (all visitors)
  // 3-second fallback: if Supabase doesn't respond, render the
  // hardcoded defaults from todo-note.js instead.
  // ---------------------------------------------------------------
  let supabaseResolved = false;

  const fallbackTimer = setTimeout(function () {
    if (!supabaseResolved) {
      supabaseResolved    = true;
      workingState.items  = loadList();
      renderList();
    }
  }, 3000);

  const officialState = await loadOfficialTodoState();
  clearTimeout(fallbackTimer);

  if (!supabaseResolved) {
    supabaseResolved = true;
    applyOfficialState(officialState); // handles null gracefully
    // If Supabase had nothing (null), fall back to localStorage/hardcoded
    if (!officialState) {
      workingState.items = loadList();
      renderList();
    }
  }

  // ---------------------------------------------------------------
  // ADMIN CHECKS (only in #edit mode)
  // ---------------------------------------------------------------
  if (!isEditMode) return;

  const adminUser = await checkAdminSession();
  adminUser ? buildAdminControls() : buildLoginPanel();
});
