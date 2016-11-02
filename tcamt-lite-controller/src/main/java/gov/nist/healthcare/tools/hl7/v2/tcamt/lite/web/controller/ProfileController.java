package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileDataStr;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanListException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

@RestController
@RequestMapping("/profiles")
public class ProfileController extends CommonController {
	@Autowired
	UserService userService;
	
	@Autowired
	ProfileService profileService;

	@Autowired
	AccountRepository accountRepository;
	
	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public List<Profile> getAllPrivateProfiles() throws UserAccountNotFoundException, TestPlanListException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			return profileService.findByAccountId(account.getId());
		} catch (RuntimeException e) {
			throw new TestPlanListException(e);
		} catch (Exception e) {
			throw new TestPlanListException(e);
		}
	}

	@RequestMapping(value = "/importXMLFiles", method = RequestMethod.POST)
	public void importXMLFiles(@RequestBody ProfileDataStr pds) throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}

		Profile p = profileService.readXML2Profile(pds);
		p.setAccountId(account.getId());
		profileService.save(p);
	}
	
	
	
}
