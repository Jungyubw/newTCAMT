package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;



import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfilePreLib;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl.IGAMTDBConn;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.ExportUtil;
import gov.nist.healthcare.unified.enums.Context;
import gov.nist.healthcare.unified.model.EnhancedReport;
import gov.nist.healthcare.unified.proxy.ValidationProxy;
import hl7.v2.validation.content.ConformanceContext;
import hl7.v2.validation.content.DefaultConformanceContext;
import hl7.v2.validation.vs.ValueSetLibrary;
import hl7.v2.validation.vs.ValueSetLibraryImpl;
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
    public String Validate( @RequestParam(value="message") String message,@RequestParam(value="igDocumentId") String igDocumentId ,@RequestParam(value="conformanceProfileId") String conformanceProfileId, @RequestBody TestStep teststep,@RequestParam(value="context") String context ) throws Exception{
		//I added TestStep parameter. Please update client.
		

		//TODO 
		
		ExportUtil util = new ExportUtil();
		IGAMTDBConn con = new IGAMTDBConn();
		IGDocument igDocument = con.findIGDocument(igDocumentId);
		ProfilePreLib ppl = con.convertIGAMT2TCAMT(igDocument.getProfile(), igDocument.getMetaData().getTitle(), igDocumentId);
		String profileXML = util.serializeProfileToDoc(ppl, igDocument).toXML();
		System.out.println("=====wddddddddddddddddddddddddddd==================");
		System.out.println(profileXML);
		String valueSetXML = util.serializeTableLibraryToElement(ppl, igDocument).toXML();
		String constraintsXML = util.serializeConstraintsToDoc(ppl, igDocument).toXML();
		System.out.println(constraintsXML);
		String testStepConstraintXML = teststep.getConstraintsXML();
		System.out.println("=======================");

		System.out.println(testStepConstraintXML);

		//TODO
		ArrayList<String> listConst = new ArrayList<String>();
		listConst.add(constraintsXML);
		// listConst.add(testStepConstraintXML);

		String response= "";
		try {
			
			
			
			ValidationProxy vp = new ValidationProxy(
					"Unified Report Test Application", "NIST");
			EnhancedReport report=new EnhancedReport();
			//constraints
			InputStream contextXML1 = new ByteArrayInputStream(constraintsXML.getBytes(StandardCharsets.UTF_8));
			List<InputStream> confContexts = Arrays.asList( contextXML1 );
			ConformanceContext c = DefaultConformanceContext.apply(confContexts).get();
			
			// values Sets
			
			InputStream vsLibXML = new ByteArrayInputStream(valueSetXML.getBytes(StandardCharsets.UTF_8));
			ValueSetLibrary valueSetLibrary = ValueSetLibraryImpl.apply(vsLibXML).get();
	
			if(context.equals("free")){
				// report=vp.validate(message, profileXML, listConst, valueSetXML, conformanceProfileId, Context.Free);
				 report=vp.validate(message, profileXML,c, valueSetLibrary, conformanceProfileId, Context.Free);
			}
			else if(context.equals("based")){
				 report =vp.validate(message, profileXML, listConst, valueSetXML, conformanceProfileId, Context.Based);
			}
			
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
	
