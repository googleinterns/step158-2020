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
    imgData.data[56 + 3] = 255;  // Alpha
    expect(service.dataArrayToRgba(
        imgData, 3, 1)).toEqual([120, 111, 117, 255]);
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
  it('Test method: getIsMask() >> not valid', () => {
    // Should return false if pixel of interest is outside of tolerance range
    const imgData: ImageData = makeTestImage(
        11, 4, [120, 117, 108, 255], new Set<number>([24]));
    expect(service.getIsMask(
        [131, 117, 108, 255], imgData, [6, 0], 10)).toEqual(
        false);
  });
  it('Test method: getIsMask() >> valid', () => {
    // Should return true if pixel of interest is within tolerance range
    const imgData: ImageData = makeTestImage(
        11, 4, [120, 117, 108, 255], new Set<number>([24]));
    expect(service.getIsMask(
        [130, 117, 108, 255], imgData, [6, 0], 10)).toEqual(
        true);
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
// Test suite for additional tools
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
