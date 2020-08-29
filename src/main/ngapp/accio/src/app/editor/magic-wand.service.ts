import { Injectable } from '@angular/core';
import { SetOperator } from './set-operator';
import * as KdTree from './kdTree.js';
import { PriorityQueue } from './priority-queue';

@Injectable({
 providedIn: 'root'
})
export class MagicWandService {
  /**4-Way floodfill (left, right, up, down):
   * @returns {Set<number>} set of coordinates(formatted as a 1-D array).
   * Coordinates correspond to pixels considered part of the mask.
   */
  /* tslint:disable */
  floodfill(imgData: ImageData, xCoord: number, yCoord: number,
            tolerance: number): Set<number> {
    // An empty set is given for the scribbles parameter, so only a basic
    // floodfill is performed.
    const scribbles =
      new Set<number>(
        [this.coordToDataArrayIndex(xCoord, yCoord, imgData.width)]);
    return this.doFloodfill(imgData, xCoord, yCoord, tolerance, scribbles);
  }

  // Checks if @pixelCoord is in bounds and makes sure it's not a repeat coord.
  getIsValid(imgWidth: number, imgHeight: number, curX: number, curY: number,
            visited: Set<number>): boolean {
    return this.isInBounds(imgWidth, imgHeight, curX, curY) &&
      this.notVisited(imgWidth, curX, curY, visited);
  }

  // Checks bounds of indexing for img dimensions.
  isInBounds(imgWidth: number, imgHeight: number, curX: number, curY: number):
    boolean {
    let yInBounds: boolean = curY >= 0 && curY < imgHeight;
    let xInBounds: boolean = curX >= 0 && curX < imgWidth;

    return yInBounds && xInBounds;
  }

  // Checks if pixel has been visited already.
  notVisited(imgWidth: number, curX: number, curY: number,
            visited: Set<number>): boolean {
    // Do not push repeating coords to heap...
    const index: number =
      this.coordToDataArrayIndex(curX, curY, imgWidth);

    return !visited.has(index);
  }

  /**@returns {Color} color attributes of the pixel at
   * @param {number} xCoord and
   * @param {number} yCoord based off of the original image supplied by
   * @param {ImageData} imgData
   */
  dataArrayToRgb(imgData: ImageData, xCoord: number, yCoord: number): Color {
    // Unpacks imgData for readability.
    const data: Uint8ClampedArray = imgData.data;
    const imgWidth: number = imgData.width;

    // Pixel attributes in imgData are organized adjacently in a 1-D array.
    const pixelIndex: number =
      this.coordToDataArrayIndex(xCoord, yCoord, imgWidth);
    const red: number = data[pixelIndex];
    const green: number = data[pixelIndex + 1];
    const blue: number = data[pixelIndex + 2];

    return {red: red, green: green, blue: blue};
  }

  // Converts coord [@x, @y] (2-D) to indexing style of DataArray (1-D)
  /**@returns {number} index of the start of the pixel at
   * @param {number} x and
   * @param {number} y
   * (which represents the red attribute of that pixel)
   */
  coordToDataArrayIndex(x: number, y: number, width: number): number {
    return (x + (y * width)) * 4;
  }

  /* -----Additional Tools----- */

  /**@returns {Set<number>} mask that excludes the
   * @param {Set<number>} mistake from original
   * @param {Set<number>} mask
   */
  erase(mask: Set<number>, mistake: Set<number>): Set<number> {
    return SetOperator.difference(mask, mistake);
  }

  /**@returns {Set<number>} mask that excludes the current
   * @param {Set<number>} originalMask
   * Relative container that encompasses @originalMask is based on
   * @param {number} height and
   * @param {number} width
   */
  invert(originalMask: Set<number>, width: number, height: number)
    : Set<number> {
    let invertedMask: Set<number> = new Set();

    for (let pixelX = 0; pixelX < width; pixelX++) {
      for (let pixelY = 0; pixelY < height; pixelY++) {
        const pixelIndex =
          this.coordToDataArrayIndex(pixelX, pixelY, width);

        if (!originalMask.has(pixelIndex)) {
          invertedMask.add(pixelIndex);
        }
      }
    }

    return invertedMask;
  }


