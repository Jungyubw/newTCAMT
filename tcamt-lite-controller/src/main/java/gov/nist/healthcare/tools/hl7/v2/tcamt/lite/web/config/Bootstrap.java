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

import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStory;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;

@Service
public class Bootstrap implements InitializingBean {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	TestPlanService testplanService;
	


	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.springframework.beans.factory.InitializingBean#afterPropertiesSet()
	 */
	@Override
	public void afterPropertiesSet() throws Exception {
		this.updateTestStory();
	}

	public Logger getLogger() {
		return logger;
	}
	
	private void updateTestStory() throws TestPlanException{
		List<TestPlan> allTestPlans = testplanService.findAll();
		
		for(TestPlan tp : allTestPlans){
			for(TestCaseOrGroup tcog : tp.getChildren()){
				if(tcog instanceof TestCaseGroup){
					this.updateTestStoryForTestCaseGroup((TestCaseGroup)tcog);
				}else if(tcog instanceof TestCase){
					this.updateTestStoryForTestCase((TestCase)tcog);
				}
			}
			testplanService.save(tp);
			
		}
	}
	
	private void updateTestStoryForTestCaseGroup(TestCaseGroup tcg){
		for(TestCaseOrGroup tcog : tcg.getChildren()){
			if(tcog instanceof TestCaseGroup){
				this.updateTestStoryForTestCaseGroup((TestCaseGroup)tcog);
			}else if(tcog instanceof TestCase){
				this.updateTestStoryForTestCase((TestCase)tcog);
			}
		}
	}

	private void updateTestStoryForTestCase(TestCase tc) {
		TestStory story = tc.getTestCaseStory();
		if(story != null){
			HashMap<String,String> testStoryContent=new HashMap<String, String>();
			testStoryContent.put("Description", story.getTeststorydesc());
			testStoryContent.put("Comments", story.getComments());
			testStoryContent.put("Pre-condition", story.getPreCondition());
			testStoryContent.put("Post-Condition", story.getPostCondition());
			testStoryContent.put("Test Objectives", story.getTestObjectives());
			testStoryContent.put("Evaluation Criteria", story.getEvaluationCriteria());
			testStoryContent.put("Notes", story.getNotes());
			tc.setTestStoryContent(testStoryContent);
			tc.setTestCaseStory(null);	
		}
		for(TestStep ts:tc.getTeststeps()){
			this.updateTestStoryForTestStep(ts);
		}
	}

	private void updateTestStoryForTestStep(TestStep ts) {
		TestStory story = ts.getTestStepStory();
		if(story != null){
			HashMap<String,String> testStoryContent=new HashMap<String, String>();
			testStoryContent.put("Description", story.getTeststorydesc());
			testStoryContent.put("Comments", story.getComments());
			testStoryContent.put("Pre-condition", story.getPreCondition());
			testStoryContent.put("Post-Condition", story.getPostCondition());
			testStoryContent.put("Test Objectives", story.getTestObjectives());
			testStoryContent.put("Evaluation Criteria", story.getEvaluationCriteria());
			testStoryContent.put("Notes", story.getNotes());
			ts.setTestStoryContent(testStoryContent);
			ts.setTestStepStory(null);	
		}
	}

}