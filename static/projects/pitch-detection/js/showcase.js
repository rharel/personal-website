(function()
{
const VISUAL_STYLE =
{
	background_color: "white",
	bar_color: "purple",
	bar_height_scale: 0.95
};

window.addEventListener("DOMContentLoaded", () =>
{
	const showcase = document.getElementById("showcase-figure");
	const error = document.getElementById("showcase-error");

	if (typeof navigator.mediaDevices.getUserMedia === "undefined")
	{
		showcase.style.display = "none";
		error.style.display = "block";
		return;
	}

	const canvas = document.getElementById("showcase-visual");
	const graphics_context = canvas.getContext("2d");

	Visualization.draw_background(graphics_context);

	const audio_system = new Audio.System(new AudioContext());
	audio_system.route.volume = 0;

	const Note = MusicNoteUtilities.Note;
	const low = Note.from_string("C4");
	const high = Note.from_string("C6");
	const desired_resolution = low.transpose(1).frequency() - low.frequency();
	const fft_size = audio_system.recommend_size(desired_resolution);
	const bin_count = Audio.fft_bin_count(fft_size);
	const resolution = audio_system.resolution(fft_size);
	const visible_range =
	{
		min: Math.floor(low.frequency() / resolution),
		max: Math.ceil(high.frequency() / resolution)
	};

	const data = new Uint8Array(bin_count);
	const detector = new PitchDetection.Detector(150, 12);
	const note_display =
		document.getElementById("showcase-detection-result").firstElementChild;

	function main()
	{
		requestAnimationFrame(main);

		audio_system.route.get_byte_frequency_data(data);
		Visualization.draw_bars
		(
			data, visible_range,
			graphics_context, VISUAL_STYLE
		);
		note_display.textContent = detector.detect(data, visible_range, resolution);
	}

	Audio.start_capture(audio_system.route)
	.then(() => requestAnimationFrame(main))
	.catch(error => console.log("Could not get user media: " + error));
});
})();
