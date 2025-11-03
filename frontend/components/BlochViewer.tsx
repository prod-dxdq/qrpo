"use client";

import { useEffect, useState, useRef } from "react";

export default function BlochViewer({ qubits }: { qubits: any[] }) {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    let animationId: number;
    let scene: any, camera: any, renderer: any;

    const initThree = async () => {
      try {
        console.log("Loading Three.js...");
        const THREE = await import("three");
        console.log("Three.js loaded, creating scene...");

        // Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        
        camera = new THREE.PerspectiveCamera(50, canvasRef.current!.width / canvasRef.current!.height, 0.1, 1000);
        camera.position.z = 8;

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true });
        renderer.setSize(canvasRef.current!.width, canvasRef.current!.height);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Create qubits
        qubits.forEach((q, i) => {
          const x = Math.sin(q.theta) * Math.cos(q.phi);
          const y = Math.sin(q.theta) * Math.sin(q.phi);
          const z = Math.cos(q.theta);
          
          const color = z > 0.5 ? 0x3B82F6 : z < -0.5 ? 0xF97316 : 0xA855F7;

          // Group for this qubit
          const group = new THREE.Group();
          group.position.x = (i - qubits.length / 2) * 2.5;

          // Sphere
          const geometry = new THREE.SphereGeometry(0.6, 24, 24);
          const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.2
          });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          // State vector arrow
          const dir = new THREE.Vector3(x, y, z).normalize();
          const length = Math.sqrt(x*x + y*y + z*z) * 0.6;
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, 0xffffff, 0.2, 0.15);
          group.add(arrow);

          // Wireframe sphere
          const wireGeometry = new THREE.SphereGeometry(0.65, 12, 12);
          const wireMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x555555, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.2 
          });
          const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
          group.add(wireframe);

          scene.add(group);
        });

        console.log("Scene created successfully");

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          scene.rotation.y += 0.003;
          renderer.render(scene, camera);
        };
        animate();

      } catch (err: any) {
        console.error("Three.js initialization error:", err);
        setError(err?.message || "Failed to initialize 3D visualization");
      }
    };

    initThree();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [isClient, qubits]);

  if (!isClient) {
    return (
      <div className="h-80 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-inner p-2 flex items-center justify-center">
        <div className="text-gray-600">Initializing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-inner p-4 flex flex-col items-center justify-center">
        <div className="text-red-600 text-lg mb-2">⚠️ Visualization Error</div>
        <div className="text-red-500 text-sm text-center max-w-md">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="h-80 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-inner p-2 relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={320}
        className="w-full h-full rounded-lg"
        style={{ display: 'block' }}
      />
      <div className="absolute bottom-4 left-4 text-xs text-gray-400">
        🖱️ Auto-rotating • {qubits.length} qubits
      </div>
    </div>
  );
}
