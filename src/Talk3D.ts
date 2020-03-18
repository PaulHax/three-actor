import { Mesh, Audio, AudioAnalyser } from 'three';
import { TalkState, tick } from './Talk';
import { getMorphID } from './Utils3D';

export interface Talk3D {
  morphTargetInfluences: number[];
  morphIndex: number;
}

export function makeTalk3D(
  mesh: Mesh,
  morphName: string,
  soundEmitter: Audio<AudioNode>,
  ampFactor: number,
  talk: TalkState,
  analyser: AudioAnalyser = new AudioAnalyser(soundEmitter, 32)
): Talk3D {
  analyser.analyser.smoothingTimeConstant = 0;
  talk.speach = (): number => {
    if (soundEmitter.isPlaying) {
      return analyser.getAverageFrequency() * ampFactor;
    } else {
      return 0;
    }
  };
  return {
    morphTargetInfluences: mesh.morphTargetInfluences as number[],
    morphIndex: getMorphID(mesh, morphName)
  };
}

export function update(talk3D: Talk3D, talk: TalkState): Talk3D {
  talk3D.morphTargetInfluences[talk3D.morphIndex] = talk.volume;
  return talk3D;
}

//todo generalize tick function to utils
export function makeTalkTick(view: Talk3D, state: TalkState): Function {
  return (): void => {
    tick(state);
    update(view, state);
  };
}
