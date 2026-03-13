import React, { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'

export function Character(props) {
    const group = useRef()
    const { nodes, materials, animations } = useGLTF('/personnage_opti.glb')
    const { actions } = useAnimations(animations, group)

    useEffect(() => {
        if (!actions) return

        const nextName =
            props.animation === "walk"
                ? "walk"
                : props.animation === "run"
                    ? "walk"
                    : "wait"

        const next = actions[nextName] ?? Object.values(actions)[0]
        if (!next) return

        // Speed up walk/run animation playback.
        next.reset()
        next.enabled = true
        next.setEffectiveTimeScale(
            props.animation === "run" ? 5 : props.animation === "walk" ? 1.6 : 1
        )
        next.setEffectiveWeight(1)
        next.fadeIn(0.15).play()

        return () => {
            next.fadeOut(0.15)
        }
    }, [actions, props.animation])

    return (
        <group ref={group} {...props} dispose={null}>
            <group name="Scene">
                <group name="Armature">
                    <skinnedMesh
                        name="armL"
                        geometry={nodes.armL.geometry}
                        material={nodes.armL.material}
                        skeleton={nodes.armL.skeleton}
                    />
                    <skinnedMesh
                        name="armR"
                        geometry={nodes.armR.geometry}
                        material={nodes.armR.material}
                        skeleton={nodes.armR.skeleton}
                    />
                    <skinnedMesh
                        name="body"
                        geometry={nodes.body.geometry}
                        material={nodes.body.material}
                        skeleton={nodes.body.skeleton}
                    />
                    <skinnedMesh
                        name="footL"
                        geometry={nodes.footL.geometry}
                        material={nodes.footL.material}
                        skeleton={nodes.footL.skeleton}
                    />
                    <skinnedMesh
                        name="footR"
                        geometry={nodes.footR.geometry}
                        material={nodes.footR.material}
                        skeleton={nodes.footR.skeleton}
                    />
                    <skinnedMesh
                        name="legL"
                        geometry={nodes.legL.geometry}
                        material={nodes.legL.material}
                        skeleton={nodes.legL.skeleton}
                    />
                    <skinnedMesh
                        name="legR"
                        geometry={nodes.legR.geometry}
                        material={nodes.legR.material}
                        skeleton={nodes.legR.skeleton}
                    />
                    <primitive object={nodes.bassin} />
                    <primitive object={nodes.IKtete} />
                    <primitive object={nodes.coude_bras_L} />
                    <primitive object={nodes.IKpied_L} />
                    <primitive object={nodes.IKmain_L} />
                    <primitive object={nodes.genou_jambe_L} />
                    <primitive object={nodes.coude_bras_R} />
                    <primitive object={nodes.IKmain_R} />
                    <primitive object={nodes.IKpied_R} />
                    <primitive object={nodes.genou_jambe_R} />
                </group>
            </group>
        </group>
    )
}

useGLTF.preload('/personnage_opti.glb')