package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Id;

public class TestCaseGroup implements Serializable, Cloneable, Comparable<TestCaseGroup> {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8254402250986054606L;

	
	@Id
	private long id;
	
	private String name;
	
	private String description;
	
	private Integer version;
	
	private int position;
	
	private Set<TestCase> testcases = new HashSet<TestCase>();
	
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

	public Set<TestCase> getTestcases() {
		return testcases;
	}

	public void setTestcases(Set<TestCase> testcases) {
		this.testcases = testcases;
	}

	public void addTestCase(TestCase testcase) {
		this.testcases.add(testcase);
	}
	
	@Override
	public TestCaseGroup clone() throws CloneNotSupportedException {
		TestCaseGroup cloned = (TestCaseGroup)super.clone();
		cloned.setId(0);
		
		Set<TestCase> cTestcases = new HashSet<TestCase>();
		for(TestCase testcase:this.testcases){
			cTestcases.add(testcase.clone());
		}
		cloned.setTestcases(cTestcases);
		
		return cloned;
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}

	public int compareTo(TestCaseGroup comparingTestCaseGroup) {
		int comparePosition = comparingTestCaseGroup.getPosition(); 
		return this.position - comparePosition;
	}
	
	public static Comparator<TestCaseGroup> getTestCaseGroupPositionComparator() {
		return testCaseGroupPositionComparator;
	}

	public static void setTestCaseGroupPositionComparator(
			Comparator<TestCaseGroup> testCaseGroupPositionComparator) {
		TestCaseGroup.testCaseGroupPositionComparator = testCaseGroupPositionComparator;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public static Comparator<TestCaseGroup> testCaseGroupPositionComparator = new Comparator<TestCaseGroup>() {
		public int compare(TestCaseGroup tg1, TestCaseGroup tg2) {
			return tg1.compareTo(tg2);
		}
	};
}
