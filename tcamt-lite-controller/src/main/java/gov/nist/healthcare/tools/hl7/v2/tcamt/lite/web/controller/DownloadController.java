package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ResourceBundle;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ResourceBundleService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

@RestController
@RequestMapping("/download")
public class DownloadController extends CommonController {
	@Autowired
	UserService userService;
	
	@Autowired
	ResourceBundleService resourceBundleService;
	
	@Autowired
	private TestPlanService testPlanService;

	@Autowired
	AccountRepository accountRepository;
	
	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public List<ResourceBundle> getAllResourceBundles() throws Exception {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			
			List<TestPlan> testplans = testPlanService.findByAccountId(account.getId());
			
			for(TestPlan tp: testplans){
				ResourceBundle rb = resourceBundleService.findById(tp.getId());
				if (rb == null) {
					rb = new ResourceBundle();
					rb.setId(tp.getId());
					rb.setDate(new Date());
					rb.setHasPDF(false);
					rb.setHasResourceBundle(false);
					rb.setHasXML(false);
					rb.setName(tp.getName());
					rb.setAccountId(account.getId());
					resourceBundleService.save(rb);
				}
			}
			
			return resourceBundleService.findByAccountId(account.getId());
		} catch (Exception e) {
			throw new Exception(e);
		}
	}
}
