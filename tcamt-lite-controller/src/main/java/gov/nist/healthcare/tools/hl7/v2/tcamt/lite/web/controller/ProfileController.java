package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.util.FileCopyUtils;
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
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ConformanceProfile;
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
        pa.setConformanceContextMetaData(p.getConformanceContext().getMetaData());
        pa.setIntegrationProfileMetaData(p.getIntegrationProfile().getIntegrationProfileMetaData());
        pa.setValueSetLibraryMetaData(p.getValueSetLibrary().getMetaData());
        
        for(ConformanceProfile cp : p.getIntegrationProfile().getConformanceProfiles()){
          pa.addConformanceProfileMetaData(cp.getConformanceProfileMetaData());
        }
        
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
  
  @RequestMapping(value = "/downloadProfileXML/{id}", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void downloadProfileXML(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response) throws Exception {
    ProfileData data = profileService.findOne(id);
    if(data != null && data.getProfileXMLFileStr() != null){
      InputStream content = IOUtils.toInputStream(data.getProfileXMLFileStr());
      response.setContentType("text/html");
      response.setHeader("Content-disposition", "attachment;filename=" + "Profile.xml");
      FileCopyUtils.copy(content, response.getOutputStream());
    }
  }
  
  @RequestMapping(value = "/downloadConstraintXML/{id}", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void downloadConstraintXML(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response) throws Exception {
    ProfileData data = profileService.findOne(id);
    if(data != null && data.getConstraintsXMLFileStr() != null){
      InputStream content = IOUtils.toInputStream(data.getConstraintsXMLFileStr());
      response.setContentType("text/html");
      response.setHeader("Content-disposition", "attachment;filename=" + "Constraints.xml");
      FileCopyUtils.copy(content, response.getOutputStream());
    }
  }
  
  @RequestMapping(value = "/downloadValueSetXML/{id}", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void downloadValueSetXML(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response) throws Exception {
    ProfileData data = profileService.findOne(id);
    if(data != null && data.getValueSetXMLFileStr() != null){
      InputStream content = IOUtils.toInputStream(data.getValueSetXMLFileStr());
      response.setContentType("text/html");
      response.setHeader("Content-disposition", "attachment;filename=" + "ValueSets.xml");
      FileCopyUtils.copy(content, response.getOutputStream());
    }
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
