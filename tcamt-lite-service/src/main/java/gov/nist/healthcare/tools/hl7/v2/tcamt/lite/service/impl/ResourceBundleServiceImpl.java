/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgement if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 */

/**
 * 
 * @author Olivier MARIE-ROSE
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mongodb.MongoException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.ResourceBundle;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.ResourceBundleRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ResourceBundleService;

@Service
public class ResourceBundleServiceImpl implements ResourceBundleService {
	Logger log = LoggerFactory.getLogger(ResourceBundleServiceImpl.class);
	@Autowired
	private ResourceBundleRepository resourceBundleRepository;

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public ResourceBundle save(ResourceBundle rb) {
		try {
			return resourceBundleRepository.save(rb);
		} catch (MongoException e) {
			throw e;
		}
	}

	@Override
	public List<ResourceBundle> findByAccountId(Long accountId) {
		List<ResourceBundle> configs = resourceBundleRepository.findByAccountId(accountId);

		return configs;
	}

	@Override
	public ResourceBundle findById(String id) {
		return resourceBundleRepository.findOne(id);
	}

}
