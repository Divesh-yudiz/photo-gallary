import { Suspense } from "react";
import { Environment, KeyboardControls, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import PhotoGallary from "./PhotoGallary";
import { CharacterController } from "./CharacterController";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "jump", keys: ["Space"] },
];

export const Experience = () => {
  return (
    <Suspense fallback={null}>
      {/* <Environment preset="warehouse" intensity={0.2} /> */}
      <ambientLight intensity={2} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      {/* <OrbitControls enableDamping dampingFactor={0.06} rotateSpeed={0.4} /> */}
      <KeyboardControls map={keyboardMap}>
        <Physics colliders={false}>
          <PhotoGallary />
          <CharacterController />
        </Physics>
      </KeyboardControls>
    </Suspense>
  );
};
