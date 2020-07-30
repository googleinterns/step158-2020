import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  constructor() { }

  userSignedIn = false;
  ngOnInit(): void {}

  // this needs to be fixed. 

  toggleButton(): string {
    if (!this.userSignedIn) { 
      console.log('User Signed in');
      this.userSignedIn = true;
      return signIn;
    }
    console.log('User Signed out');
    this.userSignedIn = false;
    return signOut;
  }
}

export const signIn = 'Sign In';
export const signOut = 'Sign Out';
