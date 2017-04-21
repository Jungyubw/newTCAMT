package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Date;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "resourcebundle")
public class ResourceBundle implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -712604784339620040L;

	@Id
	private String id; //same with TestPlanId
	private String name;
	private Date date;
	private Long accountId;
	private boolean hasXML;
	private boolean hasResourceBundle;
	private boolean hasPDF;

	public ResourceBundle() {
		super();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Long getAccountId() {
		return accountId;
	}

	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	public boolean isHasXML() {
		return hasXML;
	}

	public void setHasXML(boolean hasXML) {
		this.hasXML = hasXML;
	}

	public boolean isHasResourceBundle() {
		return hasResourceBundle;
	}

	public void setHasResourceBundle(boolean hasResourceBundle) {
		this.hasResourceBundle = hasResourceBundle;
	}

	public boolean isHasPDF() {
		return hasPDF;
	}

	public void setHasPDF(boolean hasPDF) {
		this.hasPDF = hasPDF;
	}
}
