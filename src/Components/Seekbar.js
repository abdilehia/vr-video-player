import {
  System,
  Component,
  TagComponent,
  Types,
} from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";
import { Vector3 } from "three";

class SeekBar extends TagComponent {}
class SeekHandle extends TagComponent {}

SeekBar.schema = {
  // button states: [none, hovered, pressed]
  currState: { type: Types.String, default: "none" },
  prevState: { type: Types.String, default: "none" },
  intersect: { type: Types.Ref }, // used to reverse calculate position
  position: { type: Types.Number }, // position between start and end
  min: { type: Types.Number, default: -1 }, // start point
  max: { type: Types.Number, default: -1 }, // end point
  onInteract: { type: Types.Ref, default: (value) => {} },
  onChange: { type: Types.Ref, default: (value) => {} },
  onVideoUpdate: { type: Types.Ref, default: () => {} },
  changeOnRelease: { type: Types.Boolean, default: false },
  bar: { type: Types.Ref }, // references seek bar mesh
  handle: { type: Types.Ref }, // references seek handle mesh
};

class SeekSystem extends System {
  execute(/* delta, time */) {
    this.queries.seekbars.results.forEach((entity) => {
      const seek = entity.getMutableComponent(SeekBar);

      if ((!seek.min || seek.min == -1) && (!seek.max || seek.max == -1)) {
        seek.bar.updateMatrixWorld();
        seek.bar.geometry.computeBoundingBox();
        const bounds = seek.bar.geometry.boundingBox;
        seek.min = bounds.min.x;
        seek.max = bounds.max.x;
      }
      //seek.handle.position.set(seek.position)
      //   const seekbarMesh = entity.getComponent(Object3D).object;
      if (seek.currState == "none") {
        seek.bar.scale.set(1, 1, 1);
      } else {
        seek.bar.scale.set(1.1, 1.1, 1.1);
      }
      if (seek.currState == "pressed" && seek.prevState != "pressed") {
        const bounds = seek.bar.geometry.boundingBox;
        seek.min = bounds.min.x;
        seek.max = bounds.max.x;
        seek.onInteract();
      }
      if (seek.currState == "pressed") {
        // debounce this please
        if (seek.intersect == null) return;
        seek.position = (seek.intersect.x - seek.min) / (seek.max - seek.min);

        seek.handle.position.x = seek.intersect.x;
        seek.bar.material.uniforms.fill.value = seek.position;
        seek.onChange(seek.position); // calculate position then feed to this
      } else {
        seek.position = seek.onVideoUpdate();
        seek.handle.position.x =
          seek.position * (seek.max - seek.min) + seek.min;
        seek.bar.material.uniforms.fill.value = seek.position;
      }

      // preserve prevState, clear currState
      // HandRaySystem will update currState
      seek.prevState = seek.currState;
      //   seek.currState = "none"; // should not automatically set to none
    });
  }
}

SeekSystem.queries = {
  seekbars: {
    components: [SeekBar],
  },
};

export { SeekBar, SeekHandle, SeekSystem };
