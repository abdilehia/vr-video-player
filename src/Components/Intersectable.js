import { System, TagComponent } from "three/addons/libs/ecsy.module.js";
import { Box3, Vector3, Raycaster } from "three";
import Object3D from "./Object3D";
import { Button } from "./Buttons";
import { ClampToObject, Draggable } from "./Draggable";
// Something to keep in mind: the value for handpointer seems to keep up to date
// Note how we do not set position of hand pointer but it still tracks
class Intersectable extends TagComponent {}

class HandRaySystem extends System {
  init(attributes) {
    this.handPointers = attributes.handPointers;
    this.controllers = attributes.controllers;
  }

  execute(/*delta, time*/) {
    // this.handPointers.forEach((hp) => {
    //   let distance = null;
    //   let intersectingEntity = null;
    //   this.queries.intersectable.results.forEach((entity) => {
    //     const object = entity.getComponent(Object3D).object;
    //     const intersections = hp.intersectObject(object, false);
    //     if (intersections && intersections.length > 0) {
    //       if (distance == null || intersections[0].distance < distance) {
    //         distance = intersections[0].distance;
    //         intersectingEntity = entity;
    //       }
    //     }
    //   });
    //   if (distance) {
    //     hp.setCursor(distance);
    //     if (intersectingEntity.hasComponent(Button)) {
    //       const button = intersectingEntity.getMutableComponent(Button);
    //       if (hp.isPinched()) {
    //         button.currState = "pressed";
    //       } else if (button.currState != "pressed") {
    //         button.currState = "hovered";
    //       }
    //     }

    //     if (intersectingEntity.hasComponent(Draggable)) {
    //       const draggable = intersectingEntity.getMutableComponent(Draggable);
    //       const object = intersectingEntity.getComponent(Object3D).object;
    //       object.scale.set(1.1, 1.1, 1.1);
    //       let clampBounds;
    //       if (hp.isPinched()) {
    //         if (!hp.isAttached() && draggable.state != "attached") {
    //           if (intersectingEntity.hasComponent(ClampToObject)) {
    //             const clampObject =
    //               intersectingEntity.getComponent(ClampToObject).object;
    //             clampObject.geometry.computeBoundingBox();
    //             clampObject.updateMatrixWorld();
    //             clampBounds = new Box3();
    //             clampBounds
    //               .copy(clampObject.geometry.boundingBox)
    //               .applyMatrix4(clampObject.matrixWorld);
    //           }
    //           draggable.state = "to-be-attached";
    //           draggable.attachedPointer = hp;
    //           hp.setAttached(true);
    //         }
    //         if (clampBounds && hp.isAttached()) {
    //           hp.controller.updateMatrixWorld();
    //           object.updateMatrixWorld();
    //           const oldPosition = object.position
    //             .clone()
    //             .applyMatrix4(hp.controller.matrixWorld);
    //           let newPosition = new Vector3();
    //           clampBounds.clampPoint(oldPosition, newPosition);
    //           //newPosition = hp.controller.worldToLocal(newPosition);
    //           object.position.set(newPosition);
    //         }
    //       } else {
    //         if (hp.isAttached() && draggable.state == "attached") {
    //           draggable.state = "to-be-detached";
    //           draggable.attachedPointer = null;
    //           hp.setAttached(false);
    //         }
    //       }
    //       // Snappable has position(s) and distance in schema
    //       // If distance of object's position to snap position is below threshold, set position to that.
    //       //if (intersectingEntity.hasComponent(Snappable)) {}
    //     }
    //   } else {
    //     hp.setCursor(1.5);
    //   }
    // });

    for (let i = 0; i < this.controllers.length; i++) {
      this.controllers[i].raycaster.setFromXRController(
        this.controllers[i].controller
      );
      let distance = null;
      let intersectingEntity = null;
      this.queries.intersectable.results.forEach((entity) => {
        const object = entity.getComponent(Object3D).object;
        const intersections = this.controllers[i].raycaster.intersectObject(
          object,
          false
        );
        if (intersections && intersections.length > 0) {
          if (distance == null || intersections[0].distance < distance) {
            distance = intersections[0].distance;
            intersectingEntity = entity;
          }
        }
      });

      if (distance) {
        this.controllers[i].cursor.position.z = distance;
        if (intersectingEntity.hasComponent(Button)) {
          const button = intersectingEntity.getMutableComponent(Button);
          if (this.controllers[i].pinched) {
            button.currState = "pressed";
          } else if (button.currState != "pressed") {
            button.currState = "hovered";
          }
        }

        if (intersectingEntity.hasComponent(Draggable)) {
          const draggable = intersectingEntity.getMutableComponent(Draggable);
          const object = intersectingEntity.getComponent(Object3D).object;
          object.scale.set(1.1, 1.1, 1.1);
          let clampBounds;
          if (this.controllers[i].pinched) {
            if (
              !this.controllers[i].attached &&
              draggable.state != "attached"
            ) {
              if (intersectingEntity.hasComponent(ClampToObject)) {
                const clampObject =
                  intersectingEntity.getComponent(ClampToObject).object;
                clampObject.geometry.computeBoundingBox();
                clampObject.updateMatrixWorld();
                clampBounds = new Box3();
                clampBounds
                  .copy(clampObject.geometry.boundingBox)
                  .applyMatrix4(clampObject.matrixWorld);
              }
              draggable.state = "to-be-attached";
              draggable.attachedPointer = this.controllers[i].controller;
              this.controllers[i].attached = true;
            }
          } else {
            if (this.controllers[i].attached && draggable.state == "attached") {
              draggable.state = "to-be-detached";
              draggable.attachedPointer = null;
              this.controllers[i].attached = false;
            }
          }
          // Snappable has position(s) and distance in schema
          // If distance of object's position to snap position is below threshold, set position to that.
          //if (intersectingEntity.hasComponent(Snappable)) {}
        }
      } else {
        this.controllers[i].cursor.position.z = 1.5;
      }
    }
  }
}

HandRaySystem.queries = {
  intersectable: {
    components: [Intersectable],
  },
};

export { Intersectable, HandRaySystem };
