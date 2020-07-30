package com.google.sps.servlets;

import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/blobs")
public class BlobServlet extends HttpServlet {

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    UserService userService = UserServiceFactory.getUserService();

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/imgupload.html");
      return;
    }

    String projId = request.getParameter("proj-id");
    String uid = userService.getCurrentUser().getUserId();

    Query queryOwner = new Query("Project");
    Query queryEditor = new Query("Project");

    Filter ownerFilter = new CompositeFilter(
        CompositeFilterOperator.AND,
        Arrays.asList(
            new FilterPredicate("proj-id", FilterOperator.EQUAL, projId),
            new FilterPredicate("owners", FilterOperator.EQUAL, uid)));

    Filter editorFilter = new CompositeFilter(
        CompositeFilterOperator.AND,
        Arrays.asList(
            new FilterPredicate("proj-id", FilterOperator.EQUAL, projId),
            new FilterPredicate("editors", FilterOperator.EQUAL, uid)));

    queryOwner.setFilter(ownerFilter);
    queryEditor.setFilter(editorFilter);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery ownThisProject = datastore.prepare(queryOwner);
    PreparedQuery editThisProject = datastore.prepare(queryEditor);

    Boolean isOwner = false;

    if (ownThisProject.countEntities() != 0) {
      isOwner = true;
    } else {
      if (editThisProject.countEntities() == 0) {
        response.sendRedirect("/imgupload.html");
        return;
      }
    }

    String parentImg = request.getParameter("parent-img");

    Boolean isMask = false;
    if (parentImg != null) {
      isMask = true;
    }

    ArrayList<String> validExtensions = new ArrayList<String>(
        (isMask) ? Arrays.asList("png")
                 : Arrays.asList("png", "jpg", "jpeg", "jfif", "pjpeg", "pjp",
                                 "gif", "bmp", "ico", "cur", "svg", "webp"));

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    if (blobKeys == null || blobKeys.isEmpty()) {
      response.sendRedirect("/imgupload.html");
      return;
    }

    // Check validity of each blob key
    Iterator<BlobKey> itr = blobKeys.iterator();
    while (itr.hasNext()) {
      BlobKey blobKey = itr.next();
      BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
      String[] splitFilename = blobInfo.getFilename().split(".");
      String extension = splitFilename[splitFilename.length - 1].toLowerCase();
      if (blobInfo.getSize() == 0 || !validExtensions.contains(extension)) {
        blobstoreService.delete(blobKey);
        itr.remove();
      }
    }

    // None of the keys were valid
    if (blobKeys.isEmpty()) {
      response.sendRedirect("/imgupload.html");
      return;
    }

    // Get the name entered by the user
    String name = request.getParameter("name");

    Entity imageEntity = new Entity("Image"/*, userEntity.getKey()*/);
    // imageEntity.setProperty("blobkey", blobKey.getKeyString());
    imageEntity.setProperty("name", name);
    datastore.put(imageEntity);

    response.sendRedirect("/imgupload.html");
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    UserService userService = UserServiceFactory.getUserService();
    String uid = userService.getCurrentUser().getUserId();

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/imgmanip.html");
      return;
    }
    Query userQuery = new Query("User");
    Filter propertyFilter =
        new FilterPredicate("uid", FilterOperator.EQUAL, uid);

    userQuery.setFilter(propertyFilter);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery user = datastore.prepare(userQuery);

    Entity userEntity = user.asSingleEntity();

    Query imageQuery = new Query("Image").setAncestor(userEntity.getKey());

    PreparedQuery storedBlobKeys = datastore.prepare(imageQuery);

    ArrayList<String> blobKeys = new ArrayList<String>();

    for (Entity entity : storedBlobKeys.asIterable()) {
      String url =
          "/blob-host?blobkey=" + (String)entity.getProperty("blobkey");
      blobKeys.add(url);
    }

    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonBlobKeys = gson.toJson(blobKeys);
    response.getWriter().println(jsonBlobKeys);
  }
}