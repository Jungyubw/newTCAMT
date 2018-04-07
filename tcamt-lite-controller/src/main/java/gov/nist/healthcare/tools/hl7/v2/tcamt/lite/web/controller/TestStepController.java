package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.ComponentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.FieldNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SegmentInfo;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SegmentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SubComponentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Component;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ConformanceProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Datatype;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Field;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Group;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.IntegrationProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Predicate;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segment;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Usage;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentInstanceData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.util.XMLManager;

@RestController
@RequestMapping("/teststep")

public class TestStepController extends CommonController {

  Logger log = LoggerFactory.getLogger(TestStepController.class);

  @Autowired
  ProfileService profileService;


  private List<SegmentInfo> segmentsInfoList = new ArrayList<SegmentInfo>();

  private ProfileData profileData;

  private int repeatedNum = 1;
  private int currentPosition = 0;
  private Map<String, Integer> segmantCountMap;

  @RequestMapping(value = "/getSegmentList", method = RequestMethod.POST)
  public List<SegmentInstanceData> popSegmentList(@RequestBody TestStepParams params) {

    if (params.getIntegrationProfileId() != null) {
      this.profileData = null;
      this.profileData = profileService.findOne(params.getIntegrationProfileId());
      if (profileData != null && profileData.getIntegrationProfile() != null
          && params.getConformanceProfileId() != null) {

        ConformanceProfile cp = profileData.getIntegrationProfile()
            .findConformanceProfileById(params.getConformanceProfileId());

        if (cp != null && params.getEr7Message() != null
            && params.getEr7Message().startsWith("MSH")) {

          List<SegmentInstanceData> segmentInstanceDataList = new ArrayList<SegmentInstanceData>();
          segmantCountMap = new HashMap<String, Integer>();

          String[] listLineOfMessage = params.getEr7Message().split("\n");
          int lineNum = 0;


          for (String line : listLineOfMessage) {
            lineNum = lineNum + 1;
            SegmentInstanceData segmentInstanceData = new SegmentInstanceData();
            segmentInstanceData.setLineStr(line);
            segmentInstanceData.setSegmentName(line.substring(0, 3));
            segmentInstanceData.setLineNum(lineNum);
            segmentInstanceDataList.add(segmentInstanceData);

            if (segmantCountMap.containsKey(segmentInstanceData.getSegmentName())) {
              segmantCountMap.put(segmentInstanceData.getSegmentName(),
                  segmantCountMap.get(segmentInstanceData.getSegmentName()) + 1);
            } else {
              segmantCountMap.put(segmentInstanceData.getSegmentName(), 1);
            }
          }

          for (String key : segmantCountMap.keySet()) {
            if (this.repeatedNum < segmantCountMap.get(key))
              this.repeatedNum = segmantCountMap.get(key);
          }

          segmentsInfoList = new ArrayList<SegmentInfo>();
          int index = 0;
          for (SegmentRefOrGroup srog : cp.getChildren()) {
            index = index + 1;
            this.analyzeSegmentRefOrGroup(srog, index, "", "", "", "", "", false);
          }

          this.currentPosition = 0;

          for (SegmentInstanceData sid : segmentInstanceDataList) {
            SegmentInfo sInfo = this.findSegmentInfo(sid.getSegmentName());
            if (sInfo != null) {
              sid.setiPath(sInfo.getiPath());
              sid.setPath(sInfo.getPath());
              sid.setPositionIPath(sInfo.getiPositionPath());
              sid.setPositionPath(sInfo.getPositionPath());
              sid.setSegmentDef(sInfo.getSegment());
              sid.setUsagePath(sInfo.getUsagePath());
            }
          }

          return segmentInstanceDataList;
        }
      }
    }

    return null;
  }

  @RequestMapping(value = "/getSegmentNode", method = RequestMethod.POST)
  public SegmentNode popSegmentNode(@RequestBody SegmentParams params) {
    SegmentNode segmentNode = new SegmentNode();

    if (params.getIntegrationProfileId() != null) {
      this.profileData = null;
      this.profileData = profileService.findOne(params.getIntegrationProfileId());
      if (profileData != null && profileData.getIntegrationProfile() != null
          && params.getConformanceProfileId() != null && params.getSegmentId() != null) {
        Segment s = profileData.getIntegrationProfile().findSegemntById(params.getSegmentId());
        if (s != null && params.getLineStr() != null
            && params.getLineStr().startsWith(s.getName())) {
          segmentNode.setSegmentName(s.getName());
          segmentNode.setiPath(params.getiPath());
          segmentNode.setiPositionPath(params.getiPositionPath());
          segmentNode.setPath(params.getPath());
          segmentNode.setPostionPath(params.getPositionPath());
          segmentNode.setSegmentId(params.getSegmentId());
          segmentNode.setSegmentStr(params.getLineStr());
          segmentNode.setChildren(this.popFields(s, segmentNode.getSegmentStr(), params));
          return segmentNode;
        }
      }
    }


    return null;
  }

