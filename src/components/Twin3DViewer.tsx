import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity, Expand, Eye, Gauge, Layers3, Leaf, Maximize2,
  Moon, Pause, Play, Rotate3D, Satellite, Sun, Wifi
} from 'lucide-react';
import { DigitalTwin } from '../types';

type CameraView = 'orbit' | 'top' | 'field';
type LayerKey = 'ndvi' | 'iot' | 'flow' | 'irrigation';

interface SceneHandle {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  cameraTarget: THREE.Vector3;
  lookTarget: THREE.Vector3;
  layers: Record<LayerKey, THREE.Group>;
  sun: THREE.DirectionalLight;
  scene: THREE.Scene;
}

const SENSOR_POSITIONS: [number, number][] = [[-9, -5.5], [8, -5], [-6, 5.5], [7, 5.8], [0, 6.2]];
const CAMERA_POSITIONS: Record<CameraView, THREE.Vector3> = {
  orbit: new THREE.Vector3(18, 13, 18),
  top: new THREE.Vector3(.01, 30, .01),
  field: new THREE.Vector3(17, 4.4, -3)
};

function makeLabel(text: string, color = '#5eead4', width = 3.3) {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 112;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(3, 15, 28, .9)';
  context.roundRect(5, 5, 630, 102, 22); context.fill();
  context.strokeStyle = color; context.lineWidth = 3;
  context.roundRect(5, 5, 630, 102, 22); context.stroke();
  context.fillStyle = '#f8fafc'; context.font = '700 34px Arial';
  context.textAlign = 'center'; context.fillText(text, 320, 69);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(width, .58, 1);
  return sprite;
}

function createLine(points: THREE.Vector3[], color: number, opacity = .5) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach(item => item.dispose());
    else material?.dispose();
  });
}

