export const roundedCornerShader = {
  vertexShader: `
    uniform vec2 size;
    uniform float radius;
    varying vec2 vUv;
    varying vec3 glp;
  
    void main() {
      vec3 pos = position;
      float height = size.y;
      float width = size.x;
      // vec2 corner = 
      // vec2(sign(position.x), sign(position.y)) * // Gets just the +/- of the position
      // vec2(width / 2.0 - radius, height / 2.0 - radius);
  
      // if(abs(position.x) > width / 2.0 - radius && abs(position.y) > height / 2.0 - radius) {
      //   pos.xy = corner + normalize(position.xy - corner) * radius;
      // }
        
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      glp = position;
      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(color1, 1.0);
      float gridWidth = 10.0;
      float gridHeight = 1.0;
      float gridSegments = 10.0;
      float modX = float(mod(vUv.x * gridWidth, 2.0 / gridSegments));
      float modY = float(mod(vUv.y * gridHeight, 2.0 / gridSegments));
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
    }
  `,
};
