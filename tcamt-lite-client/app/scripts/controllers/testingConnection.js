/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').controller('loginTestingTool', ['$rootScope', '$modalInstance', 'loginTestingToolSvc', function($rootScope, $modalInstance,loginTestingToolSvc) {
    $rootScope.error = {text: undefined, show:false};
    $rootScope.testingUrl='https://hit-dev.nist.gov:8098/iztool';
    $rootScope.username='wakili';
    $rootScope.password='Ae725055';
    $rootScope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $rootScope.submit = function() {
        $rootScope.error = {text: undefined, show:false};
        loginTestingToolSvc.push($rootScope.testingUrl,$rootScope.username, $rootScope.password).then(function(auth){
            $modalInstance.close(auth);
        }, function(error){
            $rootScope.error.text =  error.data != null ? error.data : "ERROR: Cannot access server.";
            $rootScope.error.show =true;
        });
    };
}])
