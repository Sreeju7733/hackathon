export type HandPoint = { x: number; y: number; z?: number };
export type GesturePose =
  | "hover"
  | "point"
  | "pinch"
  | "fist"
  | "three-finger"
  | "four-finger"
  | "open-palm"
  | "thumb";

const FINGER_TIPS = [8, 12, 16, 20] as const;
const FINGER_PIPS = [6, 10, 14, 18] as const;
const FINGER_MCPS = [5, 9, 13, 17] as const;

const distance = (a: HandPoint, b: HandPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

const angle = (a: HandPoint, b: HandPoint, c: HandPoint) => {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const denominator = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z);
  if (!denominator) return 0;
  return (
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, (ab.x * cb.x + ab.y * cb.y + ab.z * cb.z) / denominator),
      ),
    ) *
      180) /
    Math.PI
  );
};

const palmScale = (landmarks: HandPoint[]) =>
  Math.max(0.0001, distance(landmarks[0], landmarks[9]));
const extended = (landmarks: HandPoint[], tip: number, pip: number) =>
  distance(landmarks[tip], landmarks[0]) >
  distance(landmarks[pip], landmarks[0]) * 1.16;

export function classifyGesture(
  normalized: HandPoint[],
  world: HandPoint[] = normalized,
): GesturePose {
  if (normalized.length < 21 || world.length < 21) return "hover";
  const scale = palmScale(world);
  const angles = FINGER_TIPS.map((tip, index) =>
    angle(world[tip], world[FINGER_PIPS[index]], world[FINGER_MCPS[index]]),
  );
  const isExtended = FINGER_TIPS.map((tip, index) =>
    extended(world, tip, FINGER_PIPS[index]),
  );
  const pinchRatio = distance(world[8], world[4]) / scale;
  const thumbExtended = extended(world, 4, 3);
  const compact = FINGER_TIPS.filter(
    (tip, index) =>
      distance(world[tip], world[0]) <
      distance(world[FINGER_PIPS[index]], world[0]) * 1.42,
  ).length;
  const curled = angles.filter((value) => value < 128).length;

  if (isExtended.every(Boolean) && !thumbExtended) return "four-finger";
  if (isExtended.every(Boolean)) return "open-palm";
  if (
    thumbExtended &&
    isExtended[0] &&
    isExtended[1] &&
    !isExtended[2] &&
    !isExtended[3]
  )
    return "three-finger";
  if (thumbExtended && isExtended.every((value) => !value)) return "thumb";
  if (compact === 4 && curled === 4 && !thumbExtended) return "fist";
  if (pinchRatio < 0.3) return "pinch";
  if (
    angles[0] > 160 &&
    distance(world[8], world[0]) > scale * 2 &&
    angles.slice(1).every((value) => value < 125)
  )
    return "point";
  return "hover";
}

export class GestureStabilizer {
  private pinch = false;
  private candidate: GesturePose = "hover";
  private candidateSince = 0;
  private stable: GesturePose = "hover";

  update(pose: GesturePose, now: number): GesturePose {
    if (pose !== this.candidate) {
      this.candidate = pose;
      this.candidateSince = now;
    }
    const dwell = pose === "pinch" ? 70 : pose === "hover" ? 100 : 180;
    if (now - this.candidateSince >= dwell) this.stable = pose;
    return this.stable;
  }

  updatePinch(distanceRatio: number): boolean {
    if (this.pinch ? distanceRatio > 0.42 : distanceRatio < 0.3)
      this.pinch = !this.pinch;
    return this.pinch;
  }

  reset() {
    this.pinch = false;
    this.candidate = "hover";
    this.stable = "hover";
    this.candidateSince = 0;
  }
}
