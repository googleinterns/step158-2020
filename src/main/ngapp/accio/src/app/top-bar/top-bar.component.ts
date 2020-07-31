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

  // TODO: Button on topbar stays as "Sign In" 
  //       When looking at the browser console 
  //       the log says 'signed out' immediately 
  //       following 'signed in'
  //  To fix once user API is integrated 
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
