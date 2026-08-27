import React, { useRef, useEffect, useMemo, useLayoutEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { setPaintingFocus, clearPaintingFocus } from './playerStore'
import paintingImg1 from '../assets/images/1.jpeg'
import paintingImg2 from '../assets/images/2.jpeg'
import paintingImg3 from '../assets/images/3.jpeg'

const PAINTING_IMAGES = [paintingImg1, paintingImg2, paintingImg3]

const INSIDE_PAINTINGS = [
    'PaitingsInside_Painting_0',
    'PaitingsInside_Painting_0001',
    'PaitingsInside_Painting_0002',
    'PaitingsInside_Painting_0003',
]

const INSIDE_PAINTINGS_001 = [
    'PaitingsInside001_Painting_0',
    'PaitingsInside001_Painting_0001',
    'PaitingsInside001_Painting_0002',
    'PaitingsInside001_Painting_0003',
]

const OUTSIDE_PAINTINGS = [
    'PaitingsOutside_Painting_0',
    'PaitingsOutside_Painting_0001',
    'PaitingsOutside_Painting_0002',
    'PaitingsOutside_Painting_0003',
    'PaitingsOutside_Painting_0004',
    'PaitingsOutside_Painting_0005',
    'PaitingsOutside_Painting_0006',
    'PaitingsOutside_Painting_0007',
    'PaitingsOutside_Painting_0008',
    'PaitingsOutside_Painting_0009',
    'PaitingsOutside_Painting_0010',
    'PaitingsOutside_Painting_0011',
]

const OUTSIDE_TORUS = {
    floorOffset: 0.65,
    floorY: 0,
    viewDistance: 1.0,
    radiusScale: 0.8,
    plateWidth: 0.02,
    sensorHeight: 0.45,
    opacity: 0.35,
}

const INSIDE_TORUS = {
    floorOffset: -0.9,
    floorY: 0,
    viewDistance: 1.5,
    radiusScale: 0.8,
    plateWidth: 0.02,
    sensorHeight: 0.45,
    opacity: 0.35,
}

const INSIDE_TORUS_001 = {
    floorOffset: 1.0,
    floorY: 0,
    viewDistance: 1.5,
    radiusScale: 0.8,
    plateWidth: 0.02,
    sensorHeight: 0.45,
    opacity: 0.35,
}

const LIGHT_POSITIONS = [
    [-6.5, 4, 2],
    [0.5, 4, 6.75],
    [7.25, 4, 0],
    [-0.5, 4, -6.75],
]

function PaintingMesh({ id, geometry, material, map, torusSettings, onRegister, onUnregister }) {
    const groupRef = useRef(null)
    const { floorOffset, floorY, viewDistance, radiusScale, plateWidth, sensorHeight, opacity } =
        torusSettings

    const paintedMaterial = useMemo(() => {
        const mat = material.clone()
        if (map) {
            map.colorSpace = THREE.SRGBColorSpace
            map.wrapS = THREE.ClampToEdgeWrapping
            map.wrapT = THREE.ClampToEdgeWrapping
            map.needsUpdate = true
            mat.map = map
            mat.color = new THREE.Color('#ffffff')
            mat.emissiveMap = null
            mat.needsUpdate = true
        }
        return mat
    }, [material, map])

    const layout = useMemo(() => {
        geometry.computeBoundingBox()
        const box = geometry.boundingBox
        const center = new THREE.Vector3()
        const size = new THREE.Vector3()
        box.getCenter(center)
        box.getSize(size)

        const dims = [
            { size: size.x, dir: new THREE.Vector3(1, 0, 0) },
            { size: size.y, dir: new THREE.Vector3(0, 1, 0) },
            { size: size.z, dir: new THREE.Vector3(0, 0, 1) },
        ].sort((a, b) => a.size - b.size)

        const faceSize = Math.max(dims[1].size, dims[2].size)

        return {
            center,
            baseRadius: Math.max(faceSize * 0.28, 0.35),
        }
    }, [geometry])

    useLayoutEffect(() => {
        if (!groupRef.current) return

        groupRef.current.updateWorldMatrix(true, false)
        const lookAt = layout.center.clone()
        groupRef.current.localToWorld(lookAt)

        // Radial axis: + toward gallery center, - toward outer wall
        const towardRoom = new THREE.Vector3(-lookAt.x, 0, -lookAt.z)
        if (towardRoom.lengthSq() < 1e-6) towardRoom.set(0, 0, 1)
        towardRoom.normalize()

        const floorPos = new THREE.Vector3(
            lookAt.x + towardRoom.x * floorOffset,
            floorY,
            lookAt.z + towardRoom.z * floorOffset
        )

        // Camera stands on the same side as the floor torus (handles opposite wall faces)
        const viewDir = new THREE.Vector3(
            floorPos.x - lookAt.x,
            0,
            floorPos.z - lookAt.z
        )
        if (viewDir.lengthSq() < 1e-6) {
            viewDir.copy(towardRoom)
        } else {
            viewDir.normalize()
        }

        const cameraPos = new THREE.Vector3(
            lookAt.x + viewDir.x * Math.abs(viewDistance),
            lookAt.y,
            lookAt.z + viewDir.z * Math.abs(viewDistance)
        )

        onRegister(id, {
            floorPos: floorPos.toArray(),
            lookAt: lookAt.toArray(),
            cameraPos: cameraPos.toArray(),
            radius: layout.baseRadius * radiusScale,
            plateWidth,
            sensorHeight,
            opacity,
        })

        return () => onUnregister(id)
    }, [
        id,
        layout,
        floorOffset,
        floorY,
        viewDistance,
        radiusScale,
        plateWidth,
        sensorHeight,
        opacity,
        onRegister,
        onUnregister,
    ])

    return (
        <group ref={groupRef}>
            <mesh
                castShadow
                receiveShadow
                geometry={geometry}
                material={paintedMaterial}
            />
        </group>
    )
}

function PaintingFloorMarker({ id, floorPos, lookAt, cameraPos, radius, plateWidth, sensorHeight, opacity }) {
    const matRef = useRef(null)
    const meshRef = useRef(null)
    const highlight = useRef(0)
    const active = useRef(false)
    const lookAtVec = useMemo(() => new THREE.Vector3(...lookAt), [lookAt])
    const cameraPosVec = useMemo(() => new THREE.Vector3(...cameraPos), [cameraPos])

    const outerRadius = radius * 0.95
    const innerRadius = Math.max(outerRadius - plateWidth, outerRadius * 0.72)

    const isPlayer = (other) =>
        other?.rigidBodyObject?.name === 'player'

    useFrame((state, delta) => {
        if (!matRef.current) return
        const target = active.current ? 1 : 0
        highlight.current = THREE.MathUtils.damp(highlight.current, target, 10, delta)
        const h = highlight.current
        const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 5) * 0.15 * h
        matRef.current.opacity = opacity + h * (1 - opacity)
        matRef.current.color.setRGB(1, 0.45 + h * 0.4, 0.08 + h * 0.35)
        if (meshRef.current) {
            meshRef.current.scale.setScalar(1 + h * 0.12 * pulse)
        }
    })

    return (
        <RigidBody
            type="fixed"
            colliders={false}
            sensor
            position={floorPos}
            onIntersectionEnter={({ other }) => {
                if (!isPlayer(other)) return
                active.current = true
                setPaintingFocus(id, lookAtVec, cameraPosVec)
            }}
            onIntersectionExit={({ other }) => {
                if (!isPlayer(other)) return
                active.current = false
                clearPaintingFocus(id)
            }}
        >
            <CylinderCollider args={[sensorHeight, outerRadius]} />
            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.02, 0]}
                renderOrder={2}
            >
                <ringGeometry args={[innerRadius, outerRadius, 64]} />
                <meshBasicMaterial
                    ref={matRef}
                    color="#ff9a2e"
                    transparent
                    opacity={opacity}
                    toneMapped={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </RigidBody>
    )
}

