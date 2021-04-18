export { SystemInfo } from './SystemInfo';
export { OrbitControl } from './OrbitControl';

export let WebGLRenderingContext = undefined;
export let WebGL2RenderingContext = undefined;
export let innerWidth = 0;
export let innerHeight = 0;
export let outerWidth = 0;
export let outerHeight = 0;
export let platform = undefined;

try {
  const res = wx.getSystemInfoSync();
  devicePixelRatio = res.pixelRatio;
  innerWidth = res.windowWidth;
  innerHeight = res.windowHeight;
  outerWidth = res.screenWidth;
  outerHeight = res.screenHeight;
  platform = res.platform;
} catch (err) {}

export const performance = Date;


let _canvas = null;

export function __setGlobalCanvas(canvas, gl) {
  _canvas = canvas;
  WebGLRenderingContext = WebGL2RenderingContext = gl;
}

export function requestAnimationFrame(callback) {
  return _canvas.requestAnimationFrame(callback);
}

export function cancelAnimationFrame(id) {
  return _canvas.cancelAnimationFrame(id);
}

export function Image() {
  return _canvas.createImage()
}

export const document = undefined;
export const navigator = {};

export function request(url, options) {
  return wx.request(url, options);
}

export const window = {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  platform,
  innerWidth,
  innerHeight,
  outerWidth,
  outerHeight,
  setTimeout,
  setInterval,
  devicePixelRatio,
  Image,
  document,
  navigator,
  request,
}


