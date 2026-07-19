"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CommerceOrbitScene({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.75, 8.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));

    const cyanLight = new THREE.PointLight(0x22d3ee, 4.2, 14);
    cyanLight.position.set(-4.6, 3.2, 4.4);
    scene.add(cyanLight);

    const roseLight = new THREE.PointLight(0xfb2f7a, 4.4, 14);
    roseLight.position.set(4.5, -1.2, 4.8);
    scene.add(roseLight);

    const amberLight = new THREE.PointLight(0xfacc15, 3.2, 12);
    amberLight.position.set(0.4, 4.4, 3.2);
    scene.add(amberLight);

    const objects: THREE.Object3D[] = [];
    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    const track = (object: THREE.Object3D) => {
      objects.push(object);
      group.add(object);
      return object;
    };

    const material = (color: number, emissiveIntensity = 0.08) => {
      const created = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        metalness: 0.28,
        roughness: 0.34,
      });
      disposableMaterials.push(created);
      return created;
    };

    const geometry = <T extends THREE.BufferGeometry>(created: T) => {
      disposableGeometries.push(created);
      return created;
    };

    const checkoutDisplay = createCheckoutDisplay(geometry, material);
    checkoutDisplay.position.set(0, -0.24, 0);
    checkoutDisplay.scale.setScalar(1.18);
    track(checkoutDisplay);

    const commerceItems = [
      createParcel(geometry, material, 0x22d3ee),
      createShoppingBag(geometry, material, 0xfb7185),
      createPriceTag(geometry, material, 0xfacc15),
      createCart(geometry, material, 0x8b5cf6),
      createProductCard(geometry, material, 0xf97316),
      createParcel(geometry, material, 0x38bdf8),
      createShoppingBag(geometry, material, 0xf0abfc),
    ];

    for (const [index, item] of commerceItems.entries()) {
      const radius = 2.45 + (index % 3) * 0.34;
      const angle = (index / commerceItems.length) * Math.PI * 2;
      item.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.24) * 0.68, Math.sin(angle) * radius);
      item.rotation.set(angle * 0.4, angle * 0.7, angle * 0.18);
      item.scale.setScalar(0.82);
      track(item);
    }

    const ringGeometry = geometry(new THREE.TorusGeometry(3.05, 0.012, 12, 160));
    const ringMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.42 }),
      new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.36 }),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.32 }),
    ];
    disposableMaterials.push(...ringMaterials);
    const rings = ringMaterials.map((ringMaterial, index) => {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.set(index * 0.72, index * 0.52, index * 0.82);
      track(ring);
      return ring;
    });

    const particleGeometry = geometry(new THREE.BufferGeometry());
    const particleCount = 72;
    const positions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 6.6;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 3.8;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.022, transparent: true, opacity: 0.64 });
    disposableMaterials.push(particleMaterial);
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const animate = () => {
      frame += 0.01;
      group.rotation.y += reducedMotion ? 0 : 0.0038;
      group.rotation.x = Math.sin(frame * 0.55) * 0.065;
      particles.rotation.y -= reducedMotion ? 0 : 0.0012;

      for (const [index, object] of objects.entries()) {
        object.rotation.y += reducedMotion ? 0 : 0.006 + index * 0.0004;
        object.position.y += Math.sin(frame + index) * 0.00075;
      }

      for (const [index, ring] of rings.entries()) {
        ring.rotation.z += reducedMotion ? 0 : 0.002 + index * 0.0008;
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);

      for (const disposable of disposableGeometries) {
        disposable.dispose();
      }

      for (const disposable of disposableMaterials) {
        disposable.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}

type GeometryFactory = <T extends THREE.BufferGeometry>(created: T) => T;
type MaterialFactory = (color: number, emissiveIntensity?: number) => THREE.MeshStandardMaterial;

function createParcel(geometry: GeometryFactory, material: MaterialFactory, color: number) {
  const group = new THREE.Group();
  const box = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.82, 0.58, 0.72, 2, 2, 2)), material(color));
  const bandA = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.86, 0.04, 0.76)), material(0xffffff, 0.02));
  const bandB = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.05, 0.62, 0.76)), material(0xffffff, 0.02));
  bandA.position.y = 0.06;
  bandB.position.x = -0.16;
  group.add(box, bandA, bandB);
  return group;
}

function createShoppingBag(geometry: GeometryFactory, material: MaterialFactory, color: number) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.72, 0.86, 0.34, 2, 2, 1)), material(color));
  const handle = new THREE.Mesh(geometry(new THREE.TorusGeometry(0.22, 0.018, 8, 32, Math.PI)), material(0xffffff, 0.02));
  handle.position.y = 0.48;
  handle.rotation.z = Math.PI;
  group.add(body, handle);
  return group;
}

