import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import * as moment from 'moment-timezone';
import * as $ from 'jquery';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

export interface StoredProject {
  projId: string;
  name: string;
  visibility: string;
  utc: string;
  owners: string[];
  editors: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // TODO(shmcaffrey): Add filter global
  //    Also add it as attribute in getProject's url var.
  filterVisibility: string;
  filterRole: string;
  filterTag: string;
  filterId: string;
  filterSort: string;

  projectPath: string;
  projects: Array<StoredProject>;

  constructor(public dialog: MatDialog, public deleteDialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  // Opens up the dialog for updating the clicked project.
  updateButton(
    projectId: string,
    projectName: string,
    visibility: string,
    ownersList: string[],
    editorsList: string[]
  ): void {
    let ownersListString = ownersList.toString().replace(',', ', ');
    let editorsListString =
      editorsList !== undefined
        ? editorsList.toString().replace(',', ', ')
        : '';

    const dialogRef = this.dialog.open(UpdateProjectDialog, {
      width: '600px',
      data: {
        projectId: projectId,
        projectName: projectName,
        visibility: visibility,
        ownersList: ownersListString,
        editorsList: editorsListString,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('UpdateProject dialog was closed...');
      console.log('Fetching updated projects...');
      this.fetchProjects();
      console.log('Fetched updated projects...');
    });
  }

  deleteButton(projectId: string): void {
    const dialogRef = this.deleteDialog.open(DeleteProjectDialog, {
      width: '600px',
      data: {
        projectId: projectId,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.fetchProjects();
    });
  }

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
  projectName: string;
  visibility: string;
  ownersList: string;
  editorsList: string;
}

/**
 * Represents the dialog popup that appears when HomeComponent's
 * templateUrl calls the this.updateButton() function.
 */
@Component({
  selector: 'update-project-dialog',
  templateUrl: 'update-project-dialog.html',
})
export class UpdateProjectDialog {
  updateProjectForm: FormGroup;
  formData: FormData;

  constructor(
    public dialogRef: MatDialogRef<UpdateProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateProjectData
  ) {}

  ngOnInit(): void {
    this.updateProjectForm = new FormGroup({
      updateProjectName: new FormControl(this.data.projectName),
      updateVis: new FormControl(this.data.visibility),
      updateOwners: new FormControl(this.data.ownersList),
      updateEditors: new FormControl(this.data.editorsList),
    });
    this.formData = new FormData();
  }

  async onUpdateProject(): Promise<void> {
    const url =
      '/projects?' +
      $.param({
        'proj-id': this.data.projectId,
        mode: 'update',
        'proj-name': this.updateProjectForm.get('updateProjectName').value,
        visibility: this.updateProjectForm.get('updateVis').value,
        owners: this.updateProjectForm.get('updateOwners').value,
        editors: this.updateProjectForm.get('updateEditors').value,
      });
    console.log(url);

    const response = await fetch(url, { method: 'POST' });
    console.log('finished fetch...');

    // Reset form values.
    this.updateProjectForm.reset;
  }

  /**Closes dialog popup without changing or saving any edited values.*/
  onNoClick(): void {
    this.dialogRef.close();
  }
}

/**Represents the dialog popup that appears when HomeComponent's
 * templateUrl calls the this.updateButton() function.
 */
@Component({
  selector: 'delete-project-dialog',
  templateUrl: 'delete-project-dialog.html',
})
export class DeleteProjectDialog {
  formData: FormData;

  constructor(
    public dialogRef: MatDialogRef<DeleteProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateProjectData
  ) {}

  ngOnInit(): void {
    this.formData = new FormData();
  }

  async onDeleteProject(): Promise<void> {
    const url =
      '/projects?' +
      $.param({
        'proj-id': this.data.projectId,
        mode: 'update',
        delete: true,
      });
    console.log(url);

    const response = await fetch(url, { method: 'POST' });
    console.log('finished fetch...');

    this.onNoClick();
  }

  /**Closes dialog popup without changing or saving any edited values.*/
  onNoClick(): void {
    this.dialogRef.close();
  }
}
