import { Mesh, Audio, AudioAnalyser } from 'three';
import { TalkState } from './Talk';
export interface Talk3D {
    morphTargetInfluences: number[];
    morphIndex: number;
}
export declare function makeTalk3D(mesh: Mesh, morphName: string, soundEmitter: Audio<AudioNode>, ampFactor: number, talk: TalkState, analyser?: AudioAnalyser): Talk3D;
export declare function update(talk3D: Talk3D, talk: TalkState): Talk3D;
export declare function makeTalkTick(view: Talk3D, state: TalkState): Function;
