
/**
 *  Contains all relevant information when posting a blob to the server.
 *  Constructors are made based on the required information, anything not
 *    passed through the constructor is set to an empty string or false. 
 *      REQUIRED PARAMS:
 *        @param projectId:       String created when user creates a new project, 
 *                                  passed through url.
 *        @param imageName:       String of image/mask name by user, if empty, 
 *                                  store nothing in the database
 *        @param mode:            'create' if uploading an image or a mask, otherwise 
 *                                  'update' if deleting, renaming, etc. 
 *     NON-REQUIRED PARAMS:
 *        @param image:           Blob given when user uploads an image or created when 
 *                                  user saves a mask, not required unless in 'create' mode.
 *        @param parentImageName: Required when user is updating or creating a mask.
 *        @param newImageName:    Used to update an image's or mask's name.
 *        @param tags:            String of user inputed tags or labels on masks and images. 
 *                                  seperate tags must be entered seperated by commas.
 *        @param delete:          Parsed as a boolean when sent to the server, 
 *                                'true' if user is deleting the image or mask, otherwise false. 
 */
export class ImageBlob {
  // Required params
  projectId: string;
  imageName: string;
  mode: string;

  image: any;
  parentImageName: string;
  newImageName: string;
  tags: string;
  delete: string;

  // default parameters on non-required parameters 
  constructor(
    projectIdIn: string, 
    imageNameIn: string, 
    modeIn: string, 
    imageIn: Blob = '',
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
