import { DataType, IndexFormat, VertexElement, VertexElementFormat } from "@oasis-engine/core";

const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

/**
 * Parse binary text for glb loader.
 * @param array
 * @returns String
 * @private
 */
export function decodeText(array) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(array);
  }

  // TextDecoder polyfill
  let s = "";

  for (let i = 0, il = array.length; i < il; i++) {
    s += String.fromCharCode(array[i]);
  }

  return decodeURIComponent(encodeURIComponent(s));
}

/**
 * Find uniform object according to paramters[name] in glTF.
 * @param obj
 * @param key
 * @param value
 * @returns {object}
 * @private
 */
export function findByKeyValue(obj, key, value) {
  for (const name in obj) {
    if (obj[name][key] === value) {
      return obj[name];
    }
  }
  return null;
}

/** Get the number of bytes occupied by accessor type.
 * @return {number}
 * @param {string} accessorType
 * @private
 */
export function getAccessorTypeSize(accessorType) {
  const ACCESSOR_TYPE_SIZE = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
  };
  return ACCESSOR_TYPE_SIZE[accessorType];
}

/** Get the TypedArray corresponding to the component type.
 * @return {function}
 * @param {string} componentType
 */
export function getComponentType(componentType) {
  return WEBGL_COMPONENT_TYPES[componentType];
}

/**
 * Get accessor data.
 * @param gltf
 * @param accessor
 * @param buffers
 * @private
 */
export function getAccessorData(gltf, accessor, buffers) {
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const arrayBuffer = buffers[bufferView.buffer];
  const accessorByteOffset = accessor.hasOwnProperty("byteOffset") ? accessor.byteOffset : 0;
  const bufferViewByteOffset = bufferView.hasOwnProperty("byteOffset") ? bufferView.byteOffset : 0;
  const byteOffset = accessorByteOffset + bufferViewByteOffset;
  const accessorTypeSize = getAccessorTypeSize(accessor.type);
  const length = accessorTypeSize * accessor.count;
  const byteStride = bufferView.byteStride ?? 0;

  const arrayType = getComponentType(accessor.componentType);
  let uint8Array;
  if (byteStride) {
    uint8Array = new Uint8Array(length * arrayType.BYTES_PER_ELEMENT);
    const originalBufferView = new Uint8Array(arrayBuffer, bufferViewByteOffset, bufferView.byteLength);
    let viewAccessor = 0;
    const accessorByteSize = accessorTypeSize * arrayType.BYTES_PER_ELEMENT;
    for (let i = 0; i < accessor.count; i++) {
      viewAccessor = i * byteStride + accessorByteOffset;
      for (let j = 0; j < accessorByteSize; j++) {
        uint8Array[i * accessorByteSize + j] = originalBufferView[viewAccessor + j];
      }
    }
  } else {
    uint8Array = new Uint8Array(arrayBuffer, byteOffset, length * arrayType.BYTES_PER_ELEMENT);
    uint8Array = new Uint8Array(uint8Array);
  }

  return new arrayType(uint8Array.buffer);
}

/**
 * Get buffer data
 * @param bufferView
 * @param buffers
 * @returns {Blob|ArrayBuffer|Array.<T>|string}
 * @private
 */
export function getBufferData(bufferView, buffers) {
  // get bufferView
  const arrayBuffer = buffers[bufferView.buffer];
  const byteOffset = bufferView.byteOffset || 0;
  return arrayBuffer.slice(byteOffset, byteOffset + bufferView.byteLength);
}

export function getVertexStride(accessor): number {
  const size = getAccessorTypeSize(accessor.type);
  const componentType = getComponentType(accessor.componentType);
  return size * componentType.BYTES_PER_ELEMENT;
}

export function createVertexElement(gltf, semantic, accessor, index: number): VertexElement {
  const size = getAccessorTypeSize(accessor.type);
  return new VertexElement(semantic, 0, getElementFormat(accessor.componentType, size), index);
}

export function getIndexFormat(type: number): IndexFormat {
  switch (type) {
    case DataType.UNSIGNED_BYTE:
      return IndexFormat.UInt8;
    case DataType.UNSIGNED_SHORT:
      return IndexFormat.UInt16;
    case DataType.UNSIGNED_INT:
      return IndexFormat.UInt32;
  }
}

export function getElementFormat(type: number, size: number): VertexElementFormat {
  if (type == DataType.FLOAT) {
    switch (size) {
      case 1:
        return VertexElementFormat.Float;
      case 2:
        return VertexElementFormat.Vector2;
      case 3:
        return VertexElementFormat.Vector3;
      case 4:
        return VertexElementFormat.Vector4;
    }
  }
  if (type == DataType.UNSIGNED_SHORT) {
    switch (size) {
      case 2:
        return VertexElementFormat.UShort2;
      case 4:
        return VertexElementFormat.UShort4;
    }
  }
}

/**
 * Load image buffer
 * @param imageBuffer
 * @param type
 * @param callback
 */
export function loadImageBuffer(imageBuffer: ArrayBuffer, type: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Adaptation for wechat
    if (process.env.WECHAT) { 
      const base64 = wx.arrayBufferToBase64(imageBuffer);
      img.src = `data:${type};base64,${base64}`;
    } else {
      const blob = new window.Blob([imageBuffer], { type });
      img.src = URL.createObjectURL(blob);
    }

    img.crossOrigin = "anonymous";
    img.onerror = function () {
      reject(new Error("Failed to load image buffer"));
    };
    img.onload = function () {
      // Call requestAnimationFrame to avoid iOS's bug.
      requestAnimationFrame(() => {
        resolve(img);
      });
    };
  });
}

function isRelativeUrl(url: string): boolean {
  // 47 is /
  return url.charCodeAt(0) !== 47 && url.match(/:\/\//) === null;
}

function isAbsoluteUrl(url: string): boolean {
  return /^(?:http|blob|data:|\/)/.test(url);
}

export function parseRelativeUrl(baseUrl: string, relativeUrl: string): string {
  if (isAbsoluteUrl(relativeUrl)) {
    return relativeUrl;
  }
  // TODO: implement ../path
  return baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + relativeUrl;
}
