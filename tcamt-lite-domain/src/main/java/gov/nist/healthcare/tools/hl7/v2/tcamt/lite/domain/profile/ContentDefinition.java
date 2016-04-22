package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;


public enum ContentDefinition {
	Extensional, Intensional;

	public String value() {
		return name();
	}

	public static ContentDefinition fromValue(String v) {
		return !"".equals(v) && v != null ? valueOf(v): ContentDefinition.Intensional;
	}
}
