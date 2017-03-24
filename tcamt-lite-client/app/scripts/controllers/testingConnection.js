/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').controller('loginTestingTool', ['$scope','$rootScope', '$modalInstance', 'loginTestingToolSvc', 'base64','$http','$q','Notification',function($scope,$rootScope, $modalInstance,loginTestingToolSvc,base64,$http,$q,Notification) {
    $rootScope.error = {text: undefined, show:false};
    $scope.testingUrl= 'https://hit-dev.nist.gov:8099/gvt';


   $scope.user={
       username:'',
       password:''
   }
    $rootScope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.submit = function(testingUsername,testingPassword) {

        $rootScope.error = {text: undefined, show:false};
        loginTestingToolSvc.pushRB( $scope.testingUrl,testingUsername,  testingPassword).then(function(auth){


                console.log("Done");

            $modalInstance.dismiss('cancel');
        }, function(error){
            console.log(error);
            $rootScope.error.text =  error.data != null ? error.data : "ERROR: Cannot access server.";
            $rootScope.error.show =true;
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
                $modalInstance.close();

               // $rootScope.s.text =  error.data != null ? error.data : "ERROR: Cannot access server.";
                $rootScope.error.show =false;
                Notification.success({message:"We are processing your request. You will be notified by e-mail once we are done", delay: 2000});
                $scope.submit(username, password);
            }else{
                $rootScope.error.text = "ERROR: Cannot access server. Please verify you Credentials";
                $rootScope.error.show =true;
            }

            delay.resolve(response);

        }, function(er){
            delay.reject(er);
        });
        return delay.promise;
    };




}])
