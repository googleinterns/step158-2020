package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Handles POST and GET requests for projects
 * Allows creation and update of projects
 * Supports queries for projects based on various parameters
 */
@WebServlet("/projects")
public class ProjectServlet extends HttpServlet {

  private static final String ASCENDING_SORT = "asc";
  private static final String DESCENDING_SORT = "dsc";
  private static final String PRIVATE = "private";
  private static final String PUBLIC = "public";

  /**
   * Determines if the given request parameter is empty
   * @param     {String}    param   request parameter
   * @return    {Boolean}
   */
  private Boolean isEmptyParameter(String param) {
    return param == null || param.isEmpty();
  }

  /**
   * Removes duplicate values with a hash set
   * @param     {ArrayList<String>} al   all values
   * @return    {List<String>}
   */
  List<String> withDuplicatesRemoved(ArrayList<String> al) {
    LinkedHashSet<String> lhs = new LinkedHashSet<String>(al);
    return new ArrayList<String>(lhs);
  }

  /**
   * Parses comma-separated list of emails into array
   * @param     {String}            emails   unseparated emails
   * @return    {ArrayList<String>}
   */
  ArrayList<String> parseEmails(String emails) {
    return new ArrayList(
        Arrays.asList(emails.toLowerCase().split("\\s*,\\s*")));
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    // Must be logged in
    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      return;
    }

    // Mode is a required parameter
    String mode = request.getParameter("mode");
    if (isEmptyParameter(mode) || (!mode.toLowerCase().equals("create") &&
                                   !mode.toLowerCase().equals("update"))) {
      response.sendRedirect("/");
      return;
    }
    Boolean isCreateMode = (mode.toLowerCase().equals("create"));

    String uEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");

    // Will be either a new entity for creation or an existing entity for
    // updating
    Entity projEntity = new Entity("Project");

    if (!isCreateMode) {
      // Need project ID to update a project
      if (isEmptyParameter(projId)) {
        response.sendRedirect("/");
        return;
      }

      // Must be owner to update
      Key projKey = KeyFactory.stringToKey(projId);
      try {
        projEntity = datastore.get(projKey);
      } catch (Exception e) {
        response.sendRedirect("/");
        return;
      }
      ArrayList<String> owners =
          (ArrayList<String>)projEntity.getProperty("owners");
      if (!owners.contains(uEmail)) {
        response.sendRedirect("/");
        return;
      }

      // Delete overrides all other updates
      Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
      if (delete) {
        datastore.delete(projEntity.getKey());
        response.sendRedirect("/");
        return;
      }
    }

    // Last modified timestamp
    String now = Instant.now().toString();
    projEntity.setProperty("utc", now);

    String projName = request.getParameter("proj-name");

    // Set the project name if provided
    // If creating and nothing provided, set name to Untitled-{current UTC time}
    if (!isEmptyParameter(projName)) {
      projEntity.setProperty("name", projName);
    } else {
      if (isCreateMode) {
        projEntity.setProperty("name", "Untitled-" + now);
      }
      // Don't do anything if updating and no name provided
    }

    // Default visibility to private (only owners and editors can view)
    String visibility = request.getParameter("visibility");
    if (isEmptyParameter(visibility) && isCreateMode) {
      visibility = PRIVATE;
    }
    if (!isEmptyParameter(visibility) &&
        (visibility.toLowerCase().equals(PUBLIC) ||
         visibility.toLowerCase().equals(PRIVATE))) {
      projEntity.setProperty("visibility", visibility);
    }

    String ownersString = request.getParameter("owners");
    String editorsString = request.getParameter("editors");

    // If creating:
    //      owners are current User and any people in parameter
    //      if no one provided, current User is the only owner
    // if updating:
    //      owners are current User and any people in parameter
    //      if no one provided, change nothing
    if (isCreateMode || !isEmptyParameter(ownersString)) {
      ArrayList<String> listOwnerEmails = new ArrayList<String>();
      if (!isEmptyParameter(ownersString)) {
        listOwnerEmails = parseEmails(ownersString);
      }
      listOwnerEmails.add(uEmail);
      projEntity.setIndexedProperty("owners",
                                    withDuplicatesRemoved(listOwnerEmails));
    }

    // If anything provided for editors, overwrite current editors
    if (!isEmptyParameter(editorsString)) {
      ArrayList<String> listEditorEmails = parseEmails(editorsString);
      projEntity.setIndexedProperty("editors",
                                    withDuplicatesRemoved(listEditorEmails));
    }

