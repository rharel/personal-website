(function()
{
// Computes the bin count of an FFT with given size.
function fft_bin_count(fft_size) { return fft_size / 2; }

// An audio route is a collection of three audio nodes: a source, an analyser,
// and a gain controller. The analyser and gain nodes are fixed, but the source
// node can be swapped at any time.
//
// Audio routes are used to extract time/frequency data from whatever audio
// is being streamed from their source node.
function AudioRoute(context)
{
	this._context = context;

	this._source_node = null;
	this._analyser_node = this._context.createAnalyser();
	this._gain_node = this._context.createGain();

	this._analyser_node.connect(this._gain_node);
	this._gain_node.connect(this._context.destination);
}
AudioRoute.prototype =
{
	constructor: AudioRoute,

	get_byte_frequency_data: function(buffer)
	{
		this._analyser_node.getByteFrequencyData(buffer);
	},
	get_float_frequency_data: function(buffer)
	{
		this._analyser_node.getFloatFrequencyData(buffer);
	},
	get_byte_time_data: function(buffer)
	{
		this._analyser_node.getByteTimeDomainData(buffer);
	},
	get_float_time_data: function(buffer)
	{
		this._analyser_node.getFloatTimeDomainData(buffer);
	},

	get context() { return this._context; },

	get source() { return this._source_node; },
	set source(node)
	{
		if (this._source_node !== null)
		{
			this._source_node.disconnect();
		}
		this._source_node = node;
		this._source_node.connect(this._analyser_node);
	},

	get fft_size() { return this._analyser_node.fftSize; },
	set fft_size(value) { this._analyser_node.fftSize = value|0; },

	get volume() { return this._gain_node.gain.value; },
	set volume(value) { this._gain_node.gain.value = +value; },
};

// An audio system is a wrapper around an audio route that manages and limits
// access to that route to one user at a time.
function AudioSystem(context)
{
	this._route = new AudioRoute(context);
	this._on_release = null;
}
AudioSystem.prototype =
{
	constructor: AudioSystem,

	acquire: function(on_release)
	{
		if (this._on_release === on_release) { return; }

		this.release();
		this._on_release = on_release;
	},
	release: function()
	{
		if (this._on_release === null) { return; }

		this._on_release();
		this._on_release = null;
	},

	get sample_rate() { return this.context.sampleRate; },
	get band_size() { return this.sample_rate / 2; },

	resolution: function(fft_size)
	{
		return this.band_size / fft_bin_count(fft_size);
	},
	recommend_size: function(desired_resolution)
	{
		const exact_recommendation = 2 * this.band_size / desired_resolution;

		// Now find the nearest power of two that is >= the exact
		// recommendation:
		let nearest_power_of_two = 512;
		while (nearest_power_of_two < exact_recommendation)
		{
			nearest_power_of_two *= 2;
		}
		return nearest_power_of_two;
	},

	get context() { return this._route.context; },
	get route() { return this._route; }
};

// An audio clip wraps around an audio buffer and analysis/playback parameters.
// Audio clips are played on the specified audio system.
function AudioClip(audio_system, audio_buffer, volume = 0.25, fft_size = 2048)
{
	this._audio_system = audio_system;
	this._audio_buffer = audio_buffer;
	this._volume = volume;
	this._fft_size = fft_size;

	this._source = null;
	this._is_playing = false;

	this._stop_event_listeners = [];
}
AudioClip.prototype =
{
	constructor: AudioClip,

	play: function()
	{
		if (this._is_playing) { return; }

		this._audio_system.acquire(() => this.stop());

		this._source = this._audio_system.context.createBufferSource();
		this._source.buffer = this._audio_buffer;

		this._audio_system.route.source = this._source;
		this._audio_system.route.volume = this._volume;
		this._audio_system.route.fft_size = this._fft_size;

		this._source.addEventListener("ended", () =>
		{
			if (!this._is_playing) { return; }

			this._audio_system.release();
		});
		this._source.start();
		this._is_playing = true;
	},
	stop: function()
	{
		if (!this._is_playing) { return; }

		this._is_playing = false;
		this._source.stop();
		this._stop_event_listeners.forEach(callback => callback(this));
	},

	on_stop: function(listener)
	{
		this._stop_event_listeners.push(listener);
	},

	get context() { return this._audio_system.context; },
	get route() { return this._audio_system.route; },
	get system() { return this._audio_system; },

	get volume() { return this._volume; },
	set volume(value) { this._volume = +value; },

	get fft_size() { return this._fft_size; },
	set fft_size(value) { this._fft_size = value|0; },

	get fft_bin_count() { return fft_bin_count(this._fft_size); },

	get is_playing() { return this._is_playing; }
};
AudioClip.load_url = (function()
{
	const audio_requests = {};
	const audio_buffers = {};

	return function(url, context, on_success)
	{
		if (audio_buffers.hasOwnProperty(url))
		{
			on_success(audio_buffers[url]);
			return;
		}
		else if (audio_requests.hasOwnProperty(url))
		{
			audio_requests[url].push(buffer => on_success(buffer));
			return;
		}

		const request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";
		request.addEventListener("load", on_response);
		request.send();

		audio_requests[url] = [];

		function on_response()
		{
			context.decodeAudioData(request.response)
			.catch(error =>
				console.log("Could not load audio into buffer: " + error))
			.then(audio_buffer =>
			{
				audio_buffers[url] = audio_buffer;
				audio_requests[url].forEach(callback => callback(audio_buffer));
				audio_requests[url] = [];
				on_success(audio_buffer)
			});
		}
	}
})();
AudioClip.from_url = function(url, audio_system, on_success)
{
	AudioClip.load_url(url, audio_system.context, audio_buffer =>
	{
		on_success(new AudioClip(audio_system, audio_buffer));
	});
};

window.Audio =
{
	fft_bin_count: fft_bin_count,

	Route: AudioRoute,
	System: AudioSystem,
	Clip: AudioClip,

	start_capture: function(audio_route)
	{
		return navigator.mediaDevices.getUserMedia({ audio: true })
		.then(media_stream =>
		{
			audio_route.source =
				audio_route.context.createMediaStreamSource(media_stream);
		});
	}
};
})();
