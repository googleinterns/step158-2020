package com.google.sps.servlets;

import java.util.ArrayList;

/**
 * Holds relevant project info to return to front end and
 * allows for easy creation of JSON response.
 */
class ProjectInfo {
  String projId;
  String name;
  String timestamp;
  String visibility;
  ArrayList<String> owners;
  ArrayList<String> editors;

  public ProjectInfo(String projId, String name, String timestamp,
                     String visibility, ArrayList<String> owners,
                     ArrayList<String> editors) {
    this.projId = projId;
    this.name = name;
    this.timestamp = timestamp;
    this.visibility = visibility;
    this.owners = owners;
    this.editors = editors;
  }
}