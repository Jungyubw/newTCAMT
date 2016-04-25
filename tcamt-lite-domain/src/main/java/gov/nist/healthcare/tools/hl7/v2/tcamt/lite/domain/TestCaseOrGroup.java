package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import javax.persistence.Id;

public abstract class TestCaseOrGroup {
	@Id
	protected long id;
	
	protected String name;
	
	protected String description;
	
	protected Integer version;
	
	protected int position;

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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Integer getVersion() {
		return version;
	}

	public void setVersion(Integer version) {
		this.version = version;
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}
	
	
}
