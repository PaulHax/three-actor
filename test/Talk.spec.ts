import { makeTalk, tick } from '../src/Talk';

const vocals = (): number => {
  return 2;
};

test('state created', () => {
  expect(makeTalk(vocals)).not.toBeNull();
});

test('Start talking, then tick, then volume changes', () => {
  const talkState = makeTalk(vocals);
  expect(talkState.volume).toEqual(0);
  tick(talkState);
  expect(talkState.volume).toBeGreaterThan(0);
});
