import { Injectable } from '@angular/core';
import { MaskController } from './mask-controller';
import { SetOperator } from './set-operator';

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
    // Stores a queue of coords for pixels that we need to visit in "visit".
    const visit: Array<Array<number>> = new Array();
    // Stores already-visited pixels in "visited" as index formatted numbers
    // (as opposed to coord format; for Set funcs).
    const visited: Set<number> = new Set();
    // Uses a set for mask; mainly do iter and set operations on masks...
    const mask: Set<number> = new Set();
    // Represents [R,G,B] attributes of initial pixel.
    const originalPixel: Array<number> =
        this.dataArrayToRgba(imgData, xCoord, yCoord);

    visit.push([xCoord, yCoord]);
    // Converts [x,y] format coord to 1-D equivalent of
    // imgData.data (DataArray).
    const indexAsDataArray: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    visited.add(indexAsDataArray);

    // Loops until no more adjacent pixels within tolerance level.
    while (visit.length !== 0) {
      const coord: Array<number> = visit.pop();
      // Unpacks coord
      const x: number = coord[0];
      const y: number = coord[1];

      // Operational part of while-loop...
      mask.add(this.coordToDataArrayIndex(x, y, imgData.width));

      // Loop part of while-loop...

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
        // Visits the pixel and checks if it should be part of the mask.
        visited.add(this.coordToDataArrayIndex(x, y, imgData.width));
        if (this.getIsMask(originalPixel, imgData, neighborPixel, tolerance)) {
          visit.push(neighborPixel);
        }
      }
    }  // End of while loop...

    return mask;
  }

  /**Judges current pixel's RGB against original pixel's RGB to
   * see if it can still be part of the mask (using tolerance criteria).
   */
  getIsMask(originalPixel: Array<number>, imgData: ImageData,
      pixelCoord: Array<number>, tolerance: number): boolean {
    const curX: number = pixelCoord[0];
    const curY: number = pixelCoord[1];

    // Gets array of the color attributes of current pixel.
    const curPixel: Array<number> = this.dataArrayToRgba(imgData, curX, curY);

    // Color attributes of pixel (R,G, and B) must be within tolerance level.
    for (let i = 0; i < 3; i++) {
      const upperTolerance: boolean = curPixel[i] > originalPixel[i] + tolerance;
      const lowerTolerance: boolean = curPixel[i] < originalPixel[i] - tolerance;
      if (upperTolerance || lowerTolerance) {
        return false;
      }
    }

    return true;
  }

  /**@returns {number} the straight line distance between the two colors
   * @param {Array<number> [R, G, B]} basisColor and 
   * @param {Array<number> [R, G, B]} secondColor
   */
  RgbEuclideanDist(basisColor: Array<number>, secondColor: Array<number>)
      : number {
    if (basisColor.length != secondColor.length) {
      throw new Error(
          'basisColor and secondColor must be same lengthed arrays...');
    }
    if (basisColor.length != 3) {
      throw new Error(
          'Arguments must be an array of [R, G, B] (length == 3)...');
    }

    let distance = 0;

    for (let i = 0; i < basisColor.length; i++) {
      distance += Math.pow((basisColor[i] - secondColor[i]), 2);
    }

    return Math.sqrt(distance);
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


  /**@returns {Array<number> [R, G, B]} color attribute of the pixel at 
   * @param {number} xCoord and 
   * @param {number} yCoord based off of the original image supplied by
   * @param {ImageData} imgData
   */
  dataArrayToRgba(imgData: ImageData, xCoord: number, yCoord: number):
      Array<number> {
    // Unpacks imgData for readability.
    const data: Uint8ClampedArray = imgData.data;
    const imgWidth: number = imgData.width;

    // Pixel attributes in imgData are organized adjacently in a 1-D array.
    const pixelIndex: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgWidth);
    const red: number = data[pixelIndex];
    const green: number = data[pixelIndex + 1];
    const blue: number = data[pixelIndex + 2];
    
    return [red, green, blue];
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
   * @param {Set<number>} originalMask .
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


  /* Smarter flood fill tool */

  scribbleFloodfill(imgData: ImageData, xCoord: number, yCoord: number,
      tolerance: number, scribbles: Set<number>): Set<number> {
    // Stores a queue of coords for pixels that we need to visit in "visit".
    const visit: Array<Array<number>> = new Array();
    // Stores already-visited pixels in "visited" as index formatted numbers
    // (as opposed to coord format; for Set funcs).
    const visited: Set<number> = new Set();
    // Uses a set for mask; mainly do iter and set operations on masks.
    const mask: Set<number> = new Set();
    // Represents [R,G,B] attributes of initial pixel.
    const originalPixel: Array<number> =
        this.dataArrayToRgba(imgData, xCoord, yCoord);

    visit.push([xCoord, yCoord]);
    // Converts [x,y] format to 1-D equivalent of imgData.data (DataArray).
    const indexAsDataArray: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    visited.add(indexAsDataArray);

    // Filters scribbles by removing unnecessary pixels
    scribbles = filterScribbles(scribbles, tolerance);

    // Loops until no more adjacent pixels within tolerance level.
    while (visit.length !== 0) {
      const coord: Array<number> = visit.pop();
      // Unpacks coord.
      const x: number = coord[0];
      const y: number = coord[1];

      // Operational part of while-loop...
      mask.add(this.coordToDataArrayIndex(x, y, imgData.width));

      // Loop part of while-loop...

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
        if (this.getIsScribbleMask(originalPixel, imgData, neighborPixel, tolerance)) {
          visit.push(neighborPixel);
        }
      }
    }  // End of while loop...

    return mask;
  }

  /**Judges current pixel's RGB against original pixel's RGB to
   * see if it can still be part of the mask (using tolerance criteria).
   */
  getIsScribbleMask(originalPixel: Array<number>, imgData: ImageData,
      pixelCoord: Array<number>, tolerance: number, scribbles: Set<number>): boolean {
    const curX: number = pixelCoord[0];
    const curY: number = pixelCoord[1];

    // Gets array of color attributes of current pixel.
    const curPixel: Array<number> = this.dataArrayToRgba(imgData, curX, curY);

    // Color attributes of pixel (R,G, and B) must be within tolerance level.
    for (let i = 0; i < 3; i++) {
      const upperTolerance: boolean = curPixel[i] > originalPixel[i] + tolerance;
      const lowerTolerance: boolean = curPixel[i] < originalPixel[i] - tolerance;
      if (upperTolerance || lowerTolerance) {
        return false;
      }
    }

    return true;
  }

  filterScribbles(scribbles: Set<number>, tolerance: number): Set<number> {
    // TODO
    let result: Set<number> = new Set();
    for (let pixelCoord of scribbles) {
      pixelColor = RgbEuclideanDist();
      if (/* filter condition */) {
        result.add(pixelCoord);
      }
    }

    return result;
  }
}
