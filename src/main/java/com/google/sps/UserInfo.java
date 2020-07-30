package com.google.sps.servlets;

class UserInfo {
  boolean loggedIn;
  String url;

  public UserInfo(boolean loggedIn, String url) {
    this.loggedIn = loggedIn;
    this.url = url;
  }
}