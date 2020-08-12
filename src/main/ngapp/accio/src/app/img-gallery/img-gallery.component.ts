import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { imageUrls } from '../images'
import { HttpClient } from '@angular/common/http'
import * as $ from 'jquery';

@Component({
  selector: 'app-img-gallery',
  templateUrl: './img-gallery.component.html',
  styleUrls: ['./img-gallery.component.css']
})
export class ImgGalleryComponent implements OnInit {
  uploadImageForm: FormGroup;
  formData: FormData;
  actionUrl: string;
  mode: string = 'create';
  projectId: string;

  imageUrls = imageUrls;

  displayUpload: boolean = false;
  displayImages: boolean = false;
// KEEP--->
  imgName: string = '';
  maskName: string = '';
  withMasks: boolean = false;
  sortImg: string = '';
  sortMask: string = '';
  tag: string = '';
// <---KEEP
  // Holds images fetched from datastore
  imageArray: Array<any>;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.uploadImageForm = new FormGroup({
      imgName: new FormControl(),
      image: new FormControl(),
      tags: new FormControl(),
      parentImg: new FormControl('')  // REMOVE
    });
    //creates the form data of parameters to be sent to servlet
     this.formData = new FormData();

    // Set the project id, first try if the 
    //    project is a new project and there are query keys
    this.route.queryParams.subscribe(params => {
      this.projectId = params['proj-id'];
    });
    //if no keys then just get the url params
    if (!this.projectId) {
      this.route.paramMap.subscribe(params => {
        this.projectId = params.get('proj-id');
      });
    }

    console.log('projID ' + this.projectId);
    console.log('now fetching...')

    // Get the blobstore url initalized and show the form
    this.fetchBlob();
    this.getImages();
  }

  async getImages(): Promise<any> {
    console.log(`fetching with: id ${this.projectId}; img-name ${this.imgName}; with-masks ${this.withMasks}`);
    let fetchUrl = '/blobs?' + $.param({
      'proj-id': this.projectId,
      // KEEP--->
      'img-name': this.imgName,
      'mask-name': this.maskName,
      'with-masks': this.withMasks,
      'sort-img': this.sortImg,
      'sort-mask': this.sortMask,
      'tag': this.tag
      // <---KEEP
      /* add ability to sort by:
      *     tag
      *     img-name
      *     mask-name
      *     with-masks	Boolean
      *     sort-img	“asc” or “dsc”
      *     sort-mask	"asc” or “dsc” 
      */
    });

    // fetchUrl returns a list of image objects: 'url', 'name', 'utc', 'tags[]', 'masks[]'
    const response = await fetch(fetchUrl);
    const imageContent = await response.json();
    this.imageArray = imageContent;
    console.log(this.imageArray);

    if (this.imageArray.length > 0) {
      this.displayImages = true;
    }
  }

  /**
   * @param actionUrl is set to the blobuploadUrl where the user's image will be posted to
   * Fetch server to get blobUploadUrl and set actionUrl.
   * Called before user can see the form then displays form.
   */
  async fetchBlob(): Promise<void> {
    let response = await fetch('/blob-upload');
    let blobUploadUrl = await response.json();
    console.log('blob upload url: ' + blobUploadUrl);
    this.actionUrl = blobUploadUrl;
    this.displayUpload = true;
    console.log('actionURL: ' + this.actionUrl);
    console.log('upload ready');
  }

  /** 
   *  @param formData is initalized with values given by user.
   *  Called when the user clicks submit.
   */
  onSubmit() {
    // uploadImageForm 'image' contains a file, so the value is a file array
    // To serve the blob we have to access the first file in the array
    const fileArray = this.uploadImageForm.get('image').value;
    const imageFile = fileArray.files[0];

    // Creates form data to send by post to blob servlet
    console.log('ready to submit');
    this.formData.append('mode', this.mode);

    this.formData.append('img-name', this.uploadImageForm.get('imgName').value);
    console.log('FORM DATA img-name ' + this.uploadImageForm.get('imgName').value);

    this.formData.append('image', imageFile);
    console.log('FORM DATA image ' + imageFile);

    this.formData.append('tags', this.uploadImageForm.get('tags').value);
    console.log('FORM DATA tags ' + this.uploadImageForm.get('tags').value);

    this.formData.append('proj-id', this.projectId);
    console.log('FORM DATA proj-id ' + this.projectId);

    this.formData.append('parent-img', this.uploadImageForm.get('parentImg').value);  // REMOVE
    console.log('FORM DATA parent-img ' + this.uploadImageForm.get('parentImg').value);  //REMOVE

    this.onUpload();
  }

  /** 
   * Fetches the blobUploadURL to post image data to datastore
   */
  private async onUpload() {

    await this.http.post<any>(this.actionUrl, this.formData).subscribe(
      (res) => console.log('res ' + res),
      (err) => console.log('err ' + err)
    );
    console.log('SUCCESS: Image uploaded to server.');

    //reset form values and form
    this.formData = new FormData;
    this.uploadImageForm.reset();
    this.getImages();
  }
}