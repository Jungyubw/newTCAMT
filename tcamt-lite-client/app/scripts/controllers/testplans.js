/**
 * Created by Jungyub on 5/12/16.
 */

angular.module('tcl').controller('TestPlanCtrl', function ($scope, $rootScope, $templateCache, Restangular, $http, $filter, $modal, $cookies, $timeout, userInfoService, ToCSvc, ContextMenuSvc, ProfileAccessSvc, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, DatatypeService, SegmentService, IgDocumentService, ElementUtils,AutoSaveService) {
	$scope.loading = false;
	$rootScope.tps = [];
	$scope.testPlanOptions=[];
	$scope.accordi = {metaData: false, definition: true, igList: true, igDetails: false};
    
	$scope.loadTestPlans = function () {
		var delay = $q.defer();
		$scope.error = null;
		$rootScope.tps = [];
            
		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			waitingDialog.show('Loading TestPlans...', {dialogSize: 'xs', progressType: 'info'});
			$scope.loading = true;
			$http.get('api/testplans').then(function (response) {
				waitingDialog.hide();
				$rootScope.tps = angular.fromJson(response.data);
				$scope.loading = false;
				delay.resolve(true);
			}, function (error) {
				$scope.loading = false;
				$scope.error = error.data;
				waitingDialog.hide();
				delay.reject(false);
			});
		} else {
			delay.reject(false);
		}
		return delay.promise;
	};
        
	$scope.initTestPlans = function () {
		$scope.loadTestPlans();
		$scope.getScrollbarWidth();
	};
        
	$scope.confirmDeleteTestPlan = function (testplan) {
		var modalInstance = $modal.open({
			templateUrl: 'ConfirmTestPlanDeleteCtrl.html',
			controller: 'ConfirmTestPlanDeleteCtrl',
			resolve: {
				testplanToDelete: function () {
					return testplan;
				}
			}
		});
		modalInstance.result.then(function (testplan) {
			$scope.testplanToDelete = testplan;
			var idxP = _.findIndex($rootScope.tps, function (child) {
				return child.id === testplan.id;
			});
			$rootScope.tps.splice(idxP, 1);
		});
	};
        
	$scope.createNewTestPlan = function () {
		var newTestPlan = {
				id: new ObjectId().toString(),
				name: 'New TestPlan',
				accountId : userInfoService.getAccountID()
		};
		var changes = angular.toJson([]);
		var data = angular.fromJson({"changes": changes, "tp": newTestPlan});
		$http.post('api/testplans/save', data).then(function (response) {
			var saveResponse = angular.fromJson(response.data);
			newTestPlan.lastUpdateDate = saveResponse.date;
			$rootScope.saved = true;
		}, function (error) {
			$rootScope.saved = false;
		});
		$rootScope.tps.push(newTestPlan);
		$scope.selectTestPlan(newTestPlan);
	};
        
	$scope.selectTestPlan = function (testplan) {
		if (testplan != null) {
			waitingDialog.show('Opening Test Plan...', {dialogSize: 'xs', progressType: 'info'});
			$scope.selectIgTab(1);
			
			$rootScope.testplans = [];
			$rootScope.testplans.push(testplan);
			
			
			$timeout(function () {
				$rootScope.selectedTestPlan = testplan;
				$scope.editTestPlan();
				waitingDialog.hide();
			}, 100);
		}
	};
         
	$scope.editTestPlan = function () {
		$scope.subview = "EditTestPlanMetadata.html";
		$timeout(
				function () {
				}, 100);
	};
         
	$scope.selectTestCaseGroup = function (testCaseGroup) {
		if (testCaseGroup != null) {
			waitingDialog.show('Opening Test Case Group...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestCaseGroup = testCaseGroup;
				$scope.editTestCaseGroup();
				waitingDialog.hide();
			}, 100);
		}
	};
         
	$scope.editTestCaseGroup = function () {
		$scope.subview = "EditTestCaseGroupMetadata.html";
		$timeout(
				function () {
				}, 100);
	};
          
	$scope.selectTestCase = function (testCase) {
		if (testCase != null) {
			waitingDialog.show('Opening Test Case ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestCase = testCase;
				$scope.editTestCase();
				waitingDialog.hide();
			}, 100);
		}
	};
           
	$scope.editTestCase = function () {
		$scope.subview = "EditTestCaseMetadata.html";
		$timeout(
				function () {
				}, 100);
	};
           
	$scope.selectTestStep = function (testStep) {
		if (testStep != null) {
			waitingDialog.show('Opening Test Step ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestStep = testStep;
				$scope.editTestStep();
				waitingDialog.hide();
			}, 100);
		}
	};
           
	$scope.editTestStep = function () {
		$scope.subview = "EditTestStepMetadata.html";
		$timeout(
				function () {
				}, 100);
	};
            
	$scope.selectIgTab = function (value) {
		if (value === 1) {
			$scope.accordi.igList = false;
			$scope.accordi.igDetails = true;
		} else {
			$scope.accordi.igList = true;
			$scope.accordi.igDetails = false;
		}
	};
	
	$scope.recordChanged = function () {
		$rootScope.isChanged = true;
		$rootScope.selectedTestPlan.isChanged = true;
    };
	
    $scope.saveAllChangedTestPlans = function() {
    	$rootScope.tps.forEach(function(testplan) {
    		if(testplan.isChanged){
    			var changes = angular.toJson([]);
    			var data = angular.fromJson({"changes": changes, "tp": testplan});
    			
    			$http.post('api/testplans/save', data).then(function (response) {
    				var saveResponse = angular.fromJson(response.data);
    				testplan.lastUpdateDate = saveResponse.date;
    				$rootScope.saved = true;
    				testplan.isChanged = false;
    				
    				
    			}, function (error) {
    				$rootScope.saved = false;
    			});
    		}
    	});
    	
    	$rootScope.isChanged = false;
    }
    
	
	//Tree Functions
	$scope.activeModel={};

    $scope.treeOptions = {

        accept: function(sourceNodeScope, destNodesScope, destIndex) {
            //destNodesScope.expand();
            var dataTypeSource = sourceNodeScope.$element.attr('data-type');
            var dataTypeDest = destNodesScope.$element.attr('data-type');


    console.log('source: ' + dataTypeSource + '    target: ' + dataTypeDest);
            if(dataTypeSource==="childrens"){
                return false;
            }
            
            
            if(dataTypeSource==="child"){
            	 if(dataTypeDest==="childrens"){
                     return true;
                 }else if(!sourceNodeScope.$modelValue.testcases && dataTypeDest==='group'){
               
                         return true;
                     } else{
                    	 return false;
                     }
            	
            	
            }
            else if(dataTypeSource==="group"){
                if(dataTypeDest==="childrens"){
               
                return true;
            }else{
          
                    return false;
                }
            }
            
            else if(dataTypeSource==="case"){
              if(dataTypeDest==="group"||dataTypeDest==="childrens"){
                return true;
            }else{
                    return false;
                }
            }
       

            else if(dataTypeSource==="step"){
                 if(dataTypeDest==="case"){
                return true;
            }else{
                    return false;
                }
            }
            else{
                return false;
            }



     
        },
        dropped: function(event) {
         
            var sourceNode = event.source.nodeScope;
            var destNodes = event.dest.nodesScope;
            var sortBefore = event.source.index ;
            var sortAfter = event.dest.index ;

            var dataType = destNodes.$element.attr('data-type');
            event.source.nodeScope.$modelValue.position = sortAfter+1;
            $scope.updatePositions(event.dest.nodesScope.$modelValue);
  			$scope.updatePositions(event.source.nodesScope.$modelValue);
            //console.log( event.source.nodeScope.$parentNodesScope.$modelValue)
      
         

//             for (var i = $scope.testplans.length -1; i >= 0; i--) {
//
//                    for (var j =  $scope.testplans[i].testcases.length - 1; j >= 0; j--) {
//                        $scope.testplans[i].testcases[j].position=j+1+$scope.testplans[i].testcasegroups.length;
//                  
//     
//    }
//
//     
//
//        }


    }
      };




     $scope.updatePositions= function(arr){

    for (var i = arr.length - 1; i >= 0; i--){
        arr[i].position=i+1;


        }



    };




    $scope.Activate= function(itemScope){
    $scope.activeModel=itemScope.$modelValue;
    console.log(itemScope.$modelValue.$$hashKey);
    //$scope.activeId=itemScope.$id;
    };

    $scope.ActivateId= function(id){
    $scope.activeModel=id;
    console.log(itemScope.$modelValue.$$hashKey);
    //$scope.activeId=itemScope.$id;
    };
    
    $scope.cloneTestStep=function(teststep){
    	var newTestStep = {};
    	newTestStep.name = teststep.name+"copy";
    	
    }
    $scope.cloneTestCase=function(testCase){
    	
    }
    
    $scope.isCase = function(children){
    	
    	if(!children.teststeps){
    		return false; 
    	}else {return true; }
    }
    $scope.cloneteststep=function(teststep){
    	var model ={};
    	model.name=teststep.name+"clone";
    }
    
    
    $scope.clonetestcase=function(testcase){
    	var model={teststeps:[]};
    	model.name= testcase.name+"clone";
    	
	    for (var i = testcase.teststeps.length - 1; i >= 0; i--){
	    	model.teststeps.push($scope.cloneteststep(testcases[i]));
	        }

    	return model;
    	
    }
    
    
    
    
  $scope.isGroupe = function(children){
    	
    	if(!children.testcases){
    		return false; 
    	}else {return true; }
    }
