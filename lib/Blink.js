export const DOWN_DURATION = 0.048;
export const HOLD_DURATION = 0.048;
export const UP_DURATION = 0.072;
const TIME_BETWEEN_BLINKS_MAX = 30;
const SKEW_BLINKS_EARLER = 3; //higher to make distribution earlier
// https://www.bloopanimation.com/blinking-animation/
// Todo blink on head turn and start talking
//from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
//Skew over 1 moves mean lower
function randomNormal(skew = 1) {
    const u = Math.random();
    const v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num < 0)
        return randomNormal(skew); // resample if below zero
    num = Math.pow(num, skew); // Skew
    return num;
}
//todo use some cumulative distribution function?
function calcTimeToNextBlink() {
    return randomNormal(SKEW_BLINKS_EARLER) * TIME_BETWEEN_BLINKS_MAX;
}
export function makeBlinker() {
    return {
        blink: 0,
        blinkTime: 0
    };
}
export function tick(b, dt, getOpenTime = calcTimeToNextBlink) {
    b.blinkTime += dt;
    const blinkTime = b.blinkTime;
    if (blinkTime > 0) {
        if (blinkTime < DOWN_DURATION) {
            b.blink = blinkTime / DOWN_DURATION;
        }
        else if (blinkTime < DOWN_DURATION + HOLD_DURATION) {
            //hold it
            b.blink = 1;
        }
        else if (blinkTime < DOWN_DURATION + HOLD_DURATION + UP_DURATION) {
            b.blink = 1 - (blinkTime - DOWN_DURATION - HOLD_DURATION) / UP_DURATION;
        }
        else {
            b.blink = 0; //done blinking
            //set next blink time.
            b.blinkTime =
                -1 * (DOWN_DURATION + HOLD_DURATION + UP_DURATION + getOpenTime());
        }
    }
}
//# sourceMappingURL=Blink.js.map