package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

public enum Stability {
	Static, Dynamic;

	public String value() {
		return name();
	}

	public static Stability fromValue(String v) {
		return !"".equals(v) && v != null ? valueOf(v): Stability.Dynamic;
	}
}
