import { Component, Types } from "three/addons/libs/ecsy.module.js";
class Object3D extends Component {}

Object3D.schema = {
  object: { type: Types.Ref },
};

export default Object3D;
