/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified.
 */
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.Date;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.constraints.ConformanceContextMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ConformanceProfileMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.valueset.ValueSetLibraryMetaData;

/**
 * @author jungyubw
 *
 */
public class ProfileAbstract {
  private String id;
  private Long accountId;
  private String sourceType;
  private Date lastUpdatedDate;
  private ConformanceProfileMetaData conformanceProfileMetaData;
  private ConformanceContextMetaData conformanceContextMetaData;
  private ValueSetLibraryMetaData valueSetLibraryMetaData;

  public ConformanceProfileMetaData getConformanceProfileMetaData() {
    return conformanceProfileMetaData;
  }

  public void setConformanceProfileMetaData(ConformanceProfileMetaData conformanceProfileMetaData) {
    this.conformanceProfileMetaData = conformanceProfileMetaData;
  }

  public ConformanceContextMetaData getConformanceContextMetaData() {
    return conformanceContextMetaData;
  }

  public void setConformanceContextMetaData(ConformanceContextMetaData conformanceContextMetaData) {
    this.conformanceContextMetaData = conformanceContextMetaData;
  }

  public ValueSetLibraryMetaData getValueSetLibraryMetaData() {
    return valueSetLibraryMetaData;
  }

  public void setValueSetLibraryMetaData(ValueSetLibraryMetaData valueSetLibraryMetaData) {
    this.valueSetLibraryMetaData = valueSetLibraryMetaData;
  }

  public Long getAccountId() {
    return accountId;
  }

  public void setAccountId(Long accountId) {
    this.accountId = accountId;
  }

  public String getSourceType() {
    return sourceType;
  }

  public void setSourceType(String sourceType) {
    this.sourceType = sourceType;
  }

  public Date getLastUpdatedDate() {
    return lastUpdatedDate;
  }

  public void setLastUpdatedDate(Date lastUpdatedDate) {
    this.lastUpdatedDate = lastUpdatedDate;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }


}
