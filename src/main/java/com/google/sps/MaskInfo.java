package com.google.sps.servlets;

class MaskInfo {
  String url;
  String name;
  String utc;
  ArrayList<String> tags;

  public MaskInfo(String url, String name, String utc, ArrayList<String> tags) {
    this.url = url;
    this.name = name;
    this.utc = utc;
    this.tags = tags;
  }
}