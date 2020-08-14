package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import java.util.Arrays;

public final class BlobServletTestUtils {
  // Expected JSON strings for GET tests    
  public static final String expectedNoFilters = "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  },\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": []\n  }\n]\n";
  public static final String expectedWithMasks = "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  },\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": [\n      {\n        \"url\": \"/blob-host?blobkey=ghi\",\n        \"name\": \"Mask0\",\n        \"utc\": \"2020-08-12T05:39:02.384Z\",\n        \"tags\": [\n          \"0\",\n          \"zero\"\n        ]\n      },\n      {\n        \"url\": \"/blob-host?blobkey=jkl\",\n        \"name\": \"Mask1\",\n        \"utc\": \"2020-08-12T05:39:02.383Z\",\n        \"tags\": [\n          \"1\",\n          \"one\"\n        ]\n      }\n    ]\n  }\n]\n";
  public static final String expectedSortImg = "[\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": []\n  },\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  }\n]\n";
  public static final String expectedTagFilter = "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  }\n]\n";
  public static final String expectedSortMask = "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  },\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": [\n      {\n        \"url\": \"/blob-host?blobkey=jkl\",\n        \"name\": \"Mask1\",\n        \"utc\": \"2020-08-12T05:39:02.383Z\",\n        \"tags\": [\n          \"1\",\n          \"one\"\n        ]\n      },\n      {\n        \"url\": \"/blob-host?blobkey=ghi\",\n        \"name\": \"Mask0\",\n        \"utc\": \"2020-08-12T05:39:02.384Z\",\n        \"tags\": [\n          \"0\",\n          \"zero\"\n        ]\n      }\n    ]\n  }\n]\n";
  public static final String expectedImgName = "[\n  {\n    \"url\": \"/blob-host?blobkey=def\",\n    \"name\": \"Image1\",\n    \"utc\": \"2020-08-12T05:39:02.384Z\",\n    \"tags\": [\n      \"1\",\n      \"one\"\n    ],\n    \"masks\": []\n  }\n]\n";
  public static final String expectedMaskName = "[\n  {\n    \"url\": \"/blob-host?blobkey=abc\",\n    \"name\": \"Image0\",\n    \"utc\": \"2020-08-12T05:39:02.383Z\",\n    \"tags\": [\n      \"0\",\n      \"zero\"\n    ],\n    \"masks\": [\n      {\n        \"url\": \"/blob-host?blobkey=ghi\",\n        \"name\": \"Mask0\",\n        \"utc\": \"2020-08-12T05:39:02.384Z\",\n        \"tags\": [\n          \"0\",\n          \"zero\"\n        ]\n      }\n    ]\n  }\n]\n";

  // Database setup performed before each test
  public static String databaseSetup() {
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
    String projId = KeyFactory.keyToString(projKey);

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

    return projId;
  }

  private BlobServletTestUtils() {}
}