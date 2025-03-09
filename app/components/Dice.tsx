"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface DiceProps {
  force: number; // Swipe force from player
  onRollComplete: (value: number) => void; // Send dice result to host
}

export default function Dice({ force, onRollComplete }: DiceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const diceBodyRef = useRef<CANNON.Body | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear existing canvas (Fix Duplicate Canvas Issue)
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 2, 3); // Move camera up and back to see full dice

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(400, 400);
    mountRef.current!.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Load Textures
    const textureLoader = new THREE.TextureLoader();
    const texturePaths = [
      "/textures/dice1.png",
      "/textures/dice2.png",
      "/textures/dice3.png",
      "/textures/dice4.png",
      "/textures/dice5.png",
      "/textures/dice6.png",
    ];
    const diceTextures = texturePaths.map((path) => {
      const texture = textureLoader.load(path);
      texture.minFilter = THREE.LinearFilter; // Prevent pixelation
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping; // Prevent edge gaps
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = true;

      return texture;
    });

    // Apply Textures to Dice Faces
    const materials = diceTextures.map(
      (tex) =>
        new THREE.MeshStandardMaterial({
          map: tex,
          metalness: 0.2,
          roughness: 0.4,
          color: 0xffffff, // Ensure no black areas
        })
    );

    // Dice Mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const diceMesh = new THREE.Mesh(geometry, materials);
    scene.add(diceMesh);

    // Physics Setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Dice Physics
    const diceBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      position: new CANNON.Vec3(0, 5, 0),
    });
    world.addBody(diceBody);
    diceBodyRef.current = diceBody;

    // Floor Physics
    const floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floorBody);

    camera.position.z = 3;
    new OrbitControls(camera, renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      world.step(1 / 60);
      diceMesh.position.copy(diceBody.position);
      diceMesh.quaternion.copy(diceBody.quaternion);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  /** 📌 Apply Force When Player Swipes */
  useEffect(() => {
    if (force > 0 && !rolling && diceBodyRef.current) {
      const randomForce = (Math.random() - 0.7) * force;
      setRolling(true);
      const diceBody = diceBodyRef.current;

      // Apply random impulse based on swipe force
      diceBody.velocity.set(0, 5, 0); // Upwards force
      diceBody.angularVelocity.set(randomForce, randomForce, randomForce);

      setTimeout(() => {
        detectDiceFace(diceBody);
        setRolling(false);
      }, 2000); // Simulate roll time
    }
  }, [force]);

  /** 📌 Detect Final Face of Dice */
  /** 📌 Detect Final Face of Dice - Accurate Alignment */
  const detectDiceFace = (diceBody: CANNON.Body) => {
    const upVector = new CANNON.Vec3(0, 1, 0); // Upward direction
    const faceNormals = [
      new CANNON.Vec3(0, 0, 1), // Face 1 (Front)
      new CANNON.Vec3(1, 0, 0), // Face 2 (Right)
      new CANNON.Vec3(0, -1, 0), // Face 3 (Bottom)
      new CANNON.Vec3(0, 1, 0), // Face 4 (Top)
      new CANNON.Vec3(-1, 0, 0), // Face 5 (Left)
      new CANNON.Vec3(0, 0, -1), // Face 6 (Back)
    ];

    const faceOrder = [5, 1, 4, 3, 2, 6]; // Reordered faces to match physics

    let bestFace = 1;
    let maxDot = -Infinity;

    faceNormals.forEach((face, index) => {
      const worldNormal = diceBody.quaternion.vmult(face); // Transform face normal
      const dot = worldNormal.dot(upVector); // Check alignment with UP

      if (dot > maxDot) {
        maxDot = dot;
        bestFace = faceOrder[index]; // Ensure correct face mapping
      }
    });

    console.log("✅ Corrected Dice Face:", bestFace);
    onRollComplete(bestFace);
  };

  return <div ref={mountRef} className="w-[200px] h-[200px]"></div>;
}
