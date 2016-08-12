package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.net.UnknownHostException;
import java.util.List;

import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoDbFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.mongodb.MongoClient;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DatatypeLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatypes;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segments;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.TableLink;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Tables;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfileMetaDataPreLib;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfilePreLib;

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
	
	private Table findTableById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Table.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}

	private Segment findSegmentById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Segment.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}

	private Datatype findDatatypeById(String id) {
		try {
			return mongoOps.findOne(Query.query(Criteria.where("_id").is(id)), Datatype.class);

		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return null;
	}
	
	

	public ProfilePreLib convertIGAMT2TCAMT(Profile p, String igName, String igId) {
		ProfilePreLib ppl = new ProfilePreLib();
		ppl.setAccountId(p.getAccountId());
		ppl.setBaseId(p.getBaseId());
		ppl.setChanges(p.getChanges());
		ppl.setComment(p.getComment());
		ppl.setConstraintId(p.getConstraintId());
		ppl.setId(p.getId());
		ppl.setScope(p.getScope());
		ppl.setSectionContents(p.getSectionContents());
		ppl.setSectionDescription(p.getSectionDescription());
		ppl.setSectionPosition(p.getSectionPosition());
		ppl.setSectionTitle(igName);
		ppl.setSourceId(p.getSourceId());
		ppl.setType(p.getType());
		ppl.setUsageNote(p.getUsageNote());

		ProfileMetaDataPreLib profileMetaDataPreLib = new ProfileMetaDataPreLib();
		profileMetaDataPreLib.setEncodings(p.getMetaData().getEncodings());
		profileMetaDataPreLib.setExt(p.getMetaData().getExt());
		profileMetaDataPreLib.setHl7Version(p.getMetaData().getHl7Version());
		profileMetaDataPreLib.setSchemaVersion(p.getMetaData().getSchemaVersion());
		profileMetaDataPreLib.setXmlId(igId);
		profileMetaDataPreLib.setSpecificationName(p.getMetaData().getSpecificationName());
		profileMetaDataPreLib.setStatus(p.getMetaData().getStatus());
		profileMetaDataPreLib.setSubTitle(p.getMetaData().getSubTitle());
		profileMetaDataPreLib.setTopics(p.getMetaData().getTopics());
		profileMetaDataPreLib.setType(p.getMetaData().getType());
		ppl.setMetaData(profileMetaDataPreLib);
		ppl.setMessages(p.getMessages());

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
			if(link.getExt() != null && !link.getExt().equals("")){
				dt.setLabel(link.getName() + "_" + link.getExt());
			}else {
				dt.setLabel(link.getName());
			}
			datatypes.addDatatype(dt);
		}
		ppl.setDatatypes(datatypes);

		Segments segments = new Segments();
		segments.setId(p.getSegmentLibrary().getId());
		segments.setSectionContents(p.getSegmentLibrary().getSectionContents());
		segments.setSectionDescription(p.getSegmentLibrary().getSectionDescription());
		segments.setSectionPosition(p.getSegmentLibrary().getSectionPosition());
		segments.setSectionTitle(p.getSegmentLibrary().getSectionTitle());
		segments.setType(p.getSegmentLibrary().getType());
		for (SegmentLink link : p.getSegmentLibrary().getChildren()) {
			Segment seg = this.findSegmentById(link.getId());
			if(link.getExt() != null && !link.getExt().equals("")){
				seg.setLabel(link.getName()  + "_" + link.getExt()); 
			}else {
				seg.setLabel(link.getName());
			}
			segments.addSegment(seg);
		}
		ppl.setSegments(segments);

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
			t.setBindingIdentifier(link.getBindingIdentifier());
			tables.addTable(t);
		}
		ppl.setTables(tables);

		return ppl;
	}
	
	
	public static void main(String[] args) {
		IGAMTDBConn con = new IGAMTDBConn();		
		IGDocument igd = con.getUserDocument(10).get(0);

		con.convertIGAMT2TCAMT(igd.getProfile(), "XXX", "RRR");
	}
}
