import { getMorphID } from './Utils3D';
import { tick } from './Blink';
export function makeBlink3D(mesh, morphL, morphR, morphFactor = 1) {
    return {
        morphTargetInfluences: mesh.morphTargetInfluences,
        morphIndexL: getMorphID(mesh, morphL),
        morphIndexR: getMorphID(mesh, morphR),
        morphFactor: morphFactor
    };
}
export function update(obj, state) {
    obj.morphTargetInfluences[obj.morphIndexL] = state.blink * obj.morphFactor;
    obj.morphTargetInfluences[obj.morphIndexR] = state.blink * obj.morphFactor;
}
//todo generalize tick function to utils
export function makeBlinkTick(state, view) {
    return (timestamp) => {
        tick(state, timestamp);
        update(view, state);
    };
}
//# sourceMappingURL=Blink3D.js.map