/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').controller('loginTestingTool', ['$scope','$rootScope', '$mdDialog', 'loginTestingToolSvc', 'base64','$http','$q','Notification','testplan','mode',function($scope,$rootScope, $mdDialog,loginTestingToolSvc,base64,$http,$q,Notification,testplan,mode) {
    $rootScope.error = {text: undefined, show:false};
    $scope.testplan=testplan;
    $scope.mode=mode;
    $scope.testingUrl= 'https://hit-dev.nist.gov:8099/gvt';

    $scope.alert=false;
    $scope.alertText='';
   $scope.user={
       username:'',
       password:''
   }
    $scope.cancel = function() {
        $mdDialog.hide();
    };

    $scope.submit = function(testingUsername,testingPassword) {

        $rootScope.error = {text: undefined, show:false};
        loginTestingToolSvc.pushRB( $scope.testingUrl,testingUsername, testingPassword).then(function(auth){



            $mdDialog.hide('cancel');
        }, function(error){
            console.log(error);
            $scope.alertText =  error.data != null ? error.data : "ERROR: Cannot access server.";
            $scope.alert =true;
        });
    };
    $scope.delete = function(testingUsername,testingPassword) {

        $rootScope.error = {text: undefined, show:false};
        loginTestingToolSvc.deleteRB( $scope.testingUrl,testingUsername, testingPassword).then(function(auth){



            $mdDialog.hide('cancel');
        }, function(error){
            console.log(error);
            $scope.alertText =  error.data != null ? error.data : "ERROR: Cannot access server.";
            $scope.alert =true;
        });
    };


    $scope.login = function(username, password) {
        var delay = $q.defer();
        var httpHeaders = {};
        httpHeaders['Accept'] = 'application/json';
        var auth =  base64.encode(username + ':' + password);
        httpHeaders['gvt-auth'] =auth;
        $http.post('api/testplans/createSession',$scope.testingUrl,{headers:httpHeaders}).then(function (re) {
            console.log($scope.testingUrl);
            var response=angular.fromJson(re.data);

            if(response){

                console.log("SUCCESS")
                $mdDialog.hide();

                $scope.alert=false;



                Notification.success({message:"We are processing your request. You will be notified by e-mail once we are done", delay: 2000});
                $scope.submit(username, password);
            }else{
                $scope.alertText = "ERROR: Cannot access server. Please verify you Credentials";
                $scope.alert=true;
            }

            delay.resolve(response);

        }, function(er){
            delay.reject(er);
        });
        return delay.promise;
    };
    $scope.initAlert=function(){
        $scope.alert=false;
    }



}])
