package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Case;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Code;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Component;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatypes;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DocumentMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Field;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Group;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Mapping;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segments;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.TableLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Tables;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByID;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByName;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByNameOrByID;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.CoConstraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Constraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Constraints;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Context;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Predicate;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Reference;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfileMetaDataPreLib;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfilePreLib;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStory;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl.IGAMTDBConn;
import nu.xom.Attribute;
import nu.xom.Builder;
import nu.xom.NodeFactory;
import nu.xom.ParsingException;
import nu.xom.ValidityException;

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
				packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "\">" + "<h2>" + (i + 1) + ". "
						+ group.getName() + "</h2>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<span>" + group.getDescription() + "</span>"
						+ System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

				HashMap<Integer, TestCase> testCaseMap = new HashMap<Integer, TestCase>();
				for (TestCase tc : group.getTestcases()) {
					testCaseMap.put(tc.getPosition(), tc);
				}

				for (int j = 0; j < testCaseMap.keySet().size(); j++) {
					TestCase tc = testCaseMap.get(j + 1);

					packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "." + (j + 1) + "\">" + "<h2>"
							+ (i + 1) + "." + (j + 1) + ". " + tc.getName() + "</h2>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML
							+ this.retrieveBodyContent(this.generateTestStory(tc.getTestCaseStory(), "plain"));
					packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

					HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
					for (TestStep ts : tc.getTeststeps()) {
						testStepMap.put(ts.getPosition(), ts);
					}

					for (int k = 0; k < testStepMap.keySet().size(); k++) {
						TestStep ts = testStepMap.get(k + 1);
						packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "." + (j + 1) + "." + (k + 1)
								+ "\">" + "<h2>" + (i + 1) + "." + (j + 1) + "." + (k + 1) + ". " + ts.getName()
								+ "</h2>" + System.getProperty("line.separator");
						if (tp.getType() != null && tp.getType().equals("Isolated")) {
							packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>"
									+ System.getProperty("line.separator");
						}
						packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>"
								+ System.getProperty("line.separator");
						packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>"
								+ System.getProperty("line.separator");
						packageBodyHTML = packageBodyHTML
								+ this.retrieveBodyContent(this.generateTestStory(ts.getTestStepStory(), "plain"));

						if (ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null) {
							if (ts.getMessageContentsXMLCode() != null && !ts.getMessageContentsXMLCode().equals("")) {
								String mcXSL = IOUtils
										.toString(classLoader
												.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
										.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
												"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
								;
								InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(
										ts.getMessageContentsXMLCode().getBytes());
								Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);

								String messageContentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Message Contents" + "</h3>"
										+ System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(messageContentHTMLStr);
							}

							if (ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")) {
								if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
									String tdXSL = IOUtils
											.toString(classLoader.getResourceAsStream(
													"xsl" + File.separator + ts.getTdsXSL() + ".xsl"))
											.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
													"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
									InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
									InputStream sourceInputStream = new ByteArrayInputStream(
											ts.getNistXMLCode().getBytes());
									Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
									Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
									String xsltStr = IOUtils.toString(xsltReader);
									String sourceStr = IOUtils.toString(sourceReader);

									String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
									packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>"
											+ System.getProperty("line.separator");
									packageBodyHTML = packageBodyHTML
											+ this.retrieveBodyContent(testDataSpecificationHTMLStr);
								}

								if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
									String jdXSL = IOUtils.toString(classLoader
											.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
									InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
									InputStream sourceInputStream = new ByteArrayInputStream(
											ts.getNistXMLCode().getBytes());
									Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
									Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
									String xsltStr = IOUtils.toString(xsltReader);
									String sourceStr = IOUtils.toString(sourceReader);

									String jurorDocumentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
									packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>"
											+ System.getProperty("line.separator");
									packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jurorDocumentHTMLStr);
								}
							}

						}

						packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
					}
				}

			} else if (child instanceof TestCase) {
				TestCase tc = (TestCase) child;
				packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "\">" + "<h2>" + (i + 1) + ". "
						+ tc.getName() + "</h2>" + System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>"
						+ System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>"
						+ System.getProperty("line.separator");
				packageBodyHTML = packageBodyHTML
						+ this.retrieveBodyContent(this.generateTestStory(tc.getTestCaseStory(), "plain"));
				packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

				HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
				for (TestStep ts : tc.getTeststeps()) {
					testStepMap.put(ts.getPosition(), ts);
				}

				for (int j = 0; j < testStepMap.keySet().size(); j++) {
					TestStep ts = testStepMap.get(j + 1);
					packageBodyHTML = packageBodyHTML + "<A NAME=\"" + (i + 1) + "." + (j + 1) + "\">" + "<h2>"
							+ (i + 1) + "." + (j + 1) + ". " + ts.getName() + "</h2>"
							+ System.getProperty("line.separator");
					if (tp.getType() != null && tp.getType().equals("Isolated")) {
						packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>"
								+ System.getProperty("line.separator");
					}
					packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML
							+ this.retrieveBodyContent(this.generateTestStory(ts.getTestStepStory(), "plain"));

					if (ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null) {
						if (ts.getMessageContentsXMLCode() != null && !ts.getMessageContentsXMLCode().equals("")) {
							String mcXSL = IOUtils
									.toString(classLoader
											.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
									.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
											"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
							;
							InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
							InputStream sourceInputStream = new ByteArrayInputStream(
									ts.getMessageContentsXMLCode().getBytes());
							Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
							Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
							String xsltStr = IOUtils.toString(xsltReader);
							String sourceStr = IOUtils.toString(sourceReader);

							String messageContentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
							packageBodyHTML = packageBodyHTML + "<h3>" + "Message Contents" + "</h3>"
									+ System.getProperty("line.separator");
							packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(messageContentHTMLStr);
						}

						if (ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")) {
							if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
								String tdXSL = IOUtils
										.toString(classLoader
												.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl"))
										.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
												"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
								InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(
										ts.getNistXMLCode().getBytes());
								Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);

								String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>"
										+ System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML
										+ this.retrieveBodyContent(testDataSpecificationHTMLStr);
							}

							if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
								String jdXSL = IOUtils.toString(classLoader
										.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
								InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
								InputStream sourceInputStream = new ByteArrayInputStream(
										ts.getNistXMLCode().getBytes());
								Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
								Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
								String xsltStr = IOUtils.toString(xsltReader);
								String sourceStr = IOUtils.toString(sourceReader);

								String jurorDocumentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
								packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>"
										+ System.getProperty("line.separator");
								packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jurorDocumentHTMLStr);
							}
						}

					}

					packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
				}
			}
		}

		String testPackageStr = IOUtils
				.toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPackage.html"));
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

		if (option.equals("ng-tab-html")) {
			xsltStr = IOUtils
					.toString(classLoader.getResourceAsStream("xsl" + File.separator + "TestStory_ng-tab-html.xsl"));
		} else {
			xsltStr = IOUtils
					.toString(classLoader.getResourceAsStream("xsl" + File.separator + "TestStory_plain-html.xsl"));
		}

		String sourceStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + "<TestStory>" + "<comments><![CDATA["
				+ testStory.getComments().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
						.replace("&nbsp;", " ")
				+ "]]></comments>" + "<postCondition><![CDATA["
				+ testStory.getPostCondition().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
						.replace("&nbsp;", " ")
				+ "]]></postCondition>" + "<notes><![CDATA["
				+ testStory.getNotes().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;",
						" ")
				+ "]]></notes>" + "<teststorydesc><![CDATA["
				+ testStory.getTeststorydesc().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
						.replace("&nbsp;", " ")
				+ "]]></teststorydesc>" + "<evaluationCriteria><![CDATA["
				+ testStory.getEvaluationCriteria().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
						.replace("&nbsp;", " ")
				+ "]]></evaluationCriteria>" + "<preCondition><![CDATA["
				+ testStory.getPreCondition().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
						.replace("&nbsp;", " ")
				+ "]]></preCondition>" + "<testObjectives><![CDATA[" + testStory.getTestObjectives()
						.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ")
				+ "]]></testObjectives>" + "</TestStory>";
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

		for (int i = 0; i < testPlanMap.keySet().size(); i++) {
			Object child = testPlanMap.get(i + 1);
			if (child instanceof TestCaseGroup) {
				TestCaseGroup tg = (TestCaseGroup) child;
				String groupPath = "TestGroup_" + tg.getPosition();
				this.generateTestGroupJsonRB(out, tg, groupPath);

				for (TestCase tc : tg.getTestcases()) {
					String testcasePath = groupPath + File.separator + "TestCase_" + tc.getPosition();
					this.generateTestCaseJsonRB(out, tc, testcasePath);
					this.generateTestStoryRB(out, tc.getTestCaseStory(), testcasePath);

					for (TestStep ts : tc.getTeststeps()) {
						String teststepPath = testcasePath + File.separator + "TestStep_" + ts.getPosition();
						this.generateTestStoryRB(out, ts.getTestStepStory(), teststepPath);
						this.generateTestStepJsonRB(out, ts, teststepPath);

						if (ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")) {
							this.generateEr7Message(out, ts.getEr7Message(), teststepPath);
							this.generateMessageContent(out, ts.getMessageContentsXMLCode(), teststepPath);
							this.generateConstraintsXML(out, ts.getConstraintsXML(), teststepPath);

							if (ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")) {
								if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
									this.generateTestDataSpecification(out, ts, teststepPath);
								}

								if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
									this.generateJurorDocument(out, ts, teststepPath);
								}
							}
						}
					}
				}
			} else if (child instanceof TestCase) {
				TestCase tc = (TestCase) child;

				String testcasePath = "TestCase_" + tc.getPosition();
				this.generateTestCaseJsonRB(out, tc, testcasePath);
				this.generateTestStoryRB(out, tc.getTestCaseStory(), testcasePath);

				for (TestStep ts : tc.getTeststeps()) {
					String teststepPath = testcasePath + File.separator + "TestStep_" + ts.getPosition();
					this.generateTestStoryRB(out, ts.getTestStepStory(), teststepPath);
					this.generateTestStepJsonRB(out, ts, teststepPath);

					if (ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")) {
						this.generateEr7Message(out, ts.getEr7Message(), teststepPath);
						this.generateMessageContent(out, ts.getMessageContentsXMLCode(), teststepPath);
						this.generateConstraintsXML(out, ts.getConstraintsXML(), teststepPath);

						if (ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")) {
							if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
								this.generateTestDataSpecification(out, ts, teststepPath);
							}

							if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
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
		InputStream is = classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl");
		if(is != null){
			byte[] buf = new byte[1024];
			out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocument.html"));
			String mcXSL = IOUtils.toString(is);
			InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
			InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
			Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
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
	}

	private void generateTestDataSpecification(ZipOutputStream out, TestStep ts, String teststepPath)
			throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		InputStream is = classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl");
		if(is != null){
			byte[] buf = new byte[1024];
			out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestDataSpecification.html"));
			String mcXSL = IOUtils.toString(is);
			InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
			InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
			Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
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
	}

	private void generateConstraintsXML(ZipOutputStream out, String constraintsXMLCode, String teststepPath)
			throws IOException {
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

	private void generateMessageContent(ZipOutputStream out, String messageContentsXMLCode, String teststepPath)
			throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContent.html"));
		String mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
				.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
						"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
		;
		InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
		InputStream sourceInputStream = new ByteArrayInputStream(messageContentsXMLCode.getBytes());
		Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
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

	private void generateTestPlanSummary(ZipOutputStream out, TestPlan tp) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		String testPlanSummaryStr = IOUtils
				.toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPlanSummary.html"));
		testPlanSummaryStr = testPlanSummaryStr.replace("?TestPlanName?", tp.getName());

		HashMap<Integer, TestCaseOrGroup> testPlanMap = new HashMap<Integer, TestCaseOrGroup>();
		for (TestCaseOrGroup tcog : tp.getChildren()) {
			testPlanMap.put(tcog.getPosition(), tcog);
		}

		String contentsHTML = "";

		for (int i = 0; i < testPlanMap.keySet().size(); i++) {
			Object child = testPlanMap.get(i + 1);
			if (child instanceof TestCaseGroup) {
				TestCaseGroup group = (TestCaseGroup) child;
				contentsHTML = contentsHTML + "<h2>Test Case Group: " + group.getName() + "</h2>"
						+ System.getProperty("line.separator");
				contentsHTML = contentsHTML + group.getDescription() + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

				HashMap<Integer, TestCase> testCaseMap = new HashMap<Integer, TestCase>();
				for (TestCase tc : group.getTestcases()) {
					testCaseMap.put(tc.getPosition(), tc);
				}

				for (int j = 0; j < testCaseMap.keySet().size(); j++) {
					TestCase tc = testCaseMap.get(j + 1);
					contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");

					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>" + tc.getName() + "</th>"
							+ System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<td colspan='2'><p>Description:</p>"
							+ tc.getTestCaseStory().getTeststorydesc() + "</td>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th colspan='2'>Test Steps</th>"
							+ System.getProperty("line.separator");
					contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

					HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
					for (TestStep ts : tc.getTeststeps()) {
						testStepMap.put(ts.getPosition(), ts);
					}
					for (int k = 0; k < testStepMap.keySet().size(); k++) {
						TestStep ts = testStepMap.get(k + 1);

						contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
						contentsHTML = contentsHTML + "<th>" + ts.getName() + "</th>"
								+ System.getProperty("line.separator");
						contentsHTML = contentsHTML + "<td><p>Description:</p>"
								+ ts.getTestStepStory().getTeststorydesc() + "<br/>" + "<p>Test Objectives:</p>"
								+ ts.getTestStepStory().getTestObjectives() + "</td>"
								+ System.getProperty("line.separator");
						contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

					}
					contentsHTML = contentsHTML + "</table>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");
				}

			} else if (child instanceof TestCase) {
				TestCase tc = (TestCase) child;

				contentsHTML = contentsHTML + "<h2>Test Case non-associated of Test Group</h2>"
						+ System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

				contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");

				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th>" + tc.getName() + "</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<td colspan='2'><p>Description:</p>"
						+ tc.getTestCaseStory().getTeststorydesc() + "</td>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

				contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "<th colspan='2'>Test Steps</th>" + System.getProperty("line.separator");
				contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

				HashMap<Integer, TestStep> testStepMap = new HashMap<Integer, TestStep>();
				for (TestStep ts : tc.getTeststeps()) {
					testStepMap.put(ts.getPosition(), ts);
				}
				for (int k = 0; k < testStepMap.keySet().size(); k++) {
					TestStep ts = testStepMap.get(k + 1);

					contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<th>" + ts.getName() + "</th>"
							+ System.getProperty("line.separator");
					contentsHTML = contentsHTML + "<td><p>Description:</p>" + ts.getTestStepStory().getTeststorydesc()
							+ "<br/>" + "<p>Test Objectives:</p>" + ts.getTestStepStory().getTestObjectives() + "</td>"
							+ System.getProperty("line.separator");
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

	public InputStream exportProfileXMLZip(String[] ipid) throws IOException {

		ByteArrayOutputStream outputStream = null;
		byte[] bytes;
		outputStream = new ByteArrayOutputStream();
		ZipOutputStream out = new ZipOutputStream(outputStream);

		for (String id : ipid) {
			this.generateProfileXML(out, id);
		}
		out.close();
		bytes = outputStream.toByteArray();
		return new ByteArrayInputStream(bytes);
	}

	private void generateProfileXML(ZipOutputStream out, String id) throws IOException {
		IGAMTDBConn con = new IGAMTDBConn();
		IGDocument igDocument = con.findIGDocument(id);
		ProfilePreLib ppl = con.convertIGAMT2TCAMT(igDocument.getProfile(), igDocument.getMetaData().getTitle(), id);
		String profileXML = this.serializeProfileToDoc(ppl, igDocument).toXML();
		String valueSetXML = this.serializeTableLibraryToElement(ppl, igDocument).toXML();
		String constraintsXML = this.serializeConstraintsToDoc(ppl, igDocument).toXML();

		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(id + "_Profile.xml"));
		InputStream inTP = null;
		inTP = IOUtils.toInputStream(profileXML);
		int lenTP;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();

		out.putNextEntry(new ZipEntry(id + "_ValueSet.xml"));
		inTP = null;
		inTP = IOUtils.toInputStream(valueSetXML);
		lenTP = 0;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();
		
		out.putNextEntry(new ZipEntry(id + "_Constraints.xml"));
		inTP = null;
		inTP = IOUtils.toInputStream(constraintsXML);
		lenTP = 0;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();
	}

	public nu.xom.Document serializeProfileToDoc(ProfilePreLib profile, IGDocument igDoc) {
		nu.xom.Element e = new nu.xom.Element("ConformanceProfile");
		this.serializeProfileMetaData(e, profile.getMetaData(), igDoc.getMetaData(), igDoc.getId());

		nu.xom.Element ms = new nu.xom.Element("Messages");
		for (Message m : profile.getMessages().getChildren()) {
			ms.appendChild(this.serializeMessage(m, profile.getSegments()));
		}
		e.appendChild(ms);

		nu.xom.Element ss = new nu.xom.Element("Segments");
		for (Segment s : profile.getSegments().getChildren()) {
			ss.appendChild(this.serializeSegment(s, profile.getTables(), profile.getDatatypes()));
		}
		e.appendChild(ss);

		nu.xom.Element ds = new nu.xom.Element("Datatypes");
		for (Datatype d : profile.getDatatypes().getChildren()) {
			ds.appendChild(this.serializeDatatypeForValidation(d, profile.getTables(), profile.getDatatypes()));
		}
		e.appendChild(ds);

		nu.xom.Document doc = new nu.xom.Document(e);

		return doc;
	}

	private void serializeProfileMetaData(nu.xom.Element e, ProfileMetaDataPreLib metaData, DocumentMetaData igMetaData,
			String id) {
		e.addAttribute(new Attribute("ID", id));

		if (metaData.getType() != null && !metaData.getType().equals(""))
			e.addAttribute(new Attribute("Type", ExportUtil.str(metaData.getType())));
		if (metaData.getHl7Version() != null && !metaData.getHl7Version().equals(""))
			e.addAttribute(new Attribute("HL7Version", ExportUtil.str(metaData.getHl7Version())));
		if (metaData.getSchemaVersion() != null && !metaData.getSchemaVersion().equals(""))
			e.addAttribute(new Attribute("SchemaVersion", ExportUtil.str(metaData.getSchemaVersion())));

		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		elmMetaData.addAttribute(new Attribute("Name", !ExportUtil.str(igMetaData.getTitle()).equals("")
				? ExportUtil.str(igMetaData.getTitle()) : "No Title Info"));
		elmMetaData.addAttribute(new Attribute("OrgName", !ExportUtil.str(igMetaData.getOrgName()).equals("")
				? ExportUtil.str(igMetaData.getOrgName()) : "No Org Info"));
		elmMetaData.addAttribute(new Attribute("Version", !ExportUtil.str(igMetaData.getVersion()).equals("")
				? ExportUtil.str(igMetaData.getVersion()) : "No Version Info"));
		elmMetaData.addAttribute(new Attribute("Date", !ExportUtil.str(igMetaData.getDate()).equals("")
				? ExportUtil.str(igMetaData.getDate()) : "No Date Info"));

		if (metaData.getSpecificationName() != null && !metaData.getSpecificationName().equals(""))
			elmMetaData
					.addAttribute(new Attribute("SpecificationName", ExportUtil.str(metaData.getSpecificationName())));
		if (metaData.getStatus() != null && !metaData.getStatus().equals(""))
			elmMetaData.addAttribute(new Attribute("Status", ExportUtil.str(metaData.getStatus())));
		if (metaData.getTopics() != null && !metaData.getTopics().equals(""))
			elmMetaData.addAttribute(new Attribute("Topics", ExportUtil.str(metaData.getTopics())));

		e.appendChild(elmMetaData);
	}

	private nu.xom.Element serializeMessage(Message m, Segments segments) {
		nu.xom.Element elmMessage = new nu.xom.Element("Message");

		elmMessage.addAttribute(new Attribute("ID", m.getId()));
		
		if (m.getIdentifier() != null && !m.getIdentifier().equals(""))
			elmMessage.addAttribute(new Attribute("Identifier", ExportUtil.str(m.getIdentifier())));
		if (m.getName() != null && !m.getName().equals(""))
			elmMessage.addAttribute(new Attribute("Name", ExportUtil.str(m.getName())));
		elmMessage.addAttribute(new Attribute("Type", ExportUtil.str(m.getMessageType())));
		elmMessage.addAttribute(new Attribute("Event", ExportUtil.str(m.getEvent())));
		elmMessage.addAttribute(new Attribute("StructID", ExportUtil.str(m.getStructID())));
		if (m.getDescription() != null && !m.getDescription().equals(""))
			elmMessage.addAttribute(new Attribute("Description", ExportUtil.str(m.getDescription())));

		Map<Integer, SegmentRefOrGroup> segmentRefOrGroups = new HashMap<Integer, SegmentRefOrGroup>();

		for (SegmentRefOrGroup segmentRefOrGroup : m.getChildren()) {
			segmentRefOrGroups.put(segmentRefOrGroup.getPosition(), segmentRefOrGroup);
		}

		for (int i = 1; i < segmentRefOrGroups.size() + 1; i++) {
			SegmentRefOrGroup segmentRefOrGroup = segmentRefOrGroups.get(i);
			if (segmentRefOrGroup instanceof SegmentRef) {
				elmMessage.appendChild(serializeSegmentRef((SegmentRef) segmentRefOrGroup));
			} else if (segmentRefOrGroup instanceof Group) {
				elmMessage.appendChild(serializeGroup((Group) segmentRefOrGroup));
			}
		}

		return elmMessage;
	}

	private nu.xom.Element serializeSegmentRef(SegmentRef segmentRef) {
		nu.xom.Element elmSegment = new nu.xom.Element("Segment");
		elmSegment.addAttribute(new Attribute("Ref", ExportUtil.str(segmentRef.getRef().getLabel())));
		elmSegment.addAttribute(new Attribute("Usage", ExportUtil.str(segmentRef.getUsage().value())));
		elmSegment.addAttribute(new Attribute("Min", ExportUtil.str(segmentRef.getMin() + "")));
		elmSegment.addAttribute(new Attribute("Max", ExportUtil.str(segmentRef.getMax())));
		return elmSegment;
	}

	private nu.xom.Element serializeGroup(Group group) {
		nu.xom.Element elmGroup = new nu.xom.Element("Group");
		elmGroup.addAttribute(new Attribute("ID", ExportUtil.str(group.getName())));
		elmGroup.addAttribute(new Attribute("Name", ExportUtil.str(group.getName())));
		elmGroup.addAttribute(new Attribute("Usage", ExportUtil.str(group.getUsage().value())));
		elmGroup.addAttribute(new Attribute("Min", ExportUtil.str(group.getMin() + "")));
		elmGroup.addAttribute(new Attribute("Max", ExportUtil.str(group.getMax())));

		Map<Integer, SegmentRefOrGroup> segmentRefOrGroups = new HashMap<Integer, SegmentRefOrGroup>();

		for (SegmentRefOrGroup segmentRefOrGroup : group.getChildren()) {
			segmentRefOrGroups.put(segmentRefOrGroup.getPosition(), segmentRefOrGroup);
		}

		for (int i = 1; i < segmentRefOrGroups.size() + 1; i++) {
			SegmentRefOrGroup segmentRefOrGroup = segmentRefOrGroups.get(i);
			if (segmentRefOrGroup instanceof SegmentRef) {
				elmGroup.appendChild(serializeSegmentRef((SegmentRef) segmentRefOrGroup));
			} else if (segmentRefOrGroup instanceof Group) {
				elmGroup.appendChild(serializeGroup((Group) segmentRefOrGroup));
			}
		}

		return elmGroup;
	}

	private nu.xom.Element serializeSegment(Segment s, Tables tables, Datatypes datatypes) {
		nu.xom.Element elmSegment = new nu.xom.Element("Segment");
		elmSegment.addAttribute(new Attribute("ID", s.getLabel()));
		elmSegment.addAttribute(new Attribute("Name", ExportUtil.str(s.getName())));
		elmSegment.addAttribute(new Attribute("Label", ExportUtil.str(s.getLabel())));
		elmSegment.addAttribute(new Attribute("Description", ExportUtil.str(s.getDescription())));

		if (s.getDynamicMapping() != null && s.getDynamicMapping().getMappings().size() > 0) {
			nu.xom.Element elmDynamicMapping = new nu.xom.Element("DynamicMapping");

			for (Mapping m : s.getDynamicMapping().getMappings()) {
				nu.xom.Element elmMapping = new nu.xom.Element("Mapping");
				elmMapping.addAttribute(new Attribute("Position", String.valueOf(m.getPosition())));
				elmMapping.addAttribute(new Attribute("Reference", String.valueOf(m.getReference())));

				if (m.getSecondReference() != null) {
					elmMapping.addAttribute(new Attribute("SecondReference", String.valueOf(m.getSecondReference())));
				}

				for (Case c : m.getCases()) {
					nu.xom.Element elmCase = new nu.xom.Element("Case");
					elmCase.addAttribute(new Attribute("Value", c.getValue()));
					if (c.getSecondValue() != null && !c.getSecondValue().equals("")) {
						elmCase.addAttribute(new Attribute("SecondValue", c.getSecondValue()));
					}
					elmCase.addAttribute(new Attribute("Datatype", datatypes.findOne(c.getDatatype()).getLabel()));
					elmMapping.appendChild(elmCase);
				}

				elmDynamicMapping.appendChild(elmMapping);
			}
			elmSegment.appendChild(elmDynamicMapping);
		}

		Map<Integer, Field> fields = new HashMap<Integer, Field>();

		for (Field f : s.getFields()) {
			fields.put(f.getPosition(), f);
		}

		for (int i = 1; i < fields.size() + 1; i++) {
			Field f = fields.get(i);
			nu.xom.Element elmField = new nu.xom.Element("Field");
			elmField.addAttribute(new Attribute("Name", ExportUtil.str(f.getName())));
			elmField.addAttribute(new Attribute("Usage", ExportUtil.str(f.getUsage().toString())));
			elmField.addAttribute(
					new Attribute("Datatype", ExportUtil.str(datatypes.findOne(f.getDatatype().getId()).getLabel())));
			elmField.addAttribute(new Attribute("MinLength", "" + f.getMinLength()));
			if (f.getMaxLength() != null && !f.getMaxLength().equals(""))
				elmField.addAttribute(new Attribute("MaxLength", ExportUtil.str(f.getMaxLength())));
			if (f.getConfLength() != null && !f.getConfLength().equals(""))
				elmField.addAttribute(new Attribute("ConfLength", ExportUtil.str(f.getConfLength())));
			if (f.getTables() != null && f.getTables().size() > 0) {
				String bindingIdentifier = "";
				String bindingStrength = "";
				String bindingLocation = "";

				for (int k = 0; k < f.getTables().size(); k++) {
					TableLink tl = f.getTables().get(k);

					if (k == 0) {
						bindingIdentifier = tl.getBindingIdentifier();
					} else {
						bindingIdentifier = bindingIdentifier + ":" + tl.getBindingIdentifier();
					}
					bindingStrength = tl.getBindingStrength();
					bindingLocation = tl.getBindingLocation();

				}
				elmField.addAttribute(new Attribute("Binding", bindingIdentifier));
				if (bindingStrength != null && !bindingStrength.equals(""))
					elmField.addAttribute(new Attribute("BindingStrength", ExportUtil.str(bindingStrength)));
				if (bindingLocation != null && !bindingLocation.equals(""))
					elmField.addAttribute(new Attribute("BindingLocation", ExportUtil.str(bindingLocation)));
			}

			if (f.isHide())
				elmField.addAttribute(new Attribute("Hide", "true"));
			elmField.addAttribute(new Attribute("Min", "" + f.getMin()));
			elmField.addAttribute(new Attribute("Max", "" + f.getMax()));
			if (f.getItemNo() != null && !f.getItemNo().equals(""))
				elmField.addAttribute(new Attribute("ItemNo", ExportUtil.str(f.getItemNo())));
			elmSegment.appendChild(elmField);
		}

		return elmSegment;
	}

	private nu.xom.Element serializeDatatypeForValidation(Datatype d, Tables tables, Datatypes datatypes) {
		nu.xom.Element elmDatatype = new nu.xom.Element("Datatype");
		elmDatatype.addAttribute(new Attribute("ID", ExportUtil.str(d.getLabel())));
		elmDatatype.addAttribute(new Attribute("Name", ExportUtil.str(d.getName())));
		elmDatatype.addAttribute(new Attribute("Label", ExportUtil.str(d.getLabel())));
		elmDatatype.addAttribute(new Attribute("Description", ExportUtil.str(d.getDescription())));

		if (d.getComponents() != null) {

			Map<Integer, Component> components = new HashMap<Integer, Component>();

			for (Component c : d.getComponents()) {
				components.put(c.getPosition(), c);
			}

			for (int i = 1; i < components.size() + 1; i++) {
				Component c = components.get(i);
				nu.xom.Element elmComponent = new nu.xom.Element("Component");
				elmComponent.addAttribute(new Attribute("Name", ExportUtil.str(c.getName())));
				elmComponent.addAttribute(new Attribute("Usage", ExportUtil.str(c.getUsage().toString())));
				elmComponent.addAttribute(new Attribute("Datatype",
						ExportUtil.str(datatypes.findOne(c.getDatatype().getId()).getLabel())));
				elmComponent.addAttribute(new Attribute("MinLength", "" + c.getMinLength()));
				if (c.getMaxLength() != null && !c.getMaxLength().equals(""))
					elmComponent.addAttribute(new Attribute("MaxLength", ExportUtil.str(c.getMaxLength())));
				if (c.getConfLength() != null && !c.getConfLength().equals(""))
					elmComponent.addAttribute(new Attribute("ConfLength", ExportUtil.str(c.getConfLength())));
				if (c.getTables() != null && c.getTables().size() > 0) {
					String bindingIdentifier = "";
					String bindingStrength = "";
					String bindingLocation = "";

					for (int k = 0; k < c.getTables().size(); k++) {
						TableLink tl = c.getTables().get(k);

						if (k == 0) {
							bindingIdentifier = tl.getBindingIdentifier();
						} else {
							bindingIdentifier = bindingIdentifier + ":" + tl.getBindingIdentifier();
						}
						bindingStrength = tl.getBindingStrength();
						bindingLocation = tl.getBindingLocation();

					}
					elmComponent.addAttribute(new Attribute("Binding", bindingIdentifier));
					if (bindingStrength != null && !bindingStrength.equals(""))
						elmComponent.addAttribute(new Attribute("BindingStrength", ExportUtil.str(bindingStrength)));
					if (bindingLocation != null && !bindingLocation.equals(""))
						elmComponent.addAttribute(new Attribute("BindingLocation", ExportUtil.str(bindingLocation)));
				}
				if (c.isHide())
					elmComponent.addAttribute(new Attribute("Hide", "true"));

				elmDatatype.appendChild(elmComponent);
			}
		}
		return elmDatatype;
	}

	public nu.xom.Element serializeTableLibraryToElement(ProfilePreLib profile, IGDocument igdoc) {
		Tables tableLibrary = profile.getTables();
		nu.xom.Element elmTableLibrary = new nu.xom.Element("ValueSetLibrary");
		elmTableLibrary.addAttribute(new Attribute("ValueSetLibraryIdentifier", igdoc.getId()));

		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		DocumentMetaData metadata = igdoc.getMetaData();
		if (metadata == null) {
			elmMetaData.addAttribute(new Attribute("Name", "Vocab for " + "Profile"));
			elmMetaData.addAttribute(new Attribute("OrgName", "NIST"));
			elmMetaData.addAttribute(new Attribute("Version", "1.0.0"));
			elmMetaData.addAttribute(new Attribute("Date", ""));
		} else {
			elmMetaData.addAttribute(new Attribute("Name", !ExportUtil.str(metadata.getTitle()).equals("")
					? ExportUtil.str(metadata.getTitle()) : "No Title Info"));
			elmMetaData.addAttribute(new Attribute("OrgName", !ExportUtil.str(metadata.getOrgName()).equals("")
					? ExportUtil.str(metadata.getOrgName()) : "No Org Info"));
			elmMetaData.addAttribute(new Attribute("Version", !ExportUtil.str(metadata.getVersion()).equals("")
					? ExportUtil.str(metadata.getVersion()) : "No Version Info"));
			elmMetaData.addAttribute(new Attribute("Date", !ExportUtil.str(metadata.getDate()).equals("")
					? ExportUtil.str(metadata.getDate()) : "No Date Info"));

			if (profile.getMetaData().getSpecificationName() != null
					&& !profile.getMetaData().getSpecificationName().equals(""))
				elmMetaData.addAttribute(new Attribute("SpecificationName",
						ExportUtil.str(profile.getMetaData().getSpecificationName())));
			if (profile.getMetaData().getStatus() != null && !profile.getMetaData().getStatus().equals(""))
				elmMetaData.addAttribute(new Attribute("Status", ExportUtil.str(profile.getMetaData().getStatus())));
			if (profile.getMetaData().getTopics() != null && !profile.getMetaData().getTopics().equals(""))
				elmMetaData.addAttribute(new Attribute("Topics", ExportUtil.str(profile.getMetaData().getTopics())));
		}
		
		
		nu.xom.Element elmNoValidation = new nu.xom.Element("NoValidation");

		HashMap<String, nu.xom.Element> valueSetDefinitionsMap = new HashMap<String, nu.xom.Element>();

		for (Table t : tableLibrary.getChildren()) {

			if (t != null) {
				
				if(t.getCodes() == null || t.getCodes().size() == 0){
					nu.xom.Element elmBindingIdentifier = new nu.xom.Element("BindingIdentifier");
					elmBindingIdentifier.appendChild(t.getBindingIdentifier());
					elmNoValidation.appendChild(elmBindingIdentifier);
				}
				
				
				nu.xom.Element elmValueSetDefinition = new nu.xom.Element("ValueSetDefinition");
				elmValueSetDefinition
						.addAttribute(new Attribute("BindingIdentifier", ExportUtil.str(t.getBindingIdentifier())));
				elmValueSetDefinition.addAttribute(new Attribute("Name", ExportUtil.str(t.getName())));
				if (t.getDescription() != null && !t.getDescription().equals(""))
					elmValueSetDefinition
							.addAttribute(new Attribute("Description", ExportUtil.str(t.getDescription())));
				if (t.getVersion() != null && !t.getVersion().equals(""))
					elmValueSetDefinition.addAttribute(new Attribute("Version", ExportUtil.str(t.getVersion())));
				if (t.getOid() != null && !t.getOid().equals(""))
					elmValueSetDefinition.addAttribute(new Attribute("Oid", ExportUtil.str(t.getOid())));
				if (t.getStability() != null && !t.getStability().equals(""))
					elmValueSetDefinition
							.addAttribute(new Attribute("Stability", ExportUtil.str(t.getStability().value())));
				if (t.getExtensibility() != null && !t.getExtensibility().equals(""))
					elmValueSetDefinition
							.addAttribute(new Attribute("Extensibility", ExportUtil.str(t.getExtensibility().value())));
				if (t.getContentDefinition() != null && !t.getContentDefinition().equals(""))
					elmValueSetDefinition.addAttribute(
							new Attribute("ContentDefinition", ExportUtil.str(t.getContentDefinition().value())));

				nu.xom.Element elmValueSetDefinitions = null;
				if (t.getGroup() != null && !t.getGroup().equals("")) {
					elmValueSetDefinitions = valueSetDefinitionsMap.get(t.getGroup());
				} else {
					elmValueSetDefinitions = valueSetDefinitionsMap.get("NOGroup");
				}
				if (elmValueSetDefinitions == null) {
					elmValueSetDefinitions = new nu.xom.Element("ValueSetDefinitions");

					if (t.getGroup() != null && !t.getGroup().equals("")) {
						elmValueSetDefinitions.addAttribute(new Attribute("Group", t.getGroup()));
						elmValueSetDefinitions.addAttribute(new Attribute("Order", t.getOrder() + ""));
						valueSetDefinitionsMap.put(t.getGroup(), elmValueSetDefinitions);
					} else {
						elmValueSetDefinitions.addAttribute(new Attribute("Group", "NOGroup"));
						elmValueSetDefinitions.addAttribute(new Attribute("Order", "0"));
						valueSetDefinitionsMap.put("NOGroup", elmValueSetDefinitions);
					}

				}
				elmValueSetDefinitions.appendChild(elmValueSetDefinition);

				if (t.getCodes() != null) {
					for (Code c : t.getCodes()) {
						nu.xom.Element elmValueElement = new nu.xom.Element("ValueElement");
						elmValueElement.addAttribute(new Attribute("Value", ExportUtil.str(c.getValue())));
						elmValueElement.addAttribute(new Attribute("DisplayName", ExportUtil.str(c.getLabel() + "")));
						if (c.getCodeSystem() != null && !c.getCodeSystem().equals(""))
							elmValueElement
									.addAttribute(new Attribute("CodeSystem", ExportUtil.str(c.getCodeSystem())));
						if (c.getCodeSystemVersion() != null && !c.getCodeSystemVersion().equals(""))
							elmValueElement.addAttribute(
									new Attribute("CodeSystemVersion", ExportUtil.str(c.getCodeSystemVersion())));
						if (c.getCodeUsage() != null && !c.getCodeUsage().equals(""))
							elmValueElement.addAttribute(new Attribute("Usage", ExportUtil.str(c.getCodeUsage())));
						if (c.getComments() != null && !c.getComments().equals(""))
							elmValueElement.addAttribute(new Attribute("Comments", ExportUtil.str(c.getComments())));
						elmValueSetDefinition.appendChild(elmValueElement);
					}
				}
			}
		}

		elmTableLibrary.appendChild(elmMetaData);
		elmTableLibrary.appendChild(elmNoValidation);

		for (nu.xom.Element elmValueSetDefinitions : valueSetDefinitionsMap.values()) {
			elmTableLibrary.appendChild(elmValueSetDefinitions);
		}

		return elmTableLibrary;
	}

	public nu.xom.Document serializeConstraintsToDoc(ProfilePreLib profile, IGDocument igdoc) {
		Constraints predicates = findAllPredicates(profile);
		Constraints conformanceStatements = findAllConformanceStatement(profile);
		nu.xom.Element e = new nu.xom.Element("ConformanceContext");
		e.addAttribute(new Attribute("UUID", igdoc.getId()));

		DocumentMetaData metadata = igdoc.getMetaData();
		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		if (metadata == null) {
			elmMetaData.addAttribute(new Attribute("Name", "Constraints for " + "Profile"));
			elmMetaData.addAttribute(new Attribute("OrgName", "NIST"));
			elmMetaData.addAttribute(new Attribute("Version", "1.0.0"));
			elmMetaData.addAttribute(new Attribute("Date", ""));
		} else {
			elmMetaData.addAttribute(new Attribute("Name", !ExportUtil.str(metadata.getTitle()).equals("")
					? ExportUtil.str(metadata.getTitle()) : "No Title Info"));
			elmMetaData.addAttribute(new Attribute("OrgName", !ExportUtil.str(metadata.getOrgName()).equals("")
					? ExportUtil.str(metadata.getOrgName()) : "No Org Info"));
			elmMetaData.addAttribute(new Attribute("Version", !ExportUtil.str(metadata.getVersion()).equals("")
					? ExportUtil.str(metadata.getVersion()) : "No Version Info"));
			elmMetaData.addAttribute(new Attribute("Date", !ExportUtil.str(metadata.getDate()).equals("")
					? ExportUtil.str(metadata.getDate()) : "No Date Info"));

			if (profile.getMetaData().getSpecificationName() != null
					&& !profile.getMetaData().getSpecificationName().equals(""))
				elmMetaData.addAttribute(new Attribute("SpecificationName",
						ExportUtil.str(profile.getMetaData().getSpecificationName())));
			if (profile.getMetaData().getStatus() != null && !profile.getMetaData().getStatus().equals(""))
				elmMetaData.addAttribute(new Attribute("Status", ExportUtil.str(profile.getMetaData().getStatus())));
			if (profile.getMetaData().getTopics() != null && !profile.getMetaData().getTopics().equals(""))
				elmMetaData.addAttribute(new Attribute("Topics", ExportUtil.str(profile.getMetaData().getTopics())));
		}
		e.appendChild(elmMetaData);

		this.serializeMain(e, predicates, conformanceStatements);

		this.serializeCoConstaint(e, profile);

		return new nu.xom.Document(e);
	}

	private Constraints findAllPredicates(ProfilePreLib profile) {
		Constraints constraints = new Constraints();
		Context dtContext = new Context();
		Context sContext = new Context();
		Context mContext = new Context();

		Set<ByNameOrByID> byNameOrByIDs = new HashSet<ByNameOrByID>();
		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Message m : profile.getMessages().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(m.getMessageID());
			if (m.getPredicates().size() > 0) {
				byID.setPredicates(m.getPredicates());
				byNameOrByIDs.add(byID);
			}
		}
		mContext.setByNameOrByIDs(byNameOrByIDs);

		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Segment s : profile.getSegments().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(s.getLabel());
			if (s.getPredicates().size() > 0) {
				byID.setPredicates(s.getPredicates());
				byNameOrByIDs.add(byID);
			}
		}
		sContext.setByNameOrByIDs(byNameOrByIDs);

		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Datatype d : profile.getDatatypes().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(d.getLabel());
			if (d.getPredicates().size() > 0) {
				byID.setPredicates(d.getPredicates());
				byNameOrByIDs.add(byID);
			}
		}
		dtContext.setByNameOrByIDs(byNameOrByIDs);

		constraints.setDatatypes(dtContext);
		constraints.setSegments(sContext);
		constraints.setMessages(mContext);
		return constraints;
	}

	private Constraints findAllConformanceStatement(ProfilePreLib profile) {
		Constraints constraints = new Constraints();
		Context dtContext = new Context();
		Context sContext = new Context();
		Context mContext = new Context();

		Set<ByNameOrByID> byNameOrByIDs = new HashSet<ByNameOrByID>();

		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Message m : profile.getMessages().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(m.getMessageID());
			if (m.getConformanceStatements().size() > 0) {
				byID.setConformanceStatements(m.getConformanceStatements());
				byNameOrByIDs.add(byID);
			}
		}
		mContext.setByNameOrByIDs(byNameOrByIDs);

		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Segment s : profile.getSegments().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(s.getLabel());
			if (s.getConformanceStatements().size() > 0) {
				byID.setConformanceStatements(s.getConformanceStatements());
				byNameOrByIDs.add(byID);
			}
		}
		sContext.setByNameOrByIDs(byNameOrByIDs);

		byNameOrByIDs = new HashSet<ByNameOrByID>();
		for (Datatype d : profile.getDatatypes().getChildren()) {
			ByID byID = new ByID();
			byID.setByID(d.getLabel());
			if (d.getConformanceStatements().size() > 0) {
				byID.setConformanceStatements(d.getConformanceStatements());
				byNameOrByIDs.add(byID);
			}
		}
		dtContext.setByNameOrByIDs(byNameOrByIDs);

		constraints.setDatatypes(dtContext);
		constraints.setSegments(sContext);
		// constraints.setGroups(gContext);
		constraints.setMessages(mContext);
		return constraints;
	}

	private nu.xom.Element serializeMain(nu.xom.Element e, Constraints predicates, Constraints conformanceStatements) {
		nu.xom.Element predicates_Elm = new nu.xom.Element("Predicates");

		nu.xom.Element predicates_dataType_Elm = new nu.xom.Element("Datatype");
		for (ByNameOrByID byNameOrByIDObj : predicates.getDatatypes().getByNameOrByIDs()) {
			nu.xom.Element dataTypeConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (dataTypeConstaint != null)
				predicates_dataType_Elm.appendChild(dataTypeConstaint);
		}
		predicates_Elm.appendChild(predicates_dataType_Elm);

		nu.xom.Element predicates_segment_Elm = new nu.xom.Element("Segment");
		for (ByNameOrByID byNameOrByIDObj : predicates.getSegments().getByNameOrByIDs()) {
			nu.xom.Element segmentConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (segmentConstaint != null)
				predicates_segment_Elm.appendChild(segmentConstaint);
		}
		predicates_Elm.appendChild(predicates_segment_Elm);

		nu.xom.Element predicates_message_Elm = new nu.xom.Element("Message");
		for (ByNameOrByID byNameOrByIDObj : predicates.getMessages().getByNameOrByIDs()) {
			nu.xom.Element messageConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (messageConstaint != null)
				predicates_message_Elm.appendChild(messageConstaint);
		}
		predicates_Elm.appendChild(predicates_message_Elm);

		e.appendChild(predicates_Elm);

		nu.xom.Element constraints_Elm = new nu.xom.Element("Constraints");

		nu.xom.Element constraints_dataType_Elm = new nu.xom.Element("Datatype");
		for (ByNameOrByID byNameOrByIDObj : conformanceStatements.getDatatypes().getByNameOrByIDs()) {
			nu.xom.Element dataTypeConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (dataTypeConstaint != null)
				constraints_dataType_Elm.appendChild(dataTypeConstaint);
		}
		constraints_Elm.appendChild(constraints_dataType_Elm);

		nu.xom.Element constraints_segment_Elm = new nu.xom.Element("Segment");
		for (ByNameOrByID byNameOrByIDObj : conformanceStatements.getSegments().getByNameOrByIDs()) {
			nu.xom.Element segmentConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (segmentConstaint != null)
				constraints_segment_Elm.appendChild(segmentConstaint);
		}
		constraints_Elm.appendChild(constraints_segment_Elm);

		nu.xom.Element constraints_message_Elm = new nu.xom.Element("Message");
		for (ByNameOrByID byNameOrByIDObj : conformanceStatements.getMessages().getByNameOrByIDs()) {
			nu.xom.Element messageConstaint = this.serializeByNameOrByID(byNameOrByIDObj);
			if (messageConstaint != null)
				constraints_message_Elm.appendChild(messageConstaint);
		}
		constraints_Elm.appendChild(constraints_message_Elm);
		e.appendChild(constraints_Elm);

		return e;
	}

	private nu.xom.Element serializeByNameOrByID(ByNameOrByID byNameOrByIDObj) {
		if (byNameOrByIDObj instanceof ByName) {
			ByName byNameObj = (ByName) byNameOrByIDObj;
			nu.xom.Element elmByName = new nu.xom.Element("ByName");
			elmByName.addAttribute(new Attribute("Name", byNameObj.getByName()));

			for (Constraint c : byNameObj.getPredicates()) {
				nu.xom.Element elmConstaint = this.serializeConstaint(c, "Predicate");
				if (elmConstaint != null)
					elmByName.appendChild(elmConstaint);
			}

			for (Constraint c : byNameObj.getConformanceStatements()) {
				nu.xom.Element elmConstaint = this.serializeConstaint(c, "Constraint");
				if (elmConstaint != null)
					elmByName.appendChild(elmConstaint);
			}

			return elmByName;
		} else if (byNameOrByIDObj instanceof ByID) {
			ByID byIDObj = (ByID) byNameOrByIDObj;
			nu.xom.Element elmByID = new nu.xom.Element("ByID");
			elmByID.addAttribute(new Attribute("ID", byIDObj.getByID()));

			for (Constraint c : byIDObj.getConformanceStatements()) {
				nu.xom.Element elmConstaint = this.serializeConstaint(c, "Constraint");
				if (elmConstaint != null)
					elmByID.appendChild(elmConstaint);
			}

			for (Constraint c : byIDObj.getPredicates()) {
				nu.xom.Element elmConstaint = this.serializeConstaint(c, "Predicate");
				if (elmConstaint != null)
					elmByID.appendChild(elmConstaint);
			}

			return elmByID;
		}

		return null;
	}

	private nu.xom.Element serializeConstaint(Constraint c, String type) {
		nu.xom.Element elmConstraint = new nu.xom.Element(type);

		if (c.getConstraintId() != null) {
			elmConstraint.addAttribute(new Attribute("ID", c.getConstraintId()));
		}

		if (c.getConstraintTarget() != null && !c.getConstraintTarget().equals(""))
			elmConstraint.addAttribute(new Attribute("Target", c.getConstraintTarget()));

		if (c instanceof Predicate) {
			Predicate pred = (Predicate) c;
			if (pred.getTrueUsage() != null)
				elmConstraint.addAttribute(new Attribute("TrueUsage", pred.getTrueUsage().value()));
			if (pred.getFalseUsage() != null)
				elmConstraint.addAttribute(new Attribute("FalseUsage", pred.getFalseUsage().value()));
		}

		if (c.getReference() != null) {
			Reference referenceObj = c.getReference();
			nu.xom.Element elmReference = new nu.xom.Element("Reference");
			if (referenceObj.getChapter() != null && !referenceObj.getChapter().equals(""))
				elmReference.addAttribute(new Attribute("Chapter", referenceObj.getChapter()));
			if (referenceObj.getSection() != null && !referenceObj.getSection().equals(""))
				elmReference.addAttribute(new Attribute("Section", referenceObj.getSection()));
			if (referenceObj.getPage() == 0)
				elmReference.addAttribute(new Attribute("Page", "" + referenceObj.getPage()));
			if (referenceObj.getUrl() != null && !referenceObj.getUrl().equals(""))
				elmReference.addAttribute(new Attribute("URL", referenceObj.getUrl()));
			elmConstraint.appendChild(elmReference);
		}
		nu.xom.Element elmDescription = new nu.xom.Element("Description");
		elmDescription.appendChild(c.getDescription());
		elmConstraint.appendChild(elmDescription);

		nu.xom.Node n = this.innerXMLHandler(c.getAssertion());
		if (n != null)
			elmConstraint.appendChild(n);

		return elmConstraint;
	}

	private nu.xom.Node innerXMLHandler(String xml) {
		if (xml != null) {
			Builder builder = new Builder(new NodeFactory());
			try {
				nu.xom.Document doc = builder.build(xml, null);
				return doc.getRootElement().copy();
			} catch (ValidityException e) {
				e.printStackTrace();
			} catch (ParsingException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return null;
	}

	private void serializeCoConstaint(nu.xom.Element e, ProfilePreLib profile) {
		nu.xom.Element coConstraints_Elm = new nu.xom.Element("CoConstraints");

		nu.xom.Element coConstraints_segment_Elm = new nu.xom.Element("Segment");
		for (Segment s : profile.getSegments().getChildren()) {
			if (s.getCoConstraints() != null) {
				if (s.getCoConstraints().getColumnList() != null && s.getCoConstraints().getColumnList().size() > 1) {
					nu.xom.Element byID_Elm = new nu.xom.Element("ByID");
					byID_Elm.addAttribute(new Attribute("ID", s.getLabel()));

					for (CoConstraint cc : s.getCoConstraints().getConstraints()) {
						nu.xom.Element coConstraint_Elm = new nu.xom.Element("CoConstraint");

						nu.xom.Element elmDescription = new nu.xom.Element("Description");
						elmDescription.appendChild(cc.getDescription());
						coConstraint_Elm.appendChild(elmDescription);

						nu.xom.Element elmCommnets = new nu.xom.Element("Comments");
						elmCommnets.appendChild(cc.getComments());
						coConstraint_Elm.appendChild(elmCommnets);

						nu.xom.Element elmAssertion = new nu.xom.Element("Assertion");

						nu.xom.Element elmPlainCoConstraint = new nu.xom.Element("PlainCoConstraint");

						elmPlainCoConstraint.addAttribute(new Attribute("KeuPath",
								s.getCoConstraints().getColumnList().get(0).getField().getPosition() + "[1]"));
						elmPlainCoConstraint.addAttribute(new Attribute("KeyValue", cc.getValues().get(0).getValue()));

						for (int i = 1; i < s.getCoConstraints().getColumnList().size(); i++) {
							String path = s.getCoConstraints().getColumnList().get(i).getField().getPosition() + "[1]";
							String type = s.getCoConstraints().getColumnList().get(i).getConstraintType();
							String value = cc.getValues()
									.get(s.getCoConstraints().getColumnList().get(i).getColumnPosition()).getValue();

							if (value != null && !value.equals("")) {
								if (type.equals("vs")) {
									nu.xom.Element elmValueSetCheck = new nu.xom.Element("ValueSet");
									elmValueSetCheck.addAttribute(new Attribute("Path", path));
									elmValueSetCheck.addAttribute(new Attribute("ValueSetID",
											profile.getTables().findOneTableById(value).getBindingIdentifier()));
									elmPlainCoConstraint.appendChild(elmValueSetCheck);
								} else {
									nu.xom.Element elmValueCheck = new nu.xom.Element("PlainText");
									elmValueCheck.addAttribute(new Attribute("Path", path));
									elmValueCheck.addAttribute(new Attribute("Text", value));
									elmPlainCoConstraint.appendChild(elmValueCheck);
								}

							}

						}
						elmAssertion.appendChild(elmPlainCoConstraint);
						coConstraint_Elm.appendChild(elmAssertion);
						byID_Elm.appendChild(coConstraint_Elm);
					}
					coConstraints_segment_Elm.appendChild(byID_Elm);
				}
			}
		}

		if (coConstraints_segment_Elm.getChildCount() > 0)
			coConstraints_Elm.appendChild(coConstraints_segment_Elm);
		if (coConstraints_Elm.getChildCount() > 0) e.appendChild(coConstraints_Elm);
	}
}
