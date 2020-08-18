package com.google.sps.servlets;

import static com.google.sps.servlets.ProjectServletTestUtils.*;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.KeyFactory;
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

@RunWith(JUnit4.class)
public final class ProjectServletTest {

  private ProjectServlet servlet;
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
    servlet = new ProjectServlet();
    projId = databaseSetup();
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);
    stringWriter = new StringWriter();
    writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  ////////////////////////////////////////////////////////////////
  //                 Project servlet POST tests                 //
  ////////////////////////////////////////////////////////////////
  @Test
  public void basicCreate() throws IOException, EntityNotFoundException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        5, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    when(request.getParameter("mode")).thenReturn("create");
    servlet.doPost(request, response);
    assertEquals(
        6, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    writer.flush();
    Entity projEntity = datastore.get(
        KeyFactory.stringToKey(stringWriter.toString().replace("\"", "")));
    assertTrue(((String)projEntity.getProperty("name")).contains("Untitled"));
    assertEquals((String)projEntity.getProperty("visibility"),
                 DataUtils.PRIVATE);
    assertEquals((ArrayList<String>)projEntity.getProperty("owners"),
                 new ArrayList<String>(Arrays.asList("abc@xyz.com")));
    assertNull((ArrayList<String>)projEntity.getProperty("editors"));
  }

  @Test
  public void customCreate() throws IOException, EntityNotFoundException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        5, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    when(request.getParameter("mode")).thenReturn("create");
    when(request.getParameter("proj-name")).thenReturn("MyProject8");
    when(request.getParameter("visibility")).thenReturn(DataUtils.PUBLIC);
    when(request.getParameter("editors"))
        .thenReturn("aaa@bbb.com, bbb@ccc.com");
    when(request.getParameter("owners")).thenReturn("abc@xyz.com, xyz@abc.com");
    servlet.doPost(request, response);
    assertEquals(
        6, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    writer.flush();
    Entity projEntity = datastore.get(
        KeyFactory.stringToKey(stringWriter.toString().replace("\"", "")));
    assertEquals((String)projEntity.getProperty("name"), "MyProject8");
    assertEquals((String)projEntity.getProperty("visibility"),
                 DataUtils.PUBLIC);
    assertEquals(
        (ArrayList<String>)projEntity.getProperty("owners"),
        new ArrayList<String>(Arrays.asList("abc@xyz.com", "xyz@abc.com")));
    assertEquals(
        (ArrayList<String>)projEntity.getProperty("editors"),
        new ArrayList<String>(Arrays.asList("aaa@bbb.com", "bbb@ccc.com")));
  }

  @Test
  public void update() throws IOException, EntityNotFoundException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        5, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    when(request.getParameter("mode")).thenReturn("update");
    when(request.getParameter("proj-id")).thenReturn(projId);
    when(request.getParameter("proj-name")).thenReturn("MyProject8");
    when(request.getParameter("visibility")).thenReturn(DataUtils.PUBLIC);
    when(request.getParameter("editors"))
        .thenReturn("aaa@bbb.com, bbb@ccc.com");
    when(request.getParameter("owners")).thenReturn("abc@xyz.com, xyz@abc.com");
    servlet.doPost(request, response);
    assertEquals(
        5, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    writer.flush();
    Entity projEntity = datastore.get(KeyFactory.stringToKey(projId));
    assertEquals((String)projEntity.getProperty("name"), "MyProject8");
    assertEquals((String)projEntity.getProperty("visibility"),
                 DataUtils.PUBLIC);
    assertEquals(
        (ArrayList<String>)projEntity.getProperty("owners"),
        new ArrayList<String>(Arrays.asList("abc@xyz.com", "xyz@abc.com")));
    assertEquals(
        (ArrayList<String>)projEntity.getProperty("editors"),
        new ArrayList<String>(Arrays.asList("aaa@bbb.com", "bbb@ccc.com")));
    assertFalse(((String)projEntity.getProperty("name"))
                    .equals("2020-08-12T05:39:02.383Z"));
  }

  @Test
  public void delete() throws IOException, EntityNotFoundException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        5, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    assertEquals(
        2, datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(
        2, datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    when(request.getParameter("mode")).thenReturn("update");
    when(request.getParameter("proj-id")).thenReturn(projId);
    when(request.getParameter("delete")).thenReturn("true");
    servlet.doPost(request, response);
    assertEquals(
        4, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.IMAGE)).countEntities());
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.MASK)).countEntities());
    assertEquals(0,
                 datastore
                     .prepare(new Query(DataUtils.PROJECT)
                                  .setFilter(new FilterPredicate(
                                      "proj-id", FilterOperator.EQUAL, projId)))
                     .countEntities());
  }

  ////////////////////////////////////////////////////////////////
  //                 Project servlet GET tests                  //
  ////////////////////////////////////////////////////////////////
  @Test
  public void noFilters() throws IOException {
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedNoFilters, stringWriter.toString());
  }

  @Test
  public void publicOnly() throws IOException {
    when(request.getParameter("visibility")).thenReturn("public");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedPublicOnly, stringWriter.toString());
  }

  @Test
  public void privateOnly() throws IOException {
    when(request.getParameter("visibility")).thenReturn("private");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedPrivateOnly, stringWriter.toString());
  }

  @Test
  public void globalOnly() throws IOException {
    when(request.getParameter("global")).thenReturn("true");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedGlobalOnly, stringWriter.toString());
  }

  @Test
  public void sortAsc() throws IOException {
    when(request.getParameter("sort")).thenReturn("asc");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSortAsc, stringWriter.toString());
  }

  @Test
  public void specficProject() throws IOException {
    when(request.getParameter("proj-id")).thenReturn(projId);
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSpecificProject, stringWriter.toString());
  }

  @Test
  public void roleEditor() throws IOException {
    when(request.getParameter("role")).thenReturn("editor");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedRoleEditor, stringWriter.toString());
  }

  @Test
  public void roleOwner() throws IOException {
    when(request.getParameter("role")).thenReturn("owner");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedRoleOwner, stringWriter.toString());
  }

  @Test
  public void searchTerm() throws IOException {
    when(request.getParameter("search-term")).thenReturn("MyProject1");
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSearchTerm, stringWriter.toString());
  }
}
