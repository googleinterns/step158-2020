package com.google.sps.servlets;

import java.util.ArrayList;

/**
 * Holds relevant image info to return to front end and
 * allows for easy creation of JSON response.
 */
class ImageInfo {
  String url;
  String name;
  String utc;
  ArrayList<String> tags;
  ArrayList<MaskInfo> masks;

  public ImageInfo(String url, String name, String utc, ArrayList<String> tags, ArrayList<MaskInfo> masks) {
    this.url = url;
    this.name = name;
    this.utc = utc;
    this.tags = tags;
    this.masks = masks;
  }
}