import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';
import { saveAs } from 'file-saver';
import * as JSZip from 'jszip';
import * as $ from 'jquery';

@Component({
  selector: 'app-img-gallery',
  templateUrl: './img-gallery.component.html',
  styleUrls: ['./img-gallery.component.css'],
})
export class ImgGalleryComponent implements OnInit {
  uploadImageForm: FormGroup;
  formData: FormData;

  // ProjectId is binded with the upload form input.
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

  // Holds images fetched from datastore.
  imageArray: Array<any>;

  constructor(
    private route: ActivatedRoute,
    private postBlobsService: PostBlobsService
  ) {}

  ngOnInit(): void {
    this.uploadImageForm = new FormGroup({
      imgName: new FormControl(),
      image: new FormControl(),
      tags: new FormControl(),
    });

    // Creates the form data of parameters to be sent to servlet.
    this.formData = new FormData();

    // Set the project id, first try if the
    // project is a new project and there are query keys.
    this.route.queryParams.subscribe((params) => {
      this.projectId = params['proj-id'];
    });
    // If there are no keys then just get the url params.
    if (!this.projectId) {
      this.route.paramMap.subscribe((params) => {
        this.projectId = params.get('proj-id');
      });
    }

    console.log('projID ' + this.projectId);
    console.log('now fetching...');

    // Get the blobstore url initalized and show the form.
    this.postBlobsService.fetchBlob();
    this.displayUpload = true;
    this.getImages();
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
      /*imageName=*/ this.uploadImageForm.get('imgName').value,
      /*mode=*/ 'create',
      /*image=*/ imageFile,
      /*parentImageName=*/ '',
      /*newImageName=*/ '',
      /*tags=*/ this.uploadImageForm.get('tags').value
    );

    this.postBlobsService.buildForm(this.formData, imageBlob, imageFile.name);

    //  Reset form values.
    this.uploadImageForm.reset;
  }

  /** 
   * Fetch images with parameters specified by class members.
   */
  async fetchImages(): Promise<any> {
    let fetchUrl =
      '/blobs?' +
      $.param({
        'proj-id': this.projectId,
        'img-name': this.imgName,
        'mask-name': this.maskName,
        'with-masks': this.withMasks,
        'sort-img': this.sortImg,
        'sort-mask': this.sortMask,
        tag: this.tag,
      });

    // fetchUrl returns a list of image objects: 'url', 'name', 'type',
    // 'utc', 'tags[]', 'masks[]'
    const response = await fetch(fetchUrl);
    const imageContent = await response.json();
    console.log(imageContent);
    return imageContent;
  }

  /** 
   * Fetch images with parameters specified by class members and set
   * imageArray for display.
   */
  async getImages(): Promise<any> {
    console.log('fetching from projectId: ' + this.projectId);

    this.imageArray = await this.fetchImages();

    if (this.imageArray.length > 0) {
      this.displayImages = true;
    }
  }

  /**
   * Download a single image or mask.
   */
  downloadImage(image: any): void {
    saveAs(image.url, image.name + '.' + image.type);
  }

  /** 
   * Get the Base64 representation of image for zipping.
   */
  getBase64String(img: any): string {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let dataURL = canvas.toDataURL('image');
    return dataURL.replace(
      /^data:image\/(png|jpg|gif|pjpeg|bmp|x-icon|svg+xml|webp);base64,/,
      ''
    );
  }

  /**
   * Download a zip including an image and its masks.
   */
  async downloadImageAndItsMasks(image: any): Promise<any> {
    let zip = new JSZip();

    let img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = image.url;
    let loadImageString: Promise<string> = new Promise((resolve, reject) => {
      img.onload = () => resolve(this.getBase64String(img));
    });
    zip.file(image.name + '.' + image.type, await loadImageString, {
      base64: true,
    });

    this.imgName = image.name;
    this.maskName = '';
    this.withMasks = true;
    this.sortImg = '';
    this.sortMask = '';
    this.tag = '';

    let images: any;
    images = await this.fetchImages();

    for (let i = 0; i < images[0]['masks'].length; i++) {
      let mask = images[0]['masks'][i];
      let msk = new Image();
      msk.crossOrigin = 'Anonymous';
      msk.src = mask.url;
      let loadMaskString: Promise<string> = new Promise((resolve, reject) => {
        msk.onload = () => resolve(this.getBase64String(msk));
      });

      zip.file('masks/' + mask.name + '.' + mask.type, await loadMaskString, {
        base64: true,
      });
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, image.name + '.zip');
    });
  }

  /**
   * Download a zip of all images and masks for the project.
   */
  async downloadProjectImages(): Promise<any> {
    let zip = new JSZip();

    this.imgName = '';
    this.maskName = '';
    this.withMasks = true;
    this.sortImg = '';
    this.sortMask = '';
    this.tag = '';

    let images: any;
    images = await this.fetchImages();

    for (let i = 0; i < images.length; i++) {
      let image = images[i];
      let img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = image.url;
      let loadImageString: Promise<string> = new Promise((resolve, reject) => {
        img.onload = () => resolve(this.getBase64String(img));
      });
      zip.file(
        image.name + '/' + image.name + '.' + image.type,
        await loadImageString,
        {
          base64: true,
        }
      );
      for (let j = 0; j < images[i]['masks'].length; j++) {
        let mask = images[i]['masks'][j];
        let msk = new Image();
        msk.crossOrigin = 'Anonymous';
        msk.src = mask.url;
        let loadMaskString: Promise<string> = new Promise((resolve, reject) => {
          msk.onload = () => resolve(this.getBase64String(msk));
        });

        zip.file(
          image.name + '/masks/' + mask.name + '.' + mask.type,
          await loadMaskString,
          {
            base64: true,
          }
        );
      }
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, this.projectId + '.zip');
    });
  }
}
