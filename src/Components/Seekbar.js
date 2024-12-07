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
  intersectX: { type: Types.Number }, // used to reverse calculate position
  position: { type: Types.Number, default: 0 }, // position between start and end
  min: { type: Types.Number, default: 0 }, // start point
  max: { type: Types.Number, default: 1 }, // end point
  onInteract: { type: Types.Ref, default: (value) => {} },
  onChange: { type: Types.Ref, default: (value) => {} },
  changeOnRelease: { type: Types.Boolean, default: true },
  bar: { type: Types.Ref }, // references seek bar mesh
  handle: { type: Types.Ref }, // references seek handle mesh
};

class SeekSystem extends System {
  execute(/* delta, time */) {
    this.queries.seekbars.results.forEach((entity) => {
      const seek = entity.getMutableComponent(SeekBar);
      //seek.handle.position.set(seek.position)
      //   const seekbarMesh = entity.getComponent(Object3D).object;
      if (seek.currState == "none") {
        seek.bar.scale.set(1, 1, 1);
      } else {
        seek.bar.scale.set(1.1, 1.1, 1.1);
      }
      if (seek.currState == "pressed" && seek.prevState != "pressed") {
        seek.bar.geometry.computeBoundingBox();
        seek.bar.updateMatrixWorld();
        seek.onInteract();
      }
      if (seek.currState == "pressed" && !seek.changeOnRelease) {
        // debounce this please
        const x = seek.intersectX;
        const bounds = seek.bar.geometry.boundingBox;
        const clampedPoint = new Vector3();
        // console.log(bounds.clampPoint(new Vector3(x), clampedPoint));
        // console.log(
        //   `Original X: ${x}\nClamped X: ${clampedPoint.x}\nBounds min: ${bounds.min}\nBounds max: ${bounds.max}`
        // );

        seek.onChange(0); // calculate position then feed to this
      } else if (
        seek.prevState == "pressed" &&
        seek.currState != "pressed" &&
        seek.changeOnRelease
      ) {
        seek.onChange(0); // calculate position then feed to this
      }

      // preserve prevState, clear currState
      // HandRaySystem will update currState
      seek.prevState = seek.currState;
      //seek.currState = "none"; // should not automatically set to none
    });
  }
}

SeekSystem.queries = {
  seekbars: {
    components: [SeekBar],
  },
};

export { SeekBar, SeekHandle, SeekSystem };
