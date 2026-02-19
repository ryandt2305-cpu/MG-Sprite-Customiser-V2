export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') elem.className = v;
      else if (k === 'textContent') elem.textContent = v;
      else elem.setAttribute(k, v);
    }
  }
  if (children) {
    for (const child of children) {
      elem.append(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
  return elem;
}

export function $(selector: string, parent: ParentNode = document): HTMLElement | null {
  return parent.querySelector(selector);
}

export function $$(selector: string, parent: ParentNode = document): HTMLElement[] {
  return Array.from(parent.querySelectorAll(selector));
}
