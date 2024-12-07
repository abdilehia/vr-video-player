import * as THREE from "three";
import { roundedCornerShader } from "./RoundedCornerShaderv1";

const menuSize = [1.5, 1];

//#region Actual menu
const menuGeometry = new THREE.PlaneGeometry(...menuSize, 1, 1);
const texture = new THREE.TextureLoader().load("/assets/bezos.jpg");
const menuMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("#444474"),
    },
    color2: {
      value: new THREE.Color("#526c86"),
    },
    texture1: {
      value: texture,
    },
    size: {
      value: new THREE.Vector2(...menuSize),
    },
    radius: {
      value: 0.04,
    },
  },
  vertexShader: roundedCornerShader.vertexShader,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform sampler2D texture1;
    uniform float enabled;
    uniform vec2 size;
    uniform float radius;
    varying vec3 glp;
    varying vec2 vUv;
    
    void main() {
    
    //gl_FragColor = texture2D(texture1, vUv);
    gl_FragColor = vec4(mix(color1, color2, length(vUv.x + vUv.y)), 1.0);
    vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
  
    if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
      if(length(abs(corner) - abs(glp.xy)) >= radius) {
      discard;
      }
    }
  }
  `,
  transparent: false,
});

const selectionMenuMesh = new THREE.Mesh(menuGeometry, menuMaterial);
//#endregion

//#region Menu anchor
const anchorSize = [1.5, 1];
const anchorGeometry = new THREE.PlaneGeometry(...menuSize, 80, 80);

const anchorMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("#444474"),
    },
    color2: {
      value: new THREE.Color("#526c86"),
    },
    size: {
      value: new THREE.Vector2(...anchorSize),
    },
    radius: {
      value: 0.04,
    },
    enabled: {
      value: 0,
    },
  },
  vertexShader: roundedCornerShader.vertexShader,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float enabled;
    varying vec2 vUv;
    
    void main() {
        gl_FragColor = vec4(0.0,0.0,0.0,0.0);
    }
  `,
  transparent: true,
});

const menuAnchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
menuAnchorMesh.position.set(0, 0.625, 0);
menuAnchorMesh.add(selectionMenuMesh);
selectionMenuMesh.position.set(0, 0, 0.01);
//#endregion

export { selectionMenuMesh, menuAnchorMesh };
