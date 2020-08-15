package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import java.util.Arrays;

public final class ProjectServletTestUtils {
  // Expected JSON strings for GET tests
  public static final String expectedNoFilters =
      "[\n  {\n    \"name\": \"MyProject3\",\n    \"timestamp\": \"2020-08-12T0"
      + "5:39:02.387Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n"
      + "      \"xyz@xyz.com\"\n    ],\n    \"editors\": [\n      \"abc@xyz.com"
      + "\"\n    ]\n  },\n  {\n    \"name\": \"MyProject2\",\n    \"timestamp\""
      + ": \"2020-08-12T05:39:02.384Z\",\n    \"visibility\": \"public\",\n    "
      + "\"owners\": [\n      \"abc@xyz.com\"\n    ],\n    \"editors\": [\n    "
      + "  \"uvw@def.com\"\n    ]\n  },\n  {\n    \"name\": \"MyProject\",\n   "
      + " \"timestamp\": \"2020-08-12T05:39:02.383Z\",\n    \"visibility\": \"p"
      + "rivate\",\n    \"owners\": [\n      \"abc@xyz.com\",\n      \"def@uvw."
      + "com\"\n    ],\n    \"editors\": [\n      \"xyz@abc.com\",\n      \"uvw"
      + "@def.com\"\n    ]\n  }\n]\n";
  public static final String expectedPublicOnly =
      "[\n  {\n    \"name\": \"MyProject2\",\n    \"timestamp\": \"2020-08-12T0"
      + "5:39:02.384Z\",\n    \"visibility\": \"public\",\n    \"owners\": [\n "
      + "     \"abc@xyz.com\"\n    ],\n    \"editors\": [\n      \"uvw@def.com"
      + "\"\n    ]\n  }\n]\n";
  public static final String expectedPrivateOnly =
      "[\n  {\n    \"name\": \"MyProject3\",\n    \"timestamp\": \"2020-08-12T0"
      + "5:39:02.387Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n"
      + "      \"xyz@xyz.com\"\n    ],\n    \"editors\": [\n      \"abc@xyz.com"
      + "\"\n    ]\n  },\n  {\n    \"name\": \"MyProject\",\n    \"timestamp\":"
      + " \"2020-08-12T05:39:02.383Z\",\n    \"visibility\": \"private\",\n    "
      + "\"owners\": [\n      \"abc@xyz.com\",\n      \"def@uvw.com\"\n    ],\n"
      + "    \"editors\": [\n      \"xyz@abc.com\",\n      \"uvw@def.com\"\n   "
      + " ]\n  }\n]\n";
  public static final String expectedGlobalOnly =
      "[\n  {\n    \"name\": \"MyProject3\",\n    \"timestamp\": \"2020-08-12T0"
      + "5:39:02.385Z\",\n    \"visibility\": \"public\",\n    \"owners\": [\n "
      + "     \"xyz@xyz.com\"\n    ],\n    \"editors\": [\n      \"xyz@abc.com"
      + "\",\n      \"uvw@def.com\"\n    ]\n  },\n  {\n    \"name\": \"MyProjec"
      + "t2\",\n    \"timestamp\": \"2020-08-12T05:39:02.384Z\",\n    \"visibil"
      + "ity\": \"public\",\n    \"owners\": [\n      \"abc@xyz.com\"\n    ],\n"
      + "    \"editors\": [\n      \"uvw@def.com\"\n    ]\n  }\n]\n";
  public static final String expectedSortAsc =
      "[\n  {\n    \"name\": \"MyProject\",\n    \"timestamp\": \"2020-08-12T05"
      + ":39:02.383Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n "
      + "     \"abc@xyz.com\",\n      \"def@uvw.com\"\n    ],\n    \"editors\":"
      + " [\n      \"xyz@abc.com\",\n      \"uvw@def.com\"\n    ]\n  },\n  {\n "
      + "   \"name\": \"MyProject2\",\n    \"timestamp\": \"2020-08-12T05:39:02"
      + ".384Z\",\n    \"visibility\": \"public\",\n    \"owners\": [\n      \""
      + "abc@xyz.com\"\n    ],\n    \"editors\": [\n      \"uvw@def.com\"\n    "
      + "]\n  },\n  {\n    \"name\": \"MyProject3\",\n    \"timestamp\": \"2020"
      + "-08-12T05:39:02.387Z\",\n    \"visibility\": \"private\",\n    \"owner"
      + "s\": [\n      \"xyz@xyz.com\"\n    ],\n    \"editors\": [\n      \"abc"
      + "@xyz.com\"\n    ]\n  }\n]\n";
  public static final String expectedSpecificProject =
      "[\n  {\n    \"name\": \"MyProject\",\n    \"timestamp\": \"2020-08-12T05"
      + ":39:02.383Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n "
      + "     \"abc@xyz.com\",\n      \"def@uvw.com\"\n    ],\n    \"editors\":"
      + " [\n      \"xyz@abc.com\",\n      \"uvw@def.com\"\n    ]\n  }\n]\n";
  public static final String expectedRoleEditor =
      "[\n  {\n    \"name\": \"MyProject3\",\n    \"timestamp\": \"2020-08-12T0"
      + "5:39:02.387Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n"
      + "      \"xyz@xyz.com\"\n    ],\n    \"editors\": [\n      \"abc@xyz.com"
      + "\"\n    ]\n  }\n]\n";
  public static final String expectedRoleOwner =
      "[\n  {\n    \"name\": \"MyProject2\",\n    \"timestamp\": \"2020-08-12T0" 
      + "5:39:02.384Z\",\n    \"visibility\": \"public\",\n    \"owners\": [\n "
      + "     \"abc@xyz.com\"\n    ],\n    \"editors\": [\n      \"uvw@def.com"
      + "\"\n    ]\n  },\n  {\n    \"name\": \"MyProject\",\n    \"timestamp\":"
      + " \"2020-08-12T05:39:02.383Z\",\n    \"visibility\": \"private\",\n    "
      + "\"owners\": [\n      \"abc@xyz.com\",\n      \"def@uvw.com\"\n    ],\n"
      + "    \"editors\": [\n      \"xyz@abc.com\",\n      \"uvw@def.com\"\n   "
      + " ]\n  }\n]\n";
  public static final String expectedSearchTerm =
      "[\n  {\n    \"name\": \"MyProject\",\n    \"timestamp\": \"2020-08-12T05"
      + ":39:02.383Z\",\n    \"visibility\": \"private\",\n    \"owners\": [\n "
      + "     \"abc@xyz.com\",\n      \"def@uvw.com\"\n    ],\n    \"editors\":"
      + " [\n      \"xyz@abc.com\",\n      \"uvw@def.com\"\n    ]\n  }\n]\n";

