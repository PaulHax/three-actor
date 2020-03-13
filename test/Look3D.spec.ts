import * as THREE from 'three';
import { Bone, Vector3, MathUtils } from 'three';
import { look3D, attachEffector } from '../src/Look3D';

test('constructs', () => {
  const neckBone = new Bone();
  const neckLook = look3D(neckBone);
  expect(neckLook).toBeTruthy();
});

test('View3D ticks', () => {
  const neckBone = new THREE.Bone();
  const neckLook = look3D(neckBone);
  const target = new THREE.Vector3(0.2, 0.3, 5);
  expect(neckLook(target)).toBeUndefined(); //todo check what?
});

test('bone looks at target', () => {
  const bone = new THREE.Bone();
  const boneLook = look3D(bone);
  const target = new THREE.Vector3(0.2, 0.3, 5);
  boneLook(target);
  bone.updateWorldMatrix(true, false);
  const angleToTarget = new THREE.Vector3(0, 0, 1)
    .applyMatrix4(bone.matrixWorld) //get forward vector
    .angleTo(
      //Neck to target vector
      target.sub(new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld))
    );
  expect(angleToTarget).toBeLessThan(0.0001);
});

test('Bone looks at target from position offset', () => {
  const bone = new THREE.Bone();
  const offset = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new THREE.Vector3()
    .copy(target)
    .sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target);

  bone.updateWorldMatrix(true, false);
  const boneForward = new THREE.Vector3().setFromMatrixColumn(
    bone.matrixWorld,
    2
  );
  const angleToTarget = boneForward.angleTo(effectorToTarget);
  expect(angleToTarget).toBeLessThan(0.0001);
});

test('when bone is a child, effector works', () => {
  const root = new THREE.Object3D();
  root.quaternion.setFromEuler(new THREE.Euler(0, 0, Math.PI / 4));
  const bone = new THREE.Bone();
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
  expect((angleToTarget * 180) / Math.PI).toBeLessThan(1);
});

test('Clamp head angles', () => {
  const root = new THREE.Object3D();
  root.quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));
  const bone = new THREE.Bone();
  root.add(bone);
  const offset = new Vector3(0, 1, 0);
  const target = new THREE.Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new THREE.Vector3()
    .copy(target)
    .sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target);

  bone.updateWorldMatrix(true, false);
  const boneForward = new THREE.Vector3().setFromMatrixColumn(
    bone.matrixWorld,
    2
  );
  const angleToTarget = boneForward.angleTo(effectorToTarget);
  expect((angleToTarget * 180) / Math.PI).toBeGreaterThan(75);
});

test('Head turns to target over time at some max speed', () => {
  const root = new THREE.Object3D();
  const bone = new THREE.Bone();
  root.add(bone);
  root.quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 4, 0));
  const offset = new Vector3(0, 1, 0);
  const target = new THREE.Vector3(1, 0, 5);
  //Save this cuz bone.matrixWorld will change
  const effectorWorldPos = offset.clone().applyMatrix4(bone.matrixWorld);
  const effectorToTarget = new Vector3().copy(target).sub(effectorWorldPos);

  //actual stuff to test
  const boneLook = look3D(attachEffector(offset, bone));
  bone.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug
  boneLook(target, 0.1);

  bone.updateWorldMatrix(true, false);
  const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
  let angleToTarget = boneForward.angleTo(effectorToTarget) * MathUtils.RAD2DEG;
  expect(angleToTarget).toBeGreaterThan(10);

  for (let i = 0; i < 3; i++) {
    boneLook(target, 0.02);
    bone.updateWorldMatrix(true, false);
    const boneForward = new Vector3().setFromMatrixColumn(bone.matrixWorld, 2);
    const newAngleToTarget =
      boneForward.angleTo(effectorToTarget) * MathUtils.RAD2DEG;
    expect(newAngleToTarget).toBeLessThan(angleToTarget);
    angleToTarget = newAngleToTarget;
  }
});

test('Eyes turn faster than head', () => {
  const root = new THREE.Object3D();
  const head = new THREE.Bone();
  root.add(head);
  const eye = new THREE.Bone();
  head.add(eye);
  root.quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 4, 0));
  eye.position.set(0, 1, 0);
  const target = new THREE.Vector3(1, 0, 5);

  const boneLook = look3D(attachEffector(eye.position, head), [eye]);
  eye.updateWorldMatrix(true, false);
  head.updateWorldMatrix(false, true); //todo hack for animationmixer jerk bug need to update effector
  boneLook(target, 0.1);

  eye.updateWorldMatrix(true, false);
  const effectorToTarget = new Vector3()
    .copy(target)
    .sub(new Vector3().setFromMatrixPosition(eye.matrixWorld));
  const headForward = new Vector3().setFromMatrixColumn(head.matrixWorld, 2); // z axis
  const eyeForward = new Vector3().setFromMatrixColumn(eye.matrixWorld, 2); // z axis
  expect(eyeForward.angleTo(effectorToTarget)).toBeLessThan(
    headForward.angleTo(effectorToTarget)
  );
});
