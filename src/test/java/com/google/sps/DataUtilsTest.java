package com.google.sps.servlets;

import static org.junit.Assert.assertEquals;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.springframework.mock.web.MockHttpServletRequest;

@RunWith(JUnit4.class)
public final class DataUtilsTest {

  private MockHttpServletRequest request;

  private final LocalServiceTestHelper helper =
      new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());

  @Before
  public void setUp() {
    helper.setUp();
    request = new MockHttpServletRequest();
  }

  @After
  public void tearDown() {
    helper.tearDown();
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
    assertEquals(new ArrayList<String>(
                     Arrays.asList("johndoe@gmail.com", "janedoe@gmail.com",
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

  /**
   * Invalid key throw an IOException.
   */
  @Test
  public void noProjectExists() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    try {
      DataUtils.getProjectEntity("abcdef", "abc@xyz.com", true, true);
    } catch (IOException e) {
      assertEquals(
          0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
      assertEquals("Database error when trying to access this project.",
                   e.getMessage());
    }
  }


  /**
   * Owner should always be able to access project.
   */
  @Test
  public void ownersOnly() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    Entity projEntity = new Entity(DataUtils.PROJECT, 123456);
    projEntity.setIndexedProperty("owners", Arrays.asList("abc@xyz.com"));
    Key projKey = datastore.put(projEntity);

    assertEquals(
        1, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    assertEquals(projEntity,
                 DataUtils.getProjectEntity(KeyFactory.keyToString(projKey),
                                            "abc@xyz.com", false, false));
  }

  /**
   * Editor should be able to access project if flag is specified.
   */
  @Test
  public void ownersAndEditorsOnly() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    Entity projEntity = new Entity(DataUtils.PROJECT, 123456);
    projEntity.setIndexedProperty("owners", Arrays.asList("def@xyz.com"));
    projEntity.setIndexedProperty("editors", Arrays.asList("abc@xyz.com"));
    Key projKey = datastore.put(projEntity);

    assertEquals(
        1, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    assertEquals(projEntity,
                 DataUtils.getProjectEntity(KeyFactory.keyToString(projKey),
                                            "abc@xyz.com", true, false));
  }

  /**
   * Anyone should be able to access project if it is public and flag is 
   * specified.
   */
  @Test
  public void ownersOrPublicOnly() throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    Entity projEntity = new Entity(DataUtils.PROJECT, 123456);
    projEntity.setIndexedProperty("owners", Arrays.asList("def@xyz.com"));
    projEntity.setProperty("visibility", DataUtils.PUBLIC);
    Key projKey = datastore.put(projEntity);

    assertEquals(
        1, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    assertEquals(projEntity,
                 DataUtils.getProjectEntity(KeyFactory.keyToString(projKey),
                                            "abc@xyz.com", false, true));
  }

  /**
   * Should not be able to access project if not owner or editor and project is
   * private.
   */
  @Test
  public void noPermission() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    assertEquals(
        0, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
    Entity projEntity = new Entity(DataUtils.PROJECT, 123456);
    projEntity.setIndexedProperty("owners", Arrays.asList("abc@xyz.com"));
    projEntity.setIndexedProperty("owners", Arrays.asList("def@xyz.com"));
    projEntity.setProperty("visibility", DataUtils.PRIVATE);
    Key projKey = datastore.put(projEntity);
    try {
      DataUtils.getProjectEntity(KeyFactory.keyToString(projKey), "ghi@xyz.com",
                                 true, true);
    } catch (IOException e) {
      assertEquals(
          1, datastore.prepare(new Query(DataUtils.PROJECT)).countEntities());
      assertEquals("You do not have permission to access this project.",
                   e.getMessage());
    }
  }
}
