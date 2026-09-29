// tests/helpers/fakeDom.ts
// WHAT: A minimal DOM stand-in for mounting a component with react-dom/client
//     and driving it the way a browser would: focus, typing, leaving a field,
//     clicking.
// WHY: This repo's jest runs in node without jsdom. The same approach as the
//     stand-ins in tests/editor-dashboard-save.test.tsx, plus the focusin and
//     input events React turns into onFocus and onChange.
// LIMITS: No layout and no form semantics. React's root listens on the
//     container; events are delivered to the listeners of the target and each
//     ancestor, bubble phase only.

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_NODE = 9;

type Listener = { type: string; fn: (event: unknown) => void; capture: boolean };

export class FakeNode {
  nodeType: number;
  nodeName: string;
  tagName?: string;
  namespaceURI: string | null = 'http://www.w3.org/1999/xhtml';
  childNodes: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  ownerDocument: FakeDocument | null;
  nodeValue: string | null = null;
  style: Record<string, string> = {};
  listeners: Listener[] = [];
  private attributes = new Map<string, string>();
  // React writes form state (value, checked, ...) as plain properties.
  [key: string]: unknown;

  constructor(nodeType: number, name: string, ownerDocument: FakeDocument | null) {
    this.nodeType = nodeType;
    this.nodeName = name.toUpperCase();
    if (nodeType === ELEMENT_NODE) this.tagName = this.nodeName;
    this.ownerDocument = ownerDocument;
  }
  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }
  get lastChild(): FakeNode | null {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }
  get nextSibling(): FakeNode | null {
    const siblings = this.parentNode?.childNodes ?? [];
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  appendChild(child: FakeNode): FakeNode {
    child.parentNode?.removeChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  insertBefore(child: FakeNode, before: FakeNode | null): FakeNode {
    if (!before) return this.appendChild(child);
    child.parentNode?.removeChild(child);
    this.childNodes.splice(this.childNodes.indexOf(before), 0, child);
    child.parentNode = this;
    return child;
  }
  removeChild(child: FakeNode): FakeNode {
    this.childNodes = this.childNodes.filter((node) => node !== child);
    child.parentNode = null;
    return child;
  }
  setAttribute(name: string, value: unknown) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name: string): string | null {
    return this.attributes.has(name) ? (this.attributes.get(name) as string) : null;
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  addEventListener(type: string, fn: (event: unknown) => void, options?: boolean | { capture?: boolean }) {
    this.listeners.push({ type, fn, capture: typeof options === 'boolean' ? options : Boolean(options?.capture) });
  }
  removeEventListener(type: string, fn: (event: unknown) => void) {
    this.listeners = this.listeners.filter((l) => l.type !== type || l.fn !== fn);
  }
  contains(other: FakeNode | null): boolean {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }
  get textContent(): string {
    if (this.nodeType === TEXT_NODE) return this.nodeValue ?? '';
    return this.childNodes.map((child) => child.textContent).join('');
  }
  set textContent(text: string) {
    if (this.nodeType === TEXT_NODE) {
      this.nodeValue = text;
      return;
    }
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    if (text) this.appendChild((this.ownerDocument as FakeDocument).createTextNode(text));
  }
}

export class FakeDocument extends FakeNode {
  documentElement: FakeNode;
  body: FakeNode;
  activeElement: FakeNode | null = null;
  defaultView: Record<string, unknown> = {};
  // react-dom checks `'oninput' in document` when it loads; without it, it
  // falls back to the old IE change-event polyfill.
  oninput: null = null;
  constructor() {
    super(DOCUMENT_NODE, '#document', null);
    this.documentElement = this.createElement('html');
    this.body = this.createElement('body');
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
  }
  createElement(tag: string): FakeNode {
    return new FakeNode(ELEMENT_NODE, tag, this);
  }
  createTextNode(text: string): FakeNode {
    const node = new FakeNode(TEXT_NODE, '#text', this);
    node.nodeValue = text;
    return node;
  }
}

// Delivers one event to the target and each ancestor's bubble listeners.
export function dispatch(target: FakeNode, type: string) {
  const event = {
    type,
    target,
    relatedTarget: null,
    bubbles: true,
    cancelable: true,
    timeStamp: Date.now(),
    defaultPrevented: false,
    preventDefault() {},
    stopPropagation() {},
  };
  for (let node: FakeNode | null = target; node; node = node.parentNode) {
    for (const listener of node.listeners.filter((l) => l.type === type && !l.capture)) listener.fn(event);
  }
}

export function descendants(node: FakeNode, out: FakeNode[] = []): FakeNode[] {
  for (const child of node.childNodes) {
    if (child.nodeType === ELEMENT_NODE) out.push(child);
    descendants(child, out);
  }
  return out;
}

export const byTag = (root: FakeNode, tag: string) => descendants(root).filter((n) => n.nodeName === tag.toUpperCase());
