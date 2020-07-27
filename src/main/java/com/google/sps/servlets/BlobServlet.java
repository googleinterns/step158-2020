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
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.util.ArrayList;
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

    // Get the name entered by the user
    String name = request.getParameter("name");

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    if (blobKeys == null || blobKeys.isEmpty()) {
      return;
    }

    // Our form only contains a single file input
    BlobKey blobKey = blobKeys.get(0);

    // Check for valid blob key
    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    if (blobInfo.getSize() == 0) {
      blobstoreService.delete(blobKey);
      return;
    }
    String uid = userService.getCurrentUser().getUserId();
    Query query = new Query("User");
    Filter propertyFilter =
        new FilterPredicate("uid", FilterOperator.EQUAL, uid);

    query.setFilter(propertyFilter);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery user = datastore.prepare(query);

    Entity userEntity = new Entity("User");

    if (user.countEntities() == 0) {
      userEntity.setProperty("uid", uid);
      datastore.put(userEntity);
    } else {
      userEntity = user.asSingleEntity();
    }

    Entity imageEntity = new Entity("Image", userEntity.getKey());
    imageEntity.setProperty("blobkey", blobKey.getKeyString());
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
      String url = "/blob-host?blobkey=" + (String)entity.getProperty("blobkey");  
      blobKeys.add(url);
    }

    Gson gson = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonBlobKeys = gson.toJson(blobKeys);
    response.getWriter().println(jsonBlobKeys);
  }
}