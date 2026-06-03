// =====================================================================
// DRAG BEHAVIOR
// =====================================================================
//
// Self-contained: no imports from other project files.
//
// POSITION MODEL
//   Positions are stored as workspace-relative percentages { xPercent, yPercent }
//   so the note lands in roughly the same visual area regardless of browser size.
//   The workspace is the <main> element (position: relative in CSS).
//   On load: applyPosition() sets left/top as % strings directly on the element.
//   During drag: work in raw px (offsetLeft/offsetTop + mouse delta), then
//   convert back to % on mouseup before saving.
//
// MOBILE
//   applyPosition() is a no-op on screens ≤ MOBILE_BREAKPOINT.
//   CSS reverts .todo-note to position: static so it stacks naturally.
//
// DRAGGABLE_ITEMS — registry of which elements can be repositioned.
//   Add entries here to make new elements draggable in edit mode.
//   defaultPos must be { xPercent, yPercent } matching the CSS fallback
//   values in main.css (.todo-note left/top defaults).
//
// LayoutStorage — localStorage wrapper for persisting drag positions.
//   Stored format: { [itemId]: { xPercent, yPercent } }
//   Backward compat: old entries had { x, y } (raw px). Those are detected
//   and silently replaced with the item's defaultPos on next load.
//
// makeDraggable(el, item, callbacks)
//   callbacks.onBeforeDrag()              called at mousedown — for undo snapshots
//   callbacks.onAfterDrag(xPct, yPct)    called at mouseup with final % position
//
// syncLayoutPosition(itemId, xPercent, yPercent)
//   Lets todo-note.js keep LayoutStorage current after undo/redo so the
//   next drag starts from the correct baseline.
//
// =====================================================================

// Mobile breakpoint — must match the @media max-width rule in main.css.
const MOBILE_BREAKPOINT = 767;

// Minimum px of the note that must stay visible at each edge while dragging
const GRAB_MARGIN = 60;


export const LayoutStorage = {
  KEY: 'camLayoutPositions',

  load() {
    const saved = localStorage.getItem(this.KEY);
    if (!saved) return {};
    try { return JSON.parse(saved); } catch (e) { return {}; }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};


export const DRAGGABLE_ITEMS = [
  {
    id:         'todo-note',
    selector:   '.todo-note',
    // Workspace-relative percentage defaults — must match the CSS fallback
    // left/top values on .todo-note in main.css.
    defaultPos: { xPercent: 65, yPercent: 40 },
  },
  // Add more draggable elements here:
  // { id: 'hero', selector: '#hero', defaultPos: { xPercent: 5, yPercent: 5 } },
];


// Returns the workspace element (<main>) used as the positioning reference.
function _getWorkspace() {
  return document.querySelector('main');
}


// Apply a percentage position to an element.
// No-op on mobile — CSS handles static flow there.
export function applyPosition(el, pos) {
  if (window.innerWidth <= MOBILE_BREAKPOINT) return;
  el.style.left = pos.xPercent + '%';
  el.style.top  = pos.yPercent + '%';
}


export function makeDraggable(el, item, callbacks = {}) {
  const handle = el.querySelector('.edit-drag-handle');
  if (!handle) return;

  let startMouseX, startMouseY, startLeft, startTop;

  function onMouseMove(e) {
    const workspace = _getWorkspace();
    if (!workspace) return;

    const newLeft = startLeft + (e.clientX - startMouseX);
    const newTop  = startTop  + (e.clientY - startMouseY);

    // Clamp so at least GRAB_MARGIN px of the note stays visible at each edge
    const clampedLeft = Math.max(
      -(el.offsetWidth  - GRAB_MARGIN),
      Math.min(newLeft, workspace.offsetWidth  - GRAB_MARGIN)
    );
    const clampedTop = Math.max(
      -(el.offsetHeight - GRAB_MARGIN),
      Math.min(newTop,  workspace.offsetHeight - GRAB_MARGIN)
    );

    el.style.left = clampedLeft + 'px';
    el.style.top  = clampedTop  + 'px';
  }

  function onMouseUp(e) {
    const workspace = _getWorkspace();
    let xPercent = item.defaultPos.xPercent;
    let yPercent = item.defaultPos.yPercent;

    if (workspace) {
      // Convert the final px position back to workspace-relative percentages
      const leftPx = parseFloat(el.style.left) || el.offsetLeft;
      const topPx  = parseFloat(el.style.top)  || el.offsetTop;
      xPercent = leftPx / workspace.offsetWidth  * 100;
      yPercent = topPx  / workspace.offsetHeight * 100;
    }

    const layout    = LayoutStorage.load();
    layout[item.id] = { xPercent, yPercent };
    LayoutStorage.save(layout);

    if (callbacks.onAfterDrag) callbacks.onAfterDrag(xPercent, yPercent);

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    el.classList.remove('is-dragging');
  }

  handle.addEventListener('mousedown', function (e) {
    e.preventDefault();
    if (window.innerWidth <= MOBILE_BREAKPOINT) return; // no drag on mobile

    if (callbacks.onBeforeDrag) callbacks.onBeforeDrag();

    const layout = LayoutStorage.load();
    const saved  = layout[item.id];

    // Backward compat: old format stored raw { x, y } px values.
    // If detected, use the element's current offsetLeft/offsetTop instead.
    const hasValidFormat = saved && saved.xPercent != null;

    startMouseX = e.clientX;
    startMouseY = e.clientY;
    // Use the element's current rendered position as the drag start point
    startLeft   = el.offsetLeft;
    startTop    = el.offsetTop;

    if (!hasValidFormat) {
      // Seed LayoutStorage with the current rendered position so the next
      // drag has a valid baseline even before the user releases the mouse
      const workspace = _getWorkspace();
      if (workspace) {
        const layout2       = LayoutStorage.load();
        layout2[item.id]    = {
          xPercent: startLeft / workspace.offsetWidth  * 100,
          yPercent: startTop  / workspace.offsetHeight * 100,
        };
        LayoutStorage.save(layout2);
      }
    }

    el.classList.add('is-dragging');
    document.body.style.cursor     = 'grabbing';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  });
}


export function addDragHandle(el) {
  const handle       = document.createElement('div');
  handle.className   = 'edit-drag-handle';
  handle.title       = 'Drag to reposition';
  handle.textContent = '⠿'; // braille dot grid — common drag icon
  el.appendChild(handle);
}


// Lets todo-note.js sync LayoutStorage after undo/redo restores a position,
// so the next drag always starts from the correct saved baseline.
export function syncLayoutPosition(itemId, xPercent, yPercent) {
  const layout   = LayoutStorage.load();
  layout[itemId] = { xPercent, yPercent };
  LayoutStorage.save(layout);
}
