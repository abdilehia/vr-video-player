import {
  System,
  Component,
  TagComponent,
  Types,
} from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";

class Draggable extends Component {}

Draggable.schema = {
  // draggable states: [detached, hovered, to-be-attached, attached, to-be-detached]
  state: { type: Types.String, default: "none" },
  originalParent: { type: Types.Ref, default: null },
  attachedPointer: { type: Types.Ref, default: null },
  scaleByVelocity: { type: Types.Boolean, default: false },
};

class ClampToObject extends Component {}

ClampToObject.schema = {
  object: { type: Types.Ref },
};

class DraggableSystem extends System {
  execute(/*delta, time*/) {
    this.queries.draggable.results.forEach((entity) => {
      const draggable = entity.getMutableComponent(Draggable);
      const object = entity.getComponent(Object3D).object;
      if (draggable.originalParent == null) {
        draggable.originalParent = object.parent;
      }

      switch (draggable.state) {
        case "to-be-attached":
          draggable.attachedPointer.attach(object);
          draggable.state = "attached";
          break;
        case "to-be-detached":
          console.log("It is getting here");
          draggable.originalParent.attach(object);
          draggable.originalParent.updateMatrixWorld();
          object.updateMatrixWorld();
          draggable.state = "detached";
          break;
        default:
          object.scale.set(1, 1, 1);
      }
    });
  }
}

DraggableSystem.queries = {
  draggable: {
    components: [Draggable],
  },
};

export { ClampToObject, Draggable, DraggableSystem };
