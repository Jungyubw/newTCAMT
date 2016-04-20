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

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

import com.mongodb.DBObject;

@ReadingConverter
public class TestPlanReadConverter implements Converter<DBObject, TestPlan> {

	private static final Logger log = LoggerFactory
			.getLogger(TestPlanReadConverter.class);

	public TestPlanReadConverter() {
		log.info("IGDocument Read Converter Created");
	}

	@Override
	public TestPlan convert(DBObject source) {
		System.out.println("convert==>");
		TestPlan tp = new TestPlan();
		tp.setAccountId(readLong(source, "accountId"));
		tp.setCoverPageDate(readString(source, "coverPageDate"));
		tp.setCoverPageSubTitle(readString(source, "coverPageSubTitle"));
		tp.setCoverPageTitle(readString(source, "coverPageTitle"));
		tp.setCoverPageVersion(readString(source, "coverPageVersion"));
		tp.setDescription(readString(source, "description"));
		tp.setId(readMongoId(source));
		tp.setJurorDocumentEnable((boolean) source.get("jurorDocumentEnable"));
		tp.setLastUpdateDate(readString(source, "lastUpdateDate"));
		tp.setName(readString(source, "name"));
		tp.setPosition((Integer) source.get("position"));
		tp.setType(readString(source, "type"));
		tp.setVersion(readString(source, "version"));
		// tp.setTestcasegroups(testcasegroups);
		// tp.setTestcases(testcases);
		System.out.println("<==convertEND");
		return tp;
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