    // Use URL-safe key as project ID
    // No security risk: only information exposed are kind ("Project")
    // and name/ID (autogenerated by Datastore)
    // Key is incomplete until upserted to Datastore
    if (isCreateMode) {
      projEntity.setProperty("proj-id",
                             KeyFactory.keyToString(datastore.put(projEntity)));
    }

    datastore.put(projEntity);
    response.sendRedirect("/");
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    // Must be logged in
    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      return;
    }

    String uEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");

    // Will be either a single project based on project ID or one or more
    // projects from a query based on various parameters
    ArrayList<Entity> projects = new ArrayList<Entity>();

    // Searching for one project with a project ID
    if (!isEmptyParameter(projId)) {
      // Project must be public or User must be an owner or editor for private
      // projects
      Key projKey = KeyFactory.stringToKey(projId);
      Entity projEntity = new Entity("Project");
      try {
        projEntity = datastore.get(projKey);
      } catch (Exception e) {
        response.sendRedirect("/");
        return;
      }
      ArrayList<String> owners =
          (ArrayList<String>)projEntity.getProperty("owners");
      ArrayList<String> editors =
          (ArrayList<String>)projEntity.getProperty("editors");
      String existingVis = (String)projEntity.getProperty("visibility");
      if (!owners.contains(uEmail) && !editors.contains(uEmail) &&
          !existingVis.equals(PUBLIC)) {
        response.sendRedirect("/");
        return;
      }
      projects.add(projEntity);
    }

    // Searching for multiple projects with various parameters
    else {
      String sort = request.getParameter("sort");
      // Sorted in descending chronological order by default
      if (isEmptyParameter(sort)) {
        sort = DESCENDING_SORT;
      }
      sort = sort.toLowerCase();

      Query projQuery = new Query("Project").addSort(
          "utc", sort.equals(ASCENDING_SORT) ? Query.SortDirection.ASCENDING
                                             : Query.SortDirection.DESCENDING);

      // Add relevant filters to array based on parameters
      ArrayList<Filter> allFilters = new ArrayList<Filter>();

      String role = request.getParameter("role");
      String visibility = request.getParameter("visibility");
      // Global overrides visibility and role
      Boolean global = Boolean.parseBoolean(request.getParameter("global"));
      if (global) {
        visibility = PUBLIC;
        role = "viewer";
      }

      Filter ownFilter =
          new FilterPredicate("owners", FilterOperator.EQUAL, uEmail);
      Filter editFilter =
          new FilterPredicate("editors", FilterOperator.EQUAL, uEmail);
      Filter ownOrEditFilter = new CompositeFilter(
          CompositeFilterOperator.OR, Arrays.asList(ownFilter, editFilter));

      // By default, filter to only projects the User owns or edits
      if (isEmptyParameter(role)) {
        allFilters.add(ownOrEditFilter);
      } else if (role.toLowerCase().equals("owner")) {
        allFilters.add(ownFilter);
      } else if (role.toLowerCase().equals("editor")) {
        allFilters.add(editFilter);
      }

      // Don't filter by visibility by default
      if (!isEmptyParameter(visibility) &&
          (visibility.toLowerCase().equals(PUBLIC) ||
           visibility.toLowerCase().equals(PRIVATE))) {
        Filter visFilter =
            new FilterPredicate("visibility", FilterOperator.EQUAL, visibility);
        allFilters.add(visFilter);
      }

      // Don't filter by search term if not provided
      // No partial matching/regex
      String searchTerm = request.getParameter("search-term");
      if (!isEmptyParameter(searchTerm)) {
        Filter searchFilter = new FilterPredicate("name", FilterOperator.EQUAL,
                                                  searchTerm.toLowerCase());
        allFilters.add(searchFilter);
      }

      // A composite filter requres more than one filter
      if (allFilters.size() == 1) {
        projQuery.setFilter(allFilters.get(0));
      } else {
        projQuery.setFilter(
            new CompositeFilter(CompositeFilterOperator.AND, allFilters));
      }

      PreparedQuery accessibleProjects = datastore.prepare(projQuery);
      for (Entity entity : accessibleProjects.asIterable()) {
        projects.add(entity);
      }
    }

    // Parse Entities to custom objects
    ArrayList<ProjectInfo> projectInfoList = new ArrayList<ProjectInfo>();
    for (Entity entity : projects) {
      String curProjId = (String)entity.getProperty("proj-id");
      String curProjName = (String)entity.getProperty("name");
      String timestamp = (String)entity.getProperty("utc");
      String curVis = (String)entity.getProperty("visibility");
      projectInfoList.add(
          new ProjectInfo(curProjId, curProjName, timestamp, curVis));
    }

    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonProjects = gson.toJson(projectInfoList);
    response.getWriter().println(jsonProjects);
  }
}