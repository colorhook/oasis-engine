"use strict";
import { Entity, Matrix, Script, Spherical, Vector2, Vector3 } from "oasis-engine";

/**
 * The camera's track controller, can rotate, zoom, pan, support mouse and touch events.
 */
export class OrbitControl extends Script {
  camera: Entity;
  domElement: HTMLElement | Document;
  mainElement: HTMLCanvasElement;
  fov: number;
  target: Vector3;
  up: Vector3;
  minDistance: number;
  maxDistance: number;
  minZoom: number;
  maxZoom: number;
  enableDamping: boolean;
  zoomFactor: number;
  enableRotate: boolean;
  keyPanSpeed: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
  enableZoom: boolean;
  dampingFactor: number;
  zoomSpeed: number;
  enablePan: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  rotateSpeed: number;
  enableKeys: boolean;
  keys: { LEFT: number; RIGHT: number; UP: number; BOTTOM: number };
  mouseButtons: { ORBIT: number; ZOOM: number; PAN: number };
  touchFingers: { ORBIT: number; ZOOM: number; PAN: number };
  STATE: {
    TOUCH_ROTATE: number;
    ROTATE: number;
    TOUCH_PAN: number;
    ZOOM: number;
    NONE: number;
    PAN: number;
    TOUCH_ZOOM: number;
  };
  mouseUpEvents: { listener: any; type: string }[];
  constEvents: { listener: any; type: string; element?: Window }[];

  private _position: Vector3;
  private _offset: Vector3;
  private _spherical: Spherical;
  private _sphericalDelta: Spherical;
  private _sphericalDump: Spherical;
  private _zoomFrag: number;
  private _scale: number;
  private _panOffset: Vector3;
  private _isMouseUp: boolean;
  private _vPan: Vector3;
  private _state: any;
  private _rotateStart: Vector2;
  private _rotateEnd: Vector2;
  private _rotateDelta: Vector2;
  private _panStart: Vector2;
  private _panEnd: Vector2;
  private _panDelta: Vector2;
  private _zoomStart: Vector2;
  private _zoomEnd: Vector2;
  private _zoomDelta: Vector2;

  constructor(entity: Entity) {
    super(entity);

    this.camera = entity;
    // @ts-ignore
    // @todo In the future, the dependence on html elements will be removed and realized through the input of the packaging engine.
    this.mainElement = this.engine.canvas._webCanvas;
    this.domElement = document;
    this.fov = 45;

    // Target position.
    this.target = new Vector3();

    // Up vector
    this.up = new Vector3(0, 1, 0);

    /**
     * The minimum distance, the default is 0.1, should be greater than 0.
     */
    this.minDistance = 0.1;
    /**
     * The maximum distance, the default is infinite, should be greater than the minimum distance
     */
    this.maxDistance = Infinity;

    /**
     * Minimum zoom speed, the default is 0.0.
     * @member {Number}
     */
    this.minZoom = 0.0;

    /**
     * Maximum zoom speed, the default is positive infinity.
     */
    this.maxZoom = Infinity;

    /**
     * The minimum radian in the vertical direction, the default is 0 radian, the value range is 0 - Math.PI.
     */
    this.minPolarAngle = 0;

    /**
     * The maximum radian in the vertical direction, the default is Math.PI, and the value range is 0 - Math.PI.
     */
    this.maxPolarAngle = Math.PI;

    /**
     * The minimum radian in the horizontal direction, the default is negative infinity.
     */
    this.minAzimuthAngle = -Infinity;

    /**
     * The maximum radian in the horizontal direction, the default is positive infinity.
     */
    this.maxAzimuthAngle = Infinity;

    /**
     * Whether to enable camera damping, the default is true.
     */
    this.enableDamping = true;

    /**
     * Rotation damping parameter, default is 0.1 .
     */
    this.dampingFactor = 0.1;

    /**
     * Zoom damping parameter, default is 0.2 .
     */
    this.zoomFactor = 0.2;

    /**
     * Whether to enable zoom, the default is true.
     */
    this.enableZoom = true;

    /**
     * Camera zoom speed, the default is 1.0.
     */
    this.zoomSpeed = 1.0;

    /**
     * Whether to enable rotation, the default is true.
     */
    this.enableRotate = true;

    /**
     * Rotation speed, default is 1.0 .
     */
    this.rotateSpeed = 1.0;

    /**
     * Whether to enable translation, the default is true.
     */
    this.enablePan = true;

    /**
     * Keyboard translation speed, the default is 7.0 .
     */
    this.keyPanSpeed = 7.0;

    /**
     * Whether to automatically rotate the camera, the default is false.
     */
    this.autoRotate = false;

    /**
     * The time required for one automatic rotation, the default is 2.0s .
     */
    this.autoRotateSpeed = 2.0;

    /**
     * Whether to enable keyboard.
     */
    this.enableKeys = false;
    this.keys = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      BOTTOM: 40
    };

