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
 *  - reCAPTCHA, as on the site's other demo forms (PR #24): Netlify puts
 *    Google's widget in the hidden "clark-demo" form at deploy time; this
 *    script shows it in the visible form, above the Send button. Netlify drops
 *    entries without a ticked box but still replies "OK", so nothing is sent
 *    unless the box is ticked:
 *      - not ticked yet: the visitor is asked to tick it;
 *      - still loading: the visitor is asked to wait a moment;
 *      - could not load (e.g. blocked): the visitor is asked to email us.
 *    On a deploy without reCAPTCHA (no widget in the hidden form) the form
 *    sends as normal.
 *  - The thank-you only shows once Netlify has accepted the entry. While
 *    sending, the button says "Sending…"; if sending fails, the form stays and
 *    an error with our email address shows instead.
 */
(function () {
  'use strict';

  var FORM_NAME = 'clark-demo';
  var CAPTCHA_W = 304; // Google's widget size, in px
  var CAPTCHA_H = 78;
  var MSG = {
    tick: 'Please tick the box above to confirm you’re human.',
    loading: 'The “I’m not a robot” box is still loading. Please try again in a moment.',
    unavailable: 'The “I’m not a robot” box couldn’t load, so we can’t send this form. Please email us at hello@formx.ai.',
    failed: 'Sorry, something went wrong while sending your details. Please try again or email us at hello@formx.ai.',
    sending: 'Sending…'
  };

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

  // One message line above the Send button, for reCAPTCHA hints and errors.
  function showMessage(form, text) {
    var msg = form.querySelector('.clark-form-msg');
    var button = form.querySelector('button');
    if (!msg) {
      if (!button) return;
      msg = document.createElement('p');
      msg.className = 'clark-form-msg';
      msg.setAttribute('role', 'alert');
      msg.style.cssText = 'margin:0;font-size:14px;color:#b42318';
      button.parentNode.insertBefore(msg, button);
    }
    msg.textContent = text;
  }

  function clearMessage(form) {
    var msg = form.querySelector('.clark-form-msg');
    if (msg) msg.remove();
  }

  // ---- reCAPTCHA -----------------------------------------------------------

  // The widget placeholder Netlify added to the hidden "clark-demo" form.
  function captchaSource() {
    return document.querySelector('form[name="' + FORM_NAME + '"] [data-sitekey]');
  }

  // Shrink the widget on narrow screens so it never causes sideways scrolling.
  function fitCaptcha(box) {
    var inner = box.firstChild;
    var scale = Math.min(1, (box.clientWidth || CAPTCHA_W) / CAPTCHA_W);
    inner.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    box.style.height = Math.ceil(CAPTCHA_H * scale) + 'px';
  }

  function setupCaptcha(form) {
    if (form.__clarkCaptcha) return;
    var source = captchaSource();
    var button = form.querySelector('button');
    if (!source || !button) return;
    var sitekey = source.getAttribute('data-sitekey');
    // Stop Google auto-drawing a second, invisible widget in the hidden form.
    if (!source.firstChild) source.classList.remove('g-recaptcha');

    var box = document.createElement('div');
    box.className = 'clark-recaptcha';
    box.style.cssText = 'width:100%;overflow:hidden;height:' + CAPTCHA_H + 'px';
    var inner = document.createElement('div');
    inner.style.cssText = 'width:' + CAPTCHA_W + 'px;transform-origin:0 0';
    box.appendChild(inner);
    button.parentNode.insertBefore(box, button);

    // id: Google's widget id once drawn; failed: the widget can't be drawn.
    var state = { id: null, failed: false };
    form.__clarkCaptcha = state;
    fitCaptcha(box);
    if (window.ResizeObserver) new ResizeObserver(function () { if (box.isConnected) fitCaptcha(box); }).observe(box);
    else window.addEventListener('resize', function () { if (box.isConnected) fitCaptcha(box); });

    var tries = 0;
    (function render() {
      if (!box.isConnected) return;
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        try {
          state.id = window.grecaptcha.render(inner, {
            sitekey: sitekey,
            callback: function () { clearMessage(form); }
          });
        } catch (err) {
          state.failed = true;
          box.remove();
        }
        return;
      }
      if (++tries < 150) setTimeout(render, 100); // wait up to ~15s for Google's script
      else { state.failed = true; box.remove(); } // never loaded (e.g. blocked): don't leave an empty gap
    })();
  }

  // What to do about reCAPTCHA before sending:
  //   { token: '...' } ticked, or { token: null } no reCAPTCHA on this deploy;
  //   { block: MSG.x } don't send, show this message instead.
  function captchaCheck(form) {
    if (!captchaSource()) return { token: null };
    var state = form.__clarkCaptcha;
    if (!state || state.failed || (state.id !== null && !window.grecaptcha)) return { block: MSG.unavailable };
    if (state.id === null) return { block: MSG.loading };
    var token;
    try { token = window.grecaptcha.getResponse(state.id); } catch (err) { return { block: MSG.unavailable }; }
    return token ? { token: token } : { block: MSG.tick };
  }

  // ---- Form ----------------------------------------------------------------

  function prepare() {
    document.querySelectorAll('#page form').forEach(function (form) {
      if (!clarkForm(form)) return;
      addHoneypot(form);
      ['name', 'email'].forEach(function (n) {
        var input = form.querySelector('[name="' + n + '"]');
        if (input) input.required = true;
      });
      setupCaptcha(form);
    });
  }

  function setSending(form, button, on) {
    form.__clarkSending = on;
    button.disabled = on;
    if (on) { button.__clarkLabel = button.textContent; button.textContent = MSG.sending; }
    else if (button.__clarkLabel) button.textContent = button.__clarkLabel;
  }

  // Capture phase on document: runs before the page's own click handler on the
  // button (which shows the thank-you), so that handler only runs once the
  // entry has been accepted.
  document.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('button');
    var form = button && clarkForm(button);
    if (!form || button.closest('[aria-hidden="true"]')) return;

    // Our own replayed click after a successful send: let the page show its thank-you.
    if (form.__clarkSent) { form.__clarkSent = false; return; }

    function hold() { e.preventDefault(); e.stopPropagation(); }

    prepare();
    if (form.__clarkSending) { hold(); return; } // already sending: ignore extra clicks

    if (!form.reportValidity()) { hold(); return; }

    var check = captchaCheck(form);
    if (check.block) { hold(); showMessage(form, check.block); return; }
    clearMessage(form);

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
    if (check.token) body.append('g-recaptcha-response', check.token);

    hold();
    setSending(form, button, true);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Form submission rejected: ' + res.status);
        if (window.plausible) window.plausible('contact-form-submit', { props: { location: 'clark-form' } });
        setSending(form, button, false);
        form.__clarkSent = true;
        button.click(); // let the page's own handler show the thank-you
      })
      .catch(function () {
        setSending(form, button, false);
        // A token can only be used once: reset the box so the visitor can tick it again.
        var state = form.__clarkCaptcha;
        if (check.token && state && state.id !== null) { try { window.grecaptcha.reset(state.id); } catch (err) { /* ignore */ } }
        showMessage(form, MSG.failed);
      });
  }, true);

  // Stop Enter-to-submit from reloading the page.
  document.addEventListener('submit', function (e) {
    if (clarkForm(e.target)) e.preventDefault();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepare);
  else prepare();
})();