// Context menu 
    
  $scope.clonegroup= function($itemScope){
	  var parent=$itemScope.$parent.$modelValue;
	
	  var content=$itemScope.$modelValue;
	  var model={testcases:[]};
	  if(content.hasOwnProperty('testcases')){
		  

		    for (var i = content.testcases.length - 1; i >= 0; i--){
		    model.testcases.push($scope.clonetestcase(content.testcases[i]));
		        }
		
		 $itemScope.$parent.$modelValue.children.push(model);
		 $scope.activeModel=model;
		 
	  }
	  
	  
	  
  }
  

    $scope.testPlanOptions = [
                              ['add new testgroup', function($itemScope) {
                               if( !$itemScope.$nodeScope.$modelValue.children){
                            	  $itemScope.$nodeScope.$modelValue.children=[];
                               }
                                  $itemScope.$nodeScope.$modelValue.children.push({name: "newTestGroup", testcases:[], position:$itemScope.$nodeScope.$modelValue.children.length+1});

                                  console.log($itemScope.$nodeScope.$modelValue.children);
                                  $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];


                                
                              }],
                              
                              ['Add new testcase', function($itemScope) {
                            	  if( !$itemScope.$nodeScope.$modelValue.children){
                                	  $itemScope.$nodeScope.$modelValue.children=[];
                                   }
                                      $itemScope.$nodeScope.$modelValue.children.push({name: "newTestCase", teststeps:[],position:$itemScope.$nodeScope.$modelValue.children.length+1});

                                      $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];

                                  }
                     ]
                          ];
    
