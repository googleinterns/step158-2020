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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Handles POST and GET requests for images
 * Allows creation and update of images and masks
 * Supports queries for images based on various parameters
 */
@WebServlet("/blobs")
public class BlobServlet extends HttpServlet {

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    // Must be logged in
    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/[login page]"); // placeholder for login page
    }

    // Mode is a required parameter
    String mode = request.getParameter("mode");
    if (DataUtils.isEmptyParameter(mode) ||
        (mode != "create" && mode != "update")) {
      throw new IOException("Invalid mode.");
    }
    Boolean isCreateMode = (mode.toLowerCase().equals("create"));

    // Check if working with image or mask
    String parentImg = request.getParameter("parent-img");
    Boolean isMask = false;
    if (!DataUtils.isEmptyParameter(parentImg)) {
      isMask = true;
    }

    // Get the image name entered by the user
    String imgName = request.getParameter("img-name");
    if (DataUtils.isEmptyParameter(imgName)) {
      throw new IOException("Image name must be provided.");
    }

    String projId = request.getParameter("proj-id");
    Key projKey = KeyFactory.stringToKey(projId);
    Entity projEntity = new Entity("Project");

    try {
      projEntity = datastore.get(projKey);
    } catch (Exception e) {
      throw new IOException(
          "You do not have permission to access this project.");
    }
    String uEmail = userService.getCurrentUser().getEmail();
    Key assetParentKey = projKey;
    Entity imgEntity = new Entity("Image", projKey);

    ArrayList<String> owners =
        (ArrayList<String>)projEntity.getProperty("owners");
    ArrayList<String> editors =
        (ArrayList<String>)projEntity.getProperty("editors");
    String existingVis = (String)projEntity.getProperty("visibility");
    if (!owners.contains(uEmail) && !editors.contains(uEmail)) {
      throw new IOException(
          "You does not have permission to edit the project.");
    }

    // Asset to update must already exist
    if (isMask) {
      Query imgQuery = new Query("Image").setAncestor(projKey);
      Filter imgFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, parentImg);
      imgQuery.setFilter(imgFilter);
      PreparedQuery existingImg = datastore.prepare(imgQuery);

      if (existingImg.countEntities() == 0) {
        throw new IOException("Image not found.");
      }
      if (isCreateMode) {
        Key parentEntityKey = existingImg.asSingleEntity().getKey();
        imgEntity = new Entity("Mask", parentEntityKey);
      } else {
        assetParentKey = existingImg.asSingleEntity().getKey();

        Query maskQuery = new Query("Mask").setAncestor(assetParentKey);
        Filter maskFilter =
            new FilterPredicate("name", FilterOperator.EQUAL, imgName);
        imgQuery.setFilter(maskFilter);
        PreparedQuery existingMask = datastore.prepare(maskQuery);

        if (existingMask.countEntities() == 0) {
          response.sendRedirect("/");
          return;
          throw new IOException("Image not found.");
        }
        imgEntity = existingMask.asSingleEntity();
      }
    } else if (!isCreateMode) {
      Query imgQuery = new Query("Image").setAncestor(projKey);
      Filter imgFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, imgName);
      imgQuery.setFilter(imgFilter);
      PreparedQuery existingImg = datastore.prepare(imgQuery);

      if (existingImg.countEntities() == 0) {
        throw new IOException("No image found.");
      }
      imgEntity = existingImg.asSingleEntity();
    }

    // Owners have additional permissions
    Boolean isOwner = owners.contains(uEmail);

    Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
    if (delete && !isCreateMode) {
      if (!isOwner) {
        throw new IOException("Only owners can delete assets.");
      } else {
        datastore.delete(imgEntity.getKey());
        response.sendRedirect("/[project homepage]"); //placeholder for project homepage
        return;
      }
    }

    if (isCreateMode && !isOwner && !isMask) {
      throw new IOException("You do not have permission to do that.");
    }

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    Boolean hasNonEmptyImage = blobKeys != null && !blobKeys.isEmpty();
    if (!hasNonEmptyImage) {
      if (isCreateMode) {
        throw new IOException("Form submitted without a file.");
      }
    } else if (!isCreateMode && !isMask) {
      blobstoreService.delete(blobKeys.get(0));
      hasNonEmptyImage = true;
    }

    if (isCreateMode || (!isCreateMode && hasNonEmptyImage)) {
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

    if (!isCreateMode) {
      if (!DataUtils.isEmptyParameter(tags)) {
        ArrayList<String> listTags =
            new ArrayList(Arrays.asList(tags.toLowerCase().split("\\s*,\\s*")));
        LinkedHashSet<String> hashTags = new LinkedHashSet<String>(listTags);
        ArrayList<String> uniqueTags = new ArrayList<String>(hashTags);
        imgEntity.setProperty("tags", uniqueTags);
      }

      if (!DataUtils.isEmptyParameter(newName)) {
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

    String uEmail = userService.getCurrentUser().getEmail();

    if (!userService.isUserLoggedIn()) {
      response.redirect("/");
      return;
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
    ArrayList<String> owners =
        (ArrayList<String>)projEntity.getProperty("owners");
    ArrayList<String> editors =
        (ArrayList<String>)projEntity.getProperty("editors");
    String existingVis = (String)projEntity.getProperty("visibility");
    if (!owners.contains(uEmail) && !editors.contains(uEmail) &&
        !existingVis.equals(DataUtils.PUBLIC)) {
      response.sendRedirect("/");
      return;
    }

    Boolean withMasks =
        Boolean.parseBoolean(request.getParameter("with-masks"));
    String tag = request.getParameter("tag");
    Query imageQuery = new Query("Image").setAncestor(projKey);
    if (!DataUtils.isEmptyParameter(tag) && !withMasks) {
      Filter tagFilter = new FilterPredicate("tags", FilterOperator.EQUAL, tag);
      imageQuery.setFilter(tagFilter);
    }
    PreparedQuery storedImages = datastore.prepare(imageQuery);

    ArrayList<ImageInfo> imageObjects = new ArrayList<ImageInfo>();

    for (Entity imageEntity : storedImages.asIterable()) {
      String imageUrl =
          "/blob-host?blobkey=" + (String)imageEntity.getProperty("url");
      String imageName = (String)imageEntity.getProperty("name");
      String imageTime = (String)imageEntity.getProperty("utc");
      ArrayList<String> imageTags =
          (ArrayList<String>)imageEntity.getProperty("tags");

      ArrayList<MaskInfo> imageMasks = new ArrayList<MaskInfo>();
      if (withMasks) {
        Query maskQuery = new Query("Mask").setAncestor(imageEntity.getKey());
        PreparedQuery storedMasks = datastore.prepare(maskQuery);

        for (Entity maskEntity : storedMasks.asIterable()) {
          String maskUrl =
              "/blob-host?blobkey=" + (String)maskEntity.getProperty("url");
          String maskName = (String)maskEntity.getProperty("name");
          String maskTime = (String)maskEntity.getProperty("utc");
          ArrayList<String> maskTags =
              (ArrayList<String>)maskEntity.getProperty("tags");
          imageMasks.add(new MaskInfo(maskUrl, maskName, maskTime, maskTags));
        }
      }

      imageObjects.add(
          new ImageInfo(imageUrl, imageName, imageTime, imageTags, imageMasks));
    }

    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonImages = gson.toJson(imageObjects);
    response.getWriter().println(jsonImages);

    /*
    Get
    Required parameters
    proj-id
    Optional parameters
    tag
    img-name
    with-masks	Boolean
    Default return: JSON of all image links and names for given project if it
    belongs to logged-in user or is public Name, owners, and time last updated
    included as first element E.g. [ {name: myProject, owners: dtjanaka, time:
    2020-07-29T20:09:02+0000}, {link: abc.xyz, name: alphabet}, {link:
    google.com, name: g} ] proj-id + img-name provided: JSON of image link and
    name
    + with-masks = “true”: image and mask links and names (with-masks = “false”
    by default) First index is for the image

    tag: without masks, filters for images; with masks (and necessarily
    img-name), filters masks for img-name
    */
  }
}