package com.google.sps.servlets;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import static com.google.sps.servlets.ProjectServletTestUtils.*;

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
    when(request.getParameter("search-term")).thenReturn("MyProject");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSearchTerm, stringWriter.toString());      
  }
}
