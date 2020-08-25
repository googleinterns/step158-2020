package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.Arrays;

public final class ProjectServletTestUtils {
  private static final Gson gson =
      new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();

  // Project objects
  private static final ProjectInfo MyProject1 = new ProjectInfo(
      "agR0ZXN0cg0LEgdQcm9qZWN0GHsM", "MyProject1", "2020-08-12T05:39:02.383Z",
      "private",
      new ArrayList<String>(Arrays.asList("abc@xyz.com", "def@uvw.com")),
      new ArrayList<String>(Arrays.asList("xyz@abc.com", "uvw@def.com")));
  private static final ProjectInfo MyProject2 =
      new ProjectInfo("agR0ZXN0cg4LEgdQcm9qZWN0GMgDDA", "MyProject2",
                      "2020-08-12T05:39:02.384Z", "public",
                      new ArrayList<String>(Arrays.asList("abc@xyz.com")),
                      new ArrayList<String>(Arrays.asList("uvw@def.com")));
  private static final ProjectInfo MyProject3 = new ProjectInfo(
      "agR0ZXN0cg4LEgdQcm9qZWN0GJUGDA", "MyProject3",
      "2020-08-12T05:39:02.385Z", "public",
      new ArrayList<String>(Arrays.asList("xyz@xyz.com")),
      new ArrayList<String>(Arrays.asList("xyz@abc.com", "uvw@def.com")));
  private static final ProjectInfo MyProject4 = new ProjectInfo(
      "agR0ZXN0cg4LEgdQcm9qZWN0GIcBDA", "MyProject4",
      "2020-08-12T05:39:02.382Z", "private",
      new ArrayList<String>(Arrays.asList("abc@abc.com")), null);
  private static final ProjectInfo MyProject5 =
      new ProjectInfo("agR0ZXN0cg4LEgdQcm9qZWN0GPYBDA", "MyProject5",
                      "2020-08-12T05:39:02.387Z", "private",
                      new ArrayList<String>(Arrays.asList("xyz@xyz.com")),
                      new ArrayList<String>(Arrays.asList("abc@xyz.com")));

  // Expected JSON strings for GET tests
  public static final String expectedNoFilters =
      gson.toJson(new ArrayList<ProjectInfo>(
          Arrays.asList(MyProject5, MyProject2, MyProject1))) +
      "\n";
  public static final String expectedPublicOnly =
      gson.toJson(new ArrayList<ProjectInfo>(Arrays.asList(MyProject2))) + "\n";
  public static final String expectedPrivateOnly =
      gson.toJson(
          new ArrayList<ProjectInfo>(Arrays.asList(MyProject5, MyProject1))) +
      "\n";
  public static final String expectedGlobalOnly =
      gson.toJson(
          new ArrayList<ProjectInfo>(Arrays.asList(MyProject3, MyProject2))) +
      "\n";
  public static final String expectedSortAsc =
      gson.toJson(new ArrayList<ProjectInfo>(
          Arrays.asList(MyProject1, MyProject2, MyProject5))) +
      "\n";
  public static final String expectedSpecificProject =
      gson.toJson(new ArrayList<ProjectInfo>(Arrays.asList(MyProject1))) + "\n";
  public static final String expectedRoleEditor =
      gson.toJson(new ArrayList<ProjectInfo>(Arrays.asList(MyProject5))) + "\n";
  public static final String expectedRoleOwner =
      gson.toJson(
          new ArrayList<ProjectInfo>(Arrays.asList(MyProject2, MyProject1))) +
      "\n";
  public static final String expectedSearchTerm =
      gson.toJson(new ArrayList<ProjectInfo>(Arrays.asList(MyProject1))) + "\n";

  /**
   * Set up database before each test and return one project ID for use in
   * tests.
   * @return    {String}
   */
  public static String databaseSetup() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Entity projEntity = new Entity(DataUtils.PROJECT, 123);
    projEntity.setProperty("name", "MyProject1");
    projEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    projEntity.setProperty("visibility", DataUtils.PRIVATE);
    projEntity.setIndexedProperty("owners",
                                  Arrays.asList("abc@xyz.com", "def@uvw.com"));
    projEntity.setIndexedProperty("editors",
                                  Arrays.asList("xyz@abc.com", "uvw@def.com"));
    Key projKey = datastore.put(projEntity);
    String projId = KeyFactory.keyToString(projKey);
    projEntity.setProperty("proj-id", projId);

