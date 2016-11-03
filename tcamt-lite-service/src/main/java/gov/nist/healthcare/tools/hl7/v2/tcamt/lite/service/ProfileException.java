package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

public class ProfileException extends Exception {
	private static final long serialVersionUID = 1L;

	public ProfileException(String id) {
		super("Unknown Profile with id " + id);
	}

	public ProfileException(Exception error) {
		super(error);
	}

}
