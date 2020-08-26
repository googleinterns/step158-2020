package com.google.sps.servlets;

import static com.google.sps.servlets.BlobServletTestUtils.*;
import static org.junit.Assert.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.appengine.tools.development.testing.LocalUserServiceTestConfig;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Arrays;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest(BlobUtils.class)
public final class BlobServletTest {

  private BlobServlet servlet;
  private String projId;
  private HttpServletRequest request;
  private HttpServletResponse response;
  private StringWriter stringWriter;
  private PrintWriter writer;

  private final LocalServiceTestHelper helper =
      new LocalServiceTestHelper(new LocalUserServiceTestConfig(),
                                 new LocalDatastoreServiceTestConfig())
          .setEnvIsLoggedIn(true)
          .setEnvEmail("abc@xyz.com")
          .setEnvAuthDomain("gmail.com");

  @Before
  public void setUp() throws IOException {
    helper.setUp();
    servlet = new BlobServlet();
    projId = databaseSetup();
    PowerMockito.spy(BlobUtils.class);
    request = Mockito.mock(HttpServletRequest.class);
    response = Mockito.mock(HttpServletResponse.class);
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    // Wrap StringWriter in PrintWriter to get response from servlet
    stringWriter = new StringWriter();
    writer = new PrintWriter(stringWriter);
    Mockito.when(response.getWriter()).thenReturn(writer);
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  ////////////////////////////////////////////////////////////////
  //                   Blob servlet POST tests                  //
  ////////////////////////////////////////////////////////////////

  @Test
  public void basicCreateImage() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("create");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("img-name")).thenReturn("Image2");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(3,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(1,
                 datastore
                     .prepare(new Query(DataUtils.IMAGE)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Image2")))
                     .countEntities());
  }

  @Test
  public void basicCreateMask() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("create");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("parent-img")).thenReturn("Image0");
    Mockito.when(request.getParameter("img-name")).thenReturn("Mask2");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(3,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(1,
                 datastore
                     .prepare(new Query(DataUtils.MASK)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Mask2")))
                     .countEntities());
  }

  @Test
  public void customCreateImage() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("create");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("img-name")).thenReturn("Image0");
    Mockito.when(request.getParameter("tags")).thenReturn("m, n, o");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(3,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Entity imgEntity = new Entity(DataUtils.IMAGE);
    for (Entity e :
         datastore.prepare(new Query(DataUtils.IMAGE)).asIterable()) {
      String name = (String)e.getProperty("name");
      if (!name.equals("Image0") && !name.equals("Image1")) {
        imgEntity = e;
      }
    }
    assertEquals(new ArrayList<String>(Arrays.asList("m", "n", "o")),
                 (ArrayList<String>)imgEntity.getProperty("tags"));
  }

  @Test
  public void customCreateMask() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("create");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("parent-img")).thenReturn("Image0");
    Mockito.when(request.getParameter("img-name")).thenReturn("Mask0");
    Mockito.when(request.getParameter("tags")).thenReturn("m, n, o");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(3,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Entity maskEntity = new Entity(DataUtils.MASK);
    for (Entity e : datastore.prepare(new Query(DataUtils.MASK)).asIterable()) {
      String name = (String)e.getProperty("name");
      if (!name.equals("Mask0") && !name.equals("Mask1")) {
        maskEntity = e;
      }
    }
    assertEquals(new ArrayList<String>(Arrays.asList("m", "n", "o")),
                 (ArrayList<String>)maskEntity.getProperty("tags"));
  }

  @Test
  public void updateImage() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("update");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("img-name")).thenReturn("Image0");
    Mockito.when(request.getParameter("new-name")).thenReturn("Image10");
    Mockito.when(request.getParameter("tags")).thenReturn("m, n, o");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(new ArrayList<String>(Arrays.asList("m", "n", "o")),
                 (ArrayList<String>)datastore
                     .prepare(new Query(DataUtils.IMAGE)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Image10")))
                     .asSingleEntity()
                     .getProperty("tags"));
  }

  @Test
  public void updateMask() throws Exception {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("update");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("parent-img")).thenReturn("Image0");
    Mockito.when(request.getParameter("img-name")).thenReturn("Mask0");
    Mockito.when(request.getParameter("new-name")).thenReturn("Mask10");
    Mockito.when(request.getParameter("tags")).thenReturn("m, n, o");
    PowerMockito.doReturn(new CustomBlobInfo("mno", "png"))
        .when(BlobUtils.class, "processBlobKey", request);
    servlet.doPost(request, response);
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(new ArrayList<String>(Arrays.asList("m", "n", "o")),
                 (ArrayList<String>)datastore
                     .prepare(new Query(DataUtils.MASK)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Mask10")))
                     .asSingleEntity()
                     .getProperty("tags"));
  }

  @Test
  public void deleteImage() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("update");
    Mockito.when(request.getParameter("delete")).thenReturn("true");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("img-name")).thenReturn("Image0");
    servlet.doPost(request, response);
    assertEquals(1,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(0,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(0,
                 datastore
                     .prepare(new Query(DataUtils.IMAGE)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Image0")))
                     .countEntities());
  }

  @Test
  public void deleteMask() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    Mockito.when(request.getParameter("mode")).thenReturn("update");
    Mockito.when(request.getParameter("delete")).thenReturn("true");
    Mockito.when(request.getParameter("proj-id")).thenReturn(projId);
    Mockito.when(request.getParameter("parent-img")).thenReturn("Image0");
    Mockito.when(request.getParameter("img-name")).thenReturn("Mask0");
    servlet.doPost(request, response);
    assertEquals(2,
                 datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(1,
                 datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(0,
                 datastore
                     .prepare(new Query(DataUtils.MASK)
                                  .setFilter(new FilterPredicate(
                                      "name", FilterOperator.EQUAL, "Mask0")))
                     .countEntities());
  }

  ////////////////////////////////////////////////////////////////
  //                   Blob servlet GET tests                   //
  ////////////////////////////////////////////////////////////////
  @Test
  public void noFilters() throws IOException {
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedNoFilters, stringWriter.toString());
  }

  @Test
  public void withMasks() throws IOException {
    Mockito.when(request.getParameter("with-masks")).thenReturn("true");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedWithMasks, stringWriter.toString());
  }

  @Test
  public void sortImg() throws IOException {
    Mockito.when(request.getParameter("sort-img")).thenReturn("asc");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSortImg, stringWriter.toString());
  }

  @Test
  public void tagFilter() throws IOException {
    Mockito.when(request.getParameter("tag")).thenReturn("1");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedTagFilter, stringWriter.toString());
  }

  @Test
  public void sortMask() throws IOException {
    Mockito.when(request.getParameter("with-masks")).thenReturn("true");
    Mockito.when(request.getParameter("sort-mask")).thenReturn("asc");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSortMask, stringWriter.toString());
  }

  @Test
  public void imgName() throws IOException {
    Mockito.when(request.getParameter("img-name")).thenReturn("Image1");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedImgName, stringWriter.toString());
  }

  @Test
  public void maskName() throws IOException {
    Mockito.when(request.getParameter("img-name")).thenReturn("Image0");
    Mockito.when(request.getParameter("mask-name")).thenReturn("Mask0");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedMaskName, stringWriter.toString());
  }
}
