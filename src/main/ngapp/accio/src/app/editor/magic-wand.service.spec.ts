import { TestBed } from '@angular/core/testing';

import { MagicWandService } from './magic-wand.service';


/* tslint:disable */
describe('MagicWandService', () => {
 let service: MagicWandService;

 beforeEach(() => {
   TestBed.configureTestingModule({});
   service = TestBed.inject(MagicWandService);
 });

 it('should be created', () => {
   expect(service).toBeTruthy();
 });
 it('Test method: coordToDataArrayIndex()', () => {
   // Should convert [x][y] to 1-D indexing
   expect(service.coordToDataArrayIndex(
       0, 0, 100)).toEqual(0);
   expect(service.coordToDataArrayIndex(
       1, 5, 100)).toEqual(2004);
 });
 it('Test method: dataArrayToRgba()', () => {
   // Should access RGBA values of img given a coord
   const imgData: ImageData = new ImageData(11, 4);
   imgData.data[56] = 120;  // Red
   imgData.data[56 + 1] = 111;  // Green
   imgData.data[56 + 2] = 117;  // Blue
   expect(service.dataArrayToRgb(
       imgData, 3, 1)).toEqual({red: 120, green: 111, blue: 117});
 });
 it('Test method: isInBounds() >> top left OutOfRange', () => {
   // Should return false if inputted pixel's coord is out of range of the img
   expect(service.isInBounds(
       11, 4, -1, 1)).toEqual(false);
 });
 it('Test method: isInBounds() >> top right OutOfRange', () => {
   expect(service.isInBounds(
       11, 4, 11, 1)).toEqual(false);
 });
 it('Test method: isInBounds() >> bot left OutOfRange', () => {
   expect(service.isInBounds(
       11, 4, 4, -1)).toEqual(false);
 });
 it('Test method: isInBounds() >> bot right OutOfRange', () => {
   expect(service.isInBounds(
       11, 4, 4, 4)).toEqual(false);
 });
 it('Test method: isInBounds() >> in range', () => {
   // Should return true if inputted pixel's coords in in range of img
   expect(service.isInBounds(
       11, 4, 4, 2)).toEqual(true);
 });
 it('Test method: getIsValid() >> not valid', () => {
   // Should return false if isInBounds() but already visited
   expect(service.getIsValid(11, 4, 5, 0, new Set([20]))).toEqual(false);
 });
 it('Test method: getIsValid() >> valid', () => {
   // Should return true if isInBounds() and not yet visited
   const visited: Set<number> = new Set([24]);
   expect(service.getIsValid(11, 4, 5, 0, visited)).toEqual(true);
 });
 it('Test method: floodfill() >> no adjacent pixels in mask', () => {
   // Should only return index of pixel that was initially clicked
   const imgData: ImageData = makeTestImage(
       11, 4, [255, 255, 255, 255], new Set<number>(
       [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]));
   expect(service.floodfill(imgData, 2, 1, 1)).toEqual(new Set<number>([52]));
 });
 it('Test method: floodfill() >> small mask, touches border', () => {
   // Should return a mask covering the bottom right corner of the img
   const imgData: ImageData = makeTestImage(
       11, 4, [255, 255, 255, 255], new Set<number>(
       [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]));
   expect(service.floodfill(imgData, 8, 2, 1)).toEqual(new Set<number>(
       [40, 80, 84, 120, 124, 128, 156, 160, 164, 168, 172]));
 });
 it('Test method: floodfill() >> small mask in middle of img', () => {
   // Should return a mask covering the bottom right corner of the img
   const imgData: ImageData = makeTestImage(
       11, 4, [255, 255, 255, 255], new Set<number>(
       [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]));
   expect(service.floodfill(imgData, 6, 1, 1)).toEqual(new Set<number>(
       [68, 72]));
 });

 it('Test method: erase()', () => {
   // Should return a mask with pixels from the input set being excluded
   const originalMask: Set<number> = new Set([0, 8, 12, 40, 44]);
   const mistake: Set<number> = new Set([12, 40]);
   const expected: Set<number> = new Set([0, 8, 44]);
   expect(service.erase(originalMask, mistake)).toEqual(expected);
 });
 it('Test method: invert()', () => {
   // Should return a mask with pixels from the input set being excluded
   const originalMask: Set<number> = new Set([0, 8, 12, 40, 44]);
   const expected: Set<number> = new Set([4, 16, 20, 24, 28, 32, 36]);
   expect(service.invert(originalMask, 4, 3)).toEqual(expected);
 });

 it('Test method: rgbEuclideanDist()', () => {
   // Should return the straight line distance between two pixels' colors
   const colorA = {red: 2, green: 4, blue: 1};
   const colorB = {red: 7, green: 2, blue: 2};
   // Euclidean distance, kept in squared space
   expect(service.rgbEuclideanDist(colorA, colorB)).toEqual(30);
 });

 it('Test method: pixelIndexToXYCoord()', () => {
   expect(service.pixelIndexToXYCoord(8, 4)).toEqual([2, 0]);
   expect(service.pixelIndexToXYCoord(148, 11)).toEqual([4, 3]);
 });
 it('Test method: scribbleFloodfill()', () => {
   const imgData: ImageData = makeTestImage(
       4, 4, [255, 255, 255, 255], new Set<number>(
       [8, 12, 16]));
   for (let i of [20, 24, 28, 32]) {
     imgData.data[i] = 120;
     imgData.data[i + 1] = 120;
     imgData.data[i + 2] = 120;
     imgData.data[i + 3] = 120;
   }

   expect(service.scribbleFloodfill(
       imgData, 1, 0, 5, new Set<number>([4, 8]))).toEqual(
       new Set<number>([0, 4, 8, 12, 16]));
 });
 it('Test method: scribblesToColors()', () => {
   const imgData: ImageData = makeTestImage(
       3, 3, [5, 6, 7, 255], new Set<number>([4]));
   expect(service.scribblesToColors(
       new Set<number>([4]), imgData)).toEqual(
       [{red: 5, green: 6, blue: 7}]);
 });
 it('Test Error: scribblesToColors() OutOfRange', () => {
   const imgData = new ImageData(3, 3);
   expect(() => {service.scribblesToColors(new Set<number>([-1]), imgData)}).
       toThrowError(
       'Pixel index from scribbles set is out of range...');
   expect(() => {service.scribblesToColors(new Set<number>([36]), imgData)}).
       toThrowError(
       'Pixel index from scribbles set is out of range...');
 });
 it('Test Error: scribblesToColors() Bad indexing', () => {
   const imgData = new ImageData(3, 3);
   expect(() =>  {service.scribblesToColors(new Set<number>([3]), imgData)}).
     toThrowError(
     'Pixel index not pointing to the start of a new pixel...');
 });
});

/** Make an ImageData object that sets pixels in @notMask to Rgba of
* [255,255,255,255].
* @newColor should contain new Rgba values in format: [R, G, B, A]
*/
function makeTestImage(width: number, height: number, newColor: Array<number>,
   notMask: Set<number>): ImageData {
 const imgData: ImageData = new ImageData(width, height);
 for (const redIndex of notMask) {
   const red: number = redIndex;
   const green: number = redIndex + 1;
   const blue: number = redIndex + 2;
   const alpha: number = redIndex + 3;
   imgData.data[red] = newColor[0];
   imgData.data[green] = newColor[1];
   imgData.data[blue] = newColor[2];
   imgData.data[alpha] = newColor[3];
 }
 return imgData;
}
