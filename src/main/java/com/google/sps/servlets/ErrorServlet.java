package com.google.sps.servlets;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Handles errors and exceptions.
 */
@WebServlet("/error")
public class ErrorServlet extends HttpServlet {

  protected void doGet(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    processError(request, response);
  }

  protected void doPost(HttpServletRequest request,
                        HttpServletResponse response)
      throws ServletException, IOException {
    processError(request, response);
  }

  /**
   * Responds with information about errors and exceptions thrown during
   * runtime.
   * @param     {HttpServletRequest}    request
   * @param     {HttpServletResponse}   response
   * @return    {void}
   */
  private void processError(HttpServletRequest request,
                            HttpServletResponse response) throws IOException {
    String code = request.getParameter("code");
    if (!DataUtils.isEmptyParameter(code)) {
      response.setContentType("text/html");
      response.getWriter().println("<h1>" + code + "</h1>");
      switch (code) {
      case "404":
        response.getWriter().println("<p>Page not found.</p>");
        return;
      case "500":
        response.getWriter().println("<p>Internal server error.</p>");
        return;
      default:
        response.getWriter().println("<p>Something unexpected occurred.</p>");
        return;
      }
    }

    Throwable throwable =
        (Throwable)request.getAttribute("javax.servlet.error.exception");
    Integer statusCode =
        (Integer)request.getAttribute("javax.servlet.error.status_code");
    String servletName =
        (String)request.getAttribute("javax.servlet.error.servlet_name");
    if (DataUtils.isEmptyParameter(servletName)) {
      servletName = "Unknown";
    }
    String requestUri =
        (String)request.getAttribute("javax.servlet.error.request_uri");
    if (DataUtils.isEmptyParameter(requestUri)) {
      requestUri = "Unknown";
    }

    response.setContentType("application/json");
    Gson gson =
        new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    String errorMessage = throwable.getMessage();
    String moreInfo = throwable.getMessage().replace(".", "") + " thrown on " +
                      servletName + " with status code " + statusCode +
                      " when accessing " + requestUri + ".";
    String jsonError = gson.toJson(new errorObject(errorMessage, moreInfo));
    response.getWriter().println(jsonError);
  }
}

/**
 * Holds the error message and additional exception information.
 */
class errorObject {
  String errorMessage;
  String moreInfo;

  public errorObject(String errorMessage, String moreInfo) {
    this.errorMessage = errorMessage;
    this.moreInfo = moreInfo;
  }
}