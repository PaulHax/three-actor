import { makeBlinker, tick } from '../src/Blink';

const DOWN_DURATION = 48; //denomiator is milliseconds to move through full range
const HOLD_DURATION = 48; //denomiator is milliseconds to move through full range
const UP_DURATION = 72; //denomiator is milliseconds to move through full range
const BLINK_TOTAL_TIME = DOWN_DURATION + HOLD_DURATION + UP_DURATION;

test('should not start blinking', () => {
  const blinker = makeBlinker();
  expect(blinker.blink).toBeCloseTo(0);
});

test('should blink all the way down after blink down duration', () => {
  const blinker = makeBlinker();
  tick(blinker, 50);
  expect(blinker.blink).toBeCloseTo(1.0);
});

test('should blink some with small time passed, not just jump to end', () => {
  const blinker = makeBlinker();
  tick(blinker, 10);
  expect(blinker.blink).toBeLessThan(0.9);
});

test('eye starts to open a little', () => {
  const blinker = makeBlinker();
  tick(blinker, BLINK_TOTAL_TIME - UP_DURATION + 0.001);
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
  tick(blinker, BLINK_TOTAL_TIME + 1, eyeSpacingTime);
  tick(blinker, BLINK_TOTAL_TIME + eyeSpacingTime() + 1, eyeSpacingTime);
  expect(blinker.blink).toBeGreaterThan(0);
});

// const mockMath = Object.create(global.Math);
// mockMath.random = (): number => 0.5;
// global.Math = mockMath;

// test("should blink back open after closing eyes", () => {
//   const blinker = makeBlinker();
//   blinker.targetBlink = 1;
//   updateBlink(blinker, 40);
//   blinker.targetBlink = 0;
//   updateBlink(blinker, 1500);
//   expect(blinker.blink).toBeCloseTo(0.0);
//   //should stay closed after manual targetBlink sets
//   for (let i = 0; i < 30; i++) {
//     tick(blinker, 32); //sub triggering of new blink
//   }
//   expect(blinker.targetBlink).toBeCloseTo(0.0);
// });

// test("should start blinking randomly", () => {
//   const blinker = makeBlinker();
//   tick(blinker, 1000000); //might break if move to cdf
//   expect(blinker.targetBlink).toBeCloseTo(1.0);
// });

// test("should not start blinking randomly", () => {
//   const blinker = makeBlinker();
//   for (let i = 0; i < 30; i++) {
//     tick(blinker, 32); //sub triggering of new blink
//   }
//   expect(blinker.targetBlink).toBeCloseTo(0.0);
// });

// test("should start blinking back", () => {
//   const blinker = makeBlinker();
//   tick(blinker, 340);
//   for (let i = 0; i < 30; i++) {
//     tick(blinker, 32); //sub triggering of new blink
//   }
//   expect(blinker.blink).toBeCloseTo(0);
// });
