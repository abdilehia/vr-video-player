import * as THREE from "three";
import { roundedCornerShader } from "./RoundedCornerShaderv1";
import { createText } from "three/addons/webxr/Text2D.js";
const size = [1.2, 0.03];
const seekBarGeometry = new THREE.PlaneGeometry(...size, 1, 1);

const seekBarMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("red"),
    },
    color2: {
      value: new THREE.Color("green"),
    },
    size: {
      value: new THREE.Vector2(...size),
    },
    fill: {
      value: 0.5,
    },
    radius: {
      value: 0.015,
    },
  },
  vertexShader: roundedCornerShader.vertexShader,
  fragmentShader: ` 
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec2 size;
  uniform float fill;
  uniform float radius;
  varying vec3 glp;
  varying vec2 vUv;
  
  void main() {
    if(vUv.x < fill) {
        gl_FragColor = vec4(color1, 1.0);
      }
      else {
        gl_FragColor = vec4(color2, 1.0);
      }
  vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
  if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
    if(length(abs(corner) - abs(glp.xy)) >= radius) {
    discard;
    }
  }
}
`,
});
const seekBarMesh = new THREE.Mesh(seekBarGeometry, seekBarMaterial);

const handleSize = [0.1, 0.1];
const seekHandleGeometry = new THREE.PlaneGeometry(...handleSize, 1, 1);

const seekHandleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("purple"),
    },
    color2: {
      value: new THREE.Color("green"),
    },
    size: {
      value: new THREE.Vector2(...handleSize),
    },
    radius: {
      value: 0.05,
    },
  },
  vertexShader: roundedCornerShader.vertexShader,
  fragmentShader: ` 
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec2 size;
  uniform float radius;
  varying vec3 glp;
  varying vec2 vUv;
  
  void main() {
    gl_FragColor = vec4(color1, 1.0);
  vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
  if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
    if(length(abs(corner) - abs(glp.xy)) >= radius) {
    discard;
    }
  }
}
`,
});
const seekHandleMesh = new THREE.Mesh(seekHandleGeometry, seekHandleMaterial);

seekBarMesh.add(seekHandleMesh);
seekHandleMesh.position.set(0.0, 0.0, 0.05);
export { seekBarMesh, seekBarMaterial, seekHandleMesh };
