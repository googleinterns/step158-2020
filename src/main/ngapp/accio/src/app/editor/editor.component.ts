import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postBlobsService: PostBlobsService,
  ) { }

  imageUrl: string;
  displayMaskForm: boolean = false;
  projectId: string;
  
  uploadMaskForm: FormGroup;
  formData: FormData;
  parentName: string;
  blobMask;

  // inject canvas from html.
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  private ctx: CanvasRenderingContext2D;

  //  Used to save mask as png so everytime a new mask is added 
  //    The primary canvas does not have to shrink to image size
  //    to save the mask as an image.
  @ViewChild('maskCanvas', { static: true })
  maskCanvas: ElementRef<HTMLCanvasElement>; 
  private maskCtx: CanvasRenderingContext2D;

  //  scaleFactor is used to trim image scale so image 
  //    is smaller than width and height of the users screen.
  //   scaleFactor and originalImageData are binded to the their 
  //      respective inputs in MaskDirective and change in mask.directive
  //      when they change in editor.component
  scaleFactor = .9;
  originalImageData: ImageData;


  private image: HTMLImageElement;
  private innerHeight: number;
  private maskImageData: ImageData;

  ngOnInit() {
    this.image = new Image();
    
    //  Set query params
    this.route.paramMap.subscribe(params => {
      console.log(params);

      this.projectId = params.get('proj-id ');
      this.parentName = params.get('parent-img ');
      this.imageUrl = params.get('imgUrl');
      
      console.log('image url: ' + this.imageUrl);
      console.log('proj id for mask: ' + this.projectId);
    });

    //image loads after src is set, ensures canvas is initialized properly
    this.image.onload = () => {
      this.initCanvas();
    }
    this.image.src = this.imageUrl;

    //  Initializes mask upolad form
    this.initMaskForm();
    
    //  Fetch blob for mask upload and show maskUploadForm
    this.postBlobsService.fetchBlob();
    this.displayMaskForm = true;
  }
  
  /**  
   *  Draws the image user selects from gallery on Canvas
   *    and creates a hidden canvas to store the original image 
   *    as a reference when scaling the imageUI
   *  ASSUMES Image has loaded, ie. image src is set before initCanvas is called
   *  TODO(shmcaffrey): Currently, editor can require user to 
   *  scroll to access the entire photo, need to make it 
   *  so the editor is fixed to screen size.
   */
  private initCanvas(): void {
    let imgWidth = this.image.width;
    let imgHeight = this.image.height;

    //  Initalize transparent black image data to use for mask size of image
    this.maskImageData = new ImageData(imgWidth,  imgHeight);

    //  Used to scale the image to the window size, 
    //    scaledFactor = .9 so the scaled image is smaller than the users window.
    this.scaleFactor = Math.floor(window.innerHeight / imgHeight * this.scaleFactor);
    //  TODO(shmcaffrey): add scaling if image is larger than window
    if (this.scaleFactor <= 0) {
      this.scaleFactor =  1;
    }

    //  Initialize canvas to scaled image width and height and mask to img. 
    this.maskCanvas.nativeElement.width = imgWidth;
    this.maskCanvas.nativeElement.height = imgHeight;
    this.canvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.canvas.nativeElement.height = imgHeight * this.scaleFactor;

    this.maskCtx = this.maskCanvas.nativeElement.getContext('2d');
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.ctx.drawImage(this.image, 0, 0);
    this.originalImageData = this.ctx.getImageData(0, 0, imgWidth, imgHeight);
    this.clearCanvas();

    this.drawScaledImage(this.image);
    console.log('put imagedata')
  }
  
 /**
  *   Clears full canvas.
  */
  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.ctx.beginPath();
  }

 /**
  *  Draws users image scaled to canvas and restores ctx.
  *  @param image is either the mask image or image user is making a mask of
  */
  private drawScaledImage(image: HTMLImageElement) {
    this.ctx.save();
    this.ctx.scale(this.scaleFactor, this.scaleFactor); 
    this.ctx.drawImage(image, 0, 0, image.width, image.height);
    this.ctx.restore();
  }

 /** 
  * Draws Mask Data onto unscaled canvas to save as image or blob
  * @returns url of newly created mask
  */
  getMaskUrl(): string {
    this.maskCtx.clearRect(0, 0, this.maskCanvas.nativeElement.width, this.maskCanvas.nativeElement.height);
    this.maskCtx.beginPath();
    this.maskCtx.putImageData(this.maskImageData, 0, 0);
    return this.maskCanvas.nativeElement.toDataURL();
  }

 /** 
  *  Sets new pixels in magenta, clears canvas of previous data 
  *    and draws image and mask as scaled
  *  @param maskPixels Output() from mask.directive
  *                    Gives the new pixels to add to the mask
  */
  addToMask(maskPixels: Set<number>) {
    for (let pixel of maskPixels) {
      this.maskImageData.data[pixel] = 255;
      this.maskImageData.data[pixel + 2] = 255;
      this.maskImageData.data[pixel + 3] = 255;
    }

    // Have to make png of mask in order to see background image
    //  Execute all three after image loads so 'jolt' of canvas drawn is less extreme
    let mask = new Image();
    mask.onload = () => {
      this.clearCanvas();
      this.drawScaledImage(this.image);
      this.drawScaledImage(mask);
    }
    mask.src = this.getMaskUrl();
  }

  // TODO(shmcaffrey): change Alpha value to incorperate user input.
  // TODO(shmcaffrey): allow user to clear mask

  /** 
   *  Gets current mask's url and sets the mask as a Blob to be uploaded to server.
   */
  async getMaskBlob(): Promise<void> {
    let maskUrl = this.getMaskUrl();
    this.blobMask = await fetch(maskUrl).then(response => response.blob());
    this.blobMask.lastModifiedDate = new Date();
    this.blobMask.name = this.parentName + 'Mask.png';
  }

  /** 
   *  Initializes Form group and data as new
   *  Initializes @param projectId
   */
  private initMaskForm() {
    this.uploadMaskForm = new FormGroup({
      maskName: new FormControl(),
      labels: new FormControl(),
    });

    this.formData = new FormData();
  }

 /** 
  *  Builds ImageBlob to be appended to form and posted.
  */
  async onSubmit(): Promise<void> {
    // Name is a required input. If it's null, do nothing.
    if (!this.uploadMaskForm.get('maskName').value) {
      return;
    }
    
    await this.getMaskBlob();

    let imageBlob = new ImageBlob(
      this.projectId, 
      /*imageName=*/this.uploadMaskForm.get('maskName').value,
      /*mode=*/'create', 
      /*image=*/this.blobMask,
      /*parentImageName=*/this.parentName,
      /*newImageName=*/'',
      /*tags=*/this.uploadMaskForm.get('labels').value
    );

    this.postBlobsService.buildForm(this.formData, imageBlob, this.parentName + 'Mask.png');

    //  Reset form values
    this.initMaskForm();
  }
}
