package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.net.UnknownHostException;
import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoDbFactory;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.mongodb.MongoClient;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DatatypeLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.TableLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.User;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Datatypes;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Messages;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Profile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segments;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Tables;

public class IGAMTDBConn {
	private MongoOperations mongoOps;
	
	public IGAMTDBConn() {
		
		super();
		try {
			mongoOps = new MongoTemplate(new SimpleMongoDbFactory(new MongoClient(), "igamt"));
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public List<IGDocument> getUserDocument(long id) {
		try {
			return mongoOps.find(Query.query(Criteria.where("accountId").is(id)), IGDocument.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}

	public IGDocument findIGDocument(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), IGDocument.class);

		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			e.printStackTrace();
		}
		
		return null;
	}
	
	public Table findTableById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Table.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}

	public Segment findSegmentById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Segment.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}

	public Datatype findDatatypeById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Datatype.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}
	
	

	public Profile convertIGAMT2TCAMT(gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile p, String igName, String igId, Date date) {
		Profile tcamtProfile = new Profile();
		tcamtProfile.setAccountId(p.getAccountId());
		tcamtProfile.setId(igId);
		tcamtProfile.setSectionContents(p.getSectionContents());
		tcamtProfile.setSectionDescription(p.getSectionDescription());
		tcamtProfile.setSectionPosition(p.getSectionPosition());
		tcamtProfile.setSectionTitle(igName);
		tcamtProfile.setType(p.getType());
		tcamtProfile.setLastUpdatedDate(date);
		tcamtProfile.setMetaData(p.getMetaData());
		Messages messages = new Messages();
		messages.setId(p.getMessages().getId());
		messages.setType(p.getMessages().getType());
		messages.setChildren(p.getMessages().getChildren());
		
		tcamtProfile.setMessages(messages);

		Datatypes datatypes = new Datatypes();
		datatypes.setId(p.getDatatypeLibrary().getId());
		datatypes.setSectionContents(p.getDatatypeLibrary().getSectionContents());
		datatypes.setSectionDescription(p.getDatatypeLibrary().getSectionDescription());
		datatypes.setSectionDescription(p.getDatatypeLibrary().getSectionDescription());
		datatypes.setSectionPosition(p.getDatatypeLibrary().getSectionPosition());
		datatypes.setSectionTitle(p.getDatatypeLibrary().getSectionTitle());
		datatypes.setType(p.getDatatypeLibrary().getType());
		for (DatatypeLink link : p.getDatatypeLibrary().getChildren()) {
			Datatype dt = this.findDatatypeById(link.getId());
			datatypes.addDatatype(dt);
		}
		tcamtProfile.setDatatypes(datatypes);

		Segments segments = new Segments();
		segments.setId(p.getSegmentLibrary().getId());
		segments.setSectionContents(p.getSegmentLibrary().getSectionContents());
		segments.setSectionDescription(p.getSegmentLibrary().getSectionDescription());
		segments.setSectionPosition(p.getSegmentLibrary().getSectionPosition());
		segments.setSectionTitle(p.getSegmentLibrary().getSectionTitle());
		segments.setType(p.getSegmentLibrary().getType());
		for (SegmentLink link : p.getSegmentLibrary().getChildren()) {
			Segment seg = this.findSegmentById(link.getId());
			segments.addSegment(seg);
		}
		tcamtProfile.setSegments(segments);

		Tables tables = new Tables();
		tables.setDateCreated(p.getTableLibrary().getMetaData().getDate());
		tables.setDescription(p.getTableLibrary().getDescription());
		tables.setId(p.getTableLibrary().getId());
		tables.setName(p.getTableLibrary().getProfileName());
		tables.setOrganizationName(p.getTableLibrary().getOrganizationName());
		tables.setProfileName(p.getTableLibrary().getProfileName());
		tables.setSectionContents(p.getTableLibrary().getSectionContents());
		tables.setSectionDescription(p.getTableLibrary().getSectionDescription());
		tables.setSectionPosition(p.getTableLibrary().getSectionPosition());
		tables.setSectionTitle(p.getTableLibrary().getSectionTitle());
		tables.setStatus(p.getTableLibrary().getStatus());
		tables.setType(p.getTableLibrary().getType());
		tables.setValueSetLibraryIdentifier(p.getTableLibrary().getValueSetLibraryIdentifier());
		tables.setValueSetLibraryVersion(p.getTableLibrary().getValueSetLibraryVersion());
		for (TableLink link : p.getTableLibrary().getChildren()) {
			Table t = this.findTableById(link.getId());
			tables.addTable(t);
		}
		tcamtProfile.setTables(tables);

		return tcamtProfile;
	}

	public Datatype findByNameAndVesionAndScope(String name, String hl7Version, String scope) {
		BasicQuery query1 = new BasicQuery("{ name : '" + name + "', hl7Version : '" + hl7Version + "', scope : '" + scope + "'}");
	    return mongoOps.findOne(query1, Datatype.class);
	}
}
