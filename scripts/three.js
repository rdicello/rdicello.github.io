import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';


// Create a new 3D scene where everything will live
const scene = new THREE.Scene();

// Set up the renderer that will display our scene on the webpage
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; // Better color rendering
renderer.setClearColor(0x000000, 0); // Transparent background

// Grab the HTML container where the canvas will go
const container = document.getElementById('threejs-container');
renderer.setSize(container.clientWidth, container.clientHeight); // Match container size
container.appendChild(renderer.domElement); // Add canvas to the page

// Create a camera looking at the scene, with a decent field of view
const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.z = 40; // Pull the camera back so we can see the whole scene


// Add controls so user can move the camera around with mouse or touch
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Makes camera movement smooth
controls.dampingFactor = 0.05;
controls.enableZoom = true; // Allow zooming in and out


// These are settings you can tweak from the GUI later on
const params = {
    red: 1,
    green: 2,
    blue: 2,
    threshold: 0.1,
    strength: 0.2,
    radius: 0.4,
    sensitivity: 0.1,
    detail: 0,
    size: 5,
    speed_x: 0,
    speed_y: 0.01,
    speed_z: 0,
    random_x: 0,
    random_y: 0,
    random_z: 0,
    sound_threshold: 2,
    damping: 1
}

// These passes let us add glow/bloom postprocessing to the scene
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight));
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = true;  // This pass will output to screen
renderer.autoClear = false; // Avoid clearing canvas between passes
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

const outputPass = new OutputPass();
bloomComposer.addPass(outputPass);


// Uniform variables for custom shaders (used in vertex and fragment shaders)
const uniforms = {
    u_resolution: { type: 'v2', value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
    u_time: { type: 'f', value: 0.0 },
    u_frequency: { type: 'f', value: 0.0 },
    u_red: { type: 'f', value: params.red },
    u_blue: { type: 'f', value: params.blue },
    u_green: { type: 'f', value: params.green }
}

// Shader material that uses the custom vertex and fragment shaders declared in HTML
const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent: true,
});

// Set up audio listener so we can process sound input from the user
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

const durationSlider = document.getElementById('durationSlider');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');


// Update button style when audio finishes playing
sound.onEnded = () => {
    playButton.classList.remove('pause');
    playButton.classList.add('play');
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let playStartTime = 0;
let pauseOffset = 0;

const playButton = document.getElementById('audioButton');

// Load audio file and set up play/pause toggle on button click
audioLoader.load("../assets/audio/the reason.mp3", function (buffer) {
    sound.setBuffer(buffer);

    playButton.addEventListener('click', () => {
        sound.setVolume(0.5);

        if (playButton.classList.contains('play')) {
            playButton.classList.remove('play');
            playButton.classList.add('pause');
            damping = 0.94; // Let rotation slow down smoothly
            sound.play();
        } else {
            playButton.classList.remove('pause');
            playButton.classList.add('play');
            damping = 1; // Stop rotation slowdown
            sound.pause();
        }
    });
});


// Create an analyzer to get audio frequency/amplitude data in real-time
const analyzer = new THREE.AudioAnalyser(sound, 128);

// Create an icosahedron mesh with shader material, which will react to audio
const geometry = new THREE.IcosahedronGeometry(params.size, params.detail);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
scene.background = null; // Transparent background
mesh.material.wireframe = true; // Show edges only (wireframe style)

const clock = new THREE.Clock();


// Calculate the RMS (root mean square) volume level from the audio data
function getRMS() {
    const data = new Uint8Array(analyzer.analyser.fftSize);
    analyzer.analyser.getByteTimeDomainData(data);

    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
        let normalized = (data[i] - 128) / 128; // Convert to range [-1, 1]
        sumSquares += normalized * normalized;
    }

    let rms = Math.sqrt(sumSquares / data.length);
    return rms; // Returns value between 0 (quiet) and 1 (loud)
}

// Generate a random 3D vector with amplitude scaled by params and input value
function randomTransientVector(amplitude) {
    return new THREE.Vector3(
        (Math.random() * 2 - 1) * amplitude * (params.random_x),
        (Math.random() * 2 - 1) * amplitude * (params.random_y),
        (Math.random() * 2 - 1) * amplitude * (params.random_z)
    );
}

let velocity = new THREE.Vector3(0, 0.00, 0);
let damping = params.damping; // Controls how quickly rotation slows down (1 = no friction)
let previousAmplitude = 0;

