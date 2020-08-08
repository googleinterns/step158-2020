import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgGalleryComponent } from './img-gallery.component';

describe('ImgGalleryComponent', () => {
  let component: ImgGalleryComponent;
  let fixture: ComponentFixture<ImgGalleryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImgGalleryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImgGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
