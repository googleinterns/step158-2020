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

  ngOnInit(): void {
  }

  async initProject(): Promise<void> {
    let url = '/projects?' + $.param({
      mode: 'create',
      'proj-name': this.projectName,
      'visibility': this.visibility
    });
    console.log(url);
    let response = await fetch(url, {method: 'POST'});
    // content holds 'proj-id' attribute
    console.log('finished fetch...');
    let projId = await response.text();
    console.log('converted content to text...');
    // TODO: returned content is html Error 404, using .text for now.
    // Need to figure out how to resolve error and return proper json
    // for 'proj-id' attribute...uncomment line below once resolved.
    // const projId: string = content['proj-id'];
    console.log('projId: ' + projId);

    // TODO: Change path to /images after UI team refactors and adds
    // images component
    let toGallery = '/gallery';
    console.log('navigating to  ' + toGallery);
    this.router.navigate(['/gallery'], { queryParams: { 'proj-id': projId } });
  }
}