package com.google.sps.servlets;

/**
 * Holds the Blobkey string and file extension of a Blob.
 */
class CustomBlobInfo {
  String blobKeyString;
  String fileExtension;

  public CustomBlobInfo(String blobKeyString, String fileExtension) {
    this.blobKeyString = blobKeyString;
    this.fileExtension = fileExtension;
  }
}