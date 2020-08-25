import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { PostBlobsService } from '../post-blobs.service';
import { ImageBlob } from '../ImageBlob';
import { MaskAction, Action, Tool } from './mask-action';
import { MaskControllerService } from './mask-controller.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private postBlobsService: PostBlobsService,
    private maskControllerService: MaskControllerService
  ) {}

  // Display variables.
  private image: HTMLImageElement;
  imageUrl: string;
  displayMaskForm: boolean = false;
  disableSubmit: boolean = false;

  // Mask variables.
  private maskImageData: ImageData;
  private maskImageUrl: string;

  // Form variables.
  uploadMaskForm: FormGroup;
  formData: FormData;
  projectId: string;
  parentName: string;
  blobMask: Blob;

  // scaleFactor is used to trim image scale so image
  //   is smaller than width and height of the user's screen.
  // The following variables are bound to their
  //   respective inputs in MaskDirective and change in mask.directive
  //   when they change in editor.component
  scaleFactor: number;
  originalImageData: ImageData;
  tolerance: number;
  disableFloodFill: boolean;
  // Declares the type of tool the user has selected from the tool bar:
  //     'magic-wand' = flood fill algorithm enabled.
  //     'mask-only' = user sees only the mask and cannot use the magic wand tool.
  // TODO(shmcaffrey): make string enum.
  maskTool: string;

  // inject canvas from html.
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;

  // Used to save mask as png so everytime a new mask is added
  //   The primary canvas does not have to shrink to image size
  //   to save the mask as an image.
  @ViewChild('maskCanvas', { static: true })
  maskCanvas: ElementRef<HTMLCanvasElement>;
  private maskCtx: CanvasRenderingContext2D;

  ngOnInit() {
    this.image = new Image();
    this.scaleFactor = 0.9;
    this.tolerance = 30;
    this.disableFloodFill = false;

    this.route.paramMap.subscribe((params) => {
      this.projectId = params.get('proj-id ');
      this.parentName = params.get('parent-img ');
      this.imageUrl = params.get('imgUrl');

      console.log('proj id for mask: ' + this.projectId);
    });

    // image loads after src is set, ensures canvas is initialized properly.
    this.image.onload = () => {
      this.initCanvas();
    };
    this.image.src = this.imageUrl;

    // Initializes mask upolad form.
    this.initMaskForm();

    // Fetch blob for mask upload and show maskUploadForm.
    this.postBlobsService.fetchBlob();
    this.displayMaskForm = true;
  }

  /**
   * Draws the image user selects from gallery on Canvas
   *   and creates a hidden canvas to store the original image
   *   as a reference when scaling the imageUI.
   * Assumes Image has loaded, ie. image src is set before initCanvas
   *   is called (using onload).
   */
  private initCanvas(): void {
    let imgWidth = this.image.width;
    let imgHeight = this.image.height;

    // Initialize transparent black image data to use for mask size of image
    this.maskImageData = new ImageData(imgWidth, imgHeight);

    // Used to scale the image to the window size,
    //   scaleFactor = .9 so the scaled image is smaller than the user's window.
    this.scaleFactor = Math.floor(
      (window.innerHeight / imgHeight) * this.scaleFactor
    );
    //  TODO(shmcaffrey): add scaling if image is larger than window
    if (this.scaleFactor <= 0) {
      this.scaleFactor = 1;
    }

    // Initialize canvas to scaled image width and height and mask to img.
    this.maskCanvas.nativeElement.width = imgWidth;
    this.maskCanvas.nativeElement.height = imgHeight;
    this.maskCtx = this.maskCanvas.nativeElement.getContext('2d');

    this.canvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.canvas.nativeElement.height = imgHeight * this.scaleFactor;
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Draws image non scaled on full canvas
    this.ctx.drawImage(this.image, 0, 0);

    // Sets the ImageData to be inputed by mask.directive
    // To change image data, just need to reinitialize page.

    // Only gets the image data from 0,0 to the width and height of image,
    //   not based on canvas.
    this.originalImageData = this.ctx.getImageData(0, 0, imgWidth, imgHeight);
    this.clearCanvas();

    this.drawScaledImage(this.image);
    console.log('put imagedata');
  }

  /**
   * Clears full canvas.
   */
  private clearCanvas() {
    this.ctx.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
    this.ctx.beginPath();
  }

  /**
   * Draws user's image scaled to canvas and restores ctx.
   * @param image is either the mask image or image user is making a mask of.
   */
  private drawScaledImage(image: HTMLImageElement) {
    this.ctx.save();
    this.ctx.scale(this.scaleFactor, this.scaleFactor);
    this.ctx.drawImage(image, 0, 0, image.width, image.height);
    this.ctx.restore();
  }

  /**
   * Sets new pixels in magenta, clears canvas of previous data
   *   and draws image and mask as scaled. Disables submit
   *   on mask until the url is set.
   * class @param this.disableFloodFill must equal true before called because
   *   maskImageData is being updated.
   * class @param this.disableSubmit must equal true before called because
   *   maskUrl is being updated in drawMask().
   * class @param maskPixels event Output() from mask.directive
   *   Gives the new pixels to add to the mask
   * Only returned when maskTool is 'magic-wand', no need to check maskTool
   */
  addToMask(maskAction: MaskAction) {
    this.disableSubmit = this.disableFloodFill = true;

    for (let pixel of maskAction.getChangedPixels()) {
      this.maskImageData.data[pixel] = 255;
      this.maskImageData.data[pixel + 2] = 255;
      this.maskImageData.data[pixel + 3] = 255;
    }
    this.maskControllerService.do(maskAction);
    this.drawMask();
    this.disableSubmit = this.disableFloodFill = false;
  }

  removeFromMask(maskAction: MaskAction) {
    this.disableSubmit = this.disableFloodFill = true;

    for (let pixel of maskAction.getChangedPixels()) {
      this.maskImageData.data[pixel] = 0;
      this.maskImageData.data[pixel + 2] = 0;
      this.maskImageData.data[pixel + 3] = 0;
    }
    this.maskControllerService.do(maskAction);
    this.drawMask();
    this.disableSubmit = this.disableFloodFill = false;
  }

  setMaskTo(pixels: Set<number>): void {
    this.maskImageData = new ImageData(this.image.width, this.image.height);
    for (let pixel of pixels) {
      this.maskImageData.data[pixel] = 255;
      this.maskImageData.data[pixel + 2] = 255;
      this.maskImageData.data[pixel + 3] = 255;
    }
  }

  undo(): void {
    this.disableSubmit = this.disableFloodFill = true;
    this.maskControllerService.undo();
    this.setMaskTo(this.maskControllerService.getMask());
    this.drawMask();
    this.disableSubmit = this.disableFloodFill = false;
  }

  redo(): void {
    this.disableSubmit = this.disableFloodFill = true;
    this.maskControllerService.redo();
    this.setMaskTo(this.maskControllerService.getMask());
    this.drawMask();
    this.disableSubmit = this.disableFloodFill = false;
  }

  /**
   * Makes a png of mask so the the background is transparent.
   * Clears canvas, draws the original image and draws the mask.
   * Executes all three functions after image loads so 'jolt' of canvas erase and draw is less extreme.
   * Disables Flood fill before maskUrl is being set so new data isn't added
   * class @param this.disableSubmit must equal true before called because maskUrl is being updated.
   */
  private drawMask() {
    let mask = new Image();
    mask.onload = () => {
      this.clearCanvas();
      if (this.maskTool != 'mask-only') {
        this.drawScaledImage(this.image);
      }
      this.drawScaledImage(mask);
    };
    mask.src = this.updateMaskUrl();
  }

  /**
   * Draws Mask Data onto unscaled canvas to save as image or blob.
   * Saves the mask url if user wants to save mask.
   * @returns url of newly created mask.
   */
  updateMaskUrl(): string {
    this.maskCtx.clearRect(
      0,
      0,
      this.maskCanvas.nativeElement.width,
      this.maskCanvas.nativeElement.height
    );
    this.maskCtx.beginPath();
    this.maskCtx.putImageData(this.maskImageData, 0, 0);
    this.maskImageUrl = this.maskCanvas.nativeElement.toDataURL();
    return this.maskImageUrl;
  }

  // TODO(shmcaffrey): change Alpha value to incorporate user input.

  /**
   * Initializes Form group and data as new
   * Initializes @param projectId
   */
  private initMaskForm() {
    this.uploadMaskForm = new FormGroup({
      maskName: new FormControl(),
      labels: new FormControl(),
    });

    this.formData = new FormData();
  }

  /**
   * Gets current mask's url and sets the mask as a Blob to be uploaded to server.
   */
  async getMaskBlob(): Promise<void> {
    this.blobMask = await fetch(this.maskImageUrl).then((response) =>
      response.blob()
    );
    //this.blobMask.lastModifiedDate = new Date();
  }

  /**
   * Builds ImageBlob to be appended to form and posted.
   */
  async onSubmit(): Promise<void> {
    //  Name is a required input. If it's null, do nothing.
    if (!this.uploadMaskForm.get('maskName').value) {
      return;
    }

    await this.getMaskBlob();

    let imageBlob = new ImageBlob(
      this.projectId,
      /*imageName=*/ this.uploadMaskForm.get('maskName').value,
      /*mode=*/ 'create',
      /*image=*/ this.blobMask,
      /*parentImageName=*/ this.parentName,
      /*newImageName=*/ '',
      /*tags=*/ this.uploadMaskForm.get('labels').value
    );

    this.postBlobsService.buildForm(
      this.formData,
      imageBlob,
      this.parentName + 'Mask.png'
    );

    this.maskControllerService.save();

    //  Reset form values
    this.initMaskForm();
  }

  /**
   * Emitted from toolbar. Clears canvas of old mask and draws image anew.
   * Clears old image data. Disables submit while mask is updating.
   * class @param this.disableSubmit must equal true before called because
   *   maskUrl is being updated in getMaskUrl.
   * class @param this.disableFloodFill must equal true before called because
   *    maskImageData is being updated. Only switched to false if user tool is 'magic-wand'
   *    (flood fill not allowed any other time).
   */
  clearMask() {
    this.disableSubmit = this.disableFloodFill = true;
    this.maskImageData = new ImageData(this.image.width, this.image.height);
    this.maskControllerService.do(
      new MaskAction(
        Action.CLEAR,
        Tool.CLEAR,
        this.maskControllerService.getMask()
      )
    );
    this.drawMask();
    this.disableSubmit = false;
    if (this.maskTool == 'magic-wand') {
      this.disableFloodFill = false;
    }
  }

  /** Retrieves new tolerance value from child component toolbar and updates. */
  updateTolerance(value: number) {
    this.tolerance = value;
    console.log('new tolerance: ' + value);
  }

  /**
   * Sets all pixels to magenta and inverts their alpha to display them or not.
   * Disables flood fill and submit to avoid conflict as mask updates.
   * class @param this.disableSubmit must equal true before called because
   *   maskUrl is being updated in drawMask().
   * class @param this.disableFloodFill must equal true before called because
   *    maskImageData is being updated. Only switched to false if user tool is 'magic-wand'
   *    (flood fill not allowed any other time).
   */
  invertMask() {
    this.disableSubmit = this.disableFloodFill = true;
    this.maskControllerService.do(
      new MaskAction(
        Action.INVERT,
        Tool.INVERT,
        new Set([...Array(this.originalImageData.data.length / 4).keys()])
      )
    );
    this.setMaskTo(this.maskControllerService.getMask());
    this.drawMask();
    this.disableSubmit = false;
    if (this.maskTool == 'magic-wand') {
      this.disableFloodFill = false;
    }
  }

  /**
   * Updates the value of the Toolbar toggle group.
   * All cases beside 'magic-wand' must disableFloodFill.
   */
  updateMaskTool(tool: string) {
    // change value selected on form;
    this.maskTool = tool;
    this.disableFloodFill = true;
    switch (tool) {
      case 'magic-wand':
        this.disableFloodFill = false;
        // redraw mask and image
        this.drawMask();
        break;
      case 'mask-only':
        let mask = new Image();
        this.disableSubmit = true;
        this.drawMask();
        this.disableSubmit = false;
        break;
    }
  }
}