let rx = params.random_x;
let ry = params.random_y;
let rz = params.random_z;
let sx = params.speed_x;
let sy = params.speed_y;
let sz = params.speed_z;

// This is the main animation loop, called every frame (~60fps)
function animate() {
    // Get current volume amplitude
    const currentAmplitude = getRMS();

    // If sound level rises above threshold, add some random velocity
    if (currentAmplitude > (previousAmplitude) / params.sound_threshold) {
        velocity.add(randomTransientVector(currentAmplitude));
        previousAmplitude = currentAmplitude;

        // Update time uniform for shader animation
        uniforms.u_time.value = clock.getElapsedTime();

        // Update frequency-related uniform based on audio data and sensitivity
        analyzer.getFrequencyData();
        uniforms.u_frequency.value = getRMS() * analyzer.getAverageFrequency() * params.sensitivity * 10;
    }

    // Slowly reduce velocity by damping factor for smooth slowdown
    velocity.multiplyScalar(damping);

    // Rotate the mesh by velocity plus constant speed values
    mesh.rotation.x += velocity.x + (sx * 0.2);
    mesh.rotation.y += velocity.y + (sy * 0.2);
    mesh.rotation.z += velocity.z + (sz * 0.2);

    // Render the scene normally
    renderer.render(scene, camera);

    // Render postprocessing bloom effect on top
    bloomComposer.render();

    // Request next frame to keep animation going
    requestAnimationFrame(animate);
}

animate();


// Handle resizing the window to keep everything looking right
window.addEventListener('resize', function () {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
    bloomComposer.setSize(container.clientWidth, container.clientHeight);

    camera.lookAt(mesh.position); // Keep camera focused on mesh
});


// GUI interface for tweaking parameters live
const gui = new GUI({ container: document.body, autoPlace: false, width: 300 });
gui.close(); // Start GUI closed

const customContainer = document.getElementById('gui-container');
customContainer.appendChild(gui.domElement);


// Color controls folder
const colorsFolder = gui.addFolder('Color');
colorsFolder.add(params, 'red', 0, 10).name('Red').onChange(value => {
    uniforms.u_red.value = Number(value);
});
colorsFolder.add(params, 'green', 0, 10).name('Green').onChange(value => {
    uniforms.u_green.value = Number(value);
});
colorsFolder.add(params, 'blue', 0, 10).name('Blue').onChange(value => {
    uniforms.u_blue.value = Number(value);
});

// Bloom/glow effect controls
const bloomFolder = gui.addFolder('Glow');
bloomFolder.add(params, 'threshold', 0, 10).name('Threshold').onChange(value => {
    bloomPass.threshold = Number(value);
});
bloomFolder.add(params, 'strength', 0, 5).name('Strength').onChange(value => {
    bloomPass.strength = Number(value);
});
bloomFolder.add(params, 'radius', 0, 1).name('Radius').onChange(value => {
    bloomPass.radius = Number(value);
});

// Structure of the shape controls
const structureFolder = gui.addFolder('Structure');
structureFolder.add(params, 'detail', 0, 40, 1).name('Detail').onChange(value => {
    // Dispose old geometry and replace with new detail level
    mesh.geometry.dispose();
    mesh.geometry = new THREE.IcosahedronGeometry(params.size, value);
});
structureFolder.add(params, 'size', 0, 100).name('Size').onChange(value => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.IcosahedronGeometry(value, params.detail);
});

// Movement controls
const movementFolder = gui.addFolder('Movement');
movementFolder.add(params, 'sensitivity', 0, 2).name('Sensitivity').onChange(() => { });
movementFolder.add(params, 'sound_threshold', 0, 2).name('Sound Threshold').onChange(() => { });
movementFolder.add(params, 'speed_x', 0, 1).name('X Speed').onChange(value => {
    sx = value;
});
movementFolder.add(params, 'speed_y', 0, 1).name('Y Speed').onChange(value => {
    sy = value;
});
movementFolder.add(params, 'speed_z', 0, 1).name('Z Speed').onChange(value => {
    sz = value;
});
movementFolder.add(params, 'random_x', 0, 1).name('Random X').onChange(value => {
    rx = value;
});
movementFolder.add(params, 'random_y', 0, 1).name('Random Y').onChange(value => {
    ry = value;
});
movementFolder.add(params, 'random_z', 0, 1).name('Random Z').onChange(value => {
    rz = value;
});
movementFolder.add(params, 'damping', 0, 1).name('Damping').onChange(value => {
    damping = value;
});
