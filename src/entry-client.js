import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import "./style.css";
import "./menu.css";

// GUI imports
import { VRButton } from "three/addons/webxr/VRButton.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { HTMLMesh, InteractiveGroup } from "three/examples/jsm/Addons.js";

// Input imports
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

import { createText } from "three/addons/webxr/Text2D.js";

import { World } from "three/addons/libs/ecsy.module.js";
import {
  CalibrationSystem,
  NeedCalibration,
  OffsetFromCamera,
} from "./Components/Calibration";
import { HandRaySystem, Intersectable } from "./Components/Intersectable.js";
import { Button, ButtonSystem } from "./Components/Buttons";
import { Hideable, HideableSystem, Visibility } from "./Components/Hideable";
import Object3D from "./Components/Object3D";
import { menuMesh } from "./UI/MediaPlayerMenu";
import makeButtonMesh from "./UI/MediaPlayerButton";
import { menuAnchorMesh, selectionMenuMesh } from "./UI/MediaSelectionMenu";
import {
  ClampToObject,
  Draggable,
  DraggableSystem,
} from "./Components/Draggable";
import { makeSelectionCard } from "./UI/MediaSelectionCard";
import { Anchor } from "./Components/Snappable";
import {
  seekBarMaterial,
  seekBarMesh,
  seekHandleMesh,
} from "./UI/MediaPlayerSeekbar";
import { Video, VideoSystem } from "./Components/Video";
import { Menu, MenuSystem, Player, Selection } from "./Components/Menu";
import { roundedCornerShader } from "./UI/RoundedCornerShaderv1";
import { SeekBar, SeekHandle, SeekSystem } from "./Components/Seekbar";

//#region ASDLAKMSDLKAMSD
Object.defineProperty(HTMLMediaElement.prototype, "playing", {
  get: function () {
    return !!(
      this.currentTime > 0 &&
      !this.paused &&
      !this.ended &&
      this.readyState > 2
    );
  },
});
const world = new World();
const clock = new THREE.Clock();
//#endregion

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
let videoIndex = 0;
let camera, scene, renderer;
let video, ratio, currentTime, length, videoTexture;
let currentEye = 1;
let controls;
let controller1,
  controller2,
  hand1,
  hand2,
  controllerGrip1,
  controllerGrip2,
  handPointer1,
  handPointer2,
  controllerPointer1,
  controllerPointer2;
let stats;
let controllers = [];
let menuEntity;

// Enter the vertical FOV for the camera here
var vFov = 180; // = 240;

function updateUVs(geometry, left, ratio) {
  if (!geometry) return;
  const normals = geometry.attributes.normal.array;
  const indices = geometry.index.array;
  const uvs = geometry.attributes.uv.array;

  var maxY = Math.cos((Math.PI * (360 - vFov)) / 180 / 2);
  // The sphere consists of many FACES
  for (var i = 0; i < indices.length; i++) {
    // For each face...
    const vertex = indices[i];
    const uv = { u: uvs[vertex * 2], v: uvs[vertex * 2 + 1] };
    const normal = {
      x: normals[vertex * 3],
      y: normals[vertex * 3 + 1],
      z: normals[vertex * 3 + 2],
    };

    // Because our stereograph goes from 0 to 1 but our vertical field of view cuts off our Y early
    var scaledY = ((normal.y + 1) / (maxY + 1)) * 2 - 1;
    var urmmm = left ? 0.5 : 0;
    // uvs[j].x, uvs[j].y refer to a point on the 2d texture
    if (normal.y < maxY + 1) {
      var radius = Math.acos(1 - (scaledY / 2 + 0.5)) / Math.PI;
      radius = Math.sqrt(Math.pow(radius, 2) + Math.pow(radius, 2));
      var angle = Math.atan2(normal.x, normal.z);
      uv.u = radius * Math.cos(angle) + 0.5;
      uv.v = radius * Math.sin(angle) + 0.5 * Math.max(1 / ratio);
    } else {
      uv.u = 0;
      uv.v = 0;
    }
    uvs[vertex * 2] = uv.u * 0.5;
    if (!left) {
      uvs[vertex * 2] += 0.5;
    } else {
    }
    uvs[vertex * 2 + 1] = uv.v * ratio;
  }
  // For whatever reason my UV mapping turned everything upside down
  // Rather than fix my math, I just replaced "minY" with "maxY" and
  // rotated the sphere 180 degrees
  geometry.rotateZ(Math.PI);
  geometry.uvsNeedUpdate = true;
}

function switchEye() {
  const otherEye = currentEye == 1 ? 2 : 1;
  camera.layers.disable(currentEye);
  camera.layers.enable(otherEye);
  currentEye = otherEye;
}

