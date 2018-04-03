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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.mongodb.MongoException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.BindingStrength;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Component;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ConformanceContext;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ConformanceContextMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ConformanceProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ConformanceProfileMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ConformanceStatement;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Field;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Group;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.IntegrationProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.IntegrationProfileMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Predicate;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Usage;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ValueElement;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ValueSetDefinition;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ValueSetLibrary;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ValueSetLibraryMetaData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.ProfileRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.util.XMLManager;

@Service
public class ProfileServiceImpl implements ProfileService {
  Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);
  @Autowired
  private ProfileRepository profileRepository;

  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public ProfileData save(ProfileData data) throws Exception {
    try {
      IntegrationProfile integrationProfile = new IntegrationProfile();
      IntegrationProfileMetaData integrationProfileMetaData = new IntegrationProfileMetaData();
      Document profileDom = XMLManager.stringToDom(data.getProfileXMLFileStr());
      Element conformanceProfileElm =
          (Element) profileDom.getElementsByTagName("ConformanceProfile").item(0);
      Element profileMetaDataElm = (Element) profileDom.getElementsByTagName("MetaData").item(0);
      integrationProfileMetaData.setId(conformanceProfileElm.getAttribute("ID"));
      integrationProfileMetaData.setDate(profileMetaDataElm.getAttribute("Date"));
      integrationProfileMetaData.setHl7Version(conformanceProfileElm.getAttribute("HL7Version"));
      integrationProfileMetaData.setName(profileMetaDataElm.getAttribute("Name"));
      integrationProfileMetaData.setOrgName(profileMetaDataElm.getAttribute("OrgName"));
      integrationProfileMetaData
          .setSpecificationName(profileMetaDataElm.getAttribute("SpecificationName"));
      integrationProfileMetaData.setType(conformanceProfileElm.getAttribute("Type"));
      integrationProfileMetaData.setVersion(profileMetaDataElm.getAttribute("Version"));
      integrationProfile.setIntegrationProfileMetaData(integrationProfileMetaData);

      NodeList messageNodeList = profileDom.getElementsByTagName("Message");
      for (int i = 0; i < messageNodeList.getLength(); i++) {
        ConformanceProfile conformanceProfile = new ConformanceProfile();
        ConformanceProfileMetaData conformanceProfileMetaData = new ConformanceProfileMetaData();
        Element messageElm = (Element) messageNodeList.item(i);
        conformanceProfileMetaData.setDescription(messageElm.getAttribute("Description"));
        conformanceProfileMetaData.setEvent(messageElm.getAttribute("Event"));
        conformanceProfileMetaData.setId(messageElm.getAttribute("ID"));
        conformanceProfileMetaData.setIdentifier(messageElm.getAttribute("Identifier"));
        conformanceProfileMetaData.setName(messageElm.getAttribute("Name"));
        conformanceProfileMetaData.setStructId(messageElm.getAttribute("StructID"));
        conformanceProfileMetaData.setType(messageElm.getAttribute("Type"));
        conformanceProfile.setConformanceProfileMetaData(conformanceProfileMetaData);

        for (int j = 0; j < messageElm.getChildNodes().getLength(); j++) {
          Node childNode = messageElm.getChildNodes().item(j);
          if (childNode.getNodeName() != null && childNode.getNodeName().equals("Segment")) {
            conformanceProfile.addChild(this.parseSegmentRef((Element)childNode));
          } else if (childNode.getNodeName() != null && childNode.getNodeName().equals("Group")) {
            conformanceProfile.addChild(this.parseGroup((Element)childNode));
          }
        }

        integrationProfile.addConformanceProfile(conformanceProfile);
      }

      NodeList segmentNodeList = profileDom.getElementsByTagName("Segment");
      for (int i = 0; i < segmentNodeList.getLength(); i++) {
        Element segmentElm = (Element) segmentNodeList.item(i);
        Segment segment = new Segment();
        segment.setName(segmentElm.getAttribute("Name"));
        segment.setLabel(segmentElm.getAttribute("Label"));
        segment.setId(segmentElm.getAttribute("ID"));
        segment.setDescription(segmentElm.getAttribute("Description"));

        for (int j = 0; j < segmentElm.getChildNodes().getLength(); j++) {
          Node childNode = segmentElm.getChildNodes().item(j);

          if (childNode.getNodeName() != null && childNode.getNodeName().equals("Field")) {
            Element childElm = (Element)childNode;
            Field f = new Field();
            if(childElm.getAttribute("Binding") != null && !childElm.getAttribute("Binding").equals("")) f.setBindingId(childElm.getAttribute("Binding"));
            if(childElm.getAttribute("BindingLocation") != null && !childElm.getAttribute("BindingLocation").equals("")) f.setBindingLocation(childElm.getAttribute("BindingLocation"));
            if(childElm.getAttribute("BindingStrength") != null && !childElm.getAttribute("BindingStrength").equals("")) f.setBindingStrength(BindingStrength.fromValue(childElm.getAttribute("BindingStrength")));
            f.setDatatypeId(childElm.getAttribute("Datatype"));
            f.setMax(childElm.getAttribute("Max"));
            f.setMaxLength(childElm.getAttribute("MaxLength"));
            f.setMin(Integer.parseInt(childElm.getAttribute("Min")));
            f.setMinLength(Integer.parseInt(childElm.getAttribute("MinLength")));
            f.setName(childElm.getAttribute("Name"));
            f.setUsage(Usage.fromValue(childElm.getAttribute("Usage")));
            segment.addField(f);
          }
        }
        integrationProfile.addSegment(segment);
      }

      NodeList datatypeNodeList = profileDom.getElementsByTagName("Datatype");
      for (int i = 0; i < datatypeNodeList.getLength(); i++) {
        Element datatypeElm = (Element) datatypeNodeList.item(i);
        Datatype datatype = new Datatype();
        datatype.setName(datatypeElm.getAttribute("Name"));
        datatype.setLabel(datatypeElm.getAttribute("Label"));
        datatype.setId(datatypeElm.getAttribute("ID"));
        datatype.setDescription(datatypeElm.getAttribute("Description"));

        for (int j = 0; j < datatypeElm.getChildNodes().getLength(); j++) {
          Node childNode = datatypeElm.getChildNodes().item(j);

          if (childNode.getNodeName() != null && childNode.getNodeName().equals("Component")) {
            Element childElm = (Element)childNode;
            Component c = new Component();
            if(childElm.getAttribute("Binding") != null && !childElm.getAttribute("Binding").equals("")) c.setBindingId(childElm.getAttribute("Binding"));
            if(childElm.getAttribute("BindingLocation") != null && !childElm.getAttribute("BindingLocation").equals("")) c.setBindingLocation(childElm.getAttribute("BindingLocation"));
            if(childElm.getAttribute("BindingStrength") != null && !childElm.getAttribute("BindingStrength").equals("")) c.setBindingStrength(BindingStrength.fromValue(childElm.getAttribute("BindingStrength")));
            c.setDatatypeId(childElm.getAttribute("Datatype"));
            c.setMaxLength(childElm.getAttribute("MaxLength"));
            c.setMinLength(Integer.parseInt(childElm.getAttribute("MinLength")));
            c.setName(childElm.getAttribute("Name"));
            c.setUsage(Usage.fromValue(childElm.getAttribute("Usage")));
            datatype.addComponent(c);
          }
        }
        integrationProfile.addDatatype(datatype);
      }

      data.setIntegrationProfile(integrationProfile);


      ValueSetLibrary valueSetLibrary = new ValueSetLibrary();
      ValueSetLibraryMetaData valueSetLibraryMetaData = new ValueSetLibraryMetaData();
      Document valueSetDom = XMLManager.stringToDom(data.getValueSetXMLFileStr());
      Element valueSetLibraryElm =
          (Element) valueSetDom.getElementsByTagName("ValueSetLibrary").item(0);
      Element valueSetMetaDataElm = (Element) valueSetDom.getElementsByTagName("MetaData").item(0);
      valueSetLibraryMetaData.setDate(valueSetMetaDataElm.getAttribute("Date"));
      valueSetLibraryMetaData.setId(valueSetLibraryElm.getAttribute("ValueSetLibraryIdentifier"));
      valueSetLibraryMetaData.setName(valueSetMetaDataElm.getAttribute("Name"));
      valueSetLibraryMetaData.setOrgName(valueSetMetaDataElm.getAttribute("OrgName"));
      valueSetLibraryMetaData
          .setSpecificationName(valueSetMetaDataElm.getAttribute("SpecificationName"));
      valueSetLibraryMetaData.setVersion(valueSetMetaDataElm.getAttribute("Version"));
      valueSetLibrary.setMetaData(valueSetLibraryMetaData);
      
      Element noValidationElm = (Element) valueSetDom.getElementsByTagName("NoValidation").item(0);
      NodeList noValidationNodeList = noValidationElm.getElementsByTagName("BindingIdentifier");
      for (int i = 0; i < noValidationNodeList.getLength(); i++) {
        Element noValidationItemElm = (Element) noValidationNodeList.item(i);
        valueSetLibrary.addNoValidation(noValidationItemElm.getTextContent());
      }
      
      NodeList valueSetDefinitionsNodeList = valueSetDom.getElementsByTagName("ValueSetDefinitions");
      for (int i = 0; i < valueSetDefinitionsNodeList.getLength(); i++) {
        Element valueSetDefinitionsElm = (Element) valueSetDefinitionsNodeList.item(i);
        String groupName = valueSetDefinitionsElm.getAttribute("Group");
        String order = valueSetDefinitionsElm.getAttribute("Order");
        
        NodeList valueSetDefinitionNodeList = valueSetDefinitionsElm.getElementsByTagName("ValueSetDefinition");
        for (int j = 0; j < valueSetDefinitionNodeList.getLength(); j++) {
          Element valueSetDefinitionElm = (Element) valueSetDefinitionNodeList.item(j);
          String bindingIdentifier = valueSetDefinitionElm.getAttribute("BindingIdentifier");
          String name = valueSetDefinitionElm.getAttribute("Name");
          
          ValueSetDefinition valueSetDefinition = new ValueSetDefinition();
          valueSetDefinition.setName(name);
          if(order != null && !order.equals("")) {
            valueSetDefinition.setOrder(Integer.parseInt(order));
          }
          valueSetDefinition.setGroup(groupName);
          valueSetDefinition.setBindingIdentifier(bindingIdentifier);
          
          NodeList valueElementNodeList = valueSetDefinitionElm.getElementsByTagName("ValueElement");
          for (int k = 0; k < valueElementNodeList.getLength(); k++) {
            Element valueElm = (Element) valueElementNodeList.item(k);
            ValueElement ve = new ValueElement();
            ve.setCodeSystem(valueElm.getAttribute("CodeSystem"));
            ve.setDisplayName(valueElm.getAttribute("DisplayName"));
            ve.setValue(valueElm.getAttribute("Value"));
            valueSetDefinition.addValueElement(ve);
          }
          valueSetLibrary.addValueSetDefinition(valueSetDefinition);
        }
      }
      data.setValueSetLibrary(valueSetLibrary);

      ConformanceContext conformanceContext = new ConformanceContext();
      ConformanceContextMetaData conformanceContextMetaData = new ConformanceContextMetaData();
      Document constraintDom = XMLManager.stringToDom(data.getConstraintsXMLFileStr());
      Element conformanceContextElm =
          (Element) constraintDom.getElementsByTagName("ConformanceContext").item(0);
      Element constraintMetaDataElm =
          (Element) constraintDom.getElementsByTagName("MetaData").item(0);
      conformanceContextMetaData.setDate(constraintMetaDataElm.getAttribute("Date"));
      conformanceContextMetaData.setId(conformanceContextElm.getAttribute("UUID"));
      conformanceContextMetaData.setName(constraintMetaDataElm.getAttribute("Name"));
      conformanceContextMetaData.setOrgName(constraintMetaDataElm.getAttribute("OrgName"));
      conformanceContextMetaData.setSpecificationName(constraintMetaDataElm.getAttribute("SpecificationName"));
      conformanceContextMetaData.setVersion(constraintMetaDataElm.getAttribute("Version"));
      conformanceContext.setMetaData(conformanceContextMetaData);
      
      Element predicatesElm = (Element) constraintDom.getElementsByTagName("Predicates").item(0);
      Element predicateDatatypesElm = (Element) predicatesElm.getElementsByTagName("Datatype").item(0);
      Element predicateSegmentsElm = (Element) predicatesElm.getElementsByTagName("Segment").item(0);
      Element predicateGroupsElm = (Element) predicatesElm.getElementsByTagName("Group").item(0);
      Element predicateMessagesElm = (Element) predicatesElm.getElementsByTagName("Message").item(0);
      conformanceContext.setDatatypePredicates(this.convertPredicates(predicateDatatypesElm));
      conformanceContext.setSegmentPredicates(this.convertPredicates(predicateSegmentsElm));
      conformanceContext.setGroupPredicates(this.convertPredicates(predicateGroupsElm));
      conformanceContext.setMessagePredicates(this.convertPredicates(predicateMessagesElm));
      
      Element conformanceStatementsElm = (Element) constraintDom.getElementsByTagName("Constraints").item(0);
      Element conformanceStatementDatatypesElm = (Element) conformanceStatementsElm.getElementsByTagName("Datatype").item(0);
      Element conformanceStatementSegmentsElm = (Element) conformanceStatementsElm.getElementsByTagName("Segment").item(0);
      Element conformanceStatementGroupsElm = (Element) conformanceStatementsElm.getElementsByTagName("Group").item(0);
      Element conformanceStatementMessagesElm = (Element) conformanceStatementsElm.getElementsByTagName("Message").item(0);
      conformanceContext.setDatatypeConformanceStatements(this.convertConformanceStatements(conformanceStatementDatatypesElm));
      conformanceContext.setGroupConformanceStatements(this.convertConformanceStatements(conformanceStatementGroupsElm));
      conformanceContext.setMessageConformanceStatements(this.convertConformanceStatements(conformanceStatementMessagesElm));
      conformanceContext.setSegmentConformanceStatements(this.convertConformanceStatements(conformanceStatementSegmentsElm));

      data.setConformanceContext(conformanceContext);

      ProfileData result = profileRepository.save(data);
      
      return result;
    } catch (MongoException e) {
      throw new Exception(e);
    }
  }

  private Set<ConformanceStatement> convertConformanceStatements(Element elm) {
    if(elm != null) {
      Set<ConformanceStatement> conformanceStatements = new HashSet<ConformanceStatement>();
      NodeList byIdNodeList = elm.getElementsByTagName("ByID");
      NodeList byNameNodeList = elm.getElementsByTagName("ByName");
      for (int i = 0; i < byIdNodeList.getLength(); i++) {
        Element byIdElm = (Element) byIdNodeList.item(i);
        String id = byIdElm.getAttribute("ID");
        NodeList constraintNodeList = byIdElm.getElementsByTagName("Constraint");
        
        for(int j=0; j < constraintNodeList.getLength(); j++) {
          conformanceStatements.add(this.convertConformanceStatement((Element)constraintNodeList.item(j), id, null));
        }
      }
      for (int i = 0; i < byNameNodeList.getLength(); i++) {
        Element byNameElm = (Element) byNameNodeList.item(i);
        String name = byNameElm.getAttribute("Name");
        NodeList constraintNodeList = byNameElm.getElementsByTagName("Constraint");
        for(int j=0; j < constraintNodeList.getLength(); j++) {
          conformanceStatements.add(this.convertConformanceStatement((Element)constraintNodeList.item(j), null, name));
        }
      }
      if(conformanceStatements.size() > 0) return conformanceStatements;      
    }

    return null;
  }

  private Set<Predicate> convertPredicates(Element elm) {
    if(elm != null) {
      Set<Predicate> predicates = new HashSet<Predicate>();
      NodeList byIdNodeList = elm.getElementsByTagName("ByID");
      NodeList byNameNodeList = elm.getElementsByTagName("ByName");
      for (int i = 0; i < byIdNodeList.getLength(); i++) {
        Element byIdElm = (Element) byIdNodeList.item(i);
        String id = byIdElm.getAttribute("ID");
        NodeList predicateNodeList = byIdElm.getElementsByTagName("Predicate");
        
        for(int j=0; j < predicateNodeList.getLength(); j++) {
          predicates.add(this.convertPredicate((Element)predicateNodeList.item(j), id, null));
        }
      }
      for (int i = 0; i < byNameNodeList.getLength(); i++) {
        Element byNameElm = (Element) byNameNodeList.item(i);
        String name = byNameElm.getAttribute("Name");
        NodeList predicateNodeList = byNameElm.getElementsByTagName("Predicate");
        for(int j=0; j < predicateNodeList.getLength(); j++) {
          predicates.add(this.convertPredicate((Element)predicateNodeList.item(j), null, name));
        }
      }
      if(predicates.size() > 0) return predicates;      
    }

    return null;
  }

  private Predicate convertPredicate(Element elm, String id, String name) {
    Predicate p = new Predicate();
    p.setById(id);
    p.setByName(name);
    Element descriptionElm = (Element) elm.getElementsByTagName("Description").item(0);
    p.setDescription(descriptionElm.getTextContent());
    p.setFalseUsage(Usage.fromValue(elm.getAttribute("FalseUsage")));
    p.setTrueUsage(Usage.fromValue(elm.getAttribute("TrueUsage")));
    p.setTarget(elm.getAttribute("Target"));
    return p;
  }
  
  private ConformanceStatement convertConformanceStatement(Element elm, String id, String name) {
    ConformanceStatement cs = new ConformanceStatement();
    cs.setById(id);
    cs.setByName(name);
    Element descriptionElm = (Element) elm.getElementsByTagName("Description").item(0);
    cs.setDescription(descriptionElm.getTextContent());
    cs.setCsId(elm.getAttribute("ID"));
    return cs;
  }

  /**
   * @param childElm
   * @return
   */
  private Group parseGroup(Element groupElm) {
    Group group = new Group();
    group.setId(groupElm.getAttribute("ID"));
    group.setMax(groupElm.getAttribute("Max"));
    group.setMin(Integer.parseInt(groupElm.getAttribute("Min")));
    group.setName(groupElm.getAttribute("Name"));
    group.setUsage(Usage.fromValue(groupElm.getAttribute("Usage")));

    for (int i = 0; i < groupElm.getChildNodes().getLength(); i++) {
      Node childNode = groupElm.getChildNodes().item(i);
      if (childNode.getNodeName() != null && childNode.getNodeName().equals("Segment")) {
        group.addChild(this.parseSegmentRef((Element)childNode));
      } else if (childNode.getNodeName() != null && childNode.getNodeName().equals("Group")) {
        group.addChild(this.parseGroup((Element)childNode));
      }
    }

    return group;
  }

  /**
   * @param childElm
   * @return
   */
  private SegmentRef parseSegmentRef(Element segmentElm) {
    SegmentRef segmentRef = new SegmentRef();
    segmentRef.setMax(segmentElm.getAttribute("Max"));
    segmentRef.setMin(Integer.parseInt(segmentElm.getAttribute("Min")));
    segmentRef.setRef(segmentElm.getAttribute("Ref"));
    segmentRef.setUsage(Usage.fromValue(segmentElm.getAttribute("Usage")));
    return segmentRef;
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
    List<ProfileData> profiles =
        profileRepository.findByAccountIdAndSourceType(accountId, sourceType);
    return profiles;
  }
}
