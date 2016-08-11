package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.HashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

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

	public InputStream exportResourceBundleAsZip(TestPlan tp) throws Exception {
		ByteArrayOutputStream outputStream = null;
		byte[] bytes;
		outputStream = new ByteArrayOutputStream();
		ZipOutputStream out = new ZipOutputStream(outputStream);

		this.generateTestPlanSummary(out, tp);
		this.generateTestPlanRB(out, tp);

		out.close();
		bytes = outputStream.toByteArray();
		return new ByteArrayInputStream(bytes);
	}
	
	private void generateTestPlanRB(ZipOutputStream out, TestPlan tp) throws Exception {
		this.generateTestPlanJsonRB(out, tp);
		HashMap<Integer, TestCaseOrGroup> testPlanMap = new HashMap<Integer, TestCaseOrGroup>();
		for (TestCaseOrGroup tcog : tp.getChildren()) {
			testPlanMap.put(tcog.getPosition(), tcog);
		}
		
		for(int i=0; i< testPlanMap.keySet().size(); i++){
			Object child = testPlanMap.get(i+1);
			if(child instanceof TestCaseGroup){
				TestCaseGroup tg = (TestCaseGroup)child;
				String groupPath = "TestGroup_" + tg.getPosition();
				this.generateTestGroupJsonRB(out, tg, groupPath);
				
				for(TestCase tc:tg.getTestcases()){
					String testcasePath = groupPath + File.separator + "TestCase_" + tc.getPosition();
					this.generateTestCaseJsonRB(out, tc, testcasePath);
					this.generateTestStoryRB(out, tc.getTestCaseStory(), testcasePath);
					
					for(TestStep ts:tc.getTeststeps()){
						String teststepPath = testcasePath + File.separator + "TestStep_" + ts.getPosition();
						this.generateTestStoryRB(out, ts.getTestStepStory(), teststepPath);
						this.generateTestStepJsonRB(out, ts, teststepPath);
						
						if(ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")){
							this.generateEr7Message(out, ts.getEr7Message(), teststepPath);
							this.generateMessageContent(out, ts.getMessageContentsXMLCode(), teststepPath);
							this.generateConstraintsXML(out, ts.getConstraintsXML(), teststepPath);
							
							if(ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")){
								if(ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")){
									this.generateTestDataSpecification(out, ts, teststepPath);
								}
								
								if(ts.getJdXSL() != null && !ts.getJdXSL().equals("")){
									this.generateJurorDocument(out, ts, teststepPath);
								}
							}
						}
					}
				}
			}else if(child instanceof TestCase){
				TestCase tc = (TestCase)child;
				
				String testcasePath = "TestCase_" + tc.getPosition();
				this.generateTestCaseJsonRB(out, tc, testcasePath);
				this.generateTestStoryRB(out, tc.getTestCaseStory(), testcasePath);
				
				for(TestStep ts:tc.getTeststeps()){
					String teststepPath = testcasePath + File.separator + "TestStep_" + ts.getPosition();
					this.generateTestStoryRB(out, ts.getTestStepStory(), teststepPath);
					this.generateTestStepJsonRB(out, ts, teststepPath);
					
					if(ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")){
						this.generateEr7Message(out, ts.getEr7Message(), teststepPath);
						this.generateMessageContent(out, ts.getMessageContentsXMLCode(), teststepPath);
						this.generateConstraintsXML(out, ts.getConstraintsXML(), teststepPath);
						
						if(ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")){
							if(ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")){
								this.generateTestDataSpecification(out, ts, teststepPath);
							}
							
							if(ts.getJdXSL() != null && !ts.getJdXSL().equals("")){
								this.generateJurorDocument(out, ts, teststepPath);
							}
						}
					}
				}
			}
		}
	}			
	
	private void generateJurorDocument(ZipOutputStream out, TestStep ts, String teststepPath) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocument.html"));
		String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
		InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
		InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
		Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
		Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
		String xsltStr = IOUtils.toString(xsltReader);
		String sourceStr = IOUtils.toString(sourceReader);
		String jurorDocumentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(jurorDocumentHTML);
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateTestDataSpecification(ZipOutputStream out, TestStep ts, String teststepPath) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestDataSpecification.html"));
		String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl"));
		InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
		InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
		Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
		Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
		String xsltStr = IOUtils.toString(xsltReader);
		String sourceStr = IOUtils.toString(sourceReader);
		String messageContentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(messageContentHTML);
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
		
	}
	
	private void generateConstraintsXML(ZipOutputStream out, String constraintsXMLCode, String teststepPath) throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "Constraints.xml"));
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(constraintsXMLCode);
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateMessageContent(ZipOutputStream out, String messageContentsXMLCode, String teststepPath) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContent.html"));
		String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl")).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>", "<xsl:param name=\"output\" select=\"'plain-html'\"/>");;
		InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
		InputStream sourceInputStream = new ByteArrayInputStream(messageContentsXMLCode.getBytes());
		Reader xsltReader =  new InputStreamReader(xsltInputStream, "UTF-8");
		Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
		String xsltStr = IOUtils.toString(xsltReader);
		String sourceStr = IOUtils.toString(sourceReader);
		String messageContentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(messageContentHTML);
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateEr7Message(ZipOutputStream out, String er7Message, String teststepPath) throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "Message.txt"));
		
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(er7Message);
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
		
	}

	private void generateTestStepJsonRB(ZipOutputStream out, TestStep ts, String teststepPath) throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestStep.json"));
		
		InputStream inTP = null;
		
		JSONObject obj = new JSONObject();
		obj.put("name", ts.getName());
		obj.put("description", ts.getDescription());
		obj.put("type", ts.getType());
		obj.put("position", ts.getPosition());
		
		JSONObject hl7v2Obj = new JSONObject();
		hl7v2Obj.put("messageId", ts.getConformanceProfileId());
		hl7v2Obj.put("constraintId", ts.getIntegrationProfileId());
		hl7v2Obj.put("valueSetLibraryId", ts.getIntegrationProfileId());
		obj.put("hl7v2", hl7v2Obj);
		
		inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
		
	}

	private void generateTestStoryRB(ZipOutputStream out, TestStory testStory, String path) throws Exception {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(path + File.separator + "TestStory.html"));
		
		String testCaseStoryStr = this.generateTestStory(testStory, "ng-tab-html");
        InputStream inTestStory = IOUtils.toInputStream(testCaseStoryStr, "UTF-8");
        int lenTestStory;
        while ((lenTestStory = inTestStory.read(buf)) > 0) {
            out.write(buf, 0, lenTestStory);
        }
        inTestStory.close();
        out.closeEntry();		
	}

	private void generateTestCaseJsonRB(ZipOutputStream out, TestCase tc, String testcasePath) throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(testcasePath + File.separator + "TestCase.json"));
		
		JSONObject obj = new JSONObject();
		obj.put("name", tc.getName());
		obj.put("description", tc.getDescription());
		obj.put("position", tc.getPosition());
		obj.put("protocol", tc.getProtocol());
		
		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateTestGroupJsonRB(ZipOutputStream out, TestCaseGroup tg, String groupPath) throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(groupPath + File.separator + "TestCaseGroup.json"));
		
		JSONObject obj = new JSONObject();
		obj.put("name", tg.getName());
		obj.put("description", tg.getDescription());
		obj.put("position", tg.getPosition());
		
		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateTestPlanJsonRB(ZipOutputStream out, TestPlan tp) throws IOException {		
		JSONObject obj = new JSONObject();
		obj.put("name", tp.getName());
		obj.put("description", tp.getDescription());
		obj.put("position", tp.getPosition());
		obj.put("type", tp.getType());
		obj.put("transport", tp.isTransport());
		obj.put("domain", tp.getDomain());
		obj.put("skip", false);
		
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry("TestPlan.json"));
		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
        while ((lenTP = inTP.read(buf)) > 0) {
            out.write(buf, 0, lenTP);
        }
        out.closeEntry();
        inTP.close();
	}

	private void generateTestPlanSummary(ZipOutputStream out, TestPlan tp) throws IOException{
		ClassLoader classLoader = getClass().getClassLoader();
		String testPlanSummaryStr = IOUtils.toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPlanSummary.html"));
		testPlanSummaryStr = testPlanSummaryStr.replace("?TestPlanName?", tp.getName());
		
		HashMap<Integer, TestCaseOrGroup> testPlanMap = new HashMap<Integer, TestCaseOrGroup>();
		for (TestCaseOrGroup tcog : tp.getChildren()) {
			testPlanMap.put(tcog.getPosition(), tcog);
		}
		
		String contentsHTML= "";
		
		for(int i=0; i< testPlanMap.keySet().size(); i++){
			Object child = testPlanMap.get(i+1);
			if(child instanceof TestCaseGroup){
				TestCaseGroup group = (TestCaseGroup)child;
				contentsHTML = contentsHTML + "<h2>Test Case Group: " + group.getName() + "</h2>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + group.getDescription() + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");
				
				HashMap<Integer, TestCase>  testCaseMap = new HashMap<Integer, TestCase>();
				for(TestCase tc:group.getTestcases()){
					testCaseMap.put(tc.getPosition(), tc);
				}
				
				for(int j=0; j<testCaseMap.keySet().size(); j++){
					TestCase tc = testCaseMap.get(j+1);
					contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");
					
					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>" + tc.getName() + "</th>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
					
					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<td colspan='2'><p>Description:</p>" + tc.getTestCaseStory().getTeststorydesc() + "</td>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
					
					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th colspan='2'>Test Steps</th>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
					
					HashMap<Integer, TestStep>  testStepMap = new HashMap<Integer, TestStep>();
					for(TestStep ts:tc.getTeststeps()){
						testStepMap.put(ts.getPosition(), ts);
					}
					for(int k=0; k < testStepMap.keySet().size(); k++){
						TestStep ts = testStepMap.get(k+1);
						
						contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
						contentsHTML = contentsHTML + "<th>" + ts.getName() + "</th>" + System.getProperty("line.separator");
						contentsHTML = contentsHTML + "<td><p>Description:</p>" + ts.getTestStepStory().getTeststorydesc() + "<br/>" + "<p>Test Objectives:</p>" + ts.getTestStepStory().getTestObjectives() + "</td>" + System.getProperty("line.separator");
						contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
						
					}
					contentsHTML = contentsHTML + "</table>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");
				}
				
			}else if(child instanceof TestCase){
				TestCase tc = (TestCase)child;
				
				contentsHTML = contentsHTML + "<h2>Test Case non-associated of Test Group</h2>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");
				
				contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");
				
				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th>" + tc.getName() + "</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
				
				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<td colspan='2'><p>Description:</p>" + tc.getTestCaseStory().getTeststorydesc() + "</td>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
				
				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th colspan='2'>Test Steps</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
				
				HashMap<Integer, TestStep>  testStepMap = new HashMap<Integer, TestStep>();
				for(TestStep ts:tc.getTeststeps()){
					testStepMap.put(ts.getPosition(), ts);
				}
				for(int k=0; k < testStepMap.keySet().size(); k++){
					TestStep ts = testStepMap.get(k+1);
					
					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>" + ts.getName() + "</th>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<td><p>Description:</p>" + ts.getTestStepStory().getTeststorydesc() + "<br/>" + "<p>Test Objectives:</p>" + ts.getTestStepStory().getTestObjectives() + "</td>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");
					
				}
				contentsHTML = contentsHTML + "</table>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");
			}
		}
		testPlanSummaryStr = testPlanSummaryStr.replace("?contentsHTML?", contentsHTML);
		
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry("TestPlanSummary.html"));
		InputStream inTestPlanSummary = IOUtils.toInputStream(testPlanSummaryStr);
		int lenTestPlanSummary;
        while ((lenTestPlanSummary = inTestPlanSummary.read(buf)) > 0) {
            out.write(buf, 0, lenTestPlanSummary);
        }
        out.closeEntry();
        inTestPlanSummary.close();
	}
}
