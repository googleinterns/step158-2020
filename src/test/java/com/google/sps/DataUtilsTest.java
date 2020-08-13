package com.google.sps.servlets;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@RunWith(JUnit4.class)
public final class DataUtilsTest {

  private MockHttpServletRequest request;
  private MockHttpServletResponse response;

  @Before
  public void setUp() {
    request = new MockHttpServletRequest();
    response = new MockHttpServletResponse();
  }

  /**
   * A null parameter is considered empty.
   */
  @Test
  public void nullParameter() {
    String nullString = null;
    assertEquals(true, DataUtils.isEmptyParameter(nullString));
  }

  /**
   * An empty string in a parameter is considered empty.
   */
  @Test
  public void emptyParameter() {
    String emptyString = "";
    assertEquals(true, DataUtils.isEmptyParameter(emptyString));
  }

  /**
   * Duplicate strings should be removed.
   */
  @Test
  public void duplicateStrings() {
    ArrayList<String> duplicates =
        new ArrayList<String>(Arrays.asList("a", "a", "b", "", "b", "c"));
    assertEquals(new ArrayList<String>(Arrays.asList("a", "b", "", "c")),
                        DataUtils.withDuplicatesRemoved(duplicates));
  }

  /**
   * Each substring separated by a comma should become an element in the output 
   * array. 
   */
  @Test
  public void commaList() {
    String commaList =
        "johndoe@gmail.com, janedoe@gmail.com,jack@gmail.com,,jill@gmail.com";
    assertEquals(new ArrayList<String>(Arrays.asList(
                            "johndoe@gmail.com", "janedoe@gmail.com",
                            "jack@gmail.com", "", "jill@gmail.com")),
                        DataUtils.parseCommaList(commaList));
  }

  /**
   * "create" is a valid mode that indicates creation.
   */
  @Test
  public void createMode() throws IOException {
    request.addParameter("mode", "create");
    assertEquals(true, DataUtils.parseMode(request));
  }

  /**
   * "update" is a valid mode that indicates updating (not creation).
   */
  @Test
  public void updateMode() throws IOException {
    request.addParameter("mode", "update");
    assertEquals(false, DataUtils.parseMode(request));
  }

  /**
   * Invalid modes throw an IOException.
   */
  @Test
  public void invalidMode() {
    request.addParameter("mode", "null");
    try {
      DataUtils.parseMode(request);
    } catch (IOException e) {
      assertEquals("Invalid mode.", e.getMessage());
    }
  }
}
