package com.google.sps.servlets;

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