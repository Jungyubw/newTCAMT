/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('IgamtResourceGetter',
    ['$q','$modal', '$rootScope','base64','$http',function ($q,$modal,$rootScope,base64,$http) {

        var svc = this;

        svc.findUserIG=function(){
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+"allUserIgs").then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;

        };
        svc.getIgDocument=function(id){
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+"ig"+"/"+id).then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;


        };
        svc.getMessage=function(id){
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+"message"+"/"+id).then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;


        };
        svc.getSegment=function(id){
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+"segment"+"/"+id).then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;


        };
        svc.getTable=function (id) {
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+"table"+"/"+id).then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;


        };

        svc.getByTypeAndId=function (type, id) {
            var delay = $q.defer();

            $http.get($rootScope.appInfo.igamtBaseUrl+"/"+type+"/"+id).then(function (result) {
                delay.resolve(angular.fromJson(result.data));
            },function (error) {
                delay.reject(error.data);
            });
            return delay.promise;


        };



        return svc;
    }]);

