/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').controller('loginTestingTool', ['$scope', '$rootScope', '$mdDialog', 'loginTestingToolSvc', 'base64', '$http', '$q', 'Notification', 'testplan','StorageService','$timeout','$window',function ($scope, $rootScope, $mdDialog, loginTestingToolSvc, base64, $http, $q, Notification, testplan,StorageService,$timeout,$window) {

    $scope.exportStep = 'LOGIN_STEP';
    $scope.xmlFormat = 'Validation';
    $scope.selectedMessagesIDs = [];
    $scope.loading = false;
    $scope.info = {text: undefined, show: false, type: null, details: null};
    $scope.redirectUrl = null;
    $scope.user = {username: StorageService.getGvtUsername(), password: StorageService.getGvtPassword()};
    $scope.appInfo = $rootScope.appInfo;
    $scope.selected = false;
    $scope.targetApps = _.sortBy($rootScope.appInfo.connectApps,'position');
    $scope.targetDomains = null;
    $scope.error = null;
    $scope.testplan=testplan;
    $scope.app= $scope.targetApps.length && $scope.targetApps.length? $scope.targetApps[0]:null;

    $scope.target = {
        url: null, domain: null
    };


    $scope.newDomain = null;

    $scope.toggleCustom=function (customURl) {


        if(customURl) {

            $scope.targetApps = _.sortBy($rootScope.appInfo.connectApps, 'position');

            $scope.app = $scope.targetApps.length && $scope.targetApps.length ? $scope.targetApps[0] : null;

        }else{
            $scope.app={url:""};

        }
    };



    $scope.selectTargetUrl = function () {
        console.log("Target URL Change");
        console.log($scope.app.url);
        StorageService.set("EXT_TARGET_URL", $scope.app.url);
        $scope.loadingDomains = false;
        $scope.targetDomains = null;
        $scope.target.domain = null;
        $scope.newDomain = null;
        $scope.error = null;
    };

    $scope.selectTargetDomain = function () {
        $scope.newDomain = null;
        if ($scope.target.domain != null) {
            StorageService.set($scope.app.url + "/EXT_TARGET_DOMAIN", $scope.target.domain);
        }
    };


    $scope.trackSelections = function () {
        $scope.selected = false;
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            if (message.selected) $scope.selected = true;
        }
    };

    $scope.selectionAll = function (bool) {
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            message.selected = bool;
        }
        $scope.selected = bool;
    };

    $scope.generatedSelectedMessagesIDs = function () {
        $scope.selectedMessagesIDs = [];
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            if (message.selected) {
                $scope.selectedMessagesIDs.push(message.id);
            }
        }
    };


    $scope.goBack = function () {
        $scope.error = null;
        if ($scope.exportStep === 'DOMAIN_STEP') {
            $scope.exportStep = 'LOGIN_STEP';
        } else if ($scope.exportStep === 'ERROR_STEP') {
            $scope.loadDomains();
        }
    };

    $scope.login = function () {
        loginTestingToolSvc.login($scope.user.username, $scope.user.password, $scope.app.url).then(function (auth) {

            console.log($scope.user);
            StorageService.setGvtUsername($scope.user.username);
            StorageService.setGvtPassword($scope.user.password);
            StorageService.setGVTBasicAuth(auth);
            $scope.loadDomains();
        }, function (error) {
            $scope.error = "Invalid credentials";
        });
    };

    $scope.loadDomains = function () {
        $scope.targetDomains = [];
        $scope.target.domain = null;
        if($scope.app.url != null) {
            loginTestingToolSvc.getDomains($scope.app.url, StorageService.getGVTBasicAuth()).then(function (result) {
                $scope.targetDomains = result;
                var savedTargetDomain = StorageService.get($scope.app.url + "/EXT_TARGET_DOMAIN");
                if (savedTargetDomain != null) {
                    for (var targetDomain in $scope.targetDomains) {
                        if (targetDomain.domain === savedTargetDomain) {
                            $scope.target.domain = savedTargetDomain;
                            break;
                        }
                    }
                } else {
                    if ($scope.targetDomains != null && $scope.targetDomains.length == 1) {
                        $scope.target.domain = $scope.targetDomains[0].domain;
                    }
                }
                $scope.exportStep = 'DOMAIN_STEP';
                $scope.selectTargetDomain();
                $scope.loadingDomains = false;
            }, function (error) {

                $scope.loadingDomains = false;
            });
        }
    };


    $scope.goNext = function () {
        console.log($scope.gvtLoginForm);
        $scope.error = null;
        if ($scope.exportStep === 'LOGIN_STEP') {
            $scope.login();
        } else if ($scope.exportStep === 'DOMAIN_STEP') {
            $scope.exportToGVT();
        } else if ($scope.exportStep === 'ERROR_STEP') {
            $scope.loadDomains();
        }
    };

    $scope.createNewDomain = function () {
        $scope.newDomain = {name: null, key: null, homeTitle: null};
        $scope.error = null;
        $scope.target.domain = null;
    };




    $scope.cancel = function () {
        $mdDialog.hide();
    };


    $scope.showErrors = function (errorDetails) {
        $scope.exportStep = 'ERROR_STEP';

    };
    $scope.exportToGVT = function () {
        $scope.info.text = null;
        $scope.info.show = false;
        $scope.info.type = 'danger';
        $scope.info['details'] = null;
        var auth = StorageService.getGVTBasicAuth();
        if ($scope.app.url != null && $scope.target.domain != null && auth != null) {
            $scope.loading = true;
            loginTestingToolSvc.exportToGVT($scope.testplan.id, auth, $scope.app.url, $scope.target.domain).then(function (map) {
                $scope.loading = false;
                var response = angular.fromJson(map.data);
                if (response.success === false) {
                    $scope.info.text = "gvtExportFailed";
                    $scope.info['details'] = response.report;
                    $scope.showErrors($scope.info.details);
                    $scope.info.show = true;
                    $scope.info.type = 'danger';
                } else {
                    var token = response.token;
                    $scope.exportStep = 'ERROR_STEP';
                    $scope.info.text = 'gvtRedirectInProgress';
                    $scope.info.show = true;
                    $scope.info.type = 'info';
                    $scope.redirectUrl = $scope.app.url + $rootScope.appInfo.connectUploadTokenContext + "?x=" + encodeURIComponent(token) + "&y=" + encodeURIComponent(auth) + "&d=" + encodeURIComponent($scope.target.domain);
                   // $scope.redirectUrl = $scope.app.url + $rootScope.appInfo.connectUploadTokenContext + "?x=" + encodeURIComponent(token) + "&d=" + encodeURIComponent($scope.target.domain);
                    console.log($scope.redirectUrl);
                    $timeout(function () {
                        $scope.loading = false;
                        $window.open($scope.redirectUrl, "_blank");
                    }, 1000);
                }
            }, function (error) {
                $scope.info.text = "gvtExportFailed";
                $scope.info['details'] = "Sorry, we couldn't push your profiles. Please contact the administrator for more information";
                $scope.info.show = true;
                $scope.info.type = 'danger';
                $scope.loading = false;
                $scope.exportStep = 'ERROR_STEP';
            });
        }
    };


    $scope.exportAsZIPToGVT = function () {
        console.log("Calling ");
        $scope.loading = true;
        $scope.error = null;
        if ($scope.newDomain != null) {
            $scope.newDomain.key = $scope.newDomain.name.replace(/\s+/g, '-').toLowerCase();
            loginTestingToolSvc.createDomain(StorageService.getGVTBasicAuth(), $scope.app.url, $scope.newDomain.key, $scope.newDomain.name, $scope.newDomain.homeTitle).then(function (domain) {
                $scope.loading = false;
                $scope.target.domain = $scope.newDomain.key;

                $scope.exportToGVT();
            }, function (error) {
                console.log("ERROR");
                console.log(error);


                $scope.loading = false;
                if(error.data){
                    $scope.error= error.data.text?error.data.text: error.data;
                }else {
                    $scope.error=error;
                }

            });
        } else if ($scope.app.url != null && $scope.target.domain != null) {
            $scope.exportToGVT();
        }
    };


    if ($scope.targetApps != null) {
        var savedTargetUrl = StorageService.get("EXT_TARGET_URL");
        if (savedTargetUrl && savedTargetUrl != null) {
            for (var targetApp in $scope.targetApps) {
                if (targetApp.url === savedTargetUrl) {
                    $scope.app.url = targetApp.url;
                    break;
                }
            }
        } else if ($scope.targetApps.length == 1) {
            $scope.app.url = $scope.targetApps[0].url;
        }
        $scope.selectTargetUrl();
    }
}])
