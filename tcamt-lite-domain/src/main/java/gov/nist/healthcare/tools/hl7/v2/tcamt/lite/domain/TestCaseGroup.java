package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Comparator;
import java.util.HashMap;
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

	private HashMap<String, String> testStoryContent = new HashMap<String, String>();

	private Set<TestCaseOrGroup> children = new HashSet<TestCaseOrGroup>();

	public void addTestCase(TestCaseGroup testCaseOrGroup) {
		this.children.add(testCaseOrGroup);
	}

	public Set<TestCaseOrGroup> getChildren() {
		return children;
	}

	public void setChildren(Set<TestCaseOrGroup> children) {
		this.children = children;
	}

	@Override
	public TestCaseGroup clone() throws CloneNotSupportedException {
		TestCaseGroup cloned = (TestCaseGroup) super.clone();
		cloned.setId(ObjectId.get().toString());

		Set<TestCaseOrGroup> cTestcaseOrGroup = new HashSet<TestCaseOrGroup>();
		for (TestCaseOrGroup tcg : this.children) {
			if (tcg instanceof TestCase) {
				TestCase tc = (TestCase) tcg;
				cTestcaseOrGroup.add(tc.clone());
			} else {
				TestCaseGroup tg = (TestCaseGroup) tcg;
				cTestcaseOrGroup.add(tg.clone());
			}
		}
		cloned.setChildren(cTestcaseOrGroup);

		return cloned;
	}

	public int compareTo(TestCaseGroup comparingTestCaseGroup) {
		int comparePosition = comparingTestCaseGroup.getPosition();
		return this.position - comparePosition;
	}

	public static Comparator<TestCaseGroup> getTestCaseGroupPositionComparator() {
		return testCaseGroupPositionComparator;
	}

	public static void setTestCaseGroupPositionComparator(Comparator<TestCaseGroup> testCaseGroupPositionComparator) {
		TestCaseGroup.testCaseGroupPositionComparator = testCaseGroupPositionComparator;
	}

	public HashMap<String, String> getTestStoryContent() {
		return testStoryContent;
	}

	public void setTestStoryContent(HashMap<String, String> testStoryContent) {
		this.testStoryContent = testStoryContent;
	}

	public static Comparator<TestCaseGroup> testCaseGroupPositionComparator = new Comparator<TestCaseGroup>() {
		public int compare(TestCaseGroup tg1, TestCaseGroup tg2) {
			return tg1.compareTo(tg2);
		}
	};
}
