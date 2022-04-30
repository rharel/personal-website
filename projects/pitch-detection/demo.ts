import { detect_from_device } from "./pitch_detection";

function setup() {
  const detected_frequency = document.getElementById("demo-detected-frequency");
  const detected_note = document.getElementById("demo-detected-note");

  if (detected_frequency === null || detected_note === null) {
    throw new Error("missing demo element");
  }

  detect_from_device(125, 12, (frequency, note) => {
    detected_frequency.textContent = `${Math.round(frequency)}Hz`;
    detected_note.textContent = note;
  });
}
window.addEventListener("DOMContentLoaded", setup);
