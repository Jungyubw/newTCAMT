package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.Id;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "testplan")
public class TestPlan implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 2818730764705058185L;

	@Id
	private String id;

	private String name;
	private String description;
	private String version;
	private String lastUpdateDate;
	private List<TestCaseOrGroup> children = new ArrayList<TestCaseOrGroup>();

	private Long accountId;
	private String coverPageTitle;
	private String coverPageSubTitle;
	private String coverPageVersion;
	private String coverPageDate;
	
	private String type;
	private boolean transport;
	private Integer position;
	private String domain;
	private boolean skip;
	
	private List<String> listOfIntegrationProfileIds = new ArrayList<String>();
	
	private HashMap<String,String> testStoryContent = new HashMap<String, String>();
	
	private String testStoryConfigId;
	
	private String globalTestGroupConfigId;
	private String globalTestCaseConfigId;
	private String globalAutoTestStepConfigId;
	private String globalManualTestStepConfigId;
	
	public TestPlan() {
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

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public void addTestCase(TestCase testcase) {
		this.children.add(testcase);
	}

	public void addTestCaseGroup(TestCaseGroup testcasegroup) {
		this.children.add(testcasegroup);
	}
	
	public void addTestCaseOrGroup(TestCaseOrGroup testcaseorgroup) {
		this.children.add(testcaseorgroup);
	}

	public String getLastUpdateDate() {
		return lastUpdateDate;
	}

	public void setLastUpdateDate(String lastUpdateDate) {
		this.lastUpdateDate = lastUpdateDate;
	}

	@Override
	public TestPlan clone() throws CloneNotSupportedException {
		TestPlan cloned = (TestPlan) super.clone();
		cloned.setId(ObjectId.get().toString());
		cloned.setVersion("init");
		cloned.setName(this.name + " copy");

		List<TestCaseOrGroup> cChildren = new ArrayList<TestCaseOrGroup>();
		for (TestCaseOrGroup o : this.children) {
			if(o instanceof TestCase){
				cChildren.add(((TestCase)o).clone());
			}else if(o instanceof TestCaseGroup){
				cChildren.add(((TestCaseGroup)o).clone());
			}
		}
		cloned.setChildren(cChildren);

		return cloned;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getCoverPageTitle() {
		return coverPageTitle;
	}

	public void setCoverPageTitle(String coverPageTitle) {
		this.coverPageTitle = coverPageTitle;
	}

	public String getCoverPageVersion() {
		return coverPageVersion;
	}

	public void setCoverPageVersion(String coverPageVersion) {
		this.coverPageVersion = coverPageVersion;
	}

	public String getCoverPageDate() {
		return coverPageDate;
	}

	public void setCoverPageDate(String coverPageDate) {
		this.coverPageDate = coverPageDate;
	}

	public String getCoverPageSubTitle() {
		return coverPageSubTitle;
	}

	public void setCoverPageSubTitle(String coverPageSubTitle) {
		this.coverPageSubTitle = coverPageSubTitle;
	}

	public Long getAccountId() {
		return accountId;
	}

	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}

	public String getDescription() {
		if(this.description == null) return "";
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public List<TestCaseOrGroup> getChildren() {
		return children;
	}

	public void setChildren(List<TestCaseOrGroup> children) {
		this.children = children;
	}
	
	public boolean isTransport() {
		return transport;
	}

	public void setTransport(boolean transport) {
		this.transport = transport;
	}

	public Integer getPosition() {
		return position;
	}

	public void setPosition(Integer position) {
		this.position = position;
	}

	public String getDomain() {
		return domain;
	}

	public void setDomain(String domain) {
		this.domain = domain;
	}

	public boolean isSkip() {
		return skip;
	}

	public void setSkip(boolean skip) {
		this.skip = skip;
	}

	public List<String> getListOfIntegrationProfileIds() {
		return listOfIntegrationProfileIds;
	}

	public void setListOfIntegrationProfileIds(List<String> listOfIntegrationProfileIds) {
		this.listOfIntegrationProfileIds = listOfIntegrationProfileIds;
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

	public String getGlobalTestGroupConfigId() {
		return globalTestGroupConfigId;
	}

	public void setGlobalTestGroupConfigId(String globalTestGroupConfigId) {
		this.globalTestGroupConfigId = globalTestGroupConfigId;
	}

	public String getGlobalTestCaseConfigId() {
		return globalTestCaseConfigId;
	}

	public void setGlobalTestCaseConfigId(String globalTestCaseConfigId) {
		this.globalTestCaseConfigId = globalTestCaseConfigId;
	}

	public String getGlobalAutoTestStepConfigId() {
		return globalAutoTestStepConfigId;
	}

	public void setGlobalAutoTestStepConfigId(String globalAutoTestStepConfigId) {
		this.globalAutoTestStepConfigId = globalAutoTestStepConfigId;
	}

	public String getGlobalManualTestStepConfigId() {
		return globalManualTestStepConfigId;
	}

	public void setGlobalManualTestStepConfigId(String globalManualTestStepConfigId) {
		this.globalManualTestStepConfigId = globalManualTestStepConfigId;
	}
	
	
}
