import React, { useState, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const GRID_COLS = 8;
const GRID_ROWS = 4;
const PHOTO_COUNT = GRID_COLS * GRID_ROWS;
const SPHERE_RADIUS = 10;
const CELL_SIZE = 512; // pixels per photo in the atlas
const PHOTO_GAP = 100; // pixels between photos

// Placeholder image URLs (replace with your own photo paths)
const PLACEHOLDER_URLS = Array.from({ length: PHOTO_COUNT }, (_, i) =>
    `https://picsum.photos/512/512?random=${i + 1}`
);

function buildAtlasTexture(images) {
    const canvas = document.createElement("canvas");
    canvas.width = GRID_COLS * CELL_SIZE;
    canvas.height = GRID_ROWS * CELL_SIZE;
    const ctx = canvas.getContext("2d");

    // Fill background for gap color (dark so seams are subtle on sphere)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const size = CELL_SIZE - PHOTO_GAP;
    images.forEach((img, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = col * CELL_SIZE + PHOTO_GAP / 2;
        const y = row * CELL_SIZE + PHOTO_GAP / 2;
        ctx.drawImage(img, x, y, size, size);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

function PhotoGlobeContent() {
    const [atlasTexture, setAtlasTexture] = useState(null);
    const textureRef = useRef(null);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");

        Promise.all(
            PLACEHOLDER_URLS.map(
                (url) =>
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = url;
                    })
            )
        )
            .then((images) => {
                const texture = buildAtlasTexture(images);
                if (textureRef.current) {
                    textureRef.current.dispose();
                }
                textureRef.current = texture;
                setAtlasTexture(texture);
            })
            .catch(console.warn);

        return () => {
            if (textureRef.current) {
                textureRef.current.dispose();
            }
        };
    }, []);

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.4}
                minDistance={0.5}
                maxDistance={SPHERE_RADIUS * 0.98}
                target={[0, 0, 0]}
            />
            {atlasTexture && (
                <mesh>
                    <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
                    <meshStandardMaterial
                        map={atlasTexture}
                        side={THREE.BackSide}
                        roughness={0.4}
                        metalness={0.05}
                    />
                </mesh>
            )}
        </>
    );
}

const PhotoGlobe = () => {
    return <PhotoGlobeContent />;
};

export default PhotoGlobe;
