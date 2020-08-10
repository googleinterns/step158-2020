import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {
  projectName: string;
  visibility: string;

  constructor(
      private router: Router) { }

  ngOnInit(): void { }

  // Makes a new project based on this.projectName and this.visibility 
  // selection by user and redirects to new project's page. 
  async initProject(): Promise<void> {
    const url = '/projects?' + $.param({
      mode: 'create',
      'proj-name': this.projectName,
      'visibility': this.visibility
    });
    console.log(url);

    const response = await fetch(url, {method: 'POST'});
    // ^Fetches a single attribute: 'proj-id: string'
    console.log('finished fetch...');
    const projId: string = await response.json();
    console.log('converted content to json...');
    console.log('proj-id: ' + projId);

    // Navigates to newly created project's page.
    const toGallery: string = '/img-gallery';
    console.log('navigating to  ' + toGallery);
    this.router.navigate([toGallery], { queryParams: { 'proj-id': projId } });
  }
}