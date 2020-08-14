package com.google.sps.servlets;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import static com.google.sps.servlets.BlobServletTestUtils.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.tools.development.testing.LocalBlobstoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.appengine.tools.development.testing.LocalUserServiceTestConfig;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Arrays;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public final class BlobServletTest {

  private BlobServlet servlet;
  private String projId;

  private final LocalServiceTestHelper helper =
      new LocalServiceTestHelper(new LocalUserServiceTestConfig(),
                                 new LocalDatastoreServiceTestConfig())
          .setEnvIsLoggedIn(true)
          .setEnvEmail("abc@xyz.com")
          .setEnvAuthDomain("gmail.com");

  @Before
  public void setUp() {
    helper.setUp();
    servlet = new BlobServlet();
    projId = databaseSetup();
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void noFilters() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);

    when(request.getParameter("proj-id")).thenReturn(projId);

    StringWriter stringWriter = new StringWriter();
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
    servlet.doGet(request, response);
    writer.flush();
        
    assertEquals(expectedNoFilters, stringWriter.toString());
  }

  // doget
  /*
    proj-id
    with-masks
    sort-img
    tag
    sort-mask
    img-name
    mask-name
  */
}
