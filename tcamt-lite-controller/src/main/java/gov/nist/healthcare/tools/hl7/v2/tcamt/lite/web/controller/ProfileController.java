package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.HashMap;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileDataStr;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileDeleteException;
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
	
	@RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
	public ResponseMessage delete(@PathVariable("id") String id) throws ProfileDeleteException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) throw new UserAccountNotFoundException();
			profileService.delete(id);
			return new ResponseMessage(ResponseMessage.Type.success, "profileDeletedSuccess", null);
		} catch (RuntimeException e) {
			throw new ProfileDeleteException(e);
		} catch (Exception e) {
			throw new ProfileDeleteException(e);
		}
	}
	
	@RequestMapping(value = "/public", method = RequestMethod.GET, produces = "application/json")
	public List<Profile> getAllPublicProfiles() throws UserAccountNotFoundException, TestPlanListException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			return profileService.findByAccountId((long) 0);
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
	
	@RequestMapping(value = "/replaceXMLFiles/{id}", method = RequestMethod.POST)
	public void replaceXMLFiles(@RequestBody ProfileDataStr pds, @PathVariable("id") String id) throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}
		
		Profile oldP = profileService.findOne(id);
		
		if(oldP != null){
			HashMap<String, String> messageIdIdentifierMap = new HashMap<String, String>();
			
			for(Message m:oldP.getMessages().getChildren()){
				if(m.getIdentifier() != null){
					messageIdIdentifierMap.put(m.getIdentifier(), m.getId());	
				}
			}

			Profile p = profileService.readXML2Profile(pds);
			p.setId(oldP.getId());
			p.setAccountId(oldP.getAccountId());
			
			for(Message m:p.getMessages().getChildren()){
				if(m.getIdentifier() != null){
					String messageID = messageIdIdentifierMap.get(m.getIdentifier())	;
					if(messageID != null && !messageID.equals("")){
						m.setId(messageID);
					}
				}
			}
			profileService.save(p);	
		}
	}
	
	
	@RequestMapping(value = "/importXMLFilesForPublic", method = RequestMethod.POST)
	public void importXMLFilesForPublic(@RequestBody ProfileDataStr pds) throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}

		Profile p = profileService.readXML2Profile(pds);
		p.setAccountId((long) 0);
		profileService.save(p);
	}
	
	
	
}
