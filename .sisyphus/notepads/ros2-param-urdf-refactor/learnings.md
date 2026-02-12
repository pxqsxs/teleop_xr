
## RAM from_string Implementation
- Implemented `ram.from_string(urdf_content, cache_dir)` to handle URDF content provided as a string.
- Integrated `ament_index_python` for `package://` resolution as a fallback when not in a RAM repo context.
- Added auto-detection for `mesh_path` by finding the common path of all resolved or absolute mesh paths in the URDF.
- Implemented generic path filtering (/, /opt, /usr, /home) to prevent overly broad `mesh_path` detection.
- Used content hashing for deterministic output URDF filenames in the cache.

## ROS2 Parameter Migration
- Migrated from `tyro` CLI parsing to standard ROS2 parameters using `TeleopNode(Node)` subclass.
- Parameters are declared in `__init__` with default values and accessed via properties.
- JSON parameters (`extra_streams_json`, `robot_args_json`) are parsed automatically by properties, providing a cleaner API for the rest of the node.
- Standard ROS2 parameter overrides via CLI (`--ros-args -p mode:=ik`) are now supported natively.
- Tests use mocking for `rclpy` to allow verification in environments without a full ROS2 installation.

## BaseRobot Refactor
- Moved URDF loading infrastructure (`_load_urdf`, `_load_default_urdf`) into `BaseRobot` to eliminate boilerplate in subclasses.
- Concrete `_load_urdf` supports optional `urdf_string` override, using `ram.from_string` to cache and resolve meshes.
- Lifted `get_vis_config` to the base class, making it concrete and driven by `urdf_path`, `mesh_path`, `model_scale`, and `orientation`.
- Introduced `model_scale` property in `BaseRobot` (defaulting to 1.0) to allow subclasses to specify visualization scale.
- Unified `RobotVisConfig.initial_rotation_euler` generation using `self.orientation.as_rpy_radians()`.
- Refactoring `BaseRobot` to include more concrete logic reduces the burden on robot-specific subclasses and ensures a consistent interface for visualization.
