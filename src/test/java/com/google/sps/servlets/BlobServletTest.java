package com.google.sps.servlets;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
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
    databaseSetup();
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  private void databaseSetup() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Entity projEntity = new Entity(DataUtils.PROJECT, 123456);
    projEntity.setProperty("name", "MyProject");
    projEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    projEntity.setProperty("visibility", DataUtils.PRIVATE);
    projEntity.setIndexedProperty("owners",
                                  Arrays.asList("abc@xyz.com", "def@uvw.com"));
    projEntity.setIndexedProperty("editors",
                                  Arrays.asList("xyz@abc.com", "uvw@def.com"));
    Key projKey = datastore.put(projEntity);
    projId = KeyFactory.keyToString(projKey);

    Entity imgEntity = new Entity(DataUtils.IMAGE, 1, projKey);
    imgEntity.setProperty("name", "Image0");
    imgEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    imgEntity.setProperty("blobkey", "abc");
    imgEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity imgEntity2 = new Entity(DataUtils.IMAGE, 2, projKey);
    imgEntity2.setProperty("name", "Image1");
    imgEntity2.setProperty("utc", "2020-08-12T05:39:02.384Z");
    imgEntity2.setProperty("blobkey", "def");
    imgEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(imgEntity, imgEntity2));

    Entity maskEntity = new Entity(DataUtils.MASK, 1, imgEntity.getKey());
    maskEntity.setProperty("name", "Mask0");
    maskEntity.setProperty("utc", "2020-08-12T05:39:02.384Z");
    maskEntity.setProperty("blobkey", "ghi");
    maskEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity maskEntity2 = new Entity(DataUtils.MASK, 2, imgEntity.getKey());
    maskEntity2.setProperty("name", "Mask1");
    maskEntity2.setProperty("utc", "2020-08-12T05:39:02.383Z");
    maskEntity2.setProperty("blobkey", "jkl");
    maskEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(maskEntity, maskEntity2));
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

    String expected =
        "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  },\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": []\n  }\n]\n";
    assertEquals(expected, stringWriter.toString());
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
