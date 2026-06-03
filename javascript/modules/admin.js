// =====================================================================
// ADMIN — Supabase auth + admin UI panels
// =====================================================================
//
// handleAdminLogin    — email/password sign-in
// checkAdminSession   — validates session AND admin_users membership
// buildAdminControls  — upgrades edit toolbar to "★ cam mode"
// buildLoginPanel     — shows email/password form in #edit mode
//
// buildLoginPanel and buildAdminControls are mutually aware:
// a successful login removes the panel and calls buildAdminControls.
//
// =====================================================================

import { db }                        from './supabase-client.js';
import { saveOfficialTodoState }     from './to-do-official.js';


// ------------------------------------------------------------------
// handleAdminLogin
// Signs in with Supabase email + password.
// Returns { ok: true, user } or { ok: false, error: string }.
// ------------------------------------------------------------------
export async function handleAdminLogin(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}


// ------------------------------------------------------------------
// checkAdminSession
// Returns the current user if there is a valid session AND the user's
// ID is present in the admin_users table. Returns null otherwise.
//
// Uses .maybeSingle() to distinguish two failure modes:
//   error != null → RLS is blocking the SELECT (check your policy)
//   data == null  → query ran fine, user_id not in admin_users table
// ------------------------------------------------------------------
export async function checkAdminSession() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;

  const userId    = session.user.id;
  const userEmail = session.user.email;
  console.log('[supabase] Session user id   :', userId);
  console.log('[supabase] Session user email:', userEmail);

  const { data, error } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('[supabase] admin_users raw response:', JSON.stringify({ data, error }, null, 2));

  if (error) {
    console.error(
      '[supabase] admin_users query FAILED — probable RLS block.\n',
      '  error.code:   ', error.code,    '\n',
      '  error.message:', error.message, '\n',
      '  error.hint:   ', error.hint
    );
    return null;
  }

  if (!data) {
    console.warn(
      '[supabase] Row not found in admin_users for id:', userId, '\n',
      '  SQL to fix:\n',
      "  INSERT INTO public.admin_users (user_id) VALUES ('" + userId + "');"
    );
    return null;
  }

  console.log('[supabase] Admin confirmed ✓', userId);
  return session.user;
}


// ------------------------------------------------------------------
// buildAdminControls
// Upgrades the existing edit toolbar (built by edit-mode.js) to
// show "★ cam mode" and the "Save official version" button.
// Called after a confirmed admin session.
// ------------------------------------------------------------------
export function buildAdminControls() {
  const toolbar = document.getElementById('edit-toolbar');
  if (!toolbar) return;

  const label = toolbar.querySelector('.edit-toolbar-label');
  if (label) label.textContent = '★ cam mode';

  const saveBtn       = document.createElement('button');
  saveBtn.id          = 'edit-save-official-btn';
  saveBtn.className   = 'edit-admin-btn';
  saveBtn.textContent = 'Save official version';
  toolbar.appendChild(saveBtn);

  saveBtn.addEventListener('click', async function () {
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled    = true;

    const result = await saveOfficialTodoState('manual save from edit mode');

    if (result.ok) {
      saveBtn.textContent = '✓ Saved!';
      setTimeout(function () {
        saveBtn.textContent = 'Save official version';
        saveBtn.disabled    = false;
      }, 2200);
    } else {
      saveBtn.textContent = '✗ ' + result.error;
      setTimeout(function () {
        saveBtn.textContent = 'Save official version';
        saveBtn.disabled    = false;
      }, 3500);
    }
  });
}


// ------------------------------------------------------------------
// buildLoginPanel
// Injects an email/password form above the edit toolbar.
// Removed from the DOM after a successful admin login.
// ------------------------------------------------------------------
export function buildLoginPanel() {
  const panel    = document.createElement('div');
  panel.id       = 'admin-login-panel';
  panel.innerHTML = `
    <div class="admin-login-row">
      <span class="edit-toolbar-label">admin login</span>
      <input id="admin-email-input"
             type="email"    placeholder="email"
             autocomplete="email">
      <input id="admin-password-input"
             type="password" placeholder="password"
             autocomplete="current-password">
      <button id="admin-login-btn">Log in</button>
    </div>
    <div id="admin-login-status"></div>
  `;
  document.body.appendChild(panel);

  document.getElementById('admin-login-btn').addEventListener('click', async function () {
    const email    = document.getElementById('admin-email-input').value.trim();
    const password = document.getElementById('admin-password-input').value;
    const status   = document.getElementById('admin-login-status');
    const btn      = document.getElementById('admin-login-btn');

    if (!email || !password) { status.textContent = 'Enter email and password.'; return; }

    btn.textContent    = 'Logging in…';
    btn.disabled       = true;
    status.textContent = '';

    const result = await handleAdminLogin(email, password);

    if (!result.ok) {
      status.textContent = result.error;
      btn.textContent    = 'Log in';
      btn.disabled       = false;
      return;
    }

    const userId    = result.user.id;
    const userEmail = result.user.email;
    console.log('[supabase] Auth login OK');
    console.log('[supabase]   user id   :', userId);
    console.log('[supabase]   user email:', userEmail);
    status.textContent = 'Logged in as ' + userEmail + '. Checking admin table…';

    const adminUser = await checkAdminSession();
    if (!adminUser) {
      status.textContent =
        'Not in admin_users. Your user id: ' + userId +
        ' — open the browser console (F12) for the exact reason and fix.';
      btn.textContent = 'Log in';
      btn.disabled    = false;
      return;
    }

    panel.remove();
    buildAdminControls();
  });
}
