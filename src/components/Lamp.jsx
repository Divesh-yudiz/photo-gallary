import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Lamp(props) {
    const { nodes, materials } = useGLTF('/wall_lamp.glb')
    return (
        <group {...props} dispose={null}>
            <group rotation={[-Math.PI / 2, 0, 0]} scale={5.351}>
                <group rotation={[Math.PI / 2, 0, 0]}>
                    <group
                        position={[-0.145, 4.357, -20.484]}
                        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                        scale={100}>
                        <mesh
                            castShadow
                            receiveShadow
                            geometry={nodes.Support_Metal_0.geometry}
                            material={materials.Metal}
                        />
                        <group position={[-0.195, -0.045, -0.024]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
                            <mesh
                                castShadow
                                receiveShadow
                                geometry={nodes.BigPart_Metal_0.geometry}
                                material={materials.Metal}
                            />
                            <mesh
                                castShadow
                                receiveShadow
                                geometry={nodes.Emissive_Emissive_0.geometry}
                                material={materials.Emissive}
                            />
                        </group>
                        <mesh
                            castShadow
                            receiveShadow
                            geometry={nodes.Switch_Plastic_0.geometry}
                            material={materials.Plastic}
                            position={[0.015, -0.061, 0.04]}
                            rotation={[0, 0, -Math.PI / 2]}
                        />
                    </group>
                </group>
            </group>
        </group>
    )
}

useGLTF.preload('/wall_lamp.glb')