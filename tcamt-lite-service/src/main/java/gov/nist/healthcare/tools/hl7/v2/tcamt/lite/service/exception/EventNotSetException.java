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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception;

/**
 * @author gcr1
 *
 */
public class EventNotSetException extends Exception {
	
	private static final long serialVersionUID = 1789079702103332561L;

	public EventNotSetException(String error) {
		super(error);
	}

	public EventNotSetException(Exception error) {
		super(error);
	}
}
