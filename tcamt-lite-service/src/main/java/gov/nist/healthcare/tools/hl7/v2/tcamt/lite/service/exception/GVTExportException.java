package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception;

public class GVTExportException extends Exception {
	private static final long serialVersionUID = 1L;

	public GVTExportException(String error) {
		super(error);
	}

	public GVTExportException(Exception error) {
		super(error);
	}

}
