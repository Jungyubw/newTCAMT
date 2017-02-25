package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import javax.persistence.Id;

public class Er7SegmentTemplate {
	
	@Id
	private String id;

	private String ipath;
	private String description;
	private String date;
	private String content;
	private String name;
	private String path;
	private int position;
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getIpath() {
		return ipath;
	}
	public void setIpath(String ipath) {
		this.ipath = ipath;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getDate() {
		return date;
	}
	public void setDate(String date) {
		this.date = date;
	}
	public String getContent() {
		return content;
	}
	public void setContent(String content) {
		this.content = content;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getPath() {
		return path;
	}
	public void setPath(String path) {
		this.path = path;
	}
	public int getPosition() {
		return position;
	}
	public void setPosition(int position) {
		this.position = position;
	}


}
