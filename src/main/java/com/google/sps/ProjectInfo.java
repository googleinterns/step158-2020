package com.google.sps.servlets;

class ProjectInfo {
  String projId;
  String name;
  String timestamp;
  String numOwners;
  String numEditors;
  String role;

  public UserInfo(String projId, String name, String timestamp, String numOwners, String numEditors, String role) {
    this.projId = projId;
    this.name = name;
    this.timestamp = timestamp;
    this.numOwners = numOwners;
    this.numEditors = numEditors; 
    this.role = role;
  }
}