  @RequestMapping(value = "/getXMLs", method = RequestMethod.POST)
  public TestStepXMLOutput getXMLs(@RequestBody TestStepXMLParams params) throws Exception {
    this.profileData = null;
    this.profileData = profileService.findOne(params.getIntegrationProfileId());

    if (this.profileData != null && this.profileData.getIntegrationProfile() != null) {
      ConformanceProfile cp = this.profileData.getIntegrationProfile()
          .findConformanceProfileById(params.getConformanceProfileId());

      if (cp != null) {
        String rootName = cp.getConformanceProfileMetaData().getStructId();
        String xmlString = '<' + rootName + " testcaseName=\"" + params.getTestCaseName() + "\">"
            + "</" + rootName + ">";

        Document stdXMLDoc = XMLManager.stringToDom(xmlString);
        Element rootSTDElm = (Element) stdXMLDoc.getElementsByTagName(rootName).item(0);
        Document nistXMLDoc = XMLManager.stringToDom(xmlString);
        Element rootNISTElm = (Element) nistXMLDoc.getElementsByTagName(rootName).item(0);

        TestStepParams testStepParams = new TestStepParams();
        testStepParams.setConformanceProfileId(params.getConformanceProfileId());
        testStepParams.setEr7Message(params.getEr7Message());
        testStepParams.setIntegrationProfileId(params.getIntegrationProfileId());
        List<SegmentInstanceData> segmentList = this.popSegmentList(testStepParams);

        if (segmentList != null) {
          for (SegmentInstanceData segment : segmentList) {
            String[] iPathList = segment.getiPath().split("\\.");
            if (iPathList.length == 1) {
              Element segmentSTDElm =
                  stdXMLDoc.createElement(iPathList[0].substring(0, iPathList[0].lastIndexOf("[")));
              Element segmentNISTElm = nistXMLDoc
                  .createElement(iPathList[0].substring(0, iPathList[0].lastIndexOf("[")));

              this.generateSTDSegment(segmentSTDElm, segment, stdXMLDoc,
                  this.profileData.getIntegrationProfile());
              this.generateNISTSegment(segmentNISTElm, segment, nistXMLDoc,
                  this.profileData.getIntegrationProfile());

              rootSTDElm.appendChild(segmentSTDElm);
              rootNISTElm.appendChild(segmentNISTElm);
            } else {
              Element parentSTDElm = rootSTDElm;
              Element parentNISTElm = rootNISTElm;

              for (int i = 0; i < iPathList.length; i++) {
                String iPath = iPathList[i];
                if (i == iPathList.length - 1) {
                  Element segmentSTDElm =
                      stdXMLDoc.createElement(iPath.substring(0, iPath.lastIndexOf("[")));
                  Element segmentNISTElm =
                      nistXMLDoc.createElement(iPath.substring(0, iPath.lastIndexOf("[")));
                  this.generateSTDSegment(segmentSTDElm, segment, stdXMLDoc,
                      this.profileData.getIntegrationProfile());
                  this.generateNISTSegment(segmentNISTElm, segment, nistXMLDoc,
                      this.profileData.getIntegrationProfile());

                  parentSTDElm.appendChild(segmentSTDElm);
                  parentNISTElm.appendChild(segmentNISTElm);
                } else {
                  String groupName = iPath.substring(0, iPath.lastIndexOf("["));
                  int groupIndex = Integer.parseInt(
                      iPath.substring(iPath.lastIndexOf("[") + 1, iPath.lastIndexOf("]")));

                  NodeList nodeListSTDgroups =
                      parentSTDElm.getElementsByTagName(rootName + "." + groupName);
                  NodeList nodeListNISTgroups =
                      parentNISTElm.getElementsByTagName(rootName + "." + groupName);

                  if (nodeListSTDgroups == null || nodeListSTDgroups.getLength() < groupIndex) {
                    Element groupSTDElm = stdXMLDoc.createElement(rootName + "." + groupName);
                    parentSTDElm.appendChild(groupSTDElm);
                    parentSTDElm = groupSTDElm;

                  } else {
                    parentSTDElm = (Element) nodeListSTDgroups.item(groupIndex - 1);
                  }

                  if (nodeListNISTgroups == null || nodeListNISTgroups.getLength() < groupIndex) {
                    Element groupNISTElm = nistXMLDoc.createElement(rootName + "." + groupName);
                    parentNISTElm.appendChild(groupNISTElm);
                    parentNISTElm = groupNISTElm;

                  } else {
                    parentNISTElm = (Element) nodeListNISTgroups.item(groupIndex - 1);
                  }
                }
              }
            }
          }

          TestStepXMLOutput testStepXMLOutput = new TestStepXMLOutput();
          testStepXMLOutput.setNistXML(XMLManager.docToString(nistXMLDoc));
          testStepXMLOutput.setStdXML(XMLManager.docToString(stdXMLDoc));

          return testStepXMLOutput;
        }
      }
    }
    return null;
  }


