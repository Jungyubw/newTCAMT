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

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config;

import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStroyEntry;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;

@Service
public class Bootstrap implements InitializingBean {

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Autowired
  TestPlanService testplanService;

  @Autowired
  ProfileService profileService;

  @Autowired
  TestStoryConfigurationService testStoryConfigurationService;

  /*
   * (non-Javadoc)
   * 
   * @see org.springframework.beans.factory.InitializingBean#afterPropertiesSet()
   */
  @Override
  public void afterPropertiesSet() throws Exception {
//    updateHL7Version();
//    updateLongIDforTestPlan();
//
    resetIGAMTProfile();


  }

  private void resetIGAMTProfile() {
    List<Profile> profiles = profileService.findAll();
    for (Profile p : profiles) {
      if (p.getSourceType().equals("igamt")) {
        profileService.delete(p.getId());
      }
    }


  }

  private void updateLongIDforTestPlan() throws TestPlanException {
    List<TestPlan> tps = testplanService.findAll();

    for (TestPlan tp : tps) {
      if (tp.getLongId() == null) {
        long range = Long.MAX_VALUE;
        Random r = new Random();
        tp.setLongId((long) (r.nextDouble() * range));
      }

      for (TestCaseOrGroup tcog : tp.getChildren()) {
        visit(tcog);
      }

      testplanService.save(tp);
    }

  }

  private void visit(TestCaseOrGroup tcog) {
    if (tcog.getLongId() == null) {
      long range = Long.MAX_VALUE;
      Random r = new Random();
      tcog.setLongId((long) (r.nextDouble() * range));
    }

    if (tcog instanceof TestCase) {
      TestCase tc = (TestCase) tcog;
      for (TestStep child : tc.getTeststeps()) {
        if (child.getLongId() == null) {
          long range = Long.MAX_VALUE;
          Random r = new Random();
          child.setLongId((long) (r.nextDouble() * range));
        }
      }

    } else if (tcog instanceof TestCaseGroup) {
      TestCaseGroup group = (TestCaseGroup) tcog;
      for (TestCaseOrGroup child : group.getChildren()) {
        visit(child);
      }
    }

  }

  private void updateHL7Version() throws ProfileException {
    List<Profile> profiles = profileService.findAll();

    for (Profile p : profiles) {
      if (p.getSourceType().equals("private")) {
        String version = p.getMetaData().getHl7Version();

        for (Segment s : p.getSegments().getChildren()) {
          if (s.getHl7Version() == null) {
            s.setHl7Version(version);
          }
        }

        for (Datatype d : p.getDatatypes().getChildren()) {
          if (d.getHl7Version() == null) {
            d.setHl7Version(version);
          }
        }

        for (Table t : p.getTables().getChildren()) {
          if (t.getHl7Version() == null) {
            t.setHl7Version(version);
          }
        }

        profileService.save(p);

      }
    }

  }

  public Logger getLogger() {
    return logger;
  }
}
