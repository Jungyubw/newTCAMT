/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ProfileCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, IgDocumentService, ElementUtils,AutoSaveService,$sce, Notification) {
	$scope.loading = false;


	$scope.initProfiles= function () {
		$scope.loadIGDocuments();
		$scope.loadXMLProfiles();
	};

	$scope.loadXMLProfiles = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.privateProfiles = [];
			$scope.loading = true;
			$http.get('api/profiles').then(function(response) {
				$rootScope.privateProfiles = angular.fromJson(response.data);
				$scope.loading = false;
				delay.resolve(true);
			}, function(error) {
				$scope.loading = false;
				$scope.error = error.data;
				delay.reject(false);

			});
		}else{
			delay.reject(false);
		}
	};

	$scope.loadIGDocuments = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
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
		}else{
			delay.reject(false);
		}
	};


	$scope.openDialogForImportXMLProfile = function (ev) {
		$mdDialog.show({
			controller: $scope.ImportXMLProfileModalCtrl,
			templateUrl: 'ImportXMLProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function(error) {
			console.log(error);
		}, function() {
		});
	};

	$scope.ImportXMLProfileModalCtrl = function($scope, $mdDialog, $http) {
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var importProfileButton = $("#importProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				importProfileButton.prop('disabled', false);
			}

		};

		$scope.validateForProfileXMLFile = function(files) {
			var f = document.getElementById('profileXMLFile').files[0];
			var reader = new FileReader();
			reader.onloadend = function(e) {
				$scope.xmlFilesData.profileXMLFileStr = reader.result;
				var errorElm = $("#errorMessageForXMLProfile");
				errorElm.empty();
				errorElm.append('<span>' + files[0].name + ' is loaded!</span>');
				$scope.checkLoadAll();
			};
			reader.readAsText(f);


		};

		$scope.validateForValueSetXMLFile = function(files) {
			var f = document.getElementById('valueSetXMLFile').files[0];
			var reader = new FileReader();
			reader.onloadend = function(e) {
				$scope.xmlFilesData.valueSetXMLFileStr = reader.result;
				var errorElm = $("#errorMessageForValueSetXML");
				errorElm.empty();
				errorElm.append('<span>' + files[0].name + ' is loaded!</span>');
				$scope.checkLoadAll();
			};
			reader.readAsText(f);
		};

		$scope.validateForConstraintsXMLFile = function(files) {
			var f = document.getElementById('constraintsXMLFile').files[0];
			var reader = new FileReader();
			reader.onloadend = function(e) {
				$scope.xmlFilesData.constraintsXMLFileStr = reader.result;
				var errorElm = $("#errorMessageForConstraintsXML");
				errorElm.empty();
				errorElm.append('<span>' + files[0].name + ' is loaded!</span>');
				$scope.checkLoadAll();
			};
			reader.readAsText(f);
		};

		$scope.importProfileXML = function() {
			console.log($scope.xmlFilesData);
			$http.post('api/profiles/importXMLFiles', $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function (error) {
			});
		};
	};
});