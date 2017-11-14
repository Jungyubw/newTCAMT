import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';
import { TreeNode } from 'primeng/primeng';

@Injectable()
export class TestplanService {

    constructor(private http: Http , private httpClient: HttpClient) {}

    getMyTestPlanListAbstract() {
        return this.http.get('assets/data/abstractMyTestPlans.json')
            .toPromise()
            .then(res => <any[]> res.json())
            .then(data => { return data; });
    }

    getSharedTestPlanListAbstract() {
        return this.http.get('assets/data/abstractSharedTestPlans.json')
            .toPromise()
            .then(res => <any[]> res.json())
            .then(data => { return data; });
    }

    getTestPlan(id:any) {
        console.log("PLEASE");
        console.log(id);
        return this.http.get('assets/data/abstractSharedTestPlans.json')
            .toPromise()
            .then(res => <any[]> res.json())
            .then(data => { return data; });
    }


    getFilesystem() {
        return this.httpClient.get<any>('assets/data/filesystem.json')
            .toPromise()
            .then(res => <TreeNode[]>res.data);
    }
}