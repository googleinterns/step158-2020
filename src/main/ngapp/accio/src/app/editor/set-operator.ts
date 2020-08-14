// Perform basic set operations
export class SetOperator {
  // Ie. [1, 2, 3] union [3, 4, 5] ==> [1, 2, 3, 4, 5]
  static union(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    setB.forEach(element => {
      result.add(element)
    });

    return result;
  }
  
  // Ie. [1, 2, 3] intersect [3, 4, 5] ==> [3]
  static intersection(setA: Set<number>, setB: Set<number>) {
    let result = new Set();

    setB.forEach(element => {
      if (setA.has(element)) {
        result.add(element);
      }
    });

    return result;
  }

  // Ie. [1, 2, 3] difference [3, 4, 5] ==> [1, 2]
  static difference(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    setB.forEach(element => {
      result.delete(element);
    });

    return result;
  }

  // Ie. [1, 2, 3] symmetricDifference [3, 4, 5] ==> [1, 2, 4, 5]
  static symmetricDifference(setA: Set<number>, setB: Set<number>) {
    let result = new Set(setA);

    setB.forEach(element => {
      if (result.has(element)) {
        result.delete(element);
      } else {
        result.add(element);
      }
    });

    return result;
  }
}