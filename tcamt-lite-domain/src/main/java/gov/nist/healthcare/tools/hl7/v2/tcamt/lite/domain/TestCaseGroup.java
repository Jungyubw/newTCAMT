package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
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

	private List<TestCaseOrGroup> children = new ArrayList<TestCaseOrGroup>();

	public void addTestCase(TestCaseGroup testCaseOrGroup) {
		this.children.add(testCaseOrGroup);
	}
	
	
	
	public List<TestCaseOrGroup> getChildren() {
		return children;
	}



	public void setChildren(List<TestCaseOrGroup> children) {
		this.children = children;
	}



	@Override
	public TestCaseGroup clone() throws CloneNotSupportedException {
		TestCaseGroup cloned = (TestCaseGroup)super.clone();
		cloned.setId(ObjectId.get().toString());
		
		List<TestCaseOrGroup> cTestcaseOrGroup = new ArrayList<TestCaseOrGroup>();
		for(TestCaseOrGroup tcg:this.children){
			if(tcg instanceof TestCase)  {
				TestCase tc = (TestCase)tcg;
				cTestcaseOrGroup.add(tc.clone());
			}else{
				TestCaseGroup tg = (TestCaseGroup)tcg;
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
