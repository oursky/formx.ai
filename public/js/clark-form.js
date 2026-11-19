/*
 * clark-form.js
 * Sends the "Let's look at your documents together" form on the Clark pages to
 * Netlify Forms (form name "clark-demo"), the same way the site's other demo
 * forms post. Works alongside the page's own Component without changing it:
 *
 *  - Name and work email are required. If they are missing or invalid, the
 *    browser's usual "Please fill in" message shows and the thank-you does not.
 *  - A hidden honeypot field ("bot-field") catches spam bots. Bot entries see
 *    the thank-you message but nothing is sent.
 *  - Valid entries are posted in the background; the page then shows its own
 *    thank-you message as before.
 */
(function () {
  'use strict';

  var FORM_NAME = 'clark-demo';

  function clarkForm(el) {
    var form = el && el.closest && el.closest('#page form');
    return form && form.querySelector('input[name="email"]') ? form : null;
  }

  function addHoneypot(form) {
    if (form.querySelector('[name="bot-field"]')) return;
    var p = document.createElement('p');
    p.style.display = 'none';
    p.setAttribute('aria-hidden', 'true');
    p.innerHTML = '<label>Don’t fill this out: <input name="bot-field" type="text" tabindex="-1" autocomplete="off"></label>';
    form.insertBefore(p, form.firstChild);
  }

  function showFailure(form) {
    var msg = document.createElement('p');
    msg.setAttribute('role', 'alert');
    msg.style.cssText = 'margin:0;font-size:14px;color:#b42318';
    msg.textContent = 'Sorry, something went wrong while sending your details. Please email us at hello@formx.ai.';
    form.appendChild(msg);
  }

  function prepare() {
    document.querySelectorAll('#page form').forEach(function (form) {
      if (!clarkForm(form)) return;
      addHoneypot(form);
      ['name', 'email'].forEach(function (n) {
        var input = form.querySelector('[name="' + n + '"]');
        if (input) input.required = true;
      });
    });
  }

  // Capture phase on document: runs before the page's own click handler on the
  // button, so an invalid form can be stopped before the thank-you shows.
  document.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('button');
    var form = button && clarkForm(button);
    if (!form || button.closest('[aria-hidden="true"]')) return;
    prepare();

    if (!form.reportValidity()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Read the values now: the page removes the inputs when it shows the thank-you.
    var data = new FormData(form);
    if ((data.get('bot-field') || '').toString().trim()) return; // bot: show thanks, send nothing

    var body = new URLSearchParams();
    body.append('form-name', FORM_NAME);
    ['name', 'email', 'company', 'team'].forEach(function (n) {
      body.append(n, (data.get(n) || '').toString().trim());
    });
    body.append('page', location.pathname);
    body.append('bot-field', '');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Form submission rejected: ' + res.status);
        if (window.plausible) window.plausible('contact-form-submit', { props: { location: 'clark-form' } });
      })
      .catch(function () { showFailure(form); });
  }, true);

  // Stop Enter-to-submit from reloading the page.
  document.addEventListener('submit', function (e) {
    if (clarkForm(e.target)) e.preventDefault();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepare);
  else prepare();
})();