function createPriceTag(geometry: GeometryFactory, material: MaterialFactory, color: number) {
  const group = new THREE.Group();
  const tag = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.82, 0.52, 0.08, 2, 2, 1)), material(color));
  const hole = new THREE.Mesh(geometry(new THREE.TorusGeometry(0.06, 0.01, 8, 18)), material(0xffffff, 0.02));
  const slash = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.46, 0.04, 0.1)), material(0xffffff, 0.02));
  hole.position.set(-0.27, 0.13, 0.06);
  slash.position.set(0.08, -0.02, 0.06);
  slash.rotation.z = -0.55;
  group.add(tag, hole, slash);
  group.rotation.z = -0.18;
  return group;
}

function createCart(geometry: GeometryFactory, material: MaterialFactory, color: number) {
  const group = new THREE.Group();
  const basket = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.82, 0.36, 0.46)), material(color));
  const handle = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.42, 0.04, 0.04)), material(0xffffff, 0.02));
  const wheelA = new THREE.Mesh(geometry(new THREE.TorusGeometry(0.08, 0.018, 8, 20)), material(0xffffff, 0.02));
  const wheelB = wheelA.clone();
  basket.rotation.z = -0.12;
  handle.position.set(-0.48, 0.28, 0);
  handle.rotation.z = -0.48;
  wheelA.position.set(-0.22, -0.29, 0.18);
  wheelB.position.set(0.26, -0.29, 0.18);
  group.add(basket, handle, wheelA, wheelB);
  return group;
}

function createProductCard(geometry: GeometryFactory, material: MaterialFactory, color: number) {
  const group = new THREE.Group();
  const card = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.68, 0.86, 0.06)), material(0xffffff, 0.01));
  const image = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.5, 0.34, 0.08)), material(color));
  const lineA = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.46, 0.035, 0.08)), material(0x22d3ee, 0.06));
  const lineB = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.3, 0.035, 0.08)), material(0xfacc15, 0.06));
  image.position.y = 0.18;
  lineA.position.y = -0.18;
  lineB.position.y = -0.3;
  group.add(card, image, lineA, lineB);
  return group;
}

function createCheckoutDisplay(geometry: GeometryFactory, material: MaterialFactory) {
  const group = new THREE.Group();

  const belt = new THREE.Mesh(geometry(new THREE.BoxGeometry(2.08, 0.2, 0.92, 2, 1, 2)), material(0x0f172a, 0.02));
  const glow = new THREE.Mesh(geometry(new THREE.BoxGeometry(1.84, 0.035, 0.78)), material(0x22d3ee, 0.16));
  const scanner = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.1, 0.92, 0.1)), material(0xf0abfc, 0.18));
  const scannerBeam = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.04, 0.68, 0.76)), material(0x22d3ee, 0.24));
  const cart = createCart(geometry, material, 0x8b5cf6);
  const bag = createShoppingBag(geometry, material, 0xfb7185);
  const parcel = createParcel(geometry, material, 0xfacc15);
  const tag = createPriceTag(geometry, material, 0x38bdf8);
  const card = createProductCard(geometry, material, 0xf97316);
  const rollerA = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.055, 0.055, 1.86, 16)), material(0xffffff, 0.02));
  const rollerB = rollerA.clone();

  glow.position.y = 0.13;
  scanner.position.set(-0.78, 0.55, -0.34);
  scannerBeam.position.set(-0.78, 0.47, 0.08);
  scannerBeam.rotation.z = -0.06;
  cart.position.set(0.3, 0.52, 0.05);
  cart.scale.setScalar(1.2);
  bag.position.set(-0.24, 0.62, -0.24);
  bag.scale.setScalar(0.72);
  parcel.position.set(0.78, 0.52, -0.2);
  parcel.scale.setScalar(0.64);
  tag.position.set(-0.68, 0.5, 0.32);
  tag.scale.setScalar(0.62);
  card.position.set(0.98, 0.6, 0.28);
  card.rotation.y = -0.28;
  card.scale.setScalar(0.62);
  rollerA.position.set(-0.42, 0.18, 0.47);
  rollerB.position.set(0.48, 0.18, 0.47);
  rollerA.rotation.z = Math.PI / 2;
  rollerB.rotation.z = Math.PI / 2;

  group.add(belt, glow, scanner, scannerBeam, cart, bag, parcel, tag, card, rollerA, rollerB);
  return group;
}
