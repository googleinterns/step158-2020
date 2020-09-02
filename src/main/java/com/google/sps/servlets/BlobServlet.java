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
    // When creating, default image name if none provided is
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

    // Default case: creating a new base image
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
        DataUtils.deleteImageAndChildren(imgEntity.getKey());
        return;
      }
    }

    // Process blobkey if an image was uploaded
    CustomBlobInfo fileInfo = BlobUtils.processBlobKey(request);
    if (fileInfo != null) {
      imgEntity.setProperty("blobkey", fileInfo.blobKeyString);
      imgEntity.setProperty("filetype", fileInfo.fileExtension);
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

    for (Entity storedImage : storedImages.asIterable()) {
      String imageUrl =
          "/blob-host?blobkey=" + (String)storedImage.getProperty("blobkey");
      String imageName = (String)storedImage.getProperty("name");
      String imageType = (String)storedImage.getProperty("filetype");
      String imageTime = (String)storedImage.getProperty("utc");
      ArrayList<String> imageTags =
          (ArrayList<String>)storedImage.getProperty("tags");

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
                .setAncestor(storedImage.getKey())
                .addSort("utc", sortMask.equals(DataUtils.ASCENDING_SORT)
                                    ? Query.SortDirection.ASCENDING
                                    : Query.SortDirection.DESCENDING)
                .setFilter(BlobUtils.combinedGetFilters(request, withMasks,
                                                        DataUtils.MASK));

        PreparedQuery storedMasks = datastore.prepare(maskQuery);

        for (Entity storedMask : storedMasks.asIterable()) {
          String maskUrl =
              "/blob-host?blobkey=" + (String)storedMask.getProperty("blobkey");
          String maskName = (String)storedMask.getProperty("name");
          String maskType = (String)storedMask.getProperty("filetype");
          String maskTime = (String)storedMask.getProperty("utc");
          ArrayList<String> maskTags =
              (ArrayList<String>)storedMask.getProperty("tags");
          imageMasks.add(
              new MaskInfo(maskUrl, maskName, maskType, maskTime, maskTags));
        }
      }

      imageObjects.add(new ImageInfo(imageUrl, imageName, imageType, imageTime,
                                     imageTags, imageMasks));
    }

    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String jsonImages = gson.toJson(imageObjects);
    response.getWriter().println(jsonImages);
  }
}