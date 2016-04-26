package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileMetaDataAndID;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanSaveException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.serialization.ProfileSerializationImpl;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.OperationNotAllowException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integrationprofiles")
public class IntegrationProfileController extends CommonController {

	Logger log = LoggerFactory.getLogger(IntegrationProfileController.class);

	@Autowired
	private ProfileService profileService;

	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;


	/**
	 * 
	 * @param type
	 * @return
	 * @throws UserAccountNotFoundException
	 * @throws TestPlanException
	 */
	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public List<ProfileMetaDataAndID> getAllProfileMetaData() throws Exception {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			
			List<Profile> profiles = profileService.findByAccountId(account.getId());
			
			List<ProfileMetaDataAndID> results = new ArrayList<ProfileMetaDataAndID>();
			
			for(Profile p:profiles){
				ProfileMetaDataAndID o = new ProfileMetaDataAndID();
				o.setId(p.getId());
				o.setMetadata(p.getMetaData());
				results.add(o);
			}
			
			return results;
		} catch (RuntimeException e) {
			throw new RuntimeException(e);
		} catch (Exception e) {
			throw new Exception(e);
		}
	}

	@RequestMapping(value = "/{id}", method = RequestMethod.GET)
	public Profile get(@PathVariable("id") String id) throws Exception {
		try {
			log.info("Fetching profile with id=" + id);
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null)
				throw new UserAccountNotFoundException();
			Profile p = findProfile(id);
			return p;
		} catch (RuntimeException e) {
			throw new Exception(e);
		} catch (Exception e) {
			throw new Exception(e);
		}
	}

	@RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
	public ResponseMessage delete(@PathVariable("id") String id) throws Exception {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) throw new UserAccountNotFoundException();
			log.info("Delete Profile with id=" + id);
			Profile p = findProfile(id);
			if (p.getAccountId() == account.getId()) {
				profileService.delete(id);
				return new ResponseMessage(ResponseMessage.Type.success, "ProfileDeletedSuccess", null);
			} else {
				throw new OperationNotAllowException("delete");
			}
		} catch (RuntimeException e) {
			throw new RuntimeException(e);
		} catch (Exception e) {
			throw new Exception(e);
		}
	}

	@RequestMapping(value = "/save", method = RequestMethod.POST)
	public Profile save(
			@RequestBody String p, 
			@RequestBody String v,
			@RequestBody String c)
			throws Exception {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) throw new UserAccountNotFoundException();
			Profile profile = new ProfileSerializationImpl().deserializeXMLToProfile(p, v, c);
			return profileService.apply(profile);
		} catch (RuntimeException e) {
			throw new TestPlanSaveException(e);
		} catch (Exception e) {
			throw new TestPlanSaveException(e);
		}
	}

	private Profile findProfile(String profileId) throws Exception {
		Profile p = profileService.findOne(profileId);
		if (p == null) {
			throw new Exception(profileId);
		}
		return p;
	}
}