//
//
//
//
    
    $scope.cloneindex=1;
    $scope.testGroupOptions = [
                              ['add new testCase', function($itemScope) {
                                 
                                  $itemScope.$nodeScope.$modelValue.testcases.push({
                                      name: "testCaseAdded",
                                      position: $itemScope.$nodeScope.$modelValue.testcases.length+1,
                                      teststeps:[]

                                  });
                                   $scope.activeModel=$itemScope.$nodeScope.$modelValue.testcases[$itemScope.$nodeScope.$modelValue.testcases.length-1];


                              }],
                              null, // Divtitleier
                              ['clone', function($itemScope) {
                            	  
                            	  
                            	 
                                      
                                     var name =  $itemScope.$nodeScope.$modelValue.name;
                                     var model = $itemScope.$nodeScope.$modelValue;
                                     
                                     model.name=name+"(clone)"+ $scope.cloneindex++;
                                   
//                                      model.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
//                                      $itemScope.$nodeScope.$parentNodesScope.$modelValue.push(model);
                            	  
                            	  
                            	  
                            	  //$scope.clonegroup($itemScope);
                            	  $itemScope.$nodeScope.$parent.$modelValue.push(model)
                            	  console.log($itemScope.$nodeScope.$parent.$modelValue)
                            	  
                              }],
                              null, // Divtitleier
                              ['delete', function($itemScope) {
                                          $itemScope.$nodeScope.remove();
                                          $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
                              }]

                          ];