  /**Smarter flood fill tool:
   *
   * Compares the tolerance against a set of
   * reference pixels' colors as opposed to just an initial pixel's color.
   * The user supplies a
   * @param {Set<number>} scribbles set of pixels that is used to essentailly
   * expand the range of the tolerance threshold as the floodfill
   * percolates from the first-selected pixel.
   */
  scribbleFloodfill(imgData: ImageData, xCoord: number, yCoord: number,
                    tolerance: number, scribbles: Set<number>): Set<number> {
    return this.doFloodfill(imgData, xCoord, yCoord, tolerance, scribbles);
  }

  /**@returns {Array<object> [{red, green, blue}]} an array of color objects
   * with attributes 'red', 'green', and 'blue'.
   * @param {Set<number>} scribbles contains pixel indices, which are used
   * to produce cooresponding color objects.
   * @param {Set<number>} imgData is used with the 'scribbles' to extract the
   * color values at the pixel indices.
   */
  scribblesToColors(scribbles: Set<number>, imgData: ImageData)
    : Array<Color> {
    let colors: Array<Color> = [];

    for (let pixelIndex of scribbles) {
      if (pixelIndex < 0 || pixelIndex > imgData.data.length - 1) {
        throw RangeError(
          'Pixel index from scribbles set is out of range...');
      }
      if (pixelIndex % 4 !== 0) {
        throw RangeError(
          'Pixel index not pointing to the start of a new pixel...');
      }

      colors.push({
        red: imgData.data[pixelIndex],
        green: imgData.data[pixelIndex + 1],
        blue: imgData.data[pixelIndex + 2]
      });
    }

    return colors;
  }

  /**@returns {Array<number> [x, y]} a 2-D coordinate by converting
   * @param {number} pixelIndex into the coordsponding [x, y] coordinate.
   * @param {number} width should be the pixel width of the image that the
   * pixelIndex belongs to.
   */
  pixelIndexToXYCoord(pixelIndex: number, width: number): Array<number> {
    return [((pixelIndex / 4) % width), (Math.floor((pixelIndex / 4) / width))];
  }

  /**Does the general floodfill algorithm, and switches to
  * scribbleFloodfill() if
  * @param {Set<number>} scribbles is provided as a non-empty set.
  */
  doFloodfill(imgData: ImageData, xCoord: number, yCoord: number,
              tolerance: number, scribbles: Set<number>): Set<number> {
    // Creates an array of color objects from the indices in 'scribbles'.
    // Color object: {red: number, green: number, blue: number}
    const thresholdColors: Array<Color> =
      this.scribblesToColors(scribbles, imgData);
    // Stores a queue of coords for pixels that we need to visit in "visit".
    const visit: Array<Array<number>> = new Array();
    // Stores already-visited pixels in "visited" as index formatted numbers
    // (as opposed to coord format; for Set funcs).
    const visited: Set<number> = new Set();
    // Uses a set for mask; mainly do iter and set operations on masks...
    const mask: Set<number> = new Set();

    visit.push([xCoord, yCoord]);
    // Converts [x,y] format coord to 1-D equivalent of
    // imgData.data (DataArray).
    const indexAsDataArray: number =
      this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    visited.add(indexAsDataArray);

    const tree = new KdTree.kdTree(
      thresholdColors, this.rgbEuclideanDist, ["red", "green", "blue"]);

    const squaredTolerance = tolerance * tolerance;

    // Loops until no more adjacent pixels within tolerance level.
    while (visit.length !== 0) {
      const coord: Array<number> = visit.pop();
      // Unpacks coord.
      const x: number = coord[0];
      const y: number = coord[1];

      // Operational part of while-loop.
      mask.add(this.coordToDataArrayIndex(x, y, imgData.width));

      // Loop part of while-loop.

      // Gets coords of adjacent pixels.
      const neighbors: Array<Array<number>> =
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      // Adds coords of adjacent pixels to the heap.
      for (const neighborPixel of neighbors) {
        const x: number = neighborPixel[0];
        const y: number = neighborPixel[1];
        // Checks if coord is in bounds and has not been visited first.
        if (!this.getIsValid(imgData.width, imgData.height, x, y, visited)) {
          continue;
        }
        // Visits the pixel and check if it should be part of the mask.
        visited.add(this.coordToDataArrayIndex(x, y, imgData.width));

        /* Ref: kdTree.nearest(point, count, maxDistance) */
        if (tree.nearest(
          this.dataArrayToRgb(imgData, x, y),
          1, squaredTolerance).length > 0) {
          visit.push(neighborPixel);
        }
      }
    }  // End of while loop.

    return mask;
  }

