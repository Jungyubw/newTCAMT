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

        svc.push = function( host,username, password) {
            var delay = $q.defer();
            var httpHeaders = {};
            
            httpHeaders['Accept'] = 'application/json';
            var auth =  base64.encode(username + ':' + password);
            httpHeaders['Authorization'] = 'Basic ' + auth;

            $http.get(host+'/accounts/login', {headers:httpHeaders}).then(function (re) {
                delay.resolve(auth);
                console.log("OK");
                httpHeaders['testing-auth'] = auth;
                $http.post('api/testplans/' + $rootScope.testplan.id + '/pushRB',{headers:httpHeaders});

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

