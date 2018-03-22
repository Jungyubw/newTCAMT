package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.util.Set;

public class ConformanceProfile {

  public ConformanceProfile() {
    super();
  }

  private ConformanceProfileMetaData metaData;

  private Set<Datatype> datatypes;

  private Set<Segment> segments;

  private Set<Message> messages;

  public ConformanceProfileMetaData getMetaData() {
    return metaData;
  }

  public void setMetaData(ConformanceProfileMetaData metaData) {
    this.metaData = metaData;
  }

  public Set<Datatype> getDatatypes() {
    return datatypes;
  }

  public void setDatatypes(Set<Datatype> datatypes) {
    this.datatypes = datatypes;
  }

  public Set<Segment> getSegments() {
    return segments;
  }

  public void setSegments(Set<Segment> segments) {
    this.segments = segments;
  }

  public Set<Message> getMessages() {
    return messages;
  }

  public void setMessages(Set<Message> messages) {
    this.messages = messages;
  }



}
