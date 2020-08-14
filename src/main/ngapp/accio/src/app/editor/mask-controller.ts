export class MaskController {
  private mask: Set<number> = new Set();
  // Liable to change element datatype; design has not been determined...
  history: Array<Set<number>> = [];
  pPresent: number = 0;

  constructor() { }

  // Cannot access mask directly, so that a mask can never be accidentally
  // altered without also changing its history.
  getMask(): Set<number> {
    // Change this implementation if undo/redo design is changed
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

// Class to perform basic set operations
class SetOperator {
  // Ie. [1, 2, 3] union [3, 4, 5] ==> [1, 2, 3, 4, 5]
  static union(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    for (let elem of setB) {
      result.add(elem);
    }

    return result;
  }
  
  // Ie. [1, 2, 3] intersect [3, 4, 5] ==> [3]
  static intersection(setA: Set<number>, setB: Set<number>) {
    let result = new Set();

    for (let elem of setB) {
      if (setA.has(elem)) {
        result.add(elem);
      }
    }

    return result;
  }

  // Ie. [1, 2, 3] difference [3, 4, 5] ==> [1, 2]
  static difference(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    for (let elem of setB) {
      result.delete(elem);
    }

    return result;
  }

  // Ie. [1, 2, 3] symmetricDifference [3, 4, 5] ==> [1, 2, 4, 5]
  static symmetricDifference(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    for (let elem of setB) {
      if (result.has(elem)) {
        result.delete(elem);
      } else {
        result.add(elem);
      }
    }

    return result;
  }
}