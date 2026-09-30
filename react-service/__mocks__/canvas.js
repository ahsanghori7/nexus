function MockImageData() {}
MockImageData.prototype = {
  constructor: MockImageData,
  toString: function () { return '[object ImageData]'; }
};

function MockCanvasGradient() {}
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

module.exports = {
  ImageData: MockImageData,
  Image: MockImage,
  CanvasGradient: MockCanvasGradient,
  createCanvas: () => ({
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    }),
    toDataURL: () => '',
    width: 0,
    height: 0,
  }),
  loadImage: () => Promise.resolve({}),
};
