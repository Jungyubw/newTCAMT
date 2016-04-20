package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public enum TestDataCategorization {
	Indifferent("Indifferent"),
	
	Presence_ContentIndifferent("Presence-Content Indifferent"),
	Presence_Configuration("Presence-Configuration"),
	Presence_SystemGenerated("Presence-System Generated"),
	Presence_TestCaseProper("Presence-Test Case Proper"),
	
	PresenceLength_ContentIndifferent("Presence Length-Content Indifferent"),
	PresenceLength_Configuration("Presence Length-Configuration"),
	PresenceLength_SystemGenerated("Presence Length-System Generated"),
	PresenceLength_TestCaseProper("Presence Length-Test Case Proper"),
	
	Value_ProfileFixed("Value-Profile Fixed"),
	Value_ProfileFixedList("Value-Profile Fixed List"),
	Value_TestCaseFixed("Value-Test Case Fixed"),
	Value_TestCaseFixedList("Value-Test Case Fixed List"),
	
	NonPresence("NonPresence"),
	
	Presence_ProfileFixed("Presence-Profile Fixed");
	
	private String value;

	TestDataCategorization(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
