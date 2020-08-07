import { Component, OnInit } from '@angular/core';
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

  constructor() { }

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
    liElement.innerHTML =
        `Project: <a href="/gallery">${name}</a>\n
        Timestamp: ${timestamp}`;
    return liElement;
  }
}