    // Control keys.
    this.mouseButtons = {
      ORBIT: 0,
      ZOOM: 1,
      PAN: 2
    };

    this.touchFingers = {
      ORBIT: 1,
      ZOOM: 2,
      PAN: 3
    };

    // Reuse objects to prevent excessive stack allocation.
    // update
    this._position = new Vector3();
    this._offset = new Vector3();
    this._spherical = new Spherical();
    this._sphericalDelta = new Spherical();
    this._sphericalDump = new Spherical();
    this._zoomFrag = 0;
    this._scale = 1;
    this._panOffset = new Vector3();
    this._isMouseUp = true;

    // pan
    this._vPan = new Vector3();

    // state
    this._rotateStart = new Vector2();
    this._rotateEnd = new Vector2();
    this._rotateDelta = new Vector2();

    this._panStart = new Vector2();
    this._panEnd = new Vector2();
    this._panDelta = new Vector2();

    this._zoomStart = new Vector2();
    this._zoomEnd = new Vector2();
    this._zoomDelta = new Vector2();

    this.STATE = {
      NONE: -1,
      ROTATE: 0,
      ZOOM: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_ZOOM: 4,
      TOUCH_PAN: 5
    };
    this._state = this.STATE.NONE;
  }

  onDisable(): void {
  }

  onDestroy() {
  }

  onUpdate(dtime) {
    if (!this.enabled) return;

    const position: Vector3 = this.camera.transform.position;
    position.cloneTo(this._offset);
    this._offset.subtract(this.target);
    this._spherical.setFromVec3(this._offset);

    if (this.autoRotate && this._state === this.STATE.NONE) {
      this.rotateLeft(this.getAutoRotationAngle(dtime));
    }

    this._spherical.theta += this._sphericalDelta.theta;
    this._spherical.phi += this._sphericalDelta.phi;

    this._spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this._spherical.theta));
    this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
    this._spherical.makeSafe();

    if (this._scale !== 1) {
      this._zoomFrag = this._spherical.radius * (this._scale - 1);
    }

    this._spherical.radius += this._zoomFrag;
    this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));

    this.target.add(this._panOffset);
    this._spherical.setToVec3(this._offset);
    this.target.cloneTo(this._position);
    this._position.add(this._offset);

    this.camera.transform.position = this._position;
    this.camera.transform.lookAt(this.target, this.up);

    if (this.enableDamping === true) {
      this._sphericalDump.theta *= 1 - this.dampingFactor;
      this._sphericalDump.phi *= 1 - this.dampingFactor;
      this._zoomFrag *= 1 - this.zoomFactor;

      if (this._isMouseUp) {
        this._sphericalDelta.theta = this._sphericalDump.theta;
        this._sphericalDelta.phi = this._sphericalDump.phi;
      } else {
        this._sphericalDelta.set(0, 0, 0);
      }
    } else {
      this._sphericalDelta.set(0, 0, 0);
      this._zoomFrag = 0;
    }

    this._scale = 1;
    this._panOffset.setValue(0, 0, 0);
  }

  /**
   * Get the radian of automatic rotation.
   */
  getAutoRotationAngle(dtime: number) {
    return ((2 * Math.PI) / this.autoRotateSpeed / 1000) * dtime;
  }

  /**
   * Get zoom value.
   */
  getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  /**
   * Rotate to the left by a certain randian.
   * @param radian - Radian value of rotation
   */
  rotateLeft(radian: number) {
    this._sphericalDelta.theta -= radian;
    if (this.enableDamping) {
      this._sphericalDump.theta = -radian;
    }
  }

  /**
   * Rotate to the right by a certain randian.
   * @param radian - Radian value of rotation
   */
  rotateUp(radian: number) {
    this._sphericalDelta.phi -= radian;
    if (this.enableDamping) {
      this._sphericalDump.phi = -radian;
    }
  }

  /**
   * Pan left.
   */
  panLeft(distance: number, worldMatrix: Matrix) {
    const e = worldMatrix.elements;
    this._vPan.setValue(e[0], e[1], e[2]);
    this._vPan.scale(distance);
    this._panOffset.add(this._vPan);
  }

  /**
   * Pan right.
   */
  panUp(distance: number, worldMatrix: Matrix) {
    const e = worldMatrix.elements;
    this._vPan.setValue(e[4], e[5], e[6]);
    this._vPan.scale(distance);
    this._panOffset.add(this._vPan);
  }

  /**
   * Pan.
   * @param deltaX - The amount of translation from the screen distance in the x direction
   * @param deltaY - The amount of translation from the screen distance in the y direction
   */
  pan(deltaX: number, deltaY: number) {
    // perspective only
    const position: Vector3 = this.camera.position;
    position.cloneTo(this._vPan);
    this._vPan.subtract(this.target);
    let targetDistance = this._vPan.length();

    targetDistance *= (this.fov / 2) * (Math.PI / 180);

    this.panLeft(-2 * deltaX * (targetDistance / window.innerWidth), this.camera.transform.worldMatrix);
    this.panUp(2 * deltaY * (targetDistance / window.innerHeight), this.camera.transform.worldMatrix);
  }

  /**
   * Zoom in.
   */
  zoomIn(zoomScale: number): void {
    // perspective only
    this._scale *= zoomScale;
  }

  /**
   * Zoom out.
   */
  zoomOut(zoomScale: number): void {
    // perspective only
    this._scale /= zoomScale;
  }

  /**
   * Rotation parameter update when touch is dropped.
   */
  handleTouchStartRotate(event: TouchEvent) {
    this._rotateStart.setValue(event.touches[0].x, event.touches[0].y);
  }

  /**
   * Zoom parameter update when touch down.
   */
  handleTouchStartZoom(event: TouchEvent) {
    const dx = event.touches[0].x - event.touches[1].x;
    const dy = event.touches[0].y - event.touches[1].y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this._zoomStart.setValue(0, distance);
  }

  /**
   * Update the translation parameter when touch down.
   */
  handleTouchStartPan(event: TouchEvent) {
    this._panStart.setValue(event.touches[0].x, event.touches[0].y);
  }

  /**
   * Rotation parameter update when touch to move.
   */
  handleTouchMoveRotate(event: TouchEvent) {
    this._rotateEnd.setValue(event.touches[0].x, event.touches[0].y);
    Vector2.subtract(this._rotateEnd, this._rotateStart, this._rotateDelta);

    this.rotateLeft(((2 * Math.PI * this._rotateDelta.x) / window.innerWidth) * this.rotateSpeed);
    this.rotateUp(((2 * Math.PI * this._rotateDelta.y) / window.innerHeight) * this.rotateSpeed);

    this._rotateEnd.cloneTo(this._rotateStart);
  }

  /**
   * Zoom parameter update when touch to move.
   */
  handleTouchMoveZoom(event) {
    const dx = event.touches[0].x - event.touches[1].x;
    const dy = event.touches[0].y - event.touches[1].y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this._zoomEnd.setValue(0, distance);

    Vector2.subtract(this._zoomEnd, this._zoomStart, this._zoomDelta);

    if (this._zoomDelta.y > 0) {
      this.zoomIn(this.getZoomScale());
    } else if (this._zoomDelta.y < 0) {
      this.zoomOut(this.getZoomScale());
    }

    this._zoomEnd.cloneTo(this._zoomStart);
  }

  /**
   * Pan parameter update when touch moves.
   */
  handleTouchMovePan(event: TouchEvent) {
    this._panEnd.setValue(event.touches[0].x, event.touches[0].y);

    Vector2.subtract(this._panEnd, this._panStart, this._panDelta);

    this.pan(this._panDelta.x, this._panDelta.y);

    this._panEnd.cloneTo(this._panStart);
  }

  /**
   * Total handling of touch start events.
   */
  onTouchStart(event: TouchEvent) {
    if (this.enabled === false) return;

    this._isMouseUp = false;

    switch (event.touches.length) {
      case this.touchFingers.ORBIT:
        if (this.enableRotate === false) return;

        this.handleTouchStartRotate(event);
        this._state = this.STATE.TOUCH_ROTATE;

        break;

      case this.touchFingers.ZOOM:
        if (this.enableZoom === false) return;

        this.handleTouchStartZoom(event);
        this._state = this.STATE.TOUCH_ZOOM;

        break;

      case this.touchFingers.PAN:
        if (this.enablePan === false) return;

        this.handleTouchStartPan(event);
        this._state = this.STATE.TOUCH_PAN;

        break;

      default:
        this._state = this.STATE.NONE;
    }
  }

  /**
   * Total handling of touch movement events.
   */
  onTouchMove(event: TouchEvent) {
    if (this.enabled === false) return;

    switch (event.touches.length) {
      case this.touchFingers.ORBIT:
        if (this.enableRotate === false) return;
        if (this._state !== this.STATE.TOUCH_ROTATE) return;
        this.handleTouchMoveRotate(event);

        break;

      case this.touchFingers.ZOOM:
        if (this.enableZoom === false) return;
        if (this._state !== this.STATE.TOUCH_ZOOM) return;
        this.handleTouchMoveZoom(event);

        break;

      case this.touchFingers.PAN:
        if (this.enablePan === false) return;
        if (this._state !== this.STATE.TOUCH_PAN) return;
        this.handleTouchMovePan(event);

        break;

      default:
        this._state = this.STATE.NONE;
    }
  }

  /**
   * Total handling of touch end events.
   */
  onTouchEnd() {
    if (this.enabled === false) return;

    this._isMouseUp = true;
    this._state = this.STATE.NONE;
  }
}
