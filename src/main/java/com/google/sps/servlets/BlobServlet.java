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
import com.google.sps.servlets.BlobUtils;
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

  /**
   * Handles POST requests for images and masks.
   * Responds with image URL and name upon successful POST.
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
    boolean isCreateMode = DataUtils.parseMode(request);

    // Check if working with image or mask
    String parentImg = request.getParameter("parent-img");
    boolean isMask = !DataUtils.isEmptyParameter(parentImg);

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

    String userEmail = userService.getCurrentUser().getEmail();
    String projId = request.getParameter("proj-id");
    Entity projEntity =
        DataUtils.getProjectEntity(projId, userEmail, true, false);
    Key projKey = projEntity.getKey();
    Key assetParentKey = projKey;

    // Default case: creating a new base iamge
    Entity imgEntity = new Entity(DataUtils.IMAGE, projKey);

    // Asset to update must already exist
    if (isMask) {
      Entity existingImg =
          BlobUtils.getAssetEntity(DataUtils.IMAGE, projKey, parentImg);

      if (isCreateMode) {
        Key parentEntityKey = existingImg.getKey();
        imgEntity = new Entity(DataUtils.MASK, parentEntityKey);
      } else {
        assetParentKey = existingImg.getKey();
        imgEntity =
            BlobUtils.getAssetEntity(DataUtils.MASK, assetParentKey, imgName);
      }
    } else {
      if (!isCreateMode) {
        imgEntity = BlobUtils.getAssetEntity(DataUtils.IMAGE, projKey, imgName);
      }
    }

    // Owners have additional permissions
    ArrayList<String> owners =
        (ArrayList<String>)projEntity.getProperty("owners");
    boolean isOwner = owners.contains(userEmail);

    if (isCreateMode && !isOwner && !isMask) {
      throw new IOException(
          "You do not have permission to to upload an image to this project.");
    }

    boolean delete = Boolean.parseBoolean(request.getParameter("delete"));
    if (delete && !isCreateMode) {
      if (!isOwner) {
        throw new IOException("Only owners can delete assets.");
      } else {
        datastore.delete(imgEntity.getKey());
        response.sendRedirect("/");
        return;
      }
    }

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file
    if (blobKeys.isEmpty() || blobKeys == null) {
      if (isCreateMode) {
        throw new IOException("Form submitted without a file.");
      }
    } else {
      BlobKey blobKey = blobKeys.get(0);
      BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);

      // Check for blob size as well since (experimentally) no upload does not
      // guarantee an empty BlobKey List
      boolean hasNonEmptyImage = blobInfo.getSize() != 0;

      // Image cannot be changed after first upload
      if (!isCreateMode && !isMask) {
        blobstoreService.delete(blobKey);
        hasNonEmptyImage = false;
      }

      // Set blobkey property
      if (isCreateMode || (!isCreateMode && hasNonEmptyImage)) {
        BlobUtils.checkFileValidity(blobKey, isMask);
        imgEntity.setProperty("blobkey", blobKey.getKeyString());
      }
    }

    // Last-modified time
    imgEntity.setProperty("utc", now);
    projEntity.setProperty("utc", now);

    // Add indexed tags
    String tags = request.getParameter("tags");
    if (!DataUtils.isEmptyParameter(tags)) {
      ArrayList<String> listTags =
          new ArrayList<String>(DataUtils.parseCommaList(tags));
      imgEntity.setIndexedProperty("tags",
                                   DataUtils.withDuplicatesRemoved(listTags));
    }

    // Set/update name, ensuring uniqueness under parent
    String newName = request.getParameter("new-name");
    boolean rename = !isCreateMode && !DataUtils.isEmptyParameter(newName) &&
                     !imgName.equals(newName);
    String checkedName = (rename) ? newName : imgName;
    if (isCreateMode || rename) {
      try {
        BlobUtils.getAssetEntity((isMask) ? DataUtils.MASK : DataUtils.IMAGE,
                                 assetParentKey, checkedName);
        checkedName += "-" + now;
        imgEntity.setProperty("name", checkedName);
      } catch (Exception e) {
        imgEntity.setProperty("name", checkedName);
      }
    }

    // Batch operation
    datastore.put(Arrays.asList(imgEntity, projEntity));

    // Send the image URL and name
    response.setContentType("application/json");
    String url =
        "/blob-host?blobkey=" + (String)imgEntity.getProperty("blobkey");
    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonImgInfo = gson.toJson(new BlobPostReturn(url, checkedName));
    response.getWriter().println(jsonImgInfo);
  }

  /**
   * Handles GET requests for images and masks.
   * Responds with JSON string of ImageInfo objects upon successful GET.
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
    Entity projEntity =
        DataUtils.getProjectEntity(projId, userEmail, true, true);
    Key projKey = projEntity.getKey();

    boolean withMasks =
        Boolean.parseBoolean(request.getParameter("with-masks"));
    // with-masks implicitly true if mask-name is provided
    if (!DataUtils.isEmptyParameter(request.getParameter("mask-name"))) {
      withMasks = true;
    }

    String sortImg = request.getParameter("sort-img");
    // Sorted in descending chronological order by default
    if (DataUtils.isEmptyParameter(sortImg)) {
      sortImg = DataUtils.DESCENDING_SORT;
    }
    sortImg = sortImg.toLowerCase();

    Query imageQuery =
        new Query(DataUtils.IMAGE)
            .setAncestor(projKey)
            .addSort("utc", sortImg.equals(DataUtils.ASCENDING_SORT)
                                ? Query.SortDirection.ASCENDING
                                : Query.SortDirection.DESCENDING)
            .setFilter(BlobUtils.combinedGetFilters(request, withMasks,
                                                    DataUtils.IMAGE));

    PreparedQuery storedImages = datastore.prepare(imageQuery);

    ArrayList<ImageInfo> imageObjects = new ArrayList<ImageInfo>();

    for (Entity imageEntity : storedImages.asIterable()) {
      String imageUrl =
          "/blob-host?blobkey=" + (String)imageEntity.getProperty("blobkey");
      String imageName = (String)imageEntity.getProperty("name");
      String imageTime = (String)imageEntity.getProperty("utc");
      ArrayList<String> imageTags =
          (ArrayList<String>)imageEntity.getProperty("tags");

      ArrayList<MaskInfo> imageMasks = new ArrayList<MaskInfo>();
      if (withMasks) {
        String sortMask = request.getParameter("sort-mask");
        // Sorted in descending chronological order by default
        if (DataUtils.isEmptyParameter(sortMask)) {
          sortMask = DataUtils.DESCENDING_SORT;
        }
        sortImg = sortImg.toLowerCase();

        Query maskQuery =
            new Query(DataUtils.MASK)
                .setAncestor(imageEntity.getKey())
                .addSort("utc", sortMask.equals(DataUtils.ASCENDING_SORT)
                                    ? Query.SortDirection.ASCENDING
                                    : Query.SortDirection.DESCENDING)
                .setFilter(BlobUtils.combinedGetFilters(request, withMasks,
                                                        DataUtils.MASK));

        PreparedQuery storedMasks = datastore.prepare(maskQuery);

        for (Entity maskEntity : storedMasks.asIterable()) {
          String maskUrl =
              "/blob-host?blobkey=" + (String)maskEntity.getProperty("blobkey");
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
  }
}