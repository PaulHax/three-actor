import { Mesh } from 'three';
import { getMorphID } from './Utils3D';
import { Blinker, tick } from './Blink';

export interface Blink3D {
  morphTargetInfluences: number[];
  morphIndexL: number;
  morphIndexR: number;
  morphFactor: number;
}

export function makeBlink3D(
  mesh: Mesh,
  morphL: string,
  morphR: string,
  morphFactor = 1
): Blink3D {
  return {
    morphTargetInfluences: mesh.morphTargetInfluences as number[],
    morphIndexL: getMorphID(mesh, morphL),
    morphIndexR: getMorphID(mesh, morphR),
    morphFactor: morphFactor
  };
}

export function update(obj: Blink3D, state: Blinker): void {
  obj.morphTargetInfluences[obj.morphIndexL] = state.blink * obj.morphFactor;
  obj.morphTargetInfluences[obj.morphIndexR] = state.blink * obj.morphFactor;
}

//todo generalize tick function to utils
export function makeBlinkTick(state: Blinker, view: Blink3D): Function {
  return (timestamp: number): void => {
    tick(state, timestamp);
    update(view, state);
  };
}
