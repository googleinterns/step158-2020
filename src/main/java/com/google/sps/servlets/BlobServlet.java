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
import java.util.List;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Handles POST and GET requests for images,
 * allows creation and update of images and masks, and
 * supports queries for images based on various parameters.
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
      response.sendRedirect(
          "/[login page]"); // placeholder: should redirect to login
      return;
    }

    // Mode is a required parameter
    Boolean isCreateMode = DataUtils.parseMode(request, response);

    // Check if working with image or mask
    String parentImg = request.getParameter("parent-img");
    Boolean isMask = !DataUtils.isEmptyParameter(parentImg);

    String now = Instant.now().toString();

    // Get the image name entered by the user
    // When creating, default image name if not provided is
    // Untitled-{current UTC time}
    String imgName = request.getParameter("img-name");
    if (DataUtils.isEmptyParameter(imgName)) {
      if (isCreateMode) {
        imgName = "Untitled-" + now;
      } else {
        throw new IOException("Image name must be provided.");
      }
    }

    String uEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");
    Entity projEntity =
        DataUtils.getProjectEntity(projId, uEmail, true, false);
    Key projKey = projEntity.getKey();
    Key assetParentKey = projKey;
    Entity imgEntity = new Entity(DataUtils.IMAGE, projKey);

    // Asset to update must already exist
    if (isMask) {
      Entity existingImg = getAssetEntity(DataUtils.IMAGE, projKey, parentImg);

      if (isCreateMode) {
        Key parentEntityKey = existingImg.getKey();
        imgEntity = new Entity(DataUtils.MASK, parentEntityKey);
      } else {
        assetParentKey = existingImg.getKey();
        imgEntity = getAssetEntity(DataUtils.MASK, assetParentKey, imgName);
      }
    } else {
      if (!isCreateMode) {
        imgEntity = getAssetEntity(DataUtils.IMAGE, projKey, imgName);
      }
    }

    // Owners have additional permissions
    ArrayList<String> owners =
        (ArrayList<String>)projEntity.getProperty("owners");
    Boolean isOwner = owners.contains(uEmail);

    if (isCreateMode && !isOwner && !isMask) {
      throw new IOException("You do not have permission to do that.");
    }

    Boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
    if (delete && !isCreateMode) {
      if (!isOwner) {
        throw new IOException("Only owners can delete assets.");
      } else {
        datastore.delete(imgEntity.getKey());
        response.sendRedirect("/"); // placeholder: should redirect to 
                                    // project homepage
        return;
      }
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
    } else {
      if (!isCreateMode && !isMask) {
        blobstoreService.delete(blobKeys.get(0));
        hasNonEmptyImage = false;
      }
    }

    BlobKey blobKey = blobKeys.get(0);

    if (isCreateMode || (!isCreateMode && hasNonEmptyImage)) {
      if (isValidFile(blobKey, isMask)) {
        imgEntity.setProperty("blobkey", blobKey.getKeyString());
      }
    }

    imgEntity.setProperty("utc", now);
    projEntity.setProperty("utc", now);

    String tags = request.getParameter("tags");
    if (!DataUtils.isEmptyParameter(tags)) {
      ArrayList<String> listTags =
          new ArrayList<String>(DataUtils.parseCommaList(tags));
      imgEntity.setIndexedProperty("tags",
                                   DataUtils.withDuplicatesRemoved(listTags));
    }

    String newName = request.getParameter("new-name");
    boolean rename = isCreateMode && !DataUtils.isEmptyParameter(newName);
    String checkedName = (rename) ? newName : imgName;
    try {
        getAssetEntity((isMask) ? DataUtils.MASK : DataUtils.IMAGE,
                        assetParentKey, checkedName);
        checkedName += "-" + now;
        imgEntity.setProperty("name", checkedName);
    } catch (Exception e) {
        imgEntity.setProperty("name", checkedName);
    }

    datastore.put(Arrays.asList(imgEntity, projEntity));
    response.sendRedirect(
        "/imgupload.html"); // placeholder: should redirect to image upload page
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    String uEmail = userService.getCurrentUser().getEmail();

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      return;
    }

    String projId = request.getParameter("proj-id");

    Entity projEntity = DataUtils.getProjectEntity(projId, uEmail, true, true);
    Key projKey = projEntity.getKey();

    Boolean withMasks =
        Boolean.parseBoolean(request.getParameter("with-masks"));
    String tag = request.getParameter("tag");
    Query imageQuery = new Query(DataUtils.IMAGE).setAncestor(projKey);
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
        Query maskQuery =
            new Query(DataUtils.MASK).setAncestor(imageEntity.getKey());
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

  private Boolean isValidFile(BlobKey blobKey, Boolean isMask)
      throws IOException {
    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();

    ArrayList<String> validExtensions = new ArrayList<String>(
        (isMask) ? Arrays.asList("png")
                 : Arrays.asList("png", "jpg", "jpeg", "jfif", "pjpeg", "pjp",
                                 "gif", "bmp", "ico", "cur", "svg", "webp"));

    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    String[] splitFilename = blobInfo.getFilename().split("\\.");
    String extension = splitFilename[splitFilename.length - 1].toLowerCase();
    if (blobInfo.getSize() == 0 || !validExtensions.contains(extension)) {
      blobstoreService.delete(blobKey);
      throw new IOException("Blobkeys invalid or file not supported.");
    }

    return true;
  }

  private Entity getAssetEntity(String kind, Key ancestor, String name)
      throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Query imgQuery = new Query(kind).setAncestor(ancestor);
    Filter imgFilter = new FilterPredicate("name", FilterOperator.EQUAL, name);
    imgQuery.setFilter(imgFilter);
    PreparedQuery existingImgQuery = datastore.prepare(imgQuery);

    if (existingImgQuery.countEntities() == 0) {
      throw new IOException("Image not found.");
    }

    return existingImgQuery.asSingleEntity();
  }
}