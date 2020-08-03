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
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/projects")
public class ProjectServlet extends HttpServlet {

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
      // Must be an owner
      Query projQuery = new Query("Project");

      Filter ownFilter = new CompositeFilter(
          CompositeFilterOperator.AND,
          Arrays.<Filter>asList(
              new FilterPredicate("proj-id", FilterOperator.EQUAL, projId),
              new FilterPredicate("owners", FilterOperator.EQUAL, uEmail)));

      projQuery.setFilter(ownFilter);
      PreparedQuery accessibleProjects = datastore.prepare(projQuery);

      // No owned projects with given project ID for current User
      if (accessibleProjects.countEntities() == 0) {
        response.sendRedirect("/");
        return;
      }
      projEntity = accessibleProjects.asSingleEntity();

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

    // Set the project name if provided
    // If creating and nothing provided, set name to Untitled-{current UTC time}
    String projName = request.getParameter("proj-name");
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
      visibility = "private";
    }
    if (!isEmptyParameter(visibility) &&
        (visibility.toLowerCase().equals("public") ||
         visibility.toLowerCase().equals("private"))) {
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
      listOwnerEmails.add(uEmail);
      if (!isEmptyParameter(ownersString)) {
        listOwnerEmails = parseEmails(ownersString);
      }
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

    /*
    Optional parameters
    visibility	“public” or “private”
    owned		Boolean
    search-term
    global		Boolean
    proj-id
    With no parameters, returns proj-ids for all public and private projects for
    given User (visibility default “all”, owned default “false”, global default
    “false”) global any + owned “true” == global ignored visibility any + global
    “true” → information for all public projects, visibility ignored With just
    proj-id, returns JSON of information about Project
    */
  }
}