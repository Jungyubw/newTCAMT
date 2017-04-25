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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Case;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Code;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Component;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DocumentMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Field;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Group;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Mapping;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Messages;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ProfileMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.TableLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ValueSetOrSingleCodeBinding;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByID;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByName;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.ByNameOrByID;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.CoConstraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Constraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Constraints;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Context;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Predicate;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Reference;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStroyEntry;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Datatypes;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segments;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Tables;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl.IGAMTDBConn;
import gov.nist.healthcare.tools.hl7.v2.xml.ExportTool;
import nu.xom.Attribute;
import nu.xom.Builder;
import nu.xom.NodeFactory;
import nu.xom.ParsingException;
import nu.xom.ValidityException;

public class ExportUtil {

	public static String str(String value) {
		return value != null ? value : "";
	}

	public InputStream exportTestPackageAsHtml(TestPlan tp, TestStoryConfigurationService testStoryConfigurationService)
			throws Exception {
		return IOUtils.toInputStream(this.genPackagePages(tp, testStoryConfigurationService), "UTF-8");
	}

	public InputStream exportCoverAsHtml(TestPlan tp) throws Exception {
		return IOUtils.toInputStream(this.genCoverPage(tp), "UTF-8");
	}

	private String genPackagePagesInsideGroup(TestPlan tp, TestCaseGroup group, String packageBodyHTML, String index,
			TestStoryConfigurationService testStoryConfigurationService) throws Exception {
		packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". " + group.getName()
				+ "</h2>" + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<span>" + group.getDescription() + "</span>"
				+ System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
		String testStoryConfigId = null;
		if (group.getTestStoryConfigId() != null) {
			testStoryConfigId = group.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestGroupConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
				this.generateTestStory(group.getTestStoryContent(), testStoryConfiguration, "plain", tp));
		packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

		for (int i = 0; i < group.getChildren().size(); i++) {
			TestCaseOrGroup child = group.getChildren().get(i);
			if (child instanceof TestCaseGroup) {
				packageBodyHTML = genPackagePagesInsideGroup(tp, (TestCaseGroup) child, packageBodyHTML,
						index + "." + (i + 1), testStoryConfigurationService);
			} else if (child instanceof TestCase) {
				packageBodyHTML = genPackagePagesForTestCase(tp, (TestCase) child, packageBodyHTML,
						index + "." + (i + 1), testStoryConfigurationService);

			}
		}

		return packageBodyHTML;
	}

	private String genPackagePagesForTestCase(TestPlan tp, TestCase tc, String packageBodyHTML, String index,
			TestStoryConfigurationService testStoryConfigurationService) throws Exception {
		packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". " + tc.getName()
				+ "</h2>" + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>"
				+ System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
		String testStoryConfigId = null;
		if (tc.getTestStoryConfigId() != null) {
			testStoryConfigId = tc.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestCaseConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
				this.generateTestStory(tc.getTestStoryContent(), testStoryConfiguration, "plain", tp));
		packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

		for (int i = 0; i < tc.getTeststeps().size(); i++) {
			TestStep child = tc.getTeststeps().get(i);
			packageBodyHTML = genPackagePagesForTestStep(tp, child, packageBodyHTML, index + "." + (i + 1),
					testStoryConfigurationService);
		}

		return packageBodyHTML;
	}

