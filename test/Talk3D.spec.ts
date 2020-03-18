/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
jest.mock('three');
import { makeTalk } from '../src/Talk';
import { makeTalk3D, makeTalkTick } from '../src/Talk3D';
import {
  Mesh,
  PositionalAudio,
  AudioListener,
  Vector3,
  AudioAnalyser,
  Geometry
} from 'three';
const { Box3 } = jest.requireActual('three');

test('throws when no morph found on mesh', () => {
  expect(() => {
    makeTalk3D(
      new Mesh(),
      'mouth',
      new PositionalAudio(new AudioListener()),
      0.01,
      makeTalk()
    );
  }).toThrow();
});

function makeMeshMock(): Mesh {
  const meshMock = new Mesh();
  meshMock.morphTargetDictionary = { eyes: 0, mouth: 1 };
  meshMock.morphTargetInfluences = [0, 0];
  meshMock.geometry = new Geometry();
  meshMock.geometry.boundingBox = new Box3();
  return meshMock;
}

function mockSoundEmitter(): PositionalAudio {
  const mock = new PositionalAudio(new AudioListener());
  Object.defineProperty(mock, 'position', { get: () => new Vector3() });
  mock.context = ({
    createAnalyser: jest.fn().mockReturnValue({
      fftSize: 0,
      getByteFrequencyData: jest.fn().mockReturnValue(2.5)
    })
  } as unknown) as AudioContext;
  mock.getOutput = jest.fn().mockReturnValue({ connect: jest.fn() });
  mock.isPlaying = true;
  return mock;
}

const mockedAudioAnalyser = AudioAnalyser as jest.Mock<AudioAnalyser>;
mockedAudioAnalyser.mockImplementation(() => {
  const mock = Object.create(AudioAnalyser.prototype) as AudioAnalyser;
  mock.getAverageFrequency = jest
    .fn()
    .mockReturnValue(0)
    .mockReturnValueOnce(1);
  mock.analyser = { smoothingTimeConstant: 0 } as AnalyserNode;
  return mock;
});

test('finds morph', () => {
  const mesh = makeMeshMock();
  const talk3D = makeTalk3D(
    mesh,
    'mouth',
    mockSoundEmitter(),
    0.01,
    makeTalk(),
    new mockedAudioAnalyser()
  );
  expect(talk3D.morphIndex).toEqual(1); //implmentation test
});

test('no opening morph until vocals set and time passes', () => {
  const meshMock = makeMeshMock();
  const talk = makeTalk();
  const talk3D = makeTalk3D(
    meshMock,
    'mouth',
    mockSoundEmitter(),
    0.01,
    talk,
    new mockedAudioAnalyser()
  );
  const tickTalk = makeTalkTick(talk3D, talk);
  const morphs = meshMock.morphTargetInfluences;
  if (morphs) {
    expect(morphs[1]).toEqual(0);
    tickTalk();
    expect(morphs[1]).toBeGreaterThan(0);
  }
});

it('Opens then closes', () => {
  const meshMock = makeMeshMock();
  const talk = makeTalk();
  const talk3D = makeTalk3D(
    meshMock,
    'mouth',
    mockSoundEmitter(),
    0.01,
    talk,
    new mockedAudioAnalyser()
  );
  const tickTalk = makeTalkTick(talk3D, talk);
  const morphs = meshMock.morphTargetInfluences!;
  tickTalk();
  expect(morphs[1]).toBeGreaterThan(0);
  for (let i = 0; i++; i < 10) {
    tickTalk();
  }
  expect(morphs[1]).toBeCloseTo(0);
});
