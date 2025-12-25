
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initCourt3D() {
    const container = document.getElementById('court-canvas');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background matching theme
    scene.fog = new THREE.Fog(0x1a1a1a, 20, 100);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- Court Construction ---

    // Floor (Green Court)
    const courtWidth = 13.4; // Standard width adjusted scale
    const courtLength = 6.1;  // Standard length (actually 13.4m length x 6.1m width in reality, swapping for visual orientation)
    // Actually: Length 13.40m, Width 6.10m. Let's orient Length along X or Z. Let's do Length along X.

    // Using standard dimensions / 1 meter scale
    const geometryFloor = new THREE.PlaneGeometry(15, 8); // Slightly larger than court
    const materialFloor = new THREE.MeshStandardMaterial({
        color: 0x00C9A7, // Teal-ish Green
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(geometryFloor, materialFloor);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Lines Function
    function createLine(width, length, positionX, positionZ) {
        const geometry = new THREE.PlaneGeometry(width, length);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(geometry, material);
        line.rotation.x = -Math.PI / 2;
        line.position.set(positionX, 0.01, positionZ); // Slightly above floor
        scene.add(line);
    }

    const lw = 0.05; // Line width

    // Outer Boundary
    // Top/Bottom (Long edges)
    createLine(13.4 + lw, lw, 0, 3.05);
    createLine(13.4 + lw, lw, 0, -3.05);
    // Left/Right (Short edges / Baselines)
    createLine(lw, 6.1, -6.7, 0);
    createLine(lw, 6.1, 6.7, 0);

    // Singles Side Lines (width 5.18m, so +- 2.59m)
    createLine(13.4, lw, 0, 2.59);
    createLine(13.4, lw, 0, -2.59);

    // Center Line (Length / 2)
    // Only from Short Service Line to Back Boundary Line
    // Short service line is 1.98m from net.
    // Length is 6.7m per side. 6.7 - 1.98 = 4.72m long center line
    // Pos X: 1.98 + 4.72/2 = 4.34
    createLine(4.72, lw, 4.34, 0);
    createLine(4.72, lw, -4.34, 0);

    // Short Service Line (1.98m from center)
    createLine(lw, 6.1, 1.98, 0);
    createLine(lw, 6.1, -1.98, 0);

    // Doubles Long Service Line (0.76m from back)
    // Pos X: 6.7 - 0.76 = 5.94
    createLine(lw, 6.1, 5.94, 0);
    createLine(lw, 6.1, -5.94, 0);


    // Net
    const netHeight = 1.55;
    const netWidth = 6.1;

    // Posts
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, netHeight, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(0, netHeight / 2, 3.05);
    scene.add(post1);

    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(0, netHeight / 2, -3.05);
    scene.add(post2);

    // Net Mesh
    const netGeo = new THREE.PlaneGeometry(0.02, netWidth); // Vertical orientation rotated
    // Actually better to make a plane 6.1 wide and 0.76 high (net depth is 0.76m)
    const actualNetGeo = new THREE.PlaneGeometry(0.76, 6.1);
    const netTexture = createNetTexture();
    const netMat = new THREE.MeshBasicMaterial({
        map: netTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        color: 0xffffff
    });

    const net = new THREE.Mesh(actualNetGeo, netMat);
    net.position.set(0, netHeight - 0.38, 0); // Center of net vertically
    net.rotation.y = Math.PI / 2; // Face X axis
    net.rotation.z = Math.PI / 2; // Rotate to stand up? No standard plane is XY. width, height.
    // Plane (0.76, 6.1). 
    // Rotate X -90 ? No.
    // Default Plane is XY.
    // We want it YZ plane basically.
    net.rotation.y = Math.PI / 2;

    scene.add(net);

    // Top White Tape of Net
    const tapeGeo = new THREE.BoxGeometry(0.02, 0.05, 6.1);
    const tapeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.position.set(0, 1.525, 0);
    scene.add(tape);

    // --- Weak Spots (Tactical Analysis) ---
    function createWeakSpot(x, z) {
        // Red glowing ring/disk
        const geometry = new THREE.RingGeometry(0.3, 0.4, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const spot = new THREE.Mesh(geometry, material);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(x, 0.02, z); // Just above lines
        scene.add(spot);

        // Inner pulses
        const innerGeo = new THREE.CircleGeometry(0.3, 32);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(x, 0.021, z);
        scene.add(inner);
    }

    // Add some random weak spots for demo
    createWeakSpot(3.5, -2.0); // Back right
    createWeakSpot(-4.0, 1.5); // Front left


    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function createNetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, 64, 64);

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;

    // Cross hatch
    ctx.beginPath();
    // Vertical
    for (let i = 0; i <= 64; i += 8) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 64);
    }
    // Horizontal
    for (let i = 0; i <= 64; i += 8) {
        ctx.moveTo(0, i);
        ctx.lineTo(64, i);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 2);
    return texture;
}
