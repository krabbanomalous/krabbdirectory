// Modules
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/ShaderPass.js';

// Grain Shader
const GrainShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0.0 },
        amount: { value: 0.25 }, // Adjust this value for grain intensity
        staticColor: { value: new THREE.Color(0, 0, 0.7) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float amount;
        uniform vec3 staticColor;

        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            if (color.a < 0.01) {
                // Keep transparent background unaffected
                discard;
            }
            float grain = random(vUv + time) * 2.0 - 1.0; // Grain value in range [-1, 1]
            grain *= amount;
            vec3 grainEffect = staticColor * grain;
            gl_FragColor = vec4(color.rgb + grainEffect, color.a);
        }
    `
};

const HorizontalBlurShader = {
    uniforms: {
        tDiffuse: { value: null },
        h: { value: 1.0 / 512.0 }, // Adjust based on resolution
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float h;
        varying vec2 vUv;

        void main() {
            vec4 sum = vec4(0.0);
            sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * h, vUv.y)) * 0.05;
            sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * h, vUv.y)) * 0.09;
            sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * h, vUv.y)) * 0.12;
            sum += texture2D(tDiffuse, vec2(vUv.x - 1.0 * h, vUv.y)) * 0.15;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.16;
            sum += texture2D(tDiffuse, vec2(vUv.x + 1.0 * h, vUv.y)) * 0.15;
            sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * h, vUv.y)) * 0.12;
            sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * h, vUv.y)) * 0.09;
            sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * h, vUv.y)) * 0.05;
            gl_FragColor = sum;
        }
    `
};

const VerticalBlurShader = {
    uniforms: {
        tDiffuse: { value: null },
        v: { value: 1.0 / 512.0 }, // Adjust based on resolution
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float v;
        varying vec2 vUv;

        void main() {
            vec4 sum = vec4(0.0);
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0 * v)) * 0.05;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0 * v)) * 0.09;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0 * v)) * 0.12;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 1.0 * v)) * 0.15;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.16;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 1.0 * v)) * 0.15;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0 * v)) * 0.12;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0 * v)) * 0.09;
            sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0 * v)) * 0.05;
            gl_FragColor = sum;
        }
    `
};

// Math
function lerp(start, endpoint, alpha) {
    return (start + (endpoint - start) * alpha);
}

function sine(a, b, x, c, d) {
    return a * Math.sin(((2.0 * Math.PI) / b) * x + c) + d;
}

// Init camera
const camera = new THREE.PerspectiveCamera(
    150,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);
camera.position.z = 13;

// Init scene
const scene = new THREE.Scene();
let sig;
const loader = new GLTFLoader();
loader.load("/signaturewhite.glb",
    function (gltf) {
        sig = gltf.scene;
        sig.position.y = 2;
        sig.position.z = -10;
        sig.rotation.y = Math.PI * 0.5;
        scene.add(sig);
    },
    function (xhr) { },
    function (error) { }
);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3D').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x000000, 1.3);
scene.add(ambientLight);

const topLight = new THREE.DirectionalLight(0x1f0652, 1);
topLight.position.set(500, 500, 500);
scene.add(topLight);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const horizontalBlurPass = new ShaderPass(HorizontalBlurShader);
horizontalBlurPass.uniforms.h.value = 2.0 / window.innerWidth; // Adjust for screen size
composer.addPass(horizontalBlurPass);

const verticalBlurPass = new ShaderPass(VerticalBlurShader);
verticalBlurPass.uniforms.v.value = 2.0 / window.innerHeight; // Adjust for screen size
composer.addPass(verticalBlurPass);

const grainPass = new ShaderPass(GrainShader);
composer.addPass(grainPass);

// Rendering logic
let timeSinceInit = 0;
let lastTime = performance.now();

const DEG = (Math.PI / 180);
const MAX_FOV = 30;
const ROTATE_TIME = 90;

const reRender3D = () => {
    const currentTime = performance.now(); // Get the current time
    const deltaTime = (currentTime - lastTime) / 1000; // Time difference in seconds
    lastTime = currentTime;
    timeSinceInit += deltaTime;

    // Update camera FOV
    camera.fov = sine(MAX_FOV - 1, ROTATE_TIME * 0.5, timeSinceInit, (ROTATE_TIME * 0.5), 0) * 0.5 + (MAX_FOV * 0.5) + 1;
    camera.updateProjectionMatrix();

    // Update grain shader time
    grainPass.uniforms.time.value = timeSinceInit;

    // Render the scene with post-processing
    requestAnimationFrame(reRender3D);
    composer.render();
    sig.rotation.y += deltaTime * (360 / ROTATE_TIME) * DEG;
    sig.rotation.x = sine(15, 30, timeSinceInit, 0, 0) * DEG;
};
reRender3D();
