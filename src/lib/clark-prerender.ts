// Build-time pre-rendering for the Clark pages.
//
// The Clark pages keep their content in a <template> that /js/clark-runtime.js
// fills in the browser. Crawlers that don't run JavaScript (many AI search
// crawlers) would see an empty <div id="page">. This runs the page's own
// runtime and Component once at build time, in a lightweight DOM, and returns
// the first render so it can be written straight into <div id="page">.
//
// In the browser nothing changes: clark-runtime.js clears #page and renders
// the same content itself, then starts the animations as before.
//
// Only the first render is captured: componentDidMount (timers, observers,
// animations) is skipped and all timers are no-ops.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

// Phone width: the one width-dependent section (channel demo on /clark/) shows
// all its messages at this width, so crawlers get the fullest text.
const SNAPSHOT_WIDTH = 390;
const SNAPSHOT_HEIGHT = 844;

const runtimePath = path.join(process.cwd(), 'public/js/clark-runtime.js');

export async function prerenderClarkPage(html: string): Promise<string> {
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const { window, document } = parseHTML(html);

  const component = Array.from(document.querySelectorAll('body script:not([src])'))
    .map((s) => s.textContent || '')
    .find((code) => code.includes('ClarkPage.mount('));
  if (!component) throw new Error('Clark prerender: page has no ClarkPage.mount() script');

  const noop = () => 0;
  class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  const matchMedia = () => ({
    matches: false, media: '', onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  });
  const browserish = {
    innerWidth: SNAPSHOT_WIDTH, innerHeight: SNAPSHOT_HEIGHT, devicePixelRatio: 1,
    matchMedia, setTimeout: noop, setInterval: noop, clearTimeout: noop, clearInterval: noop,
    requestAnimationFrame: noop, cancelAnimationFrame: noop,
    IntersectionObserver: NoopObserver, ResizeObserver: NoopObserver, MutationObserver: NoopObserver,
    performance: { now: () => 0 },
    scrollTo: noop, scrollX: 0, scrollY: 0, pageYOffset: 0,
  };
  // linkedom's window falls through to Node's globals, so never write to it:
  // give the page a wrapper that serves our stubs and keeps its own writes local.
  const own: Record<PropertyKey, unknown> = { ...browserish };
  const pageWindow: any = new Proxy(window, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(own, key)) return own[key as string];
      const v = Reflect.get(target, key);
      return typeof v === 'function' && !/^[A-Z]/.test(String(key)) ? v.bind(target) : v;
    },
    set(_target, key, value) { own[key as string] = value; return true; },
    has(target, key) { return Object.prototype.hasOwnProperty.call(own, key) || Reflect.has(target, key); },
  });
  // clientWidth is 0 in a non-layout DOM; the page reads it to pick the narrow layout.
  Object.defineProperty(document.documentElement, 'clientWidth', { value: SNAPSHOT_WIDTH, configurable: true });
  Object.defineProperty(document.documentElement, 'clientHeight', { value: SNAPSHOT_HEIGHT, configurable: true });

  const context = vm.createContext({ ...browserish, window: pageWindow, document, navigator: window.navigator, location: window.location, console });
  vm.runInContext(runtime, context, { filename: 'clark-runtime.js' });

  // Mount without componentDidMount: first render only, no animations.
  const realMount = (own.ClarkPage as any).mount;
  context.DCLogic = own.DCLogic;
  context.ClarkPage = {
    mount(Component: any, opts?: any) {
      class FirstRenderOnly extends Component { componentDidMount() {} componentWillUnmount() {} }
      return realMount(FirstRenderOnly, opts);
    },
  };
  vm.runInContext(component, context, { filename: 'clark-component.js' });

  // Let any setState() calls made during the first render settle (they run as microtasks).
  for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));

  const page = document.getElementById('page');
  const out = page ? page.innerHTML.replace(/<!--sc-(?:if|for)-->/g, '') : '';
  if (out.length < 1000 || out.includes('{{')) {
    throw new Error(`Clark prerender: unexpected output (${out.length} chars${out.includes('{{') ? ', unfilled {{placeholders}}' : ''})`);
  }
  return out;
}
