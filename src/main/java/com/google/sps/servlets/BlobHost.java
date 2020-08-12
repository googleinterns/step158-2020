package com.google.sps.servlets;

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
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Hosts Blobs directly.
 */
@WebServlet("/blob-host")
public class BlobHost extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("image");

    UserService userService = UserServiceFactory.getUserService();
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      return;
    }

    String blobKeyString = request.getParameter("blobkey");
    if (DataUtils.isEmptyParameter(blobKeyString)) {
      throw new IOException("You do not have access to that resource.");
    }

    Entity assetEntity = new Entity("Image");
    boolean isMask = false;

    // Find asset with the given blobkey
    try {
      assetEntity = getAssetEntity(DataUtils.IMAGE, blobKeyString);
    } catch (Exception e) {
      assetEntity = getAssetEntity(DataUtils.MASK, blobKeyString);
      isMask = true;
    }

    String projId = new String();
    try {
      Entity projEntity = datastore.get(assetEntity.getParent());
      // If Mask, parent's parent --> Project
      if (isMask) {
        projEntity = datastore.get(projEntity.getParent());
      }
      projId = (String)projEntity.getProperty("proj-id");
    } catch (Exception e) {
      throw new IOException(
          "You do not have permission to access this project.");
    }

    String userEmail = userService.getCurrentUser().getEmail();

    // Check the user is either an owner, editor, or asset is public
    DataUtils.getProjectEntity(projId, userEmail, true, true);

    BlobKey blobKey = new BlobKey(blobKeyString);

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();

    blobstoreService.serve(blobKey, response);
  }

  /**
   * Retrieves asset Entity based on parameters.
   * @param     {String}    kind            asset kind
   * @param     {String}    blobKeyString
   * @return    {Entity}
   */
  private Entity getAssetEntity(String kind, String blobKeyString)
      throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Query imgQuery = new Query(kind);
    Filter imgFilter =
        new FilterPredicate("blobkey", FilterOperator.EQUAL, blobKeyString);
    imgQuery.setFilter(imgFilter);
    PreparedQuery existingImgQuery = datastore.prepare(imgQuery);

    if (existingImgQuery.countEntities() == 0) {
      throw new IOException("Image not found.");
    }

    return existingImgQuery.asSingleEntity();
  }
}
