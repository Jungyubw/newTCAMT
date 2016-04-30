package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;

import org.bson.types.ObjectId;

public class TestCaseGroup extends TestCaseOrGroup implements Serializable, Cloneable, Comparable<TestCaseGroup> {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8254402250986054606L;
	
	
	
	
	public TestCaseGroup() {
		super();
		this.type = "testcasegroup";
	}

	private Set<TestCase> testcases = new HashSet<TestCase>();

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
		cloned.setId(ObjectId.get().toString());
		
		Set<TestCase> cTestcases = new HashSet<TestCase>();
		for(TestCase testcase:this.testcases){
			cTestcases.add(testcase.clone());
		}
		cloned.setTestcases(cTestcases);
		
		return cloned;
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

	public static Comparator<TestCaseGroup> testCaseGroupPositionComparator = new Comparator<TestCaseGroup>() {
		public int compare(TestCaseGroup tg1, TestCaseGroup tg2) {
			return tg1.compareTo(tg2);
		}
	};
}
