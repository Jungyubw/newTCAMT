/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgement if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStroyEntry;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
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
	 * @see
	 * org.springframework.beans.factory.InitializingBean#afterPropertiesSet()
	 */
	@Override
	public void afterPropertiesSet() throws Exception {
//		updateTCAMTProfiles();
//		updateDefaultConfig();
		
		
		updateHL7Version();
	}

	private void updateHL7Version() throws ProfileException {
		List<Profile> profiles = profileService.findAll();

		for (Profile p : profiles) {
			if (p.getSourceType().equals("private")) {
				String version = p.getMetaData().getHl7Version();
				
				for(Segment s: p.getSegments().getChildren()){
					if(s.getHl7Version() == null){
						s.setHl7Version(version);
					}
				}
				
				for(Datatype d: p.getDatatypes().getChildren()){
					if(d.getHl7Version() == null){
						d.setHl7Version(version);
					}
				}
				
				for(Table t: p.getTables().getChildren()){
					if(t.getHl7Version() == null){
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

	private void updateTCAMTProfiles() throws ProfileException {
		List<Profile> profiles = profileService.findAll();

		for (Profile p : profiles) {
			if (p.getSourceType() == null || p.getSourceType().isEmpty()) {
				if (p.getAccountId().equals((long) 0)) {
					p.setSourceType("public");
				} else {
					p.setSourceType("private");
				}
				profileService.save(p);

			}
		}
	}

	private void updateDefaultConfig() {
		TestStoryConfiguration testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);

		for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
			if (tse.getId().equals("Description") || tse.getId().equals("Test Objectives")) {
				tse.setSummaryEntry(true);
			}
		}
		testStoryConfigurationService.save(testStoryConfiguration);
	}
}