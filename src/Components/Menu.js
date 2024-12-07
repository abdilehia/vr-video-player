import {
  System,
  Component,
  TagComponent,
  Types,
  Not,
} from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";
import { Draggable } from "./Draggable";
import * as THREE from "three";
import { Anchor } from "./Snappable";
import { Intersectable } from "./Intersectable.js";
import { Visibility } from "./Hideable";

class Menu extends Component {}

Menu.schema = {
  children: { type: Types.Array }, // Array of objects containing an object and entity for this menu's children
};

class Selection extends TagComponent {}
class Player extends TagComponent {}

class MenuSystem extends System {
  execute(/*delta, time*/) {
    this.queries.menus.results.forEach((entity) => {
      if (!entity.hasComponent(Draggable)) return;
      const draggable = entity.getMutableComponent(Draggable);
      if (draggable.state !== "to-be-detached") return;

      // About to be detached
      const object = entity.getComponent(Object3D).object;
      const depth = new THREE.Vector3(0, 0, 0.1);
      object.updateMatrixWorld();
      const objectBounds = new THREE.Box3();
      objectBounds
        .copy(object.geometry.boundingBox)
        .applyMatrix4(object.matrixWorld);

      this.queries.anchors.results.forEach((anchorEntity) => {
        if (
          (entity.hasComponent(Selection) &&
            !anchorEntity.hasComponent(Selection)) ||
          (entity.hasComponent(Player) && !anchorEntity.hasComponent(Player))
        )
          return;

        console.log(anchorEntity);
        const anchorObject = anchorEntity.getComponent(Object3D).object;
        anchorObject.updateMatrixWorld();
        const anchorBounds = new THREE.Box3();
        anchorBounds
          .copy(anchorObject.geometry.boundingBox)
          .set(anchorBounds.min.sub(depth), anchorBounds.max.add(depth))
          .applyMatrix4(anchorObject.matrixWorld);

        let center = new THREE.Vector3();
        object.getWorldPosition(center);
        if (anchorBounds.intersectsBox(objectBounds)) {
          //if (urm.bounds.containsPoint(center)) {
          draggable.state = "detached";
          anchorObject.attach(object);
          object.position.set(0, 0, 0.01);
          object.rotation.x = 0;
          object.rotation.y = 0;
          object.rotation.z = 0;
        } else {
          console.log("NOOOOO");
          return;
        }
      });
    });

    let addedResults = this.queries.intersectable.added;
    for (var i = addedResults.length - 1; i >= 0; i++) {
      const mentity = addedResults[i];
      if (!mentity) return;
      const children = mentity.getComponent(Menu).children;
      children.forEach(({ object, entity, intersectable }) => {
        if (intersectable && !entity.hasComponent(Intersectable)) {
          entity.addComponent(Intersectable);
        }
      });
    }
    let removedResults = this.queries.intersectable.removed;
    for (var i = removedResults.length - 1; i >= 0; i++) {
      const mentity = removedResults[i];
      if (!mentity) return;
      console.log(mentity);
      const children = mentity.getComponent(Menu).children;
      children.forEach(({ object, entity, intersectable }) => {
        if (intersectable && entity.hasComponent(Intersectable)) {
          entity.removeComponent(Intersectable);
        }
      });

      console.log(children);
    }
  }
}

MenuSystem.queries = {
  menus: {
    components: [Not(Anchor), Menu], // Only thing not snappable
  },
  anchors: {
    components: [Anchor, Menu],
  },
  intersectable: {
    components: [Not(Anchor), Menu, Intersectable],
    listen: {
      removed: true,
      added: true,
    },
  },
};

export { Menu, Selection, Player, MenuSystem };
