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
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 3, 5); // Move camera up and back to see full dice
    camera.lookAt(new THREE.Vector3(0, 1, 0)); // Ensure it looks at the dice

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

      if (diceBodyRef.current) {
        const dicePos = diceBodyRef.current.position;

        // ✅ Constrain dice inside a small area (prevent escaping)
        dicePos.x = Math.max(-1, Math.min(1, dicePos.x));
        dicePos.z = Math.max(-1, Math.min(1, dicePos.z));
        dicePos.y = Math.max(0.5, dicePos.y); // Prevent sinking below ground

        // ✅ Keep camera always looking at the dice
        const dicePosition = new THREE.Vector3(dicePos.x, dicePos.y, dicePos.z);
        camera.position.set(
          dicePosition.x,
          dicePosition.y + 2,
          dicePosition.z + 3
        );
        camera.lookAt(dicePosition);
      }

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
      console.log("Applying force:", force);
      setRolling(true);
      const diceBody = diceBodyRef.current;

      // Clear any previous rolling detection interval
      let rollingCheck: number | null = null;

      // 💥 Apply a more powerful force
      const forcePlusExtra = force * 30; // Increased from 20 → 30
      diceBody.velocity.set(
        (Math.random() - 0.5) * forcePlusExtra,
        8 + Math.random() * 3, // Higher upward force
        (Math.random() - 0.5) * forcePlusExtra
      );

      diceBody.angularVelocity.set(
        (Math.random() - 0.5) * forcePlusExtra,
        (Math.random() - 0.5) * forcePlusExtra,
        (Math.random() - 0.5) * forcePlusExtra
      );

      // ✅ Using requestAnimationFrame for better physics sync
      const checkDiceStopped = () => {
        const velocity = diceBody.velocity.length();
        const angularVelocity = diceBody.angularVelocity.length();

        if (velocity < 0.1 && angularVelocity < 0.1) {
          console.log("✅ Dice stopped moving.");
          detectDiceFace(diceBody);
          setRolling(false);
        } else {
          rollingCheck = requestAnimationFrame(checkDiceStopped);
        }
      };

      rollingCheck = requestAnimationFrame(checkDiceStopped);

      // Cleanup function: Remove stale animation frames
      return () => {
        if (rollingCheck) cancelAnimationFrame(rollingCheck);
      };
    }
  }, [force]);

  /** 📌 Detect Final Face of Dice */
  /** 📌 Detect Final Face of Dice - Accurate Alignment */
  const detectDiceFace = (diceBody: CANNON.Body) => {
    console.log("Dice stopped moving");
    const upVector = new CANNON.Vec3(0, 1, 0); // Upward direction
    const faceNormals = [
      new CANNON.Vec3(0, 0, 1), // Front
      new CANNON.Vec3(1, 0, 0), // Right
      new CANNON.Vec3(0, -1, 0), // Bottom
      new CANNON.Vec3(0, 1, 0), // Top
      new CANNON.Vec3(-1, 0, 0), // Left
      new CANNON.Vec3(0, 0, -1), // Back
    ];

    const faceOrder = [1, 5, 4, 3, 2, 6]; // ✅ Corrected mapping

    let bestFace = 1;
    let maxDot = -Infinity;

    faceNormals.forEach((face, index) => {
      const worldNormal = diceBody.quaternion.vmult(face); // Transform face normal
      const dot = worldNormal.dot(upVector); // Check alignment with UP

      if (dot > maxDot) {
        maxDot = dot;
        bestFace = faceOrder[index]; // ✅ Ensure correct face mapping
      }
    });

    console.log("✅ Corrected Dice Face:", bestFace);
    onRollComplete(bestFace);
  };

  return <div ref={mountRef} className="w-[200px] h-[200px]"></div>;
}
