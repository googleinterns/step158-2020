import { Component, OnInit } from '@angular/core';

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
    /**@returns a list of objects:
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
      contentListElement.appendChild(
          this.createListElement(content['name'], content['timestamp'])
          );
    }
  }

  createListElement(name: string, timestamp: string): HTMLLIElement {
    const liElement = document.createElement('li');
    liElement.innerText = name + '\n' + timestamp;
    return liElement;
  }
}