//    
//    
    $scope.testCaseOptions =	[
                              ['add new teststep', function($itemScope) {
                                  
                            	  console.log($itemScope.$parent.$modelValue);
                            	  if( !$itemScope.$nodeScope.$modelValue.teststeps){
                                	  $itemScope.$nodeScope.$modelValue.teststeps=[];
                                   }
                                      $itemScope.$nodeScope.$modelValue.teststeps.push({name: "newteststep", position:$itemScope.$nodeScope.$modelValue.teststeps.length+1});
                            	  
                            	  

                              }],
                              null, // Divtitleier
                              ['clone', function($itemScope) {

                                   var model= {};
                                      var name =  $itemScope.$nodeScope.$modelValue.name;
                                      name=name+"(copy new)";
                                      model.name=name;
                                      var teststeps= $itemScope.$nodeScope.$modelValue.teststeps;
                                      for (i = 0; i < $itemScope.$nodeScope.$modelValue.teststeps.length; i++) {
                                    	  model.teststeps.push(teststeps[i].name);
                                    	   
                                    	}
                                      
                                      
                                      model.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1;
                                      $itemScope.$nodeScope.$parentNodesScope.$modelValue.push(model);
                                      $scope.Activate($itemScope);
                                      
                              }],
                              null, 
                              ['delete', function($itemScope) {
                                      $itemScope.$nodeScope.remove();
                                       $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
                              }]

                          ];

                          $scope.testStepOptions = [

                              ['clone', function($itemScope) {
                                      var cloneModel= {};
                                      var name =  $itemScope.$nodeScope.$modelValue.name;
                                      name=name+"(copy)";
                                      cloneModel.name=name;
                                      cloneModel.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
                                      $itemScope.$nodeScope.$parentNodesScope.$modelValue.push(cloneModel);

                                      $scope.activeModel=$itemScope.$nodeScope.$parentNodesScope.$modelValue[$itemScope.$nodeScope.$parentNodesScope.$modelValue.length-1];
                              
                              }],
                              null, ['delete', function($itemScope) {
                                       $itemScope.$nodeScope.remove();
                                          $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
                              }]

                          ];
	
	
	
});

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl', function ($scope, $modalInstance, testplanToDelete, $rootScope, $http) {
    $scope.testplanToDelete = testplanToDelete;
    $scope.loading = false;
    $scope.deleteTestPlan = function () {
        $scope.loading = true;
        $http.post($rootScope.api('api/testplans/' + $scope.testplanToDelete.id + '/delete')).then(function (response) {
            $rootScope.msg().text = "testplanDeleteSuccess";
            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loading = false;
            $modalInstance.close($scope.testplanToDelete);
        }, function (error) {
            $scope.error = error;
            $scope.loading = false;
            $modalInstance.dismiss('cancel');
            $rootScope.msg().text = "testplanDeleteFailed";
            $rootScope.msg().type = "danger";
            $rootScope.msg().show = true;
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});