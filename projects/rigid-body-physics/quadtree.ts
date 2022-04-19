export class BoundingBox {
  readonly bottom: number;
  readonly right: number;

  constructor(
    readonly top: number,
    readonly left: number,
    readonly width: number,
    readonly height: number
  ) {
    this.bottom = this.top - this.height;
    this.right = this.left + this.width;
  }

  static from_center_and_radius(
    center_x: number,
    center_y: number,
    radius: number
  ): BoundingBox {
    return new BoundingBox(
      center_y + radius,
      center_x - radius,
      radius,
      radius
    );
  }

  overlaps(other: BoundingBox): boolean {
    return (
      other.left <= this.right &&
      other.right >= this.left &&
      other.bottom <= this.top &&
      other.top >= this.bottom
    );
  }
}

export class QuadTree<T> {
  constructor(readonly depth: number, readonly bounds: BoundingBox) {
    if (this.depth < 1) {
      throw new Error("quadtree node cannot have depth < 1");
    } else if (this.depth === 1) {
      this.node = { kind: "leaf", items: [] };
    } else if (this.depth > 1) {
      const child_depth = depth - 1;
      const y = this.bounds.top;
      const x = this.bounds.left;
      const w2 = 0.5 * this.bounds.width;
      const h2 = 0.5 * this.bounds.height;
      this.node = {
        kind: "internal",
        sw: new QuadTree(child_depth, new BoundingBox(y - h2, x, w2, h2)),
        se: new QuadTree(child_depth, new BoundingBox(y - h2, x + w2, w2, h2)),
        nw: new QuadTree(child_depth, new BoundingBox(y, x, w2, h2)),
        ne: new QuadTree(child_depth, new BoundingBox(y, x + w2, w2, h2)),
      };
    }
  }

  nr_items(): number {
    if (this.node.kind === "leaf") {
      return this.node.items.length;
    } else {
      let sum = 0;
      this.for_each_child((child) => (sum += child.nr_items()));
      return sum;
    }
  }

  clear() {
    if (this.node.kind === "leaf") {
      this.node.items.length = 0;
    } else {
      this.for_each_child((child) => child.clear());
    }
  }

  add(entity: T, target_bounds: BoundingBox): void {
    if (!target_bounds.overlaps(this.bounds)) {
      return;
    } else if (this.node.kind === "internal") {
      this.for_each_child((child) => {
        if (child.bounds.overlaps(target_bounds)) {
          child.add(entity, target_bounds);
        }
      });
    } else if (!this.node.items.includes(entity)) {
      this.node.items.push(entity);
    }
  }

  remove(entity: T, target_bounds: BoundingBox): void {
    if (!target_bounds.overlaps(this.bounds)) {
      return;
    } else if (this.node.kind === "internal") {
      this.for_each_child((child) => {
        if (child.bounds.overlaps(target_bounds)) {
          child.remove(entity, target_bounds);
        }
      });
    } else if (this.node.items.includes(entity)) {
      const index = this.node.items.indexOf(entity);
      this.node.items.splice(index, 1);
    }
  }

  for_each_child(callback: (node: QuadTree<T>) => void) {
    if (this.node.kind === "leaf") {
      return;
    }
    callback(this.node.sw);
    callback(this.node.se);
    callback(this.node.nw);
    callback(this.node.ne);
  }

  for_each_leaf_with_at_least(
    threshold: number,
    callback: (items: T[]) => void
  ) {
    if (this.nr_items() < threshold) {
      return;
    } else if (this.node.kind === "leaf") {
      callback(this.node.items);
    } else {
      this.for_each_child((child) =>
        child.for_each_leaf_with_at_least(threshold, callback)
      );
    }
  }

  private readonly node:
    | { kind: "leaf"; items: T[] }
    | {
        kind: "internal";
        sw: QuadTree<T>;
        se: QuadTree<T>;
        nw: QuadTree<T>;
        ne: QuadTree<T>;
      } = { kind: "leaf", items: [] };
}
