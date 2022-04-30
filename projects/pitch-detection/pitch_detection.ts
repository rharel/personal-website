const PITCH_CLASSES = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
] as const;

export async function detect_from_device(
  threshold: number,
  history_buffer_size: number,
  callback: (frequency: number, note: string) => void
) {
  // We want to be able to distinguish between the closest two notes in our desired range.
  const a4 = 440;
  const c1 = 32.7;
  const c1_sharp = 34.65;
  const c7 = 2093;
  const desired_frequency_resolution = c1_sharp - c1;

  // Determine how many frequency bins we need to achieve the desired resolution between
  // consecutive bins. The bins denote frequencies from 0 to 1/2 of the sample rate. [1].
  //
  // 1. https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData
  const context = new AudioContext();
  const bin_max_frequency = context.sampleRate / 2;
  const desired_frequency_bin_count =
    bin_max_frequency / desired_frequency_resolution;

  // Bin count must be a power of two, so find the nearest one that satisfies our requirement.
  // Must be between 32 and 32768. [2]
  //
  // 2. https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData
  const frequency_bin_count = (() => {
    let nearest_power_of_two = 32;
    while (
      nearest_power_of_two < desired_frequency_bin_count &&
      nearest_power_of_two <= 32768
    ) {
      nearest_power_of_two *= 2;
    }
    return nearest_power_of_two;
  })();

  // The FFT window size is double the frequency bin count. [3]
  //
  // 3. https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
  const fft_window_size = frequency_bin_count * 2;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source_node = context.createMediaStreamSource(stream);
  const analyser_node = context.createAnalyser();
  analyser_node.fftSize = fft_window_size;
  source_node.connect(analyser_node);

  // Determine the range of bins we are interested in based on the detection frequency range.
  const frequency_resolution = bin_max_frequency / frequency_bin_count;
  const detection_bin_index_min = Math.floor(c1 / frequency_resolution);
  const detection_bin_index_max = Math.ceil(c7 / frequency_resolution);

  const frequency_bin_intensities = new Uint8Array(frequency_bin_count);
  const detected_note_history: string[] = [];
  const detected_note_counts: { [index: string]: number } = {};

  function process_samples() {
    requestAnimationFrame(process_samples);

    analyser_node.getByteFrequencyData(frequency_bin_intensities);

    let max_intensity = 0;
    let max_intensity_bin_index = 0;
    for (let i = detection_bin_index_min; i < detection_bin_index_max; i += 1) {
      if (frequency_bin_intensities[i] > max_intensity) {
        max_intensity = frequency_bin_intensities[i];
        max_intensity_bin_index = i;
      }
    }

    if (max_intensity < threshold) {
      return;
    }

    const detected_frequency =
      (max_intensity_bin_index + 0.5) * frequency_resolution;

    const detected_note_index = Math.round(
      Math.log2(detected_frequency / a4) * 12
    );

    const detected_note_index_relative_to_c4 = detected_note_index + 9;

    const detected_octave =
      4 + Math.floor(detected_note_index_relative_to_c4 / 12);

    const detected_note_index_normalized =
      detected_note_index % 12 < 0
        ? 12 + (detected_note_index % 12)
        : detected_note_index % 12;

    const detected_pitch = PITCH_CLASSES[detected_note_index_normalized];
    const detected_note = detected_pitch + detected_octave.toString();

    if (detected_note_history.length >= history_buffer_size) {
      const popped_note = detected_note_history.splice(0, 1)[0];
      detected_note_counts[popped_note] -= 1;
    }

    detected_note_history.push(detected_note);
    if (!(detected_note in detected_note_counts)) {
      detected_note_counts[detected_note] = 0;
    }
    detected_note_counts[detected_note] += 1;

    let dominant_note = "";
    for (const note in detected_note_counts) {
      if (
        dominant_note === "" ||
        detected_note_counts[note] > detected_note_counts[dominant_note]
      ) {
        dominant_note = note;
      }
    }
    if (dominant_note !== "") {
      callback(detected_frequency, dominant_note);
    }
  }
  requestAnimationFrame(process_samples);
}
