
/**
 *  Contains all relevant information when posting a blob to the server.
 *  Constructors are made based on the required information, anything not
 *    passed through the constructor is set to an empty string or false.  
 *    
 */
export class ImageBlob {
  // Required params
  projectId: string;
  imageName: string;
  mode: string;

  image: Blob;
  parentImageName: string;
  newImageName: string;
  tags: string;
  delete: string;

  // default parameters on non-required parameters 
  constructor(
    projectIdIn: string, 
    imageNameIn: string, 
    modeIn: string, 
    imageIn: any = '',
    parentImageNameIn: string = '',
    newImageNameIn: string = '',
    tagsIn: string = '',
    deleteIn: string = 'false'
  ) {
    this.projectId = projectIdIn;
    this.imageName = imageNameIn;
    this.mode = modeIn;
    this.image = imageIn
    this.parentImageName = parentImageNameIn;
    this.newImageName = newImageNameIn;
    this.tags = tagsIn;
    this.delete = deleteIn;
  }
}