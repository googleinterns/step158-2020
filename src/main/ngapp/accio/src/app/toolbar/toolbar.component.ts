import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {}

  /** 
   * TODO(shcaffrey) Add functionality to slidebar to input tolerance into flood fill algo.
   */
  getTolerance(value: number) {
      console.log(value);
  }
}
