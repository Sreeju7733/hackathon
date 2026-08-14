# Air Canvas Gesture & Calibration Manual

This guide explains how to get the most accurate air-writing and graphing experience with Sign2Graph.

---

## 1. Hand Pose Reference

### ✍️ 1. Air Drawing Mode (Index Pointing)
- **Pose**: Extend your index finger upward toward the camera while keeping thumb and middle finger slightly curled.
- **Trigger**: Tracked index fingertip (landmark `#8`) emits ink coordinates.
- **Tip**: Keep your wrist relaxed and write at normal handwriting size in front of your chest.

### 🤏 2. Stroke Separation / Tap (Index + Thumb Pinch)
- **Pose**: Bring the tips of your index finger (landmark `#8`) and thumb (landmark `#4`) within 35px Euclidean distance.
- **Trigger**: Starts a new stroke group or clicks interactive on-screen buttons.

### ✋ 3. Navigation / Hover Mode (Open Palm)
- **Pose**: Spread all five fingers openly facing the camera.
- **Trigger**: Canvas drawing is suspended. Use your hand as a laser pointer to inspect coordinate axes.

### ✊ 4. Clear Canvas (Closed Fist)
- **Pose**: Curl all five fingers into a tight fist.
- **Trigger**: Holding the fist steady for 1.2 seconds triggers full air-canvas clearing.

---

## 2. Environment Calibration Tips

| Condition | Best Practice | Common Issue |
| :--- | :--- | :--- |
| **Lighting** | Even, front-facing ambient light | Backlighting creates hand silhouettes |
| **Webcam Angle** | Chest/eye level, 0.5m to 1m distance | Too close cuts off finger tips |
| **Background** | Clean, non-distracting background | Cluttered movement creates jitter |
| **Stroke Speed** | Smooth, steady strokes | Rapid jerking triggers interpolation jumps |

---

## 3. Keyboard Backup Shortcuts

When testing without a webcam or in low-light environments, all gestures map directly to keyboard equivalents:
- **`Space`**: Toggle draw / hover state
- **`Ctrl + Z`**: Undo last stroke
- **`Ctrl + Y`**: Redo stroke
- **`Ctrl + K`**: Clear canvas
- **`Ctrl + E`**: Open export modal
- **`?`**: Open shortcut help
