// jsdom doesn't implement matchMedia; antd (Grid, ProLayout) requires it.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Basic scrollIntoView / ResizeObserver stubs for antd components.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
if (!('ResizeObserver' in window)) {
  (window as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}