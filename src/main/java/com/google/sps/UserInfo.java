package com.google.sps.servlets;

/**
 * Holds relevant User login info to return to front end and
 * allows for easy creation of JSON response.
 */
class UserInfo {
  boolean loggedIn;
  String url;

  public UserInfo(boolean loggedIn, String url) {
    this.loggedIn = loggedIn;
    this.url = url;
  }
}