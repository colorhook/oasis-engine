/**
 * System info.
 */
export class SystemInfo {
  /**
   * The pixel ratio of the device.
   */
  static get devicePixelRatio(): number {
    return window.devicePixelRatio;
  }

  /**
   * @internal
   */
  static _isIos(): boolean {
    if (process.env.WECHAT) {
      return window.platform === 'ios';
    }
    const ua = window.navigator.userAgent.toLocaleLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }
}
