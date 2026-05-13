export const fresnelShader = {
  vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
  fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      
      void main() {
        gl_FragColor = vec4(mix(color1, color2, 1.0), 1.0);
      }
    `,
};
