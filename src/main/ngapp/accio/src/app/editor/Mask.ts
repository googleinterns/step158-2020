export class Mask {
  private mask: Set<number> = new Set();
  // Liable to change element datatype; design has not been determined...
  history: Array<Set<number>> = [];

  constructor() { }

  // Cannot access mask directly, so that a mask can never be accidentally
  // altered without also changing its history.
  getMask(): Set<number> {
    return this.mask;
  }

  // Whenever the mask is altered, its history also changes.
  updateMask(newMask: Set<number>): void {
    this.mask = newMask;
    // Change this implementation if element datatype of history is changed.
    this.history.push(this.mask);
  }
}