function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.layers.enable(1); // render left view when no stereo available
  camera.position.set(0, 1.6, 0);

  // video
  video = initVideo();
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.needsUpdate = false;

  //texture.repeat.set(2, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101010);

  addLights();

  video.addEventListener(
    "loadedmetadata",
    function (e) {
      currentTime = 0;
      length = video.duration;
      ratio = this.videoWidth / 2 / this.videoHeight;

      // const leftEyeMesh = createViewer("leftEye", eqTexture, ratio, vFov, 1);
      // scene.add(leftEyeMesh);
      //const test = new THREE.TextureLoader().load("/assets/UV_Test.png");
      let lMesh = scene.getObjectByName("leftEye");
      if (lMesh) {
        lMesh.parent.remove(lMesh);
        lMesh.geometry.dispose();
        lMesh.material.dispose();
        lMesh = undefined;
      }

      let rMesh = scene.getObjectByName("rightEye");
      if (rMesh) {
        rMesh.parent.remove(rMesh);
        rMesh.geometry.dispose();
        rMesh.material.dispose();
        rMesh = undefined;
      }

      initLeftEye(videoTexture);
      initRightEye(videoTexture);
      seek();
      video.play();
    },
    false
  );

  initRenderer();
  initControllers();
  world
    .registerComponent(Object3D)
    .registerComponent(Intersectable)
    .registerComponent(Button)
    .registerComponent(SeekBar)
    .registerComponent(SeekHandle)
    .registerComponent(OffsetFromCamera)
    .registerComponent(NeedCalibration)
    .registerComponent(Menu)
    .registerComponent(Selection)
    .registerComponent(Player)
    .registerComponent(Visibility)
    .registerComponent(Hideable)
    .registerComponent(Anchor)
    .registerComponent(Draggable)
    .registerComponent(ClampToObject)
    .registerComponent(Video);

  world
    .registerSystem(CalibrationSystem, { renderer: renderer, camera: camera })
    .registerSystem(ButtonSystem)
    .registerSystem(HandRaySystem, {
      handPointers: [handPointer1],
      controllers: controllers,
    })
    .registerSystem(MenuSystem)
    .registerSystem(HideableSystem)
    .registerSystem(DraggableSystem)
    .registerSystem(VideoSystem, { videos, page, videosPerPage: pageCount })
    .registerSystem(SeekSystem);

  const vidyaCis = world.getSystem(VideoSystem);
  //vidyaCis.
  let obj = {
    play: playPause.bind(this, video, true),
    pause: playPause.bind(this, video, false),
    id: 385,
    switch: switchEye,
  };
  obj["update"] = updateVideo.bind(this, obj, video);
  //initUI(obj);
  addMenu();
  window.addEventListener("resize", onWindowResize);

  stats = new Stats();
  stats.dom.style.width = "80px";
  stats.dom.style.height = "48px";
  document.body.appendChild(stats.dom);
}

function addLights() {
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0, 6, 0);
  light.castShadow = false;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);
}

const seek = () => {
  if (video.fastSeek) {
    video.fastSeek(currentTime);
  } else {
    video.currentTime = currentTime;
  }
};

function addButton(text, colour, action, xPos, yPos) {
  const button = makeButtonMesh(0.15, 0.1, 0.01, colour);
  const buttonText = createText(text, 0.06);
  button.add(buttonText);
  buttonText.position.set(0, 0, 0.0051);
  button.position.set(xPos, yPos, 0.001);

  const bEntity = world.createEntity();
  bEntity.addComponent(Intersectable);
  bEntity.addComponent(Object3D, { object: button });
  bEntity.addComponent(Button, { action });

  return { object: button, entity: bEntity, intersectable: true };
}

