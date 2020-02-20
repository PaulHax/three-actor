import { Bone } from 'three';

export interface Look3D {
  neck: Bone;
}

export function makeLook3D(neck: Bone): Look3D {
  return {
    neck: neck //side effect
  };
}

export function makeTick(view: Look3D): Function {
  return () => {};
}
