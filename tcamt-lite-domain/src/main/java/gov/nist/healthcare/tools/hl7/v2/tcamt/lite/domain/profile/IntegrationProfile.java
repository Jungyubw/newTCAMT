package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "integration-profile")
public class IntegrationProfile {

  public IntegrationProfile() {
    super();
  }
  
  @Id
  private String id;
  
  private IntegrationProfileMetaData integrationProfileMetaData;
  
  private Set<Datatype> datatypes;

  private Set<Segment> segments;

  private Set<ConformanceProfile> conformanceProfiles;

  public Set<Datatype> getDatatypes() {
    return datatypes;
  }

  public void setDatatypes(Set<Datatype> datatypes) {
    this.datatypes = datatypes;
  }
  
  public void addDatatype(Datatype dt){
    if(this.datatypes == null) this.datatypes = new HashSet<Datatype>();
    this.datatypes.add(dt);
  }

  public Set<Segment> getSegments() {
    return segments;
  }

  public void setSegments(Set<Segment> segments) {
    this.segments = segments;
  }
  
  public void addSegment(Segment s){
    if(this.segments == null) this.segments = new HashSet<Segment>();
    this.segments.add(s);
  }

  public Set<ConformanceProfile> getConformanceProfiles() {
    return conformanceProfiles;
  }

  public void setConformanceProfiles(Set<ConformanceProfile> conformanceProfiles) {
    this.conformanceProfiles = conformanceProfiles;
  }
  
  public void addConformanceProfile(ConformanceProfile cp){
    if(this.conformanceProfiles == null) this.conformanceProfiles = new HashSet<ConformanceProfile>();
    this.conformanceProfiles.add(cp);
  }

  public IntegrationProfileMetaData getIntegrationProfileMetaData() {
    return integrationProfileMetaData;
  }

  public void setIntegrationProfileMetaData(IntegrationProfileMetaData integrationProfileMetaData) {
    this.integrationProfileMetaData = integrationProfileMetaData;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }
}
