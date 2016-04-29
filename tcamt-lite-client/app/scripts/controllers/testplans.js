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
		$scope.loadIntegrationProfileMetaDataList();
	};
	
	$scope.loadIntegrationProfileMetaDataList = function () {
		var delay = $q.defer();
		$scope.error = null;
		$rootScope.integrationProfileMetaDataList = [];
		
		$scope.loading = true;
		$http.get('api/integrationprofiles').then(function (response) {
			$rootScope.integrationProfileMetaDataList = angular.fromJson(response.data);
			$scope.loading = false;
			delay.resolve(true);
		}, function (error) {
			$scope.loading = false;
			$scope.error = error.data;
			delay.reject(false);
		});
		return delay.promise;
	};
	
	$scope.loadIntegrationProfile = function () {
		$rootScope.selectedIntegrationProfile = null;
		if($rootScope.selectedTestStep.integrationProfileId != undefined && $rootScope.selectedTestStep.integrationProfileId !== ''){
			$http.get('api/integrationprofiles/' + $rootScope.selectedTestStep.integrationProfileId).then(function (response) {
				$rootScope.selectedIntegrationProfile = angular.fromJson(response.data);
			}, function (error) {
			});
		}else {
			$rootScope.selectedTestStep.conformanceProfileId = null;
		}
	}
        
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
	};
           
	$scope.selectTestStep = function (testStep) {
		if (testStep != null) {
			waitingDialog.show('Opening Test Step ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestStep = testStep;
				$scope.selectedTestStepTab = 1;
				$scope.editTestStep();
				waitingDialog.hide();
			}, 100);
		}
	};
           
	$scope.editTestStep = function () {
		$scope.subview = "EditTestStepMetadata.html";
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
    };
    
    $scope.loadConformanceProfile = function (){
    };
    
    $scope.updateMessage = function() {
    	var conformanceProfile = _.find($rootScope.selectedIntegrationProfile.messages.children,function(m){ 
			return m.messageID == $rootScope.selectedTestStep.conformanceProfileId 
		});
    	
    	var listLineOfMessage = $rootScope.selectedTestStep.er7Message.split("\n");
    	
    	var nodeList = [];
    	$scope.travelConformanceProfile(conformanceProfile, "", "", "", "" , "",  nodeList, 10);
    	
    	$rootScope.segmentList = [];
    	var currentPosition = 0;
    	
    	for(var i in listLineOfMessage){
    		currentPosition = $scope.getSegment(nodeList, currentPosition, listLineOfMessage[i]);
    	};
    	
    	console.log($rootScope.segmentList);
    	
    };
    
    $scope.getSegment = function (nodeList, currentPosition, segmentStr) {
    	var segmentName = segmentStr.substring(0,3);
    	
    	for(var index = currentPosition; index < nodeList.length; index++){
    		if(nodeList[index].obj.name === segmentName){
    			nodeList[index].segmentStr = segmentStr;
    			$rootScope.segmentList.push(nodeList[index]);
    			return index + 1;
    		}
    	}
    	return currentPosition;
    };
    
    $scope.getInstanceValue = function (str) {
    	return str.substring(str.indexOf('[') + 1, str.indexOf(']'));
    };
    
    $scope.initHL7EncodedMessageTab = function () {
    	$scope.testDataAccordi = {};
    	$scope.testDataAccordi.segmentList = true;
    	$scope.testDataAccordi.selectedSegment = false;
    	$scope.testDataAccordi.constraintList = false;
    };
    
    $scope.selectSegment = function (segment) {
    	$scope.testDataAccordi.segmentList = false;
    	$scope.testDataAccordi.selectedSegment = true;
    	$scope.testDataAccordi.constraintList = false;
    	
    	$rootScope.selectedSegmentNode = {};
    	$rootScope.selectedSegmentNode.segment = segment;
    	$rootScope.selectedSegmentNode.children = [];
    	var splittedSegment = segment.segmentStr.split("|");
    	
    	var fieldValues = [];
    	
    	if(splittedSegment[0] === 'MSH'){
    		fieldValues.push('|');
    	}
    	
    	for(var index = 1; index < splittedSegment.length; index++){
			fieldValues.push(splittedSegment[index]);
		}
    		
    	for(var i = 0; i < segment.obj.fields.length; i++){
    		var fieldInstanceValues = [];
    		if (fieldValues[i] != undefined) fieldInstanceValues = fieldValues[i].split("~");
    		
    		for(var h = 0; h < fieldInstanceValues.length; h++){
    			var fieldNode = {
    					path : segment.path + "." + (i + 1),
    					iPath : segment.iPath + "." + (i + 1) + "[" + (h + 1) + "]",
    					positionPath : segment.positionPath + "." + (i + 1),
    					positioniPath : segment.positioniPath + "." + (i + 1) + "[" + (h + 1) + "]",
    					usagePath : segment.usagePath + "-" + segment.obj.fields[i].usage,
        				field: segment.obj.fields[i],
    					dt: $scope.findDatatype(segment.obj.fields[i].datatype),
    					value: fieldInstanceValues[h],
    					children : []
    			};
        		
    			var componentValues = [];
    			if (fieldInstanceValues[h] != undefined) componentValues = fieldInstanceValues[h].split("^");
    			
        		for(var j = 0; j < fieldNode.dt.components.length; j++){
        			
        			var componentNode = {
        					path : fieldNode.path + "." + (j + 1),
        					iPath : fieldNode.iPath + "." + (j + 1) + "[1]",
        					positionPath : fieldNode.positionPath + "." + (j + 1),
        					positioniPath : fieldNode.positioniPath + "." + (j + 1) + "[1]",
        					usagePath : fieldNode.usagePath + "-" + fieldNode.dt.components[j].usage,
            				component: fieldNode.dt.components[j],
        					dt: $scope.findDatatype(fieldNode.dt.components[j].datatype),
        					value: componentValues[j],
        					children : []
        			};
        			
        			var subComponentValues = [];
        			if (componentValues[j] != undefined) subComponentValues = componentValues[j].split("&");
        			for(var k = 0; k < componentNode.dt.components.length; k++){
        				var subComponentNode = {
            					path : componentNode.path + "." + (k + 1),
            					iPath : componentNode.iPath + "." + (k + 1) + "[1]",
            					positionPath : componentNode.positionPath + "." + (k + 1),
            					positioniPath : componentNode.positioniPath + "." + (k + 1) + "[1]",
            					usagePath : componentNode.usagePath + "-" + componentNode.dt.components[k].usage,
                				component: componentNode.dt.components[k],
            					dt: $scope.findDatatype(componentNode.dt.components[k].datatype),
            					value: subComponentValues[k],
            			};
        				componentNode.children.push(subComponentNode);
        			}
        			
        			fieldNode.children.push(componentNode);
        			
        			
        		}
        		
        		$rootScope.selectedSegmentNode.children.push(fieldNode);
    		}
    		
    		
    	}
    	
    	
    	
    	console.log($rootScope.selectedSegmentNode);
    };
    
    $scope.travelConformanceProfile = function (parent, path, ipath, positionPath, positioniPath, usagePath, nodeList, maxSize) {
    	for(var i in parent.children){
    		var child = parent.children[i];
    		if(child.type === 'segmentRef'){
    			var obj = $scope.findSegment(child.ref);
    			
    			if(child.max === '1'){
    				var segmentPath = null;
        			var segmentiPath = null;
        			var segmentPositionPath = null;
        			var segmentiPositionPath = null;
        			var segmentUsagePath = null;
        			
        			if(path===""){
        				segmentPath = obj.name;
        				segmentiPath = obj.name + "[1]";
        				segmentPositionPath = child.position;
        				segmentiPositionPath = child.position + "[1]";
        				segmentUsagePath = child.usage;
        			}else {
        				segmentPath = path + "." + obj.name;
        				segmentiPath = ipath + "." + obj.name + "[1]";
        				segmentPositionPath = positionPath + "." + child.position;
        				segmentiPositionPath = positioniPath + "." + child.position + "[1]";
        				segmentUsagePath = usagePath + "-" + child.usage;
        			}
        			var node = {
        					path: segmentPath,
        					iPath: segmentiPath,
        					positionPath: segmentPositionPath,
        					positioniPath: segmentiPositionPath,
        					usagePath: segmentUsagePath,
        					obj : obj
        			};
        			nodeList.push(node);
    			}else {
    				for (var index = 1; index < maxSize + 1; index++) { 
        				var segmentPath = null;
            			var segmentiPath = null;
            			var segmentPositionPath = null;
            			var segmentiPositionPath = null;
            			var segmentUsagePath = null;
            			
            			if(path===""){
            				segmentPath = obj.name;
            				segmentiPath = obj.name + "[" + index + "]";
            				segmentPositionPath = child.position;
            				segmentiPositionPath = child.position + "[" + index + "]";
            				segmentUsagePath = child.usage;
            			}else {
            				segmentPath = path + "." + obj.name;
            				segmentiPath = ipath + "." + obj.name + "[" + index + "]";
            				segmentPositionPath = positionPath + "." + child.position;
            				segmentiPositionPath = positioniPath + "." + child.position + "[" + index + "]";
            				segmentUsagePath = usagePath + "-" + child.usage;
            			}
            			
            			var node = {
            					path: segmentPath,
            					iPath: segmentiPath,
            					positionPath: segmentPositionPath,
            					positioniPath: segmentiPositionPath,
            					usagePath: segmentUsagePath,
            					obj : obj
            			};
            			nodeList.push(node);
        			}
    			}
    			
    		}else if(child.type === 'group'){
    			var groupName = child.name;
    			if(groupName.indexOf(".") >= 0) { 
    				groupName = groupName.substr(groupName.lastIndexOf(".") + 1);
    			}
    			
    			
    			if(child.max === '1'){
    				var groupPath = null;
        			var groupiPath = null;
        			var groupPositionPath = null;
        			var groupiPositionPath = null;
        			var groupUsagePath = null;
        			
        			if(path===""){
        				groupPath = groupName;
            			groupiPath = groupName + "[1]";
            			groupPositionPath = child.position;
            			groupiPositionPath = child.position + "[1]";
            			groupUsagePath = child.usage;
        			}else {
        				groupPath = path + "." + groupName;
            			groupiPath = ipath + "." + groupName + "[1]";
            			groupPositionPath = positionPath + "." + child.position;
            			groupiPositionPath = positioniPath + "." + child.position + "[1]";
            			groupUsagePath = usagePath + "-" + child.usage;
        			}
        			
        			$scope.travelConformanceProfile(child, groupPath, groupiPath, groupPositionPath, groupiPositionPath, groupUsagePath, nodeList, maxSize);
    			}else {
    				for (var index = 1; index < maxSize + 1; index++) { 
    					var groupPath = null;
    	    			var groupiPath = null;
    	    			var groupPositionPath = null;
    	    			var groupiPositionPath = null;
    	    			var groupUsagePath = null;
    	    			
    	    			if(path===""){
    	    				groupPath = groupName;
    	        			groupiPath = groupName + "[" + index + "]";
    	        			groupPositionPath = child.position;
    	        			groupiPositionPath = child.position + "[" + index + "]";
    	        			groupUsagePath = child.usage;
    	    			}else {
    	    				groupPath = path + "." + groupName;
    	        			groupiPath = ipath + "." + groupName + "[" + index + "]";
    	        			groupPositionPath = positionPath + "." + child.position;
    	        			groupiPositionPath = positioniPath + "." + child.position + "[" + index + "]";
    	        			groupUsagePath = usagePath + "-" + child.usage;
    	    			}
    	    			
    	    			$scope.travelConformanceProfile(child, groupPath, groupiPath, groupPositionPath, groupiPositionPath, groupUsagePath, nodeList,  maxSize);
    				}
    			}
    		}
    	};
    };
    
    $scope.findDatatype = function (ref){
    	return _.find($rootScope.selectedIntegrationProfile.datatypes.children,function(d){ 
			return d.id == ref
		});
    };
    
    $scope.findSegment = function (ref){
    	return _.find($rootScope.selectedIntegrationProfile.segments.children,function(s){ 
			return s.id == ref
		});
    };
	
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