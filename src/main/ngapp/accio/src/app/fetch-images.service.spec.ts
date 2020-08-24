import { TestBed } from '@angular/core/testing';

import { FetchImagesService } from './fetch-images.service';

describe('FetchImagesService', () => {
  let service: FetchImagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FetchImagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
