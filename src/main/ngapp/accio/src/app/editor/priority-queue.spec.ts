import { PriorityQueue } from './priority-queue';

describe('PriorityQueue', () => {
// TODO: Add tests for the following functions:
// compareNodes(),
// percolateUp(), percolateDown(),
// root(), leftChild(), rightChild(), parent(),
// hasParent(), and isNode()
 it('push() and pop()', () => {
   const pq = new PriorityQueue<PixelNode>(comparator);
   pq.push({distance: 42, index: 1});
   pq.push({distance: 23, index: 5});
   pq.push({distance: 2, index: 7});
   pq.push({distance: 34, index: 1});

   expect(pq.pop().distance).toEqual(2);
   expect(pq.pop().distance).toEqual(23);
   expect(pq.pop().distance).toEqual(34);
   expect(pq.pop().distance).toEqual(42);
 });
 it('getSize() and isEmpty()', () => {
   const pq = new PriorityQueue<PixelNode>(comparator);
   pq.push({distance: 42, index: 1});
   pq.push({distance: 23, index: 5});
   expect(pq.getSize()).toEqual(2);

   pq.pop();
   expect(pq.getSize()).toEqual(1);
   expect(pq.isEmpty()).toEqual(false);

   pq.pop();
   expect(pq.isEmpty()).toEqual(true);
 });
});

function comparator(x: PixelNode, y: PixelNode): boolean {
 return x.distance < y.distance;
}

interface PixelNode {
 distance: number,
 index: number
}
