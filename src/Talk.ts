const JITTER_RADIUS = 0.8; // Higher means more filtering or weighting of old signal

export interface Speach {
  (): number;
}

export interface TalkState {
  volume: number;
  speach?: Speach;
}

export function makeTalk(speachFunc?: Speach): TalkState {
  return {
    volume: 0,
    speach: speachFunc
  };
}

//todo  low pass filter: try double expoential moving average filter.
//ToDo Frame of lag as sound starts before mouth movement as we can't precive asynchory if visual is under 130 ms after audio ?
// https://pdfs.semanticscholar.org/95ba/3dfffeb7dd133b23b90f1e25eee7a2b7015a.pdf?_ga=2.166311166.1791214883.1572632425-210607018.1572632425
// this.morphInfluences[this.jawMorphIndex] = lastV * Talker.VOL_FILTER + currentV * Talker.VOL_F_INV;
export function tick(talk: TalkState): TalkState {
  if (talk.speach) {
    //filter morph change in amplitude
    let newVolume = talk.speach();
    const oldAmount = talk.volume;
    const diff = Math.abs(oldAmount - newVolume);
    if (diff <= JITTER_RADIUS) {
      const filterAmount = diff / JITTER_RADIUS; // bigger diff, less filtering
      newVolume = newVolume * filterAmount + oldAmount * (1 - filterAmount);
    }
    talk.volume = newVolume;
  }
  return talk;
}
