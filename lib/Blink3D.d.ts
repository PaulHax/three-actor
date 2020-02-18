import { Mesh } from "three";
import { Blinker } from "./Blink";
export interface Blink3D {
    morphTargetInfluences: number[];
    morphIndexL: number;
    morphIndexR: number;
    morphFactor: number;
}
export declare function makeBlink3D(mesh: Mesh, morphL: string, morphR: string, morphFactor?: number): Blink3D;
export declare function update(obj: Blink3D, state: Blinker): void;
export declare function makeBlinkTick(state: Blinker, view: Blink3D): Function;
