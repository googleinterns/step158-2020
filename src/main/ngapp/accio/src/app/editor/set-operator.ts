// Class to perform basic set operations
export class SetOperator {
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