function addMenu() {
  scene.add(menuMesh);
  menuMesh.add(menuAnchorMesh);
  menuMesh.add(seekBarMesh);
  seekBarMesh.position.set(0, -0.25, 0);

  const seekBarEntity = world.createEntity();
  seekBarEntity.addComponent(Intersectable);
  seekBarEntity.addComponent(Object3D, { object: seekBarMesh });
  seekBarEntity.addComponent(SeekBar, {
    onInteract: () => {
      video.pause();
    },
    onChange: (value) => {
      video.currentPosition = value;
      video.play();
    },
    changeOnRelease: false,
    handle: seekHandleMesh,
    bar: seekBarMesh,
  });

  const seekHandleEntity = world.createEntity();
  seekHandleEntity.addComponent(Intersectable);
  seekHandleEntity.addComponent(Object3D, { object: seekHandleMesh });
  seekHandleEntity.addComponent(ClampToObject, { object: seekBarMesh });
  seekHandleEntity.addComponent(Draggable);

  const columns = 6;
  const colWidth = 0.24;
  const rowHeight = 0.3;
  const startingY = 0.21;
  const startingX = -0.6;

  const selectionMenuChildren = videos.map((video, index) => {
    let cardMesh = makeSelectionCard(
      `/p/${video.slice(0, -4)}.jpg`,
      video.slice(10)
    );
    const column = index % columns;
    const row = Math.floor(index / columns);
    selectionMenuMesh.add(cardMesh);
    cardMesh.position.set(
      startingX + column * colWidth,
      startingY - row * rowHeight,
      0.01
    );
    const cardEntity = world.createEntity();
    cardEntity.addComponent(Intersectable);
    cardEntity.addComponent(Object3D, { object: cardMesh });
    cardEntity.addComponent(Button, {
      action: () => {
        if (!video) return;
        videoIndex = index;
        initVideo();
      },
    });
    return { object: cardMesh, entity: cardEntity, intersectable: true };
  });
  const buttons = [
    {
      text: "prev",
      action: () => {
        if (!video) return;
        videoIndex = (videoIndex - 1) % videos.length;
        initVideo();
      },
    },
    {
      text: "play",
      action: () => {
        if (!video) return;
        if (video.playing) {
          video.pause();
          return;
        }
        video.play();
      },
    },
    {
      text: "next",
      action: () => {
        if (!video) return;
        videoIndex = (videoIndex + 1) % videos.length;
        initVideo();
      },
    },
    {
      text: "FOV -",
      action: () => {
        if (!video) return;
        vFov -= 5;
        let lMesh = scene.getObjectByName("leftEye");
        scene.remove(lMesh);
        lMesh.geometry.dispose();
        lMesh.material.dispose();
        lMesh = undefined;

        let rMesh = scene.getObjectByName("rightEye");
        scene.remove(rMesh);
        rMesh.geometry.dispose();
        rMesh.material.dispose();
        rMesh = undefined;
        initLeftEye(videoTexture);
        initRightEye(videoTexture);
      },
    },
    {
      text: "FOV +",
      action: () => {
        if (!video) return;
        vFov += 5;

        let lMesh = scene.getObjectByName("leftEye");
        scene.remove(lMesh);
        lMesh.geometry.dispose();
        lMesh.material.dispose();
        lMesh = undefined;

        let rMesh = scene.getObjectByName("rightEye");
        scene.remove(rMesh);
        rMesh.geometry.dispose();
        rMesh.material.dispose();
        rMesh = undefined;
        initLeftEye(videoTexture);
        initRightEye(videoTexture);
      },
    },
    {
      text: "-5s",
      action: () => {
        if (!video) return;
        currentTime = Math.min(currentTime - 5, length);
        seek();
      },
    },
    {
      text: "+5s",
      action: () => {
        if (!video) return;
        currentTime = Math.min(currentTime + 5, length);
        seek();
      },
    },
    {
      text: "Show",
      action: () => {
        const visibility = selectionMenuEntity.getMutableComponent(Visibility);
        visibility.value = !visibility.value;
      },
    },
    {
      text: "exit",
      action: () => {
        renderer.xr.getSession().end();
      },
    },
  ];

  const bStartingX = -0.705;
  const bWidth = 1.5 / (buttons.length - 1);
  const bPadding = 0.05;
  const menuChildren = buttons.map(({ text, action }, index) => {
    const button = addButton(
      text,
      0xffffff,
      action,
      index == buttons.length
        ? bWidth * index + bPadding * 2 + bStartingX
        : bWidth * index + bPadding + bStartingX,
      0
    );
    menuMesh.add(button.object);

    return button;
  });

  menuEntity = world.createEntity();
  menuEntity.addComponent(Intersectable);
  menuEntity.addComponent(OffsetFromCamera, { x: 0, y: 0, z: -1.4 });
  menuEntity.addComponent(NeedCalibration);
  menuEntity.addComponent(Hideable);
  menuEntity.addComponent(Visibility, { value: true });
  menuEntity.addComponent(Object3D, { object: menuMesh });
  //menuEntity.addComponent(Draggable);

  menuAnchorMesh.geometry.computeBoundingBox();
  selectionMenuMesh.geometry.computeBoundingBox();

  const selectionMenuAnchorEntity = world.createEntity();
  const anchorBoundsRel = menuAnchorMesh.geometry.boundingBox;
  menuAnchorMesh.updateMatrixWorld();
  selectionMenuMesh.updateMatrixWorld();
  // selectionMenuAnchorEntity.addComponent(Visibility, { value: true });
  selectionMenuAnchorEntity.addComponent(Anchor);
  selectionMenuAnchorEntity.addComponent(Menu);
  selectionMenuAnchorEntity.addComponent(Selection);
  selectionMenuAnchorEntity.addComponent(Object3D, {
    object: menuAnchorMesh,
  });
  // selectionMenuAnchorEntity.addComponent(Hideable);

  const selectionMenuEntity = world.createEntity();
  selectionMenuEntity.addComponent(Intersectable);
  selectionMenuEntity.addComponent(Object3D, {
    object: selectionMenuMesh,
  });
  selectionMenuEntity.addComponent(Visibility, { value: true });
  selectionMenuEntity.addComponent(Menu, { children: selectionMenuChildren });
  selectionMenuEntity.addComponent(Selection);
  selectionMenuEntity.addComponent(Hideable);
  selectionMenuEntity.addComponent(Draggable);

  menuEntity.addComponent(Menu, {
    children: [
      {
        object: selectionMenuMesh,
        entity: selectionMenuEntity,
        intersectable: true,
      },
      ...menuChildren,
    ],
  });

  const sperGeo = new THREE.SphereGeometry(3, 10, 10);
  const sperMat = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
  });
  const sperMesh = new THREE.Mesh(sperGeo, sperMat);
  sperMesh.layers.set(0);
  scene.add(sperMesh);
  const eyeEntity = world.createEntity();
  eyeEntity.addComponent(Intersectable);
  eyeEntity.addComponent(Object3D, { object: sperMesh });
  eyeEntity.addComponent(NeedCalibration);
  eyeEntity.addComponent(OffsetFromCamera, { x: 0, y: 0, z: 0 });
  eyeEntity.addComponent(Button, {
    action: () => {
      console.log("CLICKED EYE");
      const visibility = menuEntity.getMutableComponent(Visibility);
      visibility.value = !visibility.value;
    },
  });
}

