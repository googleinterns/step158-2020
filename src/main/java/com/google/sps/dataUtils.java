package com.google.sps.servlets;

public final class dataUtils {
  public static final String ASCENDING_SORT = "asc";
  public static final String DESCENDING_SORT = "dsc";
  public static final String PRIVATE = "private";
  public static final String PUBLIC = "public";

  public static Boolean isEmptyParameter(String param) {
    return param == null || param.isEmpty();
  }

  private dataUtils() {}
}