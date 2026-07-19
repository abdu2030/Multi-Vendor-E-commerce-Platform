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
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.65, 7.5);

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

    const ambient = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambient);

    const cyanLight = new THREE.PointLight(0x22d3ee, 4.5, 14);
    cyanLight.position.set(-4, 3.2, 4);
    scene.add(cyanLight);

    const roseLight = new THREE.PointLight(0xfb2f7a, 4.5, 14);
    roseLight.position.set(4, -1.4, 4.2);
    scene.add(roseLight);

    const amberLight = new THREE.PointLight(0xfacc15, 3, 12);
    amberLight.position.set(0.5, 4.5, 2.8);
    scene.add(amberLight);

    const colors = [0x22d3ee, 0xfb7185, 0xfacc15, 0x8b5cf6, 0xf97316, 0x38bdf8];
    const meshes: THREE.Mesh[] = [];

    for (let index = 0; index < 9; index += 1) {
      const radius = 2.1 + (index % 3) * 0.42;
      const angle = (index / 9) * Math.PI * 2;
      const geometry = new THREE.BoxGeometry(0.72, 0.48, 0.72, 3, 3, 3);
      const material = new THREE.MeshStandardMaterial({
        color: colors[index % colors.length],
        emissive: colors[index % colors.length],
        emissiveIntensity: 0.1,
        metalness: 0.45,
        roughness: 0.28,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.35) * 0.72, Math.sin(angle) * radius);
      mesh.rotation.set(angle * 0.8, angle * 0.4, angle * 0.2);
      group.add(mesh);
      meshes.push(mesh);
    }

    const ringGeometry = new THREE.TorusGeometry(2.75, 0.012, 12, 160);
    const ringMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.46 }),
      new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.4 }),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.38 }),
    ];
    const rings = ringMaterials.map((material, index) => {
      const ring = new THREE.Mesh(ringGeometry, material);
      ring.rotation.set(index * 0.75, index * 0.55, index * 0.9);
      group.add(ring);
      return ring;
    });

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 90;
    const positions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 7;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 4.5;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.72 })
    );
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
      group.rotation.y += reducedMotion ? 0 : 0.0045;
      group.rotation.x = Math.sin(frame * 0.6) * 0.08;
      particles.rotation.y -= reducedMotion ? 0 : 0.0015;

      for (const [index, mesh] of meshes.entries()) {
        mesh.rotation.x += reducedMotion ? 0 : 0.007 + index * 0.0007;
        mesh.rotation.y += reducedMotion ? 0 : 0.01;
        mesh.position.y += Math.sin(frame + index) * 0.0009;
      }

      for (const [index, ring] of rings.entries()) {
        ring.rotation.z += reducedMotion ? 0 : 0.0025 + index * 0.001;
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

      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }

      for (const ring of rings) {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      }

      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      ringGeometry.dispose();
      for (const material of ringMaterials) {
        material.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}