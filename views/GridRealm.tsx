import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Asset, AssetType } from '../types';

interface GridRealmProps {
  assets: Asset[];
  onAssetMove?: (id: string, newPos: { x: number; y: number }) => void;
}

// Configuration for the Board
const GRID_SIZE = 10; // 10x10 Grid
const CELL_SIZE = 4;  // World units per cell

// Color mapping for 3D materials
const getAssetColor = (type: AssetType): number => {
  switch (type) {
    case AssetType.STOCK: return 0x3b82f6; // Blue
    case AssetType.REAL_ESTATE: return 0xf59e0b; // Amber
    case AssetType.BOND: return 0x10b981; // Emerald
    case AssetType.CRYPTO: return 0xa855f7; // Purple
    case AssetType.PRIVATE_EQUITY: return 0xf43f5e; // Rose
    default: return 0x64748b; // Slate
  }
};

const GridRealm: React.FC<GridRealmProps> = ({ assets, onAssetMove }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);

  // Keep a ref to assets for the event listeners to access latest state without re-binding
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  useEffect(() => {
    // Capture ref value to ensure cleanup works if ref changes
    const container = mountRef.current;
    if (!container) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.01); // Lighter fog color and less density
    scene.background = new THREE.Color(0x0f172a); // Lighter background

    // Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 35, 30);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Increased exposure
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // --- LIGHTING ---
    // 1. Ambient Fill: Significantly brighter
    const hemiLight = new THREE.HemisphereLight(0x334155, 0x0f172a, 1.5); 
    scene.add(hemiLight);

    // 2. Key Light: Brighter sun
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 3. Rim Light
    const spotLightCyan = new THREE.SpotLight(0x06b6d4, 800);
    spotLightCyan.position.set(-40, 20, 40);
    spotLightCyan.lookAt(0,0,0);
    scene.add(spotLightCyan);

    // 4. Accent Light
    const pointLightMagenta = new THREE.PointLight(0xd946ef, 300, 60);
    pointLightMagenta.position.set(30, 10, -30);
    scene.add(pointLightMagenta);

    // --- THE BOARD ---
    const boardWidth = GRID_SIZE * CELL_SIZE;
    
    // Grid Lines - Lighter and more opaque
    const gridHelper = new THREE.GridHelper(boardWidth, GRID_SIZE, 0x38bdf8, 0x475569);
    gridHelper.position.y = 0.02;
    // @ts-ignore
    gridHelper.material.transparent = true;
    // @ts-ignore
    gridHelper.material.opacity = 0.5; // More visible grid
    scene.add(gridHelper);

    // Reflective Floor - Lighter base color
    const platformGeometry = new THREE.PlaneGeometry(boardWidth, boardWidth);
    const platformMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, // Slate-800 instead of 950
      roughness: 0.2, 
      metalness: 0.6, // Less metalness to reflect more diffuse light
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.receiveShadow = true;
    scene.add(platform);

    // --- ASSETS ---
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    const boxGeo = new THREE.BoxGeometry(CELL_SIZE * 0.75, 1, CELL_SIZE * 0.75);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);

    // Create meshes
    assets.forEach((asset, index) => {
      let gx = 0;
      let gz = 0;
      
      if (asset.gridPosition) {
        gx = asset.gridPosition.x - 1;
        gz = asset.gridPosition.y - 1;
      } else {
        gx = index % GRID_SIZE;
        gz = Math.floor(index / GRID_SIZE);
      }

      if (gx < 0) gx = 0; if (gx >= GRID_SIZE) gx = GRID_SIZE - 1;
      if (gz < 0) gz = 0; if (gz >= GRID_SIZE) gz = GRID_SIZE - 1;

      const x = (gx - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
      const z = (gz - GRID_SIZE / 2 + 0.5) * CELL_SIZE;

      const height = Math.max(1.5, Math.min(12, Math.log10(asset.value) * 2 - 6)); 
      const color = getAssetColor(asset.type);

      const material = new THREE.MeshPhysicalMaterial({ 
        color: color,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.6,
        thickness: 1.0,
        opacity: 0.9,
        transparent: true,
      });

      const building = new THREE.Mesh(boxGeo, material);
      building.position.set(x, height / 2, z);
      building.scale.set(1, height, 1);
      building.castShadow = true;
      building.receiveShadow = true;
      building.userData = { 
        assetId: asset.id, 
        originalColor: color, 
        gridX: gx + 1, 
        gridY: gz + 1,
        originalPos: new THREE.Vector3(x, height / 2, z)
      };

      const coreGeo = new THREE.BoxGeometry(CELL_SIZE * 0.4, height - 0.2, CELL_SIZE * 0.4);
      const coreMat = new THREE.MeshBasicMaterial({ color: color });
      const core = new THREE.Mesh(coreGeo, coreMat);
      building.add(core);

      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const line = new THREE.LineSegments(edgesGeo, lineMat);
      building.add(line);

      buildingsGroup.add(building);
    });

    // Drag Highlight (Ghost Square)
    const highlightGeo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    highlightMesh.rotation.x = -Math.PI / 2;
    highlightMesh.position.y = 0.05;
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    // --- INTERACTION ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Horizontal plane at y=0 for raycasting
    const planeIntersectPoint = new THREE.Vector3();

    let isDragging = false;
    let draggedObject: THREE.Mesh | null = null;
    let hoveredMesh: THREE.Mesh | null = null;

    const onPointerDown = (event: MouseEvent) => {
      // Calculate pointer position
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      
      // Filter for building meshes only
      const intersects = raycaster.intersectObjects(buildingsGroup.children, false); // false = recursive off, we want top level meshes

      if (intersects.length > 0) {
        const object = intersects[0].object as THREE.Mesh;
        if (object.userData.assetId) {
          isDragging = true;
          draggedObject = object;
          controls.enabled = false; // Disable orbit controls
          
          // Visual feedback
          const mat = object.material as THREE.MeshPhysicalMaterial;
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = 1.0;
          object.position.y += 1; // Lift up
          
          setIsDraggingState(true);
          highlightMesh.visible = true;
        }
      }
    };

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setTooltipPos({ x: event.clientX, y: event.clientY });

      if (isDragging && draggedObject) {
        raycaster.setFromCamera(pointer, camera);
        
        // Raycast against infinite plane
        raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint);
        
        // Snap to grid
        // Convert world x,z to grid coordinates
        // Formula: worldX = (gx - 5 + 0.5) * 4
        // Inverse: gx = (worldX / 4) + 4.5
        const rawGx = Math.floor((planeIntersectPoint.x / CELL_SIZE) + GRID_SIZE/2);
        const rawGz = Math.floor((planeIntersectPoint.z / CELL_SIZE) + GRID_SIZE/2);
        
        // Clamp
        const gx = Math.max(0, Math.min(GRID_SIZE - 1, rawGx));
        const gz = Math.max(0, Math.min(GRID_SIZE - 1, rawGz));

        const snapX = (gx - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
        const snapZ = (gz - GRID_SIZE / 2 + 0.5) * CELL_SIZE;

        draggedObject.position.set(snapX, draggedObject.userData.originalPos.y + 1, snapZ);
        
        // Move highlight
        highlightMesh.position.set(snapX, 0.05, snapZ);
        
        // Change highlight color if occupied
        // We use the grid position (1-based in data, 0-based in calc) to check
        const targetX = gx + 1;
        const targetY = gz + 1;
        
        const isOccupied = assetsRef.current.some(a => 
            a.id !== draggedObject!.userData.assetId && 
            a.gridPosition && 
            a.gridPosition.x === targetX && 
            a.gridPosition.y === targetY
        );

        // @ts-ignore
        highlightMesh.material.color.setHex(isOccupied ? 0xef4444 : 0x06b6d4);

        return; // Skip hover logic while dragging
      }

      // --- Hover Logic (Only when not dragging) ---
      raycaster.setFromCamera(pointer, camera);
      
      // Need to handle children (core/lines) hitting, so we traverse up
      const intersects = raycaster.intersectObjects(buildingsGroup.children, true); 

      if (intersects.length > 0) {
        let object = intersects[0].object as THREE.Mesh;
        // Traverse up to find the main building mesh
        while(object.parent !== buildingsGroup && object.parent !== null) {
            object = object.parent as THREE.Mesh;
        }

        // Check if we actually hit a building
        if (object.userData?.assetId) {
             controls.autoRotate = false;
             if (hoveredMesh !== object) {
                // Restore previous
                if (hoveredMesh && hoveredMesh !== draggedObject) {
                   const mat = hoveredMesh.material as THREE.MeshPhysicalMaterial;
                   // @ts-ignore
                   if (mat && mat.emissive) mat.emissive.setHex(0x000000);
                }
                
                hoveredMesh = object;
                // Only highlight if not being dragged
                if (object !== draggedObject) {
                    const mat = object.material as THREE.MeshPhysicalMaterial;
                    if (mat && mat.emissive) {
                       mat.emissive.setHex(0x222222);
                       mat.emissiveIntensity = 0.5;
                    }
                }
                const asset = assetsRef.current.find(a => a.id === object.userData.assetId);
                setHoveredAsset(asset || null);
                document.body.style.cursor = 'grab';
             }
        }
      } else {
        controls.autoRotate = true;
        if (hoveredMesh) {
           // Restore
           if (hoveredMesh !== draggedObject) {
               const mat = hoveredMesh.material as THREE.MeshPhysicalMaterial;
               // @ts-ignore
               if (mat && mat.emissive) mat.emissive.setHex(0x000000);
           }
           hoveredMesh = null;
           setHoveredAsset(null);
           document.body.style.cursor = 'default';
        }
      }
    };

    const onPointerUp = () => {
      if (isDragging && draggedObject) {
        // Drop Logic
        const currentX = draggedObject.position.x;
        const currentZ = draggedObject.position.z;

        // Calc Grid Coords (1-based for data)
        const gx = Math.floor((currentX / CELL_SIZE) + GRID_SIZE/2) + 1;
        const gy = Math.floor((currentZ / CELL_SIZE) + GRID_SIZE/2) + 1;

        // Collision Check
        const isOccupied = assetsRef.current.some(a => 
            a.id !== draggedObject!.userData.assetId && 
            a.gridPosition && 
            a.gridPosition.x === gx && 
            a.gridPosition.y === gy
        );

        if (isOccupied) {
            // Invalid Move: Snap back
            draggedObject.position.copy(draggedObject.userData.originalPos);
            // Flash red?
        } else {
            // Valid Move: Update State
            if (onAssetMove) {
                onAssetMove(draggedObject.userData.assetId, { x: gx, y: gy });
            }
            // Update internal user data for consistency until re-render
            draggedObject.userData.originalPos.set(currentX, draggedObject.userData.originalPos.y, currentZ);
        }

        // Reset Visuals
        const mat = draggedObject.material as THREE.MeshPhysicalMaterial;
        mat.emissive.setHex(0x222222); // Leave slightly highlighted as it might still be hovered
        mat.emissiveIntensity = 0.5;
        
        draggedObject = null;
        isDragging = false;
        controls.enabled = true;
        highlightMesh.visible = false;
        setIsDraggingState(false);
      }
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp); // Window to catch release outside canvas

    // --- ANIMATION ---
    let animationId: number;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      controls.update();
      pointLightMagenta.intensity = 200 + Math.sin(time * 2) * 50;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      cancelAnimationFrame(animationId);
      
      renderer.dispose();
      boxGeo.dispose();
      edgesGeo.dispose();
      platformGeometry.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [assets, onAssetMove]); // Re-run when assets change to update scene positions

  return (
    <div className="h-full relative overflow-hidden group bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* HUD Elements */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-lg flex items-center gap-3">
          <span className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">Realm</span> // 10x10 Grid
        </h2>
        <p className="text-slate-400 text-sm bg-slate-900/80 p-2 rounded border border-slate-700 backdrop-blur">
          {isDraggingState ? <span className="text-amber-400 font-bold animate-pulse">REPOSITIONING ASSET...</span> : "Local Sector • Expansion Available"}
        </p>
      </div>

      <div className="absolute bottom-6 left-6 pointer-events-none text-xs text-slate-500 font-mono">
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
          [LMB] {isDraggingState ? <span className="text-cyan-400 font-bold">DRAG & DROP</span> : "ROTATE / SELECT"} <br/> [SCROLL] ZOOM <br/> [HOVER] SCAN
        </div>
      </div>

      {hoveredAsset && !isDraggingState && (
        <div 
          className="fixed pointer-events-none z-50 bg-slate-900/95 border-l-4 border-cyan-500 backdrop-blur-xl p-4 rounded-r-lg shadow-[0_0_30px_rgba(6,182,212,0.2)] w-64 text-sm transition-opacity duration-150"
          style={{ 
            left: tooltipPos.x + 20, 
            top: tooltipPos.y - 40,
          }}
        >
          <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
            <h3 className="font-bold text-white uppercase tracking-wider">{hoveredAsset.name}</h3>
          </div>
          <div className="space-y-2 text-slate-300 font-mono text-xs">
             <div className="flex justify-between">
               <span className="text-slate-500">VALUATION</span>
               <span className="text-cyan-400 font-bold">${(hoveredAsset.value/1000).toFixed(1)}k</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">TYPE</span>
               <span className="text-white">{hoveredAsset.type}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">COORDS</span>
               <span className="text-amber-500">[{hoveredAsset.gridPosition?.x}, {hoveredAsset.gridPosition?.y}]</span>
             </div>
             <div className="h-px bg-slate-700 my-1"></div>
             <div className="flex justify-between items-center">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">R: {hoveredAsset.risk}/10</span>
                <span className="text-green-400">+{hoveredAsset.roi * 100}% ROI</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridRealm;