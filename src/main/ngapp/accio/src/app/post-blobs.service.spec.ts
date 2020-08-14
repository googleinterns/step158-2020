import { TestBed } from '@angular/core/testing';

import { PostBlobsService } from './post-blobs.service';

describe('PostBlobsService', () => {
  let service: PostBlobsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostBlobsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
