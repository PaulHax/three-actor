import { makeLook3D, makeTick } from '../src/Look3D';

test('constructs', () => {
  const view = makeLook3D();
  expect(view).toBeTruthy();
});

test('View3D ticks', () => {
  const view = makeLook3D();
  const tick = makeTick(view);
  expect(tick).toBeTruthy();
});
