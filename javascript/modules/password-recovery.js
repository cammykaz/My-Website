// =====================================================================
// PASSWORD RECOVERY
// Listens for Supabase PASSWORD_RECOVERY auth events (fired when the
// user arrives via a password-reset email link) and shows a minimal
// "Set new password" panel.  Has no effect on normal page visits.
// =====================================================================

import { db } from './supabase-client.js';


// ------------------------------------------------------------------
// initPasswordRecovery
// Call once on page load.  Registers the onAuthStateChange listener;
// if a recovery session is detected the reset panel is shown.
// ------------------------------------------------------------------
export function initPasswordRecovery() {
  db.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') {
      _showResetPanel();
    }
  });
}


// ------------------------------------------------------------------
// _showResetPanel  (private)
// Builds and appends the reset form.  Guard prevents duplicates.
// ------------------------------------------------------------------
function _showResetPanel() {
  if (document.getElementById('password-reset-panel')) return;

  const panel   = document.createElement('div');
  panel.id      = 'password-reset-panel';
  panel.innerHTML = `
    <div class="admin-login-row">
      <span class="edit-toolbar-label">set new password</span>
    </div>
    <div class="admin-login-row pw-reset-inputs">
      <input id="pw-reset-new"     type="password"
             placeholder="new password"     autocomplete="new-password">
      <input id="pw-reset-confirm" type="password"
             placeholder="confirm password" autocomplete="new-password">
      <button id="pw-reset-btn">Set password</button>
    </div>
    <div id="pw-reset-status"></div>
  `;
  document.body.appendChild(panel);

  document.getElementById('pw-reset-btn')
    .addEventListener('click', _handleReset);

  ['pw-reset-new', 'pw-reset-confirm'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') _handleReset();
    });
  });
}


// ------------------------------------------------------------------
// _handleReset  (private)
// Validates the two password fields, calls updateUser, then signs
// out the recovery session so a fresh login is required.
// ------------------------------------------------------------------
async function _handleReset() {
  const newInput  = document.getElementById('pw-reset-new');
  const confInput = document.getElementById('pw-reset-confirm');
  const status    = document.getElementById('pw-reset-status');
  const btn       = document.getElementById('pw-reset-btn');
  if (!newInput || !confInput || !status || !btn) return;

  const pw1 = newInput.value;
  const pw2 = confInput.value;

  if (!pw1) {
    status.textContent = 'Enter a new password.';
    return;
  }
  if (pw1 !== pw2) {
    status.textContent = 'Passwords do not match.';
    return;
  }

  btn.textContent = 'Setting…';
  btn.disabled    = true;
  status.textContent = '';

  const { error } = await db.auth.updateUser({ password: pw1 });

  if (error) {
    status.textContent = error.message;
    btn.textContent    = 'Set password';
    btn.disabled       = false;
    return;
  }

  // Sign out the recovery session — user must log in fresh with the new password.
  await db.auth.signOut();

  const loginUrl = window.location.origin + window.location.pathname + '#edit';
  document.querySelector('.pw-reset-inputs')?.remove();
  status.innerHTML =
    '✓ Password updated! ' +
    '<a href="' + loginUrl + '" style="color:var(--yellow)">Log in to Cam Mode →</a>';
}
