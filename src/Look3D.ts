import { Bone, Vector3 } from 'three';

export interface Look3D {
  neck: Bone;
}

export function makeLook3D(target: Vector3, neck: Bone): Look3D {
  return {
    neck: neck //side effect
  };
}

// export function makeTick(view: Look3D): Function {
//   return () => {
//     view.neck.lookAt();
//   };
// }

export function look3D(neck: Bone): Function {
  return (target: Vector3): void => {
    neck.lookAt(target);
  };
}
