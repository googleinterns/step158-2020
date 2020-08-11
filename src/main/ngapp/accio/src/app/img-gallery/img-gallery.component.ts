import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { PostBlobsService } from '../post-blobs.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-img-gallery',
  templateUrl: './img-gallery.component.html',
  styleUrls: ['./img-gallery.component.css']
})
export class ImgGalleryComponent implements OnInit {
  uploadImageForm: FormGroup;
  formData: FormData;
  mode: string = 'create';
  projectId: string;

  displayUpload: boolean = false;
  displayImages: boolean = false;

  // Holds images fetched from datastore
  imageArray: Array<any>;

  constructor(
    private route: ActivatedRoute,
    private postBlobsService: PostBlobsService,
  ) { }

  ngOnInit(): void {
    this.uploadImageForm = new FormGroup({
      imgName: new FormControl(),
      image: new FormControl(),
      tags: new FormControl()
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
    this.postBlobsService.fetchBlob();
    this.displayUpload = true;
    this.getImages();
  }

  async getImages(): Promise<any> {
    console.log('fetching from projectID: ' + this.projectId);
    let fetchUrl = '/blobs?' + $.param({
      'proj-id': this.projectId
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

    if (this.imageArray.length > 0) {
      this.displayImages = true;
    }
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
    console.log(imageFile);


    this.formData.append('tags', this.uploadImageForm.get('tags').value);
    console.log('FORM DATA tags ' + this.uploadImageForm.get('tags').value);

    this.formData.append('proj-id', this.projectId);
    console.log('FORM DATA proj-id ' + this.projectId);

    this.postBlobsService.onUpload(this.formData, this.uploadImageForm);
    // upload reset and call page refresh
  }
}
