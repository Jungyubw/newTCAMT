package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public class ValidationContainer {

	private String constraint;
	
	private String message;

	public String getConstraint() {
		return constraint;
	}

	public void setConstraint(String constraint) {
		this.constraint = constraint;
	}

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
	
	
}
