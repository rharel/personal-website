export class Vec2 {
  constructor(public x: number, public y: number) {}

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  assign(other: Vec2): Vec2 {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  normalize(): Vec2 {
    const factor = 1 / this.length();
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  set_length(scalar: number): Vec2 {
    const factor = scalar / this.length();
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  add(other: Vec2): Vec2 {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other: Vec2): Vec2 {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  scale(scalar: number): Vec2 {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  length_squared(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distance_squared_to(other: Vec2): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return dx * dx + dy * dy;
  }
}

export function discs_intersect(
  center_1: Vec2,
  radius_1: number,
  center_2: Vec2,
  radius_2: number
): boolean {
  return (
    center_1.distance_squared_to(center_2) <=
    (radius_1 + radius_2) * (radius_1 + radius_2)
  );
}
