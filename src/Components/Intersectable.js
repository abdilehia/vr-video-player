import { System, TagComponent } from "three/addons/libs/ecsy.module.js";
import { Box3, Vector3, Raycaster } from "three";
import Object3D from "./Object3D";
import { Button } from "./Buttons";
import { ClampToObject, Draggable } from "./Draggable";
import { SeekBar } from "./Seekbar";
// Something to keep in mind: the value for handpointer seems to keep up to date
// Note how we do not set position of hand pointer but it still tracks
class Intersectable extends TagComponent {}

class HandRaySystem extends System {
  init(attributes) {
    this.handPointers = attributes.handPointers;
    this.controllers = attributes.controllers;
    this.distance = new Array(attributes.controllers.length).fill(null);
    this.intersectingEntity = new Array(attributes.controllers.length).fill(
      null
    );
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

      if (!this.controllers[i].paused) {
        this.distance[i] = null;
        this.intersectingEntity[i] = null;
        // do not reset if controller is "paused" as in do not detect new things
        this.queries.intersectable.results.forEach((entity) => {
          const object = entity.getComponent(Object3D).object;
          const intersections = this.controllers[i].raycaster.intersectObject(
            object,
            false
          );
          if (intersections && intersections.length > 0) {
            if (
              this.distance[i] == null ||
              intersections[0].distance < this.distance[i]
            ) {
              this.distance[i] = intersections[0].distance;
              this.intersectingEntity[i] = entity;
            }
          }
        });
      }

      if (this.distance[i] !== null) {
        this.controllers[i].cursor.position.z = this.distance[i];

        if (this.intersectingEntity[i].hasComponent(SeekBar)) {
          const seekbar =
            this.intersectingEntity[i].getMutableComponent(SeekBar);
          if (this.controllers[i].pinched) {
            this.controllers[i].attached = true;
            this.controllers[i].paused = true;
            seekbar.prevState = seekbar.currState;
            seekbar.currState = "pressed";
            seekbar.intersect = this.controllers[i].controller.position.x;
          } else if (this.controllers[i].attached) {
            this.controllers[i].attached = false;
            this.controllers[i].paused = false;
            seekbar.currState = "none";
            seekbar.prevState = "pressed";
            seekbar.intersectX = undefined;
          }
        }

        if (this.intersectingEntity[i].hasComponent(Button)) {
          const button = this.intersectingEntity[i].getMutableComponent(Button);
          if (this.controllers[i].pinched) {
            button.currState = "pressed";
          } else if (button.currState != "pressed") {
            button.currState = "hovered";
          }
        }

        if (this.intersectingEntity[i].hasComponent(Draggable)) {
          const draggable =
            this.intersectingEntity[i].getMutableComponent(Draggable);
          const object =
            this.intersectingEntity[i].getComponent(Object3D).object;
          object.scale.set(1.1, 1.1, 1.1);
          let clampBounds;
          if (this.controllers[i].pinched) {
            if (
              !this.controllers[i].attached &&
              draggable.state != "attached"
            ) {
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
