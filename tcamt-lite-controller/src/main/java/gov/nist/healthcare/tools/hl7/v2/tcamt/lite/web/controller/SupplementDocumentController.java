package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.unified.enums.Context;
import gov.nist.healthcare.unified.model.EnhancedReport;
import gov.nist.healthcare.unified.proxy.ValidationProxy;
import javassist.convert.Transformer;

@RestController
public class SupplementDocumentController {

	
	@RequestMapping(value="/validation", method= RequestMethod.POST)
    public String Validate(@RequestParam(value="igDocumentId") String igDocumentId ,@RequestParam(value="conformanceProfileId") String conformanceProfileId) throws Exception{

		return "";}
	
	
	
	
	
	
	
	 
	
	    public void transform(String dataXML, String inputXSL, String outputHTML)
	
	            throws TransformerConfigurationException,
	
	            TransformerException
	
	    {
	
	 
	
	        TransformerFactory factory = TransformerFactory.newInstance();
	
	        StreamSource xslStream = new StreamSource(inputXSL);
	
	        javax.xml.transform.Transformer transformer = factory.newTransformer(xslStream);
	        StreamSource in = new StreamSource(dataXML);
	
	        StreamResult out = new StreamResult(outputHTML);
	
	        transformer.transform(in, out);
	
	        System.out.println("The generated HTML file is:" + outputHTML);
	    }

	
}