  private void generateNISTSegment(Element segmentElm, SegmentInstanceData instanceSegment,
      Document xmlDoc, IntegrationProfile integrationProfile) {
    String lineStr = instanceSegment.getLineStr();
    String segmentName = lineStr.substring(0, 3);
    Segment segment = instanceSegment.getSegmentDef();

    if (lineStr.startsWith("MSH")) {
      lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
    }

    String[] fieldStrs = lineStr.substring(4).split("\\|");

    for (int i = 0; i < fieldStrs.length; i++) {
      String[] fieldStrRepeats = fieldStrs[i].split("~");
      for (int g = 0; g < fieldStrRepeats.length; g++) {
        String fieldStr = fieldStrRepeats[g];

        if (fieldStr.equals("%SEGMENTDVIDER%")) {
          Element fieldElm = (Element) xmlDoc.createElement("MSH.1");
          Text value = xmlDoc.createTextNode("|");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else if (fieldStr.equals("%ENCODINGDVIDER%")) {
          Element fieldElm = (Element) xmlDoc.createElement("MSH.2");
          Text value = xmlDoc.createTextNode("^~\\&");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else {
          if (fieldStr != null && !fieldStr.equals("")) {
            if (i < segment.getChildren().size()) {
              Field field = segment.getChildren().get(i);
              Element fieldElm = (Element) xmlDoc.createElement(segmentName + "." + (i + 1));
              Datatype fieldDatatype = integrationProfile.findDatatypeById(field.getDatatypeId());
              if (fieldDatatype == null || fieldDatatype.getChildren() == null || fieldDatatype.getChildren().size() == 0) {
                if (lineStr.startsWith("OBX")) {
                  if ((i + 1) == 2) {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  } else if ((i + 1) == 5) {
                    String[] componentStrs = fieldStr.split("\\^");
                    for (int index = 0; index < componentStrs.length; index++) {
                      String componentStr = componentStrs[index];
                      Element componentElm =
                          xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (index + 1));
                      Text value = xmlDoc.createTextNode(componentStr);
                      componentElm.appendChild(value);
                      fieldElm.appendChild(componentElm);
                    }
                  } else {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  }
                } else {
                  Text value = xmlDoc.createTextNode(fieldStr);
                  fieldElm.appendChild(value);
                }
              } else {
                String[] componentStrs = fieldStr.split("\\^");
                for (int j = 0; j < componentStrs.length; j++) {
                  Datatype componentDT = integrationProfile.findDatatypeById(field.getDatatypeId());
                  if (componentDT != null && componentDT.getChildren() != null) {
                    if (j < componentDT.getChildren().size()) {
                      Component component = componentDT.getChildren().get(j);
                      String componentStr = componentStrs[j];
                      if (componentStr != null && !componentStr.equals("")) {
                        Element componentElm =
                            xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (j + 1));
                        Datatype subComponentDT =
                            integrationProfile.findDatatypeById(component.getDatatypeId());
                        if (subComponentDT.getChildren() == null
                            || subComponentDT.getChildren().size() == 0) {
                          Text value = xmlDoc.createTextNode(componentStr);
                          componentElm.appendChild(value);
                        } else {
                          String[] subComponentStrs = componentStr.split("\\&");
                          for (int k = 0; k < subComponentStrs.length; k++) {
                            String subComponentStr = subComponentStrs[k];
                            if (subComponentStr != null && !subComponentStr.equals("")) {
                              Element subComponentElm = xmlDoc.createElement(
                                  segmentName + "." + (i + 1) + "." + (j + 1) + "." + (k + 1));
                              Text value = xmlDoc.createTextNode(subComponentStr);
                              subComponentElm.appendChild(value);
                              componentElm.appendChild(subComponentElm);
                            }
                          }

                        }
                        fieldElm.appendChild(componentElm);
                      }
                    }
                  }

                }

              }
              segmentElm.appendChild(fieldElm);
            }
          }
        }
      }
    }

  }

