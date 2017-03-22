/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('loginTestingToolSvc',
    ['$q','$modal', '$rootScope','base64','$http',function ($q,$modal,$rootScope,base64,$http) {

        var svc = this;

        //        var Email = $resource(svc.url+ 'api/sooa/emails/:email', {email: '@email'});
//
//        svc.userExists = function(email) {
//            var delay = $q.defer();
//            var emailToCheck = new Email({email:email});
//            emailToCheck.$get(function() {
//                delay.resolve(emailToCheck.text);
//            }, function(error) {
//                delay.reject(error.data);
//             });
//            return delay.promise;
//        };

        svc.pushRB = function(host,username,password) {
            var delay = $q.defer();
            var httpHeaders = {};
            httpHeaders['Accept'] = 'application/json';
            var auth =  base64.encode(username + ':' + password);
            httpHeaders['Authorization'] = 'Basic ' + auth;
            $http.post('api/testplans/pushRB').then(function (re) {
                //httpHeaders.common['Authorization'] = null;

                console.log("SUCCESS")
                //delay.resolve(auth);
            }, function(error){
                console.log("ERROR");
                delay.reject(error);
            });


            // $http.get(host+'/api/accounts/login', {headers:httpHeaders}).then(function (re) {
            //     httpHeaders.common['Authorization'] = null;
            //
            //     console.log("SUCCESS")
            //     //delay.resolve(auth);
            // }, function(error){
            //     console.log("ERROR");
            //     delay.reject(error);
            // });
            return delay.promise;
        };

        svc.exportToGVT = function(id,mids, auth) {
            var httpHeaders = {};
            httpHeaders['gvt-auth'] = auth;
            return
        };

        return svc;
    }]);

