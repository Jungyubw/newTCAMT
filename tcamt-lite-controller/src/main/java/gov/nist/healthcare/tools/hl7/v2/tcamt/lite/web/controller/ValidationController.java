package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;



import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.unified.enums.Context;
import gov.nist.healthcare.unified.model.EnhancedReport;
import gov.nist.healthcare.unified.proxy.ValidationProxy;
@RestController
public class ValidationController {


	Logger log = LoggerFactory.getLogger(TestPlanController.class);


	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;
	
	
	
//	public static void main(String[] args) {
//
//		try {
//
//			ValidationProxy vp = new ValidationProxy(
//					"Unified Report Test Application", "NIST");
//
//			String message = Util.streamAsString("/bundle/cb/msg.er7");
//
//			ArrayList<String> constraints = new ArrayList<String>();
//			constraints.add("/bundle/cb/Constraints_CB.xml");
//			
//			EnhancedReport report = vp.validate(message,
//					"/bundle/VXU-Z22_Profile.xml", constraints,
//					"/bundle/VXU-Z22_ValueSetLibrary.xml",
//					"aa72383a-7b48-46e5-a74a-82e019591fe7", Context.Free);
//
//			System.out.println(report.to("json").toString());
//			
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
//	}
	
	
	@RequestMapping(value="/validation", method= RequestMethod.POST)
    public String Validate( @RequestParam(value="message") String message,@RequestParam(value="igDocumentId") String igDocumentId ,@RequestParam(value="conformanceProfileId") String conformanceProfileId) throws Exception{


		
//		System.out.println(message);
//		//EnhancedReport report = vp.validate(message,profileString,conformanceContext, valueSetLibrary,profile, Context.Free);
//		
//		
//
//		ArrayList<String> constraints = new ArrayList<String>();
//		constraints.add("/profiles/IZ_Constraints.xml");
//
//		EnhancedReport report = vp.validate(message,
//				"/profiles/IZ_Profile.xml", constraints,
//				"/profiles/IZ_ValueSetLibrary.xml",
//				"aa72383a-7b48-46e5-a74a-82e019591fe7", Context.Free);
//		System.out.println(report);
		
//		try {
//
//			ValidationProxy vp = new ValidationProxy(
//					"Unified Report Test Application", "NIST");
//
//			
//
//			ArrayList<String> constraints = new ArrayList<String>();
//			constraints.add("/profiles/IZ_Constraints.xml");
//			
//			EnhancedReport report = vp.validate(message,
//					"/profiles/IZ_Profile.xml", constraints,
//					"/profiles/IZ_ValueSetLibrary.xml",
//					"aa72383a-7b48-46e5-a74a-82e019591fe7", Context.Free);
//			
//			System.out.println(report);
//
//			System.out.println(report.to("json").toString());
//			
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
//		
		//String message1 = IOUtils.toString(ValidatorTest.class.getResourceAsStream("/messages/Message1.txt"));

		String response= "";
		try {
			
			String message1 = IOUtils.toString(ValidationController.class.getResourceAsStream("/profiles/VXU_Z22/VXU-Z22_Profile.xml"));
			
			
			ValidationProxy vp = new ValidationProxy(
					"Unified Report Test Application", "NIST");
			EnhancedReport report = vp.validateContent(message,
			"/profiles/VXU_Z22/VXU-Z22_Profile.xml", "/profiles/VXU_Z22/VXU-Z22_Constraints.xml",
			"/profiles/VXU_Z22/VXU-Z22_ValueSetLibrary.xml",
			"aa72383a-7b48-46e5-a74a-82e019591fe7", Context.Free);
			System.out.println(report.render("report", null));	
			response= report.render("report", null);
			System.out.println(response);

		} catch (Exception e) {
			e.printStackTrace();
		}
		JSONObject obj= new JSONObject();
		obj.put("html", response);
		//System.out.println("************************************************************fddrfggf********************************************************************");
		System.out.println(obj.toString());
	return obj.toString();
		
	}
	
 
	
	//static ValueSetLibrary getValueSetLibrary() {
	//InputStream vsLibXML = MainApp.class.getResourceAsStream("/files/VXU-Z22_ValueSetLibrary.xml");
	
	//ValueSetLibrary valueSetLibrary = ValueSetLibraryImpl.apply(vsLibXML).get();
	
	//return valueSetLibrary;
}
	
	
//	private static String getStringFromInputStream(InputStream is) {
//
//		BufferedReader br = null;
//		StringBuilder sb = new StringBuilder();
//
//		String line;
//		try {
//
//			br = new BufferedReader(new InputStreamReader(is));
//			while ((line = br.readLine()) != null) {
//				sb.append(line);
//			}
//
//		} catch (IOException e) {
//			e.printStackTrace();
//		} finally {
//			if (br != null) {
//				try {
//					br.close();
//				} catch (IOException e) {
//					e.printStackTrace();
//				}
//			}
//		}
//
//		return sb.toString();
//
//	}
	
