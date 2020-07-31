import { Injectable } from '@angular/core';

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
    // Use basic queue to immitate recursive approach of the stack
    // possible TODO: set array size after mvp to optimize heap memory access
    const visit: Array<Array<number>> = new Array();
    const visited: Set<number> = new Set();
    // Use a set for mask; mainly do iter and set operations on masks
    const mask: Set<number> = new Set();
    // Represent [R,G,B,A] attributes of initial pixel
    const originalPixel: Array<number> = this.dataArrayToRGBA(imgData, xCoord, yCoord);

    visit.push([xCoord, yCoord]);
    // Convert [x,y] format coord to 1-D equivalent of imgData.data (DataArray)
    let indexAsDataArray: number = this.coordToDataArrayIndex(xCoord, yCoord, imgData.width);
    visited.add(indexAsDataArray);

    // Loop until no more adjacent pixel's within tolerance level
    while(visit.length != 0) {
      let coord: Array<number> = visit.pop();
      // Unpack coord
      let x: number = coord[0];
      let y: number = coord[1];

      // Operational part of while-loop
      mask.add(this.coordToDataArrayIndex(x, y, imgData.width));

      // Loop part of while-loop

      // Get coords of adjacent pixels
      let leftPixelCoord: Array<number> = [x - 1, y];
      let rightPixelCoord: Array<number> = [x + 1, y];
      let upPixelCoord: Array<number> = [x, y - 1];
      let downPixelCoord: Array<number> = [x, y + 1];
      // Add coords of adjacent pixels to the heap
      let isStillMask: boolean = this.getIsMask(originalPixel, imgData, leftPixelCoord, tolerance, visited);
      // Check left pixel
      if (isStillMask) {
        visit.push(leftPixelCoord);
      }
      isStillMask = this.getIsMask(originalPixel, imgData, rightPixelCoord, tolerance, visited);
      // Check right pixel
      if (isStillMask) {
        visit.push(rightPixelCoord);
      }
      isStillMask = this.getIsMask(originalPixel, imgData, upPixelCoord, tolerance, visited);
      // Check up pixel
      if (isStillMask) {
        visit.push(upPixelCoord);
      }
      isStillMask = this.getIsMask(originalPixel, imgData, downPixelCoord, tolerance, visited);
      // Check down pixel
      if (isStillMask) {
        visit.push(downPixelCoord);
      }
    }  // end of while loop

    return mask;
  }

  /**First check that @pixelCoord is within range of the image bounds.
   * Then, judge current pixel's RGBA against original pixel's RGBA to
   * see if it can still be part of the mask (using tolerance criteria).
   */
  getIsMask(originalPixel: Array<number>, imgData: ImageData,
      pixelCoord: Array<number>, tolerance: number,
      visited: Set<number>): boolean {
    let curX: number = pixelCoord[0];
    let curY: number = pixelCoord[1];
    let imgWidth: number = imgData.width;

    // Preface; check if pixel is valid (indexing errs and repeat values)
    let isValid: boolean = this.getIsValid(imgWidth, imgData.height, curX, curY, visited);
    if (!isValid) {
      // Automatically not in mask b/c failed vailidity test
      return false;
    }

    visited.add(this.coordToDataArrayIndex(curX, curY, imgWidth));

    // Get array of attributes of current pixel
    let curPixel: Array<number> = this.dataArrayToRGBA(imgData, curX, curY);

    // All attributes of the pixel (R,G,B, and A) must be within tolerance level
    for (let i = 0; i < 4; i++) {
      let upperTolerance: boolean = curPixel[i] > originalPixel[i] + tolerance;
      let lowerTolerance: boolean = curPixel[i] < originalPixel[i] - tolerance;
      if (upperTolerance || lowerTolerance) {
        return false;
      }
    }

    return true;
  }

  // Check if @pixelCoord is in bounds and makes sure it's not a repeat coord
  getIsValid(imgWidth: number, imgHeight: number, curX: number, curY: number,
      visited: Set<number>): boolean {
    if (this.isInBounds(imgWidth, imgHeight, curX, curY) &&
        this.notVisited(imgWidth, curX, curY, visited)) {
      return true;
    }

    return false;
  }

  // Check bounds of indexing for img dimensions
  isInBounds(imgWidth: number, imgHeight: number, curX: number, curY: number): boolean {
    let yOutOfBounds: boolean = curY < 0 || curY > imgHeight - 1;
    let xOutOfBounds: boolean = curX < 0 || curX > imgWidth - 1;

    return !(yOutOfBounds || xOutOfBounds);
  }

  // Checks if pixel has been visited already
  notVisited(imgWidth:number, curX: number, curY: number,
      visited: Set<number>): boolean {
    // Do not push repeat coords to heap
    let index: number =
        this.coordToDataArrayIndex(curX, curY, imgWidth);

    return !visited.has(index);
  }


  // Return pixel attributes of @imgData at [@xCoord, @yCoord] as [R, G, B, A]
  dataArrayToRGBA(imgData: ImageData, xCoord: number, yCoord: number):
      Array<number> {
    // Unpack imgData for readability
    let data: Uint8ClampedArray = imgData.data;
    let imgWidth: number = imgData.width;

    // Pixel attributes in imgData are organized adjacently in a 1-D array
    let pixelIndex: number =
        this.coordToDataArrayIndex(xCoord, yCoord, imgWidth);
    let red: number = data[pixelIndex];
    let green: number = data[pixelIndex + 1];
    let blue: number = data[pixelIndex + 2];
    let alpha: number = data[pixelIndex + 3];
    // Store original pixel's attributes
    return [red, green, blue, alpha];
  }

  // Convert coord [@x, @y] (2-D) to indexing style of DataArray (1-D)
  /**Returns [indexOfR, indexOfG, indexOfB, indexOfA]
   * Important: Returns array of number representing indices.
   * First element contains value of index for attribute: red and so on
   * */
  coordToDataArrayIndex(x: number, y: number, width: number): number {
    let pixelStart: number = (x + (y * width)) * 4;
    return pixelStart
  }
}
