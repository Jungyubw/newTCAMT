package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;

import javax.persistence.Id;

public class TestStep implements Serializable, Cloneable, Comparable<TestStep> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1164104159252764632L;

	@Id
	private long id;

	private String name;

	private String description;

	private String integrationProfileId;
	
	private String conformanceProfileId;
	
	private String er7Message;

	private Integer version;

	private int position;

	private TestStory testStepStory = new TestStory();

	private String type;

	public TestStep(long id, String name, String description, Integer version) {
		super();
		this.id = id;
		this.name = name;
		this.setDescription(description);
		this.setVersion(version);
	}

	public TestStep() {
		super();
	}

	public long getId() {
		return id;
	}

	public void setId(long id) {
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
		cloned.setId(0);
		cloned.setTestStepStory((TestStory) testStepStory.clone());

		return cloned;
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}

	public int compareTo(TestStep comparingTestStep) {
		int comparePosition = comparingTestStep.getPosition();
		return this.position - comparePosition;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public static Comparator<TestStep> getTestCasePositionComparator() {
		return testCasePositionComparator;
	}

	public static void setTestCasePositionComparator(
			Comparator<TestStep> testCasePositionComparator) {
		TestStep.testCasePositionComparator = testCasePositionComparator;
	}

	public String getDescription() {
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

	public static Comparator<TestStep> testCasePositionComparator = new Comparator<TestStep>() {
		public int compare(TestStep ts1, TestStep ts2) {
			return ts1.compareTo(ts2);
		}
	};
}
