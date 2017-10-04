import { Component, OnInit } from '@angular/core';
import {TestplanService} from '../../service/testplanservice';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  templateUrl: './testplans.component.html'
})

export class TestplansComponent implements OnInit {

  loading: boolean;
  displayDialog: boolean;

  abstractMyTestPlans: any[];
  abstractSharedTestPlans: any[];

  testplan: any = {};

  selectedTestplan: any;

  newTestPlan: boolean;

  constructor(private testplanService: TestplanService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.loading = true;
    setTimeout(() => {
      this.testplanService.getMyTestPlanListAbstract().then(tps => this.abstractMyTestPlans = tps);
      this.loading = false;
    }, 1000);

    setTimeout(() => {
      this.testplanService.getSharedTestPlanListAbstract().then(tps => this.abstractSharedTestPlans = tps);
      this.loading = false;
    }, 1000);
  }

  onSelectTestPlan(event) {
    this.newTestPlan = false;
    this.testplan = this.cloneTestPlanAbstract(event.data);
    this.displayDialog = true;
  }

  goToEditTestPlan(testplan: any) {
    this.router.navigate([`../testplandetail`, testplan.id], { relativeTo: this.route });

  }

  cloneTestPlanAbstract(tp: any): any {
    let testplan = {};
    for(let prop in tp) {
      testplan[prop] = tp[prop];
    }
    return testplan;
  }

  save() {
    let abstractMyTestPlans = [...this.abstractMyTestPlans];
    this.testplan.lastUpdateDate = new Date().toLocaleString();
    if(this.newTestPlan)
      abstractMyTestPlans.push(this.testplan);
    else
      abstractMyTestPlans[this.findSelectedTestPlanIndex()] = this.testplan;

    this.abstractMyTestPlans = abstractMyTestPlans;
    this.testplan = null;
    this.displayDialog = false;
  }

  addNewTestPlan() {
    this.newTestPlan = true;
    this.testplan = {};
    this.displayDialog = true;
  }

  delete() {
    let index = this.findSelectedTestPlanIndex();
    this.abstractMyTestPlans = this.abstractMyTestPlans.filter((val,i) => i!=index);
    this.testplan = null;
    this.displayDialog = false;
  }

  findSelectedTestPlanIndex(): number {
    return this.abstractMyTestPlans.indexOf(this.selectedTestplan);
  }
}