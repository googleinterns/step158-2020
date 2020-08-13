export class Mask {
  mask: Set<number> = new Set();
  // Liable to change element datatype; design has not been determined...
  history: Array<Set<number>> = [];

  constructor() { }

  getMask(): Set<number> {
    return this.mask;
  }

  updateMask(newMask: Set<number>): void {
    this.mask = newMask;
    // Change this implementation if element datatype of history is changed.
    this.history.push(this.mask);
  }
}