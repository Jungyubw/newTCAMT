package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.ArrayList;
import java.util.Date;
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
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileAbstract;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileData;
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
  public List<ProfileAbstract> getAllProfiles() throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }

    try {
      List<ProfileData> result = new ArrayList<ProfileData>();
      List<ProfileAbstract> abstractResult = new ArrayList<ProfileAbstract>();
      List<ProfileData> privateProfiles = getAllPrivateProfiles(account);
      List<ProfileData> publicProfiles = getAllPublicProfiles();
      result.addAll(privateProfiles);
      result.addAll(publicProfiles);

      for (ProfileData p : result) {
        ProfileAbstract pa = new ProfileAbstract();
        pa.setAccountId(p.getAccountId());
        pa.setId(p.getId());
        pa.setLastUpdatedDate(p.getLastUpdatedDate());
        pa.setSourceType(p.getSourceType());
        pa.setConformanceContextMetaData(p.getConformanceContextMetaData());
        pa.setConformanceProfileMetaData(p.getConformanceProfileMetaData());
        pa.setValueSetLibraryMetaData(p.getValueSetLibraryMetaData());
        abstractResult.add(pa);
      }

      return abstractResult;
    } catch (Exception e) {
      throw new Exception(e);
    }
  }

  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public ProfileData get(@PathVariable("id") String id) throws Exception {
    try {
      ProfileData p = profileService.findOne(id);
      return p;

    } catch (Exception e) {
      throw new Exception(e);
    }
  }

  @RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
  public ResponseMessage delete(@PathVariable("id") String id) throws Exception {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      profileService.delete(id);
      return new ResponseMessage(ResponseMessage.Type.success, "profileDeletedSuccess", null);
    } catch (RuntimeException e) {
      throw new Exception(e);
    } catch (Exception e) {
      throw new Exception(e);
    }
  }

  @RequestMapping(value = "/importXMLFiles", method = RequestMethod.POST)
  public void importXMLFiles(@RequestBody ProfileData pds) throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }

    ProfileData p = pds;
    p.setAccountId(account.getId());
    p.setLastUpdatedDate(new Date());
    p.setSourceType("private");
    profileService.save(p);
  }

  @RequestMapping(value = "/replaceXMLFiles/{id}", method = RequestMethod.POST)
  public void replaceXMLFiles(@RequestBody ProfileData pds, @PathVariable("id") String id)
      throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }

    ProfileData p = pds;
    p.setAccountId(account.getId());
    p.setLastUpdatedDate(new Date());
    p.setSourceType("private");


    profileService.save(p);
  }


  @RequestMapping(value = "/importXMLFilesForPublic", method = RequestMethod.POST)
  public void importXMLFilesForPublic(@RequestBody ProfileData pds) throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }

    ProfileData p = pds;
    p.setAccountId((long) 0);
    p.setLastUpdatedDate(new Date());
    p.setSourceType("public");
    profileService.save(p);
  }

  private List<ProfileData> getAllPrivateProfiles(Account account)
      throws UserAccountNotFoundException, TestPlanListException {
    try {
      return profileService.findByAccountIdAndSourceType(account.getId(), "private");
    } catch (RuntimeException e) {
      throw new TestPlanListException(e);
    } catch (Exception e) {
      throw new TestPlanListException(e);
    }
  }

  private List<ProfileData> getAllPublicProfiles() throws TestPlanListException {
    try {
      return profileService.findByAccountIdAndSourceType((long) 0, "public");
    } catch (RuntimeException e) {
      throw new TestPlanListException(e);
    } catch (Exception e) {
      throw new TestPlanListException(e);
    }
  }
}