function initVideo() {
  // Create SBS video texture
  if (!video) {
    video = document.createElement("video");
  }
  video.src = videos[videoIndex];

  // Replace with your video path
  video.crossOrigin = "use-credentials";
  video.loop = false;
  video.load();
  return video;
}

function initControllers() {
  // controllers
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  controllerPointer1 = new THREE.Raycaster().setFromXRController(controller1);
  controllerPointer2 = new THREE.Raycaster().setFromXRController(controller2);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 0),
  ]);

  const line1 = new THREE.Line(lineGeometry);
  line1.name = "line";
  line1.scale.z = 100;

  const line2 = new THREE.Line(lineGeometry);
  line2.name = "line";
  line2.scale.z = 100;

  const cursorGeometry = new THREE.CircleGeometry(1);
  const cursorTexture = new THREE.TextureLoader().load("/assets/bezos.jpg");
  const cursorMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color("green"),
  });
  const cursor1 = new THREE.Mesh(cursorGeometry, cursorMaterial);
  const cursor2 = new THREE.Mesh(cursorGeometry, cursorMaterial);

  controller1.add(line1);
  controller2.add(line2);
  controller1.add(cursor1);
  controller2.add(cursor2);

  const controllerData1 = {
    controller: controller1,
    raycaster: controllerPointer1,
    pinched: false,
    attached: false,
    cursor: cursor1,
  };
  const controllerData2 = {
    controller: controller2,
    raycaster: controllerPointer1,
    pinched: false,
    attached: false,
    cursor: cursor2,
  };

  const setPinch = (controller, value) => (controller.pinched = value);
  controller1.addEventListener(
    "selectstart",
    setPinch.bind(this, controllerData1, true)
  );
  controller1.addEventListener(
    "selectend",
    setPinch.bind(this, controllerData1, false)
  );
  controller2.addEventListener(
    "selectstart",
    setPinch.bind(this, controllerData2, true)
  );
  controller2.addEventListener(
    "selectend",
    setPinch.bind(this, controllerData2, false)
  );

  controllers = [controllerData1, controllerData2];
  const controllerModelFactory = new XRControllerModelFactory();

  // Hand 1
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );

  scene.add(controllerGrip1);

  hand1 = renderer.xr.getHand(0);
  hand1.add(new OculusHandModel(hand1));
  handPointer1 = new OculusHandPointerModel(hand1, controller1);
  hand1.add(handPointer1);

  scene.add(hand1);

  // Hand 2
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  hand2 = renderer.xr.getHand(1);
  hand2.add(new OculusHandModel(hand2));
  handPointer2 = new OculusHandPointerModel(hand2, controller2);
  hand2.add(handPointer2);
  scene.add(hand2);
}