  private void generateSTDSegment(Element segmentElm, SegmentInstanceData instanceSegment,
      Document xmlDoc, IntegrationProfile integrationProfile) {
    String lineStr = instanceSegment.getLineStr();
    String segmentName = lineStr.substring(0, 3);
    Segment segment = instanceSegment.getSegmentDef();
    String variesDT = "";

    if (lineStr.startsWith("MSH")) {
      lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
    }

    String[] fieldStrs = lineStr.substring(4).split("\\|");

    for (int i = 0; i < fieldStrs.length; i++) {
      String[] fieldStrRepeats = fieldStrs[i].split("\\~");
      for (int g = 0; g < fieldStrRepeats.length; g++) {
        String fieldStr = fieldStrRepeats[g];
        if (fieldStr.equals("%SEGMENTDVIDER%")) {
          Element fieldElm = xmlDoc.createElement("MSH.1");
          Text value = xmlDoc.createTextNode("|");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else if (fieldStr.equals("%ENCODINGDVIDER%")) {
          Element fieldElm = xmlDoc.createElement("MSH.2");
          Text value = xmlDoc.createTextNode("^~\\&");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else {
          if (fieldStr != null && !fieldStr.equals("")) {
            if (i < segment.getChildren().size()) {
              Field field = segment.getChildren().get(i);
              Element fieldElm = xmlDoc.createElement(segmentName + "." + (i + 1));
              Datatype fieldDatatype = integrationProfile.findDatatypeById(field.getDatatypeId());
              if (fieldDatatype == null || fieldDatatype.getChildren() == null || fieldDatatype.getChildren().size() == 0) {
                if (lineStr.startsWith("OBX")) {
                  if ((i + 1) == 2) {
                    variesDT = fieldStr;
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  } else if ((i + 1) == 5) {
                    String[] componentStrs = fieldStr.split("\\^");

                    for (int index = 0; index < componentStrs.length; index++) {
                      String componentStr = componentStrs[index];
                      Element componentElm = xmlDoc.createElement(variesDT + "." + (index + 1));
                      Text value = xmlDoc.createTextNode(componentStr);
                      componentElm.appendChild(value);
                      fieldElm.appendChild(componentElm);
                    }
                  } else {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  }
                } else {
                  Text value = xmlDoc.createTextNode(fieldStr);
                  fieldElm.appendChild(value);
                }
              } else {
                String[] componentStrs = fieldStr.split("\\^");
                Datatype componentDT = integrationProfile.findDatatypeById(field.getDatatypeId());
                String componentDataTypeName = componentDT.getName();
                for (int j = 0; j < componentStrs.length; j++) {
                  if (componentDT.getChildren() != null && j < componentDT.getChildren().size()) {
                    Component component = componentDT.getChildren().get(j);
                    String componentStr = componentStrs[j];
                    if (componentStr != null && !componentStr.equals("")) {
                      Element componentElm =
                          xmlDoc.createElement(componentDataTypeName + "." + (j + 1));
                      Datatype subComponentDT =
                          integrationProfile.findDatatypeById(component.getDatatypeId());
                      if (subComponentDT.getChildren() == null
                          || subComponentDT.getChildren().size() == 0) {
                        Text value = xmlDoc.createTextNode(componentStr);
                        componentElm.appendChild(value);
                      } else {
                        String[] subComponentStrs = componentStr.split("\\&");
                        String subComponentDataTypeName = subComponentDT.getName();

                        for (int k = 0; k < subComponentStrs.length; k++) {
                          String subComponentStr = subComponentStrs[k];
                          if (subComponentStr != null && !subComponentStr.equals("")) {
                            Element subComponentElm =
                                xmlDoc.createElement(subComponentDataTypeName + "." + (k + 1));
                            Text value = xmlDoc.createTextNode(subComponentStr);
                            subComponentElm.appendChild(value);
                            componentElm.appendChild(subComponentElm);
                          }
                        }

                      }
                      fieldElm.appendChild(componentElm);
                    }
                  }
                }

              }
              segmentElm.appendChild(fieldElm);
            }
          }
        }
      }
    }

  }

  private List<FieldNode> popFields(Segment s, String segmentStr, SegmentParams params) {

    List<FieldNode> filedNodes = new ArrayList<FieldNode>();

    String[] splittedSegmentStr = segmentStr.split("\\|");
    List<String> fieldValues = new ArrayList<String>();

    if (splittedSegmentStr[0].equals("MSH")) {
      fieldValues.add("|");
      fieldValues.add("^~\\&");
      for (int index = 2; index < splittedSegmentStr.length; index++) {
        fieldValues.add(splittedSegmentStr[index]);
      }
    } else {
      for (int index = 1; index < splittedSegmentStr.length; index++) {
        fieldValues.add(splittedSegmentStr[index]);
      }
    }

    String dynamicMappingTarget = null;
    String dynamicMappingDatatypeId = null;

    if (s.getDynamicMapping() != null && s.getDynamicMapping().getDynamicMappingDef() != null
        && s.getDynamicMapping().getItems() != null) {
      if (s.getDynamicMapping().getItems().size() > 0) {
        if (s.getDynamicMapping().getDynamicMappingDef().getPostion() != null
            && !s.getDynamicMapping().getDynamicMappingDef().getPostion().equals("")) {
          if (s.getDynamicMapping().getDynamicMappingDef().getReference() != null
              && !s.getDynamicMapping().getDynamicMappingDef().getReference().equals("")) {

            dynamicMappingTarget = s.getDynamicMapping().getDynamicMappingDef().getPostion();
            String referenceLocation = s.getDynamicMapping().getDynamicMappingDef().getReference();
            String secondReferenceLocation =
                s.getDynamicMapping().getDynamicMappingDef().getSecondReference();

            String referenceValue = this.findValueByPath(segmentStr, referenceLocation);
            String secondReferenceLocationValue =
                this.findValueByPath(segmentStr, secondReferenceLocation);

            dynamicMappingDatatypeId = s.getDynamicMapping()
                .findDataypteIdByReferences(referenceValue, secondReferenceLocationValue);
          }
        }
      }
    }


    for (int i = 0; i < s.getChildren().size(); i++) {
      List<String> fieldInstanceValues = new ArrayList<String>();
      if (splittedSegmentStr[0].equals("MSH") && i == 1) {
        fieldInstanceValues.add("^~\\&");
      } else {
        if (i < fieldValues.size()) {
          fieldInstanceValues = Arrays.asList(fieldValues.get(i).split("~"));
        } else {
          fieldInstanceValues.add("");
        }
      }

      for (int h = 0; h < fieldInstanceValues.size(); h++) {
        Field f = s.getChildren().get(i);
        Datatype fieldDt = profileData.getIntegrationProfile().findDatatypeById(f.getDatatypeId());
        FieldNode fieldNode = new FieldNode();
        fieldNode.setField(f);
        fieldNode.setiPath(params.getiPath() + "." + (i + 1) + "[" + (h + 1) + "]");
        fieldNode.setPath(params.getPath() + "." + (i + 1));
        fieldNode.setPositioniPath(params.getiPositionPath() + "." + (i + 1) + "[" + (h + 1) + "]");
        fieldNode.setPositionPath(params.getPositionPath() + "." + (i + 1));
        fieldNode.setType("field");
        fieldNode.setUsagePath(params.getUsagePath() + "-" + f.getUsage());
        fieldNode.setValue(fieldInstanceValues.get(h));

        if (dynamicMappingTarget != null && dynamicMappingTarget.equals("" + (i + 1))
            && dynamicMappingDatatypeId != null) {
          fieldNode.setDt(
              profileData.getIntegrationProfile().findDatatypeById(dynamicMappingDatatypeId));
        } else {
          fieldNode.setDt(fieldDt);
        }

        if (f.getBindingId() != null) {
          for (String bid : f.getBindingId().split("\\:")) {
            fieldNode.addBindingIdentifier(bid);
          }
        }

        if (f.getUsage().equals(Usage.C))
          fieldNode.setPredicate(this.findPredicate(params.getConformanceProfileId(), s, null,
              fieldNode.getPositionPath(), "field"));

        if (params.getTestDataCategorizationMap() != null) {
          Categorization fieldTestDataCategorizationObj = params.getTestDataCategorizationMap()
              .get(this.replaceDotToDash(fieldNode.getiPath()));
          if (fieldTestDataCategorizationObj != null) {
            fieldNode.setTestDataCategorization(
                fieldTestDataCategorizationObj.getTestDataCategorization());
            fieldNode
                .setTestDataCategorizationListData(fieldTestDataCategorizationObj.getListData());
          }
        }

        List<String> componentValues = new ArrayList<String>();
        if (h < fieldInstanceValues.size())
          componentValues = Arrays.asList(fieldInstanceValues.get(h).split("\\^"));

        if (fieldNode.getDt().getChildren() != null) {
          for (int j = 0; j < fieldNode.getDt().getChildren().size(); j++) {
            Component c = fieldNode.getDt().getChildren().get(j);
            Datatype componentDt =
                profileData.getIntegrationProfile().findDatatypeById(c.getDatatypeId());
            ComponentNode componentNode = new ComponentNode();
            componentNode.setDt(componentDt);
            componentNode.setComponent(c);
            componentNode.setiPath(fieldNode.getiPath() + "." + (j + 1) + "[1]");
            componentNode.setPath(fieldNode.getPath() + "." + (j + 1));
            componentNode.setPositioniPath(fieldNode.getPositioniPath() + "." + (j + 1) + "[1]");
            componentNode.setPositionPath(fieldNode.getPositionPath() + "." + (j + 1));
            componentNode.setType("component");
            componentNode.setUsagePath(fieldNode.getUsagePath() + "-" + c.getUsage());
            if (j < componentValues.size())
              componentNode.setValue(componentValues.get(j));
            else
              componentNode.setValue("");

            if (c.getBindingId() != null) {
              for (String bid : c.getBindingId().split("\\:")) {
                componentNode.addBindingIdentifier(bid);
              }
            }

            if (c.getUsage().equals(Usage.C))
              componentNode.setPredicate(this.findPredicate(params.getConformanceProfileId(), s,
                  fieldDt, componentNode.getPositionPath(), "component"));

            if (params.getTestDataCategorizationMap() != null) {
              Categorization componentTestDataCategorizationObj =
                  params.getTestDataCategorizationMap()
                      .get(this.replaceDotToDash(componentNode.getiPath()));
              if (componentTestDataCategorizationObj != null) {
                componentNode.setTestDataCategorization(
                    componentTestDataCategorizationObj.getTestDataCategorization());
                componentNode.setTestDataCategorizationListData(
                    componentTestDataCategorizationObj.getListData());
              }
            }


            List<String> subComponentValues = new ArrayList<String>();
            if (j < componentValues.size())
              subComponentValues = Arrays.asList(componentValues.get(j).split("\\&"));
            if (componentNode.getDt().getChildren() != null) {
              for (int k = 0; k < componentNode.getDt().getChildren().size(); k++) {
                Component sc = componentNode.getDt().getChildren().get(k);
                Datatype subComponentDt =
                    profileData.getIntegrationProfile().findDatatypeById(sc.getDatatypeId());
                SubComponentNode subComponentNode = new SubComponentNode();
                subComponentNode.setDt(subComponentDt);
                subComponentNode.setComponent(sc);
                subComponentNode.setiPath(componentNode.getiPath() + "." + (k + 1) + "[1]");
                subComponentNode.setPath(componentNode.getPath() + "." + (k + 1));
                subComponentNode
                    .setPositioniPath(componentNode.getPositioniPath() + "." + (k + 1) + "[1]");
                subComponentNode.setPositionPath(componentNode.getPositionPath() + "." + (k + 1));
                subComponentNode.setType("subcomponent");
                subComponentNode.setUsagePath(componentNode.getUsagePath() + "-" + sc.getUsage());
                if (k < subComponentValues.size())
                  subComponentNode.setValue(subComponentValues.get(k));
                else
                  subComponentNode.setValue("");

                if (sc.getBindingId() != null) {
                  for (String bid : sc.getBindingId().split("\\:")) {
                    subComponentNode.addBindingIdentifier(bid);
                  }
                }

                if (sc.getUsage().equals(Usage.C))
                  subComponentNode.setPredicate(this.findPredicate(params.getConformanceProfileId(),
                      s, componentDt, subComponentNode.getPositionPath(), "subComponent"));

                if (params.getTestDataCategorizationMap() != null) {
                  Categorization subComponentTestDataCategorizationObj =
                      params.getTestDataCategorizationMap()
                          .get(this.replaceDotToDash(subComponentNode.getiPath()));
                  if (subComponentTestDataCategorizationObj != null) {
                    subComponentNode.setTestDataCategorization(
                        subComponentTestDataCategorizationObj.getTestDataCategorization());
                    subComponentNode.setTestDataCategorizationListData(
                        subComponentTestDataCategorizationObj.getListData());
                  }
                }

                componentNode.addChild(subComponentNode);
              }
            }



            fieldNode.addChild(componentNode);


          }
        }


        filedNodes.add(fieldNode);
      }
    }
    return filedNodes;
  }

  /**
   * @param getiPath
   * @return
   */
  private String replaceDotToDash(String iPath) {
    if (iPath != null)
      return iPath.replaceAll("\\.", "\\-");
    return null;
  }


  /**
   * @param segmentStr
   * @param referenceLocation
   * @return
   */
  private String findValueByPath(String segmentStr, String path) {
    if (segmentStr != null && path != null) {
      String[] splittedStr = segmentStr.split("\\|");
      String[] splittedPathStr = path.split("\\.");
      String result = null;

      for (int i = 0; i < splittedPathStr.length; i++) {
        int position = Integer.parseInt(splittedPathStr[i]);

        if (i == 0) {
          if (position < splittedStr.length) {
            result = splittedStr[position];
          }
          splittedStr = result.split("\\^");
        } else if (i == 1) {
          if (position - 1 < splittedStr.length) {
            result = splittedStr[position - 1];
          }
          splittedStr = result.split("\\&");
        } else if (i == 2) {
          if (position - 1 < splittedStr.length) {
            result = splittedStr[position - 1];
          }
        }
      }
      return result;
    }
    return null;
  }


  private Predicate findPredicate(String messageId, Segment segment, Datatype datatype,
      String positionPath, String type) {
    if (type != null && positionPath != null && this.profileData != null
        && this.profileData.getIntegrationProfile() != null) {

      IntegrationProfile profile = this.profileData.getIntegrationProfile();
      if (messageId != null) {
        ConformanceProfile message = profile.findConformanceProfileById(messageId);
        if (message != null && profileData.getConformanceContext() != null
            && profileData.getConformanceContext().getMessagePredicates() != null) {
          for (Predicate p : profileData.getConformanceContext().getMessagePredicates()) {
            if (p.getById() != null
                && p.getById().equals(message.getConformanceProfileMetaData().getId())) {
              if (comparePositionPath(positionPath, p.getTarget(), type, "m"))
                return p;
            }

            if (p.getByName() != null
                && p.getByName().equals(message.getConformanceProfileMetaData().getName())) {
              if (comparePositionPath(positionPath, p.getTarget(), type, "m"))
                return p;
            }
          }
        }
      }

      if (segment != null && profileData.getConformanceContext() != null
          && profileData.getConformanceContext().getSegmentPredicates() != null) {
        for (Predicate p : profileData.getConformanceContext().getSegmentPredicates()) {
          if (p.getById() != null && p.getById().equals(segment.getId())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "s"))
              return p;
          }

          if (p.getByName() != null && p.getByName().equals(segment.getName())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "s"))
              return p;
          }
        }
      }

