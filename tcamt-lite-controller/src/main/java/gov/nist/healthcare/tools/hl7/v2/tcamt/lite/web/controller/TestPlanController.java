package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.bson.types.ObjectId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlanDataStr;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.XMLContainer;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanDeleteException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanListException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanNotFoundException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanSaveException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.TestPlanSaveResponse;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config.TestPlanChangeCommand;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.OperationNotAllowException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.ExportUtil;
import gov.nist.hit.resources.deploy.client.RequestModel;
import gov.nist.hit.resources.deploy.client.ResourceClient;
import gov.nist.hit.resources.deploy.factory.ResourceClientFactory;

@RestController
@RequestMapping("/testplans")
public class TestPlanController extends CommonController {

	Logger log = LoggerFactory.getLogger(TestPlanController.class);

	@Autowired
	private TestPlanService testPlanService;

	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;
	
	@Autowired
	TestStoryConfigurationService testStoryConfigurationService;
	
	@Autowired
	ProfileService profileService;

	/**
	 * 
	 * @param type
	 * @return
	 * @throws UserAccountNotFoundException
	 * @throws TestPlanException
	 */
	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public List<TestPlan> getAllTestPlans() throws UserAccountNotFoundException, TestPlanListException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			return testPlanService.findByAccountId(account.getId());
		} catch (RuntimeException e) {
			throw new TestPlanListException(e);
		} catch (Exception e) {
			throw new TestPlanListException(e);
		}
	}

	@RequestMapping(value = "/{id}", method = RequestMethod.GET)
	public TestPlan get(@PathVariable("id") String id) throws TestPlanNotFoundException {
		try {
			log.info("Fetching profile with id=" + id);
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();
			TestPlan tp = findTestPlan(id);
			return tp;
		} catch (RuntimeException e) {
			throw new TestPlanNotFoundException(e);
		} catch (Exception e) {
			throw new TestPlanNotFoundException(e);
		}
	}

	@RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
	public ResponseMessage delete(@PathVariable("id") String id) throws TestPlanDeleteException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();
			log.info("Delete TestPlan with id=" + id);
			TestPlan tp = findTestPlan(id);
			if (tp.getAccountId() == account.getId()) {
				testPlanService.delete(id);
				return new ResponseMessage(ResponseMessage.Type.success, "testPlanDeletedSuccess", null);
			} else {
				throw new OperationNotAllowException("delete");
			}
		} catch (RuntimeException e) {
			throw new TestPlanDeleteException(e);
		} catch (Exception e) {
			throw new TestPlanDeleteException(e);
		}
	}
	
	@RequestMapping(value = "/{id}/copy", method = RequestMethod.POST)
	public ResponseMessage copy(@PathVariable("id") String id) throws TestPlanDeleteException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();
			TestPlan tp = findTestPlan(id);
			if (tp.getAccountId() == account.getId()) {
				testPlanService.save(testPlanService.clone(tp));
				return new ResponseMessage(ResponseMessage.Type.success, "testPlanCSuccess", null);
			} else {
				throw new OperationNotAllowException("delete");
			}
		} catch (RuntimeException e) {
			throw new TestPlanDeleteException(e);
		} catch (Exception e) {
			throw new TestPlanDeleteException(e);
		}
	}

	@RequestMapping(value = "/save", method = RequestMethod.POST)
	public TestPlanSaveResponse save(@RequestBody TestPlanChangeCommand command) throws TestPlanSaveException {
		
		System.out.println("SAVE REQ");
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();
			
			TestPlan saved = testPlanService.apply(command.getTp());
			return new TestPlanSaveResponse(saved.getLastUpdateDate(), saved.getVersion());
		} catch (RuntimeException e) {
			throw new TestPlanSaveException(e);
		} catch (Exception e) {
			throw new TestPlanSaveException(e);
		}
	}

	@RequestMapping(value = "/supplementsGeneration", method = RequestMethod.POST)
	public XMLContainer supplementsGeneration(@RequestBody XMLContainer xmlContainer) {
		XMLContainer result = new XMLContainer();
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();

			ClassLoader classLoader = getClass().getClassLoader();
			String xsl = IOUtils.toString(
					classLoader.getResourceAsStream("xsl" + File.separator + xmlContainer.getType() + ".xsl"));
			InputStream xsltInputStream = new ByteArrayInputStream(xsl.getBytes());
			InputStream sourceInputStream = new ByteArrayInputStream(xmlContainer.getXml().getBytes());
			Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
			Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
			String xsltStr = IOUtils.toString(xsltReader);
			String sourceStr = IOUtils.toString(sourceReader);
			result.setType("html");
			result.setXml(TestPlanController.parseXmlByXSLT(sourceStr, xsltStr));
			result.setXml(result.getXml().replace("accordion", "uib-accordion"));
			return result;
		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;
	}

	private TestPlan findTestPlan(String testplanId) throws TestPlanNotFoundException {
		TestPlan tp = testPlanService.findOne(testplanId);
		if (tp == null) {
			throw new TestPlanNotFoundException(testplanId);
		}
		return tp;
	}

	private static String parseXmlByXSLT(String sourceStr, String xsltStr) {
		System.setProperty("javax.xml.transform.TransformerFactory", "net.sf.saxon.TransformerFactoryImpl");
		TransformerFactory tFactory = TransformerFactory.newInstance();

		try {
			Transformer transformer = tFactory.newTransformer(new StreamSource(new java.io.StringReader(xsltStr)));
			StringWriter outWriter = new StringWriter();
			StreamResult result = new StreamResult(outWriter);

			transformer.transform(new StreamSource(new java.io.StringReader(sourceStr)), result);
			StringBuffer sb = outWriter.getBuffer();
			String finalstring = sb.toString();

			return finalstring;
		} catch (Exception e) {
			e.printStackTrace();
		}

		return null;
	}

	@RequestMapping(value = "/{id}/exportTestPackageHTML", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportTestPackage(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		TestPlan tp = findTestPlan(id);
		InputStream content = null;
		content = new ExportUtil().exportTestPackageAsHtml(tp, testStoryConfigurationService);
		response.setContentType("text/html");
		response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName()) + "-"
				+ new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_TestPackage.html");
		FileCopyUtils.copy(content, response.getOutputStream());

	}
	
	@RequestMapping(value = "/{id}/exportRBZip", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportResourceBundleZip(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		log.info("Exporting as zip file RB with id=" + id);
		TestPlan tp = findTestPlan(id);
	    InputStream content = null;
	    content = new ExportUtil().exportResourceBundleAsZip(tp, testStoryConfigurationService);
	    response.setContentType("application/zip");
	    response.setHeader("Content-disposition",
	        "attachment;filename=" + escapeSpace(tp.getName()) + "-"
	            + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + ".zip");
	    FileCopyUtils.copy(content, response.getOutputStream());
	}
	
	
	 @RequestMapping(value = "/pushRB", method = RequestMethod.POST,
		      produces = "application/json")
		  public Map<String, Object> pushRB(
		      HttpServletRequest request, HttpServletResponse response) throws Exception{
	     // ResourceClient client = ResourceClientFactory.createResourceClientWithDefault(host, authorization);
	      String host2="https://hit-dev.nist.gov:8098/";
	      ResourceClient client2=ResourceClientFactory.createResourceClientWithDefault(host2,"wakili","Ae725055");
	   
	      String url ="tcamt.nist.gov/tcamt/resources/resourceBundle/NewTestPlan.zip";
	      
	      RequestModel m=new RequestModel(url);
	      
		  client2.addOrUpdateTestPlan(m);
		    
		 
		 return null;
	 }
	
	@RequestMapping(value = "/{ipid}/exportProfileXMLs", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportProfileXMLs(@PathVariable("ipid") String[] ipid, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		log.info("Exporting as zip file Profiles with id=" + ipid);
	    InputStream content = null;
	    content = new ExportUtil().exportProfileXMLZip(ipid, profileService);
	    response.setContentType("application/zip");
	    response.setHeader("Content-disposition",
	        "attachment;filename=Profiles-"
	            + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + ".zip");
	    FileCopyUtils.copy(content, response.getOutputStream());
	}
	
	
	@RequestMapping(value = "/{id}/exportCover", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportCoverPage(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		TestPlan tp = findTestPlan(id);
		InputStream content = null;
		content = new ExportUtil().exportCoverAsHtml(tp);
		response.setContentType("text/html");
		response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName()) + "-"
				+ new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_CoverPage.html");
		FileCopyUtils.copy(content, response.getOutputStream());

	}
	
	@RequestMapping(value = "/{id}/exportJson", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportTestPlanJson(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		TestPlan tp = findTestPlan(id);
		InputStream content = null;
		ObjectMapper mapper = new ObjectMapper();
		String jsonInString = mapper.writeValueAsString(tp);
		content = IOUtils.toInputStream(jsonInString, "UTF-8");
		response.setContentType("text/html");
		response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName()) + "-"
				+ new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_TestPlan.json");
		FileCopyUtils.copy(content, response.getOutputStream());
	}
	
	@RequestMapping(value = "/importJSON", method = RequestMethod.POST)
	public void importXMLFiles(@RequestBody TestPlanDataStr tpds) throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}
		
		ObjectMapper mapper = new ObjectMapper();
		TestPlan tp = mapper.readValue(tpds.getJsonTestPlanFileStr(), TestPlan.class);
		tp.setId(ObjectId.get().toString());
		testPlanService.save(tp);
	}
	
	@RequestMapping(value = "/importOldJSON", method = RequestMethod.POST)
	public void importOldXMLFiles(@RequestBody TestPlanDataStr tpds) throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}
		TestPlan tp = new TestPlan();
		JSONObject obj = new JSONObject(tpds.getJsonTestPlanFileStr());
		tp.setName((String) obj.get("name"));
		tp.setAccountId(account.getId());
		tp.setCoverPageDate((String) obj.get("coverPageDate"));
		tp.setCoverPageSubTitle((String) obj.get("coverPageSubTitle"));
		tp.setCoverPageTitle((String) obj.get("coverPageTitle"));
		tp.setCoverPageVersion((String) obj.get("coverPageVersion"));
		tp.setDescription(Jsoup.parse((String) obj.get("description")).text());
		tp.setDomain("VR");
		tp.setTransport(true);
		tp.setType("Isolated");
		tp.setVersion((int) obj.get("version") + "");
		
		
		JSONArray groups = (JSONArray) obj.get("testcasegroups");
		
		for (int i = 0; i < groups.length(); i++) {
			JSONObject g = groups.getJSONObject(i);
			
			TestCaseGroup tcg = new TestCaseGroup();
			tcg.setDescription(Jsoup.parse((String) g.get("description")).text());
			tcg.setName((String) g.get("name"));
			tcg.setType("testcasegroup");
			
			JSONArray testcases = (JSONArray) g.get("testcases");
			for (int j = 0; j < testcases.length(); j++) {
				JSONObject c = testcases.getJSONObject(j);
				
				TestCase tc = new TestCase();
				tc.setDescription(Jsoup.parse((String) c.get("description")).text());
				tc.setName((String) c.get("name"));
				tc.setProtocol("soap");
				JSONObject testCaseStory = (JSONObject) c.get("testCaseStory");
				HashMap<String, String> testcaseStoryContent = new HashMap<String, String>();
				testcaseStoryContent.put("Description", (String) testCaseStory.get("teststorydesc"));
				testcaseStoryContent.put("Comments", (String) testCaseStory.get("comments"));
				testcaseStoryContent.put("Pre-condition", (String) testCaseStory.get("preCondition"));
				testcaseStoryContent.put("Post-Condition", (String) testCaseStory.get("postCondition"));
				testcaseStoryContent.put("Test Objectives", (String) testCaseStory.get("testObjectives"));
				testcaseStoryContent.put("Evaluation Criteria", (String) testCaseStory.get("evaluationCriteria"));
				testcaseStoryContent.put("Notes", (String) testCaseStory.get("notes"));
				tc.setTestStoryContent(testcaseStoryContent);
				tc.setType("testcase");
				
				JSONArray teststeps = (JSONArray) c.get("teststeps");
				for (int k = 0; k < teststeps.length(); k++) {
					JSONObject s = teststeps.getJSONObject(k);
					
					TestStep ts = new TestStep();
					ts.setDescription(Jsoup.parse((String) s.get("description")).text());
					
					JSONObject message = (JSONObject) s.get("message");
					if(message != null){
						if(!message.isNull("hl7EndcodedMessage")){
							ts.setEr7Message((String) message.get("hl7EndcodedMessage"));	
							
							if(!message.isNull("tcamtConstraints")){
								JSONArray tcamtConstraints = (JSONArray) message.get("tcamtConstraints");	
								for (int l = 0; l < tcamtConstraints.length(); l++) {
									JSONObject constraints = tcamtConstraints.getJSONObject(l);
									
									String iPath = (String)constraints.get("ipath");
									String key = iPath.replaceAll("\\.", "-");
									String cate = (String)constraints.get("categorization");
									Categorization value = new Categorization();
									value.setiPath(iPath);
									
									if(cate.equals("Indifferent")){
										value.setTestDataCategorization("Indifferent");
									}else if(cate.equals("Presence_ContentIndifferent")){
										value.setTestDataCategorization("Presence-Content Indifferent");
									}else if(cate.equals("Presence_Configuration")){
										value.setTestDataCategorization("Presence-Configuration");
									}else if(cate.equals("Presence_SystemGenerated")){
										value.setTestDataCategorization("Presence-System Generated");
									}else if(cate.equals("Presence_TestCaseProper")){
										value.setTestDataCategorization("Presence-Test Case Proper");
									}else if(cate.equals("PresenceLength_ContentIndifferent")){
										value.setTestDataCategorization("Presence Length-Content Indifferent");
									}else if(cate.equals("PresenceLength_Configuration")){
										value.setTestDataCategorization("Presence Length-Configuration");
									}else if(cate.equals("PresenceLength_SystemGenerated")){
										value.setTestDataCategorization("Presence Length-System Generated");
									}else if(cate.equals("PresenceLength_TestCaseProper")){
										value.setTestDataCategorization("Presence Length-Test Case Proper");
									}else if(cate.equals("Value_TestCaseFixed")){
										value.setTestDataCategorization("Value-Test Case Fixed");
									}else if(cate.equals("Value_TestCaseFixedList")){
										value.setTestDataCategorization("Value-Test Case Fixed List");
										List<String> listData = new ArrayList<String>();
										JSONArray listDataJson = (JSONArray) constraints.get("listData");
										for (int m = 0; m < listDataJson.length(); m++) {
											listData.add(listDataJson.getString(m));
										}
										
										value.setListData(listData);
									}else if(cate.equals("NonPresence")){
										value.setTestDataCategorization("NonPresence");
									}else if(cate.equals("Value_ProfileFixed")){
										value.setTestDataCategorization("Value-Profile Fixed");
									}else if(cate.equals("Value_ProfileFixedList")){
										value.setTestDataCategorization("Value-Profile Fixed List");
										List<String> listData = new ArrayList<String>();
										JSONArray listDataJson = (JSONArray) constraints.get("listData");
										for (int m = 0; m < listDataJson.length(); m++) {
											listData.add(listDataJson.getString(m));
										}
									}
									HashMap<String, Categorization> testDataCategorizationMap = new HashMap<String, Categorization>();
									testDataCategorizationMap.put(key, value);
									ts.setTestDataCategorizationMap(testDataCategorizationMap);
								}
							}
						}
					}
					
					ts.setName((String) s.get("name"));
					JSONObject testStepStory = (JSONObject) s.get("testStepStory");
					HashMap<String, String> testStepStoryContent = new HashMap<String, String>();
					testStepStoryContent.put("Description", (String) testStepStory.get("teststorydesc"));
					testStepStoryContent.put("Comments", (String) testStepStory.get("comments"));
					testStepStoryContent.put("Pre-condition", (String) testStepStory.get("preCondition"));
					testStepStoryContent.put("Post-Condition", (String) testStepStory.get("postCondition"));
					testStepStoryContent.put("Test Objectives", (String) testStepStory.get("testObjectives"));
					testStepStoryContent.put("Evaluation Criteria", (String) testStepStory.get("evaluationCriteria"));
					testStepStoryContent.put("Notes", (String) testStepStory.get("notes"));
					ts.setTestStoryContent(testStepStoryContent);
					ts.setType("teststep");
					tc.addTestStep(ts);
				}
				tcg.addTestCaseOrGroup(tc);
			}
			
			tp.addTestCaseGroup(tcg);
	    }
		

		testPlanService.save(tp);
	}

	private String escapeSpace(String str) {
		return str.replaceAll(" ", "-");
	}

}
