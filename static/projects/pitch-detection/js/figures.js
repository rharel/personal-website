(function()
{
const AUDIO_DIRECTORY = "/static/projects/pitch-detection/audio/";
const VISUAL_STYLE =
{
	TIME_DOMAIN:
	{
		background_color: "white",
		line_color: "purple",
		line_width: 4
	},
	FREQUENCY_DOMAIN:
	{
		background_color: "white",
		bar_color: "purple",
		bar_height_scale: 0.95
	}
};

const audio_system = new Audio.System(new AudioContext());

const low = MusicNoteUtilities.Note.from_string("C3");
const high = MusicNoteUtilities.Note.from_string("C6");
const desired_resolution = low.transpose(1).frequency() - low.frequency();
const fft_size = audio_system.recommend_size(desired_resolution);
const resolution = audio_system.resolution(fft_size);
const visible_range =
{
	min: Math.floor(low.frequency() / resolution),
	max: Math.ceil(high.frequency() / resolution)
};

setup_time_domain_animation("figure-1-visual", "sin_440Hz_-3dBFS_1s.mp3");
setup_time_domain_animation("figure-2-visual", "note_C4.mp3");
setup_time_domain_animation("figure-3-visual", "scale_C4_major.mp3");

setup_frequency_domain_animation("figure-4-A-visual", "sin_440Hz_-3dBFS_1s.mp3");
setup_frequency_domain_animation("figure-4-B-visual", "scale_C4_major.mp3");

setup_pitch_detection
(
	"figure-5-visual",
	"scale_C4_major.mp3",
	{
		detect: PitchDetection.detect_naively,
		reset: () => {}
	},
	"figure-5-detection-result",
);
setup_pitch_detection
(
	"figure-6-visual",
	"scale_C4_major.mp3",
	new PitchDetection.Detector(150, 12),
	"figure-6-detection-result",
);


function setup_animation(canvas_id, audio_file, animation_constructor, on_load = null)
{
	window.addEventListener
	(
		"DOMContentLoaded",
		() =>
		{
			const canvas = document.getElementById(canvas_id);
			const play_button = canvas.parentElement.lastElementChild;

			play_button.style.opacity = "1";

			Audio.Clip.from_url
			(
				AUDIO_DIRECTORY + audio_file, audio_system,
				audio_clip =>
			{
				const result = animation_constructor(audio_clip, canvas);
				const animation = result.animation;
				animation.on_animation_stop(() =>
				{
					play_button.style.opacity = "1"
				});
				play_button.addEventListener("click", () =>
				{
					animation.toggle_play();
					play_button.style.opacity = "" + (1 - animation.is_playing);
				});

				if (on_load) { on_load(result); }
			});
		}
	);
}
function setup_time_domain_animation(canvas_id, audio_file, on_load = null)
{
	setup_animation
	(
		canvas_id, audio_file,
		(audio_clip, canvas) =>
		{
			audio_clip.fft_size = 2048;
			return Visualization.AudioClipAnimation
				.for_time_domain(audio_clip, canvas, VISUAL_STYLE.TIME_DOMAIN)
		},
		on_load
	);
}
function setup_frequency_domain_animation(canvas_id, audio_file, on_load = null)
{
	setup_animation
	(
		canvas_id, audio_file,
		(audio_clip, canvas) =>
		{
			audio_clip.fft_size = fft_size;
			return Visualization.AudioClipAnimation.for_frequency_domain
			(
				audio_clip, canvas,
				visible_range, VISUAL_STYLE.FREQUENCY_DOMAIN
			)
		},
		on_load
	);
}
function setup_pitch_detection(canvas_id, audio_file, detector, result_div_id)
{
	setup_frequency_domain_animation(canvas_id, audio_file, result =>
	{
		hook_up_detection(result.animation, result.data);
	});
	function hook_up_detection(animation, data)
	{
		const result_div = document.getElementById(result_div_id);
		const current_note = result_div.firstElementChild;
		const detection_log = result_div.lastElementChild;

		let do_log_reset_on_play = true;
		let latest_logged_note = "";

		animation.on_animation_frame(update_display);
		animation.on_animation_stop(prepare_next_run);

		prepare_next_run();

		function prepare_next_run()
		{
			detector.reset();
			current_note.textContent = "";
			latest_logged_note = "";
			do_log_reset_on_play = true;
		}
		function update_display()
		{
			if (do_log_reset_on_play)
			{
				detection_log.textContent = "";
				do_log_reset_on_play = false;
			}

			const note = detector.detect(data, visible_range, resolution);

			current_note.textContent = note;
			if (note !== latest_logged_note)
			{
				detection_log.textContent += " " + note;
				latest_logged_note = note;
			}
		}
	}
}
})();
