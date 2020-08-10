import { Component, OnInit, HostListener, Directive } from '@angular/core';

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
      return SIGN_IN;
    }
    console.log('User Signed out');
    this.userSignedIn = false;
    return SIGN_OUT;
  }
}

export const SIGN_IN = 'Sign In';
export const SIGN_OUT = 'Sign Out';
