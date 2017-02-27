package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.types.ObjectId;

public class TestCase extends TestCaseOrGroup implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 8586117174000506245L;

	private HashMap<String,String> testStoryContent=new HashMap<String, String>();

	public TestCase() {
		super();
		this.type = "testcase";
	}


	private List<TestStep> teststeps = new ArrayList<TestStep>();

	private TestStory testCaseStory = new TestStory();
	
	private String protocol;

	
	public List<TestStep> getTeststeps() {
		return teststeps;
	}

	public void setTeststeps(List<TestStep> teststeps) {
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
		cloned.setId(ObjectId.get().toString());

		List<TestStep> cTeststeps = new ArrayList<TestStep>();
		for (TestStep teststep : this.teststeps) {
			cTeststeps.add(teststep.clone());
		}
		cloned.setTeststeps(cTeststeps);
		cloned.setTestCaseStory((TestStory) testCaseStory.clone());

		return cloned;
	}

	public String getProtocol() {
		if(this.protocol == null || this.protocol.equals("")){
			this.protocol = "soap";
		}
		return protocol;
	}

	public void setProtocol(String protocol) {
		this.protocol = protocol;
	}


	public HashMap<String,String> getTestStoryContent() {
		return testStoryContent;
	}

	public void setTestStoryContent(HashMap<String,String> testStoryContent) {
		this.testStoryContent = testStoryContent;
	}

}
