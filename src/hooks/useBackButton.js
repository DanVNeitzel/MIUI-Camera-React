import { useEffect, useRef } from 'react';

// ─── Global LIFO back-button stack ───────────────────────────────────────────
// Each "layer" (modal / screen) pushes a close-handler when it becomes visible.
// The Android hardware back button pops & calls the topmost handler.
// When a layer is closed via a UI button, its handler is removed from the stack
// and a programmatic history.back() cleans up the stale history entry.

const _stack = [];
let _skip = 0; // count of programmatic history.back() calls to ignore

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (_skip > 0) { _skip--; return; }
    const fn = _stack[_stack.length - 1];
    if (fn) { _stack.pop(); fn(); }
  });
}

/**
 * useBackButton — integrates a component "layer" with the hardware back button.
 *
 * @param {boolean}  isActive  – true while the layer is visible / active
 * @param {Function} onBack    – called when the back button is pressed
 */
export function useBackButton(isActive, onBack) {
  const cbRef = useRef(onBack);
  useEffect(() => { cbRef.current = onBack; }, [onBack]);

  useEffect(() => {
    if (!isActive) return;
    const fn = () => cbRef.current();
    _stack.push(fn);
    history.pushState(null, '');
    return () => {
      const idx = _stack.lastIndexOf(fn);
      if (idx !== -1) {
        _stack.splice(idx, 1);
        _skip++;
        history.back(); // clean up the stale history entry pushed above
      }
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps
}
