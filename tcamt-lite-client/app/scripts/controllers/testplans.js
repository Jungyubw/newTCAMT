/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('TestPlanCtrl', function ($scope, $rootScope, $templateCache, Restangular, $http, $filter, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, IgDocumentService, ElementUtils,AutoSaveService,$sce) {
	$scope.loading = false;
    $scope.selectedTestStepTab = 1;
	$rootScope.tps = [];
	$scope.testPlanOptions=[];
	$scope.accordi = {metaData: false, definition: true, igList: true, igDetails: false};
	$rootScope.usageViewFilter = 'All';
	$rootScope.selectedTemplate=null;
	$scope.DocAccordi = {};
	$scope.DocAccordi.testdata = false;
	$scope.DocAccordi.messageContents = false;
	$scope.DocAccordi.jurorDocument = false;
	$scope.nistStd = {};
	$scope.nistStd.nist = false;
	$scope.nistStd.std = false;


	$scope.exportTestPackageHTML = function () {
		$scope.populateTestSteps();

		var changes = angular.toJson([]);
		var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});
		$http.post('api/testplans/save', data).then(function (response) {
			var saveResponse = angular.fromJson(response.data);
			$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
			$rootScope.saved = true;
		}, function (error) {
			$rootScope.saved = false;
		});


		var form = document.createElement("form");
		form.action = $rootScope.api('api/testplans/' + $rootScope.selectedTestPlan.id + '/exportRB/');
		form.method = "POST";
		form.target = "_target";
		var csrfInput = document.createElement("input");
		csrfInput.name = "X-XSRF-TOKEN";
		csrfInput.value = $cookies['XSRF-TOKEN'];
		form.appendChild(csrfInput);
		form.style.display = 'none';
		document.body.appendChild(form);
		form.submit();

	};

	$scope.exportCoverHTML = function () {
		$scope.populateTestSteps();

		var changes = angular.toJson([]);
		var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});
		$http.post('api/testplans/save', data).then(function (response) {
			var saveResponse = angular.fromJson(response.data);
			$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
			$rootScope.saved = true;
		}, function (error) {
			$rootScope.saved = false;
		});


		var form = document.createElement("form");
		form.action = $rootScope.api('api/testplans/' + $rootScope.selectedTestPlan.id + '/exportCover/');
		form.method = "POST";
		form.target = "_target";
		var csrfInput = document.createElement("input");
		csrfInput.name = "X-XSRF-TOKEN";
		csrfInput.value = $cookies['XSRF-TOKEN'];
		form.appendChild(csrfInput);
		form.style.display = 'none';
		document.body.appendChild(form);
		form.submit();

	};

	$scope.populateTestSteps = function () {
		$rootScope.selectedTestPlan.children.forEach(function(child) {
			if(child.type == "testcasegroup"){
				child.testcases.forEach(function(testcase){
					var testCaseName = testcase.name;
					testcase.teststeps.forEach(function(teststep){
						teststep = $scope.populateTestStep(teststep, testCaseName);
					});
				});
			}else if(child.type == "testcase"){
				child.teststeps.forEach(function(teststep){
					var testCaseName = testcase.name;
					teststep = $scope.populateTestStep(teststep, testCaseName);
				});
			}
		});
	};

	$scope.populateTestStep = function (teststep, testCaseName) {

		if(teststep != null){
			if(teststep.testDataCategorizationMap == undefined){
				teststep.testDataCategorizationMap = {};
			}

			if(teststep.integrationProfileId != undefined && teststep.integrationProfileId !== null){
				$http.get('api/igdocuments/' + teststep.integrationProfileId + '/tcamtProfile').then(function (response) {
					var selectedIntegrationProfile = angular.fromJson(response.data);
					if(teststep.conformanceProfileId != undefined && teststep.conformanceProfileId !== ''){
						var selectedConformanceProfile =_.find(selectedIntegrationProfile.messages.children, function(m) {
							return m.id == teststep.conformanceProfileId;
						});

						if(selectedConformanceProfile){
							var listLineOfMessage = teststep.er7Message.split("\n");

							var nodeList = [];
							$scope.travelConformanceProfile(selectedConformanceProfile, "", "", "", "" , "",  nodeList, 10, selectedIntegrationProfile);

							var segmentList = [];
							var currentPosition = 0;

							for(var i in listLineOfMessage){
								currentPosition = $scope.getSegment(segmentList, nodeList, currentPosition, listLineOfMessage[i]);
							};
							teststep.messageContentsXMLCode = $scope.generateMessageContentXML(segmentList, teststep, selectedConformanceProfile, selectedIntegrationProfile);
							teststep.nistXMLCode = $scope.generateXML(segmentList, selectedIntegrationProfile, selectedConformanceProfile, testCaseName,false);
							teststep.stdXMLCode = $scope.generateXML(segmentList, selectedIntegrationProfile, selectedConformanceProfile, testCaseName,true);
						}

					}
				}, function (error) {
					teststep.integrationProfileId = null;
					teststep.conformanceProfileId = null;
				});
			}else {
				teststep.integrationProfileId = null;
				teststep.conformanceProfileId = null;
			}
		}

		return teststep;

	};


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

	$scope.loadIGDocuments = function () {
		var delay = $q.defer();
		$scope.error = null;
		$rootScope.igs = [];
		$scope.loading = true;

		$http.get('api/igdocuments').then(function(response) {
			$rootScope.igs = angular.fromJson(response.data);
			$scope.loading = false;
			delay.resolve(true);
		}, function(error) {
			$scope.loading = false;
			$scope.error = error.data;
			delay.reject(false);

		});
	};

    $scope.loadTemplate = function () {
        var delay = $q.defer();
        $scope.error = null;
        $rootScope.templatesToc = [];
        $rootScope.template = {};
        $scope.loading = true;

        $http.get('api/template').then(function(response) {
            $rootScope.template = angular.fromJson(response.data);
            $rootScope.templatesToc.push($rootScope.template);
            $scope.loading = false;
            delay.resolve(true);
        }, function(error) {
            $scope.loading = false;
            $scope.error = error.data;
            delay.reject(false);

        });
    };

	$scope.applyConformanceProfile = function (igid, mid) {
		$rootScope.selectedTestStep.integrationProfileId = igid;
		$rootScope.selectedTestStep.conformanceProfileId = mid;
		$scope.loadIntegrationProfile();
	};


	$scope.initTestPlans = function () {
		$scope.loadIGDocuments();
		$scope.loadTestPlans();
        $scope.loadTemplate();
		$scope.getScrollbarWidth();
	};

    $scope.deleteProfile = function (){
        $rootScope.selectedIntegrationProfile = null;
        $rootScope.selectedConformanceProfile = null;
        $rootScope.selectedTestStep.integrationProfileId = null;
        $rootScope.selectedTestStep.conformanceProfileId = null;
    };

	$scope.isNotManualTestStep = function(){
		if($rootScope.selectedTestStep == null || $rootScope.selectedTestStep.integrationProfileId == null) return false;
		return true;
	};

	$scope.loadIntegrationProfile = function () {
		if($rootScope.selectedTestStep.integrationProfileId != undefined && $rootScope.selectedTestStep.integrationProfileId !== null){
			$http.get('api/igdocuments/' + $rootScope.selectedTestStep.integrationProfileId + '/tcamtProfile').then(function (response) {
				$rootScope.selectedIntegrationProfile = angular.fromJson(response.data);
				$scope.loadConformanceProfile();
			}, function (error) {
				$rootScope.selectedIntegrationProfile = null;
				$rootScope.selectedTestStep.integrationProfileId = null;
				$rootScope.selectedTestStep.conformanceProfileId = null;
			});
		}else {
			$rootScope.selectedIntegrationProfile = null;
			$rootScope.selectedTestStep.integrationProfileId = null;
			$rootScope.selectedTestStep.conformanceProfileId = null;
		}
	};

	$scope.loadConformanceProfile = function () {
		if($rootScope.selectedTestStep.conformanceProfileId != undefined && $rootScope.selectedTestStep.conformanceProfileId !== ''){
			$rootScope.selectedConformanceProfile =_.find($rootScope.selectedIntegrationProfile.messages.children, function(m) {
				return m.id == $rootScope.selectedTestStep.conformanceProfileId;
			});
		}else {
			$rootScope.selectedConformanceProfile = null;
		}
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

	$scope.openCreateMessageTemplateModal = function() {
		var modalInstance = $modal.open({
			templateUrl: 'MessageTemplateCreationModal.html',
			controller: 'MessageTemplateCreationModalCtrl',
			size: 'md',
			resolve: {
			}
		});
		modalInstance.result.then(function() {
		});
	};

	$scope.openCreateSegmentTemplateModal = function() {
		var modalInstance = $modal.open({
			templateUrl: 'SegmentTemplateCreationModal.html',
			controller: 'SegmentTemplateCreationModalCtrl',
			size: 'md',
			resolve: {
			}
		});
		modalInstance.result.then(function() {
		});
	};

	$scope.openCreateEr7TemplateModal = function() {
		var modalInstance = $modal.open({
			templateUrl: 'Er7TemplateCreationModal.html',
			controller: 'Er7TemplateCreationModalCtrl',
			size: 'md',
			resolve: {
			}
		});
		modalInstance.result.then(function() {
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
                $scope.editTestPlan();
				$rootScope.selectedTestPlan = testplan;
                $rootScope.selectedTestStep = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.editTestPlan = function () {
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$scope.subview = "EditTestPlanMetadata.html";
	};
	
	$scope.OpenIgMetadata= function(ig){
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$rootScope.igDocument=ig;
		$scope.subview = "EditDocumentMetadata.html";

	}
	
	$scope.OpenMessageMetadata= function(msg){
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$rootScope.message=msg;
		$scope.subview = "MessageMetadata.html";

	}
	$scope.selectTestCaseGroup = function (testCaseGroup) {
		if (testCaseGroup != null) {
			waitingDialog.show('Opening Test Case Group...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
                $scope.editTestCaseGroup();
				$rootScope.selectedTestCaseGroup = testCaseGroup;
                $rootScope.selectedTestStep = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.editTestCaseGroup = function () {
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$scope.subview = "EditTestCaseGroupMetadata.html";
	};

	$scope.selectTestCase = function (testCase) {
		if (testCase != null) {
			waitingDialog.show('Opening Test Case ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
                $scope.editTestCase();
				$rootScope.selectedTestCase = testCase;
                $rootScope.selectedTestStep = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.editTestCase = function () {
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$scope.subview = "EditTestCaseMetadata.html";
	};

	$scope.selectTestStep = function (testStep) {
		if (testStep != null) {
			waitingDialog.show('Opening Test Step ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedIntegrationProfile = null;
				$rootScope.selectedTestStep = testStep;
				if($rootScope.selectedTestStep.testDataCategorizationMap == undefined || $rootScope.selectedTestStep == null){
					$rootScope.selectedTestStep.testDataCategorizationMap = {};
				}
				$scope.selectedTestStepTab = 1;
				$scope.editTestStep();
				$scope.loadIntegrationProfile();
                waitingDialog.hide();
			}, 100);

		}
	};

    $scope.changeTestStepTab = function (tabNum) {
        $scope.selectedTestStepTab = tabNum;
    };

    $scope.isSelectedTestStepTab = function (tabNum) {
      return   tabNum == $scope.selectedTestStepTab;
    };

	$scope.editTestStep = function () {
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
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

	$scope.updateTransport = function () {
		if($rootScope.selectedTestPlan.type == 'DataInstance'){
			$rootScope.selectedTestPlan.transport = false;
		}else {
			$rootScope.selectedTestPlan.transport = true;
		}
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

        $http.post('api/template/save', $rootScope.template).then(function (response) {
        }, function (error) {
            $rootScope.saved = false;
        });

		$rootScope.isChanged = false;
	};

	$scope.updateMessage = function() {
		var conformanceProfile = _.find($rootScope.selectedIntegrationProfile.messages.children,function(m){
			return m.id == $rootScope.selectedTestStep.conformanceProfileId
		});

		var listLineOfMessage = $rootScope.selectedTestStep.er7Message.split("\n");

		var nodeList = [];
		$scope.travelConformanceProfile(conformanceProfile, "", "", "", "" , "",  nodeList, 10, $rootScope.selectedIntegrationProfile);

		$rootScope.segmentList = [];
		var currentPosition = 0;

		for(var i in listLineOfMessage){
			currentPosition = $scope.getSegment($rootScope.segmentList, nodeList, currentPosition, listLineOfMessage[i]);
		};
	};

	$scope.getSegment = function (segmentList, nodeList, currentPosition, segmentStr) {
		var segmentName = segmentStr.substring(0,3);

		for(var index = currentPosition; index < nodeList.length; index++){
			if(nodeList[index].obj.name === segmentName){
				nodeList[index].segmentStr = segmentStr;
				segmentList.push(nodeList[index]);
				return index + 1;
			}
		}
		return currentPosition;
	};

	$scope.getInstanceValue = function (str) {
		return str.substring(str.indexOf('[') + 1, str.indexOf(']'));
	};

	$scope.initHL7EncodedMessageTab = function () {
	};

	$scope.initTestData = function () {
		$scope.testDataAccordi = {};
		$scope.testDataAccordi.segmentList = true;
		$scope.testDataAccordi.selectedSegment = false;
		$scope.testDataAccordi.constraintList = false;
		$scope.updateMessage();
		$rootScope.selectedSegmentNode = null;
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
			fieldValues.push('^~\\&');
			for(var index = 2; index < splittedSegment.length; index++){
				fieldValues.push(splittedSegment[index]);
			}
		}else {
			for(var index = 1; index < splittedSegment.length; index++){
				fieldValues.push(splittedSegment[index]);
			}
		}


		for(var i = 0; i < segment.obj.fields.length; i++){
			var fieldInstanceValues = [];
			if(splittedSegment[0] === 'MSH' && i == 1) {
				fieldInstanceValues.push('^~\\&');
			}else {
				if (fieldValues[i] != undefined) fieldInstanceValues = fieldValues[i].split("~");
			}

			for(var h = 0; h < fieldInstanceValues.length; h++){
				var fieldNode = {
					type: 'field',
					path : segment.path + "." + (i + 1),
					iPath : segment.iPath + "." + (i + 1) + "[" + (h + 1) + "]",
					positionPath : segment.positionPath + "." + (i + 1),
					positioniPath : segment.positioniPath + "." + (i + 1) + "[" + (h + 1) + "]",
					usagePath : segment.usagePath + "-" + segment.obj.fields[i].usage,
					field: segment.obj.fields[i],
					dt: $scope.findDatatype(segment.obj.fields[i].datatype, $rootScope.selectedIntegrationProfile),
					value: fieldInstanceValues[h],
					children : []
				};


				if(segment.obj.dynamicMapping.mappings.length > 0) {
					for(var z = 0; z < segment.obj.dynamicMapping.mappings.length ; z++){
						var mapping = segment.obj.dynamicMapping.mappings[z];

						if(mapping.position){
							if(mapping.position === i + 1){
								var referenceValue = null;
								var secondReferenceValue = null;

								if(mapping.reference){
									referenceValue =  fieldValues[mapping.reference - 1];
									if(mapping.secondReference) {
										secondReferenceValue =  fieldValues[mapping.secondReference - 1];
									}

									if(secondReferenceValue == null){
										var caseFound = _.find(mapping.cases, function(c){ return referenceValue.split("^")[0] == c.value; });
										if(caseFound){
											fieldNode.dt = $scope.findDatatypeById(caseFound.datatype, $rootScope.selectedIntegrationProfile);
										}

									}else{
										var caseFound = _.find(mapping.cases, function(c){
											return referenceValue.split("^")[0] == c.value && secondReferenceValue.split("^")[0] == c.secondValue;
										});

										if(!caseFound){
											caseFound = _.find(mapping.cases, function(c){
												return referenceValue.split("^")[0] == c.value && (c.secondValue == '' || c.secondValue == undefined);
											});
										}
										if(caseFound){
											fieldNode.dt = $scope.findDatatypeById(caseFound.datatype, $rootScope.selectedIntegrationProfile);
										}
									}

								}
							}
						}
					}
				}

                var fieldTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(fieldNode.iPath)];

                if(fieldTestDataCategorizationObj != undefined && fieldTestDataCategorizationObj != null){
                    fieldNode.testDataCategorization = fieldTestDataCategorizationObj.testDataCategorization;
                    fieldNode.testDataCategorizationListData = fieldTestDataCategorizationObj.listData;
                }

				fieldNode.conformanceStatments = $scope.findConformanceStatements(segment.obj.conformanceStatements, i + 1);
				fieldNode.predicate = $scope.findPredicate(segment.obj.predicates, i + 1);


				if(fieldNode.conformanceStatments.length > 0){
					for (index in fieldNode.conformanceStatments) {
						var cs = fieldNode.conformanceStatments[index];
						var assertionObj =  $.parseXML(cs.assertion);
						if(assertionObj && assertionObj.childNodes.length > 0){
							var assertionElm = assertionObj.childNodes[0];
							if(assertionElm.childNodes.length > 1){
								if(assertionElm.childNodes[1].nodeName === 'PlainText'){
									fieldNode.testDataCategorization = 'Value-Profile Fixed';
									fieldNode.testDataCategorizationListData = null;
								}
							}
						}
					}
				}


				var componentValues = [];
				if (fieldInstanceValues[h] != undefined) componentValues = fieldInstanceValues[h].split("^");

				for(var j = 0; j < fieldNode.dt.components.length; j++){

					var componentNode = {
						type: 'component',
						path : fieldNode.path + "." + (j + 1),
						iPath : fieldNode.iPath + "." + (j + 1) + "[1]",
						positionPath : fieldNode.positionPath + "." + (j + 1),
						positioniPath : fieldNode.positioniPath + "." + (j + 1) + "[1]",
						usagePath : fieldNode.usagePath + "-" + fieldNode.dt.components[j].usage,
						component: fieldNode.dt.components[j],
						dt: $scope.findDatatype(fieldNode.dt.components[j].datatype, $rootScope.selectedIntegrationProfile),
						value: componentValues[j],
						children : []
					};
                    var componentTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(componentNode.iPath)];

                    if(componentTestDataCategorizationObj != undefined && componentTestDataCategorizationObj != null){
                        componentNode.testDataCategorization = componentTestDataCategorizationObj.testDataCategorization;
                        componentNode.testDataCategorizationListData = componentTestDataCategorizationObj.listData;
                    }

					componentNode.conformanceStatments = $scope.findConformanceStatements(fieldNode.dt.conformanceStatements, j + 1);
					componentNode.predicate = $scope.findPredicate(fieldNode.dt.predicates, j + 1);

					if(componentNode.conformanceStatments.length > 0){
						for (index in componentNode.conformanceStatments) {
							var cs = componentNode.conformanceStatments[index];
							var assertionObj =  $.parseXML(cs.assertion);
							if(assertionObj && assertionObj.childNodes.length > 0){
								var assertionElm = assertionObj.childNodes[0];
								if(assertionElm.childNodes.length > 1){
									if(assertionElm.childNodes[1].nodeName === 'PlainText'){
										componentNode.testDataCategorization = 'Value-Profile Fixed';
										componentNode.testDataCategorizationListData = null;
									}
								}
							}
						}
					}


					var subComponentValues = [];
					if (componentValues[j] != undefined) subComponentValues = componentValues[j].split("&");
					for(var k = 0; k < componentNode.dt.components.length; k++){
						var subComponentNode = {
							type: 'subcomponent',
							path : componentNode.path + "." + (k + 1),
							iPath : componentNode.iPath + "." + (k + 1) + "[1]",
							positionPath : componentNode.positionPath + "." + (k + 1),
							positioniPath : componentNode.positioniPath + "." + (k + 1) + "[1]",
							usagePath : componentNode.usagePath + "-" + componentNode.dt.components[k].usage,
							component: componentNode.dt.components[k],
							dt: $scope.findDatatype(componentNode.dt.components[k].datatype, $rootScope.selectedIntegrationProfile),
							value: subComponentValues[k],
							children : []
						};

                        var subComponentTestDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(subComponentNode.iPath)];

                        if(subComponentTestDataCategorizationObj != undefined && subComponentTestDataCategorizationObj != null){
                            subComponentNode.testDataCategorization = subComponentTestDataCategorizationObj.testDataCategorization;
                            subComponentNode.testDataCategorizationListData = subComponentTestDataCategorizationObj.listData;
                        }

						subComponentNode.conformanceStatments = $scope.findConformanceStatements(componentNode.dt.conformanceStatements, k + 1);
						subComponentNode.predicate = $scope.findPredicate(componentNode.dt.predicates, k + 1);

						if(subComponentNode.conformanceStatments.length > 0){
							for (index in subComponentNode.conformanceStatments) {
								var cs = subComponentNode.conformanceStatments[index];
								var assertionObj =  $.parseXML(cs.assertion);
								if(assertionObj && assertionObj.childNodes.length > 0){
									var assertionElm = assertionObj.childNodes[0];
									if(assertionElm.childNodes.length > 1){
										if(assertionElm.childNodes[1].nodeName === 'PlainText'){
											subComponentNode.testDataCategorization = 'Value-Profile Fixed';
											subComponentNode.testDataCategorizationListData = null;
										}
									}
								}
							}
						}

						componentNode.children.push(subComponentNode);
					}

					fieldNode.children.push(componentNode);


				}

				$rootScope.selectedSegmentNode.children.push(fieldNode);
			}


		}
		$scope.refreshTree();
	};

	$scope.findTestCaseNameOfTestStep = function(){
		var result = "NoName";
		$rootScope.selectedTestPlan.children.forEach(function(child) {

			if(child.type == "testcasegroup"){
				child.testcases.forEach(function(testcase){
					testcase.teststeps.forEach(function(teststep){
						if(teststep.id == $rootScope.selectedTestStep.id){
							result = testcase.name;
						}
					});
				});
			}else if(child.type == "testcase"){
				child.teststeps.forEach(function(teststep){
					if(teststep.id == $rootScope.selectedTestStep.id){
						result = testcase.name;
					}
				});
			}
		});

		return result;
	};

	$scope.generateSupplementDocuments = function () {
		$scope.initTestData();
		$scope.generateTestDataSpecificationHTML();
		$scope.generateJurorDocumentHTML();
		$scope.generateMessageContentHTML();
	};

	$scope.generateTestDataSpecificationHTML = function () {
		if($rootScope.selectedTestStep.tdsXSL && $rootScope.selectedTestStep.tdsXSL !== ""){
			var data = {};
			data.type = $rootScope.selectedTestStep.tdsXSL;
			data.xml = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),false));

			$http.post('api/testplans/supplementsGeneration', data).then(function (response) {
				$rootScope.testDataSpecificationHTML = $sce.trustAsHtml(angular.fromJson(response.data).xml);
			}, function (error) {
			});
		}else{
			$rootScope.testDataSpecificationHTML = "No TestData Specification";
		}
	};

	$scope.generateJurorDocumentHTML = function () {
		if($rootScope.selectedTestStep.jdXSL && $rootScope.selectedTestStep.jdXSL !== ""){
			var data = {};
			data.type = $rootScope.selectedTestStep.jdXSL;
			data.xml = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),false));

			$http.post('api/testplans/supplementsGeneration', data).then(function (response) {
				$rootScope.jurorDocumentsHTML = $sce.trustAsHtml(angular.fromJson(response.data).xml);
			}, function (error) {
			});
		}else{
			$rootScope.jurorDocumentsHTML = "No Juror Document";
		}
	};

	$scope.generateMessageContentHTML = function () {
		var data = {};
		data.type = 'MessageContents';
		data.xml = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);

		$http.post('api/testplans/supplementsGeneration', data).then(function (response) {
			$rootScope.messageContentsHTML = $sce.trustAsHtml(angular.fromJson(response.data).xml);
		}, function (error) {
		});
	};

	//TODO Check OBX-5
	$scope.generateMessageContentXML = function(segmentList, testStep, selectedConformanceProfile, selectedIntegrationProfile) {
		var rootName = "MessageContent";
		var xmlString = '<' + rootName + '>' + '</' + rootName + '>';
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlString, "text/xml");
		var rootElement = xmlDoc.getElementsByTagName(rootName)[0];

		segmentList.forEach(function(instanceSegment) {
			var segment = instanceSegment.obj;
			var segName = segment.name;
			var segDesc = segment.description;
			var segmentiPath = instanceSegment.iPath;

			var segmentElement = xmlDoc.createElement("Segment");
			segmentElement.setAttribute("Name", segName);
			segmentElement.setAttribute("Description", segDesc);
			segmentElement.setAttribute("InstancePath", instanceSegment.iPath);
			rootElement.appendChild(segmentElement);

			for (var i = 0; i < segment.fields.length; i++){
				var field = segment.fields[i];
				if (!$scope.isHideForMessageContentByUsage(segment, field, instanceSegment.path + "." + field.position, instanceSegment.positioniPath + "." + field.position + "[1]", selectedConformanceProfile)) {
					var wholeFieldStr = $scope.getFieldStrFromSegment(segName, instanceSegment, field.position);
					var fieldRepeatIndex = 0;

					for (var j = 0; j < wholeFieldStr.split("~").length; j++) {
						var fieldStr = wholeFieldStr.split("~")[j];
						var fieldDT = $scope.findDatatype(field.datatype, selectedIntegrationProfile);
						if (segName == "MSH" && field.position == 1) {
							fieldStr = "|";
						}
						if (segName == "MSH" && field.position == 2) {
							fieldStr = "^~\\&";
						}
						fieldRepeatIndex = fieldRepeatIndex + 1;
						var fieldiPath = "." + field.position + "[" + fieldRepeatIndex + "]";



						if(segment.dynamicMapping.mappings.length > 0) {
							for(var z = 0; z < segment.dynamicMapping.mappings.length ; z++){
								var mapping = segment.dynamicMapping.mappings[z];

								if(mapping.position){
									if(mapping.position === field.position){
										var referenceValue = null;
										var secondReferenceValue = null;

										if(mapping.reference){
											referenceValue =  $scope.getFieldStrFromSegment(segName, instanceSegment, mapping.reference);
											if(mapping.secondReference) {
												secondReferenceValue =  $scope.getFieldStrFromSegment(segName, instanceSegment, mapping.secondReference);
											}

											if(secondReferenceValue == null){
												var caseFound = _.find(mapping.cases, function(c){ return referenceValue.split("^")[0] == c.value; });
												if(caseFound){
													fieldDT = $scope.findDatatypeById(caseFound.datatype, selectedIntegrationProfile);
												}

											}else{
												var caseFound = _.find(mapping.cases, function(c){
													return referenceValue.split("^")[0] == c.value && secondReferenceValue.split("^")[0] == c.secondValue;
												});

												if(!caseFound){
													caseFound = _.find(mapping.cases, function(c){
														return referenceValue.split("^")[0] == c.value && (c.secondValue == '' || c.secondValue == undefined);
													});
												}
												if(caseFound){
													fieldDT = $scope.findDatatypeById(caseFound.datatype, selectedIntegrationProfile);
												}
											}

										}
									}
								}
							}
						}

						console.log(fieldDT);
						if (fieldDT == null || fieldDT.components == null || fieldDT.components.length == 0) {
							var tdcstrOfField = "";
							var cateOfField = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath, fieldStr)];
							if(cateOfField) tdcstrOfField = cateOfField.testDataCategorization;

							var fieldElement = xmlDoc.createElement("Field");
							fieldElement.setAttribute("Location", segName + "." + field.position);
							fieldElement.setAttribute("DataElement", field.name);
							fieldElement.setAttribute("Data", fieldStr);
							fieldElement.setAttribute("Categrization", tdcstrOfField);
							segmentElement.appendChild(fieldElement);
						} else {
							var fieldElement = xmlDoc.createElement("Field");
							fieldElement.setAttribute("Location", segName + "." + field.position);
							fieldElement.setAttribute("DataElement", field.name);
							segmentElement.appendChild(fieldElement);

							for (var k = 0 ; k < fieldDT.components.length; k++ ){
								var c = fieldDT.components[k];
								var componentiPath = "." + c.position + "[1]";
								if (!$scope.isHideForMessageContentByUsage(fieldDT, c, instanceSegment.path + "." + field.position + "." + c.position, instanceSegment.positioniPath + "." + field.position + "[1]." + c.position + "[1]", selectedConformanceProfile)) {
									var componentStr = $scope.getComponentStrFromField(fieldStr, c.position);
									if ($scope.findDatatype(c.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(c.datatype, selectedIntegrationProfile).components.length == 0) {
										var tdcstrOfComponent = "";
										var cateOfComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath, componentStr)];
										if(cateOfComponent) tdcstrOfComponent = cateOfComponent.testDataCategorization;

										var componentElement = xmlDoc.createElement("Component");
										componentElement.setAttribute("Location", segName + "." + field.position + "." + c.position);
										componentElement.setAttribute("DataElement", c.name);
										componentElement.setAttribute("Data", componentStr);
										componentElement.setAttribute("Categrization", tdcstrOfComponent);
										fieldElement.appendChild(componentElement);
									} else {
										var componentElement = xmlDoc.createElement("Component");
										componentElement.setAttribute("Location", segName + "." + field.position + "." + c.position);
										componentElement.setAttribute("DataElement", c.name);
										fieldElement.appendChild(componentElement);

										for (var l = 0; l < $scope.findDatatype(c.datatype, selectedIntegrationProfile).components.length; l++){
											var sc = $scope.findDatatype(c.datatype, selectedIntegrationProfile).components[l];
											if (!$scope.isHideForMessageContentByUsage($scope.findDatatype(c.datatype, selectedIntegrationProfile), sc, instanceSegment.path + "." + field.position + "." + c.position + "." + sc.position, instanceSegment.positioniPath + "." + field.position + "[1]." + c.position + "[1]." + sc.position + "[1]", selectedConformanceProfile)) {
												var subcomponentiPath = "." + sc.position + "[1]";
												var subcomponentStr = $scope.getSubComponentStrFromField(componentStr, sc.position);
												var tdcstrOfSubComponent = "";
												var cateOfSubComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath + subcomponentiPath, subcomponentStr)];
												if(cateOfSubComponent) tdcstrOfSubComponent = cateOfSubComponent.testDataCategorization;
												var subComponentElement = xmlDoc.createElement("SubComponent");
												subComponentElement.setAttribute("Location", segName + "." + field.position + "." + c.position + "." + sc.position);
												subComponentElement.setAttribute("DataElement", sc.name);
												subComponentElement.setAttribute("Data", subcomponentStr);
												subComponentElement.setAttribute("Categrization", tdcstrOfSubComponent);
												componentElement.appendChild(subComponentElement);
											}
										}
									}
								}
							}
						}
					}
				}
			}
		});

		var serializer = new XMLSerializer();
		var xmlString = serializer.serializeToString(xmlDoc);

		console.log(xmlString);
		return xmlString;
	};

	$scope.isHideForMessageContentByUsage = function (segment, field, path, iPositionPath, selectedConformanceProfile){
		if(field.hide) return true;

		if(field.usage == 'R') return false;
		if(field.usage == 'RE') return false;

		if(field.usage == 'C'){
			var p = $scope.findPreficate(segment.predicates, field.position + "[1]");

			if(p == null) {
				p = this.findPreficateForMessageAndGroup(path, iPositionPath, selectedConformanceProfile);
			}


			if(p != null){
				if(p.trueUsage == 'R') return false;
				if(p.trueUsage == 'RE') return false;
				if(p.falseUsage == 'R') return false;
				if(p.falseUsage == 'RE') return false;
			}
		}
		return true;
	};

	$scope.findPreficate = function (predicates, path){
		for(var i = 0; i < predicates.length; i++){
			var p = predicates[i];
			if(p.constraintTarget == path) return p;
		}
		return null;
	};

	$scope.findPreficateForMessageAndGroup = function (path, iPositionPath, selectedConformanceProfile){
		var groupPath = selectedConformanceProfile.structID;
		var paths = path.split(".");

		for(var index = 0; index < paths.length; index++){
			var pathData = paths[index];
			groupPath = groupPath + "." + pathData;
			var group = $scope.findGroup(selectedConformanceProfile.children, groupPath);
			var depth = groupPath.split(".").length -1;
			var partIPositionPath = "";
			for(var i=depth; i<paths.length; i++){
				var s = iPositionPath.split(".")[i];
				s = s.substring(0, s.indexOf("[")) + "[1]";
				partIPositionPath = partIPositionPath + "." + s;
			}
			if(group != null){
				for(var i = 0; i < group.predicates.length; i++){
					var p = group.predicates[i];
					if(p.constraintTarget == partIPositionPath.substring(1)) return p;
				}
			}
		}

		for(var i = 0; i < selectedConformanceProfile.length; i++){
			var p = selectedConformanceProfile.predicates[i];
			var partIPositionPath = "";
			for(var i=0; i < paths.length; i++){
				var s = iPositionPath.split(".")[i];
				s = s.substring(0, s.indexOf("[")) + "[1]";
				partIPositionPath = partIPositionPath + "." + s;
			}
			if(p.constraintTarget == partIPositionPath.substring(1)) return p;
		}

		return null;
	};

	$scope.findGroup = function (children, groupPath) {
		for(var i = 0 ; i < children.length; i++){
			if(children[i].type == 'group'){
				var group = children[i];

				if(group.name == groupPath) return group;

				if(groupPath.startsWith(group.name)) {
					return this.findGroup(group.children, groupPath);
				}
			}
		}
		return null;
	};

	$scope.getFieldStrFromSegment = function (segmentName, is, position) {
		// &lt; (<), &amp; (&), &gt; (>), &quot; ("), and &apos; (').
		var segmentStr = is.segmentStr;
		if (segmentName == "MSH") {
			segmentStr = "MSH|FieldSeperator|Encoding|" + segmentStr.substring(9);
		}
		var wholeFieldStr = segmentStr.split("|");

		if (position > wholeFieldStr.length - 1)
			return "";
		else
			return wholeFieldStr[position];
	};

	$scope.getComponentStrFromField = function (fieldStr, position) {
		var componentStr = fieldStr.split("^");

		if (position > componentStr.length)
			return "";
		else
			return componentStr[position - 1];

	};

	$scope.getSubComponentStrFromField = function (componentStr, position) {
		var subComponentStr = componentStr.split("&");

		if (position > subComponentStr.length)
			return "";
		else
			return subComponentStr[position - 1];
	};

	$scope.genSTDNISTXML = function(testcaseName){
		$scope.initTestData();
		$rootScope.selectedTestStep.nistXMLCode = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, testcaseName,false));
		$rootScope.selectedTestStep.stdXMLCode = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, testcaseName,true));
	};

	$scope.formatXml = function (xml) {
		var reg = /(>)\s*(<)(\/*)/g; // updated Mar 30, 2015
		var wsexp = / *(.*) +\n/g;
		var contexp = /(<.+>)(.+\n)/g;
		xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
		var pad = 0;
		var formatted = '';
		var lines = xml.split('\n');
		var indent = 0;
		var lastType = 'other';
		// 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
		var transitions = {
			'single->single': 0,
			'single->closing': -1,
			'single->opening': 0,
			'single->other': 0,
			'closing->single': 0,
			'closing->closing': -1,
			'closing->opening': 0,
			'closing->other': 0,
			'opening->single': 1,
			'opening->closing': 0,
			'opening->opening': 1,
			'opening->other': 1,
			'other->single': 0,
			'other->closing': -1,
			'other->opening': 0,
			'other->other': 0
		};

		for (var i = 0; i < lines.length; i++) {
			var ln = lines[i];
			var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
			var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
			var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
			var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
			var fromTo = lastType + '->' + type;
			lastType = type;
			var padding = '';

			indent += transitions[fromTo];
			for (var j = 0; j < indent; j++) {
				padding += '\t';
			}
			if (fromTo == 'opening->closing')
				formatted = formatted.substr(0, formatted.length - 1) + ln + '\n'; // substr removes line break (\n) from prev loop
			else
				formatted += padding + ln + '\n';
		}

		return formatted;
	};

	$scope.generateXML = function(segmentList, selectedIntegrationProfile, selectedConformanceProfile, testcaseName, isSTD) {
		var rootName = selectedConformanceProfile.structID;
		var xmlString = '<' + rootName + ' testcaseName=\"' + testcaseName + '\">' + '</' + rootName + '>';
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlString, "text/xml");

		var rootElm = xmlDoc.getElementsByTagName(rootName)[0];

		segmentList.forEach(function(segment) {
			var iPathList = segment.iPath.split(".");
			if (iPathList.length == 1) {
				var segmentElm = xmlDoc.createElement(iPathList[0].substring(0,iPathList[0].lastIndexOf("[")));

				if (isSTD){
					$scope.generateSegment(segmentElm, segment, xmlDoc, selectedIntegrationProfile);
				}

				else {
					$scope.generateNISTSegment(segmentElm, segment, xmlDoc, selectedIntegrationProfile);
				}



				rootElm.appendChild(segmentElm);
			} else {
				var parentElm = rootElm;

				for (var i = 0; i < iPathList.length; i++) {
					var iPath = iPathList[i];
					if (i == iPathList.length - 1) {
						var segmentElm = xmlDoc.createElement(iPath.substring(0, iPath.lastIndexOf("[")));
						if (isSTD){
							$scope.generateSegment(segmentElm, segment, xmlDoc, selectedIntegrationProfile);
						}

						else {
							$scope.generateNISTSegment(segmentElm, segment, xmlDoc, selectedIntegrationProfile);
						}
						parentElm.appendChild(segmentElm);
					} else {
						var groupName = iPath.substring(0, iPath.lastIndexOf("["));
						var groupIndex = parseInt(iPath.substring(iPath.lastIndexOf("[") + 1, iPath.lastIndexOf("]")));

						var groups = parentElm.getElementsByTagName(rootName + "." + groupName);
						if (groups == null || groups.length < groupIndex) {
							var group = xmlDoc.createElement(rootName + "." + groupName);
							parentElm.appendChild(group);
							parentElm = group;

						} else {
							parentElm = groups[groupIndex - 1];
						}
					}
				}
			}
		});

		var serializer = new XMLSerializer();
		var xmlString = serializer.serializeToString(xmlDoc);

		return xmlString;
	};

	$scope.generateSegment = function (segmentElm, instanceSegment, xmlDoc, selectedIntegrationProfile) {
		var lineStr = instanceSegment.segmentStr;
		var segmentName = lineStr.substring(0, 3);
		var segment = instanceSegment.obj;
		var variesDT = "";

		if (lineStr.startsWith("MSH")) {
			lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
		}

		var fieldStrs = lineStr.substring(4).split("|");

		for (var i = 0; i < fieldStrs.length; i++) {
			var fieldStrRepeats = fieldStrs[i].split("~");
			for (var g = 0; g < fieldStrRepeats.length;g++) {
				var fieldStr = fieldStrRepeats[g];
				if (fieldStr === "%SEGMENTDVIDER%") {
					var fieldElm = xmlDoc.createElement("MSH.1");
					var value = xmlDoc.createTextNode("|");
					fieldElm.appendChild(value);
					segmentElm.appendChild(fieldElm);
				} else if (fieldStr == "%ENCODINGDVIDER%") {
					var fieldElm = xmlDoc.createElement("MSH.2");
					var value = xmlDoc.createTextNode("^~\\&");
					fieldElm.appendChild(value);
					segmentElm.appendChild(fieldElm);
				} else {
					if (fieldStr != null && fieldStr !== "") {
						if (i < segment.fields.length) {
							var field = segment.fields[i];
							var fieldElm = xmlDoc.createElement(segmentName + "." + field.position);
							if ($scope.findDatatype(field.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(field.datatype, selectedIntegrationProfile).components.length == 0) {
								if (lineStr.startsWith("OBX")) {
									if (field.position == 2) {
										variesDT = fieldStr;
										var value = xmlDoc.createTextNode(fieldStr);
										fieldElm.appendChild(value);
									} else if (field.position == 5) {
										var componentStrs = fieldStr.split("^");

										for (var index = 0; index < componentStrs.length; index++) {
											var componentStr = componentStrs[index];
											var componentElm = xmlDoc.createElement(variesDT + "." + (index + 1));
											var value = xmlDoc.createTextNode(componentStr);
											componentElm.appendChild(value);
											fieldElm.appendChild(componentElm);
										}
									} else {
										var value = xmlDoc.createTextNode(fieldStr);
										fieldElm.appendChild(value);
									}
								} else {
									var value = xmlDoc.createTextNode(fieldStr);
									fieldElm.appendChild(value);
								}
							} else {
								var componentStrs = fieldStr.split("^");
								var componentDataTypeName = $scope.findDatatype(field.datatype, selectedIntegrationProfile).name;
								for (var j = 0; j < componentStrs.length; j++) {
									if (j < $scope.findDatatype(field.datatype, selectedIntegrationProfile).components.length) {
										var component = $scope.findDatatype(field.datatype, selectedIntegrationProfile).components[j];
										var componentStr = componentStrs[j];
										if (componentStr != null && componentStr !== "") {
											var componentElm = xmlDoc.createElement(componentDataTypeName + "." + (j + 1));
											if ($scope.findDatatype(component.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(component.datatype, selectedIntegrationProfile).components.length == 0) {
												var value = xmlDoc.createTextNode(componentStr);
												componentElm.appendChild(value);
											} else {
												var subComponentStrs = componentStr.split("&");
												var subComponentDataTypeName = $scope.findDatatype(component.datatype, selectedIntegrationProfile).name;

												for (var k = 0; k < subComponentStrs.length; k++) {
													var subComponentStr = subComponentStrs[k];
													if (subComponentStr != null && subComponentStr !== "") {
														var subComponentElm = xmlDoc.createElement(subComponentDataTypeName + "." + (k + 1));
														var value = xmlDoc.createTextNode(subComponentStr);
														subComponentElm.appendChild(value);
														componentElm.appendChild(subComponentElm);
													}
												}

											}
											fieldElm.appendChild(componentElm);
										}
									}
								}

							}
							segmentElm.appendChild(fieldElm);
						}
					}
				}
			}
		}
	};

	$scope.generateNISTSegment = function (segmentElm, instanceSegment, xmlDoc, selectedIntegrationProfile) {
		var lineStr = instanceSegment.segmentStr;
		var segmentName = lineStr.substring(0, 3);
		var segment = instanceSegment.obj;

		if (lineStr.startsWith("MSH")) {
			lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
		}

		var fieldStrs = lineStr.substring(4).split("|");

		for (var i = 0; i < fieldStrs.length; i++) {
			var fieldStrRepeats = fieldStrs[i].split("~");
			for (var g = 0; g < fieldStrRepeats.length;g++) {
				var fieldStr = fieldStrRepeats[g];

				if (fieldStr == "%SEGMENTDVIDER%") {
					var fieldElm = xmlDoc.createElement("MSH.1");
					var value = xmlDoc.createTextNode("|");
					fieldElm.appendChild(value);
					segmentElm.appendChild(fieldElm);
				} else if (fieldStr == "%ENCODINGDVIDER%") {
					var fieldElm = xmlDoc.createElement("MSH.2");
					var value = xmlDoc.createTextNode("^~\\&");
					fieldElm.appendChild(value);
					segmentElm.appendChild(fieldElm);
				} else {
					if (fieldStr != null && fieldStr !== "") {
						if (i < segment.fields.length) {
							var field = segment.fields[i];
							var fieldElm = xmlDoc.createElement(segmentName + "." + field.position);
							if ($scope.findDatatype(field.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(field.datatype, selectedIntegrationProfile).components.length == 0) {
								if (lineStr.startsWith("OBX")) {
									if (field.position == 2) {
										var value = xmlDoc.createTextNode(fieldStr);
										fieldElm.appendChild(value);
									} else if (field.position == 5) {
										var componentStrs = fieldStr.split("^");
										for (var index = 0; index < componentStrs.length; index++) {
											var componentStr = componentStrs[index];
											var componentElm = xmlDoc.createElement(segmentName + "." + field.position + "." + (index + 1));
											var value = xmlDoc.createTextNode(componentStr);
											componentElm.appendChild(value);
											fieldElm.appendChild(componentElm);
										}
									} else {
										var value = xmlDoc.createTextNode(fieldStr);
										fieldElm.appendChild(value);
									}
								} else {
									var value = xmlDoc.createTextNode(fieldStr);
									fieldElm.appendChild(value);
								}
							} else {
								var componentStrs = fieldStr.split("^");
								for (var j = 0; j < componentStrs.length; j++) {
									if (j < $scope.findDatatype(field.datatype, selectedIntegrationProfile).components.length) {
										var component = $scope.findDatatype(field.datatype, selectedIntegrationProfile).components[j];
										var componentStr = componentStrs[j];
										if (componentStr != null && componentStr !== "") {
											var componentElm = xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (j + 1));
											if ($scope.findDatatype(component.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(component.datatype, selectedIntegrationProfile).components.length == 0){
												var value = xmlDoc.createTextNode(componentStr);
												componentElm.appendChild(value);
											} else {
												var subComponentStrs = componentStr.split("&");
												for (var k = 0; k < subComponentStrs.length; k++) {
													var subComponentStr = subComponentStrs[k];
													if (subComponentStr != null && subComponentStr !== "") {
														var subComponentElm = xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (j + 1) + "." + (k + 1));
														var value = xmlDoc.createTextNode(subComponentStr);
														subComponentElm.appendChild(value);
														componentElm.appendChild(subComponentElm);
													}
												}

											}
											fieldElm.appendChild(componentElm);
										}
									}
								}

							}
							segmentElm.appendChild(fieldElm);
						}
					}
				}
			}
		}
	};

	$scope.segmentListAccordionClicked = function () {
		if ($scope.testDataAccordi.segmentList === false) {
			$scope.testDataAccordi = {};
			$scope.testDataAccordi.selectedSegment = false;
			$scope.testDataAccordi.constraintList = false;
		}
	};

	$scope.segmentAccordionClicked = function () {
		if ($scope.testDataAccordi.selectedSegment === false) {
			$scope.testDataAccordi = {};
			$scope.testDataAccordi.segmentList = false;
			$scope.testDataAccordi.constraintList = false;
		}
	};
	// $scope.documentAccordionClicked= function () {

	// }
	$scope.constraintAccordionClicked = function () {
		if($scope.testDataAccordi.constraintList === false){
			$scope.testDataAccordi = {};
			$scope.testDataAccordi.segmentList = false;
			$scope.testDataAccordi.selectedSegment = false;


			if($rootScope.selectedTestStep && $rootScope.selectedTestStep.testDataCategorizationMap){

				var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
						return i;
				});

				$scope.listOfTDC = [];

				keys.forEach(function(key){
					var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

					if(testDataCategorizationObj != undefined && testDataCategorizationObj != null){
						if(testDataCategorizationObj.testDataCategorization && testDataCategorizationObj.testDataCategorization !== ''){
							var cate = {};
							cate.iPath = testDataCategorizationObj.iPath;
							cate.name = testDataCategorizationObj.name;
							cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
							cate.listData = testDataCategorizationObj.listData;
							$scope.listOfTDC.push(cate);
						}
					}
				});
			}
		}
	};


	$scope.findConformanceStatements = function(conformanceStatements, i){
		return _.filter(conformanceStatements, function(cs){
			return cs.constraintTarget == i + '[1]';
		});
	};

	$scope.findPredicate = function(predicates, i){
		return _.find(predicates, function(cp){
			return cp.constraintTarget == i + '[1]';
		});
	};

	$scope.travelConformanceProfile = function (parent, path, ipath, positionPath, positioniPath, usagePath, nodeList, maxSize, selectedIntegrationProfile) {
		for(var i in parent.children){
			var child = parent.children[i];
			if(child.type === 'segmentRef'){
				var obj = $scope.findSegment(child.ref, selectedIntegrationProfile);

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
						type: 'segment',
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
							type: 'segment',
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

					$scope.travelConformanceProfile(child, groupPath, groupiPath, groupPositionPath, groupiPositionPath, groupUsagePath, nodeList, maxSize, selectedIntegrationProfile);
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

						$scope.travelConformanceProfile(child, groupPath, groupiPath, groupPositionPath, groupiPositionPath, groupUsagePath, nodeList,  maxSize, selectedIntegrationProfile);
					}
				}
			}
		};
	};


	$scope.findTable = function (ref){
        if(ref === undefined || ref === null) return null;
		if($rootScope.selectedIntegrationProfile == undefined || $rootScope.selectedIntegrationProfile == null) return null;
		return _.find($rootScope.selectedIntegrationProfile.tables.children,function(t){
			return t.id == ref.id;
		});
	};

	$scope.findDatatype = function (ref, selectedIntegrationProfile){
        if(ref === undefined || ref === null) return null;
		if(selectedIntegrationProfile == undefined || selectedIntegrationProfile == null) return null;
		return _.find(selectedIntegrationProfile.datatypes.children,function(d){
			return d.id == ref.id;
		});
	};

	$scope.findDatatypeById = function (id, selectedIntegrationProfile){
		if(id === undefined || id === null) return null;
		if(selectedIntegrationProfile == undefined || selectedIntegrationProfile == null) return null;
		return _.find(selectedIntegrationProfile.datatypes.children,function(d){
			return d.id == id;
		});
	};

	$scope.findSegment = function (ref, selectedIntegrationProfile){
		if(ref === undefined || ref === null) return null;
		if(selectedIntegrationProfile == undefined || selectedIntegrationProfile == null) return null;
		return _.find(selectedIntegrationProfile.segments.children,function(s){
			return s.id == ref.id;
		});
	};

	$scope.editorOptions = {
		lineWrapping : false,
		lineNumbers: true,
		mode: 'xml'
	};

	$scope.refreshTree = function () {
		if ($scope.segmentParams)
			$scope.segmentParams.refresh();
	};

	$scope.minimizePath = function (iPath) {

		if($rootScope.selectedSegmentNode){
			return $scope.replaceAll(iPath.replace($rootScope.selectedSegmentNode.segment.iPath + "." ,""), "[1]","");
		}

		return '';
	};

	$scope.replaceAll = function(str, search, replacement) {
		return str.split(search).join(replacement);
	};

	$scope.usageFilter = function (node) {
		if(node.type == 'field') {
			if(node.field.usage === 'R') return true;
			if(node.field.usage === 'RE') return true;
			if(node.field.usage === 'C') return true;
		} else {
			if(node.component.usage === 'R') return true;
			if(node.component.usage === 'RE') return true;
			if(node.component.usage === 'C') return true;
		}


		return false;
	};

	$scope.changeUsageFilter = function () {
		if($rootScope.usageViewFilter === 'All') $rootScope.usageViewFilter = 'RREC';
		else $rootScope.usageViewFilter = 'All';
	};

	$scope.segmentParams = new ngTreetableParams({
		getNodes: function (parent) {
			if (parent && parent != null) {
				if($rootScope.usageViewFilter != 'All'){
					return parent.children.filter($scope.usageFilter);

				}else {
					return parent.children;
				}
			}else {
				if($rootScope.usageViewFilter != 'All'){
					if($rootScope.selectedSegmentNode) return $rootScope.selectedSegmentNode.children.filter($scope.usageFilter);
				}else{
					if($rootScope.selectedSegmentNode) return $rootScope.selectedSegmentNode.children;
				}
			}
			return [];
		},
		getTemplate: function (node) {
			if(node.type == 'field') return 'FieldTree.html';
			else if (node.type == 'component') return 'ComponentTree.html';
			else if (node.type == 'subcomponent') return 'SubComponentTree.html';
			else return 'FieldTree.html';
		}
	});

	$scope.hasChildren = function (node) {
		if(!node || !node.children || node.children.length === 0) return false;
		return true;
	};

	$scope.filterForSegmentList = function(segment)
	{
		if(segment.usagePath.indexOf('O') > -1 || segment.usagePath.indexOf('X') > -1){
			return false;
		}
		return true;
	};



	$scope.selectedCols = [];
	$scope.colsData = [
		{id: 1, label: "DT"},
		{id: 2, label: "Usage"},
		{id: 3, label: "Cardi."},
		{id: 4, label: "Length"},
		{id: 5, label: "ValueSet"},
		{id: 6, label: "Predicate"},
		{id: 7, label: "Conf.Statement"}];

	$scope.smartButtonSettings = {
		smartButtonMaxItems: 8,
		smartButtonTextConverter: function(itemText, originalItem) {
			return itemText;
		}
	};

	$scope.isShow = function (columnId) {
		return _.find($scope.selectedCols, function(col){
			return col.id == columnId;
		});
	};

	$scope.updateTestDataCategorization = function (node) {
		if($rootScope.selectedTestStep.testDataCategorizationMap == undefined || $rootScope.selectedTestStep == null){
			$rootScope.selectedTestStep.testDataCategorizationMap = {};
		}

        var name = '';
        if(node.type == 'field') name = node.field.name;
        else if (node.type == 'component') name = node.component.name;
        else if (node.type == 'subcomponent') name = node.component.name;

        var testDataCategorizationObj = {
            iPath: node.iPath,
            testDataCategorization: node.testDataCategorization,
            name: name,
            listData : []
        };

		$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = testDataCategorizationObj;

	};

    $scope.replaceDot2Dash = function(path){
        return path.split('.').join('-');
    };

    $scope.deleteSegmentTemplate = function (template){
        var index = $rootScope.template.segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.segmentTemplates.splice(index, 1);
        }
    };

    $scope.deleteMessageTemplate = function (template){
        var index = $rootScope.template.messageTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.messageTemplates.splice(index, 1);
        }
    };

    $scope.deleteER7Template = function (template){
        var index = $rootScope.template.er7Templates.indexOf(template);
        if (index > -1) {
            $rootScope.template.er7Templates.splice(index, 1);
        }
    };

    $scope.applySegmentTemplate = function (template){
		if($rootScope.selectedTestStep && $rootScope.selectedSegmentNode){
			for(var i in template.categorizations){
				var cate = template.categorizations[i];
				if(cate.testDataCategorization && cate.testDataCategorization !== ''){
					$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash($rootScope.selectedSegmentNode.segment.iPath + cate.iPath)] = cate;
				}
			}

			$scope.initTestData();

			if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.segment){
				$scope.selectSegment($rootScope.selectedSegmentNode.segment);
				$scope.refreshTree();
			}
		}
    };

    $scope.applyMessageTemplate = function (template){
		if($rootScope.selectedTestStep){
			for(var i in template.categorizations){
				var cate = template.categorizations[i];
				if(cate.testDataCategorization && cate.testDataCategorization !== ''){
					$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(cate.iPath)] = cate;
				}
			}

			$scope.initTestData();

			if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.segment){
				$scope.selectSegment($rootScope.selectedSegmentNode.segment);
				$scope.refreshTree();
			}
		}
    };

	$scope.overwriteMessageTemplate = function (template){
		if($rootScope.selectedTestStep){
			$rootScope.selectedTestStep.testDataCategorizationMap = {};
			$scope.applyMessageTemplate(template);
		}
	};


    $scope.overwriteSegmentTemplate = function (template){
		if($rootScope.selectedTestStep && $rootScope.selectedSegmentNode){
			var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
				if(i.includes($rootScope.selectedSegmentNode.segment.iPath.split('.').join('-')))
					return i;
			});

			keys.forEach(function(key){
				$rootScope.selectedTestStep.testDataCategorizationMap[key] = null;
			});

			$scope.applySegmentTemplate(template);
		}
    };

    $scope.overwriteER7Template = function (template){
		if($rootScope.selectedTestStep){
			$rootScope.selectedTestStep.er7Message = template.er7Message;

			$scope.initTestData();

			if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.segment){
				$scope.selectSegment($rootScope.selectedSegmentNode.segment);
				$scope.refreshTree();
			}
		}
    };

	$scope.deleteRepeatedField = function(node){
		var index = $rootScope.selectedSegmentNode.children.indexOf(node);
		if (index > -1) {
			$rootScope.selectedSegmentNode.children.splice(index, 1);
		}
		$scope.updateValue(node);
		$scope.refreshTree();
	};

	$scope.addRepeatedField = function (node) {
		var fieldStr = node.value;
		var fieldPosition = node.path.substring(node.path.lastIndexOf('.') + 1);
		var splittedSegment = $rootScope.selectedSegmentNode.segment.segmentStr.split("|");
		if($rootScope.selectedSegmentNode.segment.obj.name == 'MSH') fieldPosition = fieldPosition -1;
		splittedSegment[fieldPosition] = splittedSegment[fieldPosition] + '~' + fieldStr;
		var updatedStr = '';
		for(var i in splittedSegment){
			updatedStr = updatedStr + splittedSegment[i];
			if(i < splittedSegment.length - 1) updatedStr = updatedStr + "|"
		}
		$rootScope.selectedSegmentNode.segment.segmentStr = updatedStr;
		var updatedER7Message = '';
		for(var i in $rootScope.segmentList){
			updatedER7Message = updatedER7Message + $rootScope.segmentList[i].segmentStr + '\n';
		}
		$rootScope.selectedTestStep.er7Message = updatedER7Message;
		$scope.selectSegment($rootScope.selectedSegmentNode.segment);
	};

	$scope.updateValue =function(node){
		var segmentStr = $rootScope.selectedSegmentNode.segment.obj.name;
		var previousFieldPath = '';
		for(var i in $rootScope.selectedSegmentNode.children){
			var fieldNode = $rootScope.selectedSegmentNode.children[i];
			if(previousFieldPath === fieldNode.positionPath){
				segmentStr = segmentStr + "~"
			}else {
				segmentStr = segmentStr + "|"
			}

			previousFieldPath = fieldNode.positionPath;

			if(fieldNode.children.length === 0){
				if(fieldNode.value != undefined || fieldNode.value != null) segmentStr = segmentStr + fieldNode.value;
			}else {
				for(var j in fieldNode.children) {
					var componentNode = fieldNode.children[j];
					if(componentNode.children.length === 0){
						if(componentNode.value != undefined || componentNode.value != null) segmentStr = segmentStr + componentNode.value;
						segmentStr = segmentStr + "^";
					}else {
						for(var k in componentNode.children) {
							var subComponentNode = componentNode.children[k];
							if(subComponentNode.value != undefined || subComponentNode.value != null) segmentStr = segmentStr + subComponentNode.value;
							segmentStr = segmentStr + "&";
                            if(k == componentNode.children.length - 1){
								segmentStr = $scope.reviseStr(segmentStr, '&');
							}
						}
                        segmentStr = segmentStr + "^";
					}

                    if(j == fieldNode.children.length - 1){
                        segmentStr = $scope.reviseStr(segmentStr, '^');
                    }
				}
			}

            if(i == $rootScope.selectedSegmentNode.children.length - 1){
                segmentStr = $scope.reviseStr(segmentStr, '|');
            }

		}
        if(segmentStr.substring(0,11) == "MSH|||^~\\&|") segmentStr = 'MSH|^~\\&|' + segmentStr.substring(11);

        $rootScope.selectedSegmentNode.segment.segmentStr = segmentStr;

		var updatedER7Message = '';

		for(var i in $rootScope.segmentList){
			updatedER7Message = updatedER7Message + $rootScope.segmentList[i].segmentStr + '\n';
		}

		$rootScope.selectedTestStep.er7Message = updatedER7Message;
	};

	$scope.reviseStr = function (str, seperator) {
		var lastChar = str.substring(str.length - 1);
		if(seperator !== lastChar) return str;
		else{
			str = str.substring(0, str.length-1);
			return $scope.reviseStr(str, seperator);
		}

	};

	$scope.result="";
	//validation 
	$scope.validate = function () {
		$scope.result="";
		var message = $rootScope.selectedTestStep.er7Message;
		var igDocumentId = $rootScope.selectedTestStep.integrationProfileId;
        var conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;

		var req = {
		    method: 'POST',
		    url: 'api/validation',
		    headers: {
		        'Content-Type': undefined
		    },
		    params: { message: message, igDocumentId: igDocumentId, conformanceProfileId : conformanceProfileId }
		}
		
		

        var promise = $http(req).success(function(data, status, headers, config) {
            $scope.result=$sce.trustAsHtml(data.html);
                return data;
        }).error(function(data,status,headers,config){
            if(status === 404)
                console.log("Could not reach the server");
            else if(status === 403) {
                console.log("limited access");
            }
        });

        return promise;
    };
	
	//Tree Functions
	$scope.activeModel={};

	$scope.treeOptions = {

		accept: function(sourceNodeScope, destNodesScope, destIndex) {
			//destNodesScope.expand();
			var dataTypeSource = sourceNodeScope.$element.attr('data-type');
			var dataTypeDest = destNodesScope.$element.attr('data-type');
							console.log("source"+ dataTypeSource );
				console.log("destination "+ dataTypeDest);
			if(dataTypeSource==="childrens"){
				return false;
			}
			if(dataTypeSource==="child"){
				if(dataTypeDest==="childrens"){
					return true;
				}else if(!sourceNodeScope.$modelValue.testcases && dataTypeDest==='group'){

					return true;
				}
				else{
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
			//$scope.recordChanged();


		}
	};




	$scope.updatePositions= function(arr){

		for (var i = arr.length - 1; i >= 0; i--){
			arr[i].position=i+1;
		}
	};




	$scope.Activate= function(itemScope){
		$scope.activeModel=itemScope.$modelValue;
		//$scope.activeId=itemScope.$id;
	};

	$scope.isCase = function(children){

		if(!children.teststeps){
			return false;
		}else {return true; }
	}

	$scope.cloneteststep=function(teststep){
		var model ={};
		model.name=teststep.name+"clone";
	}

	$scope.isGroupe = function(children){

		if(!children.testcases){
			return false;
		}else {return true; }
	}
// Context menu 



	$scope.testPlanOptions = [
		['add new testgroup', function($itemScope) {
			if( !$itemScope.$nodeScope.$modelValue.children){
				$itemScope.$nodeScope.$modelValue.children=[];
			}
			$itemScope.$nodeScope.$modelValue.children.push({
				id: new ObjectId().toString(),
				type : "testcasegroup",
				name: "newTestGroup",
				testcases:[],
				position:$itemScope.$nodeScope.$modelValue.children.length+1});

			$scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];

			$scope.recordChanged();

		}],

		['Add new testcase', function($itemScope) {
			if( !$itemScope.$nodeScope.$modelValue.children){
				$itemScope.$nodeScope.$modelValue.children=[];
			}
			$itemScope.$nodeScope.$modelValue.children.push(
				{
					id: new ObjectId().toString(),
					type : "testcase",
					name: "newTestCase",
					teststeps:[],
					position:$itemScope.$nodeScope.$modelValue.children.length+1
				});

			$scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
			$scope.recordChanged();
		}
		]
	];

	$scope.testGroupOptions = [
		['add new testCase', function($itemScope) {

			$itemScope.$nodeScope.$modelValue.testcases.push({
				id: new ObjectId().toString(),
				type : "testcase",
				name: "testCaseAdded",
				position: $itemScope.$nodeScope.$modelValue.testcases.length+1,
				teststeps:[]

			});
			$scope.activeModel=$itemScope.$nodeScope.$modelValue.testcases[$itemScope.$nodeScope.$modelValue.testcases.length-1];

			$scope.recordChanged();
		}],
		null,
		['clone', function($itemScope) {
			var clone = $scope.cloneTestCaseGroup($itemScope.$nodeScope.$modelValue);

			var name =  $itemScope.$nodeScope.$modelValue.name;
			var model =  $itemScope.$nodeScope.$modelValue;
			// clone.name=name+"(clone)";

			// var testcases=[];

			// clone.testcases=testcases;


			// for (var i = model.testcases.length - 1; i >= 0; i--){
			// 	var  testcase={};
			// 	testcase.name=model.testcases[i].name;
			// 	testcase.position=model.testcases[i].position;

			// 	testcase.teststeps=[];
			// 	for (var j = model.testcases[i].teststeps.length - 1; j >= 0; j--){
			// 		var teststep={};
			// 		teststep.name=model.testcases[i].teststeps[j].name;
			// 		teststep.position=model.testcases[i].teststeps[j].position;
			// 		testcase.teststeps.push(teststep);
			// 	}

			// 	testcases.push(testcase);
			// }
			// clone.testcases=testcases;
			clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
			$itemScope.$nodeScope.$parent.$modelValue.push(clone);
			$scope.activeModel=clone;

		}],
		null,
		['delete', function($itemScope) {
			$itemScope.$nodeScope.remove();
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
		}]

	];


	$scope.testCaseOptions =[
		['add new teststep', function($itemScope) {

			if( !$itemScope.$nodeScope.$modelValue.teststeps){
				$itemScope.$nodeScope.$modelValue.teststeps=[];
			}

            var newTestStep = {
                id: new ObjectId().toString(),
                type : "teststep",
                name : "newteststep",
                position : $itemScope.$nodeScope.$modelValue.teststeps.length+1,
                testStepStory: {}
            };
            console.log(newTestStep);

            newTestStep.testStepStory.comments = "No Comments";
            newTestStep.testStepStory.evaluationCriteria = "No evaluation criteria";
            newTestStep.testStepStory.notes = "No Note";
            newTestStep.testStepStory.postCondition = "No PostCondition";
            newTestStep.testStepStory.preCondition = "No PreCondition";
            newTestStep.testStepStory.testObjectives = "No Objectives";
            newTestStep.testStepStory.teststorydesc = "No Description";
            console.log($itemScope.$nodeScope.$modelValue.teststeps);
            newTestStep.conformanceProfileId=null;
            newTestStep.integrationProfileId=null;
            $rootScope.selectedTestStep=newTestStep;
            $scope.selectTestStep(newTestStep);
            $scope.activeModel=newTestStep;
			$itemScope.$nodeScope.$modelValue.teststeps.push(newTestStep);
			console.log($itemScope.$nodeScope.$modelValue.teststeps);
			$scope.recordChanged();

		}],
		null,
		['clone', function($itemScope) {

			var clone = $scope.cloneTestCase($itemScope.$nodeScope.$modelValue);
			clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
			$itemScope.$nodeScope.$parent.$modelValue.push(clone);
			$scope.activeModel=clone;

		}],
		null,
		['delete', function($itemScope) {
			$itemScope.$nodeScope.remove();
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
		}]

	];

	$scope.testStepOptions = [

		['clone', function($itemScope) {
			//var cloneModel= {};
			//var name =  $itemScope.$nodeScope.$modelValue.name;
			//name=name+"(copy)";
			//cloneModel.name=name;
			var clone=$scope.cloneTestStep($itemScope.$nodeScope.$modelValue);
			clone.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
			$scope.activeModel=clone;
			//cloneModel.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
			$itemScope.$nodeScope.$parentNodesScope.$modelValue.push(clone);

			//$scope.activeModel=$itemScope.$nodeScope.$parentNodesScope.$modelValue[$itemScope.$nodeScope.$parentNodesScope.$modelValue.length-1];

		}],
		null, ['delete', function($itemScope) {
			$itemScope.$nodeScope.remove();
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue)
		}]

	];

    $scope.MessageOptions=[



		['Delete Template', function($itemScope) {
			$scope.subview=null;
		$scope.deleteMessageTemplate($itemScope.msgTmp);

		}],
		null, ['Apply', function($itemScope) {
			$scope.applyMessageTemplate($itemScope.msgTmp);
		}],
		null,
		['Overwrite', function($itemScope) {
			$scope.overwriteMessageTemplate($itemScope.msgTmp);
		}]

	];

    $scope.SegmentOptions=[



		['Delete Template', function($itemScope) {
			$scope.subview=null;
		$scope.deleteSegmentTemplate($itemScope.segTmp);


		}],
		null, ['Apply Template', function($itemScope) {
			$scope.applySegmentTemplate($itemScope.segTmp);
		}],
		null,
		['Overwrite Template', function($itemScope) {
			$scope.overwriteSegmentTemplate($itemScope.segTmp);
		}]

	];

	  $scope.Er7Options=[



		['Delete Template', function($itemScope) {
			$scope.subview=null;
		$scope.deleteER7Template($itemScope.er7Tmp);

		}],
		null,
		['Overwrite Template', function($itemScope) {
		$scope.overwriteER7Template($itemScope.er7Tmp);
		}]


	];


	$scope.ApplyProfile = [

	                  		['Apply Profile', function($itemScope) {
	                  			$scope.applyConformanceProfile($itemScope.ig.id, $itemScope.msg.id);
	                  		}]
	                  		

	                  	];

	$scope.messagetempCollapsed=false;
	$scope.segmenttempCollapsed=false;
	$scope.Er7Collapsed=false;

    $scope.switchermsg= function(bool){
		$scope.messagetempCollapsed = !$scope.messagetempCollapsed;
	};

    $scope.switcherseg= function(bool){
	    $scope.segmenttempCollapsed = !$scope.segmenttempCollapsed;
	};

	$scope.switcherIg= function(bool){
	    $scope.segmenttempCollapsed = !$scope.segmenttempCollapsed;
	};
	 $scope.switcherEr7= function(bool){
	    $scope.Er7Collapsed = !$scope.Er7Collapsed;
	};
	$scope.ChildVisible=function(ig){
		if($rootScope.selectedTestStep===null || ig.id===$rootScope.selectedTestStep.integrationProfileId){
			return true;
		}
		else if($rootScope.selectedTestStep===null){
			return true;
		}
		

	}
	$scope.OpenMsgTemplateMetadata=function(msgtemp){
		$rootScope.selectedTemplate=msgtemp;
		$rootScope.selectedSegmentNode =null;
		
		$scope.msgTemplate=msgtemp;

		$scope.subview = "MessageTemplateMetadata.html";
	}
	$scope.OpenTemplateMetadata=function(temp){
		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode=null;

		$scope.rootTemplate=temp;
		$scope.subview = "TemplateMetadata.html";
	}
	$scope.OpenSegmentTemplateMetadata=function(segTemp){
		$rootScope.selectedTemplate=segTemp; //never used
		$rootScope.selectedSegmentNode=null;
		$scope.segmentTemplateObject=segTemp;
		$scope.subview = "SegmentTemplateMetadata.html";
	}

	$scope.OpenEr7TemplatesMetadata=function(er7temp){
		$rootScope.selectedTemplate=er7temp;
		$rootScope.selectedSegmentNode =null;
		$scope.er7Template=er7temp;
		$scope.subview = "Er7TemplateMetadata.html";
	}

	$scope.cloneTestStep=function(testStep){
		var clone= angular.copy(testStep);
		clone.name= testStep.name+"_copy";
		clone.id= new ObjectId().toString();
		console.log(clone);
		return clone;
	}
	$scope.cloneTestCase= function(testCase){
		var clone= angular.copy(testCase);
		clone.name= testCase.name+"_copy";
		clone.id= new ObjectId().toString();
		clone.teststeps=[];
		if(testCase.teststeps.length>0){
			angular.forEach(testCase.teststeps, function(teststep){
				clone.teststeps.push($scope.cloneTestStep(teststep));

			});

		}
		return clone;
	};

	$scope.cloneTestCaseGroup=function(testCaseGroup){
		var clone = angular.copy(testCaseGroup);
		clone.name= testCaseGroup.name+"_copy";
		clone.id= new ObjectId().toString();
		clone.testcases=[];
		if(testCaseGroup.testcases.length>0){
			angular.forEach(testCaseGroup.testcases, function(testcase){
				clone.testcases.push($scope.cloneTestCase(testcase));

			});
		}

		return clone;
	};




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

angular.module('tcl').controller('MessageTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {

	var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
		return i;
	});
	$scope.newMessageTemplate = {};
	$scope.newMessageTemplate.id = new ObjectId().toString();
	$scope.newMessageTemplate.name = 'new Template for ' + $rootScope.selectedConformanceProfile.name;
	$scope.newMessageTemplate.descrption = 'No Desc';
	$scope.newMessageTemplate.date = new Date();
	$scope.newMessageTemplate.integrationProfileId = $rootScope.selectedIntegrationProfile.id;
	$scope.newMessageTemplate.conformanceProfileId =  $rootScope.selectedConformanceProfile.id;

	$scope.newMessageTemplate.categorizations = [];
	keys.forEach(function(key){
		var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

		if(testDataCategorizationObj != undefined && testDataCategorizationObj != null){
			if(testDataCategorizationObj.testDataCategorization && testDataCategorizationObj.testDataCategorization !== ''){
				var cate = {};
				cate.iPath = testDataCategorizationObj.iPath;
				cate.name = testDataCategorizationObj.name;
				cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
				cate.listData = testDataCategorizationObj.listData;
				$scope.newMessageTemplate.categorizations.push(cate);
			}
		}
	});

	$scope.createMessageTemplate = function() {
		$rootScope.template.messageTemplates.push($scope.newMessageTemplate);
		$modalInstance.close();

	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
});

angular.module('tcl').controller('SegmentTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {

	var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
		if(i.includes($rootScope.selectedSegmentNode.segment.iPath.split('.').join('-')))
			return i;
	});
	$scope.newSegmentTemplate = {};
	$scope.newSegmentTemplate.id = new ObjectId().toString();
	$scope.newSegmentTemplate.name = 'new Template for ' + $rootScope.selectedSegmentNode.segment.obj.name;
	$scope.newSegmentTemplate.descrption = 'No Desc';
	$scope.newSegmentTemplate.segmentName = $rootScope.selectedSegmentNode.segment.obj.name;
	$scope.newSegmentTemplate.date = new Date();
	$scope.newSegmentTemplate.categorizations = [];
	keys.forEach(function(key){
		var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

		if(testDataCategorizationObj != undefined && testDataCategorizationObj != null){
			var cate = {};
			cate.iPath = testDataCategorizationObj.iPath.replace($rootScope.selectedSegmentNode.segment.iPath,'');
			cate.name = testDataCategorizationObj.name;
			cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
			cate.listData = testDataCategorizationObj.listData;
			$scope.newSegmentTemplate.categorizations.push(cate);
		}
	});

	$scope.createSegmentTemplate = function() {
		$rootScope.template.segmentTemplates.push($scope.newSegmentTemplate);
		$modalInstance.close();

	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
});

angular.module('tcl').controller('Er7TemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {
	$scope.newEr7Template = {};
	$scope.newEr7Template.id = new ObjectId().toString();
	$scope.newEr7Template.name = 'new Er7 Template for ' + $rootScope.selectedConformanceProfile.name;
	$scope.newEr7Template.descrption = 'No Desc';
	$scope.newEr7Template.date = new Date();
	$scope.newEr7Template.integrationProfileId = $rootScope.selectedIntegrationProfile.id;
	$scope.newEr7Template.conformanceProfileId =  $rootScope.selectedConformanceProfile.id;
	$scope.newEr7Template.er7Message = $rootScope.selectedTestStep.er7Message;

	$scope.createEr7Template = function() {
		$rootScope.template.er7Templates.push($scope.newEr7Template);
		$modalInstance.close();

	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
});