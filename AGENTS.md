# Teleop Project Context

## WebXR App Debugging

### Console Log Streaming
Quest VR headset doesn't have accessible browser console. To debug:
1. WebXR app intercepts console.log/warn/error via `console_stream.ts`
2. Logs are sent as `{type: "console_log", data: {level, message}}` over WebSocket
3. Python server (`teleop/__init__.py`) receives and prints `[WebXR:level] message` to terminal

### Key Architecture
- `webxr/src/` - TypeScript WebXR app using @iwsdk/core (ECS framework on Three.js)
- `webxr/src/panels.ts` - DraggablePanel, CameraPanel, ControllerCameraPanel classes
- `webxr/src/controller_camera_system.ts` - System for controller-attached panels with billboard behavior
- `webxr/src/console_stream.ts` - Console log interceptor for Quest debugging
- `webxr/src/video.ts` - VideoClient for WebRTC video streaming
- `webxr/src/teleop_system.ts` - XR input gathering and WebSocket streaming

### Controller Camera Panels
- Two panels (left/right) attached to controllers
- Position: 15cm above, 5cm forward from controller
- Billboard: Full 3-axis rotation to always face user's head
- Video: Receives tracks from VideoClient with trackId metadata
