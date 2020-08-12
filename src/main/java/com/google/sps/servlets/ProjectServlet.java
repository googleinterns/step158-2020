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
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Handles POST and GET requests for projects,
 * allows creation and update of projects, and
 * supports queries for projects based on various parameters.
 */
@WebServlet("/projects")
public class ProjectServlet extends HttpServlet {

  /**
   * Handles POST requests for projects.
   * Responds with project ID upon successful POST.
   * @param     {HttpServletRequest}    request
   * @param     {HttpServletResponse}   response
   * @return    {void}
   */
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
    boolean isCreateMode = DataUtils.parseMode(request, response);

    String userEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");

    // Will be either a new entity for creation or an existing entity for
    // updating
    Entity projEntity = new Entity(DataUtils.PROJECT);

    if (!isCreateMode) {
      // Must be owner to update
      projEntity = DataUtils.getProjectEntity(projId, userEmail, false, false);

      // Delete overrides all other updates
      boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
      if (delete) {
        datastore.delete(projEntity.getKey());
        response.sendRedirect("/"); // TODO: should redirect to projects gallery
        return;
      }
    }

    // Last modified timestamp
    String now = Instant.now().toString();
    projEntity.setProperty("utc", now);

    String projName = request.getParameter("proj-name");

    // Set the project name if provided
    // If creating and nothing provided, set name to Untitled-{current UTC time}
    if (!DataUtils.isEmptyParameter(projName)) {
      projEntity.setProperty("name", projName);
    } else {
      if (isCreateMode) {
        projEntity.setProperty("name", "Untitled-" + now);
      }
      // Don't do anything if updating and no name provided
    }

    // Default visibility to private (only owners and editors can view)
    String visibility = request.getParameter("visibility");
    if (DataUtils.isEmptyParameter(visibility) && isCreateMode) {
      visibility = DataUtils.PRIVATE;
    }
    if (!DataUtils.isEmptyParameter(visibility)) {
      visibility = visibility.toLowerCase();
      if (visibility.equals(DataUtils.PUBLIC) ||
          visibility.equals(DataUtils.PRIVATE)) {
        projEntity.setProperty("visibility", visibility);
      }
    }

    String ownersString = request.getParameter("owners");
    String editorsString = request.getParameter("editors");

    // If creating:
    //      owners are current User and any people in parameter
    //      if no one provided, current User is the only owner
    // if updating:
    //      owners are current User and any people in parameter
    //      if no one provided, change nothing
    if (isCreateMode || !DataUtils.isEmptyParameter(ownersString)) {
      ArrayList<String> listOwnerEmails = new ArrayList<String>();
      if (!DataUtils.isEmptyParameter(ownersString)) {
        listOwnerEmails = DataUtils.parseCommaList(ownersString);
      }
      listOwnerEmails.add(userEmail);
      projEntity.setIndexedProperty(
          "owners", DataUtils.withDuplicatesRemoved(listOwnerEmails));
    }

    // If anything provided for editors, overwrite current editors
    if (!DataUtils.isEmptyParameter(editorsString)) {
      ArrayList<String> listEditorEmails =
          DataUtils.parseCommaList(editorsString);
      projEntity.setIndexedProperty(
          "editors", DataUtils.withDuplicatesRemoved(listEditorEmails));
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

    // Return the project ID
    response.setContentType("application/json");
    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    String jsonProjId =
        gson.toJson(KeyFactory.keyToString(projEntity.getKey()));
    response.getWriter().println(jsonProjId);
  }

  /**
   * Handles GET requests for projects.
   * Responds with JSON string of ProjectInfo objects upon successful GET.
   * @param     {HttpServletRequest}    request
   * @param     {HttpServletResponse}   response
   * @return    {void}
   */
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

    String userEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");

    // Will be either a single project based on project ID or one or more
    // projects from a query based on various parameters
    ArrayList<Entity> projects = new ArrayList<Entity>();

    // Searching for one project with a project ID
    if (!DataUtils.isEmptyParameter(projId)) {
      // Project must be public or User must be an owner or editor for private
      // projects
      Entity projEntity =
          DataUtils.getProjectEntity(projId, userEmail, true, true);
      projects.add(projEntity);
    }

    // Searching for multiple projects with various parameters
    else {
      String sort = request.getParameter("sort");
      // Sorted in descending chronological order by default
      if (DataUtils.isEmptyParameter(sort)) {
        sort = DataUtils.DESCENDING_SORT;
      }
      sort = sort.toLowerCase();

      Query projQuery =
          new Query(DataUtils.PROJECT)
              .addSort("utc", sort.equals(DataUtils.ASCENDING_SORT)
                                  ? Query.SortDirection.ASCENDING
                                  : Query.SortDirection.DESCENDING);

      // Add relevant filters to array based on parameters
      ArrayList<Filter> allFilters = new ArrayList<Filter>();

      String role = request.getParameter("role");
      String visibility = request.getParameter("visibility");
      // Global overrides visibility and role
      boolean global = Boolean.parseBoolean(request.getParameter("global"));
      if (global) {
        visibility = DataUtils.PUBLIC;
        role = "viewer";
      }

      Filter ownFilter =
          new FilterPredicate("owners", FilterOperator.EQUAL, userEmail);
      Filter editFilter =
          new FilterPredicate("editors", FilterOperator.EQUAL, userEmail);
      Filter ownOrEditFilter = new CompositeFilter(
          CompositeFilterOperator.OR, Arrays.asList(ownFilter, editFilter));

      // By default, filter to only projects the User owns or edits
      if (DataUtils.isEmptyParameter(role)) {
        allFilters.add(ownOrEditFilter);
      } else if (role.toLowerCase().equals("owner")) {
        allFilters.add(ownFilter);
      } else if (role.toLowerCase().equals("editor")) {
        allFilters.add(editFilter);
      }

      // Don't filter by visibility by default
      if (!DataUtils.isEmptyParameter(visibility) &&
          (visibility.toLowerCase().equals(DataUtils.PUBLIC) ||
           visibility.toLowerCase().equals(DataUtils.PRIVATE))) {
        Filter visFilter =
            new FilterPredicate("visibility", FilterOperator.EQUAL, visibility);
        allFilters.add(visFilter);
      }

      // Don't filter by search term if not provided
      // No partial matching/regex
      String searchTerm = request.getParameter("search-term");
      if (!DataUtils.isEmptyParameter(searchTerm)) {
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
      ArrayList<String> projOwners =
          (ArrayList<String>)entity.getProperty("owners");
      ArrayList<String> projEditors =
          (ArrayList<String>)entity.getProperty("editors");
      projectInfoList.add(new ProjectInfo(curProjId, curProjName, timestamp,
                                          curVis, projOwners, projEditors));
    }

    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonProjects = gson.toJson(projectInfoList);
    response.getWriter().println(jsonProjects);
  }
}