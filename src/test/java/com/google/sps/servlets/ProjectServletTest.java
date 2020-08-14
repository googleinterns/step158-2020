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
    servlet = new BlobServlet();
    projId = databaseSetup();
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);
    when(request.getParameter("proj-id")).thenReturn(projId);
    stringWriter = new StringWriter();
    writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  //////////////////////////////////////////////////////////////// 
  //                   Blob servlet POST tests                  //
  ////////////////////////////////////////////////////////////////  

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
    when(request.getParameter("with-masks")).thenReturn("true");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedWithMasks, stringWriter.toString());    
  }

  @Test
  public void sortImg() throws IOException {
    when(request.getParameter("sort-img")).thenReturn("asc");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSortImg, stringWriter.toString());    
  }

  @Test
  public void tagFilter() throws IOException {
    when(request.getParameter("tag")).thenReturn("1");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedTagFilter, stringWriter.toString());    
  }

  @Test
  public void sortMask() throws IOException {
    when(request.getParameter("with-masks")).thenReturn("true"); 
    when(request.getParameter("sort-mask")).thenReturn("asc");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedSortMask, stringWriter.toString());         
  }

  @Test
  public void imgName() throws IOException {
    when(request.getParameter("img-name")).thenReturn("Image1");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedImgName, stringWriter.toString());      
  }

  @Test
  public void maskName() throws IOException {
    when(request.getParameter("img-name")).thenReturn("Image0");   
    when(request.getParameter("mask-name")).thenReturn("Mask0");   
    servlet.doGet(request, response);
    writer.flush();
    assertEquals(expectedMaskName, stringWriter.toString());   
  }
}
