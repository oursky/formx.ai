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
 *  - 1.5 seconds after the thank-you shows, the visitor goes on to the Clark
 *    demo booking page (Calendly), as on /schedule-demo/. Bot entries stay on
 *    the thank-you.
 */
(function () {
  'use strict';

  var FORM_NAME = 'clark-demo';
  // After the thank-you shows, go to the Clark demo booking page (Calendly),
  // the same journey as /schedule-demo/ (1.5 seconds on the thank-you).
  var BOOKING_URL = 'https://go.formx.ai/clark-schedule-demo';
  var REDIRECT_DELAY = 1500;
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
        // Then on to booking a time, as on /schedule-demo/.
        setTimeout(function () { window.location.href = BOOKING_URL; }, REDIRECT_DELAY);
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

  // ---- In-page links ("Book a demo", nav, "See how it works") -------------

  // A plain jump can stop short or run past its section: on /clark/ the
  // scroll-driven chat demos get shorter as the page scrolls past them, so
  // every section below them moves up mid-scroll. Keep aiming at the
  // section's current spot until the page settles there.

  // The Clark page section a "#id" or "#id?distinct_id=…" fragment points to.
  function sectionFor(hash) {
    var m = /^#([^?]+)/.exec(hash || '');
    if (!m) return null;
    var id = m[1];
    try { id = decodeURIComponent(id); } catch (err) { /* keep as is */ }
    if (id === 'early-access') id = 'book-a-demo'; // the form's old name, for links shared before the rename
    var el = document.getElementById(id);
    return el && el.closest('#page') ? { el: el, hash: '#' + id } : null;
  }

  // Scroll to the section: eased over up to a second (instantly with
  // `instant`, or when the visitor prefers reduced motion), then hold on it
  // until it stops moving. Scrolling by the visitor takes over at once.
  var currentScroll = 0; // a new scroll cancels one still in progress
  function scrollToSection(target, instant) {
    var me = ++currentScroll;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Where the page should stop: wherever the browser's own jump to the
    // section would land (scroll-margin and page zoom included). Measured with
    // an instant jump and straight back, in the same frame, so nothing is
    // painted in between.
    function spot() {
      var y = window.pageYOffset;
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      var s = window.pageYOffset;
      window.scrollTo({ top: y, behavior: 'instant' });
      return s;
    }
    function jump(y) { window.scrollTo({ top: Math.round(y), behavior: 'instant' }); }
    var from = window.pageYOffset, start = null, still = 0, frames = 0, stopped = false;
    var duration = instant || reduce ? 0 : Math.min(1000, 450 + Math.abs(spot() - from) / 20);
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function stop() { stopped = true; ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, stop, true); }); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, stop, true); });
    requestAnimationFrame(function step(now) {
      if (stopped || me !== currentScroll || ++frames > 240) return stop(); // at most ~4s
      if (start === null) start = now;
      var t = duration ? Math.min(1, (now - start) / duration) : 1;
      var aim = spot(); // re-read every frame: the section may have moved
      jump(from + (aim - from) * ease(t));
      if (t === 1) { if (Math.abs(window.pageYOffset - aim) <= 1) { if (++still > 12) return stop(); } else still = 0; }
      requestAnimationFrame(step);
    });
  }

  // Clicks. Also handles links a tag has rewritten to "#section?distinct_id=…"
  // or to a full URL with that fragment. Runs before the site's own
  // ?distinct_id fix (Analytics.astro), which then leaves these clicks alone.
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self')) return;
    var url;
    try { url = new URL(a.href); } catch (err) { return; }
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    var s = sectionFor(url.hash);
    if (!s) return;
    e.preventDefault();
    if (location.hash !== s.hash) history.pushState(history.state, '', location.pathname + location.search + s.hash);
    scrollToSection(s.el, false);
  }, true);

  // Opening a page at a section (e.g. /clark/#security, or with
  // ?distinct_id=… after it): the browser jumps there before the chat demos
  // have settled, so settle onto the section once the page has loaded. The
  // site's ?distinct_id fix tidies the address on load first.
  function settleOnLanding() {
    var s = sectionFor(location.hash);
    if (!s) return;
    if (location.hash !== s.hash) history.replaceState(history.state, '', location.pathname + location.search + s.hash);
    scrollToSection(s.el, true);
  }
  if (document.readyState === 'complete') settleOnLanding();
  else window.addEventListener('load', settleOnLanding);
})();
