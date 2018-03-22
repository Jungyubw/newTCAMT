package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.Date;
import java.util.Set;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.constraints.ConformanceContextMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ConformanceProfileMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.MessageMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.valueset.ValueSetLibraryMetaData;

@Document(collection = "profile")
public class ProfileData {

  @Id
  private String id;
  
  private Long accountId;
  
  private String sourceType;
  
  private Date lastUpdatedDate;

  private ConformanceProfileMetaData conformanceProfileMetaData;
  private ConformanceContextMetaData conformanceContextMetaData;
  private ValueSetLibraryMetaData valueSetLibraryMetaData;
  private Set<MessageMetaData> messageMetaDataSet;

  private String profileXMLFileStr;
  private String valueSetXMLFileStr;
  private String constraintsXMLFileStr;

  public String getProfileXMLFileStr() {
    return profileXMLFileStr;
  }

  public void setProfileXMLFileStr(String profileXMLFileStr) {
    this.profileXMLFileStr = profileXMLFileStr;
  }

  public String getValueSetXMLFileStr() {
    return valueSetXMLFileStr;
  }

  public void setValueSetXMLFileStr(String valueSetXMLFileStr) {
    this.valueSetXMLFileStr = valueSetXMLFileStr;
  }

  public String getConstraintsXMLFileStr() {
    return constraintsXMLFileStr;
  }

  public void setConstraintsXMLFileStr(String constraintsXMLFileStr) {
    this.constraintsXMLFileStr = constraintsXMLFileStr;
  }

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

  public Set<MessageMetaData> getMessageMetaDataSet() {
    return messageMetaDataSet;
  }

  public void setMessageMetaDataSet(Set<MessageMetaData> messageMetaDataSet) {
    this.messageMetaDataSet = messageMetaDataSet;
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
