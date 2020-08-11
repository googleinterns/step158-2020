import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.delayedReload(4000);
  }

  // Reloads page with a delay based on: 
  // @param {int} ms (milliseconds)
  async delayedReload(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
    location.reload();
  }
}
