(function()
{
// code.stephenmorley.org
function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};

function find_maximum_intensity_bin(bins, range)
{
	let max_bin = 0;
	let max_intensity = 0;

	for (let i = range.min; i < range.max; ++i)
	{
		if (bins[i] > max_intensity)
		{
			max_bin = i;
			max_intensity = bins[i];
		}
	}

	return max_bin;
}

function detect_naively(bins, range, resolution)
{
	const max_bin = find_maximum_intensity_bin(bins, range);
	const max_frequency = (max_bin + 0.5) * resolution;

	return MusicNoteUtilities.Note
		.from_frequency(max_frequency)
		.to_string();
}

function Detector(intensity_threshold, window_size)
{
	this._intensity_threshold = intensity_threshold;
	this._window_size = window_size;

	this._window = new Queue();
	this._count = {};

	this.reset();
}
Detector.prototype =
{
	constructor: Detector,

	push: function(incoming_note)
	{
		const outgoing_note = this._window.dequeue();
		if (outgoing_note !== null)
		{
			this._count[outgoing_note] -= 1;
		}

		this._window.enqueue(incoming_note);

		if (!(incoming_note in this._count))
		{
			this._count[incoming_note] = 0;
		}
		this._count[incoming_note] += 1;
	},

	reset: function()
	{
		while (!this._window.isEmpty()) { this._window.dequeue(); }

		for (let i = 0; i < this._window_size; ++i)
		{
			this._window.enqueue(null);
		}
		for (let note in this._count)
		{
			if (!this._count.hasOwnProperty(note)) { continue; }
			this._count[note] = 0;
		}
	},
	detect: function(bins, range, resolution)
	{
		const max_bin = find_maximum_intensity_bin(bins, range);
		const max_intensity = bins[max_bin];

		if (max_intensity < this._intensity_threshold)
		{
			return "";
		}

		const max_frequency = (max_bin + 0.5) * resolution;
		this.push
		(
			MusicNoteUtilities.Note
				.from_frequency(max_frequency)
				.to_string()
		);

		let dominant_note = "";
		let dominant_note_count = 0;

		for (const note in this._count)
		{
			if (!this._count.hasOwnProperty(note)) { continue; }

			const count = this._count[note];
			if (count > dominant_note_count)
			{
				dominant_note = note;
				dominant_note_count = count;
			}
		}
		return dominant_note;
	}
};

window.PitchDetection =
{
	detect_naively: detect_naively,
	Detector: Detector
};
})();
