var CurveCompressor;
(function (CurveCompressor) {
    var Internal;
    (function (Internal) {
        var Vector2D = (function () {
            function Vector2D(x, y) {
                this.x = x;
                this.y = y;
            }
            Vector2D.duplicate = function (source) {
                return new Vector2D(source.x, source.y);
            };
            Vector2D.angle = function (a, b) {
                return Math.acos(a.unit().dot(b.unit()));
            };
            Vector2D.prototype.add = function (other) {
                return new Vector2D(this.x + other.x, this.y + other.y);
            };
            Vector2D.prototype.subtract = function (other) {
                return new Vector2D(this.x - other.x, this.y - other.y);
            };
            Vector2D.prototype.multiply = function (scalar) {
                return new Vector2D(this.x * scalar, this.y * scalar);
            };
            Vector2D.prototype.divide = function (scalar) {
                return new Vector2D(this.x / scalar, this.y / scalar);
            };
            Vector2D.prototype.dot = function (other) {
                return this.x * other.x +
                    this.y * other.y;
            };
            Vector2D.prototype.length_squared = function () {
                return this.dot(this);
            };
            Vector2D.prototype.length = function () {
                return Math.sqrt(this.length_squared());
            };
            Vector2D.prototype.unit = function () {
                return this.divide(this.length());
            };
            return Vector2D;
        }());
        Internal.Vector2D = Vector2D;
    })(Internal = CurveCompressor.Internal || (CurveCompressor.Internal = {}));
})(CurveCompressor || (CurveCompressor = {}));
var CurveCompressor;
(function (CurveCompressor) {
    var Vector2D = CurveCompressor.Internal.Vector2D;
    function compress_strip(vertices, tolerance) {
        if (vertices.length < 3) {
            return vertices;
        }
        tolerance = Math.max(tolerance, 0.0) * Math.PI;
        var source = vertices.map(function (p) { return Vector2D.duplicate(p); });
        var compressed = source.slice(0, 2);
        for (var i = 2; i < source.length - 1; ++i) {
            var n = compressed.length;
            var a = compressed[n - 2];
            var b = compressed[n - 1];
            var c = source[i];
            if (compute_error(a, b, c) > tolerance) {
                compressed.push(c);
            }
            else {
                compressed[n - 1] = c;
            }
        }
        compressed.push(source[source.length - 1]);
        return compressed;
    }
    CurveCompressor.compress_strip = compress_strip;
    function compute_error(a, b, c) {
        var ab = b.subtract(a);
        var bc = c.subtract(b);
        return Vector2D.angle(ab, bc);
    }
})(CurveCompressor || (CurveCompressor = {}));
var CurveCompressor;
(function (CurveCompressor) {
    var Internal;
    (function (Internal) {
        function clamp(value, lower_bound, upper_bound) {
            return Math.max(Math.min(value, upper_bound), lower_bound);
        }
        Internal.clamp = clamp;
    })(Internal = CurveCompressor.Internal || (CurveCompressor.Internal = {}));
})(CurveCompressor || (CurveCompressor = {}));
//# sourceMappingURL=CurveCompressor.js.map