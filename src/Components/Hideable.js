import {
  System,
  Component,
  TagComponent,
  Types,
} from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";
import { Intersectable } from "./Intersectable.js";

class Visibility extends Component {}

Visibility.schema = {
  value: { type: Types.Boolean, default: false },
};

class Hideable extends TagComponent {}

class HideableSystem extends System {
  execute() {
    this.queries.hideableObjects.changed.forEach((entity) => {
      const object = entity.getComponent(Object3D).object;
      const visibility = entity.getComponent(Visibility);
      object.visible = visibility.value;
      // Maybe also move this into individual components to have better
      // control over what this means for them
      if (entity.hasComponent(Intersectable) && visibility.value == false) {
        entity.removeComponent(Intersectable);
      } else if (
        !entity.hasComponent(Intersectable) &&
        visibility.value == true
      ) {
        entity.addComponent(Intersectable);
      }
    });
  }
}

HideableSystem.queries = {
  hideableObjects: {
    components: [Hideable, Visibility],
    listen: {
      changed: [Visibility],
    },
  },
};

export { Visibility, Hideable, HideableSystem };
