import {
  Object3D,
  Vector3,
  Matrix4,
  Quaternion,
  AxesHelper,
  Material,
  MathUtils
} from 'three';

const HEAD_YAW_MAX = 50; // 50 Degrees
const HEAD_TILT_MAX = 40; // 40 Degrees
const HEAD_SPEED = MathUtils.DEG2RAD * 200; // 200 Degrees
const EYE_TWIST_MAX = 15;
const EYE_SWING_MAX = 30;
const EYE_SPEED = HEAD_SPEED * 5; // 200 Degrees
const EASING_START_ANGLE = MathUtils.DEG2RAD * 15; // 20 Degrees
const MIN_HEAD_SPEED = MathUtils.DEG2RAD * 15; // 20 Degrees

//Side effects: manipulates parameters
function rotateTowards(
  targetQuat: Quaternion,
  lastQuat: Quaternion,
  fullSpeed: number,
  dt: number
): void {
  //cap speed
  const angleDiff = lastQuat.angleTo(targetQuat);
  const n = Math.min(angleDiff / EASING_START_ANGLE, 1); //normalize angle change: 0 to 1.  Over lookat process it goes from 1 to 0.
  // decelerating to zero velocity;
  const speed = Math.max(n * n * fullSpeed, MIN_HEAD_SPEED); //easing from https://gist.github.com/gre/1650294
  const maxAngleChange = Math.min(speed * dt, angleDiff);
  // equals in >= comparison for when angleDiff smaller than speed, like when hips are close enough
  if (angleDiff >= maxAngleChange) {
    lastQuat.rotateTowards(targetQuat, maxAngleChange);
    targetQuat.copy(lastQuat); // copy, not first "out" rotateTowards, so under maxAngleChange path is faster
  }
}

interface SwingTwistLimits {
  twistAxis: Vector3;
  twistMax: number;
  twistPow2: number;
  twistW: number;
  swingMax: number;
  swingPow2: number;
  swingW: number;
}

function makeLims(
  twistA: Vector3,
  tMax: number,
  sMax: number
): SwingTwistLimits {
  const TWIST_MAX = Math.sin(0.5 * MathUtils.DEG2RAD * tMax);
  const TWIST_MAX_POW2 = TWIST_MAX * TWIST_MAX;
  const TWIST_MAX_W = Math.sqrt(1.0 - TWIST_MAX_POW2);

  const SWING_MAX = Math.sin(0.5 * MathUtils.DEG2RAD * sMax);
  const SWING_MAX_POW2 = SWING_MAX * SWING_MAX;
  const SWING_MAX_W = Math.sqrt(1.0 - SWING_MAX_POW2);
  return {
    twistAxis: twistA,
    twistMax: TWIST_MAX,
    twistPow2: TWIST_MAX_POW2,
    twistW: TWIST_MAX_W,
    swingMax: SWING_MAX,
    swingPow2: SWING_MAX_POW2,
    swingW: SWING_MAX_W
  };
}

const headLimits = makeLims(
  new Vector3().set(0, 1, 0),
  HEAD_YAW_MAX,
  HEAD_TILT_MAX
);

const eyeLimits = makeLims(
  new Vector3().set(1, 0, 0), //todo something wrong with extream angles and tilted avatar.
  EYE_TWIST_MAX,
  EYE_SWING_MAX
);

