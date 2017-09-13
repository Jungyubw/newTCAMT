package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;


@RestController
@RequestMapping("/igamtLogin")
public class IGamtController extends CommonController {
	 private RestTemplate restTemplate;



  @RequestMapping(value = "/login", method = RequestMethod.GET, produces = "application/json")
  public boolean validCredentials(@RequestHeader
		  ("igamt-auth") String authorization)
      throws Exception {
    return validCredentials(authorization);
  }

  
  public boolean validCredential(String authorization) throws Exception {
	    try {
	      HttpHeaders headers = new HttpHeaders();
	      headers.add("Authorization", authorization);
	      HttpEntity<String> entity = new HttpEntity<String>("", headers);
	      ResponseEntity<String> response =
	          restTemplate.exchange("" + "", HttpMethod.GET, entity, String.class);
	      if (response.getStatusCode() == HttpStatus.OK) {
	        return true;
	      }
	      }
	   catch (Exception e) {
	      throw new Exception(e.getMessage());
	    }
		return false;
  }
}