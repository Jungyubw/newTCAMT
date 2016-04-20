package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;

public class TestStory implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 7659851766583195273L;
	private String teststorydesc;
	private String comments;
	private String preCondition;
	private String postCondition;
	private String testObjectives;
	private String evaluationCriteria;
	private String notes;

	public TestStory(String teststorydesc, String comments,
			String preCondition, String postCondition, String testObjectives,
			String evaluationCriteria, String notes) {
		super();
		this.setTeststorydesc(teststorydesc);
		this.comments = comments;
		this.preCondition = preCondition;
		this.postCondition = postCondition;
		this.testObjectives = testObjectives;
		this.evaluationCriteria = evaluationCriteria;
		this.notes = notes;
	}

	public TestStory() {
		super();
		this.setComments("No Comments");
		this.setTeststorydesc(" No Description");
		this.setNotes("No Note");
		this.setPostCondition("No PostCondition");
		this.setPreCondition("No PreCondition");
		this.setEvaluationCriteria("No evaluation criteria");
		this.setTestObjectives("No Test Objectives");
	}

	public String getComments() {
		return comments;
	}

	public void setComments(String comments) {
		this.comments = comments;
	}

	public String getPreCondition() {
		return preCondition;
	}

	public void setPreCondition(String preCondition) {
		this.preCondition = preCondition;
	}

	public String getPostCondition() {
		return postCondition;
	}

	public void setPostCondition(String postCondition) {
		this.postCondition = postCondition;
	}

	public String getTestObjectives() {
		return testObjectives;
	}

	public void setTestObjectives(String testObjectives) {
		this.testObjectives = testObjectives;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	@Override
	public TestStory clone() throws CloneNotSupportedException {
		TestStory cloned = (TestStory) super.clone();
		return cloned;
	}

	public String getTeststorydesc() {
		return teststorydesc;
	}

	public void setTeststorydesc(String teststorydesc) {
		this.teststorydesc = teststorydesc;
	}

	public String getEvaluationCriteria() {
		return evaluationCriteria;
	}

	public void setEvaluationCriteria(String evaluationCriteria) {
		this.evaluationCriteria = evaluationCriteria;
	}

	public TestStory normalize() {
		this.teststorydesc = teststorydesc.replace("“", "\"")
				.replace("”", "\"").replace("‘", "\'").replace("’", "\'")
				.replace("–", "-").replace("&nbsp;", " ");
		this.comments = comments.replace("“", "\"").replace("”", "\"")
				.replace("‘", "\'").replace("’", "\'").replace("–", "-")
				.replace("&nbsp;", " ");
		this.preCondition = preCondition.replace("“", "\"").replace("”", "\"")
				.replace("‘", "\'").replace("’", "\'").replace("–", "-")
				.replace("&nbsp;", " ");
		this.postCondition = postCondition.replace("“", "\"")
				.replace("”", "\"").replace("‘", "\'").replace("’", "\'")
				.replace("–", "-").replace("&nbsp;", " ");
		this.testObjectives = testObjectives.replace("“", "\"")
				.replace("”", "\"").replace("‘", "\'").replace("’", "\'")
				.replace("–", "-").replace("&nbsp;", " ");
		this.evaluationCriteria = evaluationCriteria.replace("“", "\"")
				.replace("”", "\"").replace("‘", "\'").replace("’", "\'")
				.replace("–", "-").replace("&nbsp;", " ");
		this.notes = notes.replace("“", "\"").replace("”", "\"")
				.replace("‘", "\'").replace("’", "\'").replace("–", "-")
				.replace("&nbsp;", " ");
		return this;
	}

}
