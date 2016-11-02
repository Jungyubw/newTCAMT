package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "template")
public class ProfileDataStr {
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

}
