"use client";

import { useEffect, useState, useRef } from "react";

interface Asset {
  ticker: string;
  weight: number;
  volatility: number;
  correlation: number;
  return: number;
}

interface PortfolioGalaxyProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
}

export default function PortfolioGalaxy({ assets, onAssetClick }: PortfolioGalaxyProps) {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const planetsRef = useRef<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current || assets.length === 0) return;

    let animationId: number;
    let scene: any, camera: any, renderer: any, raycaster: any, mouse: any;

    const initThree = async () => {
      try {
        console.log("Loading Three.js for Portfolio Galaxy...");
        const THREE = await import("three");
        console.log("Three.js loaded, creating galaxy scene...");

        // Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0f);
        sceneRef.current = scene;
        
        camera = new THREE.PerspectiveCamera(
          60, 
          canvasRef.current!.width / canvasRef.current!.height, 
          0.1, 
          1000
        );
        camera.position.set(0, 8, 15);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true });
        renderer.setSize(canvasRef.current!.width, canvasRef.current!.height);

        // Raycaster for mouse interaction
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Lighting - more dramatic
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0xffffff, 1.5);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x6366f1, 0.8);
        pointLight2.position.set(-10, -5, 5);
        scene.add(pointLight2);

        // Central sun (portfolio center)
        const sunGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffd700,
          emissive: 0xffaa00,
          emissiveIntensity: 1,
          metalness: 0.8,
          roughness: 0.2
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Add glow to sun
        const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffaa00,
          transparent: true,
          opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glow);

        // Stars background
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
          const x = (Math.random() - 0.5) * 100;
          const y = (Math.random() - 0.5) * 100;
          const z = (Math.random() - 0.5) * 100;
          starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Create planets for each asset
        const planets: any[] = [];
        assets.forEach((asset, i) => {
          const angle = (i / assets.length) * Math.PI * 2;
          
          // Distance from center based on correlation (lower correlation = farther)
          const baseDistance = 5;
          const distance = baseDistance + (1 - Math.abs(asset.correlation)) * 3;
          
          // Size based on portfolio weight
          const size = 0.3 + asset.weight * 2;
          
          // Color based on return (green = positive, red = negative)
          const color = asset.return >= 0 
            ? new THREE.Color().setHSL(0.33, 0.8, 0.5 + asset.return * 0.3) // Green
            : new THREE.Color().setHSL(0, 0.8, 0.5 + Math.abs(asset.return) * 0.3); // Red

          // Create planet
          const planetGeometry = new THREE.SphereGeometry(size, 24, 24);
          const planetMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            metalness: 0.4,
            roughness: 0.6
          });
          const planet = new THREE.Mesh(planetGeometry, planetMaterial);
          
          // Initial position
          planet.position.x = Math.cos(angle) * distance;
          planet.position.z = Math.sin(angle) * distance;
          planet.position.y = (Math.random() - 0.5) * 1; // Slight vertical variation

          // Store metadata
          planet.userData = {
            asset,
            baseDistance: distance,
            angle,
            speed: 0.0005 + asset.volatility * 0.002, // Faster orbit = more volatile
            size
          };

          scene.add(planet);
          planets.push(planet);

          // Orbit ring
          const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
          const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.1
          });
          const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
          orbit.rotation.x = Math.PI / 2;
          scene.add(orbit);

          // Label sprite (text)
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = 256;
          canvas.height = 64;
          context.fillStyle = 'rgba(255, 255, 255, 0.9)';
          context.font = 'bold 48px Arial';
          context.textAlign = 'center';
          context.fillText(asset.ticker, 128, 48);
          
          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(2, 0.5, 1);
          sprite.position.y = size + 0.5;
          planet.add(sprite);
        });

        planetsRef.current = planets;

        console.log(`Created ${planets.length} planets in galaxy`);

        // Mouse interaction
        const onMouseMove = (event: MouseEvent) => {
          const rect = canvasRef.current!.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onMouseClick = () => {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(planets);
          
          if (intersects.length > 0) {
            const planet = intersects[0].object;
            const asset = planet.userData.asset;
            setSelectedAsset(asset);
            if (onAssetClick) onAssetClick(asset);
            
            // Pulse effect
            const originalScale = planet.userData.size;
            planet.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => {
              planet.scale.set(1, 1, 1);
            }, 200);
          }
        };

        canvasRef.current.addEventListener('mousemove', onMouseMove);
        canvasRef.current.addEventListener('click', onMouseClick);

        // Animation loop
        let time = 0;
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          time += 0.01;

          // Rotate sun glow
          glow.rotation.y += 0.002;
          
          // Orbit planets
          planets.forEach((planet) => {
            const data = planet.userData;
            data.angle += data.speed;
            
            planet.position.x = Math.cos(data.angle) * data.baseDistance;
            planet.position.z = Math.sin(data.angle) * data.baseDistance;
            planet.position.y = Math.sin(time + data.angle) * 0.3; // Slight bobbing
            
            // Rotate planets
            planet.rotation.y += 0.01;
          });

          // Slowly rotate camera around the scene
          camera.position.x = Math.cos(time * 0.1) * 15;
          camera.position.z = Math.sin(time * 0.1) * 15;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        };
        animate();

      } catch (err: any) {
        console.error("Three.js galaxy initialization error:", err);
        setError(err?.message || "Failed to initialize 3D galaxy");
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
  }, [isClient, assets, onAssetClick]);

  if (!isClient) {
    return (
      <div className="h-[500px] bg-gradient-to-br from-indigo-950 to-purple-950 rounded-xl shadow-inner flex items-center justify-center">
        <div className="text-slate-300">Initializing Galaxy...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[500px] bg-gradient-to-br from-red-950 to-rose-950 rounded-xl shadow-inner flex flex-col items-center justify-center p-6">
        <div className="text-red-300 mb-4">Failed to load 3D Galaxy</div>
        <div className="text-red-400 text-sm">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500}
        className="w-full rounded-xl shadow-2xl"
      />
      
      {selectedAsset && (
        <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 backdrop-blur-sm shadow-xl min-w-[200px]">
          <div className="text-lg font-bold text-white mb-2">
            {selectedAsset.ticker}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Weight:</span>
              <span className="text-emerald-300 font-mono">{(selectedAsset.weight * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Return:</span>
              <span className={`font-mono ${selectedAsset.return >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {(selectedAsset.return * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volatility:</span>
              <span className="text-amber-300 font-mono">{(selectedAsset.volatility * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Correlation:</span>
              <span className="text-blue-300 font-mono">{selectedAsset.correlation.toFixed(3)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
            <div>🌍 <strong>Orbit Speed:</strong> Volatility</div>
            <div>📏 <strong>Size:</strong> Portfolio Weight</div>
            <div>📍 <strong>Distance:</strong> Market Correlation</div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <span className="text-yellow-400">☀️ Sun:</span> Portfolio Center
          </div>
          <div>
            <span className="text-blue-400">🌍 Size:</span> Allocation %
          </div>
          <div>
            <span className="text-purple-400">💨 Speed:</span> Volatility
          </div>
          <div>
            <span className="text-pink-400">📍 Distance:</span> Correlation
          </div>
        </div>
        <div className="mt-2 text-slate-500">
          💡 <strong>Tip:</strong> Click on any planet to see details. Planets farther from the sun = less correlated to market.
        </div>
      </div>
    </div>
  );
}
