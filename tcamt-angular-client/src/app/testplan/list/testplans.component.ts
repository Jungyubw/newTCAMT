import { Component, OnInit } from '@angular/core';
import {CarService} from '../../service/carservice';
import { Router , ActivatedRoute} from '@angular/router';

@Component({
  templateUrl: './testplans.component.html'
})

export class TestplansComponent implements OnInit {

  loading: boolean;

  cars: any[];

  constructor(private carService: CarService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.loading = true;
    setTimeout(() => {
      this.carService.getCarsSmall().then(cars => this.cars = cars);
      this.loading = false;
    }, 1000);
  }

  selectTestplan(testplan: any) {

    console.log(testplan);
    this.router.navigate([`../testplandetail`], { relativeTo: this.route });
  }
}