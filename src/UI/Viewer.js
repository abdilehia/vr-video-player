import * as THREE from "three";
function createViewer(name, videoTexture, ratio, fov, layer) {
  const viewerGeometry = new THREE.SphereGeometry(10, 60, 40);
  //updateUVs(viewerGeometry, true, ratio);
  const viewerMaterial = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: videoTexture },
      ratio: { value: 1 },
      fov: { value: fov },
      angle: { value: -0.9 * Math.PI },
    },
    vertexShader: `
        uniform float ratio;
        uniform float fov;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `,
    fragmentShader: `
    uniform float ratio;
    uniform float angle;
    uniform sampler2D texture1;
    varying vec2 vUv;
    varying vec4 norm;
    
    void main() {
      vec2 ndcPos = vUv * vec2(2.0, 1.0) - vec2(1.0,1.0);
      float eye_angle = abs(angle);
      float half_angle = eye_angle/2.0;
      float half_dist = tan(half_angle);
      
      vec2  vp_scale = vec2(ratio, 1.0);
      vec2  P = ndcPos * vp_scale; 

      float vp_dia   = length(vp_scale);
      float rel_dist = length(P) / vp_dia;  
      vec2  rel_P = normalize(P) / normalize(vp_scale);

      vec2 pos_prj = ndcPos;
      if (angle > 0.0)
      {
          float beta = rel_dist * half_angle;
          pos_prj = rel_P * tan(beta) / half_dist;  
      }
      else if (angle < 0.0)
      {
          float beta = atan(rel_dist * half_dist);
          pos_prj = rel_P * beta / half_angle;
      }

      vec2 uv_prj = pos_prj * 0.5 + 0.5;
      vec2 rangeCheck = step(vec2(0.0), uv_prj) * step(uv_prj, vec2(0.5,1.0));   
      if (rangeCheck.x * rangeCheck.y < 0.5)
        discard;

      float gridWidth = 10.0;
      float gridHeight = 1.0;
      float gridSegments = 10.0;
      float modX = float(mod(vUv.x * gridWidth, 2.0 / gridSegments));
      float modY = float(mod(vUv.y * gridHeight, 2.0 / gridSegments));
      float inverseRatio = 1.0 / ratio;
    //   if(vUv.x > 0.25 && vUv.x < 0.75 && vUv.y > 0.5 - inverseRatio / 2.0  && vUv.y < 0.5 + inverseRatio / 2.0){
      if( modY > 0.0 && modY < 1.0 / gridSegments) {
       if( modX > 0.0 && modX < 1.0 / gridSegments) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
      else {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
      }
      else {
       if( modX > 0.0 && modX < 1.0 / gridSegments) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
      else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
      
    gl_FragColor = mix(vec4(0.0,0.0,0.0,0), texture2D(texture1, uv_prj.st), 1.0);
    //gl_FragColor = norm;
    //   }  
    }
  `,
    side: THREE.BackSide,
  });
  const viewerMesh = new THREE.Mesh(viewerGeometry, viewerMaterial);
  viewerMesh.name = name;
  viewerMesh.position.y = 1.6;
  viewerMesh.rotation.y = Math.PI;
  viewerMesh.layers.set(layer); // display in left eye only
  return viewerMesh;
}

export { createViewer };

const vFov = 180;
function updateUVs(geometry, left, ratio) {
  if (!geometry) return;
  const normals = geometry.attributes.normal.array;
  const indices = geometry.index.array;
  const uvs = geometry.attributes.uv.array;

  var maxY = Math.cos((Math.PI * (360 - vFov)) / 180 / 2);
  // The sphere consists of many FACES
  for (var i = 0; i < indices.length; i++) {
    // For each face...
    const vertex = indices[i];
    const uv = { u: uvs[vertex * 2], v: uvs[vertex * 2 + 1] };
    const normal = {
      x: normals[vertex * 3],
      y: normals[vertex * 3 + 1],
      z: normals[vertex * 3 + 2],
    };

    // Because our stereograph goes from 0 to 1 but our vertical field of view cuts off our Y early
    var scaledY = ((normal.y + 1) / (maxY + 1)) * 2 - 1;

    // uvs[j].x, uvs[j].y refer to a point on the 2d texture
    if (normal.y < maxY) {
      var radius = Math.acos(1 - (scaledY / 2 + 0.5)) / Math.PI;
      radius = Math.sqrt(Math.pow(radius, 2) + Math.pow(radius, 2));
      var angle = Math.atan2(normal.x, normal.z);
      uv.u = radius * Math.cos(angle) + 0.5;
      uv.v = radius * Math.sin(angle) + 0.5;
    } else {
      uv.u = 0;
      uv.v = 0;
    }
    uvs[vertex * 2] = uv.u * 0.5;
    if (!left) {
      uvs[vertex * 2] += 0.5;
    } else {
    }
    uvs[vertex * 2 + 1] = uv.v * ratio;
  }
  // For whatever reason my UV mapping turned everything upside down
  // Rather than fix my math, I just replaced "minY" with "maxY" and
  // rotated the sphere 180 degrees
  geometry.rotateZ(Math.PI);
  geometry.uvsNeedUpdate = true;
}