	private String genPackagePagesForTestStep(TestPlan tp, TestStep ts, String packageBodyHTML, String index,
			TestStoryConfigurationService testStoryConfigurationService) throws Exception {
		ClassLoader classLoader = getClass().getClassLoader();
		packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". " + ts.getName()
				+ "</h2>" + System.getProperty("line.separator");
		if (tp.getType() != null && tp.getType().equals("Isolated")) {
			packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>"
					+ System.getProperty("line.separator");
		}
		packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>"
				+ System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");

		String testStoryConfigId = null;
		if (ts.getTestStoryConfigId() != null) {
			testStoryConfigId = ts.getTestStoryConfigId();
		} else {
			if (ts.isManualTS()) {
				testStoryConfigId = tp.getGlobalManualTestStepConfigId();
			} else {
				testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
			}
		}
		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}
		packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
				this.generateTestStory(ts.getTestStoryContent(), testStoryConfiguration, "plain", tp));

		if (ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null) {
			if (ts.getMessageContentsXMLCode() != null && !ts.getMessageContentsXMLCode().equals("")) {
				String mcXSL = IOUtils
						.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
						.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
								"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
				InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
				InputStream sourceInputStream = new ByteArrayInputStream(ts.getMessageContentsXMLCode().getBytes());
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
							.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl"))
							.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
									"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
					InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
					InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
					Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
					Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
					String xsltStr = IOUtils.toString(xsltReader);
					String sourceStr = IOUtils.toString(sourceReader);

					String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
					packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>"
							+ System.getProperty("line.separator");
					packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(testDataSpecificationHTMLStr);
				}

				if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
					String jdXSL = IOUtils
							.toString(classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
					InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
					InputStream sourceInputStream = new ByteArrayInputStream(ts.getNistXMLCode().getBytes());
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
		return packageBodyHTML;
	}

	private String genPackagePages(TestPlan tp, TestStoryConfigurationService testStoryConfigurationService)
			throws Exception {
		ClassLoader classLoader = getClass().getClassLoader();

		String packageBodyHTML = "";
		packageBodyHTML = packageBodyHTML + "<h1>" + tp.getName() + "</h1>" + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + tp.getDescription() + System.getProperty("line.separator");
		packageBodyHTML = packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
		String testStoryConfigId = null;
		if (tp.getTestStoryConfigId() != null) {
			testStoryConfigId = tp.getTestStoryConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
				this.generateTestStory(tp.getTestStoryContent(), testStoryConfiguration, "plain", tp));
		packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

		for (int i = 0; i < tp.getChildren().size(); i++) {
			TestCaseOrGroup child = tp.getChildren().get(i);
			if (child instanceof TestCaseGroup) {
				packageBodyHTML = genPackagePagesInsideGroup(tp, (TestCaseGroup) child, packageBodyHTML, "" + (i + 1),
						testStoryConfigurationService);
			} else if (child instanceof TestCase) {
				packageBodyHTML = genPackagePagesForTestCase(tp, (TestCase) child, packageBodyHTML, "" + (i + 1),
						testStoryConfigurationService);
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

	private String generateTestStory(HashMap<String, String> testStoryContent,
			TestStoryConfiguration testStoryConfiguration, String option, TestPlan tp) throws Exception {
		ClassLoader classLoader = getClass().getClassLoader();

		if (option.equals("ng-tab-html")) {
			String testStoryStr = IOUtils
					.toString(classLoader.getResourceAsStream("rb" + File.separator + "ng-tab-html-TestStory.html"));

			HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
			for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
				testStroyEntryMap.put(tse.getPosition(), tse);
			}
			String fullStory = "";
			String tabStory = "";

			for (int i = 0; i < testStroyEntryMap.size(); i++) {
				TestStroyEntry tse = testStroyEntryMap.get(i + 1);

				if (tse.isPresent()) {
					String title = tse.getTitle();
					String content = testStoryContent.get(tse.getId());

					if (tp.isEmptyStoryContentIgnored()) {
						if (content != null && !"".equals(content)) {
							fullStory = fullStory + "<div class=\"panel-body\"><table><tr><th>" + title
									+ "</th></tr><tr><td>" + content + "</td></tr></table></div><br/>";
							tabStory = tabStory + "<tab heading=\"" + title + "\" vertical=\"false\">"
									+ "<div class=\"panel-body\"><table><tr><th>" + title + "</th></tr><tr><td>"
									+ content + "</td></tr></table></div></tab>";
						}
					} else {
						fullStory = fullStory + "<div class=\"panel-body\"><table><tr><th>" + title
								+ "</th></tr><tr><td>" + content + "</td></tr></table></div><br/>";
						tabStory = tabStory + "<tab heading=\"" + title + "\" vertical=\"false\">"
								+ "<div class=\"panel-body\"><table><tr><th>" + title + "</th></tr><tr><td>" + content
								+ "</td></tr></table></div></tab>";
					}

				}
			}

			return testStoryStr.replace("?FullStory?", fullStory).replace("?TABStory?", tabStory);

		} else {
			String testStoryStr = IOUtils
					.toString(classLoader.getResourceAsStream("rb" + File.separator + "PlainTestStory.html"));

			HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
			for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
				testStroyEntryMap.put(tse.getPosition(), tse);
			}
			String storyContent = "";

			for (int i = 0; i < testStroyEntryMap.size(); i++) {
				TestStroyEntry tse = testStroyEntryMap.get(i + 1);

				if (tse.isPresent()) {
					String title = tse.getTitle();
					String content = testStoryContent.get(tse.getId());

					if (tp.isEmptyStoryContentIgnored()) {
						if (content != null && !"".equals(content))
							storyContent = storyContent + "<table><tr><th>" + title + "</th></tr><tr><td>" + content
									+ "</td></tr></table><br/>";
					} else {
						storyContent = storyContent + "<table><tr><th>" + title + "</th></tr><tr><td>" + content
								+ "</td></tr></table><br/>";
					}

				}
			}

			return testStoryStr.replace("?TestStoryContents?", storyContent);

		}
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

	public InputStream exportResourceBundleAsZip(TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) throws Exception {
		ByteArrayOutputStream outputStream = null;
		byte[] bytes;
		outputStream = new ByteArrayOutputStream();
		ZipOutputStream out = new ZipOutputStream(outputStream);

		this.generateTestPlanSummary(out, tp, testStoryConfigurationService);
		this.generateTestPlanRB(out, tp, testStoryConfigurationService);

		out.close();
		bytes = outputStream.toByteArray();
		return new ByteArrayInputStream(bytes);
	}

	private void generateTestPlanRBTestGroup(ZipOutputStream out, TestCaseGroup group, String path, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService, int index) throws Exception {
		String groupPath = "";
		if (path == null) {
			groupPath = tp.getId() + File.separator + "TestGroup_" + index;
		} else {
			groupPath = path + File.separator + "TestGroup_" + index;
		}
		this.generateTestGroupJsonRB(out, group, groupPath, index);

		String testStoryConfigId = null;
		if (group.getTestStoryConfigId() != null) {
			testStoryConfigId = group.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestGroupConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		this.generateTestStoryRB(out, group.getTestStoryContent(), testStoryConfiguration, groupPath, tp,
				"ng-tab-html");
		this.generateTestStoryRB(out, group.getTestStoryContent(), testStoryConfiguration, groupPath, tp, "plain");

		for (int i = 0; i < group.getChildren().size(); i++) {
			TestCaseOrGroup child = group.getChildren().get(i);
			if (child instanceof TestCaseGroup) {
				generateTestPlanRBTestGroup(out, (TestCaseGroup) child, groupPath, tp, testStoryConfigurationService,
						i + 1);
			} else if (child instanceof TestCase) {
				generateTestPlanRBTestCase(out, (TestCase) child, groupPath, tp, testStoryConfigurationService, i + 1);
			}
		}
	}

	private void generateTestPlanRBTestCase(ZipOutputStream out, TestCase tc, String path, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService, int index) throws Exception {
		String tcPath = "";
		if (path == null) {
			tcPath = tp.getId() + File.separator + "TestCase_" + index;
		} else {
			tcPath = path + File.separator + "TestCase_" + index;
		}
		this.generateTestCaseJsonRB(out, tc, tcPath, index);

		String testStoryConfigId = null;
		if (tc.getTestStoryConfigId() != null) {
			testStoryConfigId = tc.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestCaseConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		this.generateTestStoryRB(out, tc.getTestStoryContent(), testStoryConfiguration, tcPath, tp, "ng-tab-html");
		this.generateTestStoryRB(out, tc.getTestStoryContent(), testStoryConfiguration, tcPath, tp, "plain");

		for (int i = 0; i < tc.getTeststeps().size(); i++) {
			TestStep child = tc.getTeststeps().get(i);
			generateTestPlanRBTestStep(out, child, tcPath, tp, testStoryConfigurationService, i + 1);
		}
	}

	private void generateTestPlanRBTestStep(ZipOutputStream out, TestStep ts, String path, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService, int index) throws Exception {
		String stepPath = path + File.separator + "TestStep_" + index;

		String testStoryConfigId = null;
		if (ts.getTestStoryConfigId() != null) {
			testStoryConfigId = ts.getTestStoryConfigId();
		} else {
			if (ts.isManualTS()) {
				testStoryConfigId = tp.getGlobalManualTestStepConfigId();
			} else {
				testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
			}
		}
		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		this.generateTestStoryRB(out, ts.getTestStoryContent(), testStoryConfiguration, stepPath, tp, "ng-tab-html");
		this.generateTestStoryRB(out, ts.getTestStoryContent(), testStoryConfiguration, stepPath, tp, "plain");

		this.generateTestStepJsonRB(out, ts, tp, stepPath, index);

		if (ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")) {
			this.generateEr7Message(out, ts.getEr7Message(), stepPath);
			this.generateMessageContent(out, ts.getMessageContentsXMLCode(), stepPath, "ng-tab-html");
			this.generateMessageContent(out, ts.getMessageContentsXMLCode(), stepPath, "plain");
			this.generateConstraintsXML(out, ts.getConstraintsXML(), stepPath);

			if (ts.getNistXMLCode() != null && !ts.getNistXMLCode().equals("")) {
				if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
					this.generateTestDataSpecification(out, ts, stepPath, "ng-tab-html");
					this.generateTestDataSpecification(out, ts, stepPath, "plain");
				}

				if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
					this.generateJurorDocument(out, ts, stepPath, "ng-tab-html");
					this.generateJurorDocument(out, ts, stepPath, "plain");
				}
			}
		}

	}

	private void generateTestPlanRB(ZipOutputStream out, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) throws Exception {
		this.generateTestPlanJsonRB(out, tp, 1);

		String testStoryConfigId = null;
		if (tp.getTestStoryConfigId() != null) {
			testStoryConfigId = tp.getTestStoryConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}
		this.generateTestStoryRB(out, tp.getTestStoryContent(), testStoryConfiguration, null, tp, "ng-tab-html");
		this.generateTestStoryRB(out, tp.getTestStoryContent(), testStoryConfiguration, null, tp, "plain");

		for (int i = 0; i < tp.getChildren().size(); i++) {
			Object child = tp.getChildren().get(i);
			if (child instanceof TestCaseGroup) {
				generateTestPlanRBTestGroup(out, (TestCaseGroup) child, null, tp, testStoryConfigurationService, i + 1);
			} else if (child instanceof TestCase) {
				generateTestPlanRBTestCase(out, (TestCase) child, null, tp, testStoryConfigurationService, i + 1);
			}
		}
	}

	private void generateJurorDocument(ZipOutputStream out, TestStep ts, String teststepPath, String option)
			throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		InputStream is = classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl");
		String mcXSL = null;
		if (is != null) {
			byte[] buf = new byte[1024];

			if (option.equals("ng-tab-html")) {
				out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocument.html"));
				mcXSL = IOUtils.toString(is);
			} else {
				out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocumentPDF.html"));
				mcXSL = IOUtils.toString(is).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
						"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
			}

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

	private void generateTestDataSpecification(ZipOutputStream out, TestStep ts, String teststepPath, String option)
			throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		InputStream is = classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl");
		String mcXSL = null;
		if (is != null) {
			byte[] buf = new byte[1024];

			if (option.equals("ng-tab-html")) {
				out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestDataSpecification.html"));
				mcXSL = IOUtils.toString(is);
			} else {
				out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestDataSpecificationPDF.html"));
				mcXSL = IOUtils.toString(is).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
						"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
			}

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

	private void generateMessageContent(ZipOutputStream out, String messageContentsXMLCode, String teststepPath,
			String option) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		byte[] buf = new byte[1024];
		String mcXSL = null;
		if (option.equals("ng-tab-html")) {
			out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContent.html"));
			mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"));
		} else {
			out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContentPDF.html"));
			mcXSL = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
					.replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
							"<xsl:param name=\"output\" select=\"'plain-html'\"/>");
		}

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

	private void generateTestStepJsonRB(ZipOutputStream out, TestStep ts, TestPlan tp, String teststepPath, int index)
			throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestStep.json"));

		InputStream inTP = null;

		JSONObject obj = new JSONObject();
		obj.put("id", ts.getLongId());
		obj.put("name", ts.getName());
		obj.put("description", ts.getDescription());
		if(ts.getType() == null){
			if(tp.getType() != null && tp.getType().equals("Isolated")){
				obj.put("type", "SUT_INITIATOR");	
			}else {
				obj.put("type", "DATAINSTANCE");	
			}
		}else {
			if(ts.getType().equals("teststep")){
				if(tp.getType() != null && tp.getType().equals("Isolated")){
					obj.put("type", "SUT_INITIATOR");	
				}else {
					obj.put("type", "DATAINSTANCE");	
				}
			}else{
				obj.put("type", ts.getType());	
			}
				
		}
		
		obj.put("position", index);
		
		if(ts.getIntegrationProfileId() != null){
			
			JSONArray plist = new JSONArray();
			plist.put("soap");
			obj.put("protocols", plist);
	        
	        
		}

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

	private void generateTestStoryRB(ZipOutputStream out, HashMap<String, String> testStoryContent,
			TestStoryConfiguration testStoryConfiguration, String path, TestPlan tp, String option) throws Exception {
		byte[] buf = new byte[1024];
		if (path == null) {
			if (option.equals("ng-tab-html")) {
				out.putNextEntry(new ZipEntry(tp.getId() + File.separator + "TestStory.html"));
			} else {
				out.putNextEntry(new ZipEntry(tp.getId() + File.separator + "TestStoryPDF.html"));
			}
		} else {
			if (option.equals("ng-tab-html")) {
				out.putNextEntry(new ZipEntry(path + File.separator + "TestStory.html"));
			} else {
				out.putNextEntry(new ZipEntry(path + File.separator + "TestStoryPDF.html"));
			}
		}

		String testStoryStr = this.generateTestStory(testStoryContent, testStoryConfiguration, option, tp);
		InputStream inTestStory = IOUtils.toInputStream(testStoryStr, "UTF-8");
		int lenTestStory;
		while ((lenTestStory = inTestStory.read(buf)) > 0) {
			out.write(buf, 0, lenTestStory);
		}
		inTestStory.close();
		out.closeEntry();
	}

	private void generateTestCaseJsonRB(ZipOutputStream out, TestCase tc, String testcasePath, int index)
			throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(testcasePath + File.separator + "TestCase.json"));

		JSONObject obj = new JSONObject();
		obj.put("id", tc.getLongId());
		obj.put("name", tc.getName());
		obj.put("description", tc.getDescription());
		obj.put("position", index);
		obj.put("protocol", tc.getProtocol());

		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();
	}

	private void generateTestGroupJsonRB(ZipOutputStream out, TestCaseGroup tg, String groupPath, int index)
			throws IOException {
		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(groupPath + File.separator + "TestCaseGroup.json"));

		JSONObject obj = new JSONObject();
		obj.put("id", tg.getLongId());
		obj.put("name", tg.getName());
		obj.put("description", tg.getDescription());
		obj.put("position", index);

		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();
	}

	private void generateTestPlanJsonRB(ZipOutputStream out, TestPlan tp, int index) throws IOException {
		JSONObject obj = new JSONObject();
		obj.put("id", tp.getLongId());
		obj.put("name", tp.getName());
		obj.put("description", tp.getDescription());
		obj.put("position", index);
		obj.put("type", tp.getType());
		obj.put("transport", tp.isTransport());
		if(tp.getDomain() == null){
			obj.put("domain", "NoDomain");
		}else {
			obj.put("domain", tp.getDomain());			
		}
		obj.put("skip", false);

		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(tp.getId() + File.separator + "TestPlan.json"));
		InputStream inTP = IOUtils.toInputStream(obj.toString());
		int lenTP;
		while ((lenTP = inTP.read(buf)) > 0) {
			out.write(buf, 0, lenTP);
		}
		out.closeEntry();
		inTP.close();
	}

	private String generateTestPlanSummaryForTestGroup(String contentsHTML, TestCaseGroup group, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) {
		contentsHTML = contentsHTML + "<h2>Test Case Group: " + group.getName() + "</h2>"
				+ System.getProperty("line.separator");

		String testStoryConfigId = null;
		if (group.getTestStoryConfigId() != null) {
			testStoryConfigId = group.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestGroupConfigId();
		}
		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}
		HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
		for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
			testStroyEntryMap.put(tse.getPosition(), tse);
		}

		String summaryContent = "";

		for (int i = 0; i < testStroyEntryMap.size(); i++) {
			TestStroyEntry tse = testStroyEntryMap.get(i + 1);

			if (tse.isSummaryEntry()) {
				String title = tse.getTitle();
				String content = group.getTestStoryContent().get(tse.getId());

				if (tp.isEmptyStoryContentIgnored()) {
					if (content != null && !"".equals(content))
						summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				} else {
					summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				}
			}
		}

		if (!summaryContent.equals("")) {
			contentsHTML = contentsHTML + summaryContent + System.getProperty("line.separator");
		}

		contentsHTML = contentsHTML + group.getDescription() + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

		for (int i = 0; i < group.getChildren().size(); i++) {
			Object child = group.getChildren().get(i);

			if (child instanceof TestCaseGroup) {
				contentsHTML = generateTestPlanSummaryForTestGroup(contentsHTML, (TestCaseGroup) child, tp,
						testStoryConfigurationService);
			} else if (child instanceof TestCase) {
				contentsHTML = generateTestPlanSummaryForTestCase(contentsHTML, (TestCase) child, tp,
						testStoryConfigurationService);
			}
		}

		return contentsHTML;
	}

	private String generateTestPlanSummaryForTestCase(String contentsHTML, TestCase tc, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) {
		contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");

		contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<th>" + tc.getName() + "</th>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

		contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");

		String testStoryConfigId = null;
		if (tc.getTestStoryConfigId() != null) {
			testStoryConfigId = tc.getTestStoryConfigId();
		} else {
			testStoryConfigId = tp.getGlobalTestCaseConfigId();
		}

		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}

		HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
		for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
			testStroyEntryMap.put(tse.getPosition(), tse);
		}

		String summaryContent = "";

		for (int i = 0; i < testStroyEntryMap.size(); i++) {
			TestStroyEntry tse = testStroyEntryMap.get(i + 1);

			if (tse.isSummaryEntry()) {
				String title = tse.getTitle();
				String content = tc.getTestStoryContent().get(tse.getId());

				if (tp.isEmptyStoryContentIgnored()) {
					if (content != null && !"".equals(content))
						summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				} else {
					summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				}
			}
		}

		if (!summaryContent.equals("")) {
			contentsHTML = contentsHTML + "<td colspan='2'>" + summaryContent + "</td>"
					+ System.getProperty("line.separator");
		}
		contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

		contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<th colspan='2'>Test Steps</th>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

		for (int i = 0; i < tc.getTeststeps().size(); i++) {
			TestStep ts = tc.getTeststeps().get(i);
			contentsHTML = generateTestPlanSummaryForTestStep(contentsHTML, ts, tp, testStoryConfigurationService);

		}

		contentsHTML = contentsHTML + "</table>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

		return contentsHTML;
	}

	private String generateTestPlanSummaryForTestStep(String contentsHTML, TestStep ts, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) {
		contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
		contentsHTML = contentsHTML + "<th>" + ts.getName() + "</th>" + System.getProperty("line.separator");

		String testStoryConfigId = null;
		if (ts.getTestStoryConfigId() != null) {
			testStoryConfigId = ts.getTestStoryConfigId();
		} else {
			if (ts.isManualTS()) {
				testStoryConfigId = tp.getGlobalManualTestStepConfigId();
			} else {
				testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
			}
		}
		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}
		HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
		for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
			testStroyEntryMap.put(tse.getPosition(), tse);
		}

		String summaryContent = "";

		for (int i = 0; i < testStroyEntryMap.size(); i++) {
			TestStroyEntry tse = testStroyEntryMap.get(i + 1);

			if (tse.isSummaryEntry()) {
				String title = tse.getTitle();
				String content = ts.getTestStoryContent().get(tse.getId());

				if (tp.isEmptyStoryContentIgnored()) {
					if (content != null && !"".equals(content))
						summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				} else {
					summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				}
			}
		}

		if (!summaryContent.equals("")) {
			contentsHTML = contentsHTML + "<td>" + summaryContent + "</td>" + System.getProperty("line.separator");
		}

		contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

		return contentsHTML;
	}

	private void generateTestPlanSummary(ZipOutputStream out, TestPlan tp,
			TestStoryConfigurationService testStoryConfigurationService) throws IOException {
		ClassLoader classLoader = getClass().getClassLoader();
		String testPlanSummaryStr = IOUtils
				.toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPlanSummary.html"));
		testPlanSummaryStr = testPlanSummaryStr.replace("?TestPlanName?", tp.getName());

		String contentsHTML = "";

		String testStoryConfigId = null;
		if (tp.getTestStoryConfigId() != null) {
			testStoryConfigId = tp.getTestStoryConfigId();
		}
		TestStoryConfiguration testStoryConfiguration = null;
		if (testStoryConfigId != null) {
			testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
		}

		if (testStoryConfiguration == null) {
			testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
		}
		HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
		for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
			testStroyEntryMap.put(tse.getPosition(), tse);
		}

		String summaryContent = "";

		for (int i = 0; i < testStroyEntryMap.size(); i++) {
			TestStroyEntry tse = testStroyEntryMap.get(i + 1);

			if (tse.isSummaryEntry()) {
				String title = tse.getTitle();
				String content = tp.getTestStoryContent().get(tse.getId());
				if (tp.isEmptyStoryContentIgnored()) {
					if (content != null && !"".equals(content))
						summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				} else {
					summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
				}
			}
		}

		if (!summaryContent.equals("")) {
			contentsHTML = contentsHTML + summaryContent + System.getProperty("line.separator");
		}

		for (int i = 0; i < tp.getChildren().size(); i++) {
			Object child = tp.getChildren().get(i);
			if (child instanceof TestCaseGroup) {
				TestCaseGroup group = (TestCaseGroup) child;
				contentsHTML = generateTestPlanSummaryForTestGroup(contentsHTML, group, tp,
						testStoryConfigurationService);
			} else if (child instanceof TestCase) {
				TestCase tc = (TestCase) child;
				contentsHTML = generateTestPlanSummaryForTestCase(contentsHTML, tc, tp, testStoryConfigurationService);
			}
		}
		testPlanSummaryStr = testPlanSummaryStr.replace("?contentsHTML?", contentsHTML);

		byte[] buf = new byte[1024];
		out.putNextEntry(new ZipEntry(tp.getId() + File.separator + "TestPlanSummary.html"));
		InputStream inTestPlanSummary = IOUtils.toInputStream(testPlanSummaryStr);
		int lenTestPlanSummary;
		while ((lenTestPlanSummary = inTestPlanSummary.read(buf)) > 0) {
			out.write(buf, 0, lenTestPlanSummary);
		}
		out.closeEntry();
		inTestPlanSummary.close();
	}

	public InputStream exportProfileXMLZip(Set<String> keySet, ProfileService profileService) throws IOException {

		ByteArrayOutputStream outputStream = null;
		byte[] bytes;
		outputStream = new ByteArrayOutputStream();
		ZipOutputStream out = new ZipOutputStream(outputStream);

		for (String id : keySet) {
			if (id != null && !id.isEmpty()) {
				this.generateProfileXML(out, id, profileService);
			}
		}
		out.close();
		bytes = outputStream.toByteArray();
		return new ByteArrayInputStream(bytes);
	}

	public InputStream[] exportProfileXMLArrayZip(Set<String> keySet, ProfileService profileService) throws IOException {
		ByteArrayOutputStream outputStream0 = null;
		ByteArrayOutputStream outputStream1 = null;
		ByteArrayOutputStream outputStream2 = null;

		byte[] bytes0;
		byte[] bytes1;
		byte[] bytes2;

		outputStream0 = new ByteArrayOutputStream();
		outputStream1 = new ByteArrayOutputStream();
		outputStream2 = new ByteArrayOutputStream();

		ZipOutputStream out0 = new ZipOutputStream(outputStream0);
		ZipOutputStream out1 = new ZipOutputStream(outputStream1);
		ZipOutputStream out2 = new ZipOutputStream(outputStream2);

		for (String id : keySet) {
			if (id != null && !id.isEmpty()) {
				this.generateProfileXML(out0, out1, out2, id, profileService);
			}
		}
		out0.close();
		out1.close();
		out2.close();
		
		bytes0 = outputStream0.toByteArray();
		bytes1 = outputStream1.toByteArray();
		bytes2 = outputStream2.toByteArray();
		
		InputStream[] results = new InputStream[3];
		results[0] = new ByteArrayInputStream(bytes0);
		results[1] = new ByteArrayInputStream(bytes1);
		results[2] = new ByteArrayInputStream(bytes2);

		return results;
	}

	private void addDatatype(Datatype d, Map<String, Datatype> datatypesMap, IGAMTDBConn igamtDB) {
		if (d != null) {
			datatypesMap.put(d.getId(), d);
			for (Component c : d.getComponents()) {
				Datatype child = datatypesMap.get(c.getDatatype().getId());
				if(child == null) {
					child = igamtDB.findDatatypeById(c.getDatatype().getId());
					child.setExt(child.getExt() + "IGAMT");
				}
				this.addDatatype(child, datatypesMap, igamtDB);
			}
		}
	}

	private void visit(SegmentRefOrGroup seog, Map<String, Segment> segmentsMap, Map<String, Datatype> datatypesMap,
			Map<String, Table> tablesMap, gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile profile,
			IGAMTDBConn igamtDB) {
		if (seog instanceof SegmentRef) {
			SegmentRef sr = (SegmentRef) seog;
			Segment s = segmentsMap.get(sr.getRef().getId());

			if (s.getName().equals("OBX") || s.getName().equals("MFA") || s.getName().equals("MFE")) {
				String reference = null;
				String referenceTableId = null;

				if (s.getName().equals("OBX")) {
					reference = "2";
				}

				if (s.getName().equals("MFA")) {
					reference = "6";
				}

				if (s.getName().equals("MFE")) {
					reference = "5";
				}

				referenceTableId = this.findValueSetID(s.getValueSetBindings(), reference);

				if (referenceTableId != null) {
					Table table = tablesMap.get(referenceTableId);
					if (table != null) {
						for (Code c : table.getCodes()) {
							if (c.getValue() != null && table.getHl7Version() != null) {
								Datatype d = igamtDB.findByNameAndVesionAndScope(c.getValue(), table.getHl7Version(), "HL7STANDARD");
								if (d != null) {
									d.setExt(d.getExt() + "IGAMT");
									this.addDatatype(d, datatypesMap, igamtDB);
								}
							}
						}
					}
				}
			}

		} else {
			Group g = (Group) seog;
			for (SegmentRefOrGroup child : g.getChildren()) {
				this.visit(child, segmentsMap, datatypesMap, tablesMap, profile, igamtDB);
			}
		}
	}

	private String findValueSetID(List<ValueSetOrSingleCodeBinding> valueSetBindings, String referenceLocation) {
		for (ValueSetOrSingleCodeBinding vsb : valueSetBindings) {
			if (vsb.getLocation().equals(referenceLocation))
				return vsb.getTableId();
		}
		return null;
	}

	public String[] generateProfileXML(String id, ProfileService profileService) {
		Profile tcamtProfile = profileService.findOne(id);

		if (tcamtProfile != null) {
			IGAMTDBConn igamtDB = new IGAMTDBConn();
			gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile profile = new gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile();
			profile.setAccountId(tcamtProfile.getAccountId());
			profile.setMetaData(tcamtProfile.getMetaData());
			profile.setMessages(new Messages());
			DocumentMetaData metadata = new DocumentMetaData();
			Map<String, Segment> segmentsMap = new HashMap<String, Segment>();
			Map<String, Datatype> datatypesMap = new HashMap<String, Datatype>();
			Map<String, Table> tablesMap = new HashMap<String, Table>();

			for (Segment s : tcamtProfile.getSegments().getChildren()) {
				if (s != null) {
					segmentsMap.put(s.getId(), s);
				}
			}

			for (Datatype d : tcamtProfile.getDatatypes().getChildren()) {
				if (d != null) {
					datatypesMap.put(d.getId(), d);
				}

			}

			for (Table t : tcamtProfile.getTables().getChildren()) {
				if (t != null) {
					tablesMap.put(t.getId(), t);
				}

			}

			for (Message m : tcamtProfile.getMessages().getChildren()) {
				if (m.getMessageID() == null)
					m.setMessageID(UUID.randomUUID().toString());

				profile.getMessages().addMessage(m);

				for (SegmentRefOrGroup seog : m.getChildren()) {
					this.visit(seog, segmentsMap, datatypesMap, tablesMap, profile, igamtDB);
				}
			}

			String[] result = new String[3];
			result[0] = new ExportTool().serializeProfileToDoc(profile, metadata, segmentsMap, datatypesMap, tablesMap)
					.toXML();
			result[1] = new ExportTool().serializeTableXML(profile, metadata, tablesMap);
			result[2] = new ExportTool().serializeConstraintsXML(profile, metadata, segmentsMap, datatypesMap,
					tablesMap);

			return result;
		}

		return null;
	}

	private void generateProfileXML(ZipOutputStream out0, ZipOutputStream out1, ZipOutputStream out2, String id,
			ProfileService profileService) throws IOException {
		Profile tcamtProfile = profileService.findOne(id);

		if (tcamtProfile != null) {

			IGAMTDBConn igamtDB = new IGAMTDBConn();
			gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile profile = new gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile();
			profile.setId(tcamtProfile.getId());
			profile.setAccountId(tcamtProfile.getAccountId());
			profile.setMetaData(tcamtProfile.getMetaData());
			profile.setMessages(new Messages());
			DocumentMetaData metadata = new DocumentMetaData();
			Map<String, Segment> segmentsMap = new HashMap<String, Segment>();
			Map<String, Datatype> datatypesMap = new HashMap<String, Datatype>();
			Map<String, Table> tablesMap = new HashMap<String, Table>();

			for (Segment s : tcamtProfile.getSegments().getChildren()) {
				if (s != null)
					segmentsMap.put(s.getId(), s);
			}

			for (Datatype d : tcamtProfile.getDatatypes().getChildren()) {
				if (d != null)
					datatypesMap.put(d.getId(), d);
			}

			for (Table t : tcamtProfile.getTables().getChildren()) {
				if (t != null) {
					tablesMap.put(t.getId(), t);
				}
			}

			for (Message m : tcamtProfile.getMessages().getChildren()) {
				if (m.getMessageID() == null)
					m.setMessageID(UUID.randomUUID().toString());

				profile.getMessages().addMessage(m);

				for (SegmentRefOrGroup seog : m.getChildren()) {
					this.visit(seog, segmentsMap, datatypesMap, tablesMap, profile, igamtDB);
				}
			}

			byte[] buf = new byte[1024];
			out0.putNextEntry(new ZipEntry("Profile.xml"));
			InputStream inTP = null;
			inTP = IOUtils.toInputStream(new ExportTool()
					.serializeProfileToDoc(profile, metadata, segmentsMap, datatypesMap, tablesMap).toXML());
			int lenTP;
			while ((lenTP = inTP.read(buf)) > 0) {
				out0.write(buf, 0, lenTP);
			}
			out0.closeEntry();
			inTP.close();

			out1.putNextEntry(new ZipEntry("ValueSet.xml"));
			inTP = null;
			inTP = IOUtils.toInputStream(new ExportTool().serializeTableXML(profile, metadata, tablesMap));
			lenTP = 0;
			while ((lenTP = inTP.read(buf)) > 0) {
				out1.write(buf, 0, lenTP);
			}
			out1.closeEntry();
			inTP.close();

			out2.putNextEntry(new ZipEntry("Constraints.xml"));
			inTP = null;
			inTP = IOUtils.toInputStream(
					new ExportTool().serializeConstraintsXML(profile, metadata, segmentsMap, datatypesMap, tablesMap));
			lenTP = 0;
			while ((lenTP = inTP.read(buf)) > 0) {
				out2.write(buf, 0, lenTP);
			}
			out2.closeEntry();
			inTP.close();
		}

	}

	private void generateProfileXML(ZipOutputStream out, String id, ProfileService profileService) throws IOException {
		Profile tcamtProfile = profileService.findOne(id);

		if (tcamtProfile != null) {

			IGAMTDBConn igamtDB = new IGAMTDBConn();
			gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile profile = new gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile();
			profile.setId(id);
			profile.setAccountId(tcamtProfile.getAccountId());
			profile.setMetaData(tcamtProfile.getMetaData());
			profile.setMessages(new Messages());
			DocumentMetaData metadata = new DocumentMetaData();
			Map<String, Segment> segmentsMap = new HashMap<String, Segment>();
			Map<String, Datatype> datatypesMap = new HashMap<String, Datatype>();
			Map<String, Table> tablesMap = new HashMap<String, Table>();

			for (Segment s : tcamtProfile.getSegments().getChildren()) {
				if (s != null)
					segmentsMap.put(s.getId(), s);
			}

			for (Datatype d : tcamtProfile.getDatatypes().getChildren()) {
				if (d != null)
					datatypesMap.put(d.getId(), d);
			}

			for (Table t : tcamtProfile.getTables().getChildren()) {
				if (t != null) {
					tablesMap.put(t.getId(), t);
				}
			}

			for (Message m : tcamtProfile.getMessages().getChildren()) {
				if (m.getMessageID() == null)
					m.setMessageID(UUID.randomUUID().toString());

				profile.getMessages().addMessage(m);

				for (SegmentRefOrGroup seog : m.getChildren()) {
					this.visit(seog, segmentsMap, datatypesMap, tablesMap, profile, igamtDB);
				}
			}

			byte[] buf = new byte[1024];
			out.putNextEntry(
					new ZipEntry("Global" + File.separator + "Profiles" + File.separator + id + "_Profile.xml"));
			InputStream inTP = null;
			inTP = IOUtils.toInputStream(new ExportTool()
					.serializeProfileToDoc(profile, metadata, segmentsMap, datatypesMap, tablesMap).toXML());
			int lenTP;
			while ((lenTP = inTP.read(buf)) > 0) {
				out.write(buf, 0, lenTP);
			}
			out.closeEntry();
			inTP.close();

			out.putNextEntry(
					new ZipEntry("Global" + File.separator + "Tables" + File.separator + id + "_ValueSet.xml"));
			inTP = null;
			inTP = IOUtils.toInputStream(new ExportTool().serializeTableXML(profile, metadata, tablesMap));
			lenTP = 0;
			while ((lenTP = inTP.read(buf)) > 0) {
				out.write(buf, 0, lenTP);
			}
			out.closeEntry();
			inTP.close();

			out.putNextEntry(
					new ZipEntry("Global" + File.separator + "Constraints" + File.separator + id + "_Constraints.xml"));
			inTP = null;
			inTP = IOUtils.toInputStream(
					new ExportTool().serializeConstraintsXML(profile, metadata, segmentsMap, datatypesMap, tablesMap));
			lenTP = 0;
			while ((lenTP = inTP.read(buf)) > 0) {
				out.write(buf, 0, lenTP);
			}
			out.closeEntry();
			inTP.close();
		}

	}

	public nu.xom.Document serializeProfileToDoc(Profile profile) {
		nu.xom.Element e = new nu.xom.Element("ConformanceProfile");
		Attribute schemaLocation = new Attribute("xsi:noNamespaceSchemaLocation",
				"http://www.w3.org/2001/XMLSchema-instance",
				"https://raw.githubusercontent.com/Jungyubw/NIST_healthcare_hl7_v2_profile_schema/master/Schema/NIST%20Validation%20Schema/Profile.xsd");
		e.addAttribute(schemaLocation);

		this.serializeProfileMetaData(e, profile.getMetaData(), profile.getId());

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

	private void serializeProfileMetaData(nu.xom.Element e, ProfileMetaData metaData, String id) {
		e.addAttribute(new Attribute("ID", id));

		if (metaData.getType() != null && !metaData.getType().equals(""))
			e.addAttribute(new Attribute("Type", ExportUtil.str(metaData.getType())));
		if (metaData.getHl7Version() != null && !metaData.getHl7Version().equals(""))
			e.addAttribute(new Attribute("HL7Version", ExportUtil.str(metaData.getHl7Version())));
		if (metaData.getSchemaVersion() != null && !metaData.getSchemaVersion().equals(""))
			e.addAttribute(new Attribute("SchemaVersion", ExportUtil.str(metaData.getSchemaVersion())));

		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		elmMetaData.addAttribute(new Attribute("Name",
				!ExportUtil.str(metaData.getName()).equals("") ? ExportUtil.str(metaData.getName()) : "No Title Info"));
		elmMetaData.addAttribute(new Attribute("OrgName", !ExportUtil.str(metaData.getOrgName()).equals("")
				? ExportUtil.str(metaData.getOrgName()) : "No Org Info"));
		elmMetaData.addAttribute(new Attribute("Version", !ExportUtil.str(metaData.getVersion()).equals("")
				? ExportUtil.str(metaData.getVersion()) : "No Version Info"));
		elmMetaData.addAttribute(new Attribute("Date",
				!ExportUtil.str(metaData.getDate()).equals("") ? ExportUtil.str(metaData.getDate()) : "No Date Info"));

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
				elmMessage.appendChild(serializeSegmentRef((SegmentRef) segmentRefOrGroup, segments));
			} else if (segmentRefOrGroup instanceof Group) {
				elmMessage.appendChild(serializeGroup((Group) segmentRefOrGroup, segments));
			}
		}

		return elmMessage;
	}

	private nu.xom.Element serializeSegmentRef(SegmentRef segmentRef, Segments segments) {
		nu.xom.Element elmSegment = new nu.xom.Element("Segment");
		Segment s = segments.findOneSegmentById(segmentRef.getRef().getId());
		elmSegment.addAttribute(new Attribute("Ref", ExportUtil.str(s.getLabel())));
		elmSegment.addAttribute(new Attribute("Usage", ExportUtil.str(segmentRef.getUsage().value())));
		elmSegment.addAttribute(new Attribute("Min", ExportUtil.str(segmentRef.getMin() + "")));
		elmSegment.addAttribute(new Attribute("Max", ExportUtil.str(segmentRef.getMax())));
		return elmSegment;
	}

	private nu.xom.Element serializeGroup(Group group, Segments segments) {
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
				elmGroup.appendChild(serializeSegmentRef((SegmentRef) segmentRefOrGroup, segments));
			} else if (segmentRefOrGroup instanceof Group) {
				elmGroup.appendChild(serializeGroup((Group) segmentRefOrGroup, segments));
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
					Table t = tables.findOneTableById(tl.getId());
					if (t != null) {
						if (bindingIdentifier.equals("")) {
							bindingIdentifier = t.getBindingIdentifier();
						} else {
							bindingIdentifier = bindingIdentifier + ":" + t.getBindingIdentifier();
						}
						bindingStrength = tl.getBindingStrength();
						bindingLocation = tl.getBindingLocation();
					}
				}
				if (bindingIdentifier != null && !bindingIdentifier.equals(""))
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
						Table t = tables.findOneTableById(tl.getId());
						if (t != null) {
							if (bindingIdentifier.equals("")) {
								bindingIdentifier = t.getBindingIdentifier();
							} else {
								bindingIdentifier = bindingIdentifier + ":" + t.getBindingIdentifier();
							}
							bindingStrength = tl.getBindingStrength();
							bindingLocation = tl.getBindingLocation();
						}
					}
					if (bindingIdentifier != null && !bindingIdentifier.equals(""))
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

	public nu.xom.Element serializeTableLibraryToElement(Profile profile) {
		Tables tableLibrary = profile.getTables();
		nu.xom.Element elmTableLibrary = new nu.xom.Element("ValueSetLibrary");
		Attribute schemaLocation = new Attribute("xsi:noNamespaceSchemaLocation",
				"http://www.w3.org/2001/XMLSchema-instance",
				"https://raw.githubusercontent.com/Jungyubw/NIST_healthcare_hl7_v2_profile_schema/master/Schema/NIST%20Validation%20Schema/ValueSets.xsd");
		elmTableLibrary.addAttribute(schemaLocation);

		elmTableLibrary.addAttribute(new Attribute("ValueSetLibraryIdentifier", profile.getId()));

		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		ProfileMetaData metadata = profile.getMetaData();
		if (metadata == null) {
			elmMetaData.addAttribute(new Attribute("Name", "Vocab for " + "Profile"));
			elmMetaData.addAttribute(new Attribute("OrgName", "NIST"));
			elmMetaData.addAttribute(new Attribute("Version", "1.0.0"));
			elmMetaData.addAttribute(new Attribute("Date", ""));
		} else {
			elmMetaData.addAttribute(new Attribute("Name", !ExportUtil.str(metadata.getName()).equals("")
					? ExportUtil.str(metadata.getName()) : "No Title Info"));
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

				if (t.getCodes() == null || t.getCodes().size() == 0) {
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

	public nu.xom.Document serializeConstraintsToDoc(Profile profile) {
		Constraints predicates = findAllPredicates(profile);
		Constraints conformanceStatements = findAllConformanceStatement(profile);
		nu.xom.Element e = new nu.xom.Element("ConformanceContext");
		Attribute schemaLocation = new Attribute("xsi:noNamespaceSchemaLocation",
				"http://www.w3.org/2001/XMLSchema-instance",
				"https://raw.githubusercontent.com/Jungyubw/NIST_healthcare_hl7_v2_profile_schema/master/Schema/NIST%20Validation%20Schema/ConformanceContext.xsd");
		e.addAttribute(schemaLocation);
		e.addAttribute(new Attribute("UUID", profile.getId()));

		ProfileMetaData metadata = profile.getMetaData();
		nu.xom.Element elmMetaData = new nu.xom.Element("MetaData");
		if (metadata == null) {
			elmMetaData.addAttribute(new Attribute("Name", "Constraints for " + "Profile"));
			elmMetaData.addAttribute(new Attribute("OrgName", "NIST"));
			elmMetaData.addAttribute(new Attribute("Version", "1.0.0"));
			elmMetaData.addAttribute(new Attribute("Date", ""));
		} else {
			elmMetaData.addAttribute(new Attribute("Name", !ExportUtil.str(metadata.getName()).equals("")
					? ExportUtil.str(metadata.getName()) : "No Title Info"));
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

	private Constraints findAllPredicates(Profile profile) {
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

	private Constraints findAllConformanceStatement(Profile profile) {
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

	private void serializeCoConstaint(nu.xom.Element e, Profile profile) {
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

						elmPlainCoConstraint.addAttribute(new Attribute("KeyPath",
								s.getCoConstraints().getColumnList().get(0).getField().getPosition() + "[1]"));
						elmPlainCoConstraint.addAttribute(new Attribute("KeyValue", cc.getValues().get(0).getValue()));

						for (int i = 1; i < s.getCoConstraints().getColumnList().size(); i++) {
							String path = s.getCoConstraints().getColumnList().get(i).getField().getPosition() + "[1]";
							String type = s.getCoConstraints().getColumnList().get(i).getConstraintType();
							String value = cc.getValues()
									.get(s.getCoConstraints().getColumnList().get(i).getColumnPosition()).getValue();

							if (value != null && !value.equals("")) {
								if (type.equals("vs")) {
									Table t = profile.getTables().findOneTableById(value);
									if (t != null) {
										nu.xom.Element elmValueSetCheck = new nu.xom.Element("ValueSet");
										elmValueSetCheck.addAttribute(new Attribute("Path", path));
										elmValueSetCheck.addAttribute(new Attribute("ValueSetID",
												profile.getTables().findOneTableById(value).getBindingIdentifier()));
										elmValueSetCheck.addAttribute(new Attribute("BindingStrength", "R"));
										elmValueSetCheck.addAttribute(new Attribute("BindingLocation", "1"));
										elmPlainCoConstraint.appendChild(elmValueSetCheck);
									}
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
		if (coConstraints_Elm.getChildCount() > 0)
			e.appendChild(coConstraints_Elm);
	}
}
