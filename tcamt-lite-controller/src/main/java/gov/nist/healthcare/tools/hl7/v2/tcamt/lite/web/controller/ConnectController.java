package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.io.IOException;
import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception.GVTExportException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception.GVTLoginException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.ConnectService;



@RestController
@RequestMapping("/connect")
public class ConnectController extends CommonController {

  Logger log = LoggerFactory.getLogger(ConnectController.class);


  @Autowired
  private ConnectService connectService;


  @RequestMapping(value = "/login", method = RequestMethod.GET, produces = "application/json")
  public boolean validCredentials(@RequestHeader("target-auth") String authorization,@RequestHeader("target-url") String host)
      throws GVTLoginException {
    log.info("Logging to " + host);
	try {
//		SSLHL7v2ResourceClient client = new SSLHL7v2ResourceClient(host, authorization);
		return connectService.validCredentials(authorization, host);
	} catch (Exception e) {
		throw new GVTLoginException(e.getMessage());
	}
  }


  @RequestMapping(value = "/domains", method = RequestMethod.GET, produces = "application/json")
  public ResponseEntity<?> getDomains(@RequestHeader("target-url") String url,@RequestHeader("target-auth") String authorization)
      throws GVTLoginException {
    log.info("Logging to " + url);
    return connectService.getDomains(authorization, url);
  }
  
  
  @RequestMapping(value = "/createDomain", method = RequestMethod.POST,
      produces = "application/json")
  public ResponseEntity<?>  createDomain(
       @RequestHeader("target-auth") String authorization
      ,@RequestHeader("target-url") String url,
      @RequestBody HashMap<String, String> params,
      HttpServletRequest request, HttpServletResponse response) throws GVTExportException, IOException {
    try {
      log.info(
          "Creating domain with name " +  params.get("name") + ", key=" + params.get("key") + ",url="+ url);
      return  connectService.createDomain(authorization,url,params.get("key"), params.get("name"),params.get("homeTitle"));
      
    }
    catch(HttpClientErrorException e ){
    	String str=e.getResponseBodyAsString();
    	
    	return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(str);
    }
    catch (Exception e) {
      throw new GVTExportException(e);
    }
  }
  

  
  
  

}
