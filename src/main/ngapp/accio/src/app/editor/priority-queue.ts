export class PriorityQueue<T> {
 private _comparator;
 private _items: Array<T> = [];
 private _curSize: number = 0;

 constructor(comparator: (x: T, y: T) => boolean) {
   this._comparator = comparator;
 }

 private root(): number {
   return 0;
 }

 private parent(n: number): number {
   return Math.floor((n - 1) / 2);
 }

 private leftChild(n: number): number {
   return 2 * n + 1;
 }

 private rightChild(n: number): number {
   return 2 * n + 2;
 }

 private hasParent(n: number): boolean {
   return n !== this.root();
 }

 private isNode(n: number): boolean {
   return n < this._curSize;
 }

 private compareNodes(i: number, j: number): boolean {
   return this._comparator(this._items[i], this._items[j]);
 }

 private percolateUp(n: number): void {
   while (this.hasParent(n) && this.compareNodes(n, this.parent(n))) {
     const temp = this._items[this.parent(n)];
     this._items[this.parent(n)] = this._items[n];
     this._items[n] = temp;

     n = this.parent(n);
   }
 }

 private percolateDown(n: number): void {
   while (this.isNode(this.leftChild(n))) {
     let child = this.leftChild(n);

     if (this.isNode(this.rightChild(n)) &&
         this.compareNodes(this.rightChild(n), this.leftChild(n))) {
       child = this.rightChild(n);
     }

     if (this.compareNodes(child, n)) {
       const temp = this._items[child];
       this._items[child] = this._items[n];
       this._items[n] = temp;
     } else {
       break;
     }

     n = child;
   }
 }

 public getSize(): number {
   return this._curSize;
 }

 public isEmpty(): boolean {
   return this._curSize === 0;
 }

 public top(): T {
   if (this.isEmpty()) {
     throw new Error('Priority queue is empty...');
   }

   return this._items[this.root()];
 }

 public pop(): T {
   const item = this._items[this.root()];
   this._items[this.root()] = this._items.pop();
   this._curSize--;
   this.percolateDown(this.root());

   return item;
 }

 public push(item): void {
   this._items.push(item);

   this.percolateUp(this._curSize);
   this._curSize++;
 }
}

