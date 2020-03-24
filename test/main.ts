import {
  Mesh,
  AnimationMixer,
  Vector3,
  AudioLoader,
  PositionalAudio,
  Quaternion
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import App3D from './App3D';
import { makeBlink3D, makeBlinkTick } from '../src/Blink3D';
import { makeBlinker } from '../src/Blink';
import { makeTalk3D, makeTalkTick } from '../src/Talk3D';
import { makeTalk } from '../src/Talk';
import { positionSound } from '../src/Utils3D';
import { look3D, attachEffector, blendTo } from '../src/Look3D';

const app = new App3D();

const loader = new GLTFLoader().setPath('./assets/');
loader.load('malcom.glb', function(gltf) {
  console.log(gltf);

  // gltf.scene.rotation.z = 45;
  gltf.scene.scale.multiplyScalar(0.5);
  app.scene.add(gltf.scene);

  const body = gltf.scene.getObjectByName('Body') as Mesh;

  const bView = makeBlink3D(body, 'Blink_Left', 'Blink_Right', 2.0);
  const bState = makeBlinker();
  app.tickFuncs.push(makeBlinkTick(bState, bView));

  //talking from audio
  const talkState = makeTalk();
  const soundEmitter = new PositionalAudio(app.audioListener);
  const talkView = makeTalk3D(body, 'MouthOpen', soundEmitter, 0.01, talkState);
  app.tickFuncs.push(makeTalkTick(talkView, talkState));
  positionSound(body, soundEmitter);

  const audioLoader = new AudioLoader().setPath('./assets/');
  audioLoader.load('what-to-drink.mp3', function(buffer) {
    soundEmitter.setBuffer(buffer);
    soundEmitter.play(); //play it to init source with domAudioContext.createBufferSource
    soundEmitter.stop();
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'KeyS') {
      soundEmitter.stop();
      soundEmitter.play();
    }
  });

  const mixer = new AnimationMixer(gltf.scene);
  const animations = gltf.animations;
  const idleAction = mixer.clipAction(animations[0]);
  idleAction.play();
  // const lookaround = mixer.clipAction(animations[1]);
  // lookaround.play();

  console.log(idleAction);

  app.tickFuncs.push(dt => {
    mixer.update(dt);
  });

  //Look at camera
  const head = gltf.scene.getObjectByName('mixamorigHead');
  const eyeL = gltf.scene.getObjectByName('mixamorigLeftEye');
  const eyeR = gltf.scene.getObjectByName('mixamorigRightEye');

  //Find center eye
  eyeL.updateWorldMatrix(true, false);
  eyeR.updateWorldMatrix(false, false); //assuming eyes have same parent
  const eyeCenter = new Vector3()
    .setFromMatrixPosition(eyeL.matrixWorld)
    .add(new Vector3().setFromMatrixPosition(eyeR.matrixWorld))
    .multiplyScalar(0.5);
  head.worldToLocal(eyeCenter);
  const headEffector = attachEffector(eyeCenter, head);
  let lookTick = null;
  let blendBackTick = null;
  function toggleLook(): void {
    if (lookTick === null) {
      const headLook = look3D(headEffector, [eyeL, eyeR], gltf.scene);
      // const headLook = look3D(headEffector, [eyeL, eyeR]);
      // const headLook = look3D(headEffector);
      lookTick = (dt: number): void => {
        headLook(app.camera.position, dt);
      };
      if (blendBackTick) {
        app.tickFuncs.splice(app.tickFuncs.indexOf(blendBackTick), 1, lookTick);
      } else {
        app.tickFuncs.push(lookTick);
      }
    } else {
      const tickers = [
        blendTo(eyeL.quaternion, new Quaternion(), 0.1),
        blendTo(eyeR.quaternion, new Quaternion(), 0.1),
        blendTo(head.quaternion, head.quaternion, 0.3), //samples start quat of IK, then blends back to current exported animation
        blendTo(gltf.scene.quaternion, new Quaternion(), 1)
      ];
      blendBackTick = (dt: number): void => {
        tickers.forEach(tick => tick(dt));
      };
      app.tickFuncs.splice(app.tickFuncs.indexOf(lookTick), 1, blendBackTick);
      lookTick = null;
    }
  }
  toggleLook();
  function onkey(e): void {
    if (e.code == 'Space') toggleLook();
  }
  document.addEventListener('keydown', onkey);
});
