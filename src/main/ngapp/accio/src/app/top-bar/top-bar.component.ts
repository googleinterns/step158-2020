import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  SIGN_OUT = 'Sign Out';
  SIGN_IN = 'Sign In';

  buttonText: string = 'login-server: fetch() failed';
  buttonLink: string;

  constructor() { }

  ngOnInit(): void {
    this.handleLogin();
  }

  async handleLogin() {
    console.log('handling login...');
    let response = await fetch('/login-status?page=');
    /**Content received contains 
     * {loggedIn: boolean,
     * url: string} 
     */
    let content = await response.json();

    // TODO: uncomment this code once UI team creates intro component:
    // If !loggedIn redirect to intro.html
    if (!content.loggedIn) {
      // location.href = '/intro';
      // TODO: remove once UI team creates intro component
      this.buttonText = this.SIGN_IN;
    } else if (content.loggedIn) {
      this.buttonText = this.SIGN_OUT;
    }

    document.getElementById('login-button').onclick = () => {
      console.log('click registered...');
      this.toggleButton(content.loggedIn, content.url);
      location.href = this.buttonLink;
    };
  }

  /**Sets the appropriate text and redirects url for the button
   * based on if the user is logged in or not.
   */
  toggleButton(loggedIn: boolean, url: string): void {
    this.buttonText = loggedIn ? this.SIGN_OUT : this.SIGN_IN;
    this.buttonLink = url;
  }
}