const BORDER_STRIP_WIDTH = 512
const BAND_PIXELS = 72

function createStripTexture() {
    const size = BORDER_STRIP_WIDTH * 4
    const data = new Uint8Array(size)
    const center = BORDER_STRIP_WIDTH / 2
    const halfBand = BAND_PIXELS / 2
    const dark = Math.floor(0.15 * 300)
    for (let i = 0; i < BORDER_STRIP_WIDTH; i++) {
        const d = Math.abs(i - center)
        const t = Math.max(0, 1 - d / halfBand)
        const v = Math.floor(dark + (255 - dark) * t)
        data[i * 4] = v
        data[i * 4 + 1] = v
        data[i * 4 + 2] = v
        data[i * 4 + 3] = 255
    }
    const tex = new THREE.DataTexture(data, BORDER_STRIP_WIDTH, 1)
    tex.wrapS = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
}

function BorderLightStrip({ geometry }) {
    const meshRef = useRef(null)
    const { texture, material } = useMemo(() => {
        const texture = createStripTexture()
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            side: THREE.DoubleSide,
        })
        return { texture, material }
    }, [])

    const speed = 0.2
    useFrame((_, delta) => {
        if (meshRef.current?.material?.map) {
            meshRef.current.material.map.offset.x += delta * speed
            if (meshRef.current.material.map.offset.x >= 1)
                meshRef.current.material.map.offset.x -= 1
        }
    })

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            scale={8.19}
            castShadow
            receiveShadow
        />
    )
}

