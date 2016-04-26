package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

public class ProfileMetaDataAndID {

	private String id;
	private ProfileMetaData metadata;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public ProfileMetaData getMetadata() {
		return metadata;
	}
	public void setMetadata(ProfileMetaData metadata) {
		this.metadata = metadata;
	}
}
