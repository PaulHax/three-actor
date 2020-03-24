import { makeBlink3D, makeBlinkTick } from '../src/Blink3D';
import { makeBlinker } from '../src/Blink';
import { Mesh } from 'three';

const SUB_FRAME_TIME = 0.0001;

test('throws when no morph found on mesh', () => {
  expect(() => {
    makeBlink3D(new Mesh(), '', '');
  }).toThrow();
});
test('start blinking over time', () => {
  const meshMock = new Mesh();
  meshMock.morphTargetDictionary = { l: 0, r: 1 };
  meshMock.morphTargetInfluences = [0, 0];
  const bView = makeBlink3D(meshMock, 'l', 'r');
  const bState = makeBlinker();
  const doTick = makeBlinkTick(bState, bView);
  doTick(SUB_FRAME_TIME);
  expect(meshMock.morphTargetInfluences[0]).toBeGreaterThan(0);
});
