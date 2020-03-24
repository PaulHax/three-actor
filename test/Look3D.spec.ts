import { Bone, Vector3, Euler, MathUtils, Object3D, Quaternion } from 'three';
import {
  look3D,
  attachEffector,
  blendTo,
  EFFECTOR_CLOSE_ENOUGH_ANGLE
} from '../src/Look3D';

test('constructs', () => {
  const neckBone = new Bone();
  const neckLook = look3D(neckBone);
  expect(neckLook).toBeTruthy();
});

test('View3D ticks', () => {
  const neckBone = new Bone();
  const neckLook = look3D(neckBone);
  const target = new Vector3(0.2, 0.3, 5);
  expect(neckLook(target)).toBeUndefined(); //todo check what?
});

test('bone looks at target', () => {
  const bone = new Bone();
  const boneLook = look3D(bone);
  const target = new Vector3(0.2, 0.3, 5);
  boneLook(target);
  bone.updateWorldMatrix(true, false);
  const angleToTarget = new Vector3(0, 0, 1)
    .applyMatrix4(bone.matrixWorld) //get forward vector
    .angleTo(
      //Neck to target vector
      target.sub(new Vector3().setFromMatrixPosition(bone.matrixWorld))
    );
  expect(angleToTarget).toBeLessThan(0.0001);
});

test('Bone looks at target from position offset', () => {
  const bone = new Bone();
  const offset = new Vector3(0, 1, 0);
  const target = new Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new Vector3().copy(target).sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target);

  bone.updateWorldMatrix(true, false);
  const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
  const angleToTarget = boneForward.angleTo(effectorToTarget);
  expect(angleToTarget).toBeLessThan(0.0001);
});

test('when bone is a child, effector works', () => {
  const root = new Object3D();
  root.quaternion.setFromEuler(new Euler(0, Math.PI / 4, Math.PI / 4));
  const bone = new Bone();
  root.add(bone);
  const offset = new Vector3(0, 1, 0);
  const target = new Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  bone.updateWorldMatrix(true, false);
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new Vector3().copy(target).sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target);

  bone.updateWorldMatrix(true, false);
  const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
  const angleToTarget =
    boneForward.angleTo(effectorToTarget) * MathUtils.RAD2DEG;
  expect(angleToTarget).toBeLessThan(1);
});

test('Clamp head angles', () => {
  const root = new Object3D();
  root.quaternion.setFromEuler(new Euler(0, Math.PI, 0));
  const bone = new Bone();
  root.add(bone);
  const offset = new Vector3(0, 1, 0);
  const target = new Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new Vector3().copy(target).sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target);

  bone.updateWorldMatrix(true, false);
  const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
  const angleToTarget = boneForward.angleTo(effectorToTarget);
  expect((angleToTarget * 180) / Math.PI).toBeGreaterThan(75);
});

test('Head turns to target over time with easing speed', () => {
  const root = new Object3D();
  const bone = new Bone();
  root.add(bone);
  root.quaternion.setFromEuler(new Euler(0, Math.PI / 4, 0));
  const offset = new Vector3(0, 1, 0);
  const target = new Vector3(1, -0.1, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new Vector3().copy(target).sub(effectorWorldPos);

  const boneLook = look3D(attachEffector(offset, bone));
  let angleToTargetOld = 2 * Math.PI;
  let angleDeltaOld = 2 * Math.PI;
  while (angleToTargetOld > EFFECTOR_CLOSE_ENOUGH_ANGLE * MathUtils.RAD2DEG) {
    boneLook(target, 0.2);
    bone.updateWorldMatrix(true, false);
    const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
    const newAngleToTarget =
      boneForward.angleTo(effectorToTarget) * MathUtils.RAD2DEG;
    expect(newAngleToTarget).toBeLessThan(angleToTargetOld);
    const newAngleDelta = angleToTargetOld - newAngleToTarget;
    expect(newAngleDelta).toBeLessThanOrEqual(angleDeltaOld); //easing
    angleDeltaOld = newAngleDelta;
    angleToTargetOld = newAngleToTarget;
  }
});

test('Eyes turn faster than head', () => {
  const root = new Object3D();
  const head = new Bone();
  root.add(head);
  const eye = new Bone();
  head.add(eye);
  root.quaternion.setFromEuler(new Euler(0, Math.PI / 4, 0));
  eye.position.set(0, 1, 0);
  const target = new Vector3(0, 1, 5);

  const boneLook = look3D(attachEffector(eye.position, head), [eye]);
  // eye.updateWorldMatrix(true, false);
  // head.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug need to update effector
  boneLook(target, 0.02);

  eye.updateWorldMatrix(true, false); //updates head as parent
  const effectorToTarget = new Vector3()
    .copy(target)
    .sub(new Vector3().setFromMatrixPosition(eye.matrixWorld));
  const headForward = new Vector3().setFromMatrixColumn(head.matrixWorld, 2); // z axis
  const eyeForward = new Vector3().setFromMatrixColumn(eye.matrixWorld, 2); // z axis
  expect(eyeForward.angleTo(effectorToTarget)).toBeLessThan(
    headForward.angleTo(effectorToTarget)
  );
});

test('Blend to some target', () => {
  const starting = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    Math.PI
  );
  const newTarget = new Quaternion();
  const blendTick = blendTo(starting, newTarget, 0.1);
  for (let i = 0; i < 2; i++) {
    const startAngle = starting.angleTo(newTarget);
    blendTick(0.016);
    const endAngle = starting.angleTo(newTarget);
    expect(startAngle).toBeGreaterThan(endAngle);
  }
});

test('Blend starting quat into changing current quat over time', () => {
  const starting = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    Math.PI
  );
  const newTarget = new Quaternion();
  const blendTick = blendTo(starting, starting, 0.1);
  for (let i = 0; i < 2; i++) {
    const startAngle = starting.angleTo(newTarget);
    starting.copy(newTarget);
    blendTick(0.016);
    const endAngle = starting.angleTo(newTarget);
    expect(startAngle).toBeGreaterThan(endAngle);
  }
});

test('Blend does not go over', () => {
  const starting = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    Math.PI
  );
  const newTarget = new Quaternion();
  const blendTick = blendTo(starting, starting, 0.1);
  for (let i = 0; i < 3; i++) {
    starting.copy(newTarget);
    blendTick(0.05);
  }
  expect(starting.angleTo(newTarget)).toBeCloseTo(0);
});
