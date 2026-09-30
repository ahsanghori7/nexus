// This file runs before the test environment is initialized
// We need to mock canvas before jsdom tries to load it

// Mock canvas at the Node.js module level before jsdom initializes
const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

// @tootallnate/once@3 is ESM-only. Jest/Node in this repo still loads some
// jsdom proxy dependencies via CommonJS require().
const onceCjsShim = (emitter, name, { signal } = {}) => new Promise((resolve, reject) => {
  const cleanup = () => {
    if (signal && typeof signal.removeEventListener === 'function') {
      signal.removeEventListener('abort', onAbort);
    }
    emitter.removeListener(name, onEvent);
    emitter.removeListener('error', onError);
  };

  const onEvent = (...args) => {
    cleanup();
    resolve(args);
  };

  const onError = (err) => {
    cleanup();
    reject(err);
  };

  const onAbort = () => {
    cleanup();
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    reject(err);
  };

  if (signal && signal.aborted) {
    onAbort();
    return;
  }

  if (signal && typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', onAbort);
  }
  emitter.on(name, onEvent);
  emitter.on('error', onError);
});

// Create mock ImageData and CanvasGradient constructors with prototypes
function MockImageData() { }
MockImageData.prototype = {
  constructor: MockImageData,
  toString: function () { return '[object ImageData]'; }
};

function MockCanvasGradient() { }
MockCanvasGradient.prototype = {
  constructor: MockCanvasGradient,
  toString: function () { return '[object CanvasGradient]'; }
};

function MockImage() {
  this._src = '';
  this.onload = null;
  this.onerror = null;
  this.width = 0;
  this.height = 0;
}
MockImage.prototype = {
  constructor: MockImage,
  set src(value) {
    this._src = value;
    if (typeof this.onload === 'function') {
      this.onload();
    }
  },
  get src() {
    return this._src;
  },
  toString: function () { return '[object Image]'; }
};

// Create a mock canvas module that matches what bindings.js expects
const mockCanvas = {
  ImageData: MockImageData,
  Image: MockImage,
  CanvasGradient: MockCanvasGradient,
  createCanvas: () => ({
    getContext: () => ({
      fillRect: () => { },
      clearRect: () => { },
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => { },
      createImageData: () => [],
      setTransform: () => { },
      drawImage: () => { },
      save: () => { },
      fillText: () => { },
      restore: () => { },
      beginPath: () => { },
      moveTo: () => { },
      lineTo: () => { },
      closePath: () => { },
      stroke: () => { },
      translate: () => { },
      scale: () => { },
      rotate: () => { },
      arc: () => { },
      fill: () => { },
      measureText: () => ({ width: 0 }),
      transform: () => { },
      rect: () => { },
      clip: () => { },
    }),
    toDataURL: () => '',
    width: 0,
    height: 0,
  }),
  loadImage: () => Promise.resolve({}),
};

const normalizePath = (value) => (typeof value === 'string' ? value.replace(/\\/g, '/') : '');
const isCanvasRequest = (idStr, resolvedPath) => {
  const normalizedId = normalizePath(idStr);
  const normalizedResolved = normalizePath(resolvedPath);

  if (
    normalizedId === 'canvas' ||
    normalizedId.startsWith('canvas/') ||
    normalizedId.endsWith('/canvas') ||
    normalizedId.endsWith('/canvas/index.js') ||
    normalizedId.includes('canvas/lib/bindings') ||
    normalizedId.includes('canvas/lib/canvas') ||
    normalizedId.includes('canvas/index') ||
    normalizedId.includes('canvas/build/Release/canvas.node') ||
    normalizedId.includes('../build/Release/canvas.node') ||
    normalizedId.endsWith('canvas.node') ||
    normalizedId.endsWith('/bindings.js')
  ) {
    return true;
  }

  if (normalizedResolved.includes('/node_modules/canvas/')) {
    return true;
  }

  return (
    normalizedResolved.endsWith('/canvas/lib/bindings.js') ||
    normalizedResolved.endsWith('/canvas/lib/canvas.js') ||
    normalizedResolved.endsWith('/canvas/index.js') ||
    normalizedResolved.includes('/canvas/build/Release/canvas.node') ||
    (normalizedResolved.endsWith('/build/Release/canvas.node') &&
      normalizedResolved.includes('/canvas/'))
  );
};

