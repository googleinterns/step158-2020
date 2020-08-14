import { Injectable } from '@angular/core';
import { MaskController } from './mask-controller';
import { SetOperator } from './set-operator';

@Injectable({
  providedIn: 'root'
})
export class MagicWandService {
  /**4-Way floodfill (left, right, up, down):
   * Return set of coordinates(formatted as a 1-D array).
   * Coordinates correspond to pixels considered part of the mask.
   */
  /* tslint:disable */
  floodfill(imgData: ImageData, xCoord: number, yCoord: number,
      tolerance: number): Set<number> {
    /**Store a queue of coords for pixels that we need to visit in "visit".
     * Store already-visited pixels in "visited" as index formatted numbers
     * (as opposed to coord format; for Set funcs).
     */
    const visit: Array<Array<number>> = new Array();
    const visited: Set<number> = new Set();
    // Use a set for mask; mainly do iter and set operations on masks
    const mask: Set<number> = new Set();
    // Represent [R,G,B,A] attributes of initial pixel
    const originalPixel: Array<number> =
        this.dataArrayToRgba(imgData, xCoord, yCoord);

    visit.push([xCoord, yCoord]);
    // Convert [x,y] format coord to 1-D equivalent of imgData.data (DataArray)
    const indexAsDataArray: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    visited.add(indexAsDataArray);

    // Loop until no more adjacent pixels within tolerance level
    while (visit.length !== 0) {
      const coord: Array<number> = visit.pop();
      // Unpack coord
      const x: number = coord[0];
      const y: number = coord[1];

      // Operational part of while-loop
      mask.add(this.coordToDataArrayIndex(x, y, imgData.width));

      // Loop part of while-loop

      // Get coords of adjacent pixels
      const neighbors: Array<Array<number>> =
          [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      // Add coords of adjacent pixels to the heap
      for (const neighborPixel of neighbors) {
        const x: number = neighborPixel[0];
        const y: number = neighborPixel[1];
        // Check if coord is in bounds and has not been visited first
        if (!this.getIsValid(imgData.width, imgData.height, x, y, visited)) {
          continue;
        }
        // Visit the pixel and check if it should be part of the mask
        visited.add(this.coordToDataArrayIndex(x, y, imgData.width));
        if (this.getIsMask(originalPixel, imgData, neighborPixel, tolerance)) {
          visit.push(neighborPixel);
        }
      }
    }  // end of while loop

    return mask;
  }

  /**Judge current pixel's RGBA against original pixel's RGBA to
   * see if it can still be part of the mask (using tolerance criteria).
   */
  getIsMask(originalPixel: Array<number>, imgData: ImageData,
      pixelCoord: Array<number>, tolerance: number): boolean {
    const curX: number = pixelCoord[0];
    const curY: number = pixelCoord[1];

    // Get array of attributes of current pixel
    const curPixel: Array<number> = this.dataArrayToRgba(imgData, curX, curY);

    // All attributes of the pixel (R,G,B, and A) must be within tolerance level
    for (let i = 0; i < 4; i++) {
      const upperTolerance: boolean = curPixel[i] > originalPixel[i] + tolerance;
      const lowerTolerance: boolean = curPixel[i] < originalPixel[i] - tolerance;
      if (upperTolerance || lowerTolerance) {
        return false;
      }
    }

    return true;
  }

  // Check if @pixelCoord is in bounds and makes sure it's not a repeat coord
  getIsValid(imgWidth: number, imgHeight: number, curX: number, curY: number,
      visited: Set<number>): boolean {
    return this.isInBounds(imgWidth, imgHeight, curX, curY) &&
        this.notVisited(imgWidth, curX, curY, visited);
  }

  // Check bounds of indexing for img dimensions
  isInBounds(imgWidth: number, imgHeight: number, curX: number, curY: number):
      boolean {
    let yInBounds: boolean = curY >= 0 && curY < imgHeight;
    let xInBounds: boolean = curX >= 0 && curX < imgWidth;

    return yInBounds && xInBounds;
  }

  // Checks if pixel has been visited already
  notVisited(imgWidth: number, curX: number, curY: number,
      visited: Set<number>): boolean {
    // Do not push repeat coords to heap
    const index: number =
        this.coordToDataArrayIndex(curX, curY, imgWidth);

    return !visited.has(index);
  }


  // Return pixel attributes of @imgData at [@xCoord, @yCoord] as [R, G, B, A]
  dataArrayToRgba(imgData: ImageData, xCoord: number, yCoord: number):
      Array<number> {
    // Unpack imgData for readability
    const data: Uint8ClampedArray = imgData.data;
    const imgWidth: number = imgData.width;

    // Pixel attributes in imgData are organized adjacently in a 1-D array
    const pixelIndex: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgWidth);
    const red: number = data[pixelIndex];
    const green: number = data[pixelIndex + 1];
    const blue: number = data[pixelIndex + 2];
    const alpha: number = data[pixelIndex + 3];
    // Store original pixel's attributes
    return [red, green, blue, alpha];
  }

  // Convert coord [@x, @y] (2-D) to indexing style of DataArray (1-D)
  /**Returns index of start of pixel at @x, @y
   * (which represents the red attribute of that pixel)
   * Important: Returns array of number representing indices.
   * First element contains value of index for attribute: red and so on
   */
  coordToDataArrayIndex(x: number, y: number, width: number): number {
    return (x + (y * width)) * 4;
  }


  /* -----Additional Tools----- */

  /**@returns {Set<number>} mask that excludes the
   * @param {Set<number>} mistake from original
   * @param {Set<number>} mask*/
  erase(mask: Set<number>, mistake: Set<number>): Set<number> {
    return SetOperator.difference(mask, mistake);
  }
}
