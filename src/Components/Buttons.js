import { System, Component, Types } from "three/addons/libs/ecsy.module.js";
import Object3D from "./Object3D";

class Button extends Component {}

Button.schema = {
  // button states: [none, hovered, pressed]
  currState: { type: Types.String, default: "none" },
  prevState: { type: Types.String, default: "none" },
  action: { type: Types.Ref, default: () => {} },
  actionOnRelease: { type: Types.Boolean, default: true },
};

class ButtonSystem extends System {
  execute(/* delta, time */) {
    this.queries.buttons.results.forEach((entity) => {
      const button = entity.getMutableComponent(Button);
      const buttonMesh = entity.getComponent(Object3D).object;
      if (button.currState == "none") {
        buttonMesh.scale.set(1, 1, 1);
      } else {
        buttonMesh.scale.set(1.1, 1.1, 1.1);
      }

      if (
        button.currState == "pressed" &&
        button.prevState != "pressed" &&
        !button.actionOnRelease
      ) {
        button.action();
      } else if (
        button.prevState == "pressed" &&
        button.currState != "pressed" &&
        button.actionOnRelease
      ) {
        button.action();
      }

      // preserve prevState, clear currState
      // HandRaySystem will update currState
      button.prevState = button.currState;
      button.currState = "none";
    });
  }
}

ButtonSystem.queries = {
  buttons: {
    components: [Button],
  },
};

export { Button, ButtonSystem };
