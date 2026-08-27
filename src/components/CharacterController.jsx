import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { Character } from "./Character";
import { paintingFocus, playerPosition } from "./playerStore";

const CAM_HEIGHT = 0.55;
const CAM_DISTANCE = 1.45;
const LOOK_AT_Y = 0.5;
const LOOK_AT_Z = 2.55;
const FOLLOW_LERP = 0.13;
const LOOK_LERP = 0.13;
const FOCUS_LERP = 0.04;

const normalizeAngle = (angle) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

const lerpAngle = (start, end, t) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (Math.abs(end - start) > Math.PI) {
    if (end > start) {
      start += 2 * Math.PI;
    } else {
      end += 2 * Math.PI;
    }
  }

  return normalizeAngle(start + (end - start) * t);
};

export const CharacterController = () => {
  const { WALK_SPEED, RUN_SPEED, ROTATION_SPEED } = useControls(
    "Character Control",
    {
      WALK_SPEED: { value: 1.6, min: 0.1, max: 4, step: 0.1 },
      RUN_SPEED: { value: 1.6, min: 0.2, max: 12, step: 0.1 },
      ROTATION_SPEED: {
        value: degToRad(0.5),
        min: degToRad(0.1),
        max: degToRad(5),
        step: degToRad(0.1),
      },
    }
  );

  const rb = useRef();
  const container = useRef();
  const character = useRef();

  const [animation, setAnimation] = useState("idle");

  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0);
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const isClicking = useRef(false);
  const jumpLatch = useRef(false);

  useEffect(() => {
    const onMouseDown = () => {
      isClicking.current = true;
    };
    const onMouseUp = () => {
      isClicking.current = false;
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchstart", onMouseDown);
    document.addEventListener("touchend", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, []);

  useFrame(({ camera, mouse }) => {
    if (rb.current) {
      const vel = rb.current.linvel();
      const t = rb.current.translation();
      playerPosition.set(t.x, t.y, t.z);

      const movement = {
        x: 0,
        z: 0,
      };

      if (get().forward) {
        movement.z = 1;
      }
      if (get().backward) {
        movement.z = -1;
      }

      let speed = get().run ? RUN_SPEED : WALK_SPEED;

      if (isClicking.current) {
        if (Math.abs(mouse.x) > 0.1) {
          movement.x = -mouse.x;
        }
        movement.z = mouse.y + 0.4;
        if (Math.abs(movement.x) > 0.5 || Math.abs(movement.z) > 0.5) {
          speed = RUN_SPEED;
        }
      }

      if (get().left) {
        movement.x = 1;
      }
      if (get().right) {
        movement.x = -1;
      }

      if (movement.x !== 0) {
        rotationTarget.current += ROTATION_SPEED * movement.x;
      }

      if (movement.x !== 0 || movement.z !== 0) {
        characterRotationTarget.current = Math.atan2(movement.x, movement.z);
        vel.x =
          Math.sin(rotationTarget.current + characterRotationTarget.current) *
          speed;
        vel.z =
          Math.cos(rotationTarget.current + characterRotationTarget.current) *
          speed;
        if (speed === RUN_SPEED) {
          setAnimation("run");
        } else {
          setAnimation("walk");
        }
      } else {
        vel.x = 0;
        vel.z = 0;
        setAnimation("idle");
      }
      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );

      // JUMP (space) - forward + up impulse, single-trigger per press
      const jumpPressed = !!get().jump;
      if (jumpPressed && !jumpLatch.current) {
        jumpLatch.current = true;

        // Simple grounded-ish check: near-zero vertical velocity and not too high
        const grounded = Math.abs(vel.y) < 0.05 && t.y < 2;
        if (grounded) {
          const yaw = rotationTarget.current + characterRotationTarget.current;
          const forwardX = Math.sin(yaw);
          const forwardZ = Math.cos(yaw);
          rb.current.applyImpulse(
            { x: forwardX * 0.8, y: 2.2, z: forwardZ * 0.8 },
            true
          );
        }
      } else if (!jumpPressed) {
        jumpLatch.current = false;
      }

      rb.current.setLinvel(vel, true);
    }

    // CAMERA — painting focus overrides follow-cam while standing on a torus
    if (paintingFocus.active) {
      camera.position.lerp(paintingFocus.cameraPos, FOCUS_LERP);
      cameraLookAt.current.lerp(paintingFocus.lookAt, FOCUS_LERP);
      camera.lookAt(cameraLookAt.current);
      return;
    }

    container.current.rotation.y = MathUtils.lerp(
      container.current.rotation.y,
      rotationTarget.current,
      0.1
    );

    cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
    camera.position.lerp(cameraWorldPosition.current, FOLLOW_LERP);

    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, LOOK_LERP);

      camera.lookAt(cameraLookAt.current);
    }
  });

  return (
    <RigidBody colliders={false} lockRotations ref={rb} position={[0, 0.5, 3]} name="player">
      <group ref={container}>
        <group ref={cameraTarget} position-y={LOOK_AT_Y} position-z={LOOK_AT_Z} />
        <group
          ref={cameraPosition}
          position-y={CAM_HEIGHT}
          position-z={-CAM_DISTANCE}
        />
        <group ref={character}>
          <Character scale={0.18} position-y={-0.25} position-x={0.1} animation={animation} />
        </group>
      </group>
      <CapsuleCollider args={[0.08, 0.15]} />
    </RigidBody>
  );
};
