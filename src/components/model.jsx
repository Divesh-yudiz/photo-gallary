import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'

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
    const { nodes, materials } = useGLTF('/gallary-1.glb')

    return (
        <group {...props} dispose={null}>
            <group scale={0.01}>
                <group rotation={[Math.PI, 0, 0]} scale={110.41}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Bench_BenchConcreteBase_0.geometry}
                        material={materials.BenchConcreteBase}
                    />
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
                    {LAMP_CONFIG.map(({ key, pos }, i) =>
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
                    )}
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
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside_Painting_0.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside_Painting_0001.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside_Painting_0002.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside_Painting_0003.geometry}
                        material={materials.Painting}
                    />
                </group>
                <group rotation={[-Math.PI / 2, 0, 0.099]} scale={100}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside001_Painting_0.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside001_Painting_0001.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside001_Painting_0002.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsInside001_Painting_0003.geometry}
                        material={materials.Painting}
                    />
                </group>
                <group rotation={[-Math.PI / 2, 0, 0.099]} scale={100}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0001.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0002.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0003.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0004.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0005.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0006.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0007.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0008.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0009.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0010.geometry}
                        material={materials.Painting}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.PaitingsOutside_Painting_0011.geometry}
                        material={materials.Painting}
                    />
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
        </group>
    )
}

useGLTF.preload('/gallary-1.glb')
