import {
  makeBlinker,
  tick,
  DOWN_DURATION,
  HOLD_DURATION,
  UP_DURATION
} from '../src/Blink';

const BLINK_TOTAL_TIME = DOWN_DURATION + HOLD_DURATION + UP_DURATION;
const SUB_FRAME_TIME = 0.0001;

test('should not start blinking', () => {
  const blinker = makeBlinker();
  expect(blinker.blink).toBeCloseTo(0);
});

test('should blink all the way down after blink down duration', () => {
  const blinker = makeBlinker();
  tick(blinker, DOWN_DURATION + SUB_FRAME_TIME);
  expect(blinker.blink).toBeCloseTo(1.0);
});

test('should blink some with small time passed, not just jump to end', () => {
  const blinker = makeBlinker();
  tick(blinker, SUB_FRAME_TIME);
  expect(blinker.blink).toBeLessThan(0.9);
});

test('eye starts to open a little', () => {
  const blinker = makeBlinker();
  tick(blinker, BLINK_TOTAL_TIME - UP_DURATION + SUB_FRAME_TIME);
  expect(blinker.blink).toBeLessThan(1);
  expect(blinker.blink).toBeCloseTo(1.0);
});

test('eye open back up after long time', () => {
  const blinker = makeBlinker();
  tick(blinker, 1000);
  expect(blinker.blink).toBeCloseTo(0);
});

function eyeSpacingTime(): number {
  return 100;
}

test('eye stays open while waiting for next blink', () => {
  const blinker = makeBlinker();
  tick(blinker, BLINK_TOTAL_TIME + 1, eyeSpacingTime);
  expect(blinker.blink).toBeCloseTo(0);
});

test('eye starts blinking again', () => {
  const blinker = makeBlinker();
  tick(blinker, BLINK_TOTAL_TIME + SUB_FRAME_TIME, eyeSpacingTime);
  tick(
    blinker,
    BLINK_TOTAL_TIME + eyeSpacingTime() + SUB_FRAME_TIME,
    eyeSpacingTime
  );
  expect(blinker.blink).toBeGreaterThan(0);
});
