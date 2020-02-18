export declare const DOWN_DURATION = 48;
export declare const HOLD_DURATION = 48;
export declare const UP_DURATION = 72;
declare function calcTimeToNextBlink(): number;
export interface Blinker {
    blink: number;
    blinkStartTime: number;
}
export declare function makeBlinker(): Blinker;
export declare function tick(b: Blinker, time: number, getOpenTime?: typeof calcTimeToNextBlink): void;
export {};