// Intercept require calls for canvas - this must happen before jsdom loads
Module.prototype.require = function (id) {
  // Check if this is a canvas module request (multiple patterns)
  const idStr = String(id);

  // Try to resolve the path to check if it's canvas-related
  let resolvedPath = idStr;
  try {
    // Try to resolve relative paths
    if (idStr.startsWith('.') || idStr.startsWith('..')) {
      const parentPath = this.parent && this.parent.filename ? path.dirname(this.parent.filename) : process.cwd();
      resolvedPath = path.resolve(parentPath, idStr);
    } else if (!path.isAbsolute(idStr)) {
      // Try to resolve module paths
      resolvedPath = require.resolve(idStr, { paths: this.paths || [] });
    }
  } catch (e) {
    // Resolution failed, use original idStr
    resolvedPath = idStr;
  }

  // Intercept canvas module and all its submodules, including relative paths and resolved paths
  if (isCanvasRequest(idStr, resolvedPath)) {
    // Cache it to prevent re-loading - use resolved path as key if available
    const cacheKey = resolvedPath.includes('bindings') || resolvedPath.includes('canvas.node')
      ? resolvedPath
      : (idStr.includes('bindings') || idStr.includes('canvas.node') ? idStr : 'canvas');

    if (!require.cache[cacheKey]) {
      require.cache[cacheKey] = {
        id: cacheKey,
        exports: mockCanvas,
        loaded: true,
        parent: null,
        children: [],
        paths: [],
      };
    }
    return mockCanvas;
  }

  // Provide a CJS shim for @tootallnate/once to avoid ESM require() errors in Jest.
  if (idStr === '@tootallnate/once' || idStr.endsWith('/@tootallnate/once/dist/index.js')) {
    return onceCjsShim;
  }

  // Try to require normally
  try {
    const result = originalRequire.apply(this, arguments);
    // If the result is from bindings.js and doesn't have ImageData, return our mock
    if (result && typeof result === 'object' && !result.ImageData && isCanvasRequest(idStr, resolvedPath)) {
      return mockCanvas;
    }
    return result;
  } catch (e) {
    // If it's a canvas-related error, return mock
    if (e.message && isCanvasRequest(idStr, resolvedPath) && (
      e.message.includes('canvas') ||
      e.message.includes('Cannot find module') ||
      e.message.includes('Cannot read properties')
    )) {
      // Cache it
      const cacheKey = resolvedPath.includes('bindings') || resolvedPath.includes('canvas.node')
        ? resolvedPath
        : (idStr.includes('bindings') || idStr.includes('canvas.node') ? idStr : 'canvas');

      if (!require.cache[cacheKey]) {
        require.cache[cacheKey] = {
          id: cacheKey,
          exports: mockCanvas,
          loaded: true,
          parent: null,
          children: [],
          paths: [],
        };
      }
      return mockCanvas;
    }
    throw e;
  }
};

// Pre-cache canvas in multiple possible paths
const canvasPaths = [
  'canvas',
  'canvas/index.js',
  'canvas/lib/canvas.js',
  'canvas/lib/bindings.js',
];

canvasPaths.forEach(canvasPath => {
  if (!require.cache[canvasPath]) {
    require.cache[canvasPath] = {
      id: canvasPath,
      exports: mockCanvas,
      loaded: true,
      parent: null,
      children: [],
      paths: [],
    };
  }
});

// Also try to find and cache the actual bindings.js file path if it exists
try {
  const fs = require('fs');
  const possibleBindingsPaths = [
    path.resolve(process.cwd(), 'node_modules/canvas/lib/bindings.js'),
    path.resolve(process.cwd(), 'node_modules/.pnpm/canvas@2.11.2/node_modules/canvas/lib/bindings.js'),
  ];

  possibleBindingsPaths.forEach(bindingsPath => {
    if (fs.existsSync(bindingsPath)) {
      // Cache the bindings.js file itself
      if (!require.cache[bindingsPath]) {
        require.cache[bindingsPath] = {
          id: bindingsPath,
          exports: mockCanvas,
          loaded: true,
          parent: null,
          children: [],
          paths: [],
        };
      }

      // Also cache the native module path that bindings.js will try to require
      const nativeModulePath = path.resolve(path.dirname(bindingsPath), '../build/Release/canvas.node');
      if (!require.cache[nativeModulePath]) {
        require.cache[nativeModulePath] = {
          id: nativeModulePath,
          exports: mockCanvas,
          loaded: true,
          parent: null,
          children: [],
          paths: [],
        };
      }
    }
  });
} catch (e) {
  // Ignore errors in setup
}
