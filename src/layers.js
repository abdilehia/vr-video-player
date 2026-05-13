import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

let camera, scene, renderer;
let video;

const videoFetch = await fetch("/videos");
let page = 1;
const pageCount = 18;
const result = await videoFetch.json();
const videos = result
  .sort((a, b) => {
    return new Date(a.stats.mtime) - new Date(b.stats.mtime);
  })
  .map((p) => p.name)
  .reverse()
  .slice((page - 1) * pageCount, page * pageCount);
import WebXRPolyfill from "./WebXRPolyfill";

let polyfill = new WebXRPolyfill();
init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10
  );
  camera.position.set(0, 1.6, 3);
  const light = new THREE.DirectionalLight(0xffffff, 3);

  const hemLight = new THREE.HemisphereLight(0x808080, 0x606060, 3);
  scene.add(hemLight, light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.setClearAlpha(1);
  renderer.setClearColor(new THREE.Color(0), 0);
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -10),
  ]);
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0x5555ff })
  );

  // The invisible dummyMesh quads and the guiMesh need to be rendered before the controller lines so that they
  // leave a hole in the depth buffer that the lines can intersect.
  line.renderOrder = 1;

  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory().setPath("./models/fbx/");

  //

  const controllers = [
    renderer.xr.getController(0),
    renderer.xr.getController(1),
  ];

  controllers.forEach((controller, i) => {
    const controllerGrip = renderer.xr.getControllerGrip(i);
    controllerGrip.add(
      controllerModelFactory.createControllerModel(controllerGrip)
    );
    scene.add(controllerGrip);

    const hand = renderer.xr.getHand(i);
    hand.add(handModelFactory.createHandModel(hand));

    controller.add(line.clone());
    scene.add(controller, controllerGrip, hand);
  });

  window.addEventListener("resize", onWindowResize, false);

  video = document.createElement("video");
  video.loop = true;
  video.src = videos[0];
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(t, frame) {
  const xr = renderer.xr;
  const session = xr.getSession();

  if (
    session &&
    session.renderState.layers !== undefined &&
    session.hasMediaLayer === undefined &&
    video.readyState >= 2
  ) {
    session.hasMediaLayer = true;

    session.requestReferenceSpace("local-floor").then((refSpace) => {
      // Create Quad layers for Snellen chart.
      const glBinding = xr.getBinding();
      // Create background EQR video layer.
      const mediaBinding = new XRMediaBinding(session);
      const equirectLayer = mediaBinding.createEquirectLayer(video, {
        space: refSpace,
        layout: "stereo-left-right",
        // Rotate by 45 deg to avoid stereo conflict with the 3D geometry.
        transform: new XRRigidTransform({}, { x: 0, y: 0.28, z: 0, w: 0.96 }),
      });
      session.updateRenderState({
        layers: [equirectLayer, session.renderState.layers[0]],
      });

      video.play();
    });
  }
  renderer.render(scene, camera);
}
