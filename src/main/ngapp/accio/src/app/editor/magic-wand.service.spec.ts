import { TestBed } from '@angular/core/testing';

import { MagicWandService } from './magic-wand.service';

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
    imgData.data[56] = 120;
    imgData.data[56 + 1] = 111;
    imgData.data[56 + 2] = 117;
    imgData.data[56 + 3] = 255;
    expect(service.dataArrayToRgba(
        imgData, 3, 1)).toEqual([120, 111, 117, 255]);
  });
  it('Test method: isInBounds() >> top left OutOfRange', () => {
    // Should return false if inputted pixel's coord is out of range of the img
    const imgData: ImageData = new ImageData(11, 4);
    expect(service.isInBounds(
        imgData.width, imgData.height, -1, 1)).toEqual(false);
  });
  it('Test method: isInBounds() >> top right OutOfRange', () => {
    const imgData: ImageData = new ImageData(11, 4);
    expect(service.isInBounds(
      imgData.width, imgData.height, 11, 1)).toEqual(false);
  });
  it('Test method: isInBounds() >> bot left OutOfRange', () => {
    const imgData: ImageData = new ImageData(11, 4);
    expect(service.isInBounds(
      imgData.width, imgData.height, 4, -1)).toEqual(false);
  });
  it('Test method: isInBounds() >> bot right OutOfRange', () => {
    const imgData: ImageData = new ImageData(11, 4);
    expect(service.isInBounds(
      imgData.width, imgData.height, 4, 4)).toEqual(false);
  });
  it('Test method: isInBounds() >> in range', () => {
    // Should return true if inputted pixel's coords in in range of img
    const imgData: ImageData = new ImageData(11, 4);
    expect(service.isInBounds(
      imgData.width, imgData.height, 4, 2)).toEqual(true);
  });
  it('Test method: getIsValid() >> not valid', () => {
    // Should return false if isInBounds() but already visited
    const visited: Set<number> = new Set([20]);
    expect(service.getIsValid(11, 4, 5, 0, visited)).toEqual(false);
  });
  it('Test method: getIsValid() >> valid', () => {
    // Should return true if isInBounds() and not yet visited
    const visited: Set<number> = new Set([24]);
    expect(service.getIsValid(11, 4, 5, 0, visited)).toEqual(true);
  });
  it('Test method: getIsMask() >> not valid', () => {
    // Should return false if pixel of interest is outside of tolerance range
    const visited: Set<number> = new Set();
    const imgData: ImageData = new ImageData(11, 4);
    imgData.data[24] = 120;
    imgData.data[24 + 1] = 117;
    imgData.data[24 + 2] = 108;
    imgData.data[24 + 3] = 255;
    expect(service.getIsMask(
        [131, 117, 108, 255], imgData, [6, 0], 10, visited)).toEqual(false);
  });
  it('Test method: getIsMask() >> valid', () => {
    // Should return true if pixel of interest is within tolerance range
    const visited: Set<number> = new Set();
    const imgData: ImageData = new ImageData(11, 4);
    imgData.data[24] = 120;
    imgData.data[24 + 1] = 117;
    imgData.data[24 + 2] = 108;
    imgData.data[24 + 3] = 255;
    expect(service.getIsMask(
      [130, 117, 108, 255], imgData, [6, 0], 10, visited)).toEqual(true);
  });
  it('Test method: floodfill() >> no adjacent pixels in mask', () => {
    // Should only return index of pixel that was initially clicked
    const imgData: ImageData = new ImageData(11, 4);
    const notMask: Set<number> = new Set(
        [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]);
    for (const pixel of notMask) {
      imgData.data[pixel] = 255;
      imgData.data[pixel + 1] = 255;
      imgData.data[pixel + 2] = 255;
      imgData.data[pixel + 3] = 255;
    }
    expect(service.floodfill(imgData, 2, 1, 1)).toEqual(new Set<number>([52]));
  });
  it('Test method: floodfill() >> small mask, touches border', () => {
    // Should return a mask covering the bottom right corner of the img
    const imgData: ImageData = new ImageData(11, 4);
    const notMask: Set<number> = new Set(
        [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]);
    for (const pixel of notMask) {
      imgData.data[pixel] = 255;
      imgData.data[pixel + 1] = 255;
      imgData.data[pixel + 2] = 255;
      imgData.data[pixel + 3] = 255;
    }
    expect(service.floodfill(imgData, 8, 2, 1)).toEqual(new Set<number>(
        [40, 80, 84, 120, 124, 128, 156, 160, 164, 168, 172]));
  });
  it('Test method: floodfill() >> small mask in middle of img', () => {
    // Should return a mask covering the bottom right corner of the img
    const imgData: ImageData = new ImageData(11, 4);
    const notMask: Set<number> = new Set(
      [8, 24, 28, 36, 48, 56, 64, 76, 96, 100, 112, 116, 152]);
    for (const pixel of notMask) {
      imgData.data[pixel] = 255;
      imgData.data[pixel + 1] = 255;
      imgData.data[pixel + 2] = 255;
      imgData.data[pixel + 3] = 255;
    }
    expect(service.floodfill(imgData, 6, 1, 1)).toEqual(new Set<number>(
      [68, 72]));
  });
});
