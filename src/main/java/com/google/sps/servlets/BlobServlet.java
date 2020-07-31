package com.google.sps.servlets;

import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
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
import java.util.LinkedHashSet;
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
      throw new IOException("User must be logged in.");
    }

    // Mode is a required parameter
    String mode = request.getParameter("mode");
    if (mode == null || (mode != "create" && mode != "update")) {
      throw new IOException("Invalid mode.");
    }

    // Check if working with image or mask
    String parentImg = request.getParameter("parent-img");
    Boolean isMask = false;
    if (parentImg != null) {
      isMask = true;
    }

    // Get the image name entered by the user
    String imgName = request.getParameter("img-name");
    if (imgName == null) {
      throw new IOException("Image name must be provided.");
    }

    String projId = request.getParameter("proj-id");
    Key projKey = KeyFactory.stringToKey(projId);
    Entity projEntity = new Entity("Project");
    try {
      projEntity = datastore.get(projKey);
    } catch (Exception e) {
      response.sendRedirect("/");
      return;
    }
    String uid = userService.getCurrentUser().getUserId();
    Key assetParentKey = projKey;
    Entity imgEntity = new Entity("Image", projKey);

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
      throw new IOException(
          "User does not have permission to edit the project.");
    }

    // Asset to update must already exist
    if (isMask) {
      Query imgQuery = new Query("Image").setAncestor(projKey);
      Filter imgFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, parentImg);
      imgQuery.setFilter(imgFilter);
      PreparedQuery existingImg = datastore.prepare(imgQuery);

      if (existingImg.countEntities() == 0) {
        throw new IOException(
            "No parent image with that name exists for this project or this project does not exist.");
      }
      if (mode == "create") {
        Key parentEntityKey =
            existingImg.asSingleEntity().getKey();
        imgEntity = new Entity("Mask", parentEntityKey);
      } else {
        assetParentKey = existingImg.asSingleEntity().getKey();

        Query maskQuery = new Query("Mask").setAncestor(assetParentKey);
        Filter maskFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, imgName);
        imgQuery.setFilter(maskFilter);
        PreparedQuery existingMask = datastore.prepare(maskQuery);

        if (existingMask.countEntities() == 0) {
          throw new IOException(
              "No mask with that name exists to update for this project.");
        }
        imgEntity = existingMask.asSingleEntity();
      }
    } else if (mode == "update") {
      Query imgQuery = new Query("Image").setAncestor(projKey);
      Filter imgFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, imgName);
      imgQuery.setFilter(imgFilter);
      PreparedQuery existingImg = datastore.prepare(imgQuery);

      if (existingImg.countEntities() == 0) {
        throw new IOException(
            "No image with that name exists to update for this project or this project does not exist.");
      }
      imgEntity = existingImg.asSingleEntity();
    }

    // Owners have additional permissions
    String ownersString =
        (String)accessibleProjects.asSingleEntity().getProperty("owners");
    Boolean isOwner = ownersString.contains(uid);

    Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
    if (delete) {
      if (!isOwner || mode == "create") {
        throw new IOException(
            "Only owners can delete assets and only in update mode.");
      } else {
        datastore.delete(imgEntity.getKey());
        response.sendRedirect("/");
        return;
      }
    }

    if (mode == "create" && !isOwner && !isMask) {
      throw new IOException("Only owners can add new images.");
    }

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    Boolean hasNonEmptyImage = !(blobKeys == null || blobKeys.isEmpty());
    if (!hasNonEmptyImage) {
      if (mode == "create") {
        throw new IOException("User submitted form without selecting a file.");
      }
    } else if (mode == "update" && !isMask) {
      blobstoreService.delete(blobKeys.get(0));
      throw new IOException("No upload allowed for base image update.");
    }

    if (mode == "create" || (mode == "update" && hasNonEmptyImage)) {
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
        throw new IOException("Blobkeys invalid or file not supported.");
      }

      imgEntity.setProperty("blobkey", blobKey.getKeyString());
    }

    String now = Instant.now().toString();
    imgEntity.setProperty("name", imgName);
    imgEntity.setProperty("utc", now);
    projEntity.setProperty("utc", now);

    String tags = request.getParameter("tags");
    String newName = request.getParameter("new-name");

    if (mode == "update") {
      if (tags != null) {
        ArrayList<String> listTags =
            new ArrayList(Arrays.asList(tags.toLowerCase().split("\\s*,\\s*")));
        LinkedHashSet<String> hashTags = new LinkedHashSet<String>(listTags);
        ArrayList<String> uniqueTags = new ArrayList<String>(hashTags);
        imgEntity.setProperty("tags", uniqueTags);
      }

      if (newName != null) {
        Query nameQuery =
            new Query((isMask) ? "Mask" : "Image").setAncestor(assetParentKey);
        Filter nameFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, newName);
        nameQuery.setFilter(nameFilter);
        PreparedQuery existingName = datastore.prepare(nameQuery);

        if (existingName.countEntities() != 0) {
          newName += now;
        }
        imgEntity.setProperty("name", newName);
      }
    }

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