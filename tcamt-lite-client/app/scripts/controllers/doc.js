
angular.module('tcl').controller('DocCtrl', function ($scope, $rootScope, $document, $templateCache, Restangular, $http, $filter, $mdDialog) {

    $scope.selected = null;
    $scope.isChanged = false;

    $scope.userGuide = {};
    $scope.userGuide.slides = [];



    $scope.addSlide = function(event) {
        $scope.userGuide.slides.push({
            title: "TITLE-" + ($scope.userGuide.slides.length + 1),
            contents : ""
        });
    };

    $scope.selectSlide = function(slide){
        $scope.selected = slide;
    };

    $scope.recordChanged = function () {
        $scope.isChanged = true;
    };


    $scope.initDoc = function () {
        $rootScope.froalaEditorOptions = {
            placeholderText: '',
            imageUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
            fileUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            fileAllowedTypes: ['application/pdf', 'application/msword', 'application/x-pdf', 'text/plain', 'application/xml','text/xml'],
            charCounterCount: false,
            quickInsertTags: [''],
            immediateAngularModelUpdate:true,
            events: {
                'froalaEditor.initialized': function () {
                },
                'froalaEditor.file.error': function(e, editor, error){
                    $rootScope.msg().text= error.text;
                    $rootScope.msg().type= error.type;
                    $rootScope.msg().show= true;
                },
                'froalaEditor.image.error ':function(e, editor, error){
                    $rootScope.msg().text= error.text;
                    $rootScope.msg().type= error.type;
                    $rootScope.msg().show= true;
                }
            },
            key: 'Rg1Wb2KYd1Td1WIh1CVc2F==',
            imageResize: true,
            imageEditButtons: ['imageReplace', 'imageAlign', 'imageRemove', '|', 'imageLink', 'linkOpen', 'linkEdit', 'linkRemove', '-', 'imageAlt'],
            pastePlain: true
        };
    };


    $scope.isSelected = function () {
        if($scope.selected) {
            return true;
        }

        return false;
    };

});
