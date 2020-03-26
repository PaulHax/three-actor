import { Object3D, Vector3, Quaternion } from 'three';
export declare const EFFECTOR_CLOSE_ENOUGH_ANGLE: number;
export declare function attachEffector(offset: Vector3, parent: Object3D): Object3D;
export declare function look3D(head: Object3D, eyes?: Object3D[], body?: Object3D): Function;
export declare function blendTo(startTarget: Quaternion, endTarget: Quaternion, blendTime: number): Function;
