import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { PostBlobsService } from '../post-blobs.service';
import { FetchImagesService } from '../fetch-images.service';
import { ImageBlob } from '../ImageBlob';
import { MaskTool } from './MaskToolEnum';
import { Coordinate } from './Coordinate';
import * as $ from 'jquery';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  mySubscription: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postBlobsService: PostBlobsService,
    private fetchImagesService: FetchImagesService,
  ) {
    //  Tells Router to not reuse route so when url is changed,
    //    reloads component with new url info.
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //  If the current route ends (ie url changes) trick router to believe it wasn't loaded
    //    in order to reload the component.
    this.mySubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.router.navigated = false;
      }
    });
  }

  //  Display variables.
  private image: HTMLImageElement;
  private maskImageData: ImageData;
  index: number;
  displayMaskForm: boolean = false;
  disableSubmit: boolean = false;
  stageWidth: number;
  stageHeight: number;
  brushWidth: number;

  MAGENTA: string = 'rgba(255, 0, 255, 1)';
  DESTINATION_OUT: string = 'destination-out';
  SOURCE_OVER: string = 'source-over';
  
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
  maskAlpha: number;
  disableFloodFill: boolean;
  //  Declares the type of tool the user has selected from the tool bar:
  //      'magic-wand' = flood fill algorithm enabled.
  //      'mask-only' = user sees only the mask and cannot use the magic wand tool. 
  maskTool: MaskTool;

  //  Stores image that user queued from img-Gallery for next and prev arrows.
  //  Array<any> because info comes from survlet as json array
  imageArray: Array<any>;

  // Inject canvas from html.
  @ViewChild('scaledCanvas', { static: true })
  scaledCanvas: ElementRef<HTMLCanvasElement>; 
  private scaledCtx: CanvasRenderingContext2D;

  //  Holds static user image for background.
  @ViewChild('imageCanvas', { static: true })
  imageCanvas: ElementRef<HTMLCanvasElement>; 
  private imageCtx: CanvasRenderingContext2D;

  //  Unscaled canvas that is used to save mask
  //    as the same size as its image.
  @ViewChild('maskCanvas', { static: true })
  maskCanvas: ElementRef<HTMLCanvasElement>; 
  private maskCtx: CanvasRenderingContext2D;

  ngOnInit() {
    this.image = new Image();
    let imageUrl: string;
    this.scaleFactor = .9;
    this.tolerance = 30;
    this.maskAlpha = 1;
    this.disableFloodFill = false;
    this.maskTool = MaskTool.MAGIC_WAND_ADD;
    this.brushWidth = 1;

    //  Gets last image array that user sorted on img-gallery page. 
    this.fetchImagesService.currentImages.subscribe(newImages => this.imageArray = newImages);
    console.log(this.imageArray.length + ': size of image array from img-Gallery');
    
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('proj-id ');
      this.parentName = params.get('parent-img ');
      imageUrl = params.get('imgUrl ');
      try {
        this.index = Number(params.get('index'));
      }
      catch {
        console.log('index: ' + params.get('index') + 'could not be parsed as number.');
        this.index = 0;
      }
      console.log('proj id for mask: ' + this.projectId);
    });

    //image loads after src is set, ensures canvas is initialized properly.
    this.image.onload = () => {
      this.initCanvas();
    }
    this.image.src = imageUrl;

    //  Initializes mask upolad form.
    this.initMaskForm();
    
    //  Fetch blob for mask upload and show maskUploadForm.
    this.postBlobsService.fetchBlob();
    this.displayMaskForm = true;
  }

  /** Unsubscribe from subscription when component reloaded */
  ngOnDestroy() {
    if (this.mySubscription) {
      this.mySubscription.unsubscribe();
    }
  }
  
  /**  
   *  Draws the image user selects from gallery on Canvas
   *    and creates a hidden canvas to store the original image 
   *    as a reference when scaling the imageUI.
   *  Assumes Image has loaded, i.e. image src is set before initCanvas
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

    //  Canvas to draw mask, hidden.
    this.maskCanvas.nativeElement.width = imgWidth;
    this.maskCanvas.nativeElement.height = imgHeight;
    this.maskCtx = this.maskCanvas.nativeElement.getContext('2d');
    this.maskCtx.lineCap = this.maskCtx.lineJoin = 'round';
    this.maskCtx.strokeStyle = this.MAGENTA;

    //  Canvas to show mask scaled.
    this.scaledCanvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.scaledCanvas.nativeElement.height = imgHeight * this.scaleFactor;
    this.scaledCtx = this.scaledCanvas.nativeElement.getContext('2d');

    //  Canvas to show Image (never changes unless user only wants to see Mask)
    this.imageCanvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.imageCanvas.nativeElement.height = imgHeight * this.scaleFactor;
    this.imageCtx = this.imageCanvas.nativeElement.getContext('2d');
    
    this.stageWidth = imgWidth * this.scaleFactor;
    this.stageHeight = imgHeight * this.scaleFactor;

    //   Draws image non scaled on full canvas
    this.imageCtx.drawImage(this.image, 0, 0);

    //  Only gets the image data from (0,0) to (width,height) of image.
    this.originalImageData = this.imageCtx.getImageData(0, 0, imgWidth, imgHeight);

    this.drawScaledImage();
    console.log('put imagedata');
  }
  
 /**
  *   Clears full canvas.
  */
  private clearScaledCanvas() {
    this.scaledCtx.clearRect(0, 0, this.scaledCanvas.nativeElement.width, this.scaledCanvas.nativeElement.height);
  }

 /**
  *  Draws user's image scaled to canvas and restores ctx.
  */
  private drawScaledImage() {
    this.imageCtx.save();
    this.imageCtx.scale(this.scaleFactor, this.scaleFactor); 
    this.imageCtx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
    this.imageCtx.restore();
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
  floodfillMask(maskPixels: Set<number>) {
    this.disableSubmit = this.disableFloodFill = true;

    //  Changes if set of pixels are added or removed from the mask depending on the tool.
    let alphaValue = (this.maskTool == MaskTool.MAGIC_WAND_ADD) ? 255: 0;

    for (let pixel of maskPixels) {
      this.maskImageData.data[pixel] = 255;
      this.maskImageData.data[pixel + 2] = 255;
      this.maskImageData.data[pixel + 3] = alphaValue;
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
    this.clearScaledCanvas();

    this.scaledCtx.save();
    this.scaledCtx.scale(this.scaleFactor, this.scaleFactor);
    createImageBitmap(this.maskImageData).then(renderer => {    
      this.scaledCtx.globalAlpha = this.maskAlpha;
      console.log('global alpha when drawing mask: ' + this.scaledCtx.globalAlpha);
      this.scaledCtx.drawImage(renderer, 0, 0, this.scaledCanvas.nativeElement.width, this.scaledCanvas.nativeElement.height);
    });
    console.log('mask drawn');
    this.scaledCtx.restore();
  }

  /** 
   *  Initializes Form group and data as new
   *  Initializes @param projectId
   */
  private initMaskForm() {
    this.uploadMaskForm = new FormGroup({
      maskName: new FormControl(),
      tags: new FormControl(),
    });
    this.formData = new FormData();
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
      /*tags=*/this.uploadMaskForm.get('tags').value
    );

    this.postBlobsService.buildForm(this.formData, imageBlob, this.parentName + 'Mask.png');

    //  Reset form values
    this.initMaskForm();
  }

  /** 
   *  Gets current mask's url and sets the mask as a Blob to be uploaded to server. TODO HERE UPDATE URL
   */
  async getMaskBlob(): Promise<void> {
    this.blobMask = await fetch(this.getMaskUrl()).then(response => response.blob());
  }

   /** 
  *  Draws Mask Data onto unscaled canvas to save as image or blob.
  *  @returns url of newly created mask.
  */
  getMaskUrl(): string {
    this.maskCtx.clearRect(0, 0, this.maskCanvas.nativeElement.width, this.maskCanvas.nativeElement.height);
    this.maskCtx.beginPath();
    this.maskCtx.putImageData(this.maskImageData, 0, 0);
    return this.maskCanvas.nativeElement.toDataURL();
  }

 /**
  *  Emitted from toolbar. Clears canvas of old mask.
  *  Clears old image data. Disables submit while mask is updating.
  *  class @param this.disableFloodFill must equal true before called because 
  *     maskImageData is being updated. Only switched to false if user tool is 'magic-wand'
  *     (flood fill not allowed any other time).
  */
  clearMask() {
    this.disableFloodFill = true;
    this.maskImageData = new ImageData(this.image.width, this.image.height);
    this.clearScaledCanvas();
    if (this.maskTool == MaskTool.MAGIC_WAND_ADD || this.maskTool == MaskTool.MAGIC_WAND_SUB) {
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
    if (this.maskTool == MaskTool.MAGIC_WAND_ADD || this.maskTool == MaskTool.MAGIC_WAND_SUB) {
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
    if (this.maskTool == MaskTool.MAGIC_WAND_ADD || this.maskTool == MaskTool.MAGIC_WAND_SUB) {
      this.disableFloodFill = false;
    }
    console.log('new maskAlpha: ' + value);
  }

 /** 
  *  Updates the value of the Toolbar toggle group.
  *  If the tool is switching from maskOnly, then it redraws the image on the imageCanvas.
  */
  updateMaskTool(tool: string) {
    console.log('New Tool: ' + tool);
    //  All cases beside 'magic-wand' must disableFloodFill.
    this.disableFloodFill = true;
    if (this.maskTool == MaskTool.MASK_ONLY) {
      this.drawScaledImage();
    }
    switch (tool) {
      case MaskTool.MAGIC_WAND_ADD: 
        this.maskTool = MaskTool.MAGIC_WAND_ADD;
        this.disableFloodFill = false;
        break;
      case MaskTool.MAGIC_WAND_SUB: 
        this.maskTool = MaskTool.MAGIC_WAND_SUB;
        break;
      case MaskTool.PAINT:
        this.maskTool = MaskTool.PAINT;
        break;
      case MaskTool.ERASE:
        this.maskTool = MaskTool.ERASE;
        break;
      case MaskTool.MASK_ONLY:
        this.maskTool = MaskTool.MASK_ONLY;
        this.imageCtx.clearRect(0,0,this.imageCanvas.nativeElement.width, this.imageCanvas.nativeElement.height);
        break;
    }
    console.log('switched tool to ' + this.maskTool);
  }

  updateBrushWidth(width: number) {
    this.brushWidth = width
  }

 /**
  *  Adds/Erases pixel user painted/erased to mask.
  *  TODO: Possibly change the implementation so the pixel drawn is
  *        replicated on the screen ASAP, and then once the user finishes 
  *        drawing (mouse up) then the real mask is drawn based on the set.
  *        Would decrease lag.
  */
  private startPixel: Coordinate;

 /** 
  *  Sets the start pixel where the users initially clicks the canvas to draw.
  *  @param pixel is the (x,y) coordinate the user first clicks on.
  *  The global composition changes depending on whether the user is painting or erasing.
  *  DESTINATION_OUT for erase, SOURCE_OVER for draw
  */
  startDraw(pixel: Coordinate) {
    this.startPixel = pixel;
    this.maskCtx.clearRect(0, 0, this.image.width, this.image.height);
    this.maskCtx.putImageData(this.maskImageData, 0, 0);
    this.maskCtx.globalCompositeOperation = 
            (this.maskTool == MaskTool.PAINT || this.maskTool == MaskTool.MAGIC_WAND_ADD) 
             ? this.SOURCE_OVER : this.DESTINATION_OUT;
    console.log(this.brushWidth + ' brush width');
  }
 /** 
  *  Draws or erases line between previous point user moved over and next point moved over.
  *  Adjusts line width based on user input.
  *  @param pixel is emitted after user moves over a new x,y coordinate on the canvas.
  *  Sets this.startPixel to @param pixel to keep continuous drawing line.
  */
  drawPixel(pixel: Coordinate) {
    this.maskCtx.beginPath();
    this.maskCtx.lineWidth = this.brushWidth;

    this.maskCtx.moveTo(this.startPixel.x, this.startPixel.y);
    this.maskCtx.lineTo(pixel.x, pixel.y);
    this.maskCtx.stroke();

    this.startPixel = pixel;
    this.maskImageData = this.maskCtx.getImageData(0, 0, this.image.width, this.image.height);
    this.drawMask();
  }

 /** 
  *  Returns the RouterLink for the next or previous image in the user's last selection 
  *    of gallery images.
  *  @param previous signifies whether the user has selected the previous image button.
  */
  newImage(previous: boolean) {
    //if nothing in the image gallery or there is only one image then just reload.
    if (this.imageArray.length <= 1) {
      this.router.navigateByUrl(this.router.url);
      return;
    }
    
    if (previous) {
      (this.index - 1 < 0) ? this.index = this.imageArray.length - 1 : --this.index;
    }
    else {
      (this.index + 1 >= this.imageArray.length) ? this.index = 0 : ++this.index;
    }
    let nextImage = this.imageArray[this.index];

    console.log('nextImage of index: ' + this.index);
    console.log(nextImage);
    this.router.navigate(['/editor', this.projectId, nextImage['name'], nextImage['url'], this.index]);
    //  Component reloaded when router url changes, If the user refreshes the page, the imageArray is lost.**
  }
}
