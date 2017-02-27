package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;
import java.util.HashMap;

import javax.persistence.Id;

import org.bson.types.ObjectId;

public class TestStep implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1164104159252764632L;

	@Id
	private String id;

	private String name;

	private String description;
	private HashMap<String,String> testStoryContent=new HashMap<String, String>();


	private String integrationProfileId;
	
	private String conformanceProfileId;
	
	private String er7Message;

	private Integer version;

	private TestStory testStepStory = new TestStory();

	private String type;
	
	private String tdsXSL;
	
	private String jdXSL;
	
	private String nistXMLCode;
	
	private String stdXMLCode;
	
	private String constraintsXML;
	
	private String messageContentsXMLCode;
	
	private HashMap<String, Categorization> testDataCategorizationMap = new HashMap<String, Categorization>();
	
	private String testStoryConfigId;

	public TestStep(String id, String name, String description, Integer version) {
		super();
		this.id = id;
		this.name = name;
		this.setDescription(description);
		this.setVersion(version);
	}

	public TestStep() {
		super();
		this.id = ObjectId.get().toString();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Integer getVersion() {
		return version;
	}

	public void setVersion(Integer version) {
		this.version = version;
	}


	public TestStory getTestStepStory() {
		testStepStory = testStepStory.normalize();
		return testStepStory;
	}

	public void setTestStepStory(TestStory testStepStory) {
		this.testStepStory = testStepStory;
	}

	@Override
	public TestStep clone() throws CloneNotSupportedException {
		TestStep cloned = (TestStep) super.clone();
		cloned.setId(ObjectId.get().toString());
		cloned.setTestStepStory((TestStory) testStepStory.clone());

		return cloned;
	}
	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getDescription() {
		if(this.description == null) return "";
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getIntegrationProfileId() {
		return integrationProfileId;
	}

	public void setIntegrationProfileId(String integrationProfileId) {
		this.integrationProfileId = integrationProfileId;
	}

	public String getConformanceProfileId() {
		return conformanceProfileId;
	}

	public void setConformanceProfileId(String conformanceProfileId) {
		this.conformanceProfileId = conformanceProfileId;
	}

	public String getEr7Message() {
		return er7Message;
	}

	public void setEr7Message(String er7Message) {
		this.er7Message = er7Message;
	}

	public HashMap<String, Categorization> getTestDataCategorizationMap() {
		return testDataCategorizationMap;
	}

	public void setTestDataCategorizationMap(HashMap<String, Categorization> testDataCategorizationMap) {
		this.testDataCategorizationMap = testDataCategorizationMap;
	}

	public String getTdsXSL() {
		return tdsXSL;
	}

	public void setTdsXSL(String tdsXSL) {
		this.tdsXSL = tdsXSL;
	}

	public String getJdXSL() {
		return jdXSL;
	}

	public void setJdXSL(String jdXSL) {
		this.jdXSL = jdXSL;
	}

	public String getNistXMLCode() {
		return nistXMLCode;
	}

	public void setNistXMLCode(String nistXMLCode) {
		this.nistXMLCode = nistXMLCode;
	}

	public String getConstraintsXML() {
		return constraintsXML;
	}

	public void setConstraintsXML(String constraintsXML) {
		this.constraintsXML = constraintsXML;
	}

	public String getMessageContentsXMLCode() {
		return messageContentsXMLCode;
	}

	public void setMessageContentsXMLCode(String messageContentsXMLCode) {
		this.messageContentsXMLCode = messageContentsXMLCode;
	}

	public String getStdXMLCode() {
		return stdXMLCode;
	}

	public void setStdXMLCode(String stdXMLCode) {
		this.stdXMLCode = stdXMLCode;
	}

	public HashMap<String,String> getTestStoryContent() {
		return testStoryContent;
	}

	public void setTestStoryContent(HashMap<String,String> testStoryContent) {
		this.testStoryContent = testStoryContent;
	}

	public String getTestStoryConfigId() {
		return testStoryConfigId;
	}

	public void setTestStoryConfigId(String testStoryConfigId) {
		this.testStoryConfigId = testStoryConfigId;
	}

}
