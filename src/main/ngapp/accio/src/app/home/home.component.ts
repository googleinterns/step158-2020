import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // TODO: add filter global once talk w/ DB team to understand it.
  // Also add it as attribute in getProject's url var.
  filterVisibility: string;
  filterRole: string;
  filterTag: string;
  filterId: string;
  filterSort: string;

  projectPath: string;

  constructor(
      private router: Router) { }

  ngOnInit(): void {
  }

  async getProjects(): Promise<any> {
    let url = '/projects?' + $.param({
      'visibility': this.filterVisibility,
      'role': this.filterRole,
      'search-term': this.filterTag,
      'sort': this.filterSort,
      'proj-id': this.filterId
    });
    const response = await fetch(url);
    /**Request @returns a list of objects:
     * {name: string,
     * projId: string,
     * timestamp: string,
     * visibility: string,
     * owners: list<string>,
     * editors: list<string>}
     */
    const content = await response.json();

    const contentListElement = document.getElementById("list-container");
    contentListElement.innerHTML = '';
    for (let i = 0; i < content.length; i++) {
      const project: object = content[i];
      contentListElement.appendChild(
          this.createProjListElement(project['name'],
          project['timestamp'],
          project['projId']));
          const x = 'hardcodedId'
    }
  }

  // Dynamically add html: <li> and provides redir link to correct project
  createProjListElement(name: string, timestamp: string, projId: string): HTMLLIElement {
    const liElement = document.createElement('li');
    this.projectPath = '/gallery?proj-id=' + projId;
    liElement.innerHTML =
        `Project: ${name}\n
        Timestamp: ${timestamp}\n
        <button mat-raised-button (click)="gotoProject("${projId}")">
        Open ${name}
        </button>`;
    return liElement;
  }

  gotoProject(projId: string): void {
    // TODO: Change path to /images after UI team refactors and adds
    // images component
    const toGallery: string = '/gallery';
    console.log('navigating to  ' + toGallery);
    this.router.navigate([toGallery], { queryParams: { 'proj-id': projId } });
  }
}