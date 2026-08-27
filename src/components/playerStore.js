import { Vector3 } from "three";

/** Live player world position (updated by CharacterController). */
export const playerPosition = new Vector3();

/** Active painting look-at focus (set by floor torus sensors). */
export const paintingFocus = {
  active: false,
  markerId: null,
  lookAt: new Vector3(),
  cameraPos: new Vector3(),
};

export function setPaintingFocus(markerId, lookAt, cameraPos) {
  paintingFocus.active = true;
  paintingFocus.markerId = markerId;
  paintingFocus.lookAt.copy(lookAt);
  paintingFocus.cameraPos.copy(cameraPos);
}

export function clearPaintingFocus(markerId) {
  if (markerId != null && paintingFocus.markerId !== markerId) return;
  paintingFocus.active = false;
  paintingFocus.markerId = null;
}