    Entity imgEntity = new Entity(DataUtils.IMAGE, 1, projKey);
    imgEntity.setProperty("name", "Image0");
    imgEntity.setProperty("filetype", "png");
    imgEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    imgEntity.setProperty("blobkey", "abc");
    imgEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity imgEntity2 = new Entity(DataUtils.IMAGE, 2, projKey);
    imgEntity2.setProperty("name", "Image1");
    imgEntity2.setProperty("filetype", "png");
    imgEntity2.setProperty("utc", "2020-08-12T05:39:02.384Z");
    imgEntity2.setProperty("blobkey", "def");
    imgEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(imgEntity, imgEntity2));

    Entity maskEntity = new Entity(DataUtils.MASK, 1, imgEntity.getKey());
    maskEntity.setProperty("name", "Mask0");
    maskEntity.setProperty("filetype", "png");
    maskEntity.setProperty("utc", "2020-08-12T05:39:02.384Z");
    maskEntity.setProperty("blobkey", "ghi");
    maskEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity maskEntity2 = new Entity(DataUtils.MASK, 2, imgEntity.getKey());
    maskEntity2.setProperty("name", "Mask1");
    maskEntity2.setProperty("filetype", "png");
    maskEntity2.setProperty("utc", "2020-08-12T05:39:02.383Z");
    maskEntity2.setProperty("blobkey", "jkl");
    maskEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(maskEntity, maskEntity2));

    Entity projEntity2 = new Entity(DataUtils.PROJECT, 456);
    projEntity2.setProperty("name", "MyProject2");
    projEntity2.setProperty("utc", "2020-08-12T05:39:02.384Z");
    projEntity2.setProperty("visibility", DataUtils.PUBLIC);
    projEntity2.setIndexedProperty("owners", Arrays.asList("abc@xyz.com"));
    projEntity2.setIndexedProperty("editors", Arrays.asList("uvw@def.com"));
    projEntity2.setProperty("proj-id",
                            KeyFactory.keyToString(datastore.put(projEntity2)));

    Entity projEntity3 = new Entity(DataUtils.PROJECT, 789);
    projEntity3.setProperty("name", "MyProject3");
    projEntity3.setProperty("utc", "2020-08-12T05:39:02.385Z");
    projEntity3.setProperty("visibility", DataUtils.PUBLIC);
    projEntity3.setIndexedProperty("owners", Arrays.asList("xyz@xyz.com"));
    projEntity3.setIndexedProperty("editors",
                                   Arrays.asList("xyz@abc.com", "uvw@def.com"));
    projEntity3.setProperty("proj-id",
                            KeyFactory.keyToString(datastore.put(projEntity3)));

    Entity projEntity4 = new Entity(DataUtils.PROJECT, 135);
    projEntity4.setProperty("name", "MyProject4");
    projEntity4.setProperty("utc", "2020-08-12T05:39:02.382Z");
    projEntity4.setProperty("visibility", DataUtils.PRIVATE);
    projEntity4.setIndexedProperty("owners", Arrays.asList("abc@abc.com"));
    projEntity4.setProperty("proj-id",
                            KeyFactory.keyToString(datastore.put(projEntity4)));

    Entity projEntity5 = new Entity(DataUtils.PROJECT, 246);
    projEntity5.setProperty("name", "MyProject5");
    projEntity5.setProperty("utc", "2020-08-12T05:39:02.387Z");
    projEntity5.setProperty("visibility", DataUtils.PRIVATE);
    projEntity5.setIndexedProperty("owners", Arrays.asList("xyz@xyz.com"));
    projEntity5.setIndexedProperty("editors", Arrays.asList("abc@xyz.com"));
    projEntity5.setProperty("proj-id",
                            KeyFactory.keyToString(datastore.put(projEntity5)));

    datastore.put(Arrays.asList(projEntity, projEntity2, projEntity3,
                                projEntity4, projEntity5));

    return projId;
  }

  private ProjectServletTestUtils() {}
}