      if (datatype != null && profileData.getConformanceContext() != null
          && profileData.getConformanceContext().getDatatypePredicates() != null) {
        for (Predicate p : profileData.getConformanceContext().getDatatypePredicates()) {
          if (p.getById() != null && p.getById().equals(datatype.getId())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "d"))
              return p;
          }

          if (p.getByName() != null && p.getByName().equals(datatype.getName())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "d"))
              return p;
          }
        }
      }

    }
    return null;
  }

  private boolean comparePositionPath(String targetPosition, String predicatePosition,
      String targetType, String predicateLevel) {
    if (predicatePosition == null)
      return false;
    if (targetPosition == null)
      return false;
    String[] predicatePositionSplits = predicatePosition.split("\\.");
    String[] targetPositionSplits = targetPosition.split("\\.");
    if (predicateLevel.equals("m")) {
      if (predicatePositionSplits.length == targetPositionSplits.length) {
        for (int i = 0; i < predicatePositionSplits.length; i++) {
          if (!predicatePositionSplits[i].startsWith(targetPositionSplits[i] + "["))
            return false;
        }
      } else
        return false;
    } else if (predicateLevel.equals("s")) {
      if (targetType.equals("field")) {
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 1];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
      } else if (targetType.equals("component")) {
        if (predicatePositionSplits.length < 2 || targetPositionSplits.length < 2)
          return false;
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 2];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
      } else if (targetType.equals("subComponent")) {
        if (predicatePositionSplits.length < 3 || targetPositionSplits.length < 3)
          return false;
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 3];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 3];
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 2];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String subComponentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String subComponentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
        if (!subComponentPositionPredicate.startsWith(subComponentPositionTarget + "["))
          return false;
      } else
        return false;
    } else if (predicateLevel.equals("d")) {
      if (targetType.equals("component")) {
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
      } else if (targetType.equals("subComponent")) {
        if (predicatePositionSplits.length < 2 || targetPositionSplits.length < 2)
          return false;
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 2];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String subComponentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String subComponentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
        if (!subComponentPositionPredicate.startsWith(subComponentPositionTarget + "["))
          return false;
      } else
        return false;
    }
    return true;
  }


  private SegmentInfo findSegmentInfo(String segmentName) {
    if (currentPosition >= this.segmentsInfoList.size())
      return null;
    SegmentInfo sInfo = this.segmentsInfoList.get(this.currentPosition);
    this.currentPosition = this.currentPosition + 1;
    if (sInfo.getName().equals(segmentName)) {
      return sInfo;
    } else {
      return this.findSegmentInfo(segmentName);
    }
  }

  private void analyzeSegmentRefOrGroup(SegmentRefOrGroup srog, int position, String positionPath,
      String iPositionPath, String path, String iPath, String usagePath, boolean isAnchor) {
    if (srog instanceof SegmentRef) {
      SegmentRef sr = (SegmentRef) srog;
      Segment s = this.profileData.getIntegrationProfile().findSegemntById(sr.getRef());
      if (sr.getMax().equals("1")) {
        int index = 1;
        this.segmentsInfoList.add(this.generateSegmentInfo(index, s, sr, position, positionPath,
            iPositionPath, path, iPath, usagePath, isAnchor));
      } else {
        for (int i = 1; i < this.repeatedNum + 1; i++) {
          this.segmentsInfoList.add(this.generateSegmentInfo(i, s, sr, position, positionPath,
              iPositionPath, path, iPath, usagePath, isAnchor));
        }
      }
    } else if (srog instanceof Group) {
      Group g = (Group) srog;
      String groupName = g.getName().split("\\.")[g.getName().split("\\.").length - 1];
      if (g.getMax().equals("1")) {
        if (positionPath.equals("")) {
          positionPath = "" + position;
          iPositionPath = "" + position + "[1]";
          path = groupName;
          iPath = groupName + "[1]";
          usagePath = g.getUsage().toString();
        } else {
          positionPath = positionPath + "." + position;
          iPositionPath = iPositionPath + "." + position + "[1]";
          path = path + "." + groupName;
          iPath = iPath + "." + groupName + "[1]";
          usagePath = usagePath + "-" + g.getUsage().toString();
        }
        int index = 0;
        for (SegmentRefOrGroup child : g.getChildren()) {
          index = index + 1;
          this.analyzeSegmentRefOrGroup(child, index, positionPath, iPositionPath, path, iPath,
              usagePath, false);
        }
      } else {
        for (int i = 1; i < this.repeatedNum + 1; i++) {
          String childPositionPath;
          String childiPositionPath;
          String childPath;
          String childiPath;
          String childUsagePath;

          if (positionPath.equals("")) {
            childPositionPath = "" + position;
            childiPositionPath = "" + position + "[" + i + "]";
            childPath = groupName;
            childiPath = groupName + "[" + i + "]";
            childUsagePath = g.getUsage().toString();
          } else {
            childPositionPath = positionPath + "." + position;
            childiPositionPath = iPositionPath + "." + position + "[" + i + "]";
            childPath = path + "." + groupName;
            childiPath = iPath + "." + groupName + "[" + i + "]";
            childUsagePath = usagePath + "-" + g.getUsage().toString();
          }
          int index = 0;
          for (SegmentRefOrGroup child : g.getChildren()) {
            index = index + 1;

            if (index == 1) {
              this.analyzeSegmentRefOrGroup(child, index, childPositionPath, childiPositionPath,
                  childPath, childiPath, childUsagePath, true);
            } else {
              this.analyzeSegmentRefOrGroup(child, index, childPositionPath, childiPositionPath,
                  childPath, childiPath, childUsagePath, false);
            }
          }
        }
      }
    }

  }

  private SegmentInfo generateSegmentInfo(int index, Segment s, SegmentRef sr, int position,
      String positionPath, String iPositionPath, String path, String iPath, String usagePath,
      boolean isAnchor) {
    SegmentInfo sInfo = new SegmentInfo();
    sInfo.setAnchor(isAnchor);
    if (positionPath.equals("")) {
      positionPath = "" + position;
      iPositionPath = "" + position + "[" + index + "]";
      path = s.getName();
      iPath = s.getName() + "[" + index + "]";
      usagePath = sr.getUsage().toString();
    } else {
      positionPath = positionPath + "." + position;
      iPositionPath = iPositionPath + "." + position + "[" + index + "]";
      path = path + "." + s.getName();
      iPath = iPath + "." + s.getName() + "[" + index + "]";
      usagePath = usagePath + "-" + sr.getUsage().toString();
    }
    sInfo.setiPath(iPath);
    sInfo.setiPositionPath(iPositionPath);
    sInfo.setMax(sr.getMax());
    sInfo.setName(s.getName());
    sInfo.setPath(path);
    sInfo.setPositionPath(positionPath);
    sInfo.setUsage(sr.getUsage());
    sInfo.setUsagePath(usagePath);
    sInfo.setSegment(s);

    return sInfo;
  }


}
