/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('loginTestingToolSvc',
    ['$q','$modal', '$rootScope','base64','$http',function ($q,$modal,$rootScope,base64,$http) {

        var svc = this;

        svc.pushRB = function(host,username,password) {
            var delay = $q.defer();
            console.log(host);
            console.log(username);
            console.log(password);
            var httpHeaders = {};
            httpHeaders['Accept'] = 'application/json';
            var auth =  base64.encode(username + ':' + password);
            //httpHeaders['Authorization'] = 'Basic ' + auth;
            httpHeaders['gvt-auth'] = auth;
            var testplanId=$rootScope.selectedTestPlan.id;
            console.log($rootScope.selectedTestPlan);

            $http.post('api/testplans/pushRB/'+testplanId,host,{headers:httpHeaders}).then(function (re) {




                console.log("SUCCESS")

            }, function(error){
                console.log("ERROR");
                console.log(error);
                delay.reject(error);
            });



            return delay.promise;
        };



        svc.login = function(username, password) {
            var delay = $q.defer();
            var httpHeaders = {};
            httpHeaders['Accept'] = 'application/json';
            var auth =  base64.encode(username + ':' + password);
            httpHeaders['Authorization'] = 'Basic ' + auth;
            $http.get(+ 'api/accounts/login', {headers:httpHeaders}).then(function (re) {
                delay.resolve(auth);
            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };

        svc.exportToGVT = function(id,mids, auth) {
            var httpHeaders = {};
            httpHeaders['gvt-auth'] = auth;
            return
        };

        return svc;
    }]);

