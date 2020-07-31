package com.google.sps.servlets;

import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.KeyFactory;
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
import java.time.Instant;
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
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    // Must be logged in
    if (!userService.isUserLoggedIn()) {
      throw new Exception("User must be logged in.");
    }

    // Mode is a required parameter
    String mode = request.getParameter("mode");
    if (mode == null || (mode != "create" && mode != "update")) {
      throw new Exception("Invalid mode.");
    }

    // Check if working with image or mask
    String parentImg = request.getParameter("parent-img");
    Boolean isMask = false;
    if (parentImg != null) {
      isMask = true;
    }

    // Get the image name entered by the user
    String imgName = request.getParameter("img-name");

    // Asset to update must already exist
    Key imgKey = new Key();
    if (mode == "update") {
      if (imgName == null) {
        throw new Exception("Image name must be provided.");
      }

      Query imgQuery =
          new Query("Image").setAncestor(KeyFactory.stringToKey(projId));
      Filter imgFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, imgName);
      imgQuery.setFilter(imgFilter);
      PreparedQuery existingImg = datastore.prepare(imgQuery);

      if (existingImg.countEntities() == 0) {
        throw new Exception(
            "No asset with that name exists to update for this project.");
      }
      imgKey = existingImg.asSingleEntity().getKey();
    }

    // Must be an owner or editor
    String projId = request.getParameter("proj-id");
    String uid = userService.getCurrentUser().getUserId();

    Query projQuery = new Query("Project");

    Filter ownEditFilter = new CompositeFilter(
        CompositeFilterOperator.AND,
        Arrays.asList(
            new FilterPredicate("proj-id", FilterOperator.EQUAL, projId),
            new CompositeFilter(
                CompositeFilterOperator.OR,
                Arrays.<Filter>asList(
                    new FilterPredicate("owners", FilterOperator.EQUAL, uid),
                    new FilterPredicate("editors", FilterOperator.EQUAL,
                                        uid)))));

    projQuery.setFilter(ownEditFilter);
    PreparedQuery accessibleProjects = datastore.prepare(projQuery);

    // Only owners and editors of given project can modify or create
    if (accessibleProjects.countEntities() == 0) {
      throw new Exception("User does not have permission to edit the project.");
    }

    // Owners have additional permissions
    String ownersString =
        (String)accessibleProjects.asSingleEntity().getProperty("owners");
    Boolean isOwner = ownersString.contains(uid);

    Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
    if (delete && !isOwner) {
      throw new Exception("Only owners can delete assets.");
    }

    if (mode == "create" && !isOwner && !isMask) {
      throw new Exception("Only owners can add new images.");
    }

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    if (blobKeys == null || blobKeys.isEmpty()) {
        if (mode == "create") {
        throw new Exception("User submitted form without selecting a file.");
        }
    } else if (mode == "update" && !isMask) {
        blobstoreService.delete(blobKeys.get(0));
        throw new Exception("No upload allowed for base image update.");
    }
    
    if (mode == "update") {
     // no image upload, update image and mask except for a new mask replacing a new mask
        Gson gson = new Gson();
        Collection<String> existingLabels = ;
        
        // delete, labels, new-name
        if ()
    }    
    
    update
        yes image
            image X
            mask  Dont want to update until checking image... maybe update properties in first block and only put after image checked and also added
        no image
            image
            mask
    create
        yes image
            image
            mask
        no image
            image X
            mask  X
        
    ArrayList<String> validExtensions = new ArrayList<String>(
        (isMask) ? Arrays.asList("png")
                 : Arrays.asList("png", "jpg", "jpeg", "jfif", "pjpeg", "pjp",
                                 "gif", "bmp", "ico", "cur", "svg", "webp"));

    // Check validity of blob key
    BlobKey blobKey = blobKeys.get(0);
    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    String[] splitFilename = blobInfo.getFilename().split(".");
    String extension = splitFilename[splitFilename.length - 1].toLowerCase();
    if (blobInfo.getSize() == 0 || !validExtensions.contains(extension)) {
      blobstoreService.delete(blobKey);
      throw new Exception("Blobkeys invalid or file not supported.");
    }

    if (!isMask) { //create image
      Entity imageEntity = new Entity("Image", projId);
      imageEntity.setProperty("blobkey", blobKey.getKeyString());
      imageEntity.setProperty("name", imgName);
      String now = Instant.now().toString();
      imageEntity.setProperty("utc", now);
      datastore.put(imageEntity);
    } else { //update mask including image, etc; create mask entity
        if (mode == "create") {
        } else {

        }
      Query projQuery = new Query("Project");

      Entity imageEntity = new Entity("Mask", );
      imageEntity.setProperty("blobkey", blobKey.getKeyString());
      imageEntity.setProperty("name", imgName);
      String now = Instant.now().toString();
      imageEntity.setProperty("utc", now);
      datastore.put(imageEntity);
    }

    response.sendRedirect("/imgupload.html");
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    String uid = userService.getCurrentUser().getUserId();

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/imgmanip.html");
      return;
    }
    Query userQuery = new Query("User");
    Filter propertyFilter =
        new FilterPredicate("uid", FilterOperator.EQUAL, uid);

    userQuery.setFilter(propertyFilter);

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