export function Twin3DViewer({ twin }: { twin: DigitalTwin }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneHandle = useRef<SceneHandle | null>(null);
  const liveRef = useRef(true);
  const timeRef = useRef(14);
  const [view, setView] = useState<CameraView>('orbit');
  const [isExpanded, setIsExpanded] = useState(false);
  const [live, setLive] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    ndvi: true, iot: true, flow: true, irrigation: true
  });

  const metrics = useMemo(() => {
    const refreshQuality = Math.max(72, 100 - twin.updateFrequencyMinutes * .35);
    const dataQuality = Math.min(99, 82 + Math.log10(Math.max(1, twin.dailyProcessedDataMB)) * 5);
    const annualComputeKWh = 45 + (twin.dailyProcessedDataMB / 1000) * .04 * 365;
    const estimatedCarbon = annualComputeKWh * .233 + 4;
    return {
      fidelity: Math.round(refreshQuality),
      confidence: Math.round(dataQuality),
      latency: Math.max(24, Math.round(twin.updateFrequencyMinutes * 1.8)),
      carbon: Number((twin.carbonComputeOverheadKgCO2e ?? estimatedCarbon).toFixed(1))
    };
  }, [twin]);

  useEffect(() => { liveRef.current = live; }, [live]);
  useEffect(() => { timeRef.current = timeOfDay; }, [timeOfDay]);
  useEffect(() => {
    const current = sceneHandle.current;
    if (!current) return;
    (Object.keys(layers) as LayerKey[]).forEach(key => { current.layers[key].visible = layers[key]; });
  }, [layers]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#071827');
    scene.fog = new THREE.FogExp2('#071827', .026);

    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / Math.max(1, mount.clientHeight), .1, 140);
    camera.position.copy(CAMERA_POSITIONS.orbit);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .055;
    controls.minDistance = 7; controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI * .48; controls.target.set(0, 1.4, 0);

    const ambient = new THREE.HemisphereLight(0xa7edff, 0x16230d, 1.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff3d4, 3.2);
    sun.position.set(10, 17, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
    scene.add(sun);
    const coreLight = new THREE.PointLight(0x22d3ee, 30, 23, 2);
    coreLight.position.set(0, 6, 0); scene.add(coreLight);

    const world = new THREE.Group();
    world.rotation.y = -.08;
    scene.add(world);

    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(29, .7, 20),
      new THREE.MeshStandardMaterial({ color: 0x4b2c1a, roughness: .98 })
    );
    soil.position.y = -.38; soil.receiveShadow = true; world.add(soil);

    // Surcos de cultivo y red de riego.
    const irrigationGroup = new THREE.Group();
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x164e63, roughness: .45, metalness: .25 });
    for (let z = -7; z <= 7; z += 2) {
      const ridge = new THREE.Mesh(
        new THREE.CapsuleGeometry(.24, 27, 4, 10),
        new THREE.MeshStandardMaterial({ color: 0x684026, roughness: .95 })
      );
      ridge.rotation.z = Math.PI / 2; ridge.position.set(0, .05, z); ridge.receiveShadow = true; world.add(ridge);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 27, 8), pipeMaterial);
      pipe.rotation.z = Math.PI / 2; pipe.position.set(0, .28, z + .35); irrigationGroup.add(pipe);
      for (let x = -11; x <= 11; x += 2.4) {
        const emitter = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        emitter.position.set(x, .3, z + .35); irrigationGroup.add(emitter);
      }
    }
    world.add(irrigationGroup);

    // Plantas instanciadas: más detalle visual con muy poco coste de render.
    const cropPoints: THREE.Vector3[] = [];
    for (let z = -7; z <= 7; z += 2) for (let x = -12; x <= 12; x += 1.25) cropPoints.push(new THREE.Vector3(x, 0, z));
    const stemGeometry = new THREE.CylinderGeometry(.045, .075, 1, 7);
    const leafGeometry = new THREE.ConeGeometry(.34, .95, 7);
    const stems = new THREE.InstancedMesh(stemGeometry, new THREE.MeshStandardMaterial({ color: 0x2f6b3b, roughness: .72 }), cropPoints.length);
    const leaves = new THREE.InstancedMesh(leafGeometry, new THREE.MeshStandardMaterial({ color: 0x6bd36f, roughness: .58, emissive: 0x12381b, emissiveIntensity: .2 }), cropPoints.length);
    stems.castShadow = true; leaves.castShadow = true;
    const dummy = new THREE.Object3D();
    cropPoints.forEach((point, index) => {
      const height = 1.05 + ((index * 17) % 9) * .055;
      dummy.position.set(point.x, .28 + height / 2, point.z);
      dummy.scale.set(1, height, 1); dummy.rotation.y = (index % 5) * .31; dummy.updateMatrix(); stems.setMatrixAt(index, dummy.matrix);
      dummy.position.set(point.x, .65 + height, point.z);
      dummy.scale.set(1, 1, 1); dummy.rotation.y = (index % 7) * .42; dummy.updateMatrix(); leaves.setMatrixAt(index, dummy.matrix);
    });
    stems.instanceMatrix.needsUpdate = true; leaves.instanceMatrix.needsUpdate = true;
    world.add(stems, leaves);

    // Capa NDVI / humedad por zonas.
    const ndviGroup = new THREE.Group();
    const zoneColors = [0x22c55e, 0x84cc16, 0xeab308, 0x10b981, 0x65a30d, 0x14b8a6];
    [[-9,-4],[-3,-4],[4,-4],[9,3],[-6,4],[1,4]].forEach(([x,z], index) => {
      const zone = new THREE.Mesh(
        new THREE.CircleGeometry(3.15, 48),
        new THREE.MeshBasicMaterial({ color: zoneColors[index], transparent: true, opacity: .2, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      zone.rotation.x = -Math.PI / 2; zone.position.set(x, .34, z); ndviGroup.add(zone);
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.95, 3.05, 48), new THREE.MeshBasicMaterial({ color: zoneColors[index], transparent: true, opacity: .58, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, .35, z); ndviGroup.add(ring);
    });
    world.add(ndviGroup);

    // Sensores IoT detallados.
    const iotGroup = new THREE.Group();
    const sensorRoots: THREE.Group[] = [];
    SENSOR_POSITIONS.forEach(([x, z], index) => {
      const sensor = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, .18, 12), new THREE.MeshStandardMaterial({ color: 0x27394a, metalness: .65, roughness: .35 }));
      base.position.y = .17; sensor.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 1.65, 10), new THREE.MeshStandardMaterial({ color: 0xa4b6c5, metalness: .8, roughness: .28 }));
      pole.position.y = 1.05; sensor.add(pole);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(.5, .34, .34), new THREE.MeshStandardMaterial({ color: 0x10263b, metalness: .65, roughness: .25 }));
      housing.position.y = 1.72; housing.castShadow = true; sensor.add(housing);
      const solar = new THREE.Mesh(new THREE.BoxGeometry(.78, .05, .46), new THREE.MeshStandardMaterial({ color: 0x123b64, metalness: .5, roughness: .2, emissive: 0x071e34 }));
      solar.position.set(0, 2.03, 0); solar.rotation.z = -.18; sensor.add(solar);
      const ledMaterial = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const led = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 12), ledMaterial);
      led.position.set(0, 1.73, .19); led.userData.phase = index; sensor.add(led);
      const label = makeLabel('SENSOR ' + String(index + 1).padStart(2, '0')); label.position.set(0, 2.65, 0); sensor.add(label);
      sensor.position.set(x, 0, z); sensor.userData.led = led;
      sensorRoots.push(sensor); iotGroup.add(sensor);
    });
    world.add(iotGroup);

    // Gateway Edge.
    const edge = new THREE.Group();
    const edgeBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1, 1.05), new THREE.MeshStandardMaterial({ color: 0x142b43, metalness: .72, roughness: .22 }));
    edgeBody.position.y = .58; edgeBody.castShadow = true; edge.add(edgeBody);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.82, .36), screenMaterial);
    screen.position.set(0, .66, .531); edge.add(screen);
    [-.38, .38].forEach(x => {
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.023, .023, 2.25, 8), new THREE.MeshStandardMaterial({ color: 0xaab7c4, metalness: .9 }));
      antenna.position.set(x, 1.68, 0); edge.add(antenna);
    });
    const edgeLabel = makeLabel('EDGE · INFERENCIA', '#38bdf8', 3.7); edgeLabel.position.set(0, 3.18, 0); edge.add(edgeLabel);
    edge.position.set(0, 0, -2.2); world.add(edge);

    // Núcleo holográfico del gemelo.
    const core = new THREE.Group(); core.position.set(0, 6.4, .3); world.add(core);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 1.5,
      transparent: true, opacity: .34, roughness: .08, metalness: .15, transmission: .2, wireframe: true
    });
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.16, 3), coreMaterial);
    core.add(coreMesh);
    const rings: THREE.Mesh[] = [];
    [1.5, 1.9, 2.28].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, .025, 8, 100),
        new THREE.MeshBasicMaterial({ color: index === 1 ? 0xa78bfa : 0x22d3ee, transparent: true, opacity: .82 })
      );
      ring.rotation.set(index * .62, index * .75, index * .25); rings.push(ring); core.add(ring);
    });
    const coreLabel = makeLabel('DIGITAL TWIN · ' + twin.operationalStatus.toUpperCase(), '#a5f3fc', 5.1);
    coreLabel.position.y = 3.05; core.add(coreLabel);

    // Flujos físicos y paquetes de telemetría animados.
    const flowGroup = new THREE.Group();
    const packets: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; offset: number }[] = [];
    SENSOR_POSITIONS.concat([[0, -2.2]]).forEach(([x, z], index) => {
      const start = new THREE.Vector3(x, index === SENSOR_POSITIONS.length ? 2 : 1.85, z);
      const end = new THREE.Vector3(0, 5.55, .3);
      const middle = start.clone().lerp(end, .52); middle.y += 1.3 + index * .08;
      const curve = new THREE.CatmullRomCurve3([start, middle, end]);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 40, .018, 6, false),
        new THREE.MeshBasicMaterial({ color: index === SENSOR_POSITIONS.length ? 0xa78bfa : 0x22d3ee, transparent: true, opacity: .32 })
      );
      flowGroup.add(tube);
      for (let packetIndex = 0; packetIndex < 3; packetIndex++) {
        const packet = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 10), new THREE.MeshBasicMaterial({ color: index === SENSOR_POSITIONS.length ? 0xc4b5fd : 0x67e8f9 }));
        packets.push({ mesh: packet, curve, offset: packetIndex / 3 + index * .13 }); flowGroup.add(packet);
      }
    });
    world.add(flowGroup);

    // Indicadores de cobertura inalámbrica.
    const coverage = new THREE.Group();
    [1.5, 2.35, 3.2].forEach(radius => {
      const arc = new THREE.Mesh(new THREE.RingGeometry(radius - .025, radius + .025, 64, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: .38, side: THREE.DoubleSide }));
      arc.rotation.set(0, 0, 0); arc.position.set(0, .65, -2.2); coverage.add(arc);
    });
    iotGroup.add(coverage);

    const layerGroups: Record<LayerKey, THREE.Group> = { ndvi: ndviGroup, iot: iotGroup, flow: flowGroup, irrigation: irrigationGroup };
    (Object.keys(layerGroups) as LayerKey[]).forEach(key => { layerGroups[key].visible = layers[key]; });
    sceneHandle.current = {
      camera, controls, cameraTarget: CAMERA_POSITIONS.orbit.clone(),
      lookTarget: new THREE.Vector3(0, 1.4, 0), layers: layerGroups, sun, scene
    };

    const resize = () => {
      const width = mount.clientWidth, height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount);
    let previousFrame = performance.now(); let animationFrame = 0; let simulationTime = 0;
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - previousFrame) / 1000, .05);
      previousFrame = now;
      if (liveRef.current) simulationTime += delta;

      const hourAngle = ((timeRef.current - 6) / 12) * Math.PI;
      sun.position.set(Math.cos(hourAngle) * 17, Math.max(1.5, Math.sin(hourAngle) * 18), 8);
      sun.intensity = Math.max(.45, Math.sin(hourAngle) * 3.3);
      const daylight = THREE.MathUtils.clamp(Math.sin(hourAngle), 0, 1);
      scene.background = new THREE.Color('#030712').lerp(new THREE.Color('#0b3044'), daylight);
      scene.fog!.color.copy(scene.background as THREE.Color);
      ambient.intensity = .5 + daylight * 1.3;

      if (liveRef.current) {
        core.rotation.y += delta * .32; coreMesh.rotation.x += delta * .18;
        rings.forEach((ring, index) => { ring.rotation.y += delta * (.16 + index * .07); ring.rotation.x += delta * .04; });
        const pulse = 1 + Math.sin(simulationTime * 2.4) * .055; coreMesh.scale.setScalar(pulse);
        packets.forEach(packet => {
          const progress = (simulationTime * .18 + packet.offset) % 1;
          packet.mesh.position.copy(packet.curve.getPoint(progress));
          packet.mesh.scale.setScalar(.75 + Math.sin(progress * Math.PI) * .55);
        });
        sensorRoots.forEach((sensor, index) => {
          const led = sensor.userData.led as THREE.Mesh;
          led.scale.setScalar(.75 + (Math.sin(simulationTime * 4 + index) + 1) * .32);
        });
        screenMaterial.color.setHSL(.53, .85, .48 + Math.sin(simulationTime * 3) * .1);
      }

      camera.position.lerp(sceneHandle.current?.cameraTarget || camera.position, .055);
      controls.target.lerp(sceneHandle.current?.lookTarget || controls.target, .07);
      controls.update(); renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); controls.dispose();
      disposeScene(scene); renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      sceneHandle.current = null;
    };
  // La escena se reconstruye únicamente al cambiar de gemelo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twin.id]);

  useEffect(() => {
    const handle = sceneHandle.current;
    if (!handle) return;
    handle.cameraTarget.copy(CAMERA_POSITIONS[view]);
    handle.lookTarget.set(0, view === 'top' ? 0 : view === 'field' ? 1.4 : 2.1, 0);
  }, [view]);

  const toggleLayer = (layer: LayerKey) => setLayers(current => ({ ...current, [layer]: !current[layer] }));
  const statusDotClass = twin.operationalStatus === 'Activo' || twin.operationalStatus === 'En Ejecución'
    ? 'bg-emerald-400'
    : twin.operationalStatus === 'Calibración' ? 'bg-amber-400' : 'bg-slate-400';

  return (
    <section className={'relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950 shadow-[0_28px_70px_-32px_rgba(8,145,178,.9)] ' + (isExpanded ? 'fixed inset-4 z-50' : '')}>
      <div ref={mountRef} className={isExpanded ? 'h-full min-h-[560px] w-full cursor-grab active:cursor-grabbing' : 'h-[520px] w-full cursor-grab active:cursor-grabbing'} aria-label="Gemelo digital agrícola 3D interactivo" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,.62),transparent_30%,transparent_70%,rgba(2,6,23,.5))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/60 to-transparent" />

      <div className="absolute left-4 top-4 max-w-[300px] rounded-2xl border border-white/10 bg-slate-950/78 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {live && <span className={'absolute inline-flex h-full w-full animate-ping rounded-full ' + statusDotClass} />}
            <span className={'relative inline-flex h-2.5 w-2.5 rounded-full ' + statusDotClass} />
          </span>
          <span className="text-[10px] font-black tracking-[.16em] text-emerald-300">{live ? 'SINCRONIZACIÓN EN VIVO' : 'SIMULACIÓN EN PAUSA'}</span>
        </div>
        <p className="mt-2 text-sm font-black leading-snug text-white">{twin.name}</p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-300">{twin.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-cyan-400/10 px-2 py-1 text-[9px] font-semibold text-cyan-200">{twin.aiModelType}</span>
          <span className="rounded-md bg-violet-400/10 px-2 py-1 text-[9px] font-semibold text-violet-200">{twin.operationalStatus}</span>
        </div>
      </div>

      <div className="absolute right-4 top-4 flex gap-2">
        <IconButton label={live ? 'Pausar simulación' : 'Reanudar simulación'} active={live} onClick={() => setLive(value => !value)} icon={live ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} />
        <IconButton label={isExpanded ? 'Salir de pantalla completa' : 'Ampliar visor'} onClick={() => setIsExpanded(value => !value)} icon={isExpanded ? <Expand className="h-4 w-4 rotate-45" /> : <Maximize2 className="h-4 w-4" />} />
      </div>

      <div className="absolute right-4 top-16 hidden w-44 rounded-xl border border-white/10 bg-slate-950/72 p-3 text-[10px] text-slate-200 backdrop-blur-lg md:block">
        <div className="mb-2 flex items-center gap-1.5 font-bold text-white"><Layers3 className="h-3.5 w-3.5 text-cyan-300" />Capas operativas</div>
        <LayerToggle active={layers.ndvi} label="Índice NDVI" color="bg-lime-400" onClick={() => toggleLayer('ndvi')} />
        <LayerToggle active={layers.iot} label="Sensores IoT" color="bg-emerald-400" onClick={() => toggleLayer('iot')} />
        <LayerToggle active={layers.flow} label="Flujo de datos" color="bg-cyan-400" onClick={() => toggleLayer('flow')} />
        <LayerToggle active={layers.irrigation} label="Red de riego" color="bg-sky-400" onClick={() => toggleLayer('irrigation')} />
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ViewButton active={view === 'orbit'} onClick={() => setView('orbit')} icon={<Rotate3D className="h-3.5 w-3.5" />} label="Órbita" />
            <ViewButton active={view === 'top'} onClick={() => setView('top')} icon={<Satellite className="h-3.5 w-3.5" />} label="Satelital" />
            <ViewButton active={view === 'field'} onClick={() => setView('field')} icon={<Eye className="h-3.5 w-3.5" />} label="A ras de campo" />
          </div>
          <div className="hidden grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl lg:grid">
            <Metric label="Fidelidad" value={metrics.fidelity + '%'} icon={<Gauge className="h-3 w-3" />} />
            <Metric label="Confianza" value={metrics.confidence + '%'} icon={<Activity className="h-3 w-3" />} />
            <Metric label="Latencia" value={metrics.latency + ' ms'} icon={<Wifi className="h-3 w-3" />} />
            <Metric label="Carbono" value={metrics.carbon + ' kg'} icon={<Leaf className="h-3 w-3" />} />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/72 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-xl">
          <Moon className="h-3.5 w-3.5 text-indigo-300" />
          <input aria-label="Hora de simulación" type="range" min="0" max="23" step="1" value={timeOfDay} onChange={event => setTimeOfDay(Number(event.target.value))} className="h-1 flex-1 accent-cyan-400" />
          <Sun className="h-3.5 w-3.5 text-amber-300" />
          <span className="w-12 text-right font-mono font-bold text-white">{String(timeOfDay).padStart(2, '0')}:00</span>
          <span className="hidden border-l border-white/10 pl-3 text-slate-400 sm:inline">Arrastra para orbitar · rueda para zoom</span>
        </div>
      </div>
    </section>
  );
}

function IconButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button aria-label={label} title={label} onClick={onClick} className={'rounded-xl border p-2.5 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 ' + (active ? 'border-cyan-300/35 bg-cyan-400/20 text-cyan-200' : 'border-white/10 bg-slate-950/75 text-slate-200 hover:bg-slate-800')}>{icon}</button>;
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold shadow-lg backdrop-blur-xl transition ' + (active ? 'border-cyan-300/50 bg-cyan-400 text-slate-950' : 'border-white/10 bg-slate-950/75 text-slate-200 hover:bg-slate-800')}>{icon}{label}</button>;
}

function LayerToggle({ active, label, color, onClick }: { active: boolean; label: string; color: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/5"><span className="flex items-center gap-2"><span className={'h-1.5 w-1.5 rounded-full ' + color} />{label}</span><span className={'h-4 w-7 rounded-full p-0.5 transition ' + (active ? 'bg-cyan-500' : 'bg-slate-700')}><span className={'block h-3 w-3 rounded-full bg-white transition ' + (active ? 'translate-x-3' : '')} /></span></button>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="bg-slate-950/80 px-3 py-2.5"><span className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-400">{icon}{label}</span><strong className="mt-1 block whitespace-nowrap text-xs text-white">{value}</strong></div>;
}
