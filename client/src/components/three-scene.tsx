import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  className?: string;
}

export function ThreeScene({ className = '' }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup with fog for depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 100);
    sceneRef.current = scene;

    // Camera setup with dynamic positioning
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer setup with modern settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point lights for dynamic lighting
    const pointLight1 = new THREE.PointLight(0x3b82f6, 1, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 1, 50);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Educational objects: books, pens, pencils, rulers, etc.
    const geometries = [
      // Book
      new THREE.BoxGeometry(1.5, 0.2, 2),
      // Thicker book
      new THREE.BoxGeometry(1.3, 0.4, 1.8),
      // Pen
      new THREE.CylinderGeometry(0.08, 0.08, 1.8, 16),
      // Pencil (tapered cylinder)
      new THREE.CylinderGeometry(0.1, 0.02, 1.6, 16),
      // Ruler
      new THREE.BoxGeometry(3, 0.1, 0.4),
      // Notebook
      new THREE.BoxGeometry(1.5, 0.15, 2.2),
      // Eraser
      new THREE.BoxGeometry(0.6, 0.3, 0.4),
      // Globe (sphere)
      new THREE.SphereGeometry(0.8, 32, 32),
      // Calculator
      new THREE.BoxGeometry(1, 0.2, 1.5),
      // Paint brush
      new THREE.CylinderGeometry(0.1, 0.05, 1.5, 16),
      // Coffee mug
      new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16, 1, false),
      // Paint palette
      new THREE.CircleGeometry(0.8, 8),
    ];

    // Educational objects materials with glass-like effect
    const materials = [
      // Book cover - blue glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.5, // Glass-like transparency
        clearcoat: 1.0,    // Glossy coating
        clearcoatRoughness: 0.1
      }),
      // Textbook - green glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x10b981,
        transparent: true,
        opacity: 0.65,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.4,
        clearcoat: 0.8
      }),
      // Pen - yellow/gold glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.8,
        roughness: 0.05,
        metalness: 0.8,
        transmission: 0.3,
        clearcoat: 1.0
      }),
      // Pencil - red glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0xef4444,
        transparent: true,
        opacity: 0.7,
        roughness: 0.3,
        metalness: 0.0,
        transmission: 0.2,
        clearcoat: 0.6
      }),
      // Ruler - purple glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.6,
        roughness: 0.05,
        metalness: 0.2,
        transmission: 0.6,
        clearcoat: 1.0
      }),
      // Notebook - cyan glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.5,
        clearcoat: 0.7
      }),
      // Eraser - pink glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0xec4899,
        transparent: true,
        opacity: 0.7,
        roughness: 0.4,
        metalness: 0.0,
        transmission: 0.3,
        clearcoat: 0.5
      }),
      // Globe - blue/green glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x14b8a6,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.3,
        transmission: 0.7,
        clearcoat: 1.0
      }),
      // Calculator - dark glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x4b5563,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        metalness: 0.5,
        transmission: 0.4,
        clearcoat: 0.9
      }),
      // Paint brush - brown glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x92400e,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.3,
        clearcoat: 0.6
      }),
      // Coffee mug - amber glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0xd97706,
        transparent: true,
        opacity: 0.7,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.6,
        clearcoat: 1.0
      }),
      // Paint palette - multi-color glass
      new THREE.MeshPhysicalMaterial({ 
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.5,
        clearcoat: 0.8
      }),
    ];

    const meshes: THREE.Mesh[] = [];
    const particles: THREE.Points[] = [];

    // Create educational-themed 3D objects with more careful positioning
    for (let i = 0; i < materials.length; i++) {
      const geometry = geometries[i % geometries.length];
      const material = materials[i];
      const mesh = new THREE.Mesh(geometry, material);

      // More intentional positioning for educational objects
      const radius = 12 + (i % 3) * 3; // Distribute in concentric circles
      const angle = (i / materials.length) * Math.PI * 2; // Distribute around the circle
      const height = (Math.random() - 0.5) * 10; // Vary heights
      
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = height;
      mesh.position.z = Math.sin(angle) * radius - 5;

      // Random rotation
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      // Enable shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      meshes.push(mesh);
    }

    // Create particle system
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 100;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      // Random colors
      const colors = [
        [0.23, 0.51, 0.96], // Blue
        [0.55, 0.36, 0.96], // Purple
        [0.06, 0.71, 0.51], // Green
        [0.96, 0.62, 0.07], // Orange
      ];
      const colorIndex = Math.floor(Math.random() * colors.length);
      particleColors[i * 3] = colors[colorIndex][0];
      particleColors[i * 3 + 1] = colors[colorIndex][1];
      particleColors[i * 3 + 2] = colors[colorIndex][2];
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Mouse interaction
    const mouse = new THREE.Vector2();
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Animation loop with advanced motion
    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera gentle movement
      camera.position.x = Math.sin(elapsedTime * 0.1) * 2;
      camera.position.y = Math.cos(elapsedTime * 0.08) * 1;
      camera.lookAt(0, 0, 0);

      // Animate meshes with complex motion
      meshes.forEach((mesh, index) => {
        const speed = 0.5 + index * 0.1;
        
        // Rotation
        mesh.rotation.x += 0.01 * speed;
        mesh.rotation.y += 0.008 * speed;
        mesh.rotation.z += 0.005 * speed;
        
        // Orbital motion
        const radius = 8 + index * 1.5;
        const angle = elapsedTime * 0.3 + index * 0.5;
        mesh.position.x = Math.cos(angle) * radius + Math.sin(elapsedTime + index) * 2;
        mesh.position.y = Math.sin(angle) * radius * 0.5 + Math.cos(elapsedTime * 0.7 + index) * 1.5;
        mesh.position.z = Math.sin(elapsedTime * 0.4 + index) * 3;

        // Scale pulsing
        const scale = 1 + Math.sin(elapsedTime * 2 + index) * 0.1;
        mesh.scale.setScalar(scale);
      });

      // Animate particles
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsedTime + i * 0.01) * 0.01;
        positions[i * 3] += Math.cos(elapsedTime + i * 0.02) * 0.005;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Rotate particle system
      particleSystem.rotation.y = elapsedTime * 0.1;

      // Dynamic lighting
      pointLight1.position.x = Math.sin(elapsedTime) * 15;
      pointLight1.position.z = Math.cos(elapsedTime) * 15;
      pointLight2.position.x = Math.cos(elapsedTime * 0.7) * 15;
      pointLight2.position.z = Math.sin(elapsedTime * 0.7) * 15;

      // Mouse interaction effect
      meshes.forEach((mesh, index) => {
        const distance = mesh.position.distanceTo(camera.position);
        const mouseInfluence = 1 - Math.min(distance / 20, 1);
        mesh.position.x += mouse.x * mouseInfluence * 0.1;
        mesh.position.y += mouse.y * mouseInfluence * 0.1;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of all resources
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}