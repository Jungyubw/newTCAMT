package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.IgamtConnection;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception.IgamtLoginException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class IgamtConnectionImp implements IgamtConnection {
	private RestTemplate wire;
	@Override
	public boolean validCredentials(String authorization) throws IgamtLoginException {
		// TODO Auto-generated method stub
		
		
		HttpHeaders headers = new HttpHeaders();
		headers.add("Authorization", "Basic " + authorization);
		HttpEntity<String> entity = new HttpEntity<String>("",headers);
    	ResponseEntity<String> response = wire.exchange("http://localhost:8080/igamt/api/accounts/login", HttpMethod.GET,  entity, String.class);
    	return response.getStatusCode() == HttpStatus.OK;
	}

}
