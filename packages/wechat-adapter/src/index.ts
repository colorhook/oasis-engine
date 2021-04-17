export { SystemInfo } from './SystemInfo';
import "./BufferLoader";
export { OrbitControl } from './OrbitControl';
export { WebGLRenderer } from './WebGLRenderer';

export let devicePixelRatio = 1;
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


export function base64ToArrayBuffer(base64) {
  return wx.base64ToArrayBuffer(base64)
}

export function arrayBufferToBase64(arrayBuffer) {
  return wx.arrayBufferToBase64(arrayBuffer)
}

export const performance = Date;


let _canvas = null;

export function initCanvas(canvas, gl) {
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
  initCanvas,
  WebGLRenderingContext,
  WebGL2RenderingContext,
  base64ToArrayBuffer,
  arrayBufferToBase64,
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


