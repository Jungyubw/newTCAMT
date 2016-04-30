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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.converters;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStory;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

import com.mongodb.BasicDBList;
import com.mongodb.DBObject;

@ReadingConverter
public class TestPlanReadConverter implements Converter<DBObject, TestPlan> {

	private static final Logger log = LoggerFactory
			.getLogger(TestPlanReadConverter.class);

	public TestPlanReadConverter() {
		log.info("TestPlan Read Converter Created");
	}

	@Override
	public TestPlan convert(DBObject source) {
		System.out.println("convert==>");
		TestPlan tp = new TestPlan();
		tp.setAccountId(readLong(source, "accountId"));
		BasicDBList groupOrCaseDBOList = (BasicDBList) source.get("children");
		for (Object groupOrCaseObject : groupOrCaseDBOList) {
			DBObject groupOrCaseDBObject = (DBObject) groupOrCaseObject;
			String type = (String) groupOrCaseDBObject.get("type");
			if (type.equals("testcasegroup")) {
				TestCaseGroup tcg = group(groupOrCaseDBObject);
				tp.addTestCaseGroup(tcg);
			} else {
				TestCase tc = testcase(groupOrCaseDBObject);
				tp.addTestCase(tc);
			}
		}
		tp.setCoverPageDate(readString(source, "coverPageDate"));
		tp.setCoverPageSubTitle(readString(source, "coverPageSubTitle"));
		tp.setCoverPageTitle(readString(source, "coverPageTitle"));
		tp.setCoverPageVersion(readString(source, "coverPageVersion"));
		tp.setDescription(readString(source, "description"));
		tp.setId(readMongoId(source));
		tp.setLastUpdateDate(readString(source, "lastUpdateDate"));
		tp.setName(readString(source, "name"));
		tp.setType(readString(source, "type"));
		tp.setVersion(readString(source, "version"));
		System.out.println("<==convertEND");
		return tp;
	}
	
	private TestCaseGroup group(DBObject source) {
		TestCaseGroup tcg = new TestCaseGroup();
		tcg.setDescription(readString(source, "description"));
		tcg.setId(readMongoId(source));
		tcg.setName(readString(source, "name"));
		tcg.setPosition((Integer) source.get("position"));
		BasicDBList testcaseDBList = (BasicDBList) source.get("testcases");
		for (Object testcaseObject : testcaseDBList) {
			DBObject testcaseDBObject = (DBObject) testcaseObject;
			tcg.addTestCase(testcase(testcaseDBObject));
		}
		tcg.setType(readString(source, "type"));
		tcg.setVersion((Integer) source.get("version"));
		return tcg;
	}

	private TestCase testcase(DBObject source) {
		TestCase tc = new TestCase();
		
		tc.setDescription(readString(source, "description"));
		tc.setId(readMongoId(source));
		tc.setName(readString(source, "name"));
		tc.setPosition((Integer) source.get("position"));
		tc.setProtocol(readString(source, "protocol"));
		
		DBObject testCaseStoryDBObject = (DBObject)source.get("testCaseStory");
		tc.setTestCaseStory(testStory(testCaseStoryDBObject));
		
		BasicDBList teststepDBList = (BasicDBList) source.get("teststeps");
		for (Object teststepObject : teststepDBList) {
			DBObject teststepDBObject = (DBObject) teststepObject;
			tc.addTestStep(teststep(teststepDBObject));
		}
		tc.setType(readString(source, "type"));
		tc.setVersion((Integer) source.get("version"));
		
		return tc;
	}
	
	private TestStep teststep(DBObject source){
		TestStep ts = new TestStep();
		ts.setConformanceProfileId(readString(source, "conformanceProfileId"));
		ts.setDescription(readString(source, "description"));
		ts.setEr7Message(readString(source, "er7Message"));
		ts.setIntegrationProfileId(readString(source, "integrationProfileId"));
		ts.setName(readString(source, "name"));
		ts.setPosition((Integer) source.get("position"));
		DBObject testStepStoryDBObject = (DBObject)source.get("testStepStory");
		ts.setTestStepStory(testStory(testStepStoryDBObject));
		ts.setType(readString(source, "type"));
		ts.setVersion((Integer) source.get("version"));
		return ts;
	}
	
	private TestStory testStory(DBObject source) {
		TestStory story = new TestStory();
		if(source != null) {
			story.setComments(readString(source, "comments"));
			story.setEvaluationCriteria(readString(source, "evaluationCriteria"));
			story.setNotes(readString(source, "notes"));
			story.setPostCondition(readString(source, "postCondition"));
			story.setPreCondition(readString(source, "preCondition"));
			story.setTestObjectives(readString(source, "testObjectives"));
			story.setTeststorydesc(readString(source, "teststorydesc"));
		}
		
		return story;
	}

	private String readMongoId(DBObject source) {
		if (source.get("_id") != null) {
			if (source.get("_id") instanceof ObjectId) {
				return ((ObjectId) source.get("_id")).toString();
			} else {
				return (String) source.get("_id");
			}
		} else if (source.get("id") != null) {
			if (source.get("id") instanceof ObjectId) {
				return ((ObjectId) source.get("id")).toString();
			} else {
				return (String) source.get("id");
			}
		}
		return null;
	}

	private Long readLong(DBObject source, String tag) {
		if (source.get(tag) != null) {
			if (source.get(tag) instanceof Integer) {
				return Long.valueOf((Integer) source.get(tag));
			} else if (source.get(tag) instanceof String) {
				return Long.valueOf((String) source.get(tag));
			} else if (source.get(tag) instanceof Long) {
				return Long.valueOf((Long) source.get(tag));
			}
		}
		return Long.valueOf(0);
	}

	private String readString(DBObject source, String tag) {
		if (source.get(tag) != null) {
			return String.valueOf((String) source.get(tag));
		}
		return "";
	}
}
