// Mock for @mui/material/utils
const React = require('react');

module.exports = {
  createSvgIcon: (path, displayName) => {
    const SvgIcon = React.forwardRef((props, ref) =>
      React.createElement('svg', {
        ...props,
        ref,
        'data-testid': `${displayName?.toLowerCase() || 'svg'}-icon`
      }, path)
    );
    SvgIcon.displayName = displayName;
    return SvgIcon;
  },
  unstable_useId: () => 'test-id',
  unstable_ownerDocument: (node) => node?.ownerDocument || document,
  unstable_useEnhancedEffect: require('react').useEffect,
  capitalizeFirstLetter: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  createChainedFunction: (...fns) => (...args) => fns.forEach(fn => fn && fn(...args)),
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  deprecatedPropType: () => () => null,
  isMuiElement: () => false,
  ownerDocument: (node) => node?.ownerDocument || document,
  ownerWindow: (node) => node?.ownerDocument?.defaultView || window,
  requirePropFactory: () => () => null,
  setRef: (ref, value) => {
    if (typeof ref === 'function') {
      ref(value);
    } else if (ref) {
      ref.current = value;
    }
  },
  useControlled: ({ controlled, default: defaultProp, name }) => {
    const [valueState, setValueState] = require('react').useState(defaultProp);
    const value = controlled !== undefined ? controlled : valueState;
    const setValue = require('react').useCallback((newValue) => {
      if (controlled === undefined) {
        setValueState(newValue);
      }
    }, [controlled]);
    return [value, setValue];
  },
  useEventCallback: (fn) => require('react').useCallback(fn, []),
  useForkRef: (...refs) => {
    return require('react').useMemo(() => {
      if (refs.every(ref => ref == null)) {
        return null;
      }
      return (instance) => {
        refs.forEach(ref => {
          if (typeof ref === 'function') {
            ref(instance);
          } else if (ref) {
            ref.current = instance;
          }
        });
      };
    }, refs);
  },
  useId: () => 'test-id',
  unsupportedProp: () => () => null,
};
