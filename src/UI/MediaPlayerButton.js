import * as THREE from "three";
import { roundedCornerShader } from "./RoundedCornerShaderv1";

export default function makeButtonMesh(x, y, z, color) {
  const geometry = new THREE.PlaneGeometry(x, y, 1, 1);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color1: {
        value: new THREE.Color("#444474"),
      },
      color2: {
        value: new THREE.Color("#526c86"),
      },
      size: {
        value: new THREE.Vector2(x, y),
      },
      radius: {
        value: 0.02,
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
    gl_FragColor = vec4(mix(color1, color2, length(vUv.x + vUv.y)), 1.0);
    vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
    if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
      if(length(abs(corner) - abs(glp.xy)) >= radius) {
      discard;
      }
    }
  }
  `,
  });
  const buttonMesh = new THREE.Mesh(geometry, material);
  buttonMesh.castShadow = true;
  buttonMesh.receiveShadow = true;
  return buttonMesh;
}
