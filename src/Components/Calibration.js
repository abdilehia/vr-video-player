import {
  System,
  Component,
  TagComponent,
  Types,
} from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";

class OffsetFromCamera extends Component {}

OffsetFromCamera.schema = {
  x: { type: Types.Number, default: 0 },
  y: { type: Types.Number, default: 0 },
  z: { type: Types.Number, default: 0 },
};

class NeedCalibration extends TagComponent {}

class CalibrationSystem extends System {
  init(attributes) {
    this.camera = attributes.camera;
    this.renderer = attributes.renderer;
  }

  execute(/* delta, time */) {
    this.queries.needCalibration.results.forEach((entity) => {
      if (this.renderer.xr.getSession()) {
        const offset = entity.getComponent(OffsetFromCamera);
        const object = entity.getComponent(Object3D).object;
        const xrCamera = this.renderer.xr.getCamera();
        object.position.x = xrCamera.position.x + offset.x;
        object.position.y = xrCamera.position.y + offset.y;
        object.position.z = xrCamera.position.z + offset.z;
        entity.removeComponent(NeedCalibration);
      }
    });
  }
}

CalibrationSystem.queries = {
  needCalibration: {
    components: [NeedCalibration],
  },
};

export { OffsetFromCamera, NeedCalibration, CalibrationSystem };
