import {
  AssetManifest,
  AssetType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
} from "@iwsdk/core";

import {
  AudioSource,
  DistanceGrabbable,
  MovementMode,
  Interactable,
  PanelUI,
  PlaybackMode,
} from "@iwsdk/core";

import { EnvironmentType, LocomotionEnvironment } from "@iwsdk/core";

import { PanelSystem } from "./panel.js";

import { TeleopSystem } from "./teleop_system.js";

import { Robot } from "./robot.js";

import { RobotSystem } from "./robot.js";

import { VideoClient } from "./video.js";

import { DraggablePanel, CameraPanel, ControllerCameraPanel } from "./panels.js";

import { ControllerCameraPanelSystem } from "./controller_camera_system.js";

import { GlobalRefs } from "./global_refs.js";

import { initConsoleStream } from "./console_stream.js";

// Initialize console streaming for Quest VR debugging
initConsoleStream();

const assets: AssetManifest = {
  chimeSound: {
    url: "./audio/chime.mp3",
    type: AssetType.Audio,
    priority: "background",
  },
  webxr: {
    url: "./textures/webxr.png",
    type: AssetType.Texture,
    priority: "critical",
  },

  plantSansevieria: {
    url: "./gltf/plantSansevieria/plantSansevieria.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  robot: {
    url: "./gltf/robot/robot.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
};

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    offer: "always",
    // Optional structured features; layers/local-floor are offered by default
    features: {
      handTracking: true,
      anchors: true,
      hitTest: false,
      planeDetection: false,
      meshDetection: false,
      layers: true,
    },
  },
  features: {
    locomotion: false,
    grabbing: true,
    physics: false,
    sceneUnderstanding: true,
  },
}).then((world) => {
  const { camera } = world;

  camera.position.set(0, 1, 0.5);

  const { scene: plantMesh } = AssetManager.getGLTF("plantSansevieria")!;

  plantMesh.position.set(1.2, 0.2, -1.8);
  plantMesh.scale.setScalar(2);

  world
    .createTransformEntity(plantMesh)
    .addComponent(Interactable)
    .addComponent(DistanceGrabbable, {
      movementMode: MovementMode.MoveFromTarget,
    });

  const { scene: robotMesh } = AssetManager.getGLTF("robot")!;
  // defaults for AR
  robotMesh.position.set(-1.2, 0.4, -1.8);
  robotMesh.scale.setScalar(1);

  world
    .createTransformEntity(robotMesh)
    .addComponent(Interactable)
    .addComponent(Robot)
    .addComponent(AudioSource, {
      src: "./audio/chime.mp3",
      maxInstances: 3,
      playbackMode: PlaybackMode.FadeRestart,
    });

  const teleopPanel = new DraggablePanel(world, "./ui/teleop.json", {
    maxHeight: 0.8,
    maxWidth: 1.6,
  });
  teleopPanel.setPosition(0, 1.29, -1.9);

  const cameraPanel = new CameraPanel(world);
  cameraPanel.setPosition(1.2, 1.3, -1.5);
  // Default to visible and store root reference globally for TeleopSystem
  if (cameraPanel.entity.object3D) {
    cameraPanel.entity.object3D.visible = true;
    GlobalRefs.cameraPanelRoot = cameraPanel.entity.object3D;
  }

  // Controller-attached camera panels (for wrist cameras)
  const leftControllerPanel = new ControllerCameraPanel(world, "left");
  const rightControllerPanel = new ControllerCameraPanel(world, "right");

  // Video connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const videoWsUrl = `${protocol}//${window.location.host}/ws`;

  // Track assignment: first track -> left, second -> right
  // (or use trackId if server provides left/right metadata)
  let trackCount = 0;
  const videoClient = new VideoClient(
    videoWsUrl,
    (stats) => {},
    (track, trackId) => {
      // Main camera panel gets first track
      cameraPanel.setVideoTrack(track);
      
      // Assign to controller panels based on trackId or order
      if (trackId.includes("left") || trackCount === 0) {
        leftControllerPanel.setVideoTrack(track);
      }
      if (trackId.includes("right") || trackCount === 1) {
        rightControllerPanel.setVideoTrack(track);
      }
      trackCount++;
    },
  );

  const webxrLogoTexture = AssetManager.getTexture("webxr")!;
  webxrLogoTexture.colorSpace = SRGBColorSpace;
  const logoBanner = new Mesh(
    new PlaneGeometry(3.39, 0.96),
    new MeshBasicMaterial({
      map: webxrLogoTexture,
      transparent: true,
    }),
  );
  world.createTransformEntity(logoBanner);
  logoBanner.position.set(0, 1, 1.8);
  logoBanner.rotateY(Math.PI);

  world.registerSystem(PanelSystem);
  world.registerSystem(TeleopSystem);
  world.registerSystem(ControllerCameraPanelSystem);

  // Register controller panels with their raySpaces once XR session starts
  // The system will handle waiting for raySpaces to be available
  const controllerCameraSystem = world.getSystem(ControllerCameraPanelSystem);
  if (controllerCameraSystem) {
    // Register with callbacks that resolve raySpaces dynamically
    const getLeftRaySpace = () => world.player?.raySpaces?.left;
    const getRightRaySpace = () => world.player?.raySpaces?.right;
    
    // The system expects controllerObject - we'll modify the system to handle getters
    // For now, pass a reference that will be resolved each frame
    (controllerCameraSystem as any).registerPanelWithGetter(leftControllerPanel, getLeftRaySpace);
    (controllerCameraSystem as any).registerPanelWithGetter(rightControllerPanel, getRightRaySpace);
  }
});
