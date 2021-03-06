import { resourceLoader, Loader, AssetPromise, AssetType, LoadItem } from "@oasis-engine/core";

function isBase64(url) {
  return /^data:(.+?);base64,/.test(url);
}
@resourceLoader(AssetType.Buffer, ["bin", "r3bin"], false)
class BufferLoader extends Loader<ArrayBuffer> {
  load(item: LoadItem): AssetPromise<ArrayBuffer> {
    const url = item.url;
    if (isBase64(url)) {
      return new AssetPromise((resolve) => {
        const base64Str = url.slice(13 + RegExp.$1.length);
        // Adaptation for wechat
        if (process.env.WECHAT) {
          return resolve(wx.base64ToArrayBuffer(base64Str))
        }
        const result = Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
        resolve(result.buffer);
      });
    }
    return this.request(url, {
      ...item,
      type: "arraybuffer"
    });
  }
}
