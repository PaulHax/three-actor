export declare const DOWN_DURATION = 0.048;
export declare const HOLD_DURATION = 0.048;
export declare const UP_DURATION = 0.072;
declare function calcTimeToNextBlink(): number;
export interface Blinker {
    blink: number;
    blinkTime: number;
}
export declare function makeBlinker(): Blinker;
export declare function tick(b: Blinker, dt: number, getOpenTime?: typeof calcTimeToNextBlink): void;
export {};
