import numpy as np
import tyro
from dataclasses import dataclass
from typing import Union
from teleop_xr import Teleop
from teleop_xr.config import TeleopSettings
from teleop_xr.common_cli import CommonCLI
from teleop_xr.camera_views import build_camera_views_config


@dataclass
class BasicCLI(CommonCLI):
    # Devices can be int (index) or str (path)
    head_device: Union[int, str, None] = None
    wrist_left_device: Union[int, str, None] = None
    wrist_right_device: Union[int, str, None] = None


def main():
    cli = tyro.cli(BasicCLI)

    # Backward compatibility: default to head on device 0 if no flags provided
    if (
        cli.head_device is None
        and cli.wrist_left_device is None
        and cli.wrist_right_device is None
    ):
        cli.head_device = 0  # Default to index 0

    camera_views = build_camera_views_config(
        head=cli.head_device,
        wrist_left=cli.wrist_left_device,
        wrist_right=cli.wrist_right_device,
    )

    def callback(pose, xr_state):
        return

    settings = TeleopSettings(
        host=cli.host,
        port=cli.port,
        input_mode=cli.input_mode,
        camera_views=camera_views,
    )

    teleop = Teleop(settings=settings)
    teleop.set_pose(np.eye(4))
    teleop.subscribe(callback)
    teleop.run()


if __name__ == "__main__":
    main()
