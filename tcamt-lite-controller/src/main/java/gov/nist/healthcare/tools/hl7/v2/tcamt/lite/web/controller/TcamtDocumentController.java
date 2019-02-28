package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.HashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Slide;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TcamtDocument;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.UserGuide;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TcamtDocumentRepository;

@RestController
@RequestMapping("/tcamtdocument")
public class TcamtDocumentController extends CommonController {

  @Autowired
  TcamtDocumentRepository tcamtDocumentRepository;

  @RequestMapping(method = RequestMethod.GET, produces = "application/json")
  public TcamtDocument getTcamtDocument() throws Exception {

    List<TcamtDocument> docs = this.tcamtDocumentRepository.findAll();
    if(docs != null && docs.size() > 0) {
      return docs.get(0);
    }else {
      TcamtDocument result = new TcamtDocument();
      result.setUserGuide(new UserGuide());
      result.getUserGuide().setSlides(new HashSet<Slide>());
      Slide slide = new Slide();
      slide.setPosition(0);
      slide.setTitle("New Slide");
      result.getUserGuide().getSlides().add(slide);
      
      return result;
    }
  }

  @RequestMapping(value = "/save", method = RequestMethod.POST)
  public void saveTcamtDocument(@RequestBody TcamtDocument doc) throws Exception {
    this.tcamtDocumentRepository.save(doc);
  }
}
