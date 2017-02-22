package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.IOUtils;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlanDataStr;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.XMLContainer;
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
		content = new ExportUtil().exportTestPackageAsHtml(tp);
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
	
	@RequestMapping(value = "/{ipid}/exportProfileXMLs", method = RequestMethod.POST, produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
	public void exportProfileXMLs(@PathVariable("ipid") String[] ipid, HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		log.info("Exporting as zip file Profiles with id=" + ipid);
	    InputStream content = null;
	    content = new ExportUtil().exportProfileXMLZip(ipid);
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

	private String escapeSpace(String str) {
		return str.replaceAll(" ", "-");
	}

}
