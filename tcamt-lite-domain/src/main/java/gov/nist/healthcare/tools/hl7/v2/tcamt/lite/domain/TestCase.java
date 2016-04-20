package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Id;

public class TestCase implements Serializable, Cloneable, Comparable<TestCase> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 8586117174000506245L;

	@Id
	private long id;

	private String name;

	private String description;

	private Integer version;

	private int position;

	private String protocol;

	private Set<TestStep> teststeps = new HashSet<TestStep>();

	private TestStory testCaseStory = new TestStory();

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

	public Set<TestStep> getTeststeps() {
		return teststeps;
	}

	public void setTeststeps(Set<TestStep> teststeps) {
		this.teststeps = teststeps;
	}

	public TestStory getTestCaseStory() {
		testCaseStory = testCaseStory.normalize();
		return testCaseStory;
	}

	public void setTestCaseStory(TestStory testCaseStory) {
		this.testCaseStory = testCaseStory;
	}

	public void addTestStep(TestStep teststep) {
		this.teststeps.add(teststep);
	}

	@Override
	public TestCase clone() throws CloneNotSupportedException {
		TestCase cloned = (TestCase) super.clone();
		cloned.setId(0);

		Set<TestStep> cTeststeps = new HashSet<TestStep>();
		for (TestStep teststep : this.teststeps) {
			cTeststeps.add(teststep.clone());
		}
		cloned.setTeststeps(cTeststeps);
		cloned.setTestCaseStory((TestStory) testCaseStory.clone());

		return cloned;
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}

	public int compareTo(TestCase comparingTestCase) {
		int comparePosition = comparingTestCase.getPosition();
		return this.position - comparePosition;
	}

	public static Comparator<TestCase> getTestCasePositionComparator() {
		return testCasePositionComparator;
	}

	public static void setTestCasePositionComparator(
			Comparator<TestCase> testCasePositionComparator) {
		TestCase.testCasePositionComparator = testCasePositionComparator;
	}

	public String getProtocol() {
		return protocol;
	}

	public void setProtocol(String protocol) {
		this.protocol = protocol;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public static Comparator<TestCase> testCasePositionComparator = new Comparator<TestCase>() {
		public int compare(TestCase tc1, TestCase tc2) {
			return tc1.compareTo(tc2);
		}
	};
}
