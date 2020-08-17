import { SetOperator } from './set-operator';

describe('SetOperator', () => {
 // TODO
 const setA = new Set([1, 2, 3, 4]);
 const setB = new Set([3, 4, 5, 6]);

 it('should operate union correctly', () => {
   const expectedSet = new Set([1, 2, 3, 4, 5, 6]);
   expect(SetOperator.union(setA, setB)).toEqual(expectedSet);
 });
 it('should operate intersection correctly', () => {
   const expectedSet = new Set([3, 4]);
   expect(SetOperator.intersection(setA, setB)).toEqual(expectedSet);
 });
 it('should operate difference', () => {
   const expectedSet = new Set([1, 2]);
   expect(SetOperator.difference(setA, setB)).toEqual(expectedSet);
 });
 it('should operate symmetricDifference', () => {
   const expectedSet = new Set([1, 2, 5, 6]);
   expect(SetOperator.symmetricDifference(setA, setB)).toEqual(expectedSet);
 });
});

