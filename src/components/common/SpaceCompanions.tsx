import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function SpaceCompanions() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.2, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x667099, 2.8));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(-3, 5, 6);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x68caff, 3);
    rim.position.set(4, 1, -3);
    scene.add(rim);
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f4ed, roughness: 0.32 });
    const red = new THREE.MeshStandardMaterial({ color: 0xe74d59, roughness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x273545, roughness: 0.4 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffb93d, metalness: 0.65, roughness: 0.22 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x168ace, metalness: 0.35, roughness: 0.18 });
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffcb57 });
    const visor = new THREE.MeshPhysicalMaterial({ color: 0x080d58, metalness: 0.5, roughness: 0.16, clearcoat: 1 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0xa5f8ff, emissive: 0x35cfff, emissiveIntensity: 2 });
    const capeMaterial = new THREE.MeshStandardMaterial({ color: 0xb73523, side: THREE.DoubleSide, roughness: 0.55 });
    const geometries: THREE.BufferGeometry[] = [];
    function part(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z = 0) {
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function oval(parent: THREE.Group, material: THREE.Material, position: number[], size: number[]) {
      const mesh = part(parent, new THREE.SphereGeometry(1, 28, 20), material, position[0], position[1], position[2]);
      mesh.scale.set(size[0], size[1], size[2]);
      return mesh;
    }
    const rocket = new THREE.Group();
    const rider = new THREE.Group();
    scene.add(rider);
    rider.add(rocket);
    rocket.rotation.z = -Math.PI / 2;
    rocket.position.y = -0.35;
    part(rocket, new THREE.CylinderGeometry(0.36, 0.4, 1.2, 32), white, 0, 0.1);
    part(rocket, new THREE.ConeGeometry(0.36, 0.65, 32), red, 0, 1.025);
    part(rocket, new THREE.CylinderGeometry(0.29, 0.25, 0.22, 32), dark, 0, -0.61);
    const windowRim = part(rocket, new THREE.TorusGeometry(0.19, 0.046, 12, 32), gold, 0, 0.28, 0.36);
    windowRim.rotation.x = -0.06;
    oval(rocket, blue, [0, 0.28, 0.365], [0.17, 0.17, 0.065]);
    for (const side of [-1, 1]) {
      const fin = part(rocket, new THREE.ConeGeometry(0.22, 0.75, 3), red, side * 0.39, -0.36);
      fin.rotation.z = side * -0.35;
    }
    const flame = part(rocket, new THREE.ConeGeometry(0.19, 0.7, 24), flameMaterial, 0, -1.04);
    flame.rotation.z = Math.PI;
    const astronaut = new THREE.Group();
    rider.add(astronaut);
    astronaut.scale.setScalar(0.82);
    astronaut.position.set(-0.12, 0.27, 0.16);
    oval(astronaut, dark, [0, 0, -0.22], [0.39, 0.48, 0.2]);
    oval(astronaut, white, [0, 0, 0], [0.37, 0.48, 0.27]);
    oval(astronaut, blue, [0, 0.37, 0], [0.43, 0.18, 0.32]);
    oval(astronaut, gold, [0, 0.82, -0.04], [0.56, 0.56, 0.46]);
    part(astronaut, new RoundedBoxGeometry(1.04, 0.94, 0.55, 4, 0.24), white, 0, 0.78, 0.16);
    part(astronaut, new RoundedBoxGeometry(0.87, 0.77, 0.27, 4, 0.18), blue, 0, 0.78, 0.4);
    part(astronaut, new RoundedBoxGeometry(0.77, 0.67, 0.2, 4, 0.15), visor, 0, 0.8, 0.47);
    for (const side of [-1, 1]) {
      part(astronaut, new RoundedBoxGeometry(0.13, 0.27, 0.045, 3, 0.045), cyan, side * 0.18, 0.82, 0.577);
      oval(astronaut, white, [side * 0.51, 0.61, 0], [0.12, 0.2, 0.25]);
    }
    oval(astronaut, dark, [0, -0.09, 0], [0.38, 0.095, 0.28]);
    part(astronaut, new RoundedBoxGeometry(0.36, 0.32, 0.12, 3, 0.035), blue, 0, 0.05, 0.28);
    oval(astronaut, cyan, [0, 0.05, 0.36], [0.075, 0.1, 0.02]);
    const capeGeometry = new THREE.PlaneGeometry(1, 1.15, 16, 20);
    const cape = part(astronaut, capeGeometry, capeMaterial, 0, -0.27, -0.32);
    const capePositions = capeGeometry.attributes.position;
    const capeRest = Float32Array.from(capePositions.array);
    const legs = [-1, 1].map((side) => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.21, -0.3, 0);
      astronaut.add(leg);
      oval(leg, white, [0, -0.27, 0], [0.18, 0.32, 0.19]);
      oval(leg, blue, [0, -0.49, 0.06], [0.19, 0.23, 0.23]);
      return leg;
    });
    const trailingArm = new THREE.Group();
    trailingArm.position.set(-0.3, 0.2, 0);
    astronaut.add(trailingArm);
    oval(trailingArm, white, [-0.15, -0.2, 0], [0.15, 0.35, 0.17]).rotation.z = -0.48;
    oval(trailingArm, gold, [-0.3, -0.44, 0], [0.18, 0.23, 0.17]);
    oval(trailingArm, gold, [-0.16, -0.47, 0.05], [0.08, 0.13, 0.09]);
    const arm = new THREE.Group();
    arm.position.set(0.35, 0.22, 0);
    astronaut.add(arm);
    oval(arm, gold, [0.15, 0.2, 0], [0.14, 0.3, 0.16]).rotation.z = -0.5;
    oval(arm, gold, [0.28, 0.46, 0], [0.18, 0.19, 0.17]);
    oval(arm, gold, [0.15, 0.46, 0.1], [0.09, 0.12, 0.1]);

    const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xff8a22 });
    const sparks = Array.from({ length: 28 }, (_, index) =>
      part(rider, new THREE.SphereGeometry(0.035, 6, 4), index % 3 ? flameMaterial : sparkMaterial, -1.4, -0.35),
    );

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mouseScreen = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    let following = false;
    let canvasWidth = 384;
    let canvasHeight = 192;
    let targetX = 0;
    let targetY = 0;
    let followerX = 0;
    let followerY = 0;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let time = 0;
    let pointerX = 0;
    let pointerY = 0;
    // Every pose derives from the same timeline; pause time while offscreen.
    function renderAt(t: number) {
      const phase = t * Math.PI / 4;
      const flight = Math.sin(phase);
      const bank = Math.cos(phase);
      // Closed flight paths and limb follow-through share an eight-second cycle.
      rider.position.set(flight * 0.55, Math.sin(phase - 0.25) * 0.3, bank * 0.2);
      rider.rotation.set(pointerY + flight * 0.06, -0.12 + bank * 0.12 + pointerX, 0.16 + bank * 0.1);
      astronaut.rotation.set(0, -0.12, -0.12 + flight * 0.025);
      arm.rotation.z = -0.15 + Math.sin(phase * 3) * 0.24;
      trailingArm.rotation.z = -0.15 + Math.sin(phase - 0.6) * 0.3;
      for (let i = 0; i < capePositions.count; i++) {
        const x = capeRest[i * 3];
        const y = capeRest[i * 3 + 1];
        const fall = (0.575 - y) / 1.15;
        capePositions.setXYZ(i, x * (0.65 + fall * 0.85), y, -fall * 0.35 + Math.sin(phase * 3 - fall * 5 + x * 8) * fall * 0.12);
      }
      capePositions.needsUpdate = true;
      capeGeometry.computeVertexNormals();
      cape.rotation.z = Math.sin(phase - 0.8) * 0.1;
      legs.forEach((leg, index) => {
        leg.rotation.x = (index ? 0.85 : -0.85) + Math.sin(phase * 2) * 0.04;
        leg.rotation.z = (index ? 1 : -1) * 0.55;
      });
      flame.scale.y = 0.95 + bank * 0.2 + Math.sin(phase * 12) * 0.12;
      sparks.forEach((spark, index) => {
        const life = (t * 1.25 + index / sparks.length) % 1;
        const spread = Math.sin(index * 2.4);
        spark.position.set(-1.35 - life * 1.65, -0.35 + spread * life * 0.32, Math.cos(index * 1.7) * life * 0.22);
        spark.scale.setScalar((1 - life) * (index % 3 === 0 ? 1.5 : 0.8));
      });
      renderer.render(scene, camera);
    }
    function tick(timestamp: number) {
      const delta = previous ? Math.min((timestamp - previous) / 1000, 0.05) : 0;
      time += delta;
      previous = timestamp;
      if (following) {
        const ease = 1 - Math.exp(-7 * delta);
        followerX += (targetX - followerX) * ease;
        followerY += (targetY - followerY) * ease;
        renderer.domElement.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
        pointerX = Math.max(-0.4, Math.min(0.4, (targetX - followerX) / 250));
        pointerY = Math.max(-0.15, Math.min(0.15, (targetY - followerY) / 300));
      }
      renderAt(time);
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      previous = 0;
      if ((visible || following) && !document.hidden && !reduce.matches) frame = requestAnimationFrame(tick);
      else renderAt(time);
    }
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      canvasWidth = width;
      canvasHeight = height;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 1.5 ? 11 : 9;
      camera.updateProjectionMatrix();
      renderAt(time);
    });
    resize.observe(host);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(host);
    const move = (event: PointerEvent) => {
      if (reduce.matches || !mouseScreen.matches || event.pointerType === 'touch') return;
      targetX = Math.max(0, Math.min(window.innerWidth - canvasWidth, event.clientX - canvasWidth / 2 - 36));
      targetY = Math.max(0, Math.min(window.innerHeight - canvasHeight, event.clientY - canvasHeight / 2 + 38));
      if (!following) {
        const rect = host.getBoundingClientRect();
        followerX = Math.max(0, Math.min(window.innerWidth - canvasWidth, rect.left));
        followerY = Math.max(0, Math.min(window.innerHeight - canvasHeight, rect.top));
        following = true;
        // A body-level, non-interactive canvas can follow across landing sections.
        document.body.appendChild(renderer.domElement);
        Object.assign(renderer.domElement.style, { position: 'fixed', left: '0', top: '0', zIndex: '40', pointerEvents: 'none', transform: `translate3d(${followerX}px, ${followerY}px, 0)` });
        sync();
      }
    };
    const reset = () => {
      following = false;
      pointerX = 0;
      pointerY = 0;
      host.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, { position: '', left: '', top: '', zIndex: '', pointerEvents: '', transform: '' });
      sync();
    };
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('resize', reset);
    mouseScreen.addEventListener('change', reset);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', reset);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('resize', reset);
      mouseScreen.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener('change', reset);
      geometries.forEach((geometry) => geometry.dispose());
      [white, red, dark, gold, blue, flameMaterial, visor, cyan, capeMaterial, sparkMaterial].forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="space-companions" aria-hidden="true" />;
}
