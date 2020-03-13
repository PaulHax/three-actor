import { Mesh, Audio, Matrix4, Box3 } from 'three';

export function getMorphID(mesh: Mesh, id: string): number {
  if (
    mesh.morphTargetDictionary &&
    Object.prototype.hasOwnProperty.call(mesh.morphTargetDictionary, id)
  ) {
    return mesh.morphTargetDictionary[id];
  } else {
    throw 'Error: Did not find morph with name: ' + id;
  }
}

export function positionSound(mesh: Mesh, audio: Audio<AudioNode>): void {
  mesh.add(audio);
  audio.updateWorldMatrix(true, true);

  //Set mouth position usualy near world y max
  const box = new Box3();
  mesh.geometry.computeBoundingBox();
  box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
  box.max.x = box.max.z = 0;
  box.max.y *= 0.85;

  const m = new Matrix4();
  if (mesh.parent) {
    m.getInverse(mesh.parent.matrixWorld);
  }
  box.max.applyMatrix4(m);
  audio.position.copy(box.max);
}
