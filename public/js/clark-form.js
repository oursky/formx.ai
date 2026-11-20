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
 *    script shows it in the visible form, above the Send button. If it is on
 *    the page but not ticked, the visitor is asked to tick it and nothing is
 *    sent (Netlify would drop the entry). If it is missing (e.g. its script is
 *    blocked) the form still sends and Netlify decides, so nobody is locked out.
 *  - Valid entries are posted in the background; the page then shows its own
 *    thank-you message as before.
 */
(function () {
  'use strict';

  var FORM_NAME = 'clark-demo';
  var CAPTCHA_W = 304; // Google's widget size, in px
  var CAPTCHA_H = 78;

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

    var state = { id: null };
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
            callback: function () { clearHint(form); }
          });
        } catch (err) { /* widget unavailable: the form still sends, Netlify decides */ }
        return;
      }
      if (++tries < 150) setTimeout(render, 100); // wait up to ~15s for Google's script
      else box.remove(); // never loaded (e.g. blocked): don't leave an empty gap
    })();
  }

  // The widget's answer, '' if not ticked, or null if there is no working widget.
  function captchaResponse(form) {
    var state = form.__clarkCaptcha;
    if (!state || state.id === null || !window.grecaptcha) return null;
    try { return window.grecaptcha.getResponse(state.id) || ''; } catch (err) { return null; }
  }

  function showHint(form) {
    if (form.querySelector('.recaptcha-hint')) return;
    var hint = document.createElement('p');
    hint.className = 'recaptcha-hint';
    hint.setAttribute('role', 'alert');
    hint.style.cssText = 'margin:0;font-size:14px;color:#b42318';
    hint.textContent = 'Please tick the box above to confirm you’re human.';
    var button = form.querySelector('button');
    button.parentNode.insertBefore(hint, button);
  }

  function clearHint(form) {
    var hint = form.querySelector('.recaptcha-hint');
    if (hint) hint.remove();
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

    var token = captchaResponse(form);
    if (token === '') { // widget is there but not ticked
      e.preventDefault();
      e.stopPropagation();
      showHint(form);
      return;
    }
    clearHint(form);

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
    if (token) body.append('g-recaptcha-response', token);

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
