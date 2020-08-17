import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';
import * as $ from 'jquery';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

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
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.createEmptyFormGroup();

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

    console.log('projID ' + this.projectId);

    //  Get the blobstore url initalized and show the form.
    this.postBlobsService.fetchBlobPost();
    this.displayUpload = true;
    this.getImages();
  }

  async getImages(): Promise<any> {
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

    //  fetchUrl returns a list of image objects: 'url', 'name', 'utc', 'tags[]', 'masks[]'
    const response = await fetch(fetchUrl);
    const imageContent = await response.json();
    this.imageArray = imageContent;

    if (this.imageArray.length > 0) {
      this.displayImages = true;
    }
  }

 /** 
  *   Builds ImageBlob to be appended to form and posted.
  *   If a parameter isn't applicaple, it has a default value but must be filled
  *      if a value later in the constructor is applicable.
  */
  onSubmit() {
    // Name is a required input. If it's null, do nothing.
    if(!this.uploadImageForm.get('imgName').value) {
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

    //  Reset form values.
    this.uploadImageForm.reset;
    location.reload();
  }

  /** 
  *  Deletes image from server and corresponding masks
  *  Requires that imageArray is initalized to fetch masks (initialized when gallery loads)
  *  @param imageName Name of image to be deleted
  */
  async deleteImage(imageName: string): Promise<void> {
    let masks = new Array<any>();

    //  Fetches imageName's masks with 'with-mask' param true and imageName
    let fetchUrl = this.buildFetchUrl(this.projectId, imageName, '', 'true');

    const response = await fetch(fetchUrl);
    const maskContent = await response.json();
    masks = maskContent;

    //  Delete all masks
    for (let mask of masks) {
      this.deleteMask(imageName, mask['img-name']);
      console.log('deleting: ' + mask['img-name']);
    }

    //  Delete image
    let deleteImageFormData = new FormData;
    let imageBlob = new ImageBlob(
      this.projectId,
      /*imageNam=*/imageName,
      /*mode=*/'update',
      /*image=*/null,
      /*parentImageName=*/'',
      /*newImageName=*/'',
      /*tags=*/'',
      /*delete=*/true
    );
    this.postBlobsService.buildForm(deleteImageFormData, imageBlob, null);
  }

  deleteMask(parentName: string, maskName: string): void {
    let deleteMaskFormData = new FormData;
    let imageBlob = new ImageBlob(
      this.projectId,
      /*imageNam=*/maskName,
      /*mode=*/'update',
      /*image=*/null, 
      /*parentImageName=*/parentName,
      /*newImageName=*/'',
      /*tags=*/'',
      /*delete=*/true
    );

    // file is null, so file name is not needed
    this.postBlobsService.buildForm(deleteMaskFormData, imageBlob, null);
  }

 /** 
  *  @return url to fetch images or masks given parameters. 
  *  Only requires projectId. 
  *  @param projectId Is required to fetch images of a specific project.
  *  @param imgName   If fetching masks under an Image, Parent images name is required.
  *  @param maskName  If fetching a mask of a specific name the image name and mask name is required.
  *  @param withMasks Either 'true' or 'false'. Defalult 'false', If 'true' imgName is required. 
                      Retreives all masks under parent image
  */
  buildFetchUrl(projectId: string, imgName: string = '', 
                maskName: string = '', withMasks: string = 'false', 
                sortImg: string = '', sortMask: string = '', 
                tag: string = ''): string {

    return ('/blobs?' + $.param({
      'proj-id': projectId,
      'img-name': imgName,
      'mask-name': maskName,
      'with-masks': withMasks,
      'sort-img': sortImg,
      'sort-mask': sortMask,
      'tag': tag,
    }));
  }

 /** 
  *  Binds form control values from html uploadImageForm to empty values
  *  Used to initialize form and to clear form after it's pushed to the server 
  */
  private createEmptyFormGroup(): void {
    this.uploadImageForm = new FormGroup({
      imgName: new FormControl(),
      image: new FormControl(),
      tags: new FormControl()
    });
  }

  // checkDelete(type: string, imageName: string) {
  //   const dialogRef = this.dialog.open(DeleteDialog, {
  //     width: '250px',
  //     data: {type: type, image: imageName}
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     console.log('The dialog was closed');
  //     this.animal = result;
  //   });
  // }
}
