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

public final class BlobServletTestUtils {
  private static final Gson gson =
      new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();

  // Image objects
  private static final MaskInfo Mask0 = new MaskInfo(
      "/blob-host?blobkey=ghi", "Mask0", "png", "2020-08-12T05:39:02.384Z",
      new ArrayList<String>(Arrays.asList("0", "zero")));
  private static final MaskInfo Mask1 = new MaskInfo(
      "/blob-host?blobkey=jkl", "Mask1", "png", "2020-08-12T05:39:02.383Z",
      new ArrayList<String>(Arrays.asList("1", "one")));

  private static final ImageInfo Image0 = new ImageInfo(
      "/blob-host?blobkey=abc", "Image0", "png", "2020-08-12T05:39:02.383Z",
      new ArrayList<String>(Arrays.asList("0", "zero")),
      new ArrayList<MaskInfo>());
  private static final ImageInfo Image1 = new ImageInfo(
      "/blob-host?blobkey=def", "Image1", "png", "2020-08-12T05:39:02.384Z",
      new ArrayList<String>(Arrays.asList("1", "one")),
      new ArrayList<MaskInfo>());
  private static final ImageInfo Image0WithMasks = new ImageInfo(
      "/blob-host?blobkey=abc", "Image0", "png", "2020-08-12T05:39:02.383Z",
      new ArrayList<String>(Arrays.asList("0", "zero")),
      new ArrayList<MaskInfo>(Arrays.asList(Mask0, Mask1)));
  private static final ImageInfo Image0WithMasksSortAsc = new ImageInfo(
      "/blob-host?blobkey=abc", "Image0", "png", "2020-08-12T05:39:02.383Z",
      new ArrayList<String>(Arrays.asList("0", "zero")),
      new ArrayList<MaskInfo>(Arrays.asList(Mask1, Mask0)));
  private static final ImageInfo Image0MaskName = new ImageInfo(
      "/blob-host?blobkey=abc", "Image0", "png", "2020-08-12T05:39:02.383Z",
      new ArrayList<String>(Arrays.asList("0", "zero")),
      new ArrayList<MaskInfo>(Arrays.asList(Mask0)));

  // Expected JSON strings for GET tests
  public static final String expectedNoFilters =
      gson.toJson(new ArrayList<ImageInfo>(Arrays.asList(Image1, Image0))) +
      "\n";
  public static final String expectedWithMasks =
      gson.toJson(
          new ArrayList<ImageInfo>(Arrays.asList(Image1, Image0WithMasks))) +
      "\n";
  public static final String expectedSortImg =
      gson.toJson(new ArrayList<ImageInfo>(Arrays.asList(Image0, Image1))) +
      "\n";
  public static final String expectedTagFilter =
      gson.toJson(new ArrayList<ImageInfo>(Arrays.asList(Image1))) + "\n";
  public static final String expectedSortMask =
      gson.toJson(new ArrayList<ImageInfo>(
          Arrays.asList(Image1, Image0WithMasksSortAsc))) +
      "\n";
  public static final String expectedImgName =
      gson.toJson(new ArrayList<ImageInfo>(Arrays.asList(Image1))) + "\n";
  public static final String expectedMaskName =
      gson.toJson(new ArrayList<ImageInfo>(Arrays.asList(Image0MaskName))) +
      "\n";

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
    datastore.put(projEntity);

    Entity imgEntity = new Entity(DataUtils.IMAGE, 456, projKey);
    imgEntity.setProperty("name", "Image0");
    imgEntity.setProperty("filetype", "png");
    imgEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    imgEntity.setProperty("blobkey", "abc");
    imgEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity imgEntity2 = new Entity(DataUtils.IMAGE, 789, projKey);
    imgEntity2.setProperty("name", "Image1");
    imgEntity2.setProperty("filetype", "png");
    imgEntity2.setProperty("utc", "2020-08-12T05:39:02.384Z");
    imgEntity2.setProperty("blobkey", "def");
    imgEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(imgEntity, imgEntity2));

    Entity maskEntity = new Entity(DataUtils.MASK, 135, imgEntity.getKey());
    maskEntity.setProperty("name", "Mask0");
    maskEntity.setProperty("filetype", "png");
    maskEntity.setProperty("utc", "2020-08-12T05:39:02.384Z");
    maskEntity.setProperty("blobkey", "ghi");
    maskEntity.setIndexedProperty("tags", Arrays.asList("0", "zero"));

    Entity maskEntity2 = new Entity(DataUtils.MASK, 246, imgEntity.getKey());
    maskEntity2.setProperty("name", "Mask1");
    maskEntity2.setProperty("filetype", "png");
    maskEntity2.setProperty("utc", "2020-08-12T05:39:02.383Z");
    maskEntity2.setProperty("blobkey", "jkl");
    maskEntity2.setIndexedProperty("tags", Arrays.asList("1", "one"));

    datastore.put(Arrays.asList(maskEntity, maskEntity2));

    return projId;
  }

  private BlobServletTestUtils() {}
}