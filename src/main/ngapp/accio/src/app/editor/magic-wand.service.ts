import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MagicWandService {
  /** Return set of coordinates(formatted as a 1-D array).
   *  Coordinates correspond to pixels considered part of the mask.
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
    let indexAsDataArray: number = this.coordToDataArrayIndicies(xCoord, yCoord, imgData.width)[0];
    visited.add(indexAsDataArray);
    let visitSize: number = 1;

    // Loop until no more adjacent pixel's within tolerance level
    while(visitSize != 0) {
      let coord: Array<number> = visit.pop();
      visitSize -= 1;
      // Unpack coord
      let x: number = coord[0];
      let y: number = coord[1];

      // Operational part of while-loop
      mask.add(this.coordToDataArrayIndicies(x, y, imgData.width)[0]);

      // Loop part of while-loop

      // Get coords of adjacent pixels
      let leftPixelCoord: Array<number> = [x - 1, y];
      let rightPixelCoord: Array<number> = [x + 1, y];
      let upPixelCoord: Array<number> = [x, y - 1];
      let downPixelCoord: Array<number> = [x, y + 1];
      // Add coords of adjacent pixels to the heap
      let isStillMask: boolean = this.getIsStillMask(originalPixel, imgData, leftPixelCoord, tolerance, visited);
      // Check left pixel
      if (isStillMask) {
        visit.push(leftPixelCoord);
        visitSize += 1;
      }
      isStillMask = this.getIsStillMask(originalPixel, imgData, rightPixelCoord, tolerance, visited);
      // Check right pixel
      if (isStillMask) {
        visit.push(rightPixelCoord);
        visitSize += 1;
      }
      isStillMask = this.getIsStillMask(originalPixel, imgData, upPixelCoord, tolerance, visited);
      // Check up pixel
      if (isStillMask) {
        visit.push(upPixelCoord);
        visitSize += 1;
      }
      isStillMask = this.getIsStillMask(originalPixel, imgData, downPixelCoord, tolerance, visited);
      // Check down pixel
      if (isStillMask) {
        visit.push(downPixelCoord);
        visitSize += 1;
      }
    }  // end of while loop

    return mask;
  }

  /** Judge current pixel's RGBA against original pixel's RGBA to see if it
   *  can still be part of the mask (using tolerance criteria)
   */
  getIsStillMask(originalPixel: Array<number>, imgData: ImageData,
                         pixelCoord: Array<number>, tolerance: number,
                         visited: Set<number>): boolean {
    let isStillMask: boolean = true;

    // Preface; check if pixel is valid (indexing errs and repeat values)
    let isValid: boolean = this.getIsValid(imgData, pixelCoord, visited);
    if (!isValid) {
      // Automatically not in mask b/c failed vailidity test
      return !isStillMask;
    }

    // Get array of attributes of current pixel
    let curX: number = pixelCoord[0];
    let curY: number = pixelCoord[1];
    let curPixel: Array<number> = this.dataArrayToRGBA(imgData, curX, curY);

    // All attributes of the pixel (R,G,B, and A) must be within tolerance level
    for (let i = 0; i < 4; i++) {
      let upperTolerance: boolean = curPixel[i] > originalPixel[i] + tolerance;
      let lowerTolerance: boolean = curPixel[i] < originalPixel[i] - tolerance;
      let failsTolerance: boolean = upperTolerance || lowerTolerance;
      if (failsTolerance) {
        return !isStillMask;
      }
    }

    return isStillMask;
  }

  // Check if @pixelCoord is in bounds and makes sure it's not a repeat coord
  getIsValid(imgData: ImageData, pixelCoord: Array<number>, visited: Set<number>): boolean {
    let curX: number = pixelCoord[0];
    let curY: number = pixelCoord[1];

    // Unpack imgData for readability
    let data: Uint8ClampedArray = imgData.data;
    let imgWidth: number = imgData.width;
    let imgHeight: number = imgData.height;

    let isValid: boolean = true;
    // Check bounds of indexing
    let yOutOfBounds: boolean = curY < 0 || curY > imgHeight - 1;
    let xOutOfBounds: boolean = curX < 0 || curX > imgWidth - 1;
    if (yOutOfBounds || xOutOfBounds) {
      return !isValid;
    }
    // Do not push repeat coords to heap
    let indexAsDataArray: number = this.coordToDataArrayIndicies(curX, curY, imgWidth)[0];
    if (visited.has(indexAsDataArray)) {
      return !isValid;
    }
    visited.add(indexAsDataArray);

    return isValid;
  }
}
