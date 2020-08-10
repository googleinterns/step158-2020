package com.google.sps.servlets;

import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Returns a Blobstore upload link. 
 */
@WebServlet("/blob-upload")
public class BlobUrl extends HttpServlet {
  
  /**
   * Handles GET requests for Blobstore upload links.
   * Responds with a string containing the URL upon successful GET.
   * @param     {HttpServletRequest}    request
   * @param     {HttpServletResponse}   response
   * @return    {void}
   */  
  @Override  
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    // Get the Blobstore URL
    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();
    String uploadUrl = blobstoreService.createUploadUrl("/blobs");
    
    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    String jsonUploadUrl = gson.toJson(uploadUrl);
    response.getWriter().println(jsonUploadUrl);
  }
}