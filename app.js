// Modules
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

// Math
function lerp(start, endpoint, alpha) {
    return (start + (endpoint - start) * alpha)
}

function sine(a, b, x, c, d) {
    return a * Math.sin(((2 * Math.PI) / b) * x + c) + d
}

// Inits camera
const camera = new THREE.PerspectiveCamera(
    150,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);
camera.position.z = 13;

// Inits scene
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
    function (xhr) {},
    function (error) {}
)
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3D').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x000000, 1.3);
scene.add(ambientLight);

const topLight=  new THREE.DirectionalLight(0x3e198a, 1)
topLight.position.set(500, 500, 500);
scene.add(topLight);

// Renders scene
let timeSinceInit = 0;
let lastTime = performance.now();

const DEG = (Math.PI / 180)
const MAX_FOV = 30
const ROTATE_TIME = 90

const reRender3D = () => {
    const currentTime = performance.now(); // Get the current time
    const deltaTime = (currentTime - lastTime) / 1000; // Time difference in seconds
    lastTime = currentTime
    timeSinceInit += deltaTime;

    camera.fov = Math.max(sine(MAX_FOV, ROTATE_TIME * 0.5, timeSinceInit, (ROTATE_TIME * 0.5), 0) * 0.5 + (MAX_FOV * 0.5), 1);
    camera.updateProjectionMatrix();

    requestAnimationFrame(reRender3D);
    renderer.render(scene, camera);
    sig.rotation.y += deltaTime * (360 / ROTATE_TIME) * DEG;
    sig.rotation.x = sine(15, 30, timeSinceInit, 0, 0) * DEG
};
reRender3D();