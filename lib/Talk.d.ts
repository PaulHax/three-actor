export interface Speach {
    (): number;
}
export interface TalkState {
    volume: number;
    speach?: Speach;
}
export declare function makeTalk(speachFunc?: Speach): TalkState;
export declare function tick(talk: TalkState): TalkState;
