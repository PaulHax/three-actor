import { AudioAnalyser } from 'three';
import { tick } from './Talk';
import { getMorphID } from './Utils3D';
export function makeTalk3D(mesh, morphName, soundEmitter, ampFactor, talk, analyser = new AudioAnalyser(soundEmitter, 32)) {
    analyser.analyser.smoothingTimeConstant = 0;
    talk.speach = () => {
        if (soundEmitter.isPlaying) {
            return analyser.getAverageFrequency() * ampFactor;
        }
        else {
            return 0;
        }
    };
    return {
        morphTargetInfluences: mesh.morphTargetInfluences,
        morphIndex: getMorphID(mesh, morphName)
    };
}
export function update(talk3D, talk) {
    talk3D.morphTargetInfluences[talk3D.morphIndex] = talk.volume;
    return talk3D;
}
//todo generalize tick function to utils
export function makeTalkTick(view, state) {
    return () => {
        tick(state);
        update(view, state);
    };
}
//# sourceMappingURL=Talk3D.js.map