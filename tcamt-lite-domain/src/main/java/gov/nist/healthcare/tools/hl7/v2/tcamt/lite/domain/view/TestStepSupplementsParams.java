package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

import java.util.HashMap;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;

public class TestStepSupplementsParams extends TestStepXMLParams {
  private String testCaseName;
  private String tdsXSL;
  private String jdXSL;

  private HashMap<String, Categorization> testDataCategorizationMap;

  public String getTestCaseName() {
    return testCaseName;
  }

  public void setTestCaseName(String testCaseName) {
    this.testCaseName = testCaseName;
  }

  public String getTdsXSL() {
    return tdsXSL;
  }

  public void setTdsXSL(String tdsXSL) {
    this.tdsXSL = tdsXSL;
  }

  public String getJdXSL() {
    return jdXSL;
  }

  public void setJdXSL(String jdXSL) {
    this.jdXSL = jdXSL;
  }

  public HashMap<String, Categorization> getTestDataCategorizationMap() {
    return testDataCategorizationMap;
  }

  public void setTestDataCategorizationMap(HashMap<String, Categorization> testDataCategorizationMap) {
    this.testDataCategorizationMap = testDataCategorizationMap;
  }

  @Override
  public String toString() {
    return "TestStepSupplementsParams [testCaseName=" + testCaseName + ", tdsXSL=" + tdsXSL
        + ", jdXSL=" + jdXSL + ", testDataCategorizationMap=" + testDataCategorizationMap
        + ", getIntegrationProfileId()=" + getIntegrationProfileId()
        + ", getConformanceProfileId()=" + getConformanceProfileId() + ", getEr7Message()="
        + getEr7Message() + "]";
  }
  
  
}
