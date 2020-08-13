export class Mask {
  private mask: Set<number> = new Set();
  // Liable to change element datatype; design has not been determined...
  history: Array<Set<number>> = [];
  pPresent: number = 0;

  constructor() { }

  // Cannot access mask directly, so that a mask can never be accidentally
  // altered without also changing its history.
  getMask(): Set<number> {
    return this.mask;
  }

  // Whenever the mask is altered, its history also changes.
  do(newMask: Set<number>): void {
    this.mask = newMask;
    // Change this implementation if element datatype of history is changed.
    this.history[++this.pPresent] = this.mask;
    this.history.splice(this.pPresent + 1);
  }

  undo() {/* TODO */}
}