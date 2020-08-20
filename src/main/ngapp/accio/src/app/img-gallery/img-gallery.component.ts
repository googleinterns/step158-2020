import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { FetchImagesService } from '../fetch-images.service';
import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';
import * as $ from 'jquery';

@Component({
  selector: 'app-img-gallery',
  templateUrl: './img-gallery.component.html',
  styleUrls: ['./img-gallery.component.css']
})
export class ImgGalleryComponent implements OnInit {
  uploadImageForm: FormGroup;
  formData: FormData;

  //  ProjectId is binded with the upload form input.
  projectId: string;

  displayUpload: boolean = false;
  displayImages: boolean = false;

  // Filters for fetching images
  imgName: string = '';
  maskName: string = '';
  withMasks: boolean = false;
  sortImg: string = '';
  sortMask: string = '';
  tag: string = '';

  //  Holds images fetched from datastore.
  imageArray: Array<any>;

  constructor(
    private route: ActivatedRoute,
    private postBlobsService: PostBlobsService,
    private fetchImagesService: FetchImagesService
  ) { }

  ngOnInit(): void {
    this.uploadImageForm = new FormGroup({
      imgName: new FormControl(),
      image: new FormControl(),
      tags: new FormControl()
    });

    //  Creates the form data of parameters to be sent to servlet.
    this.formData = new FormData();

    //  Set the project id, first try if the 
    //     project is a new project and there are query keys.
    this.route.queryParams.subscribe(params => {
      this.projectId = params['proj-id'];
    });
    //  If there are no keys then just get the url params.
    if (!this.projectId) {
      this.route.paramMap.subscribe(params => {
        this.projectId = params.get('proj-id');
      });
    }

    //  Get the blobstore url initalized and show the form.
    this.postBlobsService.fetchBlob();
    this.displayUpload = true;
    this.getImages();
  }

  /** Calls the fetchImageService to get all images under parameters */
  getImages() {
    console.log('fetching from projectId: ' + this.projectId);
    let fetchUrl = '/blobs?' + $.param({
      'proj-id': this.projectId,
      'img-name': this.imgName,
      'mask-name': this.maskName,
      'with-masks': this.withMasks,
      'sort-img': this.sortImg,
      'sort-mask': this.sortMask,
      'tag': this.tag
    });
    
    this.fetchImagesService.changeImages(fetchUrl).then(() => {
      this.fetchImagesService.currentImages.subscribe(images => this.imageArray = images);
      console.log(this.imageArray.length + ' items in image array');
      if (this.imageArray.length > 0) {
        this.displayImages = true;
      }
      console.log('fetching imageArray');
    });
  }

 /** 
  *   Builds ImageBlob to be appended to form and posted.
  *   If a parameter isn't applicaple, it has a default value but must be filled
  *      if a value later in the constructor is applicable.
  */
  onSubmit() {
     // Name is a required input. If it's null, do nothing.
    if (!this.uploadImageForm.get('imgName').value) {
      return;
    }
    
    //  uploadImageForm 'image' contains a file, so the value is a file array.
    //  To serve the blob we have to access the first file in the array.
    const fileArray = this.uploadImageForm.get('image').value;
    const imageFile = fileArray.files[0];
    console.log(imageFile);

    let imageBlob = new ImageBlob(
      this.projectId, 
      /*imageName=*/this.uploadImageForm.get('imgName').value,
      /*mode=*/'create',
      /*image=*/imageFile,
      /*parentImageName=*/'', 
      /*newImageName=*/'',
      /*tags=*/this.uploadImageForm.get('tags').value,
      );

    this.postBlobsService.buildForm(this.formData, imageBlob, imageFile.name);
    window.location.reload();
  }
}
