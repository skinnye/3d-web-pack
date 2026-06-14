import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* ============================================================
   1. WebGL hero scene — iridescent displaced blob + particles
   ============================================================ */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisplace;
  uniform vec2  uMouse;
  varying float vNoise;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  // Simplex noise 3D (Ashima Arts / Stefan Gustavson)
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
      i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;
    float n  = snoise(position * 1.4 + vec3(uTime * 0.22));
    float n2 = snoise(position * 3.1 - vec3(uTime * 0.16));
    float displacement = (n * 0.6 + n2 * 0.4) * uDisplace;
    pos += normal * displacement;

    vNoise = n;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vNoise;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  void main() {
    float fres = pow(1.0 - max(dot(vNormalW, vViewDir), 0.0), 2.2);
    vec3 base = mix(uColorA, uColorB, smoothstep(-0.6, 0.6, vNoise));
    vec3 col  = mix(base, uColorC, fres);
    col += fres * 0.7;            // rim glow → feeds bloom
    gl_FragColor = vec4(col, 1.0);
  }
`;

let renderer, scene, camera, composer, blob, particles, bloom;
let lenis = null;
const uniforms = {
  uTime:     { value: 0 },
  uDisplace: { value: 0.42 },
  uMouse:    { value: new THREE.Vector2(0, 0) },
  uColorA:   { value: new THREE.Color('#2440b8') },
  uColorB:   { value: new THREE.Color('#7c5cff') },
  uColorC:   { value: new THREE.Color('#ff5ca8') },
};
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const clock = new THREE.Clock();

function initScene() {
  const canvas = document.getElementById('webgl');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return false;
  }
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  // central blob
  const geo = new THREE.IcosahedronGeometry(1.5, 64);
  const mat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
  blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  // particle field
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 4 + Math.pow(Math.random(), 0.6) * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.022, color: new THREE.Color('#9fb4ff'),
    transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // post-processing: bloom
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.55, 0.65);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return true;
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}

function onPointerMove(e) {
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  uniforms.uTime.value = t;

  // ease pointer
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;

  if (blob) {
    blob.rotation.y = t * 0.12 + pointer.x * 0.5;
    blob.rotation.x = pointer.y * 0.4;
    const s = 1 + Math.sin(t * 0.8) * 0.015;
    blob.scale.setScalar(s);
  }
  if (particles) {
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;
  }
  composer.render();
}

/* ============================================================
   2. Smooth scroll + GSAP choreography
   ============================================================ */
function initMotion() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooth scroll (skip if reduced motion)
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // hero title lines on load
  gsap.to('.reveal-line', { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.15 });
  gsap.set('.reveal-line', { y: 30 });

  // generic reveals
  if (reduceMotion) {
    gsap.set('.reveal', { opacity: 1, y: 0 });
  } else {
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%',
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true }),
      once: true,
    });

    // subtle scroll choreography on the 3D scene
    gsap.to(camera ? camera.position : {}, {
      z: 7, ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
      onUpdate: () => camera && camera.updateProjectionMatrix(),
    });
    gsap.to(uniforms.uDisplace, {
      value: 0.18, ease: 'none',
      scrollTrigger: { trigger: '#stack', start: 'top bottom', end: 'bottom center', scrub: 1 },
    });
  }

  // animated counters
  document.querySelectorAll('.stat__num').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });
}

/* ============================================================
   3. UI niceties — nav state + card pointer glow
   ============================================================ */
function initUI() {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // smooth in-page anchor navigation (routed through Lenis)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.1 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
}

/* ============================================================
   Boot
   ============================================================ */
if (initScene()) animate();
initMotion();
initUI();
