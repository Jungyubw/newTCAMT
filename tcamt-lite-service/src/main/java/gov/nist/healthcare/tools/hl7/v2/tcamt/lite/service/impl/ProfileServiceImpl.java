/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified.
 */

/**
 * 
 * @author Olivier MARIE-ROSE
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mongodb.MongoException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.ProfileRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;

@Service
public class ProfileServiceImpl implements ProfileService {
  Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);
  @Autowired
  private ProfileRepository profileRepository;

  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public ProfileData save(ProfileData data) throws Exception {
    try {
      return profileRepository.save(data);
    } catch (MongoException e) {
      throw new Exception(e);
    }
  }

  @Override
  @Transactional
  public void delete(String id) {
    profileRepository.delete(id);
  }

  @Override
  public ProfileData findOne(String id) {
    ProfileData p = profileRepository.findOne(id);
    return p;
  }

  @Override
  public List<ProfileData> findAll() {
    List<ProfileData> profiles = profileRepository.findAll();
    log.info("profiles=" + profiles.size());
    return profiles;
  }

  @Override
  public List<ProfileData> findByAccountId(Long accountId) {
    List<ProfileData> profiles = profileRepository.findByAccountId(accountId);
    return profiles;
  }

  @Override
  public List<ProfileData> findByAccountIdAndSourceType(Long accountId, String sourceType) {
    List<ProfileData> profiles = profileRepository.findByAccountIdAndSourceType(accountId, sourceType);
    return profiles;
  }
}
