/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('TestPlanCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, IgDocumentService, ElementUtils,AutoSaveService,$sce,Notification) {
	$scope.loading = false;
    $scope.selectedTestStepTab = 1;
	$scope.selectedTestCaseTab = 1;
	$rootScope.tps = [];
	$scope.testPlanOptions=[];
	$scope.accordi = {metaData: false, definition: true, tpList: true, tpDetails: false};
	$rootScope.usageViewFilter = 'All';
	$rootScope.selectedTemplate=null;
	$scope.DocAccordi = {};
	$scope.DocAccordi.testdata = false;
	$scope.DocAccordi.messageContents = false;
	$scope.DocAccordi.jurorDocument = false;
	$scope.nistStd = {};
	$scope.nistStd.nist = false;
	$scope.nistStd.std = false;
	$rootScope.changesMap={};
	$rootScope.tocHeigh=300;
	$rootScope.igHeigh=300;
	$rootScope.templateHeigh=300;
	$(document).keydown(function(e) {
		var nodeName = e.target.nodeName.toLowerCase();
		
		var NodeType=e.target.type.toLowerCase();

		if (e.which === 8) {
			if ((nodeName === 'input') ||
				nodeName === 'textarea') {
				// do nothing
			} else {
				e.preventDefault();
			}
		}
	});

	$scope.openDialogForNewTestPlan = function (ev){
		$mdDialog.show({
			controller: $scope.TestPlanCreationModalCtrl,
			templateUrl: 'TestPlanCreationModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
			$scope.loadTestPlans();
		}, function() {
		});
	};


	$scope.openDialogForImportTestPlan = function (ev){
		$mdDialog.show({
			controller: $scope.TestPlanImportModalCtrl,
			templateUrl: 'TestPlanImportModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
			$scope.loadTestPlans();
		}, function() {
		});
	};

	$scope.TestPlanCreationModalCtrl = function($scope,$mdDialog,$http) {
		$scope.newTestPlan = {};
		$scope.newTestPlan.accountId = userInfoService.getAccountID();
		$scope.igamtProfiles = $rootScope.igamtProfiles;
		$scope.privateProfiles = $rootScope.privateProfiles;
		$scope.publicProfiles = $rootScope.publicProfiles;

		$scope.createNewTestPlan = function() {
			var changes = angular.toJson([]);
			var data = angular.fromJson({"changes": changes, "tp": $scope.newTestPlan});
			$http.post('api/testplans/save', data).then(function (response) {
				var saveResponse = angular.fromJson(response.data);
			}, function (error) {
			});
			$mdDialog.hide();
		};

		$scope.cancel = function() {
			$mdDialog.hide();
		};
	};


	$scope.TestPlanImportModalCtrl = function($scope,$mdDialog,$http) {
		$scope.jsonFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var importTestPlanButton = $("#importTestPlanButton");
			if($scope.jsonFilesData.jsonTestPlanFileStr != null){
				importTestPlanButton.prop('disabled', false);
			}

		};

		$scope.validateForTestPlanJSONFile = function(files) {
			var f = document.getElementById('testplanJSONFile').files[0];
			var reader = new FileReader();
			reader.onloadend = function(e) {
				$scope.jsonFilesData.jsonTestPlanFileStr = reader.result;
				var errorElm = $("#errorMessageForJSONTestPlan");
				errorElm.empty();
				errorElm.append('<span>' + files[0].name + ' is loaded!</span>');
				$scope.checkLoadAll();
			};
			reader.readAsText(f);
		};

		$scope.importTestPlanJson = function() {
			var importTestPlanButton = $("#importTestPlanButton");
			importTestPlanButton.prop('disabled', true);

			$http.post('api/testplans/importJSON', $scope.jsonFilesData).then(function (response) {
			}, function () {
			});

			$mdDialog.hide();
		};

	};

	$scope.incrementToc=function(){
		console.log($rootScope.tocHeigh);
		$rootScope.tocHeigh=$rootScope.tocHeigh+50;
	};
	$scope.decrementToc=function(){
		console.log($rootScope.tocHeigh);
		if($rootScope.tocHeigh>50){
			$rootScope.tocHeigh=$rootScope.tocHeigh-50;
		}else{
			$rootScope.tocHeigh=$rootScope.tocHeigh;
		}
	};
	$scope.incrementIg=function(){
		$rootScope.igHeigh=$rootScope.igHeigh+50;
	};
	$scope.decrementIg=function(){
		if($rootScope.igHeigh>50){
			$rootScope.igHeigh=$rootScope.igHeigh-50;
		}else{
			$rootScope.igHeigh=$rootScope.igHeigh;
		}
	};
	$scope.incrementTemplate=function(){
		$rootScope.templateHeigh=$rootScope.templateHeigh+50;
	};
	$scope.decrementTemplate=function(){
		if($rootScope.templateHeigh>50){
			$rootScope.templateHeigh=$rootScope.templateHeigh-50;
		}else{
			$rootScope.templateHeigh=$rootScope.templateHeigh;
		}
	};
	
	$scope.exportTestPackageHTML = function () {
			var changes = angular.toJson([]);
			var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});
			$http.post('api/testplans/save', data).then(function (response) {
				var saveResponse = angular.fromJson(response.data);
				$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
				$rootScope.saved = true;


				var form = document.createElement("form");
				form.action = $rootScope.api('api/testplans/' + $rootScope.selectedTestPlan.id + '/exportTestPackageHTML/');
				form.method = "POST";
				form.target = "_target";
				var csrfInput = document.createElement("input");
				csrfInput.name = "X-XSRF-TOKEN";
				csrfInput.value = $cookies['XSRF-TOKEN'];
				form.appendChild(csrfInput);
				form.style.display = 'none';
				document.body.appendChild(form);
				form.submit();

			}, function (error) {
				$rootScope.saved = false;
			});
	};

	$scope.exportResourceBundleZip = function () {
		var changes = angular.toJson([]);
		var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});
		$http.post('api/testplans/save', data).then(function (response) {
			var saveResponse = angular.fromJson(response.data);
			$rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
			$rootScope.saved = true;

			var form = document.createElement("form");
			form.action = $rootScope.api('api/testplans/' + $rootScope.selectedTestPlan.id + '/exportRBZip/');
			form.method = "POST";
			form.target = "_target";
			var csrfInput = document.createElement("input");
			csrfInput.name = "X-XSRF-TOKEN";
			csrfInput.value = $cookies['XSRF-TOKEN'];
			form.appendChild(csrfInput);
			form.style.display = 'none';
			document.body.appendChild(form);
			form.submit();


		}, function (error) {
			$rootScope.saved = false;
		});
	};

	$scope.copyTestPlan = function(tp) {
		$http.post($rootScope.api('api/testplans/' + tp.id + '/copy')).then(function (response) {
			$rootScope.msg().text = "testplanCopySuccess";
			$rootScope.msg().type = "success";
			$rootScope.msg().show = true;
			$rootScope.manualHandle = true;
			$scope.loadTestPlans();
		}, function (error) {
			$scope.error = error;
			$rootScope.msg().text = "testplanCopyFailed";
			$rootScope.msg().type = "danger";
			$rootScope.msg().show = true;
		});
	};

	$scope.exportTestPlanJson = function (tp) {
		var form = document.createElement("form");
		form.action = $rootScope.api('api/testplans/' + tp.id + '/exportJson/');
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

	$scope.exportProfileXMLs = function () {
		var listOfIGID = [];
		$rootScope.selectedTestPlan.children.forEach(function(child) {
			if(child.type == "testcasegroup"){
				child.testcases.forEach(function(testcase){
					testcase.teststeps.forEach(function(teststep){
						var isDuplicatedId = false;
						for(i in listOfIGID){
							var id = listOfIGID[i];
							if(id == teststep.integrationProfileId) isDuplicatedId = true;
						}
						if(!isDuplicatedId) listOfIGID.push(teststep.integrationProfileId);
					});
				});
			}else if(child.type == "testcase"){
				child.teststeps.forEach(function(teststep){
					var isDuplicatedId = false;
					for(i in listOfIGID){
						var id = listOfIGID[i];
						if(id == teststep.integrationProfileId) isDuplicatedId = true;
					}
					if(!isDuplicatedId) listOfIGID.push(teststep.integrationProfileId);
				});
			}
		});

		var form = document.createElement("form");
		form.action = $rootScope.api('api/testplans/' + listOfIGID + '/exportProfileXMLs/');
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


	$scope.loadTestPlans = function () {
		var delay = $q.defer();
		$scope.error = null;
		$rootScope.tps = [];

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$http.get('api/testplans').then(function (response) {
				$rootScope.tps = angular.fromJson(response.data);
				delay.resolve(true);
			}, function (error) {
				$scope.error = error.data;
				delay.reject(false);
			});
		} else {
			delay.reject(false);
		}
		return delay.promise;
	};

    $scope.loadTemplate = function () {
        var delay = $q.defer();
      
		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.templatesToc = [];
			$rootScope.template = {};
			$http.get('api/template').then(function(response) {
				$rootScope.template = angular.fromJson(response.data);
				$rootScope.templatesToc.push($rootScope.template);
				delay.resolve(true);
			}, function(error) {
				$scope.error = error.data;
				delay.reject(false);

			});}
		else{
			delay.reject(false);
		}
    };

	$scope.applyConformanceProfile = function (igid, mid) {
		$rootScope.selectedTestStep.integrationProfileId = igid;
		$rootScope.selectedTestStep.conformanceProfileId = mid;
		$scope.loadIntegrationProfile();
	};


	$scope.initTestPlans = function () {
		$scope.loadIGAMTProfiles();
		$scope.loadPrivateProfiles();
		$scope.loadPublicProfiles();
		$scope.loadTestPlans();
        $scope.loadTemplate();
		$scope.getScrollbarWidth();
	};

	$scope.loadPublicProfiles = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.publicProfiles = [];
			$http.get('api/profiles/public').then(function(response) {
				$rootScope.publicProfiles = angular.fromJson(response.data);
				delay.resolve(true);
			}, function(error) {
				$scope.error = error.data;
				delay.reject(false);

			});
		}else{
			delay.reject(false);
		}
	};

	$scope.loadPrivateProfiles = function () {
		var delay = $q.defer();
		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.privateProfiles = [];
			$http.get('api/profiles').then(function(response) {
				$rootScope.privateProfiles = angular.fromJson(response.data);
				delay.resolve(true);
			}, function(error) {
				$scope.error = error.data;
				delay.reject(false);

			});
		}else{
			delay.reject(false);
		}
	};

	$scope.loadIGAMTProfiles = function () {
		var delay = $q.defer();
		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.loading = true;
			waitingDialog.show('Loading TestPlans...', {dialogSize: 'xs', progressType: 'info'});
			$scope.error = null;
			$rootScope.igamtProfiles = [];
			$http.get('api/igdocuments').then(function(response) {
				$rootScope.igamtProfiles = angular.fromJson(response.data);
				$scope.loading = false;
				delay.resolve(true);
				waitingDialog.hide();
				$scope.loading = false;
			}, function(error) {
				$scope.error = error.data;
				delay.reject(false);
				waitingDialog.hide();
				$scope.loading = false;
			});
		}else{
			delay.reject(false);
		}
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

	$rootScope.processMessageTree = function(element, parent) {
		try {
			if (element != undefined && element != null) {
				if (element.type === "message") {
					var m = {};
					m.children = [];
					$rootScope.messageTree = m;

					angular.forEach(element.children, function(segmentRefOrGroup) {
						$rootScope.processMessageTree(segmentRefOrGroup, m);
					});

				} else if (element.type === "group" && element.children) {
					var g = {};
					g.path = element.position + "[1]";
					g.obj = element;
					g.children = [];
					if (parent.path) {
						g.path = parent.path + "." + element.position + "[1]";
					}
					parent.children.push(g);
					angular.forEach(element.children, function(segmentRefOrGroup) {
						$rootScope.processMessageTree(segmentRefOrGroup, g);
					});
				} else if (element.type === "segmentRef") {
					var s = {};
					s.path = element.position + "[1]";
					s.obj = element;
					s.children = [];
					if (parent.path) {
						s.path = parent.path + "." + element.position + "[1]";
					}
					s.obj.ref.ext = s.obj.ref.ext;
					//s.obj.ref.label=$rootScope.getLabel(s.obj.ref.name,s.obj.ref.ext);
					parent.children.push(s);

					//$rootScope.processMessageTree(ref, s);

				} else if (element.type === "segment") {
					if (!parent) {
						var s = {};
						s.obj = element;
						s.path = element.name;
						s.children = [];
						parent = s;
					}

					angular.forEach(element.fields, function(field) {
						$rootScope.processMessageTree(field, parent);
					});
				}
			}
		} catch (e) {
			throw e;
		}
	};

	$scope.loadIntegrationProfile = function () {
		if($rootScope.selectedTestStep.integrationProfileId != undefined && $rootScope.selectedTestStep.integrationProfileId !== null){
			$rootScope.selectedIntegrationProfile =_.find($rootScope.integrationProfiles, function(ip) {
				return ip.id == $rootScope.selectedTestStep.integrationProfileId;
			});
			$scope.loadConformanceProfile();
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
			if($rootScope.selectedTestStep.er7Message == null || $rootScope.selectedTestStep.er7Message == '') $scope.generateDefaultSegmentsList();

			$scope.updateMessage();
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
	$scope.showValidationInfo = function () {
		var modalInstance = $modal.open({
			templateUrl: 'validationInfo.html',
			controller: 'validationInfoController',
			size: 'lg',
			windowClass: 'my-modal-popup'
		});
		modalInstance.result.then(function () {
			
		});
	};
	$scope.showReport = function () {
		var modalInstance = $modal.open({
			templateUrl: 'reportResult.html',
			controller: 'reportController',
			size: 'lg',
			windowClass: 'my-modal-popup',
			resolve: {
				report: function () {
					return $scope.report;
				}
			}
		});
		modalInstance.result.then(function () {
			
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
			$scope.recordChanged();
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
			$scope.recordChanged();
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
			$scope.recordChanged();
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

	$scope.initCodemirror = function () {
		if($scope.editor == null){
			$scope.editor = CodeMirror.fromTextArea(document.getElementById("er7-textarea"), {
				lineNumbers: true,
				fixedGutter: true,
				theme: "elegant",
				readOnly: false,
				showCursorWhenSelecting: true
			});
			$scope.editor.setSize("100%", $rootScope.igHeigh+$rootScope.templateHeigh+$rootScope.tocHeigh);
			$scope.editor.refresh();

			$scope.editor.on("change", function () {
				$rootScope.selectedTestStep.er7Message = $scope.editor.getValue();
				$scope.recordChanged($rootScope.selectedTestStep);
			});
		}
	};

	$scope.initCodemirrorOnline = function () {
		if($scope.editorValidation == null){
			$scope.editorValidation = CodeMirror.fromTextArea(document.getElementById("er7-textarea-validation"), {
				lineNumbers: true,
				fixedGutter: true,
				theme: "elegant",
				readOnly: false,
				showCursorWhenSelecting: true
			});
			$scope.editorValidation.setSize("100%", $rootScope.igHeigh+$rootScope.templateHeigh+$rootScope.tocHeigh);
			$scope.editorValidation.refresh();

			$scope.editorValidation.on("change", function () {
				$scope.er7MessageOnlineValidation = $scope.editorValidation.getValue();
			});
		}
	};

	$scope.closeTestPlanEdit = function () {
        $scope.selectTPTab(0);
    };

    $scope.updateCurrentTitle = function (type, name){
		$rootScope.CurrentTitle = type + ": " + name;
	};

	$scope.updateListOfIntegrationProfiles = function (){
		$rootScope.integrationProfiles = [];

		if($rootScope.selectedTestPlan.listOfIntegrationProfileIds == null || $rootScope.selectedTestPlan.listOfIntegrationProfileIds.length == 0){
			for(var i in $rootScope.igamtProfiles){
				$rootScope.integrationProfiles.push($rootScope.igamtProfiles[i]);
			};

			for(var i in $rootScope.privateProfiles){
				$rootScope.integrationProfiles.push($rootScope.privateProfiles[i]);
			};

			for(var i in $rootScope.publicProfiles){
				$rootScope.integrationProfiles.push($rootScope.publicProfiles[i]);
			};
		}else {
			for(var j in $rootScope.selectedTestPlan.listOfIntegrationProfileIds){
				for(var i in $rootScope.igamtProfiles){
					if($rootScope.igamtProfiles[i].id == $rootScope.selectedTestPlan.listOfIntegrationProfileIds[j]){
						$rootScope.integrationProfiles.push($rootScope.igamtProfiles[i]);
					}
				};

				for(var i in $rootScope.privateProfiles){
					if($rootScope.privateProfiles[i].id == $rootScope.selectedTestPlan.listOfIntegrationProfileIds[j]){
						$rootScope.integrationProfiles.push($rootScope.privateProfiles[i]);
					}
				};

				for(var i in $rootScope.publicProfiles){
					if($rootScope.publicProfiles[i].id == $rootScope.selectedTestPlan.listOfIntegrationProfileIds[j]){
						$rootScope.integrationProfiles.push($rootScope.publicProfiles[i]);
					}
				};
			}
		}
	};

	$scope.selectTestPlan = function (testplan) {
		if (testplan != null) {
			waitingDialog.show('Opening Test Plan...', {dialogSize: 'xs', progressType: 'info'});
			$scope.selectTPTab(1);

			$rootScope.testplans = [];
			$rootScope.testplans.push(testplan);
			$rootScope.selectedTestPlan = testplan;
			$scope.updateListOfIntegrationProfiles();

			$timeout(function () {
				$scope.updateCurrentTitle("Test Plan", $rootScope.selectedTestPlan.name);
				$scope.subview = "EditTestPlanMetadata.html";
			}, 0);

			$timeout(function () {
				$rootScope.selectedTemplate=null;
				$rootScope.selectedSegmentNode =null;
				$rootScope.selectedTestStep=null;
				$rootScope.selectedTestCaseGroup = null;
				$rootScope.selectedTestCase = null;
				$scope.editor = null;
				$scope.editorValidation = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.OpenIgMetadata= function(ig){
		$rootScope.CurrentTitle="IG Document "+":"+ ig.metaData.title;


		$rootScope.selectedTemplate=null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTestStep=null;
		$rootScope.igDocument=ig;
		$scope.editor = null;
		$scope.editorValidation = null;
		$scope.subview = "EditDocumentMetadata.html";

	};
	
//	$scope.OpenMessageMetadata= function(msg){
//		console.log("Openning message");
//
//		$rootScope.selectedTemplate=null;
//		$rootScope.selectedSegmentNode =null;
//		$rootScope.selectedTestStep=null;
//		$rootScope.message=msg;
//		$scope.subview = "MessageMetadata.html";
//
//	};

	$scope.selectTestCaseGroup = function (testCaseGroup) {
		if (testCaseGroup != null) {
			waitingDialog.show('Opening Test Case Group...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestCaseGroup = testCaseGroup;
				$scope.updateCurrentTitle("Test Case Group", $rootScope.selectedTestCaseGroup.name);
				$scope.subview = "EditTestCaseGroupMetadata.html";
			}, 0);
			$timeout(function() {
				$rootScope.selectedTestStep=null;
				$rootScope.selectedTestCase = null;
				$rootScope.selectedTemplate=null;
				$rootScope.selectedSegmentNode =null;
				$scope.editor = null;
				$scope.editorValidation = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.selectTestCase = function (testCase) {
		if (testCase != null) {
			waitingDialog.show('Opening Test Case ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.selectedTestCase = testCase;
				$scope.updateCurrentTitle("Test Case", $rootScope.selectedTestCase.name);
				$scope.selectedTestCaseTab = 1;
				$scope.subview = "EditTestCaseMetadata.html";
			}, 0);
			$timeout(function () {
				$rootScope.selectedTestStep=null;
				$rootScope.selectedTestCaseGroup=null;
				$rootScope.selectedTemplate=null;
				$rootScope.selectedSegmentNode =null;
				$scope.editor = null;
				$scope.editorValidation = null;
				waitingDialog.hide();
			}, 100);
		}
	};

	$scope.selectTestStep = function (testStep) {
		if (testStep != null) {
			waitingDialog.show('Opening Test Step ...', {dialogSize: 'xs', progressType: 'info'});
			$timeout(function () {
				$rootScope.segmentList = [];
				$rootScope.selectedIntegrationProfile = null;
				$rootScope.selectedTestStep = testStep;
				$scope.updateCurrentTitle("Test Step", $rootScope.selectedTestStep.name);
				if($rootScope.selectedTestStep.testDataCategorizationMap == undefined || $rootScope.selectedTestStep == null){
					$rootScope.selectedTestStep.testDataCategorizationMap = {};
				}
				$scope.selectedTestStepTab = 1;
				$scope.loadIntegrationProfile();
				$scope.MessageForMirror=$rootScope.selectedTestStep.er7Message;
				$scope.subview = "EditTestStepMetadata.html";
			}, 0);

			$timeout(function () {
				$rootScope.selectedTestCaseGroup=null;
				$rootScope.selectedTestCase = null;
				$rootScope.selectedTemplate=null;
				$rootScope.selectedSegmentNode =null;
				waitingDialog.hide();
			}, 100);
		}
	};

    $scope.changeTestStepTab = function (tabNum) {
        $scope.selectedTestStepTab = tabNum;
		if(tabNum != 4) $rootScope.selectedSegmentNode = null;
    };

	$scope.changeTestCaseTab = function (tabNum) {
		$scope.selectedTestCaseTab = tabNum;
	};

    $scope.isSelectedTestStepTab = function (tabNum) {
      return   tabNum == $scope.selectedTestStepTab;
    };

	$scope.isSelectedTestCaseTab = function (tabNum) {
		return   tabNum == $scope.selectedTestCaseTab;
	};

	$scope.selectTPTab = function (value) {
		if (value === 1) {
			$scope.accordi.tpList = false;
			$scope.accordi.tpDetails = true;
		} else {
			$scope.accordi.tpList = true;
			$scope.accordi.tpDetails = false;
		}
	};

	$scope.recordChanged = function (obj) {
		$rootScope.selectedTestPlan.isChanged = true;
		$rootScope.isChanged = true;
		if(obj){
			$rootScope.changesMap[obj.id] = true;
		}
	};

	$scope.updateTransport = function () {
		console.log($rootScope.selectedTestPlan.type);
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
					$rootScope.changesMap={};
					Notification.success({message:"Test Plan Saved", delay: 1000});


				}, function (error) {
					$rootScope.saved = false;
					Notification.error({message:"Error Saving", delay:1000});

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


		var testcaseName = $scope.findTestCaseNameOfTestStep();

		$rootScope.selectedTestStep.nistXMLCode = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, testcaseName,false));
		$rootScope.selectedTestStep.stdXMLCode = $scope.formatXml($scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, testcaseName,true));
		$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		$rootScope.selectedTestStep.messageContentsXMLCode = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
	};


	$scope.generateDefaultSegmentsList =function() {
		var defaultEr7Message = '';
		defaultEr7Message = $scope.travelConformanceProfileToGenerateDefaultEr7Message($rootScope.selectedConformanceProfile.children, defaultEr7Message);
		$rootScope.selectedTestStep.er7Message = defaultEr7Message;
	};

	$scope.travelConformanceProfileToGenerateDefaultEr7Message = function(children, defaultEr7Message) {

		for(var i in children){
			var segmentRefOrGroup = children[i];

			if(segmentRefOrGroup.type == 'segmentRef'){
				if(segmentRefOrGroup.usage == 'R' || segmentRefOrGroup.usage == 'RE' || segmentRefOrGroup.usage == 'C'){
					var segment = $scope.findSegment(segmentRefOrGroup.ref, $rootScope.selectedIntegrationProfile);
					if(segment.name == 'MSH'){
						defaultEr7Message = defaultEr7Message + 'MSH|^~\&|';
						for(var j in segment.fields){
							if(j > 1) defaultEr7Message = defaultEr7Message + '|';
						}
					}else{
						defaultEr7Message = defaultEr7Message + segment.name;
						for(var j in segment.fields){
							defaultEr7Message = defaultEr7Message + '|';
						}
					}

					defaultEr7Message = defaultEr7Message + '\n';
				}
			}else if (segmentRefOrGroup.type == 'group'){
				if(segmentRefOrGroup.usage == 'R' || segmentRefOrGroup.usage == 'RE' || segmentRefOrGroup.usage == 'C'){
					defaultEr7Message = $scope.travelConformanceProfileToGenerateDefaultEr7Message(segmentRefOrGroup.children, defaultEr7Message);
				}
			}
		}

		return defaultEr7Message;
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
		$scope.initCodemirror();

		setTimeout(function () {
			if($rootScope.selectedTestStep.er7Message == null){
				$scope.editor.setValue("");
			}else {
				$scope.editor.setValue($rootScope.selectedTestStep.er7Message);
			}
		}, 100);

		setTimeout(function () {
			$scope.editor.refresh();
		}, 200);
	};

	$scope.initHL7EncodedMessageForOnlineValidationTab = function (){
		$scope.initCodemirrorOnline();

		setTimeout(function () {
			$scope.result="";
			$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);

			if($rootScope.selectedTestStep.er7Message == null){
				$scope.editorValidation.setValue("");
				$scope.er7MessageOnlineValidation = '';
			}else {
				$scope.er7MessageOnlineValidation = $rootScope.selectedTestStep.er7Message;
				$scope.editorValidation.setValue($scope.er7MessageOnlineValidation);
			}
		}, 100);


		setTimeout(function () {
			$scope.editorValidation.refresh();
		}, 200);
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
				if (fieldValues[i] != undefined) {
					fieldInstanceValues = fieldValues[i].split("~");
				}else {
					fieldInstanceValues.push('');
				}
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
							if(assertionElm.childNodes.length > 0){
								for(index2 in assertionElm.childNodes){
									if(assertionElm.childNodes[index2].nodeName === 'PlainText'){
										fieldNode.testDataCategorization = 'Value-Profile Fixed';
										fieldNode.testDataCategorizationListData = null;
									}else if(assertionElm.childNodes[index2].nodeName === 'StringList'){
										fieldNode.testDataCategorization = 'Value-Profile Fixed List';
										fieldNode.testDataCategorizationListData = null;
									}
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
								if(assertionElm.childNodes.length > 0){
									for(index2 in assertionElm.childNodes){
										if(assertionElm.childNodes[index2].nodeName === 'PlainText'){
											componentNode.testDataCategorization = 'Value-Profile Fixed';
											componentNode.testDataCategorizationListData = null;
										}else if(assertionElm.childNodes[index2].nodeName === 'StringList'){
											componentNode.testDataCategorization = 'Value-Profile Fixed List';
											componentNode.testDataCategorizationListData = null;
										}
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
									if(assertionElm.childNodes.length > 0){
										for(index2 in assertionElm.childNodes){
											if(assertionElm.childNodes[index2].nodeName === 'PlainText'){
												subComponentNode.testDataCategorization = 'Value-Profile Fixed';
												subComponentNode.testDataCategorizationListData = null;
											}else if(assertionElm.childNodes[index2].nodeName === 'StringList'){
												subComponentNode.testDataCategorization = 'Value-Profile Fixed List';
												subComponentNode.testDataCategorizationListData = null;
											}
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

		setTimeout(function () {
			$scope.refreshTree();
		}, 100);
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
						result = child.name;
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
				$scope.testDataSpecificationHTML=angular.fromJson(response.data).xml;
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
			$scope.messageContentsHTML=angular.fromJson(response.data).xml;
		}, function (error) {
		});
	};

	$rootScope.getNodesForMessage = function(parent, root) {
		if (!parent || parent == null) {
			return root.children;
		} else {
			return parent.children;
		}
	};

	$rootScope.getTemplatesForMessage = function(node, root) {
		console.log("node+++++++++");
		console.log(node);

		if (node.obj.type === 'segmentRef') {
			return 'MessageSegmentRefReadTree.html';
		} else if (node.obj.type === 'group') {
			return 'MessageGroupReadTree.html';
		} else {
			return 'MessageReadTree.html';
		}

	};
	$scope.getSegLabel = function(name, ext) {
		if (ext === null) {
			return name;
		} else {
			return name + '_' + ext;
		}
	};
	$rootScope.getMessageParams = function() {
		return new ngTreetableParams({
			getNodes: function(parent) {
				return $rootScope.getNodesForMessage(parent, $rootScope.messageTree);
			},
			getTemplate: function(node) {
				return $rootScope.getTemplatesForMessage(node, $rootScope.messageTree);
			}
		});
	};

	$scope.OpenMessageMetadata = function(msg) {
		$rootScope.selectedTestCaseGroup=null;
		$rootScope.selectedTestCase = null;
		$rootScope.selectedTestStep = null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTemplate = null;
		$rootScope.selectedSegmentNode = null;
		$scope.editor = null;
		$scope.editorValidation = null;

		$rootScope.CurrentTitle="Conformance Profile"+":"+ msg.name;
		$scope.subview = "EditMessages.html";
		if($rootScope.messageTree && $rootScope.messageParams){
			$rootScope.message=msg;
			$rootScope.processMessageTree($rootScope.message);
			$rootScope.messageParams.refresh();

		}
		else{

			$rootScope.message=msg;
			$rootScope.processMessageTree($rootScope.message);
			//$rootScope.messageParams.refresh();
			$rootScope.messageParams = $rootScope.getMessageParams();

		}

		

	};


	$scope.generateConstraintsXML = function (segmentList, testStep, selectedConformanceProfile, selectedIntegrationProfile){
		$rootScope.categorizationsDataMap = {};
		var rootName = "ConformanceContext";
		var xmlString = '<' + rootName + '>' + '</' + rootName + '>';
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlString, "text/xml");
		var rootElement = xmlDoc.getElementsByTagName(rootName)[0];
		rootElement.setAttribute("UUID", new ObjectId().toString());


		//TODO METADATA need to update
		var elmMetaData = xmlDoc.createElement("MetaData");
		elmMetaData.setAttribute("Name", 'No Name');
		elmMetaData.setAttribute("OrgName", 'NIST');
		elmMetaData.setAttribute("Version", 'No Version Info');
		elmMetaData.setAttribute("Date", 'No date');
		elmMetaData.setAttribute("Status", 'Draft');

		rootElement.appendChild(elmMetaData);

		var constraintsElement = xmlDoc.createElement("Constraints");
		var messageElement = xmlDoc.createElement("Message");
		var byIDElement = xmlDoc.createElement("ByID");
		byIDElement.setAttribute("ID", selectedConformanceProfile.id);

		rootElement.appendChild(constraintsElement);
		constraintsElement.appendChild(messageElement);
		messageElement.appendChild(byIDElement);

		segmentList.forEach(function(instanceSegment) {
			var segment = instanceSegment.obj;
			var segName = segment.name;
			var segmentiPath = instanceSegment.iPath;
			var segmentiPositionPath = instanceSegment.positioniPath;
			var segUsagePath = instanceSegment.usagePath;
			for (var i = 0; i < segment.fields.length; i++){
				var field = segment.fields[i];
				var wholeFieldStr = $scope.getFieldStrFromSegment(segName, instanceSegment, field.position);
				var fieldRepeatIndex = 0;

				var fieldUsagePath = segUsagePath + '-' + field.usage;
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

					if (fieldDT == null || fieldDT.components == null || fieldDT.components.length == 0) {
						var cateOfField = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath)];
						$scope.createConstraint(segmentiPositionPath + fieldiPath, cateOfField, fieldUsagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, fieldStr);
						$rootScope.categorizationsDataMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath)] = fieldStr;
					} else {
						for (var k = 0 ; k < fieldDT.components.length; k++ ){
							var c = fieldDT.components[k];
							var componentUsagePath = fieldUsagePath + '-' + c.usage;
							var componentiPath = "." + c.position + "[1]";

							var componentStr = $scope.getComponentStrFromField(fieldStr, c.position);
							if ($scope.findDatatype(c.datatype, selectedIntegrationProfile).components == null || $scope.findDatatype(c.datatype, selectedIntegrationProfile).components.length == 0) {
								var cateOfComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath)];
								$scope.createConstraint(segmentiPositionPath + fieldiPath + componentiPath, cateOfComponent, componentUsagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, componentStr);
								$rootScope.categorizationsDataMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath)] = componentStr;
							} else {
								for (var l = 0; l < $scope.findDatatype(c.datatype, selectedIntegrationProfile).components.length; l++){
									var sc = $scope.findDatatype(c.datatype, selectedIntegrationProfile).components[l];
									var subComponentUsagePath = componentUsagePath + '-' + sc.usage;
									var subcomponentiPath = "." + sc.position + "[1]";
									var subcomponentStr = $scope.getSubComponentStrFromField(componentStr, sc.position);
									var cateOfSubComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath + subcomponentiPath)];
									$scope.createConstraint(segmentiPositionPath + fieldiPath + componentiPath + subcomponentiPath, cateOfSubComponent, subComponentUsagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, subcomponentStr);
									$rootScope.categorizationsDataMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath + subcomponentiPath)] = subcomponentStr;
								}
							}
						}
					}
				}
			}

		});

		var serializer = new XMLSerializer();
		var xmlString = serializer.serializeToString(xmlDoc);
		return xmlString;
	};

	$scope.createConstraint = function (iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value){
		if(cate){
			var byIDElm = xmlDoc.getElementsByTagName('ByID')[0];
			if(cate.testDataCategorization == 'Indifferent'){

			}else if(cate.testDataCategorization == 'NonPresence'){
				$scope.createNonPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm);
			}else if(cate.testDataCategorization == 'Presence-Content Indifferent' ||
				cate.testDataCategorization == 'Presence-Configuration' ||
				cate.testDataCategorization == 'Presence-System Generated' ||
				cate.testDataCategorization == 'Presence-Test Case Proper'){
				$scope.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm);
			}else if(cate.testDataCategorization == 'Presence Length-Content Indifferent' ||
				cate.testDataCategorization == 'Presence Length-Configuration' ||
				cate.testDataCategorization == 'Presence Length-System Generated' ||
				cate.testDataCategorization == 'Presence Length-Test Case Proper'){
				$scope.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm);
				$scope.createLengthCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm);
			}else if(cate.testDataCategorization == 'Value-Test Case Fixed'){
				$scope.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm);
				$scope.createPlainTextCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm);
			}else if(cate.testDataCategorization == 'Value-Test Case Fixed List'){
				$scope.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm);
				$scope.createStringListCheck(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm);
			}
		}
	};


	$scope.createStringListCheck = function (iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm) {
		var values = cate.listData.toString();
		var elmConstraint = xmlDoc.createElement("Constraint");
		var elmReference = xmlDoc.createElement("Reference");
		elmReference.setAttribute("Source", "testcase");
		elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
		elmReference.setAttribute("ReferencePath", cate.iPath);
		elmReference.setAttribute("TestDataCategorization", cate.testDataCategorization);
		elmConstraint.appendChild(elmReference);

		elmConstraint.setAttribute("ID", "Content");
		elmConstraint.setAttribute("Target", iPositionPath);
		var elmDescription = xmlDoc.createElement("Description");
		elmDescription.appendChild(xmlDoc.createTextNode("Invalid content (based on test case fixed data). The value at " + $scope.modifyFormIPath(cate.iPath) + " ("+ $scope.findNodeNameByIPath(selectedIntegrationProfile, selectedConformanceProfile, iPositionPath) +") does not match one of the expected values: " + values));
		var elmAssertion = xmlDoc.createElement("Assertion");
		var elmStringList = xmlDoc.createElement("StringList");
		elmStringList.setAttribute("Path", iPositionPath);
		elmStringList.setAttribute("CSV", values);
		elmAssertion.appendChild(elmStringList);
		elmConstraint.appendChild(elmDescription);
		elmConstraint.appendChild(elmAssertion);
		byIDElm.appendChild(elmConstraint);

	};
	
	
	$scope.createPlainTextCheck = function(iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm) {
		var elmConstraint = xmlDoc.createElement("Constraint");
		var elmReference = xmlDoc.createElement("Reference");
		elmReference.setAttribute("Source", "testcase");
		elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
		elmReference.setAttribute("ReferencePath", cate.iPath);
		elmReference.setAttribute("TestDataCategorization", cate.testDataCategorization);
		elmConstraint.appendChild(elmReference);

		elmConstraint.setAttribute("ID", "Content");
		elmConstraint.setAttribute("Target", iPositionPath);
		var elmDescription = xmlDoc.createElement("Description");
		elmDescription.appendChild(xmlDoc.createTextNode("Invalid content (based on test case fixed data). The value at " + $scope.modifyFormIPath(cate.iPath) + " ("+ $scope.findNodeNameByIPath(selectedIntegrationProfile, selectedConformanceProfile, iPositionPath) +") does not match the expected value: '" + value + "'."));
		var elmAssertion = xmlDoc.createElement("Assertion");
		var elmPlainText = xmlDoc.createElement("PlainText");
		elmPlainText.setAttribute("Path", iPositionPath);
		elmPlainText.setAttribute("Text", value);
		elmPlainText.setAttribute("IgnoreCase", "true");
		elmAssertion.appendChild(elmPlainText);
		elmConstraint.appendChild(elmDescription);
		elmConstraint.appendChild(elmAssertion);
		byIDElm.appendChild(elmConstraint);
	};

	$scope.createLengthCheck = function (iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, value, byIDElm){
		var elmConstraint = xmlDoc.createElement("Constraint");
		var elmReference = xmlDoc.createElement("Reference");
		elmReference.setAttribute("Source", "testcase");
		elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
		elmReference.setAttribute("ReferencePath", cate.iPath);
		elmReference.setAttribute("TestDataCategorization", cate.testDataCategorization);
		elmConstraint.appendChild(elmReference);

		elmConstraint.setAttribute("ID", "Content");
		elmConstraint.setAttribute("Target", iPositionPath);
		var elmDescription = xmlDoc.createElement("Description");
		elmDescription.appendChild(xmlDoc.createTextNode("Content does not meet the minimum length requirement. The value at " + $scope.modifyFormIPath(cate.iPath) + " ("+ $scope.findNodeNameByIPath(selectedIntegrationProfile, selectedConformanceProfile, iPositionPath) +") is expected to be at minimum '" + value.length + "' characters."));
		var elmAssertion = xmlDoc.createElement("Assertion");
		var elmFormat = xmlDoc.createElement("Format");
		elmFormat.setAttribute("Path", iPositionPath);
		elmFormat.setAttribute("Regex", "^.{"+ value.length +",}$");
		elmAssertion.appendChild(elmFormat);
		elmConstraint.appendChild(elmDescription);
		elmConstraint.appendChild(elmAssertion);
		byIDElm.appendChild(elmConstraint);
	}

	$scope.createNonPresenceCheck = function (iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm){
		var elmConstraint = xmlDoc.createElement("Constraint");
		var elmReference = xmlDoc.createElement("Reference");
		elmReference.setAttribute("Source", "testcase");
		elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
		elmReference.setAttribute("ReferencePath", cate.iPath);
		elmReference.setAttribute("TestDataCategorization", cate.testDataCategorization);
		elmConstraint.appendChild(elmReference);

		elmConstraint.setAttribute("ID", "Content");
		elmConstraint.setAttribute("Target", iPositionPath);
		var elmDescription = xmlDoc.createElement("Description");
		elmDescription.appendChild(xmlDoc.createTextNode("Unexpected content found. The value at " + $scope.modifyFormIPath(cate.iPath) + " ("+ $scope.findNodeNameByIPath(selectedIntegrationProfile, selectedConformanceProfile, iPositionPath) +") is not expected to be valued for test case."));
		var elmAssertion = xmlDoc.createElement("Assertion");
		var elmPresence = xmlDoc.createElement("Presence");
		var elmNOT = xmlDoc.createElement("NOT");
		elmPresence.setAttribute("Path", iPositionPath);
		elmNOT.appendChild(elmPresence);
		elmAssertion.appendChild(elmNOT);
		elmConstraint.appendChild(elmDescription);
		elmConstraint.appendChild(elmAssertion);
		byIDElm.appendChild(elmConstraint);
	};

	$scope.createPresenceCheck = function (iPositionPath, cate, usagePath, xmlDoc, selectedConformanceProfile, selectedIntegrationProfile, byIDElm){
		var usageCheck = true;
		var usage = usagePath.split("-");
		for(var i=0; i < usage.length; i++){
			var u = usage[i];
			if(u !== "R") {
				usageCheck = false;
			}
		}

		if(!usageCheck){
			var elmConstraint = xmlDoc.createElement("Constraint");
			var elmReference = xmlDoc.createElement("Reference");
			elmReference.setAttribute("Source", "testcase");
			elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
			elmReference.setAttribute("ReferencePath", cate.iPath);
			elmReference.setAttribute("TestDataCategorization", cate.testDataCategorization);
			elmConstraint.appendChild(elmReference);

			elmConstraint.setAttribute("ID", "Content");
			elmConstraint.setAttribute("Target", iPositionPath);
			var elmDescription = xmlDoc.createElement("Description");
			elmDescription.appendChild(xmlDoc.createTextNode("Expected content is missing. The empty value at " + $scope.modifyFormIPath(cate.iPath) + " ("+ $scope.findNodeNameByIPath(selectedIntegrationProfile, selectedConformanceProfile, iPositionPath) +") is expected to be present."));
			var elmAssertion = xmlDoc.createElement("Assertion");
			var elmPresence = xmlDoc.createElement("Presence");
			elmPresence.setAttribute("Path", iPositionPath);
			elmAssertion.appendChild(elmPresence);
			elmConstraint.appendChild(elmDescription);
			elmConstraint.appendChild(elmAssertion);
			byIDElm.appendChild(elmConstraint);
		}
	};

	$scope.findNodeNameByIPath = function (ip, m, iPositionPath){
		var currentChildren = m.children;
		var currentObject = null;
		var pathList = iPositionPath.split(".");
		for(var i=0; i < pathList.length; i++){
			var p = pathList[i];
			var position = parseInt(p.substring(0,p.indexOf("[")));
			var o = $scope.findChildByPosition(position, currentChildren, m, ip);

			if(o.type ==  'group'){
				var group = o;
				currentObject = group;
				currentChildren = group.children;
			}else if(o.type ==  'segment'){
				var s = o;
				currentObject = s;
				currentChildren = s.fields;
			}else if(o.type ==  'field'){
				var f = o;
				currentObject = f;
				currentChildren = $scope.findDatatype(f.datatype, ip).components;
			}else if(o.type == 'component'){
				var c = o;
				currentObject = c;
				currentChildren = $scope.findDatatype(c.datatype, ip).components;
			}
		}

		if(currentObject == null){
			return null;
		}else {
			return currentObject.name;
		}

		return null;
	};

	$scope.findChildByPosition = function (position, children, m, ip){
		for(var i=0; i < children.length; i++){
			var o = children[i];
			if(o.type ==  'group'){
				if(o.position == position) return o;
			}else if(o.type == 'segmentRef'){
				if(o.position == position) return $scope.findSegment(o.ref, ip);
			}else if(o.type == 'field'){
				if(o.position == position) return o;
			}else if(o.type == 'component'){
				if(o.position == position) return o;
			}
		}

		return null;

	}

	$scope.modifyFormIPath = function (iPath){
		var result = "";
		if(iPath == null || iPath == "") return result;
		var pathList = iPath.split(".");
		var currentType = "GroupOrSegment";
		var previousType = "GroupOrSegment";

		for(var i=0; i < pathList.length; i++){
			var p = pathList[i];
			var path = p.substring(0,p.indexOf("["));
			var instanceNum = parseInt(p.substring(p.indexOf("[") + 1 , p.indexOf("]")));

			if($scope.isNumeric(path)){
				currentType = "FieldOrComponent";
			}else {
				currentType = "GroupOrSegment";
			}

			if(instanceNum == 1){
				if(currentType == "FieldOrComponent" && previousType == "GroupOrSegment"){
					result = result + "-" + path;
				}else{
					result = result + "." + path;
				}
			}else {
				if(currentType == "FieldOrComponent" && previousType == "GroupOrSegment"){
					result = result + "-" + path + "[" + instanceNum + "]";
				}else{
					result = result + "." + path + "[" + instanceNum + "]";
				}
			}
			previousType = currentType;
		}
		return result.substring(1);
	};

	$scope.isNumeric = function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

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
										var cateOfComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath)];
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
												var cateOfSubComponent = testStep.testDataCategorizationMap[$scope.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath + subcomponentiPath)];
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
							cate.data = $rootScope.categorizationsDataMap[key];
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

	$scope.updateTestDataCategorizationListData = function (node) {
		console.log(node.testDataCategorizationListData);
		var cate = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)];
		cate.listData = node.testDataCategorizationListData;
		$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = cate;
	};

	$scope.updateTestDataCategorization = function (node) {
		if($rootScope.selectedTestStep.testDataCategorizationMap == undefined || $rootScope.selectedTestStep == null){
			$rootScope.selectedTestStep.testDataCategorizationMap = {};
		}

        var name = '';
        if(node.type == 'field') name = node.field.name;
        else if (node.type == 'component') name = node.component.name;
        else if (node.type == 'subcomponent') name = node.component.name;

		if(node.testDataCategorization == null || node.testDataCategorization == ''){
			$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = null;
		}else {
			var testDataCategorizationObj = {
				iPath: node.iPath,
				testDataCategorization: node.testDataCategorization,
				name: name,
				listData : []
			};

			if(node.testDataCategorization == 'Value-Test Case Fixed List'){
				node.testDataCategorizationListData = [];
				node.testDataCategorizationListData.push(node.value);
				testDataCategorizationObj.listData.push(node.value);
			}
			$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = testDataCategorizationObj;
		}

		$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
	};

    $scope.replaceDot2Dash = function(path){
        return path.split('.').join('-');
    };

    $scope.deleteSegmentTemplate = function (template){
        var index = $rootScope.template.segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.segmentTemplates.splice(index, 1);
        }
		$scope.recordChanged();
    };

    $scope.deleteMessageTemplate = function (template){
        var index = $rootScope.template.messageTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.messageTemplates.splice(index, 1);
        }
		$scope.recordChanged();
    };

    $scope.deleteER7Template = function (template){
        var index = $rootScope.template.er7Templates.indexOf(template);
        if (index > -1) {
            $rootScope.template.er7Templates.splice(index, 1);
        }
		$scope.recordChanged();
    };

    $scope.applySegmentTemplate = function (template){
		if($rootScope.selectedTestStep && $rootScope.selectedSegmentNode){
			for(var i in template.categorizations){
				var cate = angular.copy(template.categorizations[i]);
				cate.iPath = $rootScope.selectedSegmentNode.segment.iPath  + cate.iPath;
				if(cate.testDataCategorization && cate.testDataCategorization !== ''){
					$rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(cate.iPath)] = cate;
				}
			}

			if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.segment){
				$scope.selectSegment($rootScope.selectedSegmentNode.segment);
				$scope.refreshTree();
			}

			$rootScope.selectedTestStep.messageContentsXMLCode = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
			$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);

		}
		$scope.recordChanged($rootScope.selectedTestStep);
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

			$rootScope.selectedTestStep.messageContentsXMLCode = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
			$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		}
		$scope.recordChanged($rootScope.selectedTestStep);
    };

	$scope.overwriteMessageTemplate = function (template){
		if($rootScope.selectedTestStep){
			$rootScope.selectedTestStep.testDataCategorizationMap = {};
			$scope.applyMessageTemplate(template);
		}
		$scope.recordChanged($rootScope.selectedTestStep);
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
		$scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.overwriteER7Template = function (template){
		if($rootScope.selectedTestStep){
			$rootScope.selectedTestStep.er7Message = template.er7Message;

			$scope.updateEr7Message();

			if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.segment){
				$scope.selectSegment($rootScope.selectedSegmentNode.segment);
				$scope.refreshTree();
			}
		}

		$scope.initHL7EncodedMessageTab();
		$scope.recordChanged($rootScope.selectedTestStep);
    };

	$scope.deleteRepeatedField = function(node){
		var index = $rootScope.selectedSegmentNode.children.indexOf(node);
		if (index > -1) {
			$rootScope.selectedSegmentNode.children.splice(index, 1);
		}
		$scope.updateValue(node);
		$scope.selectSegment($rootScope.selectedSegmentNode.segment);
		$scope.recordChanged($rootScope.selectedTestStep);
	};

	$scope.addRepeatedField = function (node) {
		var fieldStr = node.value;
		var fieldPosition = parseInt(node.path.substring(node.path.lastIndexOf('.') + 1));
		var splittedSegment = $rootScope.selectedSegmentNode.segment.segmentStr.split("|");
		if($rootScope.selectedSegmentNode.segment.obj.name == 'MSH') fieldPosition = fieldPosition -1;
		console.log(fieldPosition);
		console.log(splittedSegment.length);

		if(splittedSegment.length < fieldPosition + 1){
			var size = fieldPosition - splittedSegment.length + 1;
			for(var i = 0; i < size; i++){
				console.log(i);
				splittedSegment.push('');
			}
		}
		console.log('REvised:: ' + splittedSegment.length);
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
		$scope.recordChanged($rootScope.selectedTestStep);
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
		console.log(segmentStr.substring(0,10));
        if(segmentStr.substring(0,10) == "MSH|||^~\\&") segmentStr = 'MSH|^~\\&' + segmentStr.substring(10);

        $rootScope.selectedSegmentNode.segment.segmentStr = segmentStr;

		var updatedER7Message = '';

		for(var i in $rootScope.segmentList){
			updatedER7Message = updatedER7Message + $rootScope.segmentList[i].segmentStr + '\n';
		}

		$rootScope.selectedTestStep.er7Message = updatedER7Message;

		if(node.testDataCategorization == 'Value-Test Case Fixed List'){
			if(node.testDataCategorizationListData.indexOf(node.value) == -1){
				node.testDataCategorizationListData.push(node.value);
			}
			var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)];
			if(testDataCategorizationObj.listData.indexOf(node.value) == -1){
				testDataCategorizationObj.listData.push(node.value);
			}
		}

		$rootScope.selectedTestStep.messageContentsXMLCode = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		$rootScope.selectedTestStep.nistXMLCode = $scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),false);
		$rootScope.selectedTestStep.stdXMLCode = $scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),true);
		$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		$scope.recordChanged($rootScope.selectedTestStep);
	};

	$scope.updateEr7Message = function () {
		$scope.initTestData();
		$rootScope.selectedTestStep.messageContentsXMLCode = $scope.generateMessageContentXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		$rootScope.selectedTestStep.nistXMLCode = $scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),false);
		$rootScope.selectedTestStep.stdXMLCode = $scope.generateXML($rootScope.segmentList, $rootScope.selectedIntegrationProfile, $rootScope.selectedConformanceProfile, $scope.findTestCaseNameOfTestStep(),true);
		$rootScope.selectedTestStep.constraintsXML = $scope.generateConstraintsXML($rootScope.segmentList, $rootScope.selectedTestStep, $rootScope.selectedConformanceProfile, $rootScope.selectedIntegrationProfile);
		$scope.recordChanged($rootScope.selectedTestStep);
	};

	$scope.reviseStr = function (str, seperator) {
		var lastChar = str.substring(str.length - 1);
		if(seperator !== lastChar) return str;
		else{
			str = str.substring(0, str.length-1);
			return $scope.reviseStr(str, seperator);
		}

	};