  /**
   * Set up database before each test and return one project ID for use in
   * tests.
   * @return    {String}
   */
  public static String databaseSetup() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Entity projEntity = new Entity(DataUtils.PROJECT, 123);
    projEntity.setProperty("name", "MyProject");
    projEntity.setProperty("utc", "2020-08-12T05:39:02.383Z");
    projEntity.setProperty("visibility", DataUtils.PRIVATE);
    projEntity.setIndexedProperty("owners",
                                  Arrays.asList("abc@xyz.com", "def@uvw.com"));
    projEntity.setIndexedProperty("editors",
                                  Arrays.asList("xyz@abc.com", "uvw@def.com"));
    Key projKey = datastore.put(projEntity);
    String projId = KeyFactory.keyToString(projKey);

    Entity projEntity2 = new Entity(DataUtils.PROJECT, 456);
    projEntity2.setProperty("name", "MyProject2");
    projEntity2.setProperty("utc", "2020-08-12T05:39:02.384Z");
    projEntity2.setProperty("visibility", DataUtils.PUBLIC);
    projEntity2.setIndexedProperty("owners", Arrays.asList("abc@xyz.com"));
    projEntity2.setIndexedProperty("editors", Arrays.asList("uvw@def.com"));

    Entity projEntity3 = new Entity(DataUtils.PROJECT, 789);
    projEntity3.setProperty("name", "MyProject3");
    projEntity3.setProperty("utc", "2020-08-12T05:39:02.385Z");
    projEntity3.setProperty("visibility", DataUtils.PUBLIC);
    projEntity3.setIndexedProperty("owners", Arrays.asList("xyz@xyz.com"));
    projEntity3.setIndexedProperty("editors",
                                   Arrays.asList("xyz@abc.com", "uvw@def.com"));

    Entity projEntity4 = new Entity(DataUtils.PROJECT, 135);
    projEntity4.setProperty("name", "MyProject4");
    projEntity4.setProperty("utc", "2020-08-12T05:39:02.382Z");
    projEntity4.setProperty("visibility", DataUtils.PRIVATE);
    projEntity4.setIndexedProperty("owners", Arrays.asList("abc@abc.com"));

    Entity projEntity5 = new Entity(DataUtils.PROJECT, 246);
    projEntity5.setProperty("name", "MyProject3");
    projEntity5.setProperty("utc", "2020-08-12T05:39:02.387Z");
    projEntity5.setProperty("visibility", DataUtils.PRIVATE);
    projEntity5.setIndexedProperty("owners", Arrays.asList("xyz@xyz.com"));
    projEntity5.setIndexedProperty("editors", Arrays.asList("abc@xyz.com"));

    datastore.put(
        Arrays.asList(projEntity2, projEntity3, projEntity4, projEntity5));

    return projId;
  }

  private ProjectServletTestUtils() {}
}