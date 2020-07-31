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
    String projId = request.getParameter("proj-id");
    Key projKey = KeyFactory.stringToKey(projId);
    Entity projEntity = datastore.get(projKey);
    String uid = userService.getCurrentUser().getUserId();
    Key imgKey = new Key();
    Entity imgEntity = new Entity();
    if (mode == "update") {
      if (imgName == null) {
        throw new Exception("Image name must be provided.");
      }
      if (isMask) {
        Query imgQuery = new Query("Image").setAncestor(projKey);
        Filter imgFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, parentImg);
        imgQuery.setFilter(imgFilter);
        PreparedQuery existingImg = datastore.prepare(imgQuery);

        if (existingImg.countEntities() == 0) {
          throw new Exception(
              "No parent image with that name exists for this project.");
        }
        Key parentImgKey = existingImg.asSingleEntity().getKey();

        Query maskQuery = new Query("Mask").setAncestor(parentImgKey);
        Filter maskFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, imgName);
        imgQuery.setFilter(maskFilter);
        PreparedQuery existingMask = datastore.prepare(maskQuery);

        if (existingMask.countEntities() == 0) {
          throw new Exception(
              "No mask with that name exists to update for this project.");
        }
        imgEntity = existingMask.asSingleEntity();
        imgKey = existingMask.asSingleEntity().getKey();
      } else {
        Query imgQuery = new Query("Image").setAncestor(projKey);
        Filter imgFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, imgName);
        imgQuery.setFilter(imgFilter);
        PreparedQuery existingImg = datastore.prepare(imgQuery);

        if (existingImg.countEntities() == 0) {
          throw new Exception(
              "No image with that name exists to update for this project.");
        }
        imgEntity = existingImg.asSingleEntity();
        imgKey = existingImg.asSingleEntity().getKey();
      }
    }

    // Must be an owner or editor
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
    Boolean hasNonEmptyImage = !(blobKeys == null || blobKeys.isEmpty());
    if (!hasNonEmptyImage) {
      if (mode == "create") {
        throw new Exception("User submitted form without selecting a file.");
      }
    } else if (mode == "update" && !isMask) {
      blobstoreService.delete(blobKeys.get(0));
      throw new Exception("No upload allowed for base image update.");
    }

    String labels = request.getParameter("labels");
    String newName = request.getParameter("new-name");
    String now = Instant.now().toString();
    projEntity.setProperty("utc", now);
    if (mode == "update") {
      if (delete) {
        datastore.delete(imgKey);
        response.sendRedirect("/");
        return;
      } else {
        if (labels != null) {
          // TODO
          // parse csv
          // decode previous labels
          // combine
          // setproperty
        }

        if (newName != null) {
          // TODO
          // parse name
          // query database for this name, if duplicate found, simply append
          // time
        }
        imgEntity.setProperty("utc", now);
      }
      if (!hasNonEmptyImage) {
        datastore.put(Arrays.asList(imgEntity, projEntity));
        response.sendRedirect("/");
        return;
      }
    } else { // mode == "create"
      if (isMask) {
        imgEntity = new Entity("Mask", imgKey);
      } else {
        imgEntity = new Entity("Image", projKey);
      }
      // TODO
      // check for name collisions first
      imgEntity.setProperty("name", imgName);
      imgEntity.setProperty("utc", now);
    }

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

    imgEntity.setProperty("blobkey", blobKey.getKeyString());
    datastore.put(Arrays.asList(imgEntity, projEntity));

    response.sendRedirect("/");
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