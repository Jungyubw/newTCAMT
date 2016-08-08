package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.HashSet;
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
	private Set<TestCaseOrGroup> children = new HashSet<TestCaseOrGroup>();

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

		Set<TestCaseOrGroup> cChildren = new HashSet<TestCaseOrGroup>();
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
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Set<TestCaseOrGroup> getChildren() {
		return children;
	}

	public void setChildren(Set<TestCaseOrGroup> children) {
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
	
	
}
