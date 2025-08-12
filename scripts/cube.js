import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Create the scene where everything happens
const scene = new THREE.Scene();

// Set up the renderer — the thing that draws everything on screen
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
// Using sRGB color space for better color accuracy
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Make background fully transparent (alpha 0)
renderer.setClearColor(0x000000, 0);

// Grab the container from the HTML to put the canvas inside
const container = document.getElementById('cube-container');
// Make the renderer match container size
renderer.setSize(container.clientWidth, container.clientHeight);
// Append the canvas so we can see it
container.appendChild(renderer.domElement);

// Set up the camera (our viewpoint into the 3D world)
const camera = new THREE.PerspectiveCamera(
    45, // Field of view in degrees
    container.clientWidth / container.clientHeight, // Aspect ratio
    0.1, // Near clipping plane — how close is too close
    1000 // Far clipping plane — how far we can see
);
// Pull camera back a bit so cube isn’t right on top of us
camera.position.z = 3;

// Load videos we want to use as textures on some cube faces
const loader = new THREE.TextureLoader();
const video1 = document.createElement('video');
const video2 = document.createElement('video');
const video3 = document.createElement('video');
// Set video sources
video1.src = './assets/videos/1.mp4';
video2.src = './assets/videos/2.mp4';
video3.src = './assets/videos/4.mp4';

// Put the videos into an array to handle them all at once
const videos = [video1, video2, video3];

// Loop through each video and prepare it to play silently and loop forever
videos.forEach(video => {
    video.loop = true;
    video.muted = true;  // Required for autoplay to work in most browsers
    video.autoplay = true;
    video.play().catch(() => {
        // Sometimes autoplay gets blocked, this warns us
        console.warn('Autoplay was prevented by the browser. User interaction is needed.');
    });
});

// Create video textures from those videos to use in Three.js materials
const videoTexture1 = new THREE.VideoTexture(video1);
const videoTexture2 = new THREE.VideoTexture(video2);
const videoTexture3 = new THREE.VideoTexture(video3);

// Prepare materials for each face of the cube (6 faces total)
// Mix of static images and video textures
const materials = [
    new THREE.MeshBasicMaterial({ map: loader.load('./assets/images/3.jpeg') }), // Face 1: Image
    new THREE.MeshBasicMaterial({ map: loader.load('./assets/images/5.jpeg') }), // Face 2: Image
    new THREE.MeshBasicMaterial({ map: loader.load('./assets/images/6.jpeg') }), // Face 3: Image
    new THREE.MeshBasicMaterial({ map: videoTexture1 }),                        // Face 4: Video
    new THREE.MeshBasicMaterial({ map: videoTexture2 }),                        // Face 5: Video
    new THREE.MeshBasicMaterial({ map: videoTexture3 }),                        // Face 6: Video
];

// Create the cube geometry (box shape)
const geometry = new THREE.BoxGeometry(1, 1, 1);
// Create a mesh — geometry + materials combined
const cube = new THREE.Mesh(geometry, materials);
// Add the cube to the scene so it will be drawn
scene.add(cube);

// Set up orbit controls to let user rotate and zoom the camera smoothly
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Smooth out movement
controls.dampingFactor = 0.05;  // How much damping slows motion
controls.enableZoom = true;     // Let user zoom in/out

// Animation loop — called every frame
function animate() {
    // Schedule this function to run again on the next frame
    requestAnimationFrame(animate);

    // Slowly spin the cube on X and Y axes
    cube.rotation.x += 0.003;
    cube.rotation.y += 0.001;

    // Update controls so damping works
    controls.update();

    // Actually draw the scene from the camera perspective
    renderer.render(scene, camera);
}
// Start the animation loop
animate();

// Handle window resizing so the 3D scene stays sized properly
window.addEventListener('resize', function () {
    // Update camera aspect ratio based on new container size
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    // Resize renderer to fit new size
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Make sure camera is looking at the cube (not strictly necessary if cube is at origin)
    camera.lookAt(cube.position);
});
