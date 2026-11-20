/*
 * clark-runtime.js
 * A tiny renderer for the FormX.ai Clark pages. It reads the page template
 * (inside <template id="page-template">), fills in {{values}} from the page's
 * Component class, and keeps them up to date when setState() is called.
 *
 * Supported template features (the only ones the Clark pages use):
 *   {{name}} / {{item.name}}      text and attribute values
 *   onClick="{{fn}}"              event handlers (any on<Event>)
 *   ref="{{fn}}"                  called once with the element after it is added
 *   <sc-if value="{{flag}}">      show children only when flag is truthy
 *   <sc-for list="{{items}}" as="item">  repeat children for each item ({{$index}} available)
 *   hint-* attributes             ignored (design-tool placeholders)
 */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch, cb) {
      const v = typeof patch === 'function' ? patch(this.state, this.props) : patch;
      if (!v) return;
      this.state = Object.assign({}, this.state, v);
      if (this.__renderer) this.__renderer.schedule();
      if (cb) Promise.resolve().then(cb);
    }
    forceUpdate() { if (this.__renderer) this.__renderer.schedule(); }
  }
  window.DCLogic = DCLogic;

  const ONE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;
  const ANY = /\{\{\s*([^}]*?)\s*\}\}/g;
  const has = (s) => typeof s === 'string' && s.indexOf('{{') !== -1;

  function lookup(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    let v = scope;
    for (const k of path.split('.')) { if (v == null) return undefined; v = v[k]; }
    return v;
  }
  function evaluate(str, scope) {
    const m = str.match(ONE);
    if (m) return lookup(scope, m[1]);
    return str.replace(ANY, (_, e) => { const v = lookup(scope, e); return v == null ? '' : String(v); });
  }

  // Walk a freshly cloned node, turning template markers into live bindings.
  function walk(node, binds) {
    if (node.nodeType === 3) {
      if (has(node.data)) {
        const src = node.data; let last = null;
        binds.push({ u(scope) { const v = evaluate(src, scope); const s = v == null ? '' : String(v); if (s !== last) { last = s; node.data = s; } } });
      }
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'sc-if' || tag === 'sc-for') {
      const anchor = document.createComment(tag);
      node.parentNode.replaceChild(anchor, node);
      const tpl = Array.from(node.childNodes);
      binds.push(tag === 'sc-if'
        ? makeIf(anchor, node.getAttribute('value') || '', tpl)
        : makeFor(anchor, node.getAttribute('list') || '', node.getAttribute('as') || 'item', tpl));
      return;
    }
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name, src = attr.value;
      if (name.indexOf('hint-') === 0) { node.removeAttribute(name); continue; }
      if (!has(src)) continue;
      if (name.indexOf('on') === 0 && name.length > 2) {
        node.removeAttribute(name);
        const ev = name.slice(2).toLowerCase(); const box = { fn: null };
        node.addEventListener(ev, (e) => {
          if (ev === 'click' && node.form && (node.type === 'submit' || node.tagName === 'BUTTON' && !node.getAttribute('type'))) e.preventDefault();
          if (typeof box.fn === 'function') box.fn(e);
        });
        binds.push({ u(scope) { box.fn = evaluate(src, scope); } });
      } else if (name === 'ref') {
        node.removeAttribute(name);
        let done = false, fn = null;
        binds.push({
          u(scope) { if (!done) { fn = evaluate(src, scope); if (typeof fn === 'function') fn(node); done = true; } },
          d() { if (typeof fn === 'function') fn(null); }
        });
      } else {
        let last = null;
        node.removeAttribute(name);
        binds.push({ u(scope) { const v = evaluate(src, scope); const s = v == null || v === false ? '' : String(v); if (s !== last) { last = s; node.setAttribute(name, s); } } });
      }
    }
    for (const child of Array.from(node.childNodes)) walk(child, binds);
  }

  function instantiate(tpl, parent, before) {
    const frag = document.createDocumentFragment();
    tpl.forEach((n) => frag.appendChild(n.cloneNode(true)));
    const binds = [];
    Array.from(frag.childNodes).forEach((n) => walk(n, binds));
    const top = Array.from(frag.childNodes);
    parent.insertBefore(frag, before || null);
    return {
      update(scope) { for (let i = 0; i < binds.length; i++) binds[i].u(scope); },
      destroy() { binds.forEach((b) => b.d && b.d()); top.forEach((n) => n.parentNode && n.parentNode.removeChild(n)); }
    };
  }

  function makeIf(anchor, expr, tpl) {
    let view = null;
    return {
      u(scope) {
        const on = !!evaluate(expr, scope);
        if (on && !view) view = instantiate(tpl, anchor.parentNode, anchor);
        if (!on && view) { view.destroy(); view = null; }
        if (view) view.update(scope);
      },
      d() { if (view) view.destroy(); view = null; }
    };
  }

  function makeFor(anchor, expr, as, tpl) {
    const views = [];
    return {
      u(scope) {
        const list = evaluate(expr, scope) || [];
        while (views.length > list.length) views.pop().destroy();
        for (let i = 0; i < list.length; i++) {
          const sc = Object.create(scope); sc[as] = list[i]; sc.$index = i;
          if (!views[i]) views[i] = instantiate(tpl, anchor.parentNode, anchor);
          views[i].update(sc);
        }
      },
      d() { views.forEach((v) => v.destroy()); views.length = 0; }
    };
  }

  function mount(Component, opts) {
    opts = opts || {};
    const tplEl = document.getElementById(opts.template || 'page-template');
    const host = document.getElementById(opts.host || 'page');
    host.textContent = '';
    const comp = new Component(opts.props || {});
    let root = null, pending = false, rendering = false, again = false;
    function render() {
      if (rendering) { again = true; return; }
      rendering = true;
      do { again = false; root.update(comp.renderVals()); } while (again);
      rendering = false;
    }
    comp.__renderer = { schedule() { if (pending) return; pending = true; Promise.resolve().then(() => { pending = false; render(); }); } };
    root = instantiate(Array.from(tplEl.content.childNodes), host, null);
    render();
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
    // Skip when the page is kept for Back/Forward (e.persisted): the browser pauses
    // its timers and resumes them on return, so the animations carry on.
    window.addEventListener('pagehide', (e) => { if (e.persisted) return; if (typeof comp.componentWillUnmount === 'function') comp.componentWillUnmount(); });
    return comp;
  }

  window.ClarkPage = { mount };
})();