  /**@returns {number} the straight line distance between the two colors
   * @param {Array<number> [R, G, B]} basisColor and
   * @param {Array<number> [R, G, B]} secondColor
   * @IMPORTANT
   * Does not sqrt distance to complete Euclidean dist formula b/c sqrt is
   * an expense operation. Instead, can compare against tolerance in the
   * squared space.
   */
  rgbEuclideanDist(colorA: Color, colorB: Color): number {
    const dr = colorA.red - colorB.red;
    const dg = colorA.green - colorB.green;
    const db = colorA.blue - colorB.blue;

    return ((dr * dr) + (dg * dg) + (db * db));
  }

  /**@license MIT License <http://www.opensource.org/licenses/mit-license.php>
   * Pretty good color distance from
   * http://www.compuphase.com/cmetric.htm
   */
  colorDistance(a: Color, b: Color): number {
    const dr = a.red - b.red;
    const dg = a.green - b.green;
    const db = a.blue - b.blue;
    const redMean = (a.red + b.red)/2;
    return (2+redMean/256)*dr*dr + 4*dg*dg + (2 + (255 - redMean)/256)*db*db;
  }


  /* Code for 'preview' algorithm */

  comparator(x: PixelNode, y: PixelNode): boolean {
    return x.distance < y.distance;
  }

  /**Runs shortest paths algo to find shortest distance from input pixel
   * to every other pixel.
   * Distance is judged by the pixel's colorDistance in relation to the input 
   * pixel.
   * @returns Array<number> distances, with indices representing the pixel coord
   * and values representing the shortest distance of that pixel coord.
   */
  getShortestPaths(imgData: ImageData, xCoord: number, yCoord: number,
      toleranceLimit: number): Array<number> {
    // Stores a queue of coords for pixels that we need to visit in "visit".
    const toVisit: PriorityQueue<PixelNode> = 
        new PriorityQueue(this.comparator);
    const distances: Array<number> = [];
    distances.fill(undefined, 0, imgData.data.length / 4 + 1);

    // Stores already-visited pixels in "visited" as index formatted numbers
    // (as opposed to coord format; for Set funcs).
    const visited: Set<number> = new Set();

    const vanillaPixelColor: Color = 
        this.dataArrayToRgb(imgData, xCoord, yCoord);

    const vanillaIndex: number = 
        this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    toVisit.push({
        distance: 0,
        index: vanillaIndex / 4});

    distances[vanillaIndex / 4] = 0;

    // Works with tolerance limit in the squared space.
    toleranceLimit *= toleranceLimit;

    // Updates shortest path between neighbor pixel and vanilla node.
    while (toVisit.getSize() !== 0) {
      const curPixelNode: PixelNode = toVisit.pop();
      // A node is considered visited once popped.
      visited.add(curPixelNode.index);

      // Gets coords of adjacent pixels.
      let x: number, y: number;
      [x, y] = this.pixelIndexToXYCoord(curPixelNode.index * 4, imgData.width);
      const neighbors: Array<Array<number>> =
          [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];

      for (const neighborPixel of neighbors) {
        const neighborX: number = neighborPixel[0];
        const neighborY: number = neighborPixel[1];
        const neighborIndex: number =
            this.coordToDataArrayIndex(neighborX, neighborY, imgData.width);
        const neighborIndexReduced = neighborIndex / 4;

        // Checks if coord is in bounds and has not been visited first.
        if (visited.has(neighborIndexReduced) ||
            !this.isInBounds(
            imgData.width, imgData.height, neighborX, neighborY)) {
          continue;
        }

        const neighborPixelColor: Color =
            this.dataArrayToRgb(imgData, neighborX, neighborY);
        const neighborColorDist: number =
            this.rgbEuclideanDist(neighborPixelColor, vanillaPixelColor);

        // Sets a limit to how far (color-wise) we search the image
        // for 'mask-pixels'.
        if (neighborColorDist > toleranceLimit) {
          continue;
        }

        distances[neighborIndexReduced] =
            Math.max(curPixelNode.distance, neighborColorDist);

        // Continues lifespan of the loop.
        toVisit.push({
          distance: distances[neighborIndexReduced],
          index: neighborIndexReduced});
      }
    }  // End of while loop.

    return distances;
  }

