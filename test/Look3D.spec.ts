import * as THREE from 'three';
import { makeLook3D, makeTick } from '../src/Look3D';

test('constructs', () => {
  const neckBone = new THREE.Bone();
  const view = makeLook3D(neckBone);
  expect(view).toBeTruthy();
});

test('View3D ticks', () => {
  const neckBone = new THREE.Bone();
  const view = makeLook3D(neckBone);
  const tick = makeTick(view);
  expect(tick).toBeTruthy();
});

test('Neck looks at target', () => {
  const target = new THREE.Vector3(0.2, 0.3, 5);
  const neckBone = new THREE.Bone();
  const view = makeLook3D(neckBone);
  const tick = makeTick(view);
  tick();
  // neckBone.updateWorldMatrix(true, false); //?
  const angleToTarget = new THREE.Vector3(0, 0, 1)
    .applyMatrix4(neckBone.matrixWorld) //get forward vector
    .angleTo(
      //Neck to target vector
      target.sub(
        new THREE.Vector3().setFromMatrixPosition(neckBone.matrixWorld)
      )
    );
  expect(angleToTarget).toBeLessThan(0.01);
});
