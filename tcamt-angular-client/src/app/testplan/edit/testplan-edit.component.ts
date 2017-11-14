import { Component, OnInit , OnDestroy} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './testplan-edit.component.html'
})
export class TestplanEditComponent implements OnInit, OnDestroy{

    constructor(private route: ActivatedRoute) {}
    testplanId: any;
    testplan : any;
    private sub: any;

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.testplanId = params['id'];
            console.log(this.testplanId);
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}

