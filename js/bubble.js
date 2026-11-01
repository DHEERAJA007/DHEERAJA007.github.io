/**
 * bubble.js — shared Three.js pieces for the glowing "liquid" bubbles.
 *
 * makeBubbleMaterial(): a ShaderMaterial that draws a soap-bubble look:
 *  - Fresnel rim: transparent in the middle, glowing at the edges
 *  - Iridescence: the rim colour shifts with viewing angle and time
 *  - Specular highlight from a fixed light
 *  - Vertex wobble along the normal, so the bubble surface ripples like liquid
 * Additive blending + no depth writes, so bubbles glow where they overlap.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWobble;
  uniform float uSeed;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 3.1 + uTime * 1.3 + uSeed)
            * sin(p.y * 2.7 + uTime * 1.1 + uSeed * 1.7)
            * sin(p.z * 2.9 + uTime * 0.9);
    p += normal * w * uWobble;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uIrid;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
    float rim = pow(1.0 - facing, 2.4);
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (rim * 1.3 + uTime * 0.04 + vec3(0.0, 0.33, 0.67)));
    vec3 col = mix(uColor, irid, uIrid) * rim * 1.7;
    vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
    float spec = pow(max(dot(reflect(-L, normalize(vNormal)), normalize(vView)), 0.0), 36.0);
    col += vec3(1.0) * spec * 0.85;
    gl_FragColor = vec4(col, (rim * 0.85 + spec * 0.9 + 0.015) * uOpacity);
  }
`;

export function makeBubbleMaterial({ color = 0xe10600, opacity = 1, iridescence = 0.4, wobble = 0.05, seed = Math.random() * 10 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uIrid: { value: iridescence },
      uWobble: { value: wobble },
      uSeed: { value: seed },
      uTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Radial gradient sprite texture: soft dot (points) or wide halo (glows). */
export function makeRadialTexture(stops = [[0, 1], [0.35, 0.55], [1, 0]]) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([at, a]) => grad.addColorStop(at, `rgba(255,255,255,${a})`));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
