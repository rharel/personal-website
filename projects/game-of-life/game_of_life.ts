export type CellCoords = { x: number; y: number };

export class WorldState {
  constructor(readonly width: number, readonly height: number) {
    this.cells = new Uint8Array(width * height);
  }

  cell_index(x: number, y: number): number {
    return x + y * this.width;
  }

  get(x: number, y: number): boolean {
    return (
      0 <= x &&
      x < this.width &&
      0 <= y &&
      y < this.height &&
      this.cells[this.cell_index(x, y)] !== 0
    );
  }

  set(x: number, y: number, alive: boolean) {
    this.cells[this.cell_index(x, y)] = +alive;
  }

  private readonly cells: Uint8Array;
}

export function advance(
  current_state: WorldState,
  future_state: WorldState
): CellCoords[] {
  if (
    current_state.width !== future_state.width ||
    current_state.height !== future_state.height
  ) {
    throw new Error("world dimension mismatch");
  }
  const change_coords: CellCoords[] = [];
  for (let x = 0; x < current_state.width; x += 1) {
    for (let y = 0; y < current_state.height; y += 1) {
      const nr_living_neighbors =
        +current_state.get(x - 1, y - 1) +
        +current_state.get(x - 1, y) +
        +current_state.get(x - 1, y + 1) +
        +current_state.get(x, y - 1) +
        +current_state.get(x, y + 1) +
        +current_state.get(x + 1, y - 1) +
        +current_state.get(x + 1, y) +
        +current_state.get(x + 1, y + 1);
      future_state.set(
        x,
        y,
        current_state.get(x, y)
          ? nr_living_neighbors === 2 || nr_living_neighbors === 3
          : nr_living_neighbors === 3
      );
      if (future_state.get(x, y) !== current_state.get(x, y)) {
        change_coords.push({ x, y });
      }
    }
  }
  return change_coords;
}
