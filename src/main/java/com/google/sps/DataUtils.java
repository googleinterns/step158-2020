package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Provides utilities for servlets interacting with the database.
 */
public final class DataUtils {
  public static final String ASCENDING_SORT = "asc";
  public static final String DESCENDING_SORT = "dsc";
  public static final String PRIVATE = "private";
  public static final String PUBLIC = "public";
  public static final String PROJECT = "Project";
  public static final String IMAGE = "Image";
  public static final String MASK = "Mask";

  /**
   * Determines if the given request parameter is empty.
   * @param     {String}    param   request parameter
   * @return    {boolean}
   */
  public static boolean isEmptyParameter(String param) {
    return param == null || param.isEmpty();
  }

  /**
   * Removes duplicate values with a hash set.
   * @param     {ArrayList<String>} al   all values
   * @return    {List<String>}
   */
  public static List<String> withDuplicatesRemoved(ArrayList<String> al) {
    LinkedHashSet<String> lhs = new LinkedHashSet<String>(al);
    return new ArrayList<String>(lhs);
  }

  /**
   * Parses comma-separated list into array.
   * @param     {String}            list   unseparated text
   * @return    {ArrayList<String>}
   */
  public static ArrayList<String> parseCommaList(String list)
      throws IOException {
    return new ArrayList(Arrays.asList(list.toLowerCase().split("\\s*,\\s*")));
  }

  /**
   * Parses mode for POST requests and returns whether the mode is create.
   * @param     {HttpServeletRequest}   request   the HTTP request
   * @param     {HttpServeletResponse}  response   the HTTP response
   * @return    {boolean}
   */
  public static boolean parseMode(HttpServletRequest request,
                                  HttpServletResponse response)
      throws IOException {
    String mode = request.getParameter("mode");
    if (isEmptyParameter(mode) || (!mode.toLowerCase().equals("create") &&
                                   !mode.toLowerCase().equals("update"))) {
      throw new IOException("Invalid mode.");
    }
    return mode.toLowerCase().equals("create");
  }

  /**
   * Retrieves project Entity with respect to access restrictions.
   * @param     {String}        projId          the Datastore key String for
   *                                            the working project
   * @param     {String}        userEmail          the User's email
   * @param     {boolean}       accessIfEditor  whether editors can access
   * @param     {boolean}       accessIfPublic  whether the project can be
                                                used for the current action
                                                given it is public
   * @return    {Entity}
   */
  public static Entity getProjectEntity(String projId, String userEmail,
                                        boolean accessIfEditor,
                                        boolean accessIfPublic)
      throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Entity projEntity = new Entity(PROJECT);
    Key projKey = projEntity.getKey();

    try {
      projKey = KeyFactory.stringToKey(projId);
      projEntity = datastore.get(projKey);
    } catch (Exception e) {
      throw new IOException(
          "You do not have permission to access this project.");
    }

    ArrayList<String> owners =
        (ArrayList<String>)projEntity.getProperty("owners");
    ArrayList<String> editors =
        (ArrayList<String>)projEntity.getProperty("editors");
    String existingVis = (String)projEntity.getProperty("visibility");

    boolean isOwner = owners.contains(userEmail);
    boolean isEditor =
        accessIfEditor && editors != null && editors.contains(userEmail);
    boolean isPublic = accessIfPublic && existingVis.equals(PUBLIC);

    if (!isOwner && !isEditor && !isPublic) {
      throw new IOException(
          "You do not have permission to access this project.");
    }

    return projEntity;
  }

  private DataUtils() {}
}