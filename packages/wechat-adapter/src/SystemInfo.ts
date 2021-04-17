const res = wx.getSystemInfoSync();
const devicePixelRatio = res.pixelRatio;
const platform = res.platform;

/**
 * System info.
 */
 export class SystemInfo {
  /**
   * The pixel ratio of the device.
   */
  static get devicePixelRatio(): number {
    return devicePixelRatio;
  }

  /**
   * @internal
   */
  static _isIos(): boolean {
    return platform === 'ios';
  }
}
