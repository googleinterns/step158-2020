import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // TODO: Add filter global once talk w/ DB team to understand it.
  //       Also add it as attribute in getProject's url var.
  filterVisibility: string;
  filterRole: string;
  filterTag: string;
  filterId: string;
  filterSort: string;

  projectPath: string;
  projects: Array<any>;

  constructor(
      private router: Router) { }

  ngOnInit(): void {
    this.handleLoggedOut();
  }
  
  // Redirects user to intro page if not logged in
  async handleLoggedOut(): Promise<void> {
    console.log('handling login...');
    const response = await fetch('/login-status?page=');
    /**Content received contains 
     * {loggedIn: boolean,
     * url: string} 
     */
    const content = await response.json();

    if (!content.loggedIn) {
      this.router.navigate(['/intro']);
    }
  }

  // Fetches a list of projects based on user's choice of filters.
  // Result is stored in this.projects
  async fetchProjects(): Promise<void> {
    const url = '/projects?' + $.param({
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
    console.log('content is: ' + content[0]['projId']);
    this.projects = content;
  }
}