import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  CylinderBufferGeometry,
  MeshBasicMaterial,
  Color,
  GridHelper,
  DirectionalLight,
  AmbientLight,
  sRGBEncoding,
  AudioListener,
  Clock
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default class App3D {
  wWidth: number;
  wHeight: number;

  scene: Scene;
  camera: PerspectiveCamera;
  audioListener: AudioListener;
  renderer: WebGLRenderer;
  boundAnimate: FrameRequestCallback;
  clock: Clock;
  tickFuncs: Function[] = [];

  cube: Mesh;

  constructor() {
    this.wWidth = window.innerWidth;
    this.wHeight = window.innerHeight;

    // create Scene
    this.scene = new Scene();
    this.scene.background = new Color(0xeeeeee);

    const geometry = new CylinderBufferGeometry(0.2, 0.2, 0.5, 8);
    const material = new MeshBasicMaterial({
      color: 0xffff00
    });

    this.cube = new Mesh(geometry, material);
    this.cube.position.z = 5;

    this.scene.add(this.cube);

    // const light = new PointLight(0xffffff, 1, 1000);
    // light.position.set(0, 300, 5);
    // this.scene.add(light);

    const light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    this.scene.add(light);

    const ambient = new AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(this.wWidth, this.wHeight);
    this.renderer.outputEncoding = sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);

    // add Events Global
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    // create Camera
    this.camera = new PerspectiveCamera(75, this.aspect, 0.1, 1000);
    this.camera.position.z = 1;
    this.camera.position.y = 1.7;
    // create an AudioListener and add it to the camera
    this.audioListener = new AudioListener();
    this.camera.add(this.audioListener);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.update();
    controls.screenSpacePanning = true;

    this.scene.add(new GridHelper(10, 10));

    this.clock = new Clock();

    this.boundAnimate = this.animate.bind(this);

    requestAnimationFrame(this.boundAnimate);
  }

  get aspect(): number {
    return this.wWidth / this.wHeight;
  }

  onWindowResize(): void {
    this.wWidth = window.innerWidth;
    this.wHeight = window.innerHeight;

    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.wWidth, this.wHeight);
  }

  animate(): void {
    const dt = this.clock.getDelta();
    this.tickFuncs.forEach(funk => {
      funk(dt);
    });

    this.cube.rotation.y += 0.01;
    this.cube.rotation.x += 0.02;

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.boundAnimate);
  }
}