//	$scope.resetValidation=function(){
//		console.log("called");
//		$scope.contextValidation=false;
//	}
	$scope.report=false;
	$scope.validationError=false;
	$scope.validate = function (mode) {
		var delay = $q.defer();
		$scope.validationError=false;
		$scope.report=false;
		$scope.validationResult=false;
		var message = $scope.er7MessageOnlineValidation;
		var igDocumentId = $rootScope.selectedTestStep.integrationProfileId;
        var conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
		var cbConstraints = $rootScope.selectedTestStep.constraintsXML;
		$scope.context=mode;
		$scope.contextValidation=mode;
		var context=mode;
			$scope.loadingv = true;
			var req = {
		    method: 'POST',
		    url: 'api/validation',
		    params: { message: message, igDocumentId: igDocumentId, conformanceProfileId : conformanceProfileId , context:context}
		    ,
		    data:{
				constraint:cbConstraints
		    }
		}
		$http(req).then(function(response) {
			
			var result = angular.fromJson(response.data);
			$scope.report=$sce.trustAsHtml(result.html);
	      
	        if(result.json!==""){
	        $scope.validationResult=JSON.parse(result.json);
	        $scope.loadingv = false;
	        }
	        else{
	        	$scope.validationError=result.error;
	        	console.log($scope.validationError);
	        	  $scope.loadingv = false;
	        }
	        
	        //$scope.loadingv = false;
	        //$scope.validationView='validation.html';
	        
	        $scope.loadingv = false;
		    $scope.validationView='validation.html';
			console.log(result.json.metaData);
			delay.resolve(result.json);
			

		}, function(error) {
			$scope.loadingv = false;
			$scope.error = error.data;
			console.log($scope.error);
			delay.reject(false);

		});
		
	};
	$scope.refreshingMessage=false;
	$scope.resetValidation=function(){
		$scope.contextValidation=false;
		$scope.initHL7EncodedMessageForOnlineValidationTab();
	}
    
		
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
	
			
			
			var sortBefore = event.source.index;
			var sortAfter = event.dest.index ;

			var dataType = destNodes.$element.attr('data-type');
			event.source.nodeScope.$modelValue.position = sortAfter+1;
			$scope.updatePositions(event.dest.nodesScope.$modelValue);
			$scope.updatePositions(event.source.nodesScope.$modelValue);
			
			if($scope.sourceDrag.position!==sourceNode.$modelValue.position){
				$rootScope.changesMap[sourceNode.$parent.$nodeScope.$modelValue.id]=true;
				$rootScope.changesMap[destNodes.$nodeScope.$modelValue.id]=true;
				$scope.recordChanged();
			}else{
				if($scope.parentDrag.id!==destNodes.$parent.$modelValue.id){
					
					
					$rootScope.changesMap[sourceNode.$parent.$nodeScope.$modelValue.id]=true;
					$rootScope.changesMap[destNodes.$nodeScope.$modelValue.id]=true;
					$scope.recordChanged();
				}
			}
			


		},
		dragStart:function(event){
			var sourceNode = event.source.nodeScope;
			var destNodes = event.dest.nodesScope;
			
			$scope.sourceDrag=angular.copy(sourceNode.$modelValue);
			//$scope.destDrag=angular.copy(sourceNode.$parent.$nodeScope.$modelValue);
			$scope.parentDrag=sourceNode.$parentNodeScope.$modelValue;
			console.log($scope.parentDrag);
			//console.log($scope.sourceDrag)
			
			
		}
	};




	$scope.updatePositions= function(arr){
		
		arr.sort(function(a, b){return a.position-b.position});
		for (var i = arr.length - 1; i >= 0; i--){
			arr[i].position=i+1;
		}
	};

	$scope.getWithPosition=function(arr,index){
		angular.forEach(arr,function(element){
			if(element.position&&element.position==index){
				return element;
			}
		});
	}


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
		['Add New Testgroup', function($itemScope) {
			if( !$itemScope.$nodeScope.$modelValue.children){
				$itemScope.$nodeScope.$modelValue.children=[];
			}
			var genId=new ObjectId().toString();
			$rootScope.changesMap[genId]=true;
			$rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
			$itemScope.$nodeScope.$modelValue.children.push({
				id: genId,
				type : "testcasegroup",
				name: "New Test Group",
				testcases:[],
				isChanged:true,
				position:$itemScope.$nodeScope.$modelValue.children.length+1});

			$scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
			Notification.success({message:"New Test Group Added", delay:1000});

			$scope.recordChanged();

		}],

		['Add New Testcase', function($itemScope) {
			if( !$itemScope.$nodeScope.$modelValue.children){
				$itemScope.$nodeScope.$modelValue.children=[];
			}
			var testCaseId=new ObjectId().toString();
			$rootScope.changesMap[testCaseId]=true;
			$rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
			$itemScope.$nodeScope.$modelValue.children.push(
				{
					id: testCaseId,
					type : "testcase",
					name: "New Test Case",
					teststeps:[],
					isChanged:true,
					position:$itemScope.$nodeScope.$modelValue.children.length+1
				});
			Notification.success("New Test Case Added");

			$scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
			$scope.recordChanged();
		}
		]
	];

	$scope.testGroupOptions = [
		['Add New TestCase', function($itemScope) {
			var caseId=new ObjectId().toString();
			$rootScope.changesMap[caseId]=true;
			$rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
			$itemScope.$nodeScope.$modelValue.testcases.push({
				id: caseId,
				type : "testcase",
				name: "New Test Case",
				isChanged:true,
				position: $itemScope.$nodeScope.$modelValue.testcases.length+1,
				teststeps:[]

			});
			$scope.activeModel=$itemScope.$nodeScope.$modelValue.testcases[$itemScope.$nodeScope.$modelValue.testcases.length-1];
			Notification.success("New Test Case Added");
			$scope.recordChanged();
		}],

		['Clone', function($itemScope) {
			var clone = $scope.cloneTestCaseGroup($itemScope.$nodeScope.$modelValue);

			var name =  $itemScope.$nodeScope.$modelValue.name;
			var model =  $itemScope.$nodeScope.$modelValue;
			clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
			$itemScope.$nodeScope.$parent.$modelValue.push(clone);
			$scope.activeModel=clone;

		}],

		['Delete', function($itemScope) {
			$scope.deleteGroup($itemScope.$modelValue);
			$itemScope.$nodeScope.remove();
			Notification.success("Test Group "+$itemScope.$modelValue.name +" Deleted");
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
			$scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
		}]

	];

	
	$scope.testCaseOptions =[
		['Add New Teststep', function($itemScope) {
			
			if( !$itemScope.$nodeScope.$modelValue.teststeps){
				$itemScope.$nodeScope.$modelValue.teststeps=[];
			}
			var stepId = new ObjectId().toString();
			$rootScope.changesMap[stepId]=true;
			$rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
            var newTestStep = {
                id: stepId,
                type : "teststep",
                name : "New Test Step",
				isChanged : true,
                position : $itemScope.$nodeScope.$modelValue.teststeps.length+1,
                testStepStory: {}
            };
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
			Notification.success("New Test Step Added");

			$scope.recordChanged();

		}],

		['Clone', function($itemScope) {

			var clone = $scope.cloneTestCase($itemScope.$nodeScope.$modelValue);
			clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
			$itemScope.$nodeScope.$parent.$modelValue.push(clone);
			$scope.activeModel=clone;
			Notification.success("Test Case "+$itemScope.$modelValue.name+" Cloned");


		}],

		['Delete', function($itemScope) {
			$scope.deleteCase($itemScope.$modelValue)
			$itemScope.$nodeScope.remove();
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
			$scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
			Notification.success("Test Case "+$itemScope.$modelValue.name+" Deleted");

		}]

	];

	$scope.testStepOptions = [

		['Clone', function($itemScope) {
			//var cloneModel= {};
			//var name =  $itemScope.$nodeScope.$modelValue.name;
			//name=name+"(copy)";
			//cloneModel.name=name;
			var clone=$scope.cloneTestStep($itemScope.$nodeScope.$modelValue);
			clone.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
			$scope.activeModel=clone;
			//cloneModel.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
			$itemScope.$nodeScope.$parentNodesScope.$modelValue.push(clone);
			Notification.success("Test Step "+$itemScope.$modelValue.name+" Cloned");

			

			//$scope.activeModel=$itemScope.$nodeScope.$parentNodesScope.$modelValue[$itemScope.$nodeScope.$parentNodesScope.$modelValue.length-1];

		}],

		['Delete', function($itemScope) {
			$scope.deleteStep($itemScope.$modelValue);
			$itemScope.$nodeScope.remove();
			$scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
			$scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
			Notification.success("Test Step "+$itemScope.$modelValue.name+" Deleted");

			
		}]

	];

    $scope.MessageOptions=[



		['Delete Template', function($itemScope) {
			$scope.subview=null;
		$scope.deleteMessageTemplate($itemScope.msgTmp);
		Notification.success("Template "+$itemScope.$modelValue.name+" Deleted");


		}],

		['Apply', function($itemScope) {
			$rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
			$scope.applyMessageTemplate($itemScope.msgTmp);
			Notification.success("Template "+$itemScope.$modelValue.name+" Applied");

		}],

		['Overwrite', function($itemScope) {
			$scope.overwriteMessageTemplate($itemScope.msgTmp);
			Notification.success("Template "+$itemScope.$modelValue.name+" Applied");

		}]

	];

    $scope.SegmentOptions=[



		['Delete Template', function($itemScope) {
			
			$scope.subview=null;
		$scope.deleteSegmentTemplate($itemScope.segTmp);
		Notification.success("Template "+$itemScope.$modelValue.name+" Deleted");
		}],

		['Apply Template', function($itemScope) {

			$scope.applySegmentTemplate($itemScope.segTmp);
			Notification.success("Template"+$itemScope.$modelValue.name+" Applied");


		}],

		['Overwrite Template', function($itemScope) {
			$rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
			$scope.overwriteSegmentTemplate($itemScope.segTmp);
			Notification.success("Template "+$itemScope.$modelValue.name+"Applied");

		}]

	];

	  $scope.Er7Options=[
		['Delete Template', function($itemScope) {
			$scope.subview=null;
		$scope.deleteER7Template($itemScope.er7Tmp);
		Notification.success("Template "+$itemScope.$modelValue.name+"Deleted");


		}],

		['Apply Message', function($itemScope) {
			$rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
		$scope.overwriteER7Template($itemScope.er7Tmp);
		Notification.success("Template "+$itemScope.$modelValue.name+"Applied");

		}]
	];


	$scope.ApplyProfile = [

	                  		['Apply Profile', function($itemScope) {
	                  			$scope.applyConformanceProfile($itemScope.ip.id, $itemScope.msg.id);
	                  			$rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
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
		$rootScope.selectedTestCaseGroup=null;
		$rootScope.selectedTestCase = null;
		$rootScope.selectedTestStep = null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTemplate = null;
		$rootScope.selectedSegmentNode = null;
		$scope.editor = null;
		$scope.editorValidation = null;

		$rootScope.selectedTemplate=msgtemp;
		$scope.msgTemplate=msgtemp;
		$rootScope.CurrentTitle= "Message Template: " + msgtemp.name;
		$scope.findTitleForProfiles(msgtemp.integrationProfileId, msgtemp.conformanceProfileId);
		$scope.subview = "MessageTemplateMetadata.html";
	}
	$scope.OpenTemplateMetadata=function(temp){
		$rootScope.selectedTestCaseGroup=null;
		$rootScope.selectedTestCase = null;
		$rootScope.selectedTestStep = null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTemplate = null;
		$rootScope.selectedSegmentNode = null;
		$scope.editor = null;
		$scope.editorValidation = null;

		$scope.rootTemplate=temp;
		$rootScope.CurrentTitle= "Message Template: "+ temp.name;

		$scope.subview = "TemplateMetadata.html";
	}
	$scope.OpenSegmentTemplateMetadata=function(segTemp){
		$rootScope.selectedTestCaseGroup=null;
		$rootScope.selectedTestCase = null;
		$rootScope.selectedTestStep = null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTemplate = null;
		$rootScope.selectedSegmentNode = null;
		$scope.editor = null;
		$scope.editorValidation = null;

		$rootScope.CurrentTitle= "Segment Template: " + segTemp.name;

		$rootScope.selectedTemplate=segTemp; //never used
		$scope.segmentTemplateObject=segTemp;
		$scope.subview = "SegmentTemplateMetadata.html";
	}

	$scope.OpenEr7TemplatesMetadata=function(er7temp){
		$rootScope.selectedTestCaseGroup=null;
		$rootScope.selectedTestCase = null;
		$rootScope.selectedTestStep = null;
		$rootScope.selectedSegmentNode =null;
		$rootScope.selectedTemplate = null;
		$rootScope.selectedSegmentNode = null;
		$scope.editor = null;
		$scope.editorValidation = null;

		$rootScope.CurrentTitle= "Er7 Message Template: " + er7temp.name;
		$scope.findTitleForProfiles(er7temp.integrationProfileId, er7temp.conformanceProfileId);

		$rootScope.selectedTemplate=er7temp;
		$scope.er7Template=er7temp;
		$scope.subview = "Er7TemplateMetadata.html";
	}

	$scope.findTitleForProfiles = function (ipid, cpid){
		$scope.conformanceProfileTitle = null;
		$scope.integrationProfileTitle = null;
		for (i in $rootScope.igamtProfiles) {
			var ip = $rootScope.igamtProfiles[i];
			if(ipid == ip.id){
				$scope.integrationProfileTitle = ip.metaData.name;

				for (j in ip.messages.children) {
					var cp = ip.messages.children[j];
					if(cpid == cp.id){
						$scope.conformanceProfileTitle = cp.structID + '-' + cp.name + '-' + cp.identifier;
					}
				}
			}
		}

		for (i in $rootScope.privateProfiles) {
			var ip = $rootScope.privateProfiles[i];
			if(ipid == ip.id){
				$scope.integrationProfileTitle = ip.metaData.name;

				for (j in ip.messages.children) {
					var cp = ip.messages.children[j];
					if(cpid == cp.id){
						$scope.conformanceProfileTitle = cp.structID + '-' + cp.name + '-' + cp.identifier;
					}
				}
			}
		}
	}

	$scope.cloneTestStep=function(testStep){
		var clone= angular.copy(testStep);
		clone.name= testStep.name+" Copy";
		clone.id= new ObjectId().toString();
		$rootScope.changesMap[clone.id]=true;
		$scope.recordChanged(clone);
		return clone;
	}
	$scope.cloneTestCase= function(testCase){
		var clone= angular.copy(testCase);
		clone.name= testCase.name+" Copy";
		clone.id= new ObjectId().toString();
		$rootScope.changesMap[clone.id]=true;
		clone.teststeps=[];
		if(testCase.teststeps.length>0){
			angular.forEach(testCase.teststeps, function(teststep){
				clone.teststeps.push($scope.cloneTestStep(teststep));
			});
		}
		$scope.recordChanged(clone);
		return clone;
	};
	$scope.deleteGroup=function(group){
		if(group.id==$scope.activeModel.id){
			$scope.displayNullView();
		}
		else if(group.testcases&&group.testcases.length>0){
			angular.forEach(group.testcases,function(testcase){
				$scope.deleteCase(testcase);
			});
		}
	}
	
	$scope.deleteCase=function(testCase){
		if(testCase.id&&testCase.id===$scope.activeModel.id){
			$scope.displayNullView();
		}else{
			angular.forEach(testCase.teststeps,function(step){
				$scope.deleteStep(step);
			});
		}
		
	};
	$scope.deleteStep=function(step){
		if(step.id&&step.id===$scope.activeModel.id){
			$scope.displayNullView();
		}
	};
	
	$scope.displayNullView= function(){
		$scope.subview="nullView.html";
		$rootScope.selectedConformanceProfileId="";
		$rootScope.integrationProfileId="";
		$rootScope.selectedTestStep=null;
	}

	//$scope.validationResult={"meta Data":{"date":"2016-10-27T09:59:18.517-04:00","failuresInterpretation":[{"CONSTRAINT_FAILURE":"ERROR"},{"CODED_ELEMENT":"ERROR"},{"CONTENT_SPEC_ERROR":"AFFIRMATIVE"},{"INVALID_CONTENT":"ERROR"},{"EXCLUDED_FROM_VALIDATION":"AFFIRMATIVE"},{"CONTENT_SUCCESS":"AFFIRMATIVE"},{"PREDICATE_FAILURE":"ERROR"},{"BINDING_LOCATION":"AFFIRMATIVE"},{"EMPTY_VS":"ERROR"},{"VS_ERROR":"AFFIRMATIVE"},{"CONSTRAINT_SUCCESS":"AFFIRMATIVE"},{"USAGE":"AFFIRMATIVE"},{"USAGE":"ERROR"},{"CONSTRAINT_SPEC_ERROR":"AFFIRMATIVE"},{"PREDICATE_SPEC_ERROR":"AFFIRMATIVE"},{"VS_NOT_FOUND":"ERROR"},{"EXTRA":"WARNING"},{"EVS":"ERROR"},{"LENGTH":"ERROR"},{"PREDICATE_SUCCESS":"AFFIRMATIVE"},{"CODE_NOT_FOUND":"ERROR"},{"PVS":"ERROR"},{"UNEXPECTED":"ERROR"},{"HIGH_LEVEL_CONTENT_ERROR":"ERROR"},{"FORMAT":"ERROR"},{"CONTENT_FAILURE":"ERROR"},{"UNESCAPED_SEPARATOR":"ERROR"},{"CARDINALITY":"ERROR"},{"O_USAGE":"ALERT"}],"service":{"provider":"NIST","name":"Unified Report Test Application","validationVersion":"1.1.7"},"counts":{"alert":2,"warning":0,"informational":0,"error":2,"affirmative":276},"validationType":"Automated","profile":{"date":"October 26, 2016","identifier":"Z22","orgName":"NIST","messageType":"VXU^V04^VXU_V04","name":"Unsolicited Immunization Update","type":"Constrainable","version":"No Version Info","hl7version":"2.5.1"},"standardType":"HL7 V2","message":{"encoding":"ER7","content":"MSH|^~\\&|Test EHR Application|X68||NIST Test Iz Reg|20120701082240-0500||VXU^V04^VXU_V04|NIST-IZ-001.00|P|2.5.1|||ER|AL|||||Z22^CDCPHINVS\nPID|1||D26376273^^^NIST MPI^MR||Snow^Madelynn^Ainsley^^^^L|Lam^Morgan^^^^^M|20070706|F||2076-8^Native Hawaiian or Other Pacific Islander^CDCREC|32 Prescott Street Ave^^Warwick^MA^02452^USA^L||^PRN^PH^^^657^5558563|||||||||2186-5^non Hispanic or Latino^CDCREC\nPD1|||||||||||02^Reminder/Recall - any method^HL70215|||||A|20120701|20120701\nNK1|1|Lam^Morgan^^^^^L|MTH^Mother^HL70063|32 Prescott Street Ave^^Warwick^MA^02452^USA^L|^PRN^PH^^^657^5558563\nORC|RE||IZ-783274^NDA|||||||I-23432^Burden^Donna^A^^^^^NIST-AA-1^^^^PRN||57422^RADON^NICHOLAS^^^^^^NIST-AA-1^L^^^MD\nRXA|0|1|20120814||33332-0010-01^Influenza, seasonal, injectable, preservative free^NDC|0.5|mL^MilliLiter [SI Volume Units]^UCUM||00^New immunization record^NIP001|7832-1^Lemon^Mike^A^^^^^NIST-AA-1^^^^PRN|^^^X68||||Z0860BB|20121104|CSL^CSL Behring^MVX|||CP|A\nRXR|C28161^Intramuscular^NCIT|LD^Left Arm^HL70163\nOBX|1|CE|64994-7^Vaccine funding program eligibility category^LN|1|V05^VFC eligible - Federally Qualified Health Center Patient (under-insured)^HL70064||||||F|||20120701|||VXC40^Eligibility captured at the immunization level^CDCPHINVS\nOBX|2|CE|30956-7^vaccine type^LN|2|88^Influenza, unspecified formulation^CVX||||||F\nOBX|3|TS|29768-9^Date vaccine information statement published^LN|2|20120702||||||F\nOBX|4|TS|29769-7^Date vaccine information statement presented^LN|2|20120814||||||F"},"type":"Context-Free","validationStatus":"false"},"detections":{"Affirmative":{"Excluded From Validation":[{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"The value set HL70361_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-3[1].1","line":1,"column":10,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"The value set HL70362_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-4[1].1","line":1,"column":31,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"The value set HL70362_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-6[1].1","line":1,"column":36,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-9[1].1","line":1,"column":74,"description":"The value set HL70076_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-9[1].2","line":1,"column":78,"description":"The value set HL70003_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-9[1].3","line":1,"column":82,"description":"The value set HL70354_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-11[1].1","line":1,"column":105,"description":"The value set HL70103_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-12[1].1","line":1,"column":107,"description":"The value set HL70104_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"The value set PHVS_ImmunizationProfileIdentifier_IIS has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"MSH[1]-21[1].2","line":1,"column":129,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-3[1].4.1","line":2,"column":20,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-3[1].5","line":2,"column":29,"description":"The value set HL70203_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-5[1].7","line":2,"column":58,"description":"The value set HL70200_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-6[1].7","line":2,"column":75,"description":"The value set HL70200_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-8[1]","line":2,"column":86,"description":"The value set HL70001_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-10[1]","line":2,"column":89,"description":"The value set CDCREC_R_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-10[1].3","line":2,"column":138,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-11[1].6","line":2,"column":186,"description":"The value set HL70399 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-11[1].7","line":2,"column":190,"description":"The value set HL70190_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-13[1].2","line":2,"column":194,"description":"The value set HL70201_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-13[1].3","line":2,"column":198,"description":"The value set HL70202_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-22[1]","line":2,"column":223,"description":"The value set CDCREC_E_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PID[1]-22[1].3","line":2,"column":253,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PD1[1]-11[1]","line":3,"column":15,"description":"The value set HL70215 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PD1[1]-11[1].3","line":3,"column":47,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"PD1[1]-16[1]","line":3,"column":59,"description":"The value set HL70441_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-2[1].7","line":4,"column":22,"description":"The value set HL70200_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-3[1]","line":4,"column":24,"description":"The value set HL70063_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-3[1].3","line":4,"column":35,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-4[1].6","line":4,"column":84,"description":"The value set HL70399 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-4[1].7","line":4,"column":88,"description":"The value set HL70190_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-5[1].2","line":4,"column":91,"description":"The value set HL70201_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"NK1[1]-5[1].3","line":4,"column":95,"description":"The value set HL70202_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-1[1]","line":5,"column":5,"description":"The value set HL70119_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-3[1].2","line":5,"column":19,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-10[1].9.1","line":5,"column":56,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-10[1].13","line":5,"column":69,"description":"The value set HL70203_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-12[1].9.1","line":5,"column":100,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-12[1].10","line":5,"column":110,"description":"The value set HL70200_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"ORC[1]-12[1].13","line":5,"column":114,"description":"The value set HL70203_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-5[1]","line":6,"column":19,"description":"The value set CVX has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-5[1].3","line":6,"column":84,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-7[1]","line":6,"column":92,"description":"The value set UCUM has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-7[1].3","line":6,"column":124,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-9[1]","line":6,"column":130,"description":"The value set NIP001 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-9[1].3","line":6,"column":157,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-10[1].9.1","line":6,"column":188,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-10[1].13","line":6,"column":201,"description":"The value set HL70203_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-11[1].4.1","line":6,"column":208,"description":"The value set HL70363_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-17[1]","line":6,"column":232,"description":"The value set MVX has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-17[1].3","line":6,"column":248,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXA[1]-20[1]","line":6,"column":254,"description":"The value set HL70322_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXR[1]-1[1]","line":7,"column":5,"description":"The value set NCIT has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXR[1]-1[1].3","line":7,"column":26,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXR[1]-2[1]","line":7,"column":31,"description":"The value set HL70163_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"RXR[1]-2[1].3","line":7,"column":43,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-2[1]","line":8,"column":7,"description":"The value set HL70125_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-3[1]","line":8,"column":10,"description":"The value set NIP003 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-3[1].3","line":8,"column":63,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-5[1].3","line":8,"column":145,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-11[1]","line":8,"column":158,"description":"The value set HL70085_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-17[1]","line":8,"column":173,"description":"The value set PHVS_FundingEligibilityObsMethod_IIS has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[1]-17[1].3","line":8,"column":226,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[2]-2[1]","line":9,"column":7,"description":"The value set HL70125_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[2]-3[1]","line":9,"column":10,"description":"The value set NIP003 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[2]-3[1].3","line":9,"column":31,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[2]-5[1].3","line":9,"column":74,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[2]-11[1]","line":9,"column":83,"description":"The value set HL70085_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[3]-2[1]","line":10,"column":7,"description":"The value set HL70125_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[3]-3[1]","line":10,"column":10,"description":"The value set NIP003 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[3]-3[1].3","line":10,"column":63,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[3]-11[1]","line":10,"column":82,"description":"The value set HL70085_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[4]-2[1]","line":11,"column":7,"description":"The value set HL70125_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[4]-3[1]","line":11,"column":10,"description":"The value set NIP003 has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[4]-3[1].3","line":11,"column":63,"description":"The value set HL70396_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"},{"path":"OBX[4]-11[1]","line":11,"column":82,"description":"The value set HL70085_IZ has been excluded from the validation","stackTrace":null,"category":"Excluded From Validation","classification":"Affirmative"}],"Usage":[{"path":"OBX[2]-14[1]","line":9,"column":1,"description":"Field OBX-14 (Date/Time of the Observation) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"OBX[3]-14[1]","line":10,"column":1,"description":"Field OBX-14 (Date/Time of the Observation) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"OBX[4]-14[1]","line":11,"column":1,"description":"Field OBX-14 (Date/Time of the Observation) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"RXA[1]-10[1].10","line":6,"column":164,"description":"Component RXA-10.10 (Name Type Code) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"ORC[1]-17[1]","line":5,"column":1,"description":"Field ORC-17 (Entering Organization) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"ORC[1]-12[1].4","line":5,"column":74,"description":"Component ORC-12.4 (Second and Further Given Names or Initials Thereof) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"ORC[1]-10[1].10","line":5,"column":29,"description":"Component ORC-10.10 (Name Type Code) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"ORC[1]-2[1]","line":5,"column":1,"description":"Field ORC-2 (Placer Order Number) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"NK1[1]-4[1].2","line":4,"column":43,"description":"Component NK1-4.2 (Other Designation) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"NK1[1]-2[1].3","line":4,"column":7,"description":"Component NK1-2.3 (Second and Further Given Names or Initials Thereof) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"PD1[1]-12[1]","line":3,"column":1,"description":"Field PD1-12 (Protection Indicator) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"PID[1]-30[1]","line":2,"column":1,"description":"Field PID-30 (Patient Death Indicator) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"PID[1]-24[1]","line":2,"column":1,"description":"Field PID-24 (Multiple Birth Indicator) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"PID[1]-11[1].2","line":2,"column":145,"description":"Component PID-11.2 (Other Designation) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"MSH[1]-23[1]","line":1,"column":1,"description":"Field MSH-23 (Receiving Responsible Organization) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"MSH[1]-22[1]","line":1,"column":1,"description":"Field MSH-22 (Sending Responsible Organization) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"},{"path":"MSH[1]-5[1]","line":1,"column":1,"description":"Field MSH-5 (Receiving Application) is missing. Depending on the use case and data availability it may be appropriate to value this element (Usage is RE, Required, but may be Empty).","stackTrace":null,"category":"Usage","classification":"Affirmative"}],"Predicate Success":[{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"Predicate C(R/X) target: 4[1] description: If EI.3 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"Predicate C(R/O) target: 3[1] description: If EI.2 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"Predicate C(R/O) target: 2[1] description: If EI.3 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]","line":2,"column":1,"description":"Predicate C(RE/X) target: 29[1] description: If the value of PID-30 (Patient Death Indicator) is 'Y'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]","line":2,"column":1,"description":"Predicate C(RE/O) target: 25[1] description: If the value of PID-24 (Multiple Birth Indicator) is 'Y'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-3[1]","line":2,"column":8,"description":"Predicate C(O/X) target: 3[1] description: If CX.2 (Check Digit) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-10[1]","line":2,"column":89,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-10[1]","line":2,"column":89,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-13[1]","line":2,"column":193,"description":"Predicate C(R/X) target: 7[1] description: If the value of XTN.2 (Telecommunication Use Code) is not 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-13[1]","line":2,"column":193,"description":"Predicate C(RE/X) target: 6[1] description: If the value of XTN.2 (Telecommunication Use Code) is not 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-13[1]","line":2,"column":193,"description":"Predicate C(R/X) target: 4[1] description: If the value of XTN.2 (Telecommunication Use Code) is 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-22[1]","line":2,"column":223,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PID[1]-22[1]","line":2,"column":223,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PD1[1]","line":3,"column":1,"description":"Predicate C(RE/X) target: 18[1] description: If PD1-11 (Publicity Code) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PD1[1]","line":3,"column":1,"description":"Predicate C(RE/X) target: 17[1] description: If PD1-16 (Immunization Registry Status) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PD1[1]","line":3,"column":1,"description":"Predicate C(RE/X) target: 13[1] description: If PD1-12 (Protection Indicator) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PD1[1]-11[1]","line":3,"column":15,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"PD1[1]-11[1]","line":3,"column":15,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"NK1[1]-3[1]","line":4,"column":24,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"NK1[1]-3[1]","line":4,"column":24,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"NK1[1]-5[1]","line":4,"column":90,"description":"Predicate C(R/X) target: 7[1] description: If the value of XTN.2 (Telecommunication Use Code) is not 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"NK1[1]-5[1]","line":4,"column":90,"description":"Predicate C(RE/X) target: 6[1] description: If the value of XTN.2 (Telecommunication Use Code) is not 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"NK1[1]-5[1]","line":4,"column":90,"description":"Predicate C(R/X) target: 4[1] description: If the value of XTN.2 (Telecommunication Use Code) is 'NET'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-3[1]","line":5,"column":9,"description":"Predicate C(R/X) target: 4[1] description: If EI.3 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-3[1]","line":5,"column":9,"description":"Predicate C(R/O) target: 3[1] description: If EI.2 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-3[1]","line":5,"column":9,"description":"Predicate C(R/O) target: 2[1] description: If EI.3 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1]","line":5,"column":29,"description":"Predicate C(R/X) target: 13[1] description: If XCN.1 (ID number) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1]","line":5,"column":29,"description":"Predicate C(O/X) target: 12[1] description: If XCN.11 (Check Digit Identifer) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1]","line":5,"column":29,"description":"Predicate C(R/X) target: 9[1] description: If XCN.1 (Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1]","line":5,"column":29,"description":"Predicate C(R/RE) target: 1[1] description: If XCN.2.1 (Surname) and  XCN.3 (Given Name) are not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1]","line":5,"column":74,"description":"Predicate C(R/X) target: 13[1] description: If XCN.1 (ID number) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1]","line":5,"column":74,"description":"Predicate C(O/X) target: 12[1] description: If XCN.11 (Check Digit Identifer) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1]","line":5,"column":74,"description":"Predicate C(R/X) target: 9[1] description: If XCN.1 (Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1]","line":5,"column":74,"description":"Predicate C(R/RE) target: 1[1] description: If XCN.2.1 (Surname) and  XCN.3 (Given Name) are not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(R/X) target: 18[1] description: If RXA-20 (Completion Status) is valued AND if the value of RXA-20 (Completion Status) is 'RE'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(R/O) target: 17[1] description: If RXA-9.1 (Identifier) is valued AND if the value of RXA-9.1 (Identifier) is '00'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(RE/O) target: 16[1] description: If RXA-15 (Substance Lot Number) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(R/O) target: 15[1] description: If the value of RXA-9.1 (Identifier) is '00' AND if RXA-9.1 (Identifier) is valued AND if the value of RXA-20 (Completion Status) is one of List Values: 'CP','PA' AND if RXA-20 (Completion Status) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(RE/O) target: 11[1] description: If the value of RXA-9.1 (Identifier) is '00' AND if the value of RXA-20 (Completion Status) is one of List Values: 'CP','PA'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(RE/O) target: 10[1] description: If the value of RXA-9.1 (Identifier) is '00' AND if the value of RXA-20 (Completion Status) is one of List Values: 'CP','PA'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(R/O) target: 9[1] description: If the value of RXA-20 (Completion Status) is one of List Values: 'CP','PA'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"Predicate C(R/X) target: 7[1] description: If the value of RXA-6 (Administered Amount) is not '999'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-5[1]","line":6,"column":19,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-5[1]","line":6,"column":19,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-7[1]","line":6,"column":92,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-7[1]","line":6,"column":92,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-9[1]","line":6,"column":130,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-9[1]","line":6,"column":130,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1]","line":6,"column":164,"description":"Predicate C(R/X) target: 13[1] description: If XCN.1 (ID number) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1]","line":6,"column":164,"description":"Predicate C(O/X) target: 12[1] description: If XCN.11 (Check Digit Identifer) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1]","line":6,"column":164,"description":"Predicate C(R/X) target: 9[1] description: If XCN.1 (Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1]","line":6,"column":164,"description":"Predicate C(R/RE) target: 1[1] description: If XCN.2.1 (Surname) and  XCN.3 (Given Name) are not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-11[1].4","line":6,"column":208,"description":"Predicate C(R/X) target: 3[1] description: If HD.2 (Universal ID) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-11[1].4","line":6,"column":208,"description":"Predicate C(R/O) target: 2[1] description: If HD.1 (Namespace ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-11[1].4","line":6,"column":208,"description":"Predicate C(R/O) target: 1[1] description: If HD.2 (Universal ID) is not valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-17[1]","line":6,"column":232,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXA[1]-17[1]","line":6,"column":232,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXR[1]-1[1]","line":7,"column":5,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXR[1]-1[1]","line":7,"column":5,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXR[1]-2[1]","line":7,"column":31,"description":"Predicate C(R/X) target: 6[1] description: If CWE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXR[1]-2[1]","line":7,"column":31,"description":"Predicate C(RE/X) target: 5[1] description: If CWE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"RXR[1]-2[1]","line":7,"column":31,"description":"Predicate C(R/X) target: 3[1] description: If CWE.1 (Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"Predicate C(RE/O) target: 17[1] description: If the value of OBX-3.1 (Identifier) is '64994-7'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"Predicate C(R/O) target: 6[1] description: If the value of OBX-2 (Value Type) is 'NM'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-3[1]","line":8,"column":10,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-3[1]","line":8,"column":10,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-5[1]","line":8,"column":68,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-5[1]","line":8,"column":68,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-17[1]","line":8,"column":173,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[1]-17[1]","line":8,"column":173,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"Predicate C(RE/O) target: 17[1] description: If the value of OBX-3.1 (Identifier) is '64994-7'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"Predicate C(R/O) target: 6[1] description: If the value of OBX-2 (Value Type) is 'NM'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]-3[1]","line":9,"column":10,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]-3[1]","line":9,"column":10,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]-5[1]","line":9,"column":36,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[2]-5[1]","line":9,"column":36,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"Predicate C(RE/O) target: 17[1] description: If the value of OBX-3.1 (Identifier) is '64994-7'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"Predicate C(R/O) target: 6[1] description: If the value of OBX-2 (Value Type) is 'NM'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[3]-3[1]","line":10,"column":10,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[3]-3[1]","line":10,"column":10,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"Predicate C(RE/O) target: 17[1] description: If the value of OBX-3.1 (Identifier) is '64994-7'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"Predicate C(R/O) target: 6[1] description: If the value of OBX-2 (Value Type) is 'NM'.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[4]-3[1]","line":11,"column":10,"description":"Predicate C(R/X) target: 6[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"},{"path":"OBX[4]-3[1]","line":11,"column":10,"description":"Predicate C(RE/X) target: 5[1] description: If CE.4 (Alternate Identifier) is valued.","stackTrace":null,"category":"Predicate Success","classification":"Affirmative"}],"Constraint Success":[{"path":"MSH[1]","line":1,"column":1,"description":"IZ-12 - The value of MSH-1 (Field Separator) SHALL be '|'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-13 - The value of MSH.2 (Encoding Characters) SHALL be '^~\\&'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-TS_Z - The value of MSH-7.1 (Time) SHALL be formatted with YYYYMMDDHHMMSS+-ZZZZ.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-17 - The value of MSH-9 (Message Type) SHALL be 'VXU^V04^VXU_V04'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-15 - The value of MSH-12.1 (Version ID) SHALL be '2.5.1'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-42 - The value of MSH-15 (Accept Acknowledgment Type) SHALL be 'ER'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-41 - The value of MSH-16 (Application Acknowledgment Type) SHALL be 'AL'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]","line":1,"column":1,"description":"IZ-43 - The value of MSH-21[1] (Message Profile Identifier) SHALL be 'Z22^CDCPHINVS'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-3[1]","line":1,"column":10,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-4[1]","line":1,"column":31,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-6[1]","line":1,"column":36,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-9[1]","line":1,"column":74,"description":"IZ-17 - The value of MSG.1 (Message Code) SHALL be 'VXU'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-9[1]","line":1,"column":74,"description":"IZ-17 - The value of MSG.2 (Trigger Event) SHALL be 'V04'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-9[1]","line":1,"column":74,"description":"IZ-17 - The value of MSG.3 (Message Structure) SHALL be 'VXU_V04'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"IZ-3 - The value of EI.3 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"MSH[1]-21[1]","line":1,"column":125,"description":"IZ-4 - The value of EI.4 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PID[1]","line":2,"column":1,"description":"IZ-46 - The value of PID-1 (Set ID - PID) SHALL be '1'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PID[1]","line":2,"column":1,"description":"IZ-TS_NZ - The value of PID-7.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PID[1]-3[1].4","line":2,"column":20,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PID[1]-6[1]","line":2,"column":60,"description":"IZ-66 - The value of XPN.7 (Name Type Code) SHALL be 'M'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PD1[1]","line":3,"column":1,"description":"IZ-DT_D - The value of PD1-17 (Immunization Registry Status Effective Date) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"PD1[1]","line":3,"column":1,"description":"IZ-DT_D - The value of PD1-18 (Publicity Code Effective Date) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"NK1[1]","line":4,"column":1,"description":"IZ-70 - The Value of NK1-1 (Set ID-NK1) SHALL be valued sequentially starting with the value \"1\".","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]","line":5,"column":1,"description":"IZ-25 - The value of ORC-1 (Order Control) SHALL be 'RE'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-3[1]","line":5,"column":9,"description":"IZ-3 - The value of EI.3 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-3[1]","line":5,"column":9,"description":"IZ-4 - The value of EI.4 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-10[1].9","line":5,"column":56,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"ORC[1]-12[1].9","line":5,"column":100,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-28 - The value of RXA-1 (Give Sub-ID Counter) SHALL be '0'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-TS_NZ - The value of RXA-3.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-30 - If RXA-4.1 (Time) is valued, then RXA.4.1 (Time) SHALL be identical to the RXA-3.1 (Time).","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-TS_NZ - The value of RXA-4.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-48 - If RXA-20 (Completion Status) is valued and the value of RXA-20 (Completion Status) is 'RE' then the value of RXA-6 (Administered Amount) SHALL be '999'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-49 - If RXA-5.1 (Identifier) is valued and the value of RXA-5.1 (Identifier) is '998' then the value of RXA-6 (Administered Amount) SHALL be '999'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-31 - If RXA-20 (Completion Status) is valued and the value of RXA-20 (Completion Status) is one of List Values: 'CP','PA' then the value of RXA-9.1 (Identifier) SHALL be one of codes listed in the Value Set: NIP001.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-47 - If RXA-20 (Completion Status) is not valued or the value of RXA-20 (Completion Status) is not one of List Values: 'CP','PA' then RXA-9.1 (Identifier) SHALL NOT be valued.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-TS_M - The value of RXA-16.1 (Time) SHALL be formatted with YYYYMM.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]","line":6,"column":1,"description":"IZ-32 - If RXA-18[1] (Substance/Treatment Refusal Reason) is valued, then the value of RXA-20 (Completion Status) SHALL be 'RE'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]-10[1].9","line":6,"column":188,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]-11[1].4","line":6,"column":208,"description":"IZ-5 - The value of HD.2 (Universal ID) SHALL be formatted with ISO-compliant OID.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"RXA[1]-11[1].4","line":6,"column":208,"description":"IZ-6 - The value of HD.3 (Universal ID Type) SHALL be 'ISO'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"IZ-22 - The value of OBX-11 (Observation Result Status) SHALL be 'F'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"IZ-36 - If The value of OBX-3.1 (Identifier) is '69764-9' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: PHVS_VISBarcodes_IIS.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"IZ-37 - If The value of OBX-3.1 (Identifier) is '30956-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: CVX.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"IZ-44 - The value of OBX-4 SHALL be a positive integer.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[1]","line":8,"column":1,"description":"IZ-TS_NZ - The value of OBX-14.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-22 - The value of OBX-11 (Observation Result Status) SHALL be 'F'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-35 - If The value of OBX-3.1 (Identifier) is '64994-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: HL70064_IZ.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-36 - If The value of OBX-3.1 (Identifier) is '69764-9' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: PHVS_VISBarcodes_IIS.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-37 - If The value of OBX-3.1 (Identifier) is '30956-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: CVX.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-44 - The value of OBX-4 SHALL be a positive integer.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[2]","line":9,"column":1,"description":"IZ-TS_NZ - The value of OBX-14.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-22 - The value of OBX-11 (Observation Result Status) SHALL be 'F'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-35 - If The value of OBX-3.1 (Identifier) is '64994-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: HL70064_IZ.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-36 - If The value of OBX-3.1 (Identifier) is '69764-9' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: PHVS_VISBarcodes_IIS.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-37 - If The value of OBX-3.1 (Identifier) is '30956-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: CVX.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-44 - The value of OBX-4 SHALL be a positive integer.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[3]","line":10,"column":1,"description":"IZ-TS_NZ - The value of OBX-14.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-22 - The value of OBX-11 (Observation Result Status) SHALL be 'F'.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-35 - If The value of OBX-3.1 (Identifier) is '64994-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: HL70064_IZ.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-36 - If The value of OBX-3.1 (Identifier) is '69764-9' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: PHVS_VISBarcodes_IIS.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-37 - If The value of OBX-3.1 (Identifier) is '30956-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: CVX.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-44 - The value of OBX-4 SHALL be a positive integer.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"},{"path":"OBX[4]","line":11,"column":1,"description":"IZ-TS_NZ - The value of OBX-14.1 (Time) SHALL be formatted with YYYYMMDD.","stackTrace":null,"category":"Constraint Success","classification":"Affirmative"}]},"Error":{"Constraint Failure":[{"path":"RXA[1]-2[1]","line":6,"column":7,"description":"IZ-29 - The value of MSH.2 (Encoding Characters) SHALL be '^~\\&'.","stackTrace":[{"reasons":["[6, 7] '1' is different from '^~\\&' (case sensitive)"],"assertion":"()RXA.2[1] SHALL be equal to '^~\\&' ()"}],"category":"Constraint Failure","classification":"Error"},{"path":"OBX[1]-5[1]","line":8,"column":68,"description":"IZ-35 - If The value of OBX-3.1 (Identifier) is '64994-7' and the value of OBX-2 (Value Type) is 'CE' then the value of OBX-5.1 (Observation Value) SHALL be one of codes listed in the Value Set: HL70064_IZ.","stackTrace":[{"reasons":[],"assertion":"()OBX.3[1].1[1] SHALL not be equal to '64994-7' () OR ()OBX.2[1] SHALL not be equal to 'CE' () OR OBX.5[1] SHALL be valued from the value set HL70064_IZ (Binding Strength = Some(R), Binding Location = Some(Position(1)))"},{"reasons":["[8, 1] The inner expression is true"],"assertion":"()OBX.3[1].1[1] SHALL not be equal to '64994-7' () OR ()OBX.2[1] SHALL not be equal to 'CE' ()"},{"reasons":["[8, 68] Value set 'HL70064_IZ' cannot be found in the library"],"assertion":"OBX.5[1] SHALL be valued from the value set HL70064_IZ (Binding Strength = Some(R), Binding Location = Some(Position(1)))"}],"category":"Constraint Failure","classification":"Error"}]},"Alert":{"O-Usage":[{"path":"RXA[1]-21[1]","line":6,"column":257,"description":"Optional element Field RXA-21 (Action Code - RXA) was populated with the value A. Depending on the local implementation this element is excluded from the validation","stackTrace":null,"category":"O-Usage","classification":"Alert"},{"path":"PID[1]-6[1].2","line":2,"column":64,"description":"Optional element Component PID-6.2 (Given Name) was populated with the value Morgan. Depending on the local implementation this element is excluded from the validation","stackTrace":null,"category":"O-Usage","classification":"Alert"}]}}};
	//$scope.validationResult= trimKeys($scope.validationResult1);
	//
	//$scope.validationErrors=$scope.validationResult.detections.Error["Constraint Failure"];
	
	$scope.initValidation=function(){
		$scope.validationResult=$scope.validationResult1;
	}
	
	$scope.getAllValue=function(obj){
		var table=[];
		angular.forEach(Object.keys(obj),function(prop){
			table=_.union(table,obj[prop]);
			
		});
		return table;
	};
	
	$scope.cloneTestCaseGroup=function(testCaseGroup){
		var clone = angular.copy(testCaseGroup);
		clone.name= testCaseGroup.name+" Copy";
		clone.id= new ObjectId().toString();
		$rootScope.changesMap[clone.id]=true;
		clone.testcases=[];
		if(testCaseGroup.testcases.length>0){
			angular.forEach(testCaseGroup.testcases, function(testcase){
				clone.testcases.push($scope.cloneTestCase(testcase));

			});
		}
		$scope.recordChanged(clone);
		// Notification.success("Test Group "+testCaseGroup.name +" Clonned");
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

angular.module('tcl').controller('validationInfoController', function ($scope, $modalInstance,$rootScope, $http) {

	$scope.close = function () {
		$modalInstance.dismiss('cancel');
	};
});
angular.module('tcl').controller('reportController', function ($scope, $modalInstance,$rootScope, $http,report) {
	$scope.report=report;
	$scope.close = function () {
		$modalInstance.dismiss('cancel');
	};
});

angular.module('tcl').controller('MessageTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {

	var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
		return i;
	});
	$scope.newMessageTemplate = {};
	$scope.newMessageTemplate.id = new ObjectId().toString();
	$rootScope.changesMap[$scope.newMessageTemplate.id]=true;
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
	$rootScope.changesMap[$scope.newSegmentTemplate.id]=true;
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
	$rootScope.changesMap[$scope.newEr7Template.id]=true;
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

angular.module('tcl').controller('MessageViewCtrl', function($scope, $rootScope) {
		$scope.loading = false;
		$scope.msg = null;
		$scope.messageData = [];
		$scope.setData = function(node) {
			if (node) {
				if (node.type === 'message') {
					angular.forEach(node.children, function(segmentRefOrGroup) {
						$scope.setData(segmentRefOrGroup);
					});
				} else if (node.type === 'group') {
					$scope.messageData.push({ name: "-- " + node.name + " begin" });
					if (node.children) {
						angular.forEach(node.children, function(segmentRefOrGroup) {
							$scope.setData(segmentRefOrGroup);
						});
					}
					$scope.messageData.push({ name: "-- " + node.name + " end" });
				} else if (node.type === 'segment') {
					$scope.messageData.push + (node);
				}
			}
		};


		$scope.init = function(message) {
			$scope.loading = true;
			$scope.msg = message;
			console.log(message.id);
			$scope.setData($scope.msg);
			$scope.loading = false;
		};

	});
