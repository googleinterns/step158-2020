package com.google.sps.servlets;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
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

    if (!userService.isUserLoggedIn()) {
      response.sendRedirect("/");
      return;
    }

    String blobKeyString = request.getParameter("blobkey");
    if (DataUtils.isEmptyParameter(blobKeyString)) {
        throw new IOException("You do not have access to that resource.");
    }
    BlobKey blobKey = new BlobKey(blobKeyString);

    // TODO(dtjanaka@):
    // check for access before serving image from blobkey
    // note: blobkeys are not guessable

    BlobstoreService blobstoreService =
        BlobstoreServiceFactory.getBlobstoreService();

    blobstoreService.serve(blobKey, response);
  }
}