const LAMP_CONFIG = [
    { key: 'Lamp_Lamp_0', pos: [-6.657, 0, 3.69] },
    { key: 'Lamp_Lamp_0001', pos: [-6.43, -1.723, 3.69] },
    { key: 'Lamp_Lamp_0002', pos: [-5.765, -3.329, 3.69] },
    { key: 'Lamp_Lamp_0003', pos: [-4.707, -4.707, 3.69] },
    { key: 'Lamp_Lamp_0004', pos: [-3.329, -5.765, 3.69] },
    { key: 'Lamp_Lamp_0005', pos: [-1.723, -6.43, 3.69] },
    { key: 'Lamp_Lamp_0006', pos: [0, -6.657, 3.69] },
    { key: 'Lamp_Lamp_0007', pos: [1.723, -6.43, 3.69] },
    { key: 'Lamp_Lamp_0008', pos: [3.329, -5.765, 3.69] },
    { key: 'Lamp_Lamp_0009', pos: [4.707, -4.707, 3.69] },
    { key: 'Lamp_Lamp_0010', pos: [5.765, -3.328, 3.69] },
    { key: 'Lamp_Lamp_0011', pos: [6.43, -1.723, 3.69] },
    { key: 'Lamp_Lamp_0012', pos: [6.657, 0, 3.69] },
    { key: 'Lamp_Lamp_0013', pos: [6.43, 1.723, 3.69] },
    { key: 'Lamp_Lamp_0014', pos: [5.765, 3.328, 3.69] },
    { key: 'Lamp_Lamp_0015', pos: [4.707, 4.707, 3.69] },
    { key: 'Lamp_Lamp_0016', pos: [3.328, 5.765, 3.69] },
    { key: 'Lamp_Lamp_0017', pos: [1.723, 6.43, 3.69] },
    { key: 'Lamp_Lamp_0018', pos: [0, 6.657, 3.69] },
    { key: 'Lamp_Lamp_0019', pos: [-1.723, 6.43, 3.69] },
    { key: 'Lamp_Lamp_0020', pos: [-3.328, 5.765, 3.69] },
    { key: 'Lamp_Lamp_0021', pos: [-4.707, 4.707, 3.69] },
    { key: 'Lamp_Lamp_0022', pos: [-5.765, 3.328, 3.69] },
    { key: 'Lamp_Lamp_0023', pos: [-6.43, 1.723, 3.69] },
]

const SPOTLIGHT_INDICES = [0, 3, 6, 9, 12, 15, 18, 21]

const SPOTLIGHT_INTENSITY = {
    0: 30,
    3: 15.5,
    6: 30,
    9: 15.5,
    12: 30,
    15: 15,
    18: 30,
    21: 15,
}

