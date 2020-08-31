import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import * as moment from 'moment-timezone';
import * as $ from 'jquery';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // TODO(shmcaffrey): Add filter global
  //       Also add it as attribute in getProject's url var.
  filterVisibility: string;
  filterRole: string;
  filterTag: string;
  filterId: string;
  filterSort: string;

  projectPath: string;
  projects: Array<any>;

  constructor(public dialog: MatDialog, public deleteDialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchProjects();
  }
/*
  // Opens up the dialog for updating the clicked project.
  updateButton(imageName: string, parentImageName: string): void {
    const dialogRef = this.dialog.open(UpdateImageDialog, {
      width: '600px',
      data: {
        projectId: this.projectId,
        imageName: imageName,
        parentImageName: parentImageName,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('UpdateImage dialog was closed...');
      console.log('Fetching updated images...');
      this.loadGalleryImages();
      console.log('Fetched updated images...');
    });
  }

  deleteButton(imageName: string, parentImageName: string): void {
    const dialogRef = this.deleteDialog.open(DeleteImageDialog, {
      width: '600px',
      data: {
        projectId: this.projectId,
        imageName: imageName,
        parentImageName: parentImageName,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadGalleryImages();
    });
  }*/

  // Fetches a list of projects based on user's choice of filters.
  // Result is stored in this.projects
  async fetchProjects(): Promise<void> {
    const url =
      '/projects?' +
      $.param({
        visibility: this.filterVisibility,
        role: this.filterRole,
        'search-term': this.filterTag,
        sort: this.filterSort,
        'proj-id': this.filterId,
      });
    const response = await fetch(url);
    // Request @returns a list of objects:
    // {name: string,
    // projId: string,
    // timestamp: string,
    // visibility: string,
    // owners: list<string>,
    // editors: list<string>}
    const content = await response.json();
    console.log('content is: ' + content[0]['projId']);
    this.projects = content;
  }

  /**
   * Use moment.js to format date and time.
   */
  formatDateTime(dateTime: string): string {
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return moment(dateTime).tz(tz).format('D MMM YYYY [at] h:mm a');
  }
}

export interface UpdateProjectData {
  projectId: string;
  imageName: string;
  parentImageName: string;
}

/**
 * Represents the dialog popup that appears when ImageGalleryComponent's
 * templateUrl calls the this.updateButton() function.
 */
 /*
@Component({
  selector: 'update-image-dialog',
  templateUrl: 'update-image-dialog.html',
})
export class UpdateImageDialog {
  updateImageForm: FormGroup;
  formData: FormData;

  constructor(
    private postBlobsService: PostBlobsService,
    public dialogRef: MatDialogRef<UpdateImageDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateImageData
  ) {}

  ngOnInit(): void {
    this.updateImageForm = new FormGroup({
      updateImgName: new FormControl(),
      updateTags: new FormControl(),
    });
    this.formData = new FormData();
  }*/

  /**Sends the form data to blobstore and then to /blobs servlet,
   * where the update to the image is saved in the database.
   */
//  onUpdateProject(): void {
//    let imageBlob = new ImageBlob(
 //     this.data.projectId,
 //     /*imageName=*/ this.data.imageName,
 //     /*mode=*/ 'update',
 //     /*image=*/ undefined,
 //     /*parentImageName=*/ this.data.parentImageName,
//      /*newImageName=*/ this.updateImageForm.get('updateImgName').value,
 //     /*tags=*/ this.updateImageForm.get('updateTags').value,
 //     /*delete=*/ false
/*    );
 
    console.log(this.updateImageForm.get('delete').value);
 
    this.postBlobsService.buildForm(this.formData, imageBlob, '');
 
    // Reset form values.
    this.updateImageForm.reset;
  }*/
 
  /**Closes dialog popup without changing or saving any edited values.*/
/*  onNoClick(): void {
    this.dialogRef.close();
  }
}
 */