  /**Finds shortest paths to every pixel from the vanilla pixel, and 
   * adds organizes those distances into an array within a
   * @returns {PreviewMask} previewMask object.
   */
  getPreviews(imgData: ImageData, xCoord: number, yCoord: number,
      toleranceLimit: number): PreviewMask {
    const shortestPaths: Array<number> =
        this.getShortestPaths(imgData, xCoord, yCoord, toleranceLimit);
    const previewMask: PreviewMask = new PreviewMask(toleranceLimit);

    let tolerance: number;

    for (let i = 0; i < imgData.data.length / 4; i++) {
      // Reducing tolerance to the root reduces the number of iterations
      // inside PreviewMask.masksAtTolerance()
      tolerance = Math.ceil(Math.sqrt(shortestPaths[i]));
      // Pixel index is i * 4.
      if (previewMask.masksByTolerance[tolerance] === undefined) {
        previewMask.masksByTolerance[tolerance] = [];
      }
      previewMask.masksByTolerance[tolerance].push(i * 4);
    }

    return previewMask;
  }
}

interface Color {
  red: number,
  green: number,
  blue: number
}

interface PixelNode {
  distance: number,
  index: number
}

  /**Tracks all versions of masks for 'preview' of floodfill.
   * Versions are based on different tolerance levels.
   **/
export class PreviewMask {
  masksByTolerance: Array<Array<number>> = [];
  private toleranceIndex = -1;
  private presentMask: Array<number> = [];

  constructor(toleranceLimit: number) {
    this.masksByTolerance.fill(undefined, 0, toleranceLimit + 2);
  }

  /**@returns {Set<number>} the complete floodfilled mask for
   * the given 
   * @param {number} tolerance level.
   */
  public changeMaskBy(tolerance: number): void {
    if (tolerance < 0) {
      throw new Error('Tolerance input must be a non-negative number...');
    }
    let action: Array<number>;

    while (this.toleranceIndex > tolerance) {
      action = this.masksByTolerance[this.toleranceIndex--];

      if (action === undefined) {
        continue;
      }
      action.forEach(() => {
        this.presentMask.pop();
      });
    }

    while (this.toleranceIndex < tolerance) {
      action = this.masksByTolerance[++this.toleranceIndex];

      if (action === undefined) {
        continue;
      }
      action.forEach(pixelIndex => {
        this.presentMask.push(pixelIndex);
      });
    }
  }

  public getMaskAsSet(): Set<number> {
    return new Set<number>(this.presentMask);
  }

  public getMaskAsArray(): Array<number> {
    return this.presentMask;
  }
}