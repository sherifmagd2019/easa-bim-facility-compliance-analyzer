import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { BimElement, Finding, SeverityLevel } from '../types';
import {
  Focus,
  RotateCcw,
  Flame,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye
} from 'lucide-react';
import {
  computeFacilityHeatMap,
  getLegendItems,
  HeatMapScheme,
  HeatMapMetric,
  ElementHeatData,
  SEVERITY_WEIGHTS
} from '../utils/complianceHeatMap';

interface BimViewer3DProps {
  rooms: BimElement[];
  doors: BimElement[];
  equipment: BimElement[];
  findings?: Finding[];
  selectedElementId?: number | null;
  onSelectElement?: (element: BimElement | null) => void;
  isolatedElementId?: number | null;
  onToggleIsolate?: () => void;
  initialHeatMapActive?: boolean;
}

interface MeshMeta {
  elementId: number;
  originalMeshColors: Map<THREE.Mesh, { color: THREE.Color; emissive: THREE.Color; opacity: number }>;
  originalLineColors: Map<THREE.LineSegments, THREE.Color>;
}

export const BimViewer3D: React.FC<BimViewer3DProps> = ({
  rooms,
  doors,
  equipment,
  findings = [],
  selectedElementId,
  onSelectElement,
  isolatedElementId,
  onToggleIsolate,
  initialHeatMapActive = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const metaRef = useRef<Map<number, MeshMeta>>(new Map());
  const thermalRadiantGroupRef = useRef<THREE.Group | null>(null);
  const reqAnimRef = useRef<number | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const isDirtyRef = useRef(true);

  // Heat map states
  const [isHeatMapActive, setIsHeatMapActive] = useState<boolean>(initialHeatMapActive);
  const [heatMapScheme, setHeatMapScheme] = useState<HeatMapScheme>('safety');
  const [heatMapMetric, setHeatMapMetric] = useState<HeatMapMetric>('max_severity');
  const [heatIntensity, setHeatIntensity] = useState<number>(0.85);
  const [pulseCritical, setPulseCritical] = useState<boolean>(true);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<SeverityLevel | 'Compliant' | 'ALL'>('ALL');
  const [showConfigPopover, setShowConfigPopover] = useState<boolean>(false);
  const [hoveredElementData, setHoveredElementData] = useState<{
    element: BimElement;
    heatData?: ElementHeatData;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // Camera Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraDistanceRef = useRef(46);
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.4 });

  // Compute facility heat data using D3 color scale
  const allElements = useMemo(() => [...rooms, ...doors, ...equipment], [rooms, doors, equipment]);

  const heatMapData = useMemo(() => {
    return computeFacilityHeatMap(allElements, findings, heatMapScheme, heatMapMetric);
  }, [allElements, findings, heatMapScheme, heatMapMetric]);

  const legendItems = useMemo(() => {
    return getLegendItems(heatMapData, heatMapScheme);
  }, [heatMapData, heatMapScheme]);

  const triggerRender = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const r = cameraDistanceRef.current;
    const { theta, phi } = cameraAnglesRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);
    triggerRender();
  }, [triggerRender]);

  // Create thermal radial radiant projection texture
  const createRadiantTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.5)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Build Scene and Meshes
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0F1D');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Optimized Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(35, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
    fillLight.position.set(-30, 25, -30);
    scene.add(fillLight);

    // Floor Slab
    const slabGeo = new THREE.PlaneGeometry(86, 64);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.92,
      metalness: 0.08
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.rotation.x = -Math.PI / 2;
    slabMesh.position.y = -0.05;
    slabMesh.receiveShadow = true;
    scene.add(slabMesh);

    // Grid lines
    const grid = new THREE.GridHelper(80, 40, 0x1e293b, 0x0f172a);
    grid.position.y = 0.01;
    scene.add(grid);

    // Thermal radiant ground group
    const radiantGroup = new THREE.Group();
    radiantGroup.position.y = 0.02;
    scene.add(radiantGroup);
    thermalRadiantGroupRef.current = radiantGroup;

    // Build facility elements
    buildFacilityElements(scene);

    // Render loop
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      reqAnimRef.current = requestAnimationFrame(animate);

      // Pulse animation for critical items when active
      if (pulseCritical && isHeatMapActive) {
        const elapsedTime = clockRef.current.getElapsedTime();
        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 4.5);

        meshesRef.current.forEach((group, id) => {
          const heat = heatMapData.get(id);
          if (heat && (heat.maxSeverity === 'Critical' || heat.maxSeverity === 'High')) {
            const pulseIntensity = heat.maxSeverity === 'Critical' ? 0.35 + pulse * 0.45 : 0.15 + pulse * 0.25;
            const pColor = new THREE.Color(heat.colorHex);
            group.traverse(child => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                if (selectedElementId !== id) {
                  child.material.emissive.copy(pColor);
                  child.material.emissiveIntensity = pulseIntensity;
                }
              }
            });
          }
        });
        isDirtyRef.current = true;
      }

      if (isDirtyRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        isDirtyRef.current = false;
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 540;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      triggerRender();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      slabGeo.dispose();
      slabMat.dispose();
    };
  }, []);

  const buildFacilityElements = (scene: THREE.Scene) => {
    meshesRef.current.clear();
    metaRef.current.clear();

    // 1. Rooms
    rooms.forEach(rm => {
      const group = new THREE.Group();
      (group as any).elementId = rm.elementId;

      let baseColorHex = 0x3b82f6; // standard blue
      if (rm.name.includes('Quarantine')) baseColorHex = 0xef4444;
      else if (rm.name.includes('Bonded')) baseColorHex = 0x10b981;
      else if (rm.name.includes('Battery')) baseColorHex = 0xf59e0b;
      else if (rm.name.includes('NDT')) baseColorHex = 0x8b5cf6;
      else if (rm.name.includes('Inspection')) baseColorHex = 0x06b6d4;

      const w = rm.dimensions.width;
      const d = rm.dimensions.depth;

      const padGeo = new THREE.BoxGeometry(w - 0.2, 0.08, d - 0.2);
      const padMat = new THREE.MeshStandardMaterial({
        color: baseColorHex,
        transparent: true,
        opacity: 0.35,
        roughness: 0.5
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.set(0, 0.04, 0);
      group.add(padMesh);

      const wallHeight = 1.6;
      const outlineMat = new THREE.LineBasicMaterial({ color: baseColorHex, linewidth: 1.5 });
      const boxOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, wallHeight, d)),
        outlineMat
      );
      boxOutline.position.set(0, wallHeight / 2, 0);
      group.add(boxOutline);

      group.position.set(rm.coordinates.x, 0, rm.coordinates.y);
      scene.add(group);
      meshesRef.current.set(rm.elementId, group);

      const meta: MeshMeta = {
        elementId: rm.elementId,
        originalMeshColors: new Map([[padMesh, { color: new THREE.Color(baseColorHex), emissive: new THREE.Color(0x000000), opacity: 0.35 }]]),
        originalLineColors: new Map([[boxOutline, new THREE.Color(baseColorHex)]])
      };
      metaRef.current.set(rm.elementId, meta);
    });

    // 2. Doors
    doors.forEach(dr => {
      const group = new THREE.Group();
      (group as any).elementId = dr.elementId;

      const isRollup = dr.familyName.includes('Rollup');
      const isDeficient = dr.elementId === 20202;
      const baseDoorColor = isDeficient ? 0xef4444 : isRollup ? 0x38bdf8 : 0x94a3b8;

      const w = dr.dimensions.width;
      const h = dr.dimensions.height;
      const d = dr.dimensions.depth;

      const doorMat = new THREE.MeshStandardMaterial({
        color: baseDoorColor,
        roughness: 0.3,
        metalness: 0.5
      });
      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), doorMat);
      doorMesh.position.set(0, h / 2, 0);
      group.add(doorMesh);

      const frameMat = new THREE.LineBasicMaterial({ color: isDeficient ? 0xffffff : 0x0284c7 });
      const frameOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.1, h + 0.1, d + 0.1)),
        frameMat
      );
      frameOutline.position.set(0, h / 2, 0);
      group.add(frameOutline);

      group.position.set(dr.coordinates.x, 0, dr.coordinates.y);
      scene.add(group);
      meshesRef.current.set(dr.elementId, group);

      const meta: MeshMeta = {
        elementId: dr.elementId,
        originalMeshColors: new Map([[doorMesh, { color: new THREE.Color(baseDoorColor), emissive: new THREE.Color(0x000000), opacity: 1.0 }]]),
        originalLineColors: new Map([[frameOutline, new THREE.Color(isDeficient ? 0xffffff : 0x0284c7)]])
      };
      metaRef.current.set(dr.elementId, meta);
    });

    // 3. Equipment & Tooling Assets
    equipment.forEach(eq => {
      const group = new THREE.Group();
      (group as any).elementId = eq.elementId;

      const isMissingParam = eq.isMissingRequiredParameters;
      const eqColor = isMissingParam ? 0xf59e0b : 0xe2e8f0;

      const w = eq.dimensions.width;
      const h = eq.dimensions.height;
      const d = eq.dimensions.depth;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: eqColor,
        roughness: 0.4,
        metalness: 0.6
      });
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
      bodyMesh.position.set(0, h / 2, 0);
      group.add(bodyMesh);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: isMissingParam ? 0xf59e0b : 0x10b981,
        emissive: isMissingParam ? 0xd97706 : 0x059669,
        emissiveIntensity: 0.6
      });
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.25),
        beaconMat
      );
      beacon.position.set(0, h + 0.15, 0);
      group.add(beacon);

      group.position.set(eq.coordinates.x, 0, eq.coordinates.y);
      scene.add(group);
      meshesRef.current.set(eq.elementId, group);

      const meta: MeshMeta = {
        elementId: eq.elementId,
        originalMeshColors: new Map<THREE.Mesh, { color: THREE.Color; emissive: THREE.Color; opacity: number }>([
          [bodyMesh, { color: new THREE.Color(eqColor), emissive: new THREE.Color(0x000000), opacity: 1.0 }],
          [beacon, { color: new THREE.Color(isMissingParam ? 0xf59e0b : 0x10b981), emissive: new THREE.Color(isMissingParam ? 0xd97706 : 0x059669), opacity: 1.0 }]
        ]),
        originalLineColors: new Map()
      };
      metaRef.current.set(eq.elementId, meta);
    });

    // 4. Sample ULD Containers (AKE & PMC Pallet)
    const akeGroup = new THREE.Group();
    const akeBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.6, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 })
    );
    akeBody.position.set(0, 0.8, 0);
    akeGroup.add(akeBody);
    akeGroup.position.set(-2, 0, 1);
    scene.add(akeGroup);

    const pmcGroup = new THREE.Group();
    const pmcBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.08, 3.18),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 })
    );
    pmcBase.position.set(0, 0.04, 0);
    pmcGroup.add(pmcBase);
    pmcGroup.position.set(-21, 0, -1);
    scene.add(pmcGroup);

    triggerRender();
  };

  // Re-apply Heat Map Color Coding & Floor Radiant Disks whenever heat map props change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing thermal radiant disks
    if (thermalRadiantGroupRef.current) {
      while (thermalRadiantGroupRef.current.children.length > 0) {
        const obj = thermalRadiantGroupRef.current.children[0];
        thermalRadiantGroupRef.current.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) (obj as any).material.dispose();
      }
    }

    const radiantTexture = createRadiantTexture();

    // Iterate through elements and update material colors
    metaRef.current.forEach((meta, elementId) => {
      const group = meshesRef.current.get(elementId);
      if (!group) return;

      const heat = heatMapData.get(elementId);
      const isSelected = selectedElementId === elementId;
      const isIsolated = isolatedElementId === elementId;

      // Filter by severity if filter active
      const matchesFilter =
        selectedSeverityFilter === 'ALL' ||
        (heat && heat.maxSeverity === selectedSeverityFilter);

      if (isolatedElementId != null) {
        group.visible = isIsolated;
      } else {
        group.visible = Boolean(matchesFilter);
      }

      if (!isHeatMapActive || !heat) {
        // Restore original materials
        meta.originalMeshColors.forEach((orig, mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.color.copy(orig.color);
            mesh.material.opacity = orig.opacity;
            mesh.material.transparent = orig.opacity < 1.0;
            if (isSelected) {
              mesh.material.emissive.set('#38BDF8');
              mesh.material.emissiveIntensity = 0.55;
            } else {
              mesh.material.emissive.copy(orig.emissive);
              mesh.material.emissiveIntensity = 0;
            }
          }
        });

        meta.originalLineColors.forEach((origColor, line) => {
          if (line.material instanceof THREE.LineBasicMaterial) {
            line.material.color.copy(origColor);
          }
        });
      } else {
        // Apply Heat Map Color Coding using D3 color scale
        const heatColor = new THREE.Color(heat.colorHex);

        meta.originalMeshColors.forEach((orig, mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            const targetColor = orig.color.clone().lerp(heatColor, heatIntensity);
            mesh.material.color.copy(targetColor);

            // Enhance opacity and presence in heat map view
            if (orig.opacity < 1.0) {
              mesh.material.opacity = 0.65;
              mesh.material.transparent = true;
            }

            if (isSelected) {
              mesh.material.emissive.set('#38BDF8');
              mesh.material.emissiveIntensity = 0.6;
            } else if (!pulseCritical || (heat.maxSeverity !== 'Critical' && heat.maxSeverity !== 'High')) {
              // Soft ambient emissive for high risk elements
              if (heat.maxSeverity === 'Critical') {
                mesh.material.emissive.copy(heatColor);
                mesh.material.emissiveIntensity = 0.25;
              } else if (heat.maxSeverity === 'High') {
                mesh.material.emissive.copy(heatColor);
                mesh.material.emissiveIntensity = 0.15;
              } else {
                mesh.material.emissive.set(0x000000);
                mesh.material.emissiveIntensity = 0;
              }
            }
          }
        });

        meta.originalLineColors.forEach((_, line) => {
          if (line.material instanceof THREE.LineBasicMaterial) {
            line.material.color.copy(heatColor);
          }
        });

        // Add radiant thermal projection on ground plane for non-compliant elements
        if (
          thermalRadiantGroupRef.current &&
          matchesFilter &&
          (heat.maxSeverity === 'Critical' || heat.maxSeverity === 'High' || heat.maxSeverity === 'Medium')
        ) {
          const el = allElements.find(e => e.elementId === elementId);
          if (el) {
            const radius = Math.max(el.dimensions.width, el.dimensions.depth) * 0.95;
            const diskGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
            const diskMat = new THREE.MeshBasicMaterial({
              map: radiantTexture,
              color: heatColor,
              transparent: true,
              opacity: heat.maxSeverity === 'Critical' ? 0.6 : heat.maxSeverity === 'High' ? 0.45 : 0.3,
              depthWrite: false,
              blending: THREE.AdditiveBlending
            });
            const diskMesh = new THREE.Mesh(diskGeo, diskMat);
            diskMesh.rotation.x = -Math.PI / 2;
            diskMesh.position.set(el.coordinates.x, 0.025, el.coordinates.y);
            thermalRadiantGroupRef.current.add(diskMesh);
          }
        }
      }
    });

    triggerRender();
  }, [
    isHeatMapActive,
    heatMapScheme,
    heatMapMetric,
    heatIntensity,
    pulseCritical,
    selectedSeverityFilter,
    heatMapData,
    selectedElementId,
    isolatedElementId,
    allElements,
    triggerRender
  ]);

  // Focus on selected element
  useEffect(() => {
    if (selectedElementId != null && cameraRef.current) {
      const group = meshesRef.current.get(selectedElementId);
      if (group) {
        cameraTargetRef.current.set(group.position.x, 1.5, group.position.z);
        cameraDistanceRef.current = 22;
        updateCameraPosition();
      }
    }
  }, [selectedElementId, updateCameraPosition]);

  // Mouse Orbit & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      if (e.buttons === 1) {
        cameraAnglesRef.current.theta -= deltaX * 0.008;
        cameraAnglesRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, cameraAnglesRef.current.phi - deltaY * 0.008));
      } else if (e.buttons === 2) {
        const panSpeed = 0.04;
        const theta = cameraAnglesRef.current.theta;
        cameraTargetRef.current.x -= (Math.cos(theta) * deltaX - Math.sin(theta) * deltaY) * panSpeed;
        cameraTargetRef.current.z += (Math.sin(theta) * deltaX + Math.cos(theta) * deltaY) * panSpeed;
      }
      updateCameraPosition();
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    }

    // Raycast for hover tooltip in 3D scene
    if (mountRef.current && cameraRef.current && sceneRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const allMeshGroups: THREE.Object3D[] = [];
      meshesRef.current.forEach(g => {
        if (g.visible) allMeshGroups.push(g);
      });

      const intersects = raycaster.intersectObjects(allMeshGroups, true);
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !(current as any).elementId) {
          current = current.parent;
        }
        if (current && (current as any).elementId) {
          const id = (current as any).elementId;
          const found = allElements.find(el => el.elementId === id);
          if (found) {
            const heat = heatMapData.get(id);
            setHoveredElementData({
              element: found,
              heatData: heat,
              screenX: e.clientX - rect.left,
              screenY: e.clientY - rect.top
            });
            return;
          }
        }
      }
      setHoveredElementData(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraDistanceRef.current = Math.max(6, Math.min(95, cameraDistanceRef.current + e.deltaY * 0.05));
    updateCameraPosition();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const allObjects: THREE.Object3D[] = [];
    meshesRef.current.forEach(obj => {
      if (obj.visible) allObjects.push(obj);
    });

    const intersects = raycaster.intersectObjects(allObjects, true);
    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !(current as any).elementId) {
        current = current.parent;
      }
      if (current && (current as any).elementId) {
        const id = (current as any).elementId;
        const found = allElements.find(el => el.elementId === id) || null;
        onSelectElement?.(found);
      }
    }
  };

  const setPresetView = (mode: '3D' | '2D') => {
    setViewMode(mode);
    if (mode === '2D') {
      cameraAnglesRef.current = { theta: 0, phi: 0.01 };
      cameraTargetRef.current.set(0, 0, 0);
      cameraDistanceRef.current = 50;
    } else {
      cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.4 };
      cameraDistanceRef.current = 46;
    }
    updateCameraPosition();
  };

  const resetCamera = () => {
    cameraTargetRef.current.set(0, 0, 0);
    cameraDistanceRef.current = 46;
    cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.4 };
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-[540px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-lg select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          setHoveredElementData(null);
        }}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Top HUD Controls Toolbar */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-lg text-xs text-slate-300 shadow-md z-10">
        {/* Heat Map Toggle Button */}
        <button
          onClick={() => setIsHeatMapActive(!isHeatMapActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
            isHeatMapActive
              ? 'bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 text-white shadow-sm shadow-red-500/20'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="Toggle Compliance Severity Heat Map Overlay"
        >
          <Flame className={`w-3.5 h-3.5 ${isHeatMapActive ? 'text-amber-200 animate-pulse' : 'text-slate-400'}`} />
          <span>Heat Map: {isHeatMapActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Heat Map Configuration Popover Button */}
        {isHeatMapActive && (
          <button
            onClick={() => setShowConfigPopover(!showConfigPopover)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
              showConfigPopover ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Configure Heat Map Palettes and Metrics"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Options</span>
          </button>
        )}

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Camera Views */}
        <button
          onClick={() => setPresetView('3D')}
          className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
            viewMode === '3D' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800'
          }`}
        >
          Perspective 3D
        </button>
        <button
          onClick={() => setPresetView('2D')}
          className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
            viewMode === '2D' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800'
          }`}
        >
          Top Plan (2D)
        </button>

        <button
          onClick={resetCamera}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {selectedElementId != null && (
          <>
            <div className="w-px h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={onToggleIsolate}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                isolatedElementId != null ? 'bg-amber-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Isolate Element in View (Revit Temporary Isolate)"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>{isolatedElementId != null ? 'Isolated' : 'Isolate'}</span>
            </button>
          </>
        )}
      </div>

      {/* Heat Map Configuration Floating Modal / Drawer */}
      {showConfigPopover && isHeatMapActive && (
        <div className="absolute top-14 left-3 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-xs text-slate-200 shadow-2xl z-20 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-blue-400" />
              <span>Heat Map Color &amp; Metrics</span>
            </span>
            <button
              onClick={() => setShowConfigPopover(false)}
              className="text-slate-400 hover:text-white cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Color Scale Palette Selection (D3-powered) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              D3 Color Interpolation Scale
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'safety', label: 'Safety (Standard)', preview: 'from-emerald-500 via-amber-500 to-red-500' },
                { id: 'turbo', label: 'Thermal Turbo', preview: 'from-blue-600 via-emerald-400 via-amber-400 to-red-600' },
                { id: 'viridis', label: 'Viridis', preview: 'from-purple-900 via-teal-600 to-yellow-400' }
              ].map(palette => (
                <button
                  key={palette.id}
                  onClick={() => setHeatMapScheme(palette.id as HeatMapScheme)}
                  className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    heatMapScheme === palette.id
                      ? 'border-blue-500 bg-blue-950/60 text-white font-medium'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className={`h-2 rounded mb-1 bg-gradient-to-r ${palette.preview}`} />
                  <span className="text-[10px] block truncate">{palette.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Severity Calculation Basis
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setHeatMapMetric('max_severity')}
                className={`px-2.5 py-1.5 rounded border text-center cursor-pointer transition-colors ${
                  heatMapMetric === 'max_severity'
                    ? 'border-blue-500 bg-blue-950/60 text-white font-medium'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-800/40 text-slate-300'
                }`}
              >
                Max Severity
              </button>
              <button
                onClick={() => setHeatMapMetric('risk_score')}
                className={`px-2.5 py-1.5 rounded border text-center cursor-pointer transition-colors ${
                  heatMapMetric === 'risk_score'
                    ? 'border-blue-500 bg-blue-950/60 text-white font-medium'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-800/40 text-slate-300'
                }`}
              >
                Aggregated Risk
              </button>
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Heat Color Intensity</span>
              <span className="font-mono text-slate-200">{Math.round(heatIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={heatIntensity}
              onChange={e => setHeatIntensity(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Pulse Critical Alert Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pulsing Beacon on Critical Items</span>
            </label>
            <input
              type="checkbox"
              checked={pulseCritical}
              onChange={e => setPulseCritical(e.target.checked)}
              className="accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Top Right Model Info Badges */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {isHeatMapActive && (
          <span className="text-[11px] font-mono bg-red-950/80 text-red-200 px-2.5 py-1 rounded border border-red-800/80 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Active Heat Map Overlay</span>
          </span>
        )}
        <span className="text-[11px] font-mono bg-slate-900/90 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
          LOD 350 BIM: FRA-ULD-MNT-2027-R03.rvt
        </span>
      </div>

      {/* Interactive Hover Tooltip for 3D elements */}
      {hoveredElementData && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-75"
          style={{
            left: `${Math.min(window.innerWidth > 800 ? 560 : 280, hoveredElementData.screenX + 16)}px`,
            top: `${Math.max(16, hoveredElementData.screenY - 24)}px`
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl max-w-xs text-xs text-slate-200 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-white truncate">{hoveredElementData.element.name}</span>
              <span className="font-mono text-[10px] text-slate-400">ID: {hoveredElementData.element.elementId}</span>
            </div>

            {hoveredElementData.heatData ? (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Compliance Severity:</span>
                  <span
                    className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: `${hoveredElementData.heatData.colorHex}25`,
                      color: hoveredElementData.heatData.colorHex,
                      border: `1px solid ${hoveredElementData.heatData.colorHex}50`
                    }}
                  >
                    {hoveredElementData.heatData.maxSeverity}
                  </span>
                </div>

                {hoveredElementData.heatData.primaryFinding ? (
                  <div className="text-[10px] text-slate-300 bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                    <span className="font-semibold text-blue-300">
                      {hoveredElementData.heatData.primaryFinding.regulatoryReference}:
                    </span>{' '}
                    <span className="line-clamp-2">
                      {hoveredElementData.heatData.primaryFinding.description}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>No regulatory deficiencies detected</span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-[9px] text-slate-400 pt-0.5 italic">
              Click to inspect element parameters &amp; actions
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Heat Map Legend & Severity Filter Bar */}
      {isHeatMapActive && (
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 shadow-xl max-w-md z-10 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Compliance Severity Heat Scale</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {heatMapScheme.toUpperCase()} • {heatMapMetric === 'max_severity' ? 'MAX' : 'RISK'}
            </span>
          </div>

          {/* D3 Continuous Gradient Bar */}
          <div className="space-y-1">
            <div
              className="h-2.5 rounded-full w-full border border-slate-700/80"
              style={{
                background:
                  heatMapScheme === 'turbo'
                    ? 'linear-gradient(to right, #2563eb, #06b6d4, #10b981, #f59e0b, #dc2626)'
                    : heatMapScheme === 'viridis'
                    ? 'linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)'
                    : 'linear-gradient(to right, #10b981, #0ea5e9, #eab308, #f97316, #ef4444)'
              }}
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span>0.0 Compliant</span>
              <span>0.5 Medium</span>
              <span>1.0 Critical</span>
            </div>
          </div>

          {/* Interactive Severity Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedSeverityFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                selectedSeverityFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              All ({allElements.length})
            </button>

            {legendItems.map(item => (
              <button
                key={item.label}
                onClick={() => setSelectedSeverityFilter(item.severity)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                  selectedSeverityFilter === item.severity
                    ? 'bg-white text-slate-900 border-white font-bold shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={item.description}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <span className="text-[9px] opacity-75 font-mono">({item.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Helper Overlay (Bottom Left) */}
      <div className="absolute bottom-3 left-3 text-[11px] text-slate-400 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-800 flex items-center gap-3">
        <span>Left-click: Orbit</span>
        <span>Right-click: Pan</span>
        <span>Scroll: Zoom</span>
        <span>Click element: Select &amp; Audit</span>
      </div>
    </div>
  );
};
