"use strict";

/// A module that provides musical-note-related utilities.
///
/// We provide methods for note object construction/conversion from/to
/// frequency, indices, MIDI numbers, string representations, or explicit
/// specification of pitch class + octave + accidental modifications.
(function () {
	/// The frequency of A4 (in Hz) to use in some frequency-related computations.
	var A4_frequency = 440;

	/// Creates a new pitch class object.
	function _PitchClass(index, index_in_octave, letter) {
		this._index = index;
		this._index_in_octave = index_in_octave;
		this._letter = letter;
	}
	_PitchClass.prototype = {
		constructor: _PitchClass,

		get index() {
			return this._index;
		},
		get index_in_octave() {
			return this._index_in_octave;
		},
		get letter() {
			return this._letter;
		}
	};
	/// A list of pitch classes A-G.
	_PitchClass.list = [new _PitchClass(0, 9, "A"), new _PitchClass(1, 11, "B"), new _PitchClass(2, 0, "C"), new _PitchClass(3, 2, "D"), new _PitchClass(4, 4, "E"), new _PitchClass(5, 5, "F"), new _PitchClass(6, 7, "G")];
	/// Enumerates a note's pitch classes.
	var PitchClass = {
		get A() {
			return PitchClass.with_index(0);
		},
		get B() {
			return PitchClass.with_index(1);
		},
		get C() {
			return PitchClass.with_index(2);
		},
		get D() {
			return PitchClass.with_index(3);
		},
		get E() {
			return PitchClass.with_index(4);
		},
		get F() {
			return PitchClass.with_index(5);
		},
		get G() {
			return PitchClass.with_index(6);
		},

		/// Returns a new object representing the pitch class at the specified
		/// index (index must be in [0, 6]).
		///
		/// The returned object has the following structure:
		/// {
		/// 	index: Integer,
		/// 	index_in_octave: Integer,
		/// 	letter: String
		/// }
		/// index:
		/// 	The specified index (0 for A, up to 6 for G).
		/// index_in_octave:
		///	 	The index of the natural note with the specified pitch class
		///     relative to C (0 for C, up to 11 for B).
		/// letter:
		/// 	The letter used to denote the pitch class ("A"-"G").
		with_index: function with_index(index) {
			return _PitchClass.list[index];
		}
	};

	/// Creates a new accidental object.
	function _Accidental(shift, symbol) {
		this._shift = shift;
		this._symbol = symbol;
	}
	_Accidental.prototype = {
		get shift() {
			return this._shift;
		},
		get symbol() {
			return this._symbol;
		}
	};
	_Accidental.None = new _Accidental(0, "");
	_Accidental.Sharp = new _Accidental(1, "#");
	_Accidental.Flat = new _Accidental(-1, "b");
	/// Enumerates a note's accidental modifications.
	var Accidental = {
		/// A note with no accidental: A
		get None() {
			return _Accidental.None;
		},

		/// A sharpened note: A#
		get Sharp() {
			return _Accidental.Sharp;
		},

		/// A flattened note: Ab
		get Flat() {
			return _Accidental.Flat;
		}
	};

	/// Creates a new note object with the specified properties.
	///
	/// # Parameters
	///
	/// pitch_class: a member of the PitchClass enumeration.
	/// accidental: a member of the Accidental enumeration.
	/// octave: an Integer,
	function Note(pitch_class) {
		var accidental = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Accidental.None;
		var octave = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4;

		this._pitch_class = pitch_class;
		this._accidental = accidental;
		this._octave = octave;
	}
	Note.prototype = {
		constructor: Note,

		/// Returns a new note that is identical to this one.
		clone: function clone() {
			return new Note(this._pitch_class, this._accidental, this._octave);
		},

		/// Indicates whether this note equals another.
		equals: function equals(other) {
			return this.index() === other.index();
		},

		/// Returns a new note that is the transpose of this one by the specified
		/// shift (in semi-tones).
		transpose: function transpose(shift) {
			return new Note.from_index(this.index() + shift);
		},

		/// Returns a new natural note with the same pitch class and octave as this
		/// one.
		natural: function natural() {
			return new Note(this._pitch_class, Accidental.None, this._octave);
		},
		/// Returns a new sharp note with the same pitch class and octave as this
		/// one.
		sharp: function sharp() {
			return new Note(this._pitch_class, Accidental.Sharp, this._octave);
		},
		/// Returns a new flat note with the same pitch class and octave as this
		/// one.
		flat: function flat() {
			return new Note(this._pitch_class, Accidental.Flat, this._octave);
		},

		/// Computes the note's index relative to A4.
		index: function index() {
			return this.C4_index() - 9;
		},
		/// Computes the note's index relative to C4.
		C4_index: function C4_index() {
			return (this._octave - 4) * 12 + this._pitch_class.index_in_octave + this._accidental.shift;
		},

		/// Computes the note's MIDI number.
		midi_number: function midi_number() {
			return this.index() + 69;
		},
		/// Computes the note's frequency (in Hz).
		frequency: function frequency() {
			return NoteIndex.to_frequency(this.index());
		},

		/// Indicates whether this note is accidental.
		is_accidental: function is_accidental() {
			return this._accidental !== Accidental.None;
		},
		/// Indicates whether this note is natural.
		is_natural: function is_natural() {
			return !this.is_accidental();
		},

		/// Converts this note to its string representation.
		to_string: function to_string() {
			return this._pitch_class.letter + this._accidental.symbol + this._octave;
		},

		get pitch_class() {
			return this._pitch_class;
		},
		get accidental() {
			return this._accidental;
		},
		get octave() {
			return this._octave;
		}
	};

	/// Creates the note object whose frequency is nearest to the specified value
	/// (in Hz).
	Note.from_frequency = function (frequency) {
		return Note.from_index(NoteIndex.from_frequency(frequency));
	};
	/// Creates a new note object representing the note with the specified index.
	///
	/// By a musical note's index, we refer to its half-step distance to A4,
	/// which is positive for notes above it and negative for those below.
	/// For example: A4's index is zero, A5's is 12 and that of A3 is -12.
	///
	/// #Notes
	///
	/// If the specified note is an ambiguous accidental
	/// (for example: A4#/B4b both have index 1), then the note returned will
	/// represent the sharp variant.
	///
	/// Non-integer indices are rounded.
	Note.from_index = function (index) {
		index = Math.round(index);

		return new Note(NoteIndex.to_pitch_class(index), NoteIndex.is_accidental(index) ? Accidental.Sharp : Accidental.None, NoteIndex.to_octave(index));
	};
	/// Creates a new note object representing the note with the specified MIDI
	/// number.
	Note.from_midi_number = function (midi_number) {
		return Note.from_index(midi_number - 69);
	};
	/// Creates a new note object representing the specified string.
	///	If the specified string could not be parsed, returns null instead.
	///
	/// # Parameters
	///
	/// string:
	/// 	String of the form: "<pitch class>[<accidental>][<octave>]",
	///		where <pitch class> is one of {A, B, C, D, E, F, G},
	///		<accidental> is one of {#, b}, and <octave> is an integer.
	///
	/// # Notes
	///
	/// <pitch class> is case-sensitive.
	/// If <octave> is not specified, it is assumed to be 4.
	Note.from_string = function (string) {
		if (string.length === 0) {
			return null;
		}

		var letter = string[0];
		if (!PitchClass.hasOwnProperty(letter)) {
			return null;
		}

		var pitch_class = PitchClass[letter];

		if (string.length === 1) {
			return new Note(pitch_class);
		}

		var accidental = void 0;
		switch (string[1]) {
			case Accidental.Sharp.symbol:
				accidental = Accidental.Sharp;break;
			case Accidental.Flat.symbol:
				accidental = Accidental.Flat;break;
			default:
				accidental = Accidental.None;
		}
		if (string.length === 2 && accidental !== Accidental.None) {
			return new Note(pitch_class, accidental, 4);
		}

		var octave = void 0;
		if (accidental !== Accidental.None) {
			octave = parseInt(string.slice(2));
		} else {
			octave = parseInt(string.slice(1));
		}
		if (isNaN(octave)) {
			return null;
		}

		return new Note(pitch_class, accidental, octave);
	};

	/// Creates a new A note.
	Note.A = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._A(accidental, octave);
	};
	/// Creates a new B note.
	Note.B = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._B(accidental, octave);
	};
	/// Creates a new C note.
	Note.C = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._C(accidental, octave);
	};
	/// Creates a new D note.
	Note.D = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._D(accidental, octave);
	};
	/// Creates a new E note.
	Note.E = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._E(accidental, octave);
	};
	/// Creates a new F note.
	Note.F = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._F(accidental, octave);
	};
	/// Creates a new G note.
	Note.G = function () {
		var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
		var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

		return Note._G(accidental, octave);
	};
	(function () {
		_PitchClass.list.forEach(function (pitch_class) {
			Note["_" + pitch_class.letter] = function () {
				var accidental = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Accidental.None;
				var octave = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

				return new Note(pitch_class, accidental, octave);
			};
		});
	})();

	/// Container for methods involving note indices.
	///
	/// By a musical note's index, we refer to its half-step distance to A4,
	/// which is positive for notes above it and negative for those below.
	/// For example: A4's index is zero, A5's is 12 and that of A3 is -12.
	var NoteIndex = {
		/// Computes the index of the note with frequency nearest to the specified
		/// value (in Hz).
		from_frequency: function from_frequency(frequency) {
			var log2 = Math.log2;
			var round = Math.round;

			return round(log2(frequency / A4_frequency) * 12);
		},
		/// Computes the frequency (in Hz) of the note with the specified index.
		to_frequency: function to_frequency(index) {
			return Math.pow(2, index / 12) * A4_frequency;
		},

		/// Computes the pitch class of the note with the specified index.
		to_pitch_class: function () {
			// Pairs a note's normalized index with its pitch class.
			// Accidentals are paired with the note below them.
			var PITCH_CLASS_INDEX_BY_NORMALIZED_INDEX = [0, 0, // A, A#
			1, // B
			2, 2, // C, C#
			3, 3, // D, D#
			4, // E
			5, 5, // F, F#
			6, 6 // G, G#
			];
			return function (index) {
				return PitchClass.with_index(PITCH_CLASS_INDEX_BY_NORMALIZED_INDEX[NoteIndex.normalize(index)]);
			};
		}(),
		/// Computes the octave of the note with the specified index.
		to_octave: function to_octave(index) {
			var index_relative_to_C4 = index + 9;
			return 4 + Math.floor(index_relative_to_C4 / 12);
		},
		/// Indicates whether the note with the specified index is an accidental.
		is_accidental: function () {
			// The normalized indices of accidentals
			var ACCIDENTAL_NORMALIZED_INDICES = [1, 4, 6, 9, 11];

			return function (index) {
				return ACCIDENTAL_NORMALIZED_INDICES.includes(NoteIndex.normalize(index));
			};
		}(),

		/// Normalizes the specified note index with relation to the next A note
		/// whose pitch is <= that of itself.
		normalize: function normalize(index) {
			var remainder = index % 12;
			return remainder < 0 ? 12 + remainder : remainder;
		}
	};

	var MusicNoteUtilities = {
		PitchClass: PitchClass,
		Accidental: Accidental,

		Note: Note,
		NoteIndex: NoteIndex,

		get A4_frequency() {
			return A4_frequency;
		},
		set A4_frequency(value) {
			A4_frequency = +value;
		}
	};
	if (typeof window !== "undefined") {
		window.MusicNoteUtilities = MusicNoteUtilities;
	}
	if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
		module.exports = MusicNoteUtilities;
	}
})();