function updateVideo(obj, video) {
  video.src = `src/2024-11-26 12-12-00.mp4`;
  // Replace with your video path
  video.crossOrigin = "use-credentials";
  video.loop = false;
  video.load();
}

const playPause = (video, bool) => {
  if (bool) {
    video.play();
    return;
  }
  video.pause();
};

function initUI(obj) {
  const gui = new GUI();
  const vidFolder = gui.addFolder("Video controls");
  vidFolder.add(obj, "play")?.name("Play video");
  vidFolder.add(obj, "pause")?.name("Pause video");
  vidFolder.add(obj, "id", 1, 400, 1)?.name("Video ID");
  vidFolder.add(obj, "update", 1, 400, 1)?.name("Update Video");
  vidFolder.add(obj, "switch")?.name("Switch eye");

  const mesh = new HTMLMesh(gui.domElement);
  mesh.position.set(0.4, 1, -1);
  mesh.rotation.y = -Math.PI / 12;
  mesh.scale.setScalar(2);
  const group = new InteractiveGroup();
  group.listenToPointerEvents(renderer, camera);
  group.listenToXRControllerEvents(controller1);
  group.listenToXRControllerEvents(controller2);
  scene.add(group);
  group.add(mesh);
}

function initLeftEye_old(texture) {
  const geometry = new THREE.SphereGeometry(10, 60, 40);
  updateUVs(geometry, true, ratio);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "leftEye";
  mesh.position.y = 1.6;
  mesh.rotation.x = Math.PI / -2;
  mesh.rotation.y = Math.PI / 2;
  mesh.layers.set(1); // display in left eye only
  scene.add(mesh);
}

function initLeftEye(texture) {
  const geometry = new THREE.SphereGeometry(3, 60, 40);
  updateUVs(geometry, true, ratio);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: texture },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `,
    fragmentShader: `
     varying vec2 vUv;
     uniform sampler2D texture1;
    
    void main() {
      if(vUv.x < 0.0 || vUv.x > 0.5 || vUv.y < 0.0 || vUv.y > 1.0) {
        discard;
      }
      else {
        gl_FragColor = texture2D(texture1, vUv);
      }
    }
  `,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "leftEye";
  mesh.position.y = 0;
  mesh.rotation.x = Math.PI / -2;
  mesh.rotation.y = Math.PI / 2;
  mesh.layers.set(1); // display in left eye only
  scene.add(mesh);
}

function initRightEye(texture) {
  const geometry = new THREE.SphereGeometry(3, 60, 40);
  updateUVs(geometry, false, ratio);
  // const material = new THREE.MeshBasicMaterial({
  //   map: texture,
  //   side: THREE.BackSide,
  // });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: texture },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `,
    fragmentShader: `
     varying vec2 vUv;
     uniform sampler2D texture1;
    
    void main() {
      if(vUv.x < 0.5 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) {
        discard;
      }
      else {
        gl_FragColor = texture2D(texture1, vUv);
      }
    }
  `,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "rightEye";
  mesh.position.y = 0;
  mesh.rotation.x = Math.PI / -2;
  mesh.rotation.y = Math.PI / 2;
  mesh.layers.set(2); // display in right eye only
  scene.add(mesh);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer();
  initControls();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  renderer.xr.cameraAutoUpdate = false;
  renderer.xr.setReferenceSpaceType("local");
  renderer.xr.setFramebufferScaleFactor(5.0);
  renderer.domElement.classList.add("canvasWebGL");

  // append to DOM
  document.body.appendChild(renderer.domElement);

  const sessionInit = {
    requiredFeatures: ["hand-tracking"],
  };

  document.body.appendChild(VRButton.createButton(renderer, sessionInit));
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = false;
  controls.rotateSpeed = -0.125; // negative, to track mouse pointer
  controls.autoRotateSpeed = 1.0;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  controls.update();
  stats.update();
  const delta = clock.getDelta();
  const elapsedTime = clock.elapsedTime;
  // Update seek bar roughly 8 times per second (should be enough)
  if (Math.floor((elapsedTime * 100) % 13) == 1 && video.playing && false) {
    seekBarMesh.material.uniforms.fill.value = video.currentTime / length;
    let width = seekBarMesh.geometry.parameters.width * seekBarMesh.scale.x;
    console.log(width);
    seekHandleMesh.position.set(
      (video.currentTime / length) * width - width / 2,
      0,
      0.0001
    );
  }
  renderer.xr.updateCamera(camera);
  world.execute(delta, elapsedTime);
  renderer.render(scene, camera);
}

init();
