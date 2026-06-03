// =====================================================================
// TO-DO OFFICIAL STATE — Supabase data operations
// =====================================================================
//
// All database reads and writes for the to-do note live here.
// Visitors: only loadOfficialTodoState() runs for them.
// Admin:    saveOfficialTodoState() and createTodoVersionSnapshot()
//           are called from admin.js after login.
//
// Saved object shape (matches public.site_state.value):
//   {
//     title: string,
//     items: [ { id, text, completed } ],
//     layout: { xPercent, yPercent, rotation }
//   }
//
// BACKWARD COMPATIBILITY
//   Older records may have layout: { x, y, rotation } (raw pixel coordinates).
//   applyOfficialState() detects this and falls back to DEFAULT_NOTE_POS so
//   the note still appears in a reasonable place. The schema is not changed —
//   the next admin save will write the new xPercent/yPercent format.
//
// =====================================================================

import { db, STATE_KEY }                                      from './supabase-client.js';
import { workingState, setOfficialDefaults, loadList,
         renderList, applyLayoutToDOM, DEFAULT_NOTE_POS }     from './to-do-note.js';


// ------------------------------------------------------------------
// loadOfficialTodoState
// Fetches the site_state row for the to-do note.
// Returns the JSONB value object, or null on error / row not found.
// ------------------------------------------------------------------
export async function loadOfficialTodoState() {
  try {
    const { data, error } = await db
      .from('site_state')
      .select('value')
      .eq('key', STATE_KEY)
      .single();

    if (error) throw error;
    return data.value;
  } catch (err) {
    console.warn('[supabase] Could not load official todo state:', err.message);
    return null;
  }
}


// ------------------------------------------------------------------
// applyOfficialState
// Called by app.js after a successful loadOfficialTodoState().
// Updates the official defaults, re-renders the list, and positions
// the note card using the saved layout percentages.
// ------------------------------------------------------------------
export function applyOfficialState(state) {
  if (!state) return;

  if (state.items) {
    setOfficialDefaults(state.items);
    // Visitor's localStorage copy takes priority if it exists
    workingState.items = loadList();
    renderList();
  }

  if (state.layout) {
    let xPercent, yPercent;

    if (state.layout.xPercent != null && state.layout.yPercent != null) {
      // New format: workspace-relative percentages
      xPercent = state.layout.xPercent;
      yPercent = state.layout.yPercent;
    } else {
      // Old format: raw pixel coordinates { x, y }.
      // Cannot accurately convert without knowing the original viewport, so
      // fall back to the default position. Next admin save writes the new format.
      console.info('[layout] Old pixel layout detected; using default position.');
      xPercent = DEFAULT_NOTE_POS.xPercent;
      yPercent = DEFAULT_NOTE_POS.yPercent;
    }

    const rotation = state.layout.rotation ?? DEFAULT_NOTE_POS.rotation;
    const layout   = { xPercent, yPercent, rotation };

    applyLayoutToDOM(layout);
    // Keep workingState.layout in sync so the first undo snapshot is correct
    workingState.layout = layout;
  }
}


// ------------------------------------------------------------------
// saveOfficialTodoState
// Reads current working state and upserts it to site_state.
// Also inserts a version snapshot. Admin only (enforced by RLS).
// Returns { ok: true } or { ok: false, error: string }.
// ------------------------------------------------------------------
export async function saveOfficialTodoState(versionNote) {
  const items = workingState.items.map(function (item, i) {
    return { id: String(i + 1), text: item.text, completed: item.done };
  });

  const state = {
    title:  'To-Dos',
    items,
    // Store workspace-relative percentages; rotation is a fixed visual style
    layout: {
      xPercent: workingState.layout.xPercent,
      yPercent: workingState.layout.yPercent,
      rotation: workingState.layout.rotation ?? DEFAULT_NOTE_POS.rotation,
    },
  };

  try {
    const { error } = await db
      .from('site_state')
      .upsert({ key: STATE_KEY, value: state }, { onConflict: 'key' });

    if (error) throw error;

    await createTodoVersionSnapshot(state, versionNote || 'manual save');
    return { ok: true, state };
  } catch (err) {
    console.error('[supabase] Save failed:', err.message);
    return { ok: false, error: err.message };
  }
}


// ------------------------------------------------------------------
// createTodoVersionSnapshot
// Inserts a history row into site_versions.
// Called automatically by saveOfficialTodoState; also exported so
// it can be called standalone from the browser console.
// ------------------------------------------------------------------
export async function createTodoVersionSnapshot(state, note) {
  try {
    const { error } = await db
      .from('site_versions')
      .insert({ state_key: STATE_KEY, value: state, version_note: note || '' });

    if (error) throw error;
  } catch (err) {
    // Non-fatal: the main save already succeeded
    console.warn('[supabase] Version snapshot failed:', err.message);
  }
}
