package com.google.sps.servlets;

/**
 * Holds the values url and name of an image after a successful POST request.
 */
class BlobPostReturn {
  String url;
  String name;

  public BlobPostReturn(String url, String name) {
    this.url = url;
    this.name = name;
  }
}