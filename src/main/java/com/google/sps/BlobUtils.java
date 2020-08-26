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
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

/**
 * Provides utilities for the blobs servlet.
 */
public final class BlobUtils {

  /**
   * Checks if the file uploaded to Blobstore is valid.
   * Returns the file extension if valid.
   * @param     {BlobKey}   blobKey   key for the file in question
   * @param     {boolean}   isMask    mask or image
   * @return    {String}
   */
  public static String checkFileValidity(BlobKey blobKey, boolean isMask)
      throws IOException {
    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();

    ArrayList<String> validExtensions = new ArrayList<String>(
        (isMask) ? Arrays.asList("png")
                 : Arrays.asList("png", "jpg", "jpeg", "jfif", "pjpeg", "pjp",
                                 "gif", "bmp", "ico", "cur", "svg", "webp"));

    ArrayList<String> validMimeTypes = new ArrayList<String>(
        (isMask) ? Arrays.asList("png")
                 : Arrays.asList("image/png", "image/jpeg", "image/pjpeg",
                                 "image/gif", "image/bmp", "image/x-icon",
                                 "image/svg+xml", "image/webp"));

    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    String[] splitFilename = blobInfo.getFilename().split("\\.");
    String extension = splitFilename[splitFilename.length - 1].toLowerCase();
    String mimeType = blobInfo.getContentType().toLowerCase();

    if (blobInfo.getSize() == 0) {
      blobstoreService.delete(blobKey);
      throw new IOException("Invalid Blobkey.");
    } else if (!validExtensions.contains(extension) &&
               !validMimeTypes.contains(mimeType)) {
      blobstoreService.delete(blobKey);
      throw new IOException("File not supported; extension: " + extension +
                            "; MIME type: " + mimeType);
    }
    return extension;
  }

  /**
   * Retrieves asset Entity based on parameters.
   * @param     {String}    kind        asset kind
   * @param     {Key}       ancestor    parent of asset
   * @param     {String}    name        name of the desired asset
   * @return    {Entity}
   */
  public static Entity getAssetEntity(String kind, Key ancestor, String name)
      throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Filter imgFilter = new FilterPredicate("name", FilterOperator.EQUAL, name);
    Query imgQuery = new Query(kind).setAncestor(ancestor).setFilter(imgFilter);
    PreparedQuery existingImgQuery = datastore.prepare(imgQuery);

    if (existingImgQuery.countEntities() == 0) {
      throw new IOException("Image not found.");
    }

    return existingImgQuery.asSingleEntity();
  }

  /**
   * Combines all applicable filters based on parameters.
   * Returns a Filter, CompositeFilter, or null.
   * @param     {HttpServletRequest}    request
   * @param     {boolean}               withMasks
   * @param     {String}                kind        either IMAGE or MASK
   * @return    {Filter}
   */
  public static Filter combinedGetFilters(HttpServletRequest request,
                                          boolean withMasks, String kind) {
    ArrayList<Filter> allImgFilters = new ArrayList<Filter>();

    String tag = request.getParameter("tag");
    boolean isImage = kind == DataUtils.IMAGE;
    boolean isTagApplicable = !(isImage && withMasks);
    if (!DataUtils.isEmptyParameter(tag) && isTagApplicable) {
      Filter tagFilter =
          new FilterPredicate("tags", FilterOperator.EQUAL, tag.toLowerCase());
      allImgFilters.add(tagFilter);
    }

    String imgName = request.getParameter(isImage ? "img-name" : "mask-name");
    if (!DataUtils.isEmptyParameter(imgName)) {
      Filter nameFilter =
          new FilterPredicate("name", FilterOperator.EQUAL, imgName);
      allImgFilters.add(nameFilter);
    }

    // A composite filter requres more than one filter
    if (allImgFilters.size() == 1) {
      return allImgFilters.get(0);
    } else if (allImgFilters.size() > 1) {
      return new CompositeFilter(CompositeFilterOperator.AND, allImgFilters);
    }
    return null;
  }

  /**
   * Returns either the blobkey string and file extension for storage in the
   * database or null.
   * @param     {HttpServletRequest}    request
   * @return    {CustomBlobInfo}
   */
  public static CustomBlobInfo processBlobKey(HttpServletRequest request)
      throws IOException {
    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    boolean isCreateMode = DataUtils.parseMode(request);
    String parentImg = request.getParameter("parent-img");
    boolean isMask = !DataUtils.isEmptyParameter(parentImg);

    // User submitted form without selecting a file
    if (blobKeys == null || blobKeys.isEmpty()) {
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
        return new CustomBlobInfo(blobKey.getKeyString(),
                                  checkFileValidity(blobKey, isMask));
      }
    }
    return null;
  }

  private BlobUtils() {}
}
