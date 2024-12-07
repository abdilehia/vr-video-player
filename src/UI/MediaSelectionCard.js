import * as THREE from "three";
import { roundedCornerShader } from "./RoundedCornerShaderv1";
import { createText } from "three/addons/webxr/Text2D.js";

function makeSelectionCard(preview, name) {
  const cardGeometry = new THREE.PlaneGeometry(0.215, 0.265, 1, 1);

  const cardMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: {
        value: new THREE.Color("#444474"),
      },
      color2: {
        value: new THREE.Color("#526c86"),
      },
      size: {
        value: new THREE.Vector2(0.215, 0.265),
      },
      radius: {
        value: 0.01,
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
    vec2 corner2 = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - 0.1025, size.y / 2.0 - 0.1025);

      if(sign(glp.y) > 0.0) {
      if(abs(glp.x) > size.x / 2.0 - 0.1025 && abs(glp.y) > size.y / 2.0 - 0.1025) {
      if(length(abs(corner2) - abs(glp.xy)) >= 0.1025) {
      discard;
      }
    }  
   
    }
    else {
    if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
      if(length(abs(corner) - abs(glp.xy)) >= radius) {
      discard;
      }
    }  
    }
  }
  `,
  });
  const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);

  const previewGeometry = new THREE.PlaneGeometry(0.2, 0.2, 1, 1);
  const previewImage = new THREE.TextureLoader().load(preview);
  const previewMaterial = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: previewImage },
      size: {
        value: new THREE.Vector2(0.2, 0.2),
      },
      radius: {
        value: 0.1,
      },
    },
    vertexShader: roundedCornerShader.vertexShader,
    fragmentShader: `
      uniform sampler2D texture1; 
    uniform vec2 size;
    uniform float radius;
    varying vec3 glp;
      varying vec2 vUv;
      
      void main() {
        gl_FragColor = texture2D(texture1, vUv);
        vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
    if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
      if(length(abs(corner) - abs(glp.xy)) >= radius) {
      discard;
      }
    }
      }
    `,
  });

  const previewMesh = new THREE.Mesh(previewGeometry, previewMaterial);
  previewMesh.position.set(0, 0.025, 0.0001);
  const buttonText = createText(name, 0.025);
  cardMesh.add(previewMesh);
  cardMesh.add(buttonText);
  buttonText.position.set(0, -0.1, 0.0051);
  return cardMesh;
}

// function makeSelectionPagination(page) {
//   const cardGeometry = new THREE.PlaneGeometry(0.08, 0.08, 1, 1);

//   const cardMaterial = new THREE.ShaderMaterial({
//     uniforms: {
//       color1: {
//         value: new THREE.Color("#444474"),
//       },
//       color2: {
//         value: new THREE.Color("#526c86"),
//       },
//       size: {
//         value: new THREE.Vector2(0.2, 0.25),
//       },
//       radius: {
//         value: 0.025,
//       },
//     },
//     vertexShader: roundedCornerShader.vertexShader,
//     fragmentShader: `
//     uniform vec3 color1;
//     uniform vec3 color2;
//     uniform vec2 size;
//     uniform float radius;
//     varying vec3 glp;
//     varying vec2 vUv;

//     void main() {
//     gl_FragColor = vec4(mix(color1, color2, length(vUv.x + vUv.y)), 1.0);
//     vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
//     if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
//       if(length(abs(corner) - abs(glp.xy)) >= radius) {
//       discard;
//       }
//     }
//   }
//   `,
//   });
//   const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);

//   const previewGeometry = new THREE.PlaneGeometry(0.2, 0.2, 80, 80);
//   const previewImage = new THREE.TextureLoader().load(preview);
//   const previewMaterial = new THREE.ShaderMaterial({
//     uniforms: {
//       texture1: { value: previewImage },
//       size: {
//         value: new THREE.Vector2(0.2, 0.2),
//       },
//       radius: {
//         value: 0.1,
//       },
//     },
//     vertexShader: roundedCornerShader.vertexShader,
//     fragmentShader: `
//       uniform sampler2D texture1;
//     uniform vec2 size;
//     uniform float radius;
//     varying vec3 glp;
//       varying vec2 vUv;

//       void main() {
//         gl_FragColor = texture2D(texture1, vUv);
//          vec2 corner = vec2(sign(glp.x), sign(glp.y)) * vec2(size.x / 2.0 - radius, size.y / 2.0 - radius);
//     if(abs(glp.x) > size.x / 2.0 - radius && abs(glp.y) > size.y / 2.0 - radius) {
//       if(length(abs(corner) - abs(glp.xy)) >= radius) {
//       discard;
//       }
//     }
//       }
//     `,
//   });

//   const previewMesh = new THREE.Mesh(previewGeometry, previewMaterial);
//   previewMesh.position.set(0, 0.025, 0.0001);
//   const buttonText = createText(name, 0.025);
//   cardMesh.add(previewMesh);
//   cardMesh.add(buttonText);
//   buttonText.position.set(0, -0.1, 0.0051);
//   return cardMesh;
// }
export { makeSelectionCard };
