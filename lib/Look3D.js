import { Object3D, Vector3, Matrix4, Quaternion, MathUtils } from 'three';
const BODY_TWIST_MAX = 180;
const BODY_SWING_MAX = 0;
const BODY_SPEED = MathUtils.DEG2RAD * 120;
const HEAD_YAW_MAX = 50;
const HEAD_TILT_MAX = 30;
const HEAD_SPEED = MathUtils.DEG2RAD * 200; // 200 Degrees
const EYE_TWIST_MAX = 8;
const EYE_SWING_MAX = 25;
const EYE_SPEED = HEAD_SPEED * 300;
const EASING_START_ANGLE = MathUtils.DEG2RAD * 15;
const EYE_EASING_START_ANGLE = MathUtils.DEG2RAD * 10;
export const EFFECTOR_CLOSE_ENOUGH_ANGLE = MathUtils.DEG2RAD * 0.1;
const EFFECTOR_NAME = 'look3dEffector';
//Side effects: manipulates parameters
function rotateTowards(targetQuat, lastQuat, speed, dt) {
    //cap speed
    const angleDiff = lastQuat.angleTo(targetQuat);
    const maxAngleChange = Math.min(speed * dt, angleDiff);
    // equals in >= comparison for when angleDiff smaller than speed, like when hips are close enough
    if (angleDiff >= maxAngleChange) {
        lastQuat.rotateTowards(targetQuat, maxAngleChange);
        targetQuat.copy(lastQuat); // copy, not first "out" rotateTowards, so under maxAngleChange path is faster
    }
}
function makeLims(twistA, tMax, sMax) {
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
const bodyLimits = makeLims(new Vector3().set(0, 1, 0), BODY_TWIST_MAX, BODY_SWING_MAX);
const headLimits = makeLims(new Vector3().set(0, 1, 0), HEAD_YAW_MAX, HEAD_TILT_MAX);
const eyeLimits = makeLims(new Vector3().set(1, 0, 0), //todo something wrong with extream angles and tilted avatar.
EYE_TWIST_MAX, EYE_SWING_MAX);
//clamp rotation with swing + twist parameterization
// https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
// https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
// http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
// https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
const _v1 = new Vector3();
const _v2 = new Vector3();
const _q1 = new Quaternion();
const _q2 = new Quaternion();
function constrainSwingTwist(qT, lim) {
    _v1.set(qT.x, qT.y, qT.z);
    //Check singularity: rotation by 180 degree
    if (_v1.lengthSq() < Number.EPSILON) {
        _v1.copy(lim.twistAxis).applyQuaternion(qT); //rotatedTwistAxis
        _v2.crossVectors(lim.twistAxis, _v1); //swingAxis
        if (_v2.lengthSq() > Number.EPSILON) {
            const swingAngle = _v1.angleTo(lim.twistAxis);
            _q2.setFromAxisAngle(_v2, swingAngle);
        }
        else {
            // more singularity:  rotation axis parallel to twist axis
            _q2.set(0, 0, 0, 1);
        }
        _q2.setFromAxisAngle(lim.twistAxis, Math.PI);
    }
    else {
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
export function attachEffector(offset, parent) {
    // const axesHelper = new AxesHelper(50);
    // (axesHelper.material as Material).depthTest = false;
    // (axesHelper.material as Material).depthWrite = false;
    // (axesHelper.material as Material).transparent = true; //makes axis show through mesh, draw order problem on lines?
    // const effector = axesHelper;
    const effector = new Object3D();
    effector.name = EFFECTOR_NAME;
    parent.add(effector);
    effector.position.copy(offset);
    const offsetWorld = new Vector3();
    const _m1 = new Matrix4();
    const _q1 = new Quaternion();
    const _up = new Vector3();
    parent.lookAt = (target) => {
        parent.updateWorldMatrix(true, false);
        _up.setFromMatrixColumn(parent.matrixWorld, 1); // Local y axis
        // Effector position is dependant on last orientation.
        // Causes jerks with animationmixer:
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
export function look3D(head, eyes = [], body) {
    function makeTick(obj, maxSpeed, limits, easingStartAngle = EASING_START_ANGLE) {
        const lastQuat = new Quaternion().copy(obj.quaternion);
        return (target, dt, angleLeft) => {
            obj.lookAt(target);
            //limit angle change speed
            if (dt) {
                const n = Math.min(angleLeft / easingStartAngle, 1);
                const speedEase = n * n; //easing from https://gist.github.com/gre/1650294
                rotateTowards(obj.quaternion, lastQuat, maxSpeed * speedEase, dt);
            }
            if (limits)
                constrainSwingTwist(obj.quaternion, limits);
            lastQuat.copy(obj.quaternion);
        };
    }
    const objs = []; //copy back quats that got overwriten by AnimationMixer
    const tickers = [];
    const eyeTicks = [];
    eyes.forEach(eye => {
        const obj = eye;
        objs.push({ obj: obj, quat: obj.quaternion.clone() });
        eyeTicks.push(makeTick(obj, EYE_SPEED, eyeLimits, EYE_EASING_START_ANGLE));
    });
    if (eyeTicks.length >= 1)
        tickers.push(eyeTicks);
    objs.push({ obj: head, quat: head.quaternion.clone() });
    tickers.push(makeTick(head, HEAD_SPEED, headLimits));
    if (body) {
        objs.push({ obj: body, quat: body.quaternion.clone() });
        tickers.push(makeTick(body, BODY_SPEED, bodyLimits));
    }
    const effectorRoot = eyes.length >= 1 ? eyes[0] : head;
    const effectorFound = effectorRoot.getObjectByName(EFFECTOR_NAME);
    const effector = effectorFound ? effectorFound : effectorRoot;
    const effectorToTarget = new Vector3();
    const effectorPosWorld = new Vector3();
    const effectorForward = new Vector3();
    return (target, dt = 0) => {
        function effectorToTargetAngle() {
            effector.updateWorldMatrix(true, false); //Todo improve performace
            effectorToTarget
                .copy(target)
                .sub(effectorPosWorld.setFromMatrixPosition(effector.matrixWorld));
            effectorForward.setFromMatrixColumn(effector.matrixWorld, 2); // z axis
            return effectorForward.angleTo(effectorToTarget);
        }
        //copy back quats that got overwriten by AnimationMixer
        objs.forEach(({ obj, quat }) => obj.quaternion.copy(quat));
        for (const tick of tickers) {
            const angleLeft = effectorToTargetAngle();
            if (angleLeft > EFFECTOR_CLOSE_ENOUGH_ANGLE) {
                if (Array.isArray(tick)) {
                    //Move both eyes if moving one
                    tick.forEach(ticky => ticky(target, dt, angleLeft));
                }
                else {
                    tick(target, dt, angleLeft);
                }
            }
        }
        objs.forEach(({ obj, quat }) => quat.copy(obj.quaternion)); //save for next frame
    };
}
export function blendTo(startTarget, endTarget, blendTime) {
    const start = startTarget.clone();
    const end = endTarget === startTarget ? new Quaternion() : endTarget;
    let elapsedTime = 0;
    let isDone = false;
    return (dt) => {
        if (!isDone) {
            elapsedTime += dt;
            const t = elapsedTime / blendTime;
            //https://gist.github.com/gre/1650294
            const percentDone = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            if (t >= 1) {
                startTarget.copy(end);
                isDone = true;
            }
            else {
                if (endTarget === startTarget) {
                    // When something else moves the target and we need to blend to the new rotation
                    end.copy(endTarget);
                }
                startTarget.copy(start).slerp(end, percentDone); // Quaternion.slerp(start, end, startTarget, percentDone);
            }
        }
    };
}
//# sourceMappingURL=Look3D.js.map