//clamp rotation with swing + twist parameterization
// https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
// https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
// http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
// https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
const _v1 = new Vector3();
const _v2 = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
function constrainSwingTwist(qT: Quaternion, lim: SwingTwistLimits): void {
  _v1.set(qT.x, qT.y, qT.z);
  //Check singularity: rotation by 180 degree
  if (_v1.lengthSq() < Number.EPSILON) {
    _v1.copy(lim.twistAxis).applyQuaternion(qT); //rotatedTwistAxis
    _v2.crossVectors(lim.twistAxis, _v1); //swingAxis
    if (_v2.lengthSq() > Number.EPSILON) {
      const swingAngle = _v1.angleTo(lim.twistAxis);
      _q2.setFromAxisAngle(_v2, swingAngle);
    } else {
      // more singularity:  rotation axis parallel to twist axis
      _q2.set(0, 0, 0, 1);
    }
    _q2.setFromAxisAngle(lim.twistAxis, Math.PI);
  } else {
    //twist
    _v1.projectOnVector(lim.twistAxis);
    _q1.set(_v1.x, _v1.y, _v1.z, qT.w);
    _q1.normalize();
    //swing
    _q2.copy(_q1).conjugate();
    _q2.premultiply(qT);
    _q2.normalize();
  }
  // Clamp twist angle
  _v1.set(_q1.x, _q1.y, _q1.z);
  if (_v1.lengthSq() > lim.twistPow2) {
    _v1.setLength(lim.twistMax);
    const sign = qT.w < 0 ? -1 : 1;
    _q1.set(_v1.x, _v1.y, _v1.z, sign * lim.twistW);
  }
  // Clamp swing angle
  _v1.set(_q2.x, _q2.y, _q2.z);
  if (_v1.lengthSq() > lim.swingPow2) {
    _v1.setLength(lim.swingMax);
    _q2.set(_v1.x, _v1.y, _v1.z, lim.swingW); //todo don't know why perserving sign here causes jumps. cancels out twist clamp?
  }
  qT.multiplyQuaternions(_q2, _q1); //swing * twist
}

export function attachEffector(offset: Vector3, parent: Object3D): Object3D {
  const axesHelper = new AxesHelper(50);
  (axesHelper.material as Material).depthTest = false;
  (axesHelper.material as Material).depthWrite = false;
  (axesHelper.material as Material).transparent = true; //makes axis show through mesh, draw order problem on lines?
  const effector = axesHelper;
  parent.add(effector);
  effector.position.copy(offset);

  const offsetWorld = new Vector3();
  const _m1 = new Matrix4();
  const _q1 = new Quaternion();
  const _up = new Vector3();
  parent.lookAt = (target: Vector3): void => {
    parent.updateWorldMatrix(true, false);
    _up.setFromMatrixColumn(parent.matrixWorld, 1); // Local y axis
    // Effector position is dependant on last orientation.
    // ToDo: Causes jerks with animationmixer:
    // effector.updateWorldMatrix(true, false);
    // Without updateWorldMatrix, we keep old matrixWorld cuz not updated by animation mixer
    offsetWorld.setFromMatrixPosition(effector.matrixWorld);
    _m1.lookAt(target, offsetWorld, _up);
    parent.quaternion.setFromRotationMatrix(_m1);
    if (parent.parent) {
      _m1.extractRotation(parent.parent.matrixWorld);
      _q1.setFromRotationMatrix(_m1);
      parent.quaternion.premultiply(_q1.inverse());
    }
  };
  return parent;
}

export function look3D(head: Object3D, eyes: [Object3D?] = []): Function {
  function makeTick(
    obj: Object3D,
    maxSpeed: number,
    limits: SwingTwistLimits
  ): Function {
    const lastQuat = new Quaternion().copy(obj.quaternion);
    return (target: Vector3, dt: number): void => {
      obj.lookAt(target);
      //limit angle change speed
      if (dt) rotateTowards(obj.quaternion, lastQuat, maxSpeed, dt);
      constrainSwingTwist(obj.quaternion, limits);
      lastQuat.copy(obj.quaternion);
    };
  }

  const tickers: Function[] = [makeTick(head, HEAD_SPEED, headLimits)];
  eyes.forEach(eye => {
    if (eye) tickers.push(makeTick(eye, EYE_SPEED, eyeLimits));
  });

  return (target: Vector3, dt = 0): void => {
    tickers.forEach(tick => tick(target, dt));
  };
}
