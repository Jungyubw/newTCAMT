package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception.IgamtLoginException;

public interface IgamtConnection {
	  public boolean validCredentials(String authorization) throws IgamtLoginException;

}