function LampWithSpotlight({ geometry, material, position, intensity = 10 }) {
    const lightRef = useRef()
    const targetRef = useRef()

    useEffect(() => {
        if (lightRef.current && targetRef.current) {
            lightRef.current.target = targetRef.current
        }
    }, [])

    const [x, y, z] = position || [0, 0, 0]

    return (
        <group>
            <mesh
                castShadow
                receiveShadow
                geometry={geometry}
                material={material}
                position={position}
            />
            <spotLight
                ref={lightRef}
                position={[x, y, z]}
                angle={0.6}
                penumbra={0.08}
                intensity={intensity}
                distance={7}
                decay={1}
                color={'#ffd9b3'}
                castShadow={false}
            />
            {/* target two units below the lamp in local \"down\" direction */}
            <group ref={targetRef} position={[x, y, z - 2]} />
        </group>
    )
}

export function Model(props) {
    const { nodes, materials } = useGLTF('/gallaryV1.glb')
    const [markers, setMarkers] = useState([])
    const paintingTextures = useTexture(PAINTING_IMAGES)

    useEffect(() => {
        const list = Array.isArray(paintingTextures) ? paintingTextures : [paintingTextures]
        list.forEach((tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.anisotropy = 8
            tex.needsUpdate = true
        })
    }, [paintingTextures])

    const textureList = Array.isArray(paintingTextures) ? paintingTextures : [paintingTextures]

    const onRegister = useCallback((id, data) => {
        setMarkers((prev) => [...prev.filter((m) => m.id !== id), { id, ...data }])
    }, [])

    const onUnregister = useCallback((id) => {
        setMarkers((prev) => prev.filter((m) => m.id !== id))
    }, [])

    return (
        <group {...props} dispose={null}>
            {/* Support structures and border light from V1 */}
            <group
                position={[-4.59, 2.334, -6.522]}
                rotation={[-Math.PI / 2, 0, 2.18]}
                scale={0.973}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0.geometry}
                    material={materials.Metal}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0_1.geometry}
                    material={materials['Emissive.001']}
                />
            </group>
            <group
                position={[-0.784, 2.377, -7.936]}
                rotation={[-Math.PI / 2, 0, 1.665]}
                scale={0.973}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0001.geometry}
                    material={materials.Metal}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0001_1.geometry}
                    material={materials['Emissive.001']}
                />
            </group>
            <group
                position={[3.317, 2.334, -7.253]}
                rotation={[-Math.PI / 2, 0, 1.138]}
                scale={0.973}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0002.geometry}
                    material={materials.Metal}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Support_Metal_0002_1.geometry}
                    material={materials['Emissive.001']}
                />
            </group>
            <BorderLightStrip geometry={nodes.Cylinder001.geometry} />

            {/* Ring light source */}
            <group position={[0, 3.5, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[8, 0.08, 32, 200]} />
                    <meshStandardMaterial
                        emissive="#ffffff"
                        emissiveIntensity={5}
                        color="#ffffff"
                        toneMapped={false}
                    />
                </mesh>
            </group>

            {/* Point lights */}
            {LIGHT_POSITIONS.map((position, i) => (
                <pointLight
                    key={i}
                    color="#ffffff"
                    intensity={120}
                    distance={50}
                    decay={2}
                    position={position}
                />
            ))}

            {/* Gallery interior with physics */}
            <group scale={0.01}>
                <group rotation={[Math.PI, 0, 0]} scale={110.41}>
                    <RigidBody type="fixed" friction={1} colliders="cuboid">
                        <mesh
                            castShadow
                            receiveShadow
                            geometry={nodes.Bench_BenchConcreteBase_0.geometry}
                            material={materials.BenchConcreteBase}
                        />
                    </RigidBody>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Bench_BenchWood_0.geometry}
                        material={materials.BenchWood}
                    />
                </group>
                <group rotation={[-Math.PI / 2, 0, 0]} scale={[50, 50, 22.5]}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0001.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0002.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0003.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0004.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0005.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.CeillingWire_CeillingWire_0006.geometry}
                        material={materials.CeillingWire}
                    />
                </group>
                <group rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Lamp_Emissive_0.geometry}
                        material={materials.Emissive}
                    />
                    {/* {LAMP_CONFIG.map(({ key, pos }, i) =>
                        SPOTLIGHT_INDICES.includes(i) ? (
                            <LampWithSpotlight
                                key={key}
                                geometry={nodes[key].geometry}
                                material={materials.Lamp}
                                position={pos}
                                intensity={SPOTLIGHT_INTENSITY[i]}
                            />
                        ) : (
                            <mesh
                                key={key}
                                castShadow
                                receiveShadow
                                geometry={nodes[key].geometry}
                                material={materials.Lamp}
                                position={pos}
                            />
                        )
                    )} */}
                </group>
                <group rotation={[-Math.PI / 2, 0, 0]} scale={[50, 50, 22.5]}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.LampBase_CeillingWire_0.geometry}
                        material={materials.CeillingWire}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.LampBase_Emissive_0.geometry}
                        material={materials.Emissive}
                    />
                </group>
                <group rotation={[-Math.PI / 2, 0, 0.099]} scale={100}>
                    {INSIDE_PAINTINGS.map((key, i) => (
                        <PaintingMesh
                            key={key}
                            id={key}
                            geometry={nodes[key].geometry}
                            material={materials.Painting}
                            map={textureList[i % textureList.length]}
                            torusSettings={INSIDE_TORUS}
                            onRegister={onRegister}
                            onUnregister={onUnregister}
                        />
                    ))}
                </group>
                <group rotation={[-Math.PI / 2, 0, 0.099]} scale={100}>
                    {INSIDE_PAINTINGS_001.map((key, i) => (
                        <PaintingMesh
                            key={key}
                            id={key}
                            geometry={nodes[key].geometry}
                            material={materials.Painting}
                            map={textureList[(i + 1) % textureList.length]}
                            torusSettings={INSIDE_TORUS_001}
                            onRegister={onRegister}
                            onUnregister={onUnregister}
                        />
                    ))}
                </group>
                <group rotation={[-Math.PI / 2, 0, 0.099]} scale={100}>
                    {OUTSIDE_PAINTINGS.map((key, i) => (
                        <PaintingMesh
                            key={key}
                            id={key}
                            geometry={nodes[key].geometry}
                            material={materials.Painting}
                            map={textureList[i % textureList.length]}
                            torusSettings={OUTSIDE_TORUS}
                            onRegister={onRegister}
                            onUnregister={onUnregister}
                        />
                    ))}
                </group>
                <group rotation={[-Math.PI / 2, 0, 0]} scale={[50, 50, 22.5]}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Walls_Ceilling_0.geometry}
                        material={materials.Ceilling}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Walls_Emissive_0.geometry}
                        material={materials.Emissive}
                    />
                    <RigidBody type="fixed" friction={1} colliders={false}>
                        <CylinderCollider args={[0.05, 40]} rotation={[Math.PI / 2, 0, 0]} />
                        <mesh
                            castShadow
                            receiveShadow
                            geometry={nodes.Walls_Floor_0.geometry}
                            material={materials.Floor}
                        />
                    </RigidBody>
                    <RigidBody type="fixed" colliders="trimesh" friction={1}>
                        <mesh
                            castShadow
                            receiveShadow
                            geometry={nodes.Walls_Walls_0.geometry}
                            material={materials.Walls}
                        />
                    </RigidBody>
                </group>
            </group>

            {/* Floor toruses in world space (outside gallery scale) for reliable sensors */}
            {markers.map((m) => (
                <PaintingFloorMarker
                    key={m.id}
                    id={m.id}
                    floorPos={m.floorPos}
                    lookAt={m.lookAt}
                    cameraPos={m.cameraPos}
                    radius={m.radius}
                    plateWidth={m.plateWidth}
                    sensorHeight={m.sensorHeight}
                    opacity={m.opacity}
                />
            ))}
        </group>
    )
}

useGLTF.preload('/gallaryV1.glb')
