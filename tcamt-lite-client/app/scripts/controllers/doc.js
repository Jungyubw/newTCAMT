
angular.module('tcl').controller('DocCtrl', function ($scope, $rootScope, $document, $templateCache, Restangular, $http, Notification, $sce) {
    $scope.selected = null;
    $scope.isChanged = false;
    $scope.editMode = true;

    $scope.addSlide = function(event) {
        $scope.isChanged = true;
        $rootScope.tcamtDocument.userGuide.slides.push({
            title: "TITLE-" + ($rootScope.tcamtDocument.userGuide.slides.length + 1),
            contents : ""
        });
    };

    $scope.deleteSlide = function() {
        if($scope.selected) {
            $scope.isChanged = true;
            var index = $rootScope.tcamtDocument.userGuide.slides.indexOf($scope.selected);
            if (index > -1) {
                $rootScope.tcamtDocument.userGuide.slides.splice(index, 1);
            }
        }
    };

    $scope.changeMode = function() {
        $scope.editMode = !$scope.editMode;
    };

    $scope.save = function() {
        for(var i in $rootScope.tcamtDocument.userGuide.slides){
            $rootScope.tcamtDocument.userGuide.slides[i].position = i;
        }

        $http.post('api/tcamtdocument/save', $rootScope.tcamtDocument).then(function (response) {
            $scope.selected = null;
            $scope.isChanged = false;
            Notification.success({message:"Document saved", delay: 1000});
        }, function (error) {
            $rootScope.saved = false;
            Notification.error({message:"Failed to save", delay:1000});
        });
    };

    $scope.selectSlide = function(slide){
        $scope.selected = slide;
    };

    $scope.recordChanged = function () {
        $scope.isChanged = true;
    };


    $scope.initDoc = function () {
        if(!$rootScope.tcamtDocument) $rootScope.loadDocument();

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

    $scope.isEditMode = function () {
        return $scope.editMode;
    };

    $scope.isSelected = function () {
        if($scope.selected) {
            return true;
        }
        return false;
    };

    $scope.getHtml = function () {
        if($scope.selected){
            return $sce.trustAsHtml($scope.selected.contents);
        }else {
            return null;
        }
    }

});
