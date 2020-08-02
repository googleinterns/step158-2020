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

  private Boolean isEmptyParameter(String param) {
    return param == null || param.isEmpty();
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    // Must be logged in
    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      // response.getWriter().println("a");
      return;
    }

    // Mode is a required parameter
    String mode = request.getParameter("mode");
    if (isEmptyParameter(mode) || (!mode.toLowerCase().equals("create") &&
                                   !mode.toLowerCase().equals("update"))) {
      response.sendRedirect("/");
      // response.getWriter().println("b");
      return;
    }
    Boolean isCreateMode = (mode.toLowerCase().equals("create"));

    String uEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");

    Entity projEntity = new Entity("Project");
    if (!isCreateMode) {
      // Need project ID to update a project
      if (isEmptyParameter(projId)) {
        response.sendRedirect("/");
        // response.getWriter().println("c");
        return;
      }
      // Must be an owner
      Query projQuery = new Query("Project");

      Filter ownEditFilter = new CompositeFilter(
          CompositeFilterOperator.AND,
          Arrays.<Filter>asList(
              new FilterPredicate("proj-id", FilterOperator.EQUAL, projId),
              new FilterPredicate("owners", FilterOperator.EQUAL, uEmail)));

      projQuery.setFilter(ownEditFilter);
      PreparedQuery accessibleProjects = datastore.prepare(projQuery);

      if (accessibleProjects.countEntities() == 0) {
        response.sendRedirect("/");
        // response.getWriter().println("d");
        return;
      }
      projEntity = accessibleProjects.asSingleEntity();

      Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
      if (delete) {
        datastore.delete(projEntity.getKey());
        response.sendRedirect("/");
        return;
      }
    }

    String now = Instant.now().toString();
    projEntity.setProperty("utc", now);

    String projName = request.getParameter("proj-name");
    if (!isEmptyParameter(projName)) {
      projEntity.setProperty("name", projName);
    } else {
      if (isCreateMode) {
        projEntity.setProperty("name", "Untitled-" + now);
      }
      // Don't do anything if updating and no name provided
    }

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

    // if create, owners = current user + any people in param, if param null,
    // just current user if update, owners = current user + any people in param
    // if param null, change nothing
    if (isCreateMode || !isEmptyParameter(ownersString)) {
      ArrayList<String> listOwnerEmails = new ArrayList<String>();
      listOwnerEmails.add(uEmail);
      if (!isEmptyParameter(ownersString)) {
        listOwnerEmails = new ArrayList(
            Arrays.asList(ownersString.toLowerCase().split("\\s*,\\s*")));
      }
      LinkedHashSet<String> hashUniqueIds =
          new LinkedHashSet<String>(listOwnerEmails);
      List<String> listUniqueOwnerEmails = new ArrayList<String>(hashUniqueIds);
      projEntity.setIndexedProperty("owners", listUniqueOwnerEmails);

      /*String projKey = KeyFactory.keyToString(datastore.put(projEntity));
      com.google.cloud.datastore.Entity a =
      com.google.cloud.datastore.Entity.newBuilder(com.google.cloud.datastore.Key.fromUrlSafe(projKey)).set("owners",
      "a", "b").build(); Datastore datastore2 =
      DatastoreOptions.getDefaultInstance().getService(); datastore2.put(a);*/
    }

    // if editors non null, editors = param
    if (!isEmptyParameter(editorsString)) {
      ArrayList<String> listEditorEmails = new ArrayList(
          Arrays.asList(editorsString.toLowerCase().split("\\s*,\\s*")));

      LinkedHashSet<String> hashUniqueEmails =
          new LinkedHashSet<String>(listEditorEmails);
      ArrayList<String> listUniqueEditorEmails =
          new ArrayList<String>(hashUniqueEmails);
      projEntity.setProperty("editors", listUniqueEditorEmails);
    }

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