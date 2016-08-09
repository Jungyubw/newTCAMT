package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.HashMap;

import org.apache.commons.io.IOUtils;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStory;

public class ExportUtil {

	public static String str(String value) {
		return value != null ? value : "";
	}

	public InputStream exportTestPackageAsHtml(TestPlan tp) throws Exception {
		return IOUtils.toInputStream(this.genPackagePages(tp), "UTF-8");
	}
	
	public InputStream exportCoverAsHtml(TestPlan tp) throws Exception {
		return IOUtils.toInputStream(this.genCoverPage(tp), "UTF-8");
	}

	private String genPackagePages(TestPlan tp) throws Exception {
		ClassLoader classLoader = getClass().getClassLoader();
		
		String packageBodyHTML = "";
		packageBodyHTML = packageBodyHTML + "<h1>" + tp.getName() + "</h1>" + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + tp.getDescription() + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

		HashMap<Integer, TestCaseOrGroup> testPlanMap = new HashMap<Integer, TestCaseOrGroup>();
		for (TestCaseOrGroup tcog : tp.getChildren()) {
			testPlanMap.put(tcog.getPosition(), tcog);
		}

		for (int i = 0; i < testPlanMap.keySet().size(); i++) {
			TestCaseOrGroup child = testPlanMap.get(i + 1);

			if (child instanceof TestCaseGroup) {
				TestCaseGroup group = (TestCaseGroup) child;
				packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "\">" + "<h2>" + (i + 1) + ". " + group.getName() + "</h2>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<span>" + group.getDescription() + "</span>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

				HashMap<Integer, TestCase> testCaseMap = new HashMap<Integer, TestCase>();
				for (TestCase tc : group.getTestcases()) {
					testCaseMap.put(tc.getPosition(), tc);
				}

				for (int j = 0; j < testCaseMap.keySet().size(); j++) {
					TestCase tc = testCaseMap.get(j + 1);

					packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "." + (j + 1) + "\">" + "<h2>" + (i + 1) + "." + (j + 1) + ". " + tc.getName() + "</h2>" + System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>" + System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(this.generateTestStory(tc.getTestCaseStory(), "plain"));
					packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

					HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
					for (TestStep ts : tc.getTeststeps()) {
						testStepMap.put(ts.getPosition(), ts);
					}
					
					for(int k=0; k < testStepMap.keySet().size(); k++){
						TestStep ts = testStepMap.get(k+1);
						packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i+1) + "." + (j+1) + "." + (k+1) + "\">" + "<h2>" + (i+1) + "." + (j+1) + "." + (k+1) + ". " + ts.getName() + "</h2>" + System.getProperty("line.separator");
						if(tp.getType() != null && tp.getType().equals("Isolated")){
							packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>" + System.getProperty("line.separator");
						}
						packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>" + System.getProperty("line.separator");
						packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
						packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(this.generateTestStory(ts.getTestStepStory(), "plain"));
						
						
						if(ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null){
							if(ts.getMessageContentsXMLCode() != null && !ts.getMessageContentsXMLCode().equals("")){
								String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl")).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>", "<xsl:param name=\"output\" select=\"'plain-html'\"/>");;
								InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(ts.getMessageContentsXMLCode().getBytes());
								Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);
								
								String messageContentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Message Contents" + "</h3>" + System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(messageContentHTMLStr);
							}
							
							if(ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")){
								if(ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")){
									String tdXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl")).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>", "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
									InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
									InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
									Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
									Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
									String xsltStr = IOUtils.toString(xsltReader);
									String sourceStr = IOUtils.toString(sourceReader);
									
									String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
									packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>" + System.getProperty("line.separator");
									packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(testDataSpecificationHTMLStr);	
								}
								
								if(ts.getJdXSL() != null && !ts.getJdXSL().equals("")){
									String jdXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
									InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
									InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
									Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
									Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
									String xsltStr = IOUtils.toString(xsltReader);
									String sourceStr = IOUtils.toString(sourceReader);
									
									String jurorDocumentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
									packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
									packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jurorDocumentHTMLStr);
								}
							}
							
							
						}
						
						packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
					}
				}

			} else if (child instanceof TestCase) {
				TestCase tc = (TestCase)child;
				packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i+1) + "\">" + "<h2>" + (i+1) + ". " + tc.getName() + "</h2>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(this.generateTestStory(tc.getTestCaseStory(), "plain"));
				packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
				
				HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
				for (TestStep ts : tc.getTeststeps()) {
					testStepMap.put(ts.getPosition(), ts);
				}
				
				for(int j=0; j < testStepMap.keySet().size(); j++){
					TestStep ts = testStepMap.get(j+1);
					packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i+1) + "." + (j+1) + "\">" + "<h2>" + (i+1) + "." + (j+1) + ". " + ts.getName() + "</h2>" + System.getProperty("line.separator");
					if(tp.getType() != null && tp.getType().equals("Isolated")){
						packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>" + System.getProperty("line.separator");
					}
					packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>" + System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(this.generateTestStory(ts.getTestStepStory(), "plain"));
					
					
					if(ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null){
						if(ts.getMessageContentsXMLCode() != null && !ts.getMessageContentsXMLCode().equals("")){
							String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl")).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>", "<xsl:param name=\"output\" select=\"'plain-html'\"/>");;
							InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
							InputStream sourceInputStream = new ByteArrayInputStream(ts.getMessageContentsXMLCode().getBytes());
							Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
							Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
							String xsltStr = IOUtils.toString(xsltReader);
							String sourceStr = IOUtils.toString(sourceReader);
							
							String messageContentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
							packageBodyHTML = packageBodyHTML + "<h3>" + "Message Contents" + "</h3>" + System.getProperty("line.separator");
							packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(messageContentHTMLStr);
						}
						
						if(ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")){
							if(ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")){
								String tdXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl")).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>", "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
								InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
								Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);
								
								String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>" + System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(testDataSpecificationHTMLStr);	
							}
							
							if(ts.getJdXSL() != null && !ts.getJdXSL().equals("")){
								String jdXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
								InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
								Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);
								
								String jurorDocumentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jurorDocumentHTMLStr);
							}
						}
						
						
					}
					
					packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
				}
			}
		}

		String testPackageStr = IOUtils.toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPackage.html"));
		testPackageStr = testPackageStr.replace("?bodyContent?", packageBodyHTML);
		return testPackageStr;
	}

	private String retrieveBodyContent(String generateTestStory) {

		int beginIndex = generateTestStory.indexOf("<body>");
		int endIndex = generateTestStory.indexOf("</body>");

		return "" + generateTestStory.subSequence(beginIndex + "<body>".length(), endIndex);
	}
	
	private String generateTestStory(TestStory testStory, String option) throws Exception {
		ClassLoader classLoader = getClass().getClassLoader();
		String xsltStr;
		
		if(option.equals("ng-tab-html")){
			xsltStr = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator +"TestStory_ng-tab-html.xsl"));
		}else{
			xsltStr = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator +"TestStory_plain-html.xsl"));
		}
		
		String sourceStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + 
						"<TestStory>" + 
							"<comments><![CDATA["+ testStory.getComments().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></comments>" +
							"<postCondition><![CDATA[" + testStory.getPostCondition().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></postCondition>" +
							"<notes><![CDATA[" + testStory.getNotes().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></notes>" + 
							"<teststorydesc><![CDATA[" + testStory.getTeststorydesc().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></teststorydesc>" + 
							"<evaluationCriteria><![CDATA[" + testStory.getEvaluationCriteria().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></evaluationCriteria>" + 
							"<preCondition><![CDATA[" + testStory.getPreCondition().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></preCondition>" + 
							"<testObjectives><![CDATA[" + testStory.getTestObjectives().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ") + "]]></testObjectives>" + 
						"</TestStory>";
		sourceStr = XMLManager.docToString(XMLManager.stringToDom(sourceStr));
	
		return XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
	}
	

	private String genCoverPage(TestPlan tp) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();

		String coverpageStr = IOUtils
				.toString(classLoader.getResourceAsStream("rb" + File.separator + "CoverPage.html"));

		if (tp.getCoverPageTitle() == null || tp.getCoverPageTitle().equals("")) {
			coverpageStr = coverpageStr.replace("?title?", "No Title");
		} else {
			coverpageStr = coverpageStr.replace("?title?", tp.getCoverPageTitle());
		}

		if (tp.getCoverPageSubTitle() == null || tp.getCoverPageSubTitle().equals("")) {
			coverpageStr = coverpageStr.replace("?subtitle?", "No SubTitle");
		} else {
			coverpageStr = coverpageStr.replace("?subtitle?", tp.getCoverPageSubTitle());
		}

		if (tp.getCoverPageVersion() == null || tp.getCoverPageVersion().equals("")) {
			coverpageStr = coverpageStr.replace("?version?", "No Version");
		} else {
			coverpageStr = coverpageStr.replace("?version?", tp.getCoverPageVersion());
		}

		if (tp.getCoverPageDate() == null || tp.getCoverPageDate().equals("")) {
			coverpageStr = coverpageStr.replace("?date?", "No Date");
		} else {
			coverpageStr = coverpageStr.replace("?date?", tp.getCoverPageDate());
		}

		return coverpageStr;
	}
}
