package com.google.sps.servlets;

/**
 * Holds relevant project info to return to front end
 * Allows for easy creation of JSON response
 */
class ProjectInfo {
  String projId;
  String name;
  String timestamp;
  String visibility;

  public ProjectInfo(String projId, String name, String timestamp, String visibility) {
    this.projId = projId;
    this.name = name;
    this.timestamp = timestamp;
    this.visibility = visibility;
  }
}