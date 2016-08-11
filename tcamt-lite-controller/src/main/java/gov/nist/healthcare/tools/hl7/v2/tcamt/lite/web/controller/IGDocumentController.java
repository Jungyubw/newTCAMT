package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.prelib.domain.ProfilePreLib;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl.IGAMTDBConn;

@RestController
@RequestMapping("/igdocuments")
public class IGDocumentController extends CommonController {
	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;

	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public List<IGDocument> getIGDocumentList() throws Exception {
		try {
			return userIGDocuments();
		} catch (Exception e) {
			throw new Exception(e);
		}
	}

	private List<IGDocument> userIGDocuments() throws Exception {
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}
		return new IGAMTDBConn().getUserDocument(account.getId());
	}

	@RequestMapping(value = "/{id}/tcamtProfile", method = RequestMethod.GET, produces = "application/json")
	public ProfilePreLib getProfilePreLib(@PathVariable("id") String id)
			throws Exception {

		IGAMTDBConn con = new IGAMTDBConn();
		User u = userService.getCurrentUser();
		Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
		if (account == null) {
			throw new Exception();
		}

		IGDocument igDocument = con.findIGDocument(id);
		
		
		return con.convertIGAMT2TCAMT(igDocument.getProfile(), igDocument.getMetaData().getTitle(), id);
	}
}
