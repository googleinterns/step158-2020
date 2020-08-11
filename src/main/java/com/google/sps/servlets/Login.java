package com.google.sps.servlets;

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
 * Sends back the login status of User and a login/logout link.
 */
@WebServlet("/login-status")
public class Login extends HttpServlet {

  /**
   * Handles GET requests for login status.
   * Responds with JSON string of UserInfo object upon successful GET.
   * UserInfo object contains:
   *    {boolean}   loggedIn    login status
   *    {String}    url         login/logout link    
   * @param     {HttpServletRequest}    request
   * @param     {HttpServletResponse}   response
   * @return    {void}
   */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.setContentType("application/json");

    String userInfo = new String();

    UserService userService = UserServiceFactory.getUserService();
    if (userService.isUserLoggedIn()) {
      String logoutUrl = userService.createLogoutURL("/#/logout");
      Gson gson = new GsonBuilder().setPrettyPrinting().create();
      userInfo = gson.toJson(new UserInfo(true, logoutUrl));
    } else {
      String loginUrl = userService.createLoginURL("/");
      Gson gson = new GsonBuilder().setPrettyPrinting().create();
      userInfo = gson.toJson(new UserInfo(false, loginUrl));
    }
    response.getWriter().println(userInfo);
  }
}
