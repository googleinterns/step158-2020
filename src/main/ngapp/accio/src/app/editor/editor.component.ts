import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';
import { MaskTool } from './MaskToolEnum';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private postBlobsService: PostBlobsService,
  ) { }

  //  Display variables.
  private image: HTMLImageElement;
  imageUrl: string;
  displayMaskForm: boolean = false;
  disableSubmit: boolean = false;

  //  Mask variables.
  private maskImageData: ImageData;
  private maskImageUrl: string
  
  //  Form variables.
  uploadMaskForm: FormGroup;
  formData: FormData;
  projectId: string;
  parentName: string;
  blobMask: Blob; 

  //  scaleFactor is used to trim image scale so image 
  //    is smaller than width and height of the user's screen.
  //  The following variables are bound to their 
  //    respective inputs in MaskDirective and change in mask.directive
  //    when they change in editor.component
  scaleFactor: number;
  originalImageData: ImageData;
  tolerance: number;
  maskAlpha:number;
  disableFloodFill: boolean;
  //  Declares the type of tool the user has selected from the tool bar:
  //      'magic-wand' = flood fill algorithm enabled.
  //      'mask-only' = user sees only the mask and cannot use the magic wand tool. 
  maskTool: MaskTool;

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

  ngOnInit() {
    this.image = new Image();
    this.scaleFactor = .9;
    this.tolerance = 30;
    this.maskAlpha = 1;
    this.disableFloodFill = false;
    this.maskTool = MaskTool.magicWand;
    
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('proj-id ');
      this.parentName = params.get('parent-img ');
      this.imageUrl = params.get('imgUrl');
      
      console.log('proj id for mask: ' + this.projectId);
    });

    //image loads after src is set, ensures canvas is initialized properly.
    this.image.onload = () => {
      this.initCanvas();
    }
    this.image.src = this.imageUrl;

    //  Initializes mask upolad form.
    this.initMaskForm();
    
    //  Fetch blob for mask upload and show maskUploadForm.
    this.postBlobsService.fetchBlob();
    this.displayMaskForm = true;
  }
  
  /**  
   *  Draws the image user selects from gallery on Canvas
   *    and creates a hidden canvas to store the original image 
   *    as a reference when scaling the imageUI.
   *  Assumes Image has loaded, ie. image src is set before initCanvas
   *    is called (using onload).
   */
  private initCanvas(): void {
    let imgWidth = this.image.width;
    let imgHeight = this.image.height;

    //  Initialize transparent black image data to use for mask size of image
    this.maskImageData = new ImageData(imgWidth,  imgHeight);

    //  Used to scale the image to the window size, 
    //    scaleFactor = .9 so the scaled image is smaller than the user's window.
    this.scaleFactor = Math.floor(window.innerHeight / imgHeight * this.scaleFactor);
    //  TODO(shmcaffrey): add scaling if image is larger than window
    if (this.scaleFactor <= 0) {
      this.scaleFactor =  1;
    }

    //  Initialize canvas to scaled image width and height and mask to img. 
    this.maskCanvas.nativeElement.width = imgWidth;
    this.maskCanvas.nativeElement.height = imgHeight;
    this.maskCtx = this.maskCanvas.nativeElement.getContext('2d');

    this.canvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.canvas.nativeElement.height = imgHeight * this.scaleFactor;
    this.ctx = this.canvas.nativeElement.getContext('2d');

    //   Draws image non scaled on full canvas
    this.ctx.drawImage(this.image, 0, 0);

    //  Sets the ImageData to be inputed by mask.directive
    //  To change image data, just need to reinitialize page. 

    //  Only gets the image data from 0,0 to the width and height of image,
    //    not based on canvas.
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
  *  Draws user's image scaled to canvas and restores ctx.
  *  @param image is either the mask image or image user is making a mask of.
  */
  private drawScaledImage(image: HTMLImageElement) {
    this.ctx.save();
    this.ctx.scale(this.scaleFactor, this.scaleFactor); 
    this.ctx.drawImage(image, 0, 0, image.width, image.height);
    this.ctx.restore();
  }

 /** 
  *  Sets new pixels in magenta, clears canvas of previous data 
  *    and draws image and mask as scaled. Disables submit
  *    on mask until the url is set. 
  *  class @param this.disableFloodFill must equal true before pixels updated  
  *    so another floodfill isn't called before one finishes.
  *  class @param this.disableSubmit set equal to true before pixels updated 
  *    so submit isn't called before mask is drawn and url is updated.
  *  class @param maskPixels event Output() from mask.directive
  *    Gives the new pixels to add to the mask
  *  Only returned when maskTool is 'magic-wand', no need to check maskTool
  */
  addToMask(maskPixels: Set<number>) {
    this.disableSubmit = this.disableFloodFill = true;

    for (let pixel of maskPixels) {
      this.maskImageData.data[pixel] = 255;
      this.maskImageData.data[pixel + 2] = 255;
      this.maskImageData.data[pixel + 3] = 255;
    }
    this.drawMask();
    this.disableSubmit = this.disableFloodFill = false;
  }

/**  
  *  Makes a png of mask so the the background is transparent.
  *  Clears canvas, draws the original image and draws the mask.
  *  Executes all three functions after image loads so 'jolt' of canvas erase and draw is less extreme.
  *  Disables Flood fill before maskUrl is being set so new data isn't added
  *  class @param this.disableSubmit set to true before mask loaded because maskUrl is being updated.
  */  
  private drawMask() {
    this.disableSubmit = true;
    let mask = new Image();
    mask.onload = () => {
      this.clearCanvas();
      if (this.maskTool != MaskTool.maskOnly) {
        this.drawScaledImage(this.image);
      }
      this.ctx.save();
      this.ctx.globalAlpha = this.maskAlpha;
      console.log('global alpha = ' + this.maskAlpha);
      this.drawScaledImage(mask);
      this.ctx.restore();
      this.disableSubmit = false;
    }
    mask.src = this.updateMaskUrl();
  }

 /** 
  *  Draws Mask Data onto unscaled canvas to save as image or blob.
  *  Saves the mask url if user wants to save mask.
  *  @returns url of newly created mask.
  */
  updateMaskUrl(): string {
    this.maskCtx.clearRect(0, 0, this.maskCanvas.nativeElement.width, this.maskCanvas.nativeElement.height);
    this.maskCtx.beginPath();
    this.maskCtx.putImageData(this.maskImageData, 0, 0);
    this.maskImageUrl = this.maskCanvas.nativeElement.toDataURL();
    return this.maskImageUrl;
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
   *  Gets current mask's url and sets the mask as a Blob to be uploaded to server.
   */
  async getMaskBlob(): Promise<void> {
    this.blobMask = await fetch(this.maskImageUrl).then(response => response.blob());
    //this.blobMask.lastModifiedDate = new Date();
  }

 /** 
  *  Builds ImageBlob to be appended to form and posted.
  */
  async onSubmit(): Promise<void> {
    //  Name is a required input. If it's null, do nothing.
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

 /**
  *  Emitted from toolbar. Clears canvas of old mask and draws image anew.
  *  Clears old image data. Disables submit while mask is updating.
  *  class @param this.disableFloodFill must equal true before called because 
  *     maskImageData is being updated. Only switched to false if user tool is 'magic-wand'
  *     (flood fill not allowed any other time).
  */
  clearMask() {
    this.disableFloodFill = true;
    this.maskImageData = new ImageData(this.image.width, this.image.height);
    this.drawMask();
    if (this.maskTool == MaskTool.magicWand) {
      this.disableFloodFill = false;
    }
  }
  
  /**  
  *  Sets all pixels to magenta and inverts their alpha to display them or not. 
  *  Disables flood fill and submit to avoid conflict as mask updates.
  *  class @param this.disableSubmit set equal to true before pixels updated 
  *    so submit isn't called before mask is drawn and url is updated.
  *  class @param this.disableFloodFill must equal true before called because 
  *    maskImageData is being updated. Only switched to false if user tool is 'magic-wand'
  *    (flood fill not allowed any other time).
  */
  invertMask() {
    this.disableSubmit = this.disableFloodFill = true;
    for(let i = 0; i < this.maskImageData.data.length; i+=4) {
      this.maskImageData.data[i] = 255;
      this.maskImageData.data[i + 2] = 255;
      this.maskImageData.data[i + 3] = 255 - this.maskImageData.data[i+ 3];
    }
    this.drawMask();
    if (this.maskTool == MaskTool.magicWand) {
      this.disableFloodFill = false;
    }
    this.disableSubmit = false;
  }


  /**  Retrieves new tolerance value from child component toolbar and updates. */
  updateTolerance(value: number) {
    this.tolerance = value;
    console.log('new tolerance: ' + value);
  }

 /** 
  *  Retrieves new alpha value from child component toolbar and draws mask with new alpha.
  *  The alpha value cannot be larger than 1 or less than 0, so the value is adjusted to fit in range.
  */
  updateMaskAlpha(value: number) {
    this.maskAlpha = Math.min(Math.max(value, 0.0), 1.0);
    //  Draw mask with new maskAlpha value.
    this.disableFloodFill = true;
    this.drawMask();
    if (this.maskTool == MaskTool.magicWand) {
      this.disableFloodFill = false;
    }
    console.log('new maskAlpha: ' + value);
  }

 /** 
  *  Updates the value of the Toolbar toggle group.
  */
  updateMaskTool(tool: string) {
    console.log('New Tool: ' + tool);
    //  All cases beside 'magic-wand' must disableFloodFill.
    this.disableFloodFill = true;
    switch (tool) {
      case 'MAGIC-WAND': 
        this.maskTool = MaskTool.magicWand;
        this.disableFloodFill = false;
        break;
      case 'PAINT':
        this.maskTool = MaskTool.paint;
        break;
      case 'MASK-ONLY':
        this.maskTool = MaskTool.maskOnly;
        break;
    }
    console.log('switched tool to ' + this.maskTool);
    //  Always redraw mask/image when switching between features because of MaskOnly tool.
    this.drawMask();
  }

 /**
  *  Adds pixel user painted to mask.
  *  TODO: Possibly change the implementation so the pixel drawn is
  *        replecated on the screen ASAP, and then once the user finishes 
  *        drawing (mouse up) then the real mask is drawn based on the set.
  *        Would decrease lag.
  */
  drawPixel(pixel: number) {
    this.maskImageData.data[pixel] = 255;
    this.maskImageData.data[pixel + 2] = 255;
    this.maskImageData.data[pixel + 3] = 255;
    this.drawMask();
  }
}
