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

  imageUrls = imageUrls;

  display: boolean = false;

  actionUrl: string;
  formData: FormData;

  imageName: string; 
  projectId: string; 
  tags: string;
  mode: string = 'create';
  image;

  // Holds images fetched from datastore
  imageArray: Array<any>;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

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
    this.fetchBlob();
  }

  async getImages(): Promise<any> {
    let fetchUrl = '/images' + $.param({
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

    // Returns a list of image objects, url, name, utc, tags, masks
    const response = await fetch(fetchUrl);
    const imageContent = await response.json();
    this.imageArray = imageContent;
  }

  /**
   * Fetch server to get blob upload url and set action url
   * Called before user can see the form
   */
  async fetchBlob(): Promise<void> {
    let response = await fetch('/blob-upload');
    let blobUploadUrl = await response.json();
    console.log('blob upload url: ' + blobUploadUrl);
    this.actionUrl = blobUploadUrl;
    this.display = true;
    console.log('actionURL: ' + this.actionUrl);
    console.log('upload ready');

    //  Fetch blob using fetch instead of await, same action as above, can be deleted once working
    // fetch('/blob-upload') 
    // .then((response) => {
    //   return response.text();
    // })
    // .then((blobUploadUrl) => {
    //   console.log(blobUploadUrl);
    //   this.actionUrl = blobUploadUrl;
    //   this.display = true;
    //   console.log('actionURL: ' + this.actionUrl);
    //   console.log('upload ready');
    // })
  }
  
  /** 
   * Sends post request to created blob URL to save image entity 
   * Both methods produce a 404 error
  */
  onUpload() {
    console.log('formData: ');
    console.log(this.formData);
    this.http.post<any>(this.actionUrl, this.formData).subscribe(
      (res) => console.log('res ' + res),
      (err) => console.log('err ' + err['name'] + 'action url= ' + this.actionUrl)
    );
    console.log('made it through fetch');
    


  //   let response = await fetch(this.actionUrl, {method: 'POST'});
  //   console.log('finish fetch blob');
  //   let content = await response.text();
  //   console.log('converted to json');
  //  console.log(content);
  }

  getProjId(): string {
    return this.projectId;
  }

  onSubmit() {
    // Creates form data to send by post to blob servlet
    console.log('ready to submit');
    this.formData.append('mode', this.mode);

    this.formData.append('img-name', this.uploadImageForm.get('imgName').value);
    console.log('FORM DATA img-name ' + this.uploadImageForm.get('imgName').value);

    this.formData.append('image', this.uploadImageForm.get('image').value);
    console.log('FORM DATA image ' + this.uploadImageForm.get('image').value);

    this.formData.append('tags', this.uploadImageForm.get('tags').value);
    console.log('FORM DATA tags ' + this.uploadImageForm.get('tags').value);

    this.formData.append('proj-id', this.projectId);
    console.log('FORM DATA proj-id ' + this.projectId);

    this.onUpload();
  }
}
