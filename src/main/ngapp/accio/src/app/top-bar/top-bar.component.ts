import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})


export class TopBarComponent implements OnInit {
  SIGN_OUT = 'Sign Out';
  SIGN_IN = 'Sign In';

  buttonText = '';
  buttonLink: string;

  constructor(
      private router: Router) { }

  ngOnInit(): void {
    this.handleLogin();
  }

  // Controls login-button text as well as which link the 
  // button redirects to.
  async handleLogin(): Promise<void> {
    console.log('handling login...');
    const response = await fetch('/login-status');
    // Content received contains 
    // {loggedIn: boolean,
    // url: string} 
    const content = await response.json();

    if (!content.loggedIn) {
      this.buttonText = this.SIGN_IN;
    } else if (content.loggedIn) {
      this.buttonText = this.SIGN_OUT;
    }

    document.getElementById('login-button').onclick = () => {
      console.log('click registered...');
      this.toggleButton(content.loggedIn, content.url);
        // Uses location.href because @angular/router doesn't support
        // redirects to external links.
        location.href = this.buttonLink;
    };
  }

  // Sets the appropriate text and redirects url for the button
  // based on if the user is logged in or not.
  toggleButton(loggedIn: boolean, url: string): void {
    this.buttonText = loggedIn ? this.SIGN_OUT : this.SIGN_IN;
    this.buttonLink = url;
  }
}
