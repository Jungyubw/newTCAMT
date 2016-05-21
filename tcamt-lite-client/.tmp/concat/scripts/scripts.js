/*
 *
 * Copyright (c) 2011-2014- Justin Dearing (zippy1981@gmail.com)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
 * This software is not distributed under version 3 or later of the GPL.
 *
 * Version 1.0.2
 *
 */

if (!document) var document = { cookie: '' }; // fix crashes on node

/**
 * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
 * and converts between that format and the standard 24 character representation.
 */
var ObjectId = (function () {
    var increment = Math.floor(Math.random() * (16777216));
    var pid = Math.floor(Math.random() * (65536));
    var machine = Math.floor(Math.random() * (16777216));

    var setMachineCookie = function() {
        var cookieList = document.cookie.split('; ');
        for (var i in cookieList) {
            var cookie = cookieList[i].split('=');
            var cookieMachineId = parseInt(cookie[1], 10);
            if (cookie[0] == 'mongoMachineId' && cookieMachineId && cookieMachineId >= 0 && cookieMachineId <= 16777215) {
                machine = cookieMachineId;
                break;
            }
        }
        document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT;path=/';
    };
    if (typeof (localStorage) != 'undefined') {
        try {
            var mongoMachineId = parseInt(localStorage['mongoMachineId']);
            if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
                machine = Math.floor(localStorage['mongoMachineId']);
            }
            // Just always stick the value in.
            localStorage['mongoMachineId'] = machine;
        } catch (e) {
            setMachineCookie();
        }
    }
    else {
        setMachineCookie();
    }

    function ObjId() {
        if (!(this instanceof ObjectId)) {
            return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
        }

        if (typeof (arguments[0]) == 'object') {
            this.timestamp = arguments[0].timestamp;
            this.machine = arguments[0].machine;
            this.pid = arguments[0].pid;
            this.increment = arguments[0].increment;
        }
        else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
            this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                this.machine = Number('0x' + arguments[0].substr(8, 6)),
                this.pid = Number('0x' + arguments[0].substr(14, 4)),
                this.increment = Number('0x' + arguments[0].substr(18, 6))
        }
        else if (arguments.length == 4 && arguments[0] != null) {
            this.timestamp = arguments[0];
            this.machine = arguments[1];
            this.pid = arguments[2];
            this.increment = arguments[3];
        }
        else {
            this.timestamp = Math.floor(new Date().valueOf() / 1000);
            this.machine = machine;
            this.pid = pid;
            this.increment = increment++;
            if (increment > 0xffffff) {
                increment = 0;
            }
        }
    };
    return ObjId;
})();

ObjectId.prototype.getDate = function () {
    return new Date(this.timestamp * 1000);
};

ObjectId.prototype.toArray = function () {
    var strOid = this.toString();
    var array = [];
    var i;
    for(i = 0; i < 12; i++) {
        array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
    }
    return array;
};

/**
 * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
 */
ObjectId.prototype.toString = function () {
    if (this.timestamp === undefined
        || this.machine === undefined
        || this.pid === undefined
        || this.increment === undefined) {
        return 'Invalid ObjectId';
    }

    var timestamp = this.timestamp.toString(16);
    var machine = this.machine.toString(16);
    var pid = this.pid.toString(16);
    var increment = this.increment.toString(16);
    return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
        '000000'.substr(0, 6 - machine.length) + machine +
        '0000'.substr(0, 4 - pid.length) + pid +
        '000000'.substr(0, 6 - increment.length) + increment;
};

(function() {
"use strict";

angular.module('ngTreetable', [])

    /**
     * @ngdoc service
     */
    .factory('ngTreetableParams', ['$log', function($log) {
        var params = function(baseConfiguration) {
            var self = this;

            /**
             * @ngdoc method
             * @param {<any>} parent A parent node to fetch children of, or null if fetching root nodes.
             */
            this.getNodes = function(parent) {}

            /**
             * @ngdoc method
             * @param {<any>} node A node returned from getNodes
             */
            this.getTemplate = function(node) {}

            /**
             * @ngdoc property
             */
            this.options = {};

            /**
             * @ngdoc method
             */
            this.refresh = function() {}


            if (angular.isObject(baseConfiguration)) {
                angular.forEach(baseConfiguration, function(val, key) {
                    if (['getNodes', 'getTemplate', 'options'].indexOf(key) > -1) {
                        self[key] = val;
                    } else {
                        $log.warn('ngTreetableParams - Ignoring unexpected property "' + key + '".');
                    }
                });
            }

        }
        return params;
    }])

    .controller('TreetableController', ['$scope', '$element', '$compile', '$templateCache', '$q', '$http', function($scope, $element, $compile, $templateCache, $q, $http) {

        var params = $scope.ttParams;
        var table = $element;

        $scope.compileElement = function(node, parentId, parentNode) {
            var tpl = params.getTemplate(node);

            var templatePromise = $http.get(params.getTemplate(node), {cache: $templateCache}).then(function(result) {
                return result.data;
            });

            return templatePromise.then(function(template) {
                var template_scope = $scope.$parent.$new();
                angular.extend(template_scope, {
                    node: node,
                    parentNode: parentNode
                });
                template_scope._ttParentId = parentId;
                return $compile(template)(template_scope).get(0);
            })

        }

        /**
         * Expands the given node.
         * @param parentElement the parent node element, or null for the root
         * @param shouldExpand whether all descendants of `parentElement` should also be expanded
         */
        $scope.addChildren = function(parentElement, shouldExpand) {
            var parentNode = parentElement ? parentElement.scope().node : null;
            var parentId = parentElement ? parentElement.data('ttId') : null;

            if (parentElement) {
                parentElement.scope().loading = true;
            }

            $q.when(params.getNodes(parentNode)).then(function(data) {
                var elementPromises = [];
                angular.forEach(data, function(node) {
                    elementPromises.push($scope.compileElement(node, parentId, parentNode));
                });

                $q.all(elementPromises).then(function(newElements) {
                    var parentTtNode = parentId != null ? table.treetable("node", parentId) : null;

                    $element.treetable('loadBranch', parentTtNode, newElements);

                    if (shouldExpand) {
                        angular.forEach(newElements, function(el) {
                            $scope.addChildren($(el), shouldExpand);
                        });
                    }

                    if (parentElement) {
                        parentElement.scope().loading = false;
                    }
                });

            });
        }

        /**
         * Callback for onNodeExpand to add nodes.
         */
        $scope.onNodeExpand = function() {
            if (this.row.scope().loading) return; // make sure we're not already loading
            table.treetable('unloadBranch', this); // make sure we don't double-load
            $scope.addChildren(this.row, $scope.shouldExpand());
        }

        /**
         * Callback for onNodeCollapse to remove nodes.
         */
        $scope.onNodeCollapse = function() {
            if (this.row.scope().loading) return; // make sure we're not already loading
            table.treetable('unloadBranch', this);
        }

        /**
         * Rebuilds the entire table.
         */
        $scope.refresh = function() {
            var rootNodes = table.data('treetable').nodes;
            while (rootNodes.length > 0) {
                table.treetable('removeNode', rootNodes[0].id);
            }
            $scope.addChildren(null, $scope.shouldExpand());
        }

        // attach to params for convenience
        params.refresh = $scope.refresh;


        /**
         * Build options for the internal treetable library.
         */
        $scope.getOptions = function() {
            var opts = angular.extend({
                expandable: true,
                onNodeExpand: $scope.onNodeExpand,
                onNodeCollapse: $scope.onNodeCollapse
            }, params.options);

            if (params.options) {
                // Inject required event handlers before custom ones
                angular.forEach(['onNodeCollapse', 'onNodeExpand'], function(event) {
                    if (params.options[event]) {
                        opts[event] = function() {
                            $scope[event].apply(this, arguments);
                            params.options[event].apply(this, arguments);
                        }
                    }
                });
            }

            return opts;
        }

        $scope.shouldExpand = function() {
            return $scope.options.initialState === 'expanded';
        }

        $scope.options = $scope.getOptions();
        table.treetable($scope.options);
        $scope.addChildren(null, $scope.shouldExpand());

    }])

    .directive('ttTable', [function() {
        return {
            restrict: 'AC',
            scope: {
                ttParams: '='
            },
            controller: 'TreetableController'
        }
    }])

    .directive('ttNode', [function() {
        var ttNodeCounter = 0;
        return {
            restrict: 'AC',
            scope: {
                isBranch: '=',
                parent: '='
            },
            link: function(scope, element, attrs) {
                var branch = angular.isDefined(scope.isBranch) ? scope.isBranch : true;

                // Look for a parent set by the tt-tree directive if one isn't explicitly set
                var parent = angular.isDefined(scope.parent) ? scope.parent : scope.$parent._ttParentId;

                element.attr('data-tt-id', ttNodeCounter++);
                element.attr('data-tt-branch', branch);
                element.attr('data-tt-parent-id', parent);
            }
        }

    }]);

})();

/**
 * angular-treetable
 * @version v0.3.1 - 2014-12-07
 * @link http://github.com/garrettheel/angular-treetable
 * @author Garrett Heel (garrettheel@gmail.com)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
!function(){"use strict";angular.module("ngTreetable",[]).factory("ngTreetableParams",["$log",function(a){var b=function(b){var c=this;this.getNodes=function(){},this.getTemplate=function(){},this.options={},this.refresh=function(){},angular.isObject(b)&&angular.forEach(b,function(b,d){["getNodes","getTemplate","options"].indexOf(d)>-1?c[d]=b:a.warn('ngTreetableParams - Ignoring unexpected property "'+d+'".')})};return b}]).controller("TreetableController",["$scope","$element","$compile","$templateCache","$q","$http",function(a,b,c,d,e,f){var g=a.ttParams,h=b;a.compileElement=function(b,e,h){var i=(g.getTemplate(b),f.get(g.getTemplate(b),{cache:d}).then(function(a){return a.data}));return i.then(function(d){var f=a.$parent.$new();return angular.extend(f,{node:b,parentNode:h}),f._ttParentId=e,c(d)(f).get(0)})},a.addChildren=function(c,d){var f=c?c.scope().node:null,i=c?c.data("ttId"):null;c&&(c.scope().loading=!0),e.when(g.getNodes(f)).then(function(g){var j=[];angular.forEach(g,function(b){j.push(a.compileElement(b,i,f))}),e.all(j).then(function(e){var f=null!=i?h.treetable("node",i):null;b.treetable("loadBranch",f,e),d&&angular.forEach(e,function(b){a.addChildren($(b),d)}),c&&(c.scope().loading=!1)})})},a.onNodeExpand=function(){this.row.scope().loading||(h.treetable("unloadBranch",this),a.addChildren(this.row,a.shouldExpand()))},a.onNodeCollapse=function(){this.row.scope().loading||h.treetable("unloadBranch",this)},a.refresh=function(){for(var b=h.data("treetable").nodes;b.length>0;)h.treetable("removeNode",b[0].id);a.addChildren(null,a.shouldExpand())},g.refresh=a.refresh,a.getOptions=function(){var b=angular.extend({expandable:!0,onNodeExpand:a.onNodeExpand,onNodeCollapse:a.onNodeCollapse},g.options);return g.options&&angular.forEach(["onNodeCollapse","onNodeExpand"],function(c){g.options[c]&&(b[c]=function(){a[c].apply(this,arguments),g.options[c].apply(this,arguments)})}),b},a.shouldExpand=function(){return"expanded"===a.options.initialState},a.options=a.getOptions(),h.treetable(a.options),a.addChildren(null,a.shouldExpand())}]).directive("ttTable",[function(){return{restrict:"AC",scope:{ttParams:"="},controller:"TreetableController"}}]).directive("ttNode",[function(){var a=0;return{restrict:"AC",scope:{isBranch:"=",parent:"="},link:function(b,c){var d=angular.isDefined(b.isBranch)?b.isBranch:!0,e=angular.isDefined(b.parent)?b.parent:b.$parent._ttParentId;c.attr("data-tt-id",a++),c.attr("data-tt-branch",d),c.attr("data-tt-parent-id",e)}}}])}();
/*
 * jQuery treetable Plugin 3.1.0
 * http://ludo.cubicphuse.nl/jquery-treetable
 *
 * Copyright 2013, Ludo van den Boom
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function() {
    var $, Node, Tree, methods;

    $ = jQuery;

    Node = (function() {
        function Node(row, tree, settings) {
            var parentId;

            this.row = row;
            this.tree = tree;
            this.settings = settings;

            // TODO Ensure id/parentId is always a string (not int)
            this.id = this.row.data(this.settings.nodeIdAttr);

            // TODO Move this to a setParentId function?
            parentId = this.row.data(this.settings.parentIdAttr);
            if (parentId != null && parentId !== "") {
                this.parentId = parentId;
            }

            this.treeCell = $(this.row.children(this.settings.columnElType)[this.settings.column]);
            this.expander = $(this.settings.expanderTemplate);
            this.indenter = $(this.settings.indenterTemplate);
            this.children = [];
            this.initialized = false;
            this.treeCell.prepend(this.indenter);
        }

        Node.prototype.addChild = function(child) {
            return this.children.push(child);
        };

        Node.prototype.ancestors = function() {
            var ancestors, node;
            node = this;
            ancestors = [];
            while (node = node.parentNode()) {
                ancestors.push(node);
            }
            return ancestors;
        };

        Node.prototype.collapse = function() {
            if (this.collapsed()) {
                return this;
            }

            this.row.removeClass("expanded").addClass("collapsed");

            this._hideChildren();
            this.expander.attr("title", this.settings.stringExpand);

            if (this.initialized && this.settings.onNodeCollapse != null) {
                this.settings.onNodeCollapse.apply(this);
            }

            return this;
        };

        Node.prototype.collapsed = function() {
            return this.row.hasClass("collapsed");
        };

        // TODO destroy: remove event handlers, expander, indenter, etc.

        Node.prototype.expand = function() {
            if (this.expanded()) {
                return this;
            }

            this.row.removeClass("collapsed").addClass("expanded");

            if (this.initialized && this.settings.onNodeExpand != null) {
                this.settings.onNodeExpand.apply(this);
            }

            if ($(this.row).is(":visible")) {
                this._showChildren();
            }

            this.expander.attr("title", this.settings.stringCollapse);

            return this;
        };

        Node.prototype.expanded = function() {
            return this.row.hasClass("expanded");
        };

        Node.prototype.hide = function() {
            this._hideChildren();
            this.row.hide();
            return this;
        };

        Node.prototype.isBranchNode = function() {
            if(this.children.length > 0 || this.row.data(this.settings.branchAttr) === true) {
                return true;
            } else {
                return false;
            }
        };

        Node.prototype.updateBranchLeafClass = function(){
            this.row.removeClass('branch');
            this.row.removeClass('leaf');
            this.row.addClass(this.isBranchNode() ? 'branch' : 'leaf');
        };

        Node.prototype.level = function() {
            return this.ancestors().length;
        };

        Node.prototype.parentNode = function() {
            if (this.parentId != null) {
                return this.tree[this.parentId];
            } else {
                return null;
            }
        };

        Node.prototype.removeChild = function(child) {
            var i = $.inArray(child, this.children);
            return this.children.splice(i, 1)
        };

        Node.prototype.render = function() {
            var handler,
                settings = this.settings,
                target;

            if (settings.expandable === true && this.isBranchNode()) {
                handler = function(e) {
                    $(this).parents("table").treetable("node", $(this).parents("tr").data(settings.nodeIdAttr)).toggle();
                    return e.preventDefault();
                };

                this.indenter.html(this.expander);
                target = settings.clickableNodeNames === true ? this.treeCell : this.expander;

                target.off("click.treetable").on("click.treetable", handler);
                target.off("keydown.treetable").on("keydown.treetable", function(e) {
                    if (e.keyCode == 13) {
                        handler.apply(this, [e]);
                    }
                });
            }

            this.indenter[0].style.paddingLeft = "" + (this.level() * settings.indent) + "px";

            return this;
        };

        Node.prototype.reveal = function() {
            if (this.parentId != null) {
                this.parentNode().reveal();
            }
            return this.expand();
        };

        Node.prototype.setParent = function(node) {
            if (this.parentId != null) {
                this.tree[this.parentId].removeChild(this);
            }
            this.parentId = node.id;
            this.row.data(this.settings.parentIdAttr, node.id);
            return node.addChild(this);
        };

        Node.prototype.show = function() {
            if (!this.initialized) {
                this._initialize();
            }
            this.row.show();
            if (this.expanded()) {
                this._showChildren();
            }
            return this;
        };

        Node.prototype.toggle = function() {
            if (this.expanded()) {
                this.collapse();
            } else {
                this.expand();
            }
            return this;
        };

        Node.prototype._hideChildren = function() {
            var child, _i, _len, _ref, _results;
            _ref = this.children;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                _results.push(child.hide());
            }
            return _results;
        };

        Node.prototype._initialize = function() {
            var settings = this.settings;

            this.render();

            if (settings.expandable === true && settings.initialState === "collapsed") {
                this.collapse();
            } else {
                this.expand();
            }

            if (settings.onNodeInitialized != null) {
                settings.onNodeInitialized.apply(this);
            }

            return this.initialized = true;
        };

        Node.prototype._showChildren = function() {
            var child, _i, _len, _ref, _results;
            _ref = this.children;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                _results.push(child.show());
            }
            return _results;
        };

        return Node;
    })();

    Tree = (function() {
        function Tree(table, settings) {
            this.table = table;
            this.settings = settings;
            this.tree = {};

            // Cache the nodes and roots in simple arrays for quick access/iteration
            this.nodes = [];
            this.roots = [];
        }

        Tree.prototype.collapseAll = function() {
            var node, _i, _len, _ref, _results;
            _ref = this.nodes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                _results.push(node.collapse());
            }
            return _results;
        };

        Tree.prototype.expandAll = function() {
            var node, _i, _len, _ref, _results;
            _ref = this.nodes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                _results.push(node.expand());
            }
            return _results;
        };

        Tree.prototype.findLastNode = function (node) {
            if (node.children.length > 0) {
                return this.findLastNode(node.children[node.children.length - 1]);
            } else {
                return node;
            }
        };

        Tree.prototype.loadRows = function(rows) {
            var node, row, i;

            if (rows != null) {
                for (i = 0; i < rows.length; i++) {
                    row = $(rows[i]);

                    if (row.data(this.settings.nodeIdAttr) != null) {
                        node = new Node(row, this.tree, this.settings);
                        this.nodes.push(node);
                        this.tree[node.id] = node;

                        if (node.parentId != null) {
                            this.tree[node.parentId].addChild(node);
                        } else {
                            this.roots.push(node);
                        }
                    }
                }
            }

            for (i = 0; i < this.nodes.length; i++) {
                node = this.nodes[i].updateBranchLeafClass();
            }

            return this;
        };

        Tree.prototype.move = function(node, destination) {
            // Conditions:
            // 1: +node+ should not be inserted as a child of +node+ itself.
            // 2: +destination+ should not be the same as +node+'s current parent (this
            //    prevents +node+ from being moved to the same location where it already
            //    is).
            // 3: +node+ should not be inserted in a location in a branch if this would
            //    result in +node+ being an ancestor of itself.
            var nodeParent = node.parentNode();
            if (node !== destination && destination.id !== node.parentId && $.inArray(node, destination.ancestors()) === -1) {
                node.setParent(destination);
                this._moveRows(node, destination);

                // Re-render parentNode if this is its first child node, and therefore
                // doesn't have the expander yet.
                if (node.parentNode().children.length === 1) {
                    node.parentNode().render();
                }
            }

            if(nodeParent){
                nodeParent.updateBranchLeafClass();
            }
            if(node.parentNode()){
                node.parentNode().updateBranchLeafClass();
            }
            node.updateBranchLeafClass();
            return this;
        };

        Tree.prototype.removeNode = function(node) {
            // Recursively remove all descendants of +node+
            this.unloadBranch(node);

            // Remove node from DOM (<tr>)
            node.row.remove();

            // Clean up Tree object (so Node objects are GC-ed)
            delete this.tree[node.id];
            this.nodes.splice($.inArray(node, this.nodes), 1);
        }

        Tree.prototype.render = function() {
            var root, _i, _len, _ref;
            _ref = this.roots;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                root = _ref[_i];

                // Naming is confusing (show/render). I do not call render on node from
                // here.
                root.show();
            }
            return this;
        };

        Tree.prototype.sortBranch = function(node, sortFun) {
            // First sort internal array of children
            node.children.sort(sortFun);

            // Next render rows in correct order on page
            this._sortChildRows(node);

            return this;
        };

        Tree.prototype.unloadBranch = function(node) {
            var children, i;

            for (i = 0; i < node.children.length; i++) {
                this.removeNode(node.children[i]);
            }

            // Reset node's collection of children
            node.children = [];

            node.updateBranchLeafClass();

            return this;
        };

        Tree.prototype._moveRows = function(node, destination) {
            var children = node.children, i;

            node.row.insertAfter(destination.row);
            node.render();

            // Loop backwards through children to have them end up on UI in correct
            // order (see #112)
            for (i = children.length - 1; i >= 0; i--) {
                this._moveRows(children[i], node);
            }
        };

        // Special _moveRows case, move children to itself to force sorting
        Tree.prototype._sortChildRows = function(parentNode) {
            return this._moveRows(parentNode, parentNode);
        };

        return Tree;
    })();

    // jQuery Plugin
    methods = {
        init: function(options, force) {
            var settings;

            settings = $.extend({
                branchAttr: "ttBranch",
                clickableNodeNames: false,
                column: 0,
                columnElType: "td", // i.e. 'td', 'th' or 'td,th'
                expandable: false,
                expanderTemplate: "<a href='#'>&nbsp;</a>",
                indent: 19,
                indenterTemplate: "<span class='indenter'></span>",
                initialState: "collapsed",
                nodeIdAttr: "ttId", // maps to data-tt-id
                parentIdAttr: "ttParentId", // maps to data-tt-parent-id
                stringExpand: "Expand",
                stringCollapse: "Collapse",

                // Events
                onInitialized: null,
                onNodeCollapse: null,
                onNodeExpand: null,
                onNodeInitialized: null
            }, options);

            return this.each(function() {
                var el = $(this), tree;

                if (force || el.data("treetable") === undefined) {
                    tree = new Tree(this, settings);
                    tree.loadRows(this.rows).render();

                    el.addClass("treetable").data("treetable", tree);

                    if (settings.onInitialized != null) {
                        settings.onInitialized.apply(tree);
                    }
                }

                return el;
            });
        },

        destroy: function() {
            return this.each(function() {
                return $(this).removeData("treetable").removeClass("treetable");
            });
        },

        collapseAll: function() {
            this.data("treetable").collapseAll();
            return this;
        },

        collapseNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                node.collapse();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        expandAll: function() {
            this.data("treetable").expandAll();
            return this;
        },

        expandNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                if (!node.initialized) {
                    node._initialize();
                }

                node.expand();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        loadBranch: function(node, rows) {
            var settings = this.data("treetable").settings,
                tree = this.data("treetable").tree;

            // TODO Switch to $.parseHTML
            rows = $(rows);

            if (node == null) { // Inserting new root nodes
                this.append(rows);
            } else {
                var lastNode = this.data("treetable").findLastNode(node);
                rows.insertAfter(lastNode.row);
            }

            this.data("treetable").loadRows(rows);

            // Make sure nodes are properly initialized
            rows.filter("tr").each(function() {
                tree[$(this).data(settings.nodeIdAttr)].show();
            });

            if (node != null) {
                // Re-render parent to ensure expander icon is shown (#79)
                node.render().expand();
            }

            return this;
        },

        move: function(nodeId, destinationId) {
            var destination, node;

            node = this.data("treetable").tree[nodeId];
            destination = this.data("treetable").tree[destinationId];
            this.data("treetable").move(node, destination);

            return this;
        },

        node: function(id) {
            return this.data("treetable").tree[id];
        },

        removeNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                this.data("treetable").removeNode(node);
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        reveal: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                node.reveal();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        sortBranch: function(node, columnOrFunction) {
            var settings = this.data("treetable").settings,
                prepValue,
                sortFun;

            columnOrFunction = columnOrFunction || settings.column;
            sortFun = columnOrFunction;

            if ($.isNumeric(columnOrFunction)) {
                sortFun = function(a, b) {
                    var extractValue, valA, valB;

                    extractValue = function(node) {
                        var val = node.row.find("td:eq(" + columnOrFunction + ")").text();
                        // Ignore trailing/leading whitespace and use uppercase values for
                        // case insensitive ordering
                        return $.trim(val).toUpperCase();
                    }

                    valA = extractValue(a);
                    valB = extractValue(b);

                    if (valA < valB) return -1;
                    if (valA > valB) return 1;
                    return 0;
                };
            }

            this.data("treetable").sortBranch(node, sortFun);
            return this;
        },

        unloadBranch: function(node) {
            this.data("treetable").unloadBranch(node);
            return this;
        }
    };

    $.fn.treetable = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            return $.error("Method " + method + " does not exist on jQuery.treetable");
        }
    };

    // Expose classes to world
    this.TreeTable || (this.TreeTable = {});
    this.TreeTable.Node = Node;
    this.TreeTable.Tree = Tree;
}).call(this);
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.FE.PLUGINS.align=function(b){function c(c){b.selection.save(),b.html.wrap(!0,!0,!0),b.selection.restore();for(var d=b.selection.blocks(),e=0;e<d.length;e++)a(d[e]).css("text-align",c).removeClass("fr-temp-div"),""===a(d[e]).attr("class")&&a(d[e]).removeAttr("class");b.selection.save(),b.html.unwrap(),b.selection.restore()}function d(c){var d=b.selection.blocks();if(d.length){var e=b.helpers.getAlignment(a(d[0]));c.find("> *:first").replaceWith(b.icon.create("align-"+e))}}function e(c,d){var e=b.selection.blocks();if(e.length){var f=b.helpers.getAlignment(a(e[0]));d.find('a.fr-command[data-param1="'+f+'"]').addClass("fr-active")}}return{apply:c,refresh:d,refreshOnShow:e}},a.FE.DefineIcon("align",{NAME:"align-left"}),a.FE.DefineIcon("align-left",{NAME:"align-left"}),a.FE.DefineIcon("align-right",{NAME:"align-right"}),a.FE.DefineIcon("align-center",{NAME:"align-center"}),a.FE.DefineIcon("align-justify",{NAME:"align-justify"}),a.FE.RegisterCommand("align",{type:"dropdown",title:"Align",options:{left:"Align Left",center:"Align Center",right:"Align Right",justify:"Align Justify"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.align.options;for(var d in c)b+='<li><a class="fr-command fr-title" data-cmd="align" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.icon.create("align-"+d)+"</a></li>";return b+="</ul>"},callback:function(a,b){this.align.apply(b)},refresh:function(a){this.align.refresh(a)},refreshOnShow:function(a,b){this.align.refreshOnShow(a,b)},plugin:"align"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{charCounterMax:-1,charCounterCount:!0}),a.FE.PLUGINS.charCounter=function(b){function c(){return b.$el.text().length}function d(a){if(b.opts.charCounterMax<0)return!0;if(c()<b.opts.charCounterMax)return!0;var d=a.which;return!b.keys.ctrlKey(a)&&b.keys.isCharacter(d)?(a.preventDefault(),a.stopPropagation(),b.events.trigger("charCounter.exceeded"),!1):!0}function e(d){if(b.opts.charCounterMax<0)return d;var e=a("<div>").html(d).text().length;return e+c()<=b.opts.charCounterMax?d:(b.events.trigger("charCounter.exceeded"),"")}function f(){if(b.opts.charCounterCount){var a=c()+(b.opts.charCounterMax>0?"/"+b.opts.charCounterMax:"");h.text(a),b.opts.toolbarBottom&&h.css("margin-bottom",b.$tb.outerHeight(!0));var d=b.$wp.get(0).offsetWidth-b.$wp.get(0).clientWidth;d>=0&&("rtl"==b.opts.direction?h.css("margin-left",d):h.css("margin-right",d))}}function g(){return b.$wp&&b.opts.charCounterCount?(h=a('<span class="fr-counter"></span>'),h.css("bottom",b.$wp.css("border-bottom-width")),b.$box.append(h),b.events.on("keydown",d,!0),b.events.on("paste.afterCleanup",e),b.events.on("keyup",f),b.events.on("contentChanged",f),b.events.on("charCounter.update",f),f(),void b.events.on("destroy",function(){a(b.o_win).off("resize.char"+b.id),h.removeData().remove()})):!1}var h;return{_init:g,count:c}}});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{"colors.picker":"[_BUTTONS_][_TEXT_COLORS_][_BACKGROUND_COLORS_]"}),a.extend(a.FE.DEFAULTS,{colorsText:["#61BD6D","#1ABC9C","#54ACD2","#2C82C9","#9365B8","#475577","#CCCCCC","#41A85F","#00A885","#3D8EB9","#2969B0","#553982","#28324E","#000000","#F7DA64","#FBA026","#EB6B56","#E25041","#A38F84","#EFEFEF","#FFFFFF","#FAC51C","#F37934","#D14841","#B8312F","#7C706B","#D1D5D8","REMOVE"],colorsBackground:["#61BD6D","#1ABC9C","#54ACD2","#2C82C9","#9365B8","#475577","#CCCCCC","#41A85F","#00A885","#3D8EB9","#2969B0","#553982","#28324E","#000000","#F7DA64","#FBA026","#EB6B56","#E25041","#A38F84","#EFEFEF","#FFFFFF","#FAC51C","#F37934","#D14841","#B8312F","#7C706B","#D1D5D8","REMOVE"],colorsStep:7,colorsDefaultTab:"text",colorsButtons:["colorsBack","|","-"]}),a.FE.PLUGINS.colors=function(b){function c(){var a=b.$tb.find('.fr-command[data-cmd="color"]'),c=b.popups.get("colors.picker");if(c||(c=e()),!c.hasClass("fr-active")){b.popups.setContainer("colors.picker",b.$tb),h(c.find(".fr-selected-tab").attr("data-param1"));var d=a.offset().left+a.outerWidth()/2,f=a.offset().top+(b.opts.toolbarBottom?10:a.outerHeight()-10);b.popups.show("colors.picker",d,f,a.outerHeight())}}function d(){b.popups.hide("colors.picker")}function e(){var a='<div class="fr-buttons fr-colors-buttons">';b.opts.toolbarInline&&b.opts.colorsButtons.length>0&&(a+=b.button.buildList(b.opts.colorsButtons)),a+=f()+"</div>";var c={buttons:a,text_colors:g("text"),background_colors:g("background")},d=b.popups.create("colors.picker",c);return d}function f(){var a='<div class="fr-colors-tabs">';return a+='<span class="fr-colors-tab '+("background"==b.opts.colorsDefaultTab?"":"fr-selected-tab ")+'fr-command" data-param1="text" data-cmd="colorChangeSet" title="'+b.language.translate("Text")+'">'+b.language.translate("Text")+"</span>",a+='<span class="fr-colors-tab '+("background"==b.opts.colorsDefaultTab?"fr-selected-tab ":"")+'fr-command" data-param1="background" data-cmd="colorChangeSet" title="'+b.language.translate("Background")+'">'+b.language.translate("Background")+"</span>",a+"</div>"}function g(a){for(var c="text"==a?b.opts.colorsText:b.opts.colorsBackground,d='<div class="fr-color-set fr-'+a+"-color"+(b.opts.colorsDefaultTab==a||"text"!=b.opts.colorsDefaultTab&&"background"!=b.opts.colorsDefaultTab&&"text"==a?" fr-selected-set":"")+'">',e=0;e<c.length;e++)0!==e&&e%b.opts.colorsStep===0&&(d+="<br>"),d+="REMOVE"!=c[e]?'<span class="fr-command fr-select-color" style="background: '+c[e]+';" data-cmd="'+a+'Color" data-param1="'+c[e]+'"></span>':'<span class="fr-command fr-select-color" data-cmd="'+a+'Color" data-param1="REMOVE" title="'+b.language.translate("Clear Formatting")+'"><i class="fa fa-eraser"></i></span>';return d+"</div>"}function h(c){var d,e=b.popups.get("colors.picker"),f=a(b.selection.element());for(d="background"==c?"background-color":"color",e.find(".fr-"+c+"-color .fr-select-color").removeClass("fr-selected-color");f.get(0)!=b.$el.get(0);){if("transparent"!=f.css(d)&&"rgba(0, 0, 0, 0)"!=f.css(d)){e.find(".fr-"+c+'-color .fr-select-color[data-param1="'+b.helpers.RGBToHex(f.css(d))+'"]').addClass("fr-selected-color");break}f=f.parent()}}function i(a,b){a.hasClass("fr-selected-tab")||(a.siblings().removeClass("fr-selected-tab"),a.addClass("fr-selected-tab"),a.parents(".fr-popup").find(".fr-color-set").removeClass("fr-selected-set"),a.parents(".fr-popup").find(".fr-color-set.fr-"+b+"-color").addClass("fr-selected-set"),h(b))}function j(c){"REMOVE"!=c?b.commands.applyProperty("background-color",b.helpers.HEXtoRGB(c)):(b.commands.applyProperty("background-color","#123456"),b.selection.save(),b.$el.find("span").each(function(c,d){var e=a(d),f=e.css("background-color");("#123456"===f||"#123456"===b.helpers.RGBToHex(f))&&e.replaceWith(e.html())}),b.selection.restore()),d()}function k(c){"REMOVE"!=c?b.commands.applyProperty("color",b.helpers.HEXtoRGB(c)):(b.commands.applyProperty("color","#123456"),b.selection.save(),b.$el.find("span").each(function(c,d){var e=a(d),f=e.css("color");("#123456"===f||"#123456"===b.helpers.RGBToHex(f))&&e.replaceWith(e.html())}),b.selection.restore()),d()}function l(){b.popups.hide("colors.picker"),b.toolbar.showInline()}return{showColorsPopup:c,hideColorsPopup:d,changeSet:i,background:j,text:k,back:l}},a.FE.DefineIcon("colors",{NAME:"tint"}),a.FE.RegisterCommand("color",{title:"Colors",undo:!1,focus:!0,refreshOnCallback:!1,popup:!0,callback:function(){this.popups.isVisible("colors.picker")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("colors.picker")):this.colors.showColorsPopup()},plugin:"colors"}),a.FE.RegisterCommand("textColor",{undo:!0,callback:function(a,b){this.colors.text(b)}}),a.FE.RegisterCommand("backgroundColor",{undo:!0,callback:function(a,b){this.colors.background(b)}}),a.FE.RegisterCommand("colorChangeSet",{undo:!1,focus:!1,callback:function(a,b){var c=this.popups.get("colors.picker").find('.fr-command[data-cmd="'+a+'"][data-param1="'+b+'"]');this.colors.changeSet(c,b)}}),a.FE.DefineIcon("colorsBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("colorsBack",{title:"Back",undo:!1,focus:!1,back:!0,refreshAfterCallback:!1,callback:function(){this.colors.back()}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{dragInline:!0}),a.FE.PLUGINS.draggable=function(b){function c(c){return a(c.target).hasClass("fr-draggable")?(a(c.target).addClass("fr-dragging"),b.opts.dragInline?b.$el.attr("contenteditable",!0):b.$el.attr("contenteditable",!1),b.opts.toolbarInline&&b.toolbar.hide(),b.undo.canDo()||b.undo.saveStep(),b.browser.msie||b.browser.edge||b.selection.clear(),void c.originalEvent.dataTransfer.setData("text","Froala")):(c.preventDefault(),!1)}function d(a){return!(a&&("HTML"==a.tagName||"BODY"==a.tagName||b.node.isElement(a)))}function e(a,c,d){b.opts.iframe&&(a+=b.$iframe.offset().top,c+=b.$iframe.offset().left),l.offset().top!=a&&l.css("top",a),l.offset().left!=c&&l.css("left",c),l.width()!=d&&l.css("width",d)}function f(c){var f=b.doc.elementFromPoint(c.originalEvent.pageX-b.win.pageXOffset,c.originalEvent.pageY-b.win.pageYOffset);if(!d(f)){for(var g=0,h=f;!d(h)&&h==f&&c.originalEvent.pageY-b.win.pageYOffset-g>0;)g++,h=b.doc.elementFromPoint(c.originalEvent.pageX-b.win.pageXOffset,c.originalEvent.pageY-b.win.pageYOffset-g);(!d(h)||0===b.$el.find(h).length&&h!=l.get(0))&&(h=null);for(var i=0,j=f;!d(j)&&j==f&&c.originalEvent.pageY-b.win.pageYOffset+i<a(b.doc).height();)i++,j=b.doc.elementFromPoint(c.originalEvent.pageX-b.win.pageXOffset,c.originalEvent.pageY-b.win.pageYOffset+i);(!d(j)||0===b.$el.find(j).length&&j!=l.get(0))&&(j=null),f=null==j&&h?h:j&&null==h?j:j&&h?i>g?h:j:null}if(a(f).hasClass("fr-drag-helper"))return!1;if(f&&!b.node.isBlock(f)&&(f=b.node.blockParent(f)),f&&["TD","TH","TR","THEAD","TBODY"].indexOf(f.tagName)>=0&&(f=a(f).parents("table").get(0)),f&&["LI"].indexOf(f.tagName)>=0&&(f=a(f).parents("UL, OL").get(0)),f&&!a(f).hasClass("fr-drag-helper")){l||(a.FE.$draggable_helper||(a.FE.$draggable_helper=a('<div class="fr-drag-helper"></div>')),l=a.FE.$draggable_helper,b.events.on("shared.destroy",function(){l.html("").removeData().remove()},!0));var k,m=c.originalEvent.pageY;k=m<a(f).offset().top+a(f).outerHeight()/2?!0:!1;var n=a(f),o=0;k||0!==n.next().length?(k||(n=n.next()),"before"==l.data("fr-position")&&n.is(l.data("fr-tag"))||(n.prev().length>0&&(o=parseFloat(n.prev().css("margin-bottom"))||0),o=Math.max(o,parseFloat(n.css("margin-top"))||0),e(n.offset().top-o/2-b.$box.offset().top,n.offset().left-b.win.pageXOffset-b.$box.offset().left,n.width()),l.data("fr-position","before"))):"after"==l.data("fr-position")&&n.is(l.data("fr-tag"))||(o=parseFloat(n.css("margin-bottom"))||0,e(n.offset().top+a(f).height()+o/2-b.$box.offset().top,n.offset().left-b.win.pageXOffset-b.$box.offset().left,n.width()),l.data("fr-position","after")),l.data("fr-tag",n),l.addClass("fr-visible"),l.appendTo(b.$box)}else l&&b.$box.find(l).length>0&&l.removeClass("fr-visible")}function g(a){a.originalEvent.dataTransfer.dropEffect="move",b.opts.dragInline||(a.preventDefault(),f(a))}function h(a){a.originalEvent.dataTransfer.dropEffect="move",b.opts.dragInline||a.preventDefault()}function i(a){b.$el.attr("contenteditable",!0);var c=b.$el.find(".fr-dragging");l&&l.hasClass("fr-visible")&&b.$box.find(l).length?j(a):c.length&&(a.preventDefault(),a.stopPropagation(),l&&!l.hasClass("fr-visible")&&c.removeClass("fr-dragging"))}function j(c){for(var d,e,f=0;f<a.FE.INSTANCES.length;f++)if(d=a.FE.INSTANCES[f].$el.find(".fr-dragging"),d.length){e=a.FE.INSTANCES[f];break}if(d.length){if(c.preventDefault(),c.stopPropagation(),l&&l.hasClass("fr-visible")&&b.$box.find(l).length)l.data("fr-tag")[l.data("fr-position")]('<span class="fr-marker"></span>'),l.removeClass("fr-visible");else{var g=b.markers.insertAtPoint(c.originalEvent);if(g===!1)return!1}if(b.popups.hideAll(),e==b||b.undo.canDo()||b.undo.saveStep(),b.core.isEmpty())b.$el.html(d);else{var h=b.$el.find(".fr-marker");h.replaceWith(d),d.after(a.FE.MARKERS),b.selection.restore()}return d.removeClass("fr-dragging"),b.$el.find(b.html.emptyBlockTagsQuery()).remove(),b.html.wrap(),b.undo.saveStep(),e!=b&&(e.popups.hideAll(),e.$el.find(b.html.emptyBlockTagsQuery()).remove(),e.html.wrap(),e.undo.saveStep(),e.events.trigger("element.dropped")),b.opts.iframe&&b.size.syncIframe(),b.events.trigger("element.dropped",[d]),!1}}function k(){b.opts.enter==a.FE.ENTER_BR&&(b.opts.dragInline=!0),b.events.on("dragstart",c,!0),b.events.on("dragover",g,!0),b.events.on("dragenter",h,!0),b.events.on("document.dragend",i,!0),b.events.on("document.drop",i,!0),b.events.on("drop",j,!0),b.events.on("html.get",function(a){return a=a.replace(/<(div)((?:[\w\W]*?))class="([\w\W]*?)fr-drag-helper([\w\W]*?)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/(div)>/g,"")})}var l;return{_init:k}}});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{emoticons:"[_BUTTONS_][_EMOTICONS_]"}),a.extend(a.FE.DEFAULTS,{emoticonsStep:8,emoticonsSet:[{code:"1f600",desc:"Grinning face"},{code:"1f601",desc:"Grinning face with smiling eyes"},{code:"1f602",desc:"Face with tears of joy"},{code:"1f603",desc:"Smiling face with open mouth"},{code:"1f604",desc:"Smiling face with open mouth and smiling eyes"},{code:"1f605",desc:"Smiling face with open mouth and cold sweat"},{code:"1f606",desc:"Smiling face with open mouth and tightly-closed eyes"},{code:"1f607",desc:"Smiling face with halo"},{code:"1f608",desc:"Smiling face with horns"},{code:"1f609",desc:"Winking face"},{code:"1f60a",desc:"Smiling face with smiling eyes"},{code:"1f60b",desc:"Face savoring delicious food"},{code:"1f60c",desc:"Relieved face"},{code:"1f60d",desc:"Smiling face with heart-shaped eyes"},{code:"1f60e",desc:"Smiling face with sunglasses"},{code:"1f60f",desc:"Smirking face"},{code:"1f610",desc:"Neutral face"},{code:"1f611",desc:"Expressionless face"},{code:"1f612",desc:"Unamused face"},{code:"1f613",desc:"Face with cold sweat"},{code:"1f614",desc:"Pensive face"},{code:"1f615",desc:"Confused face"},{code:"1f616",desc:"Confounded face"},{code:"1f617",desc:"Kissing face"},{code:"1f618",desc:"Face throwing a kiss"},{code:"1f619",desc:"Kissing face with smiling eyes"},{code:"1f61a",desc:"Kissing face with closed eyes"},{code:"1f61b",desc:"Face with stuck out tongue"},{code:"1f61c",desc:"Face with stuck out tongue and winking eye"},{code:"1f61d",desc:"Face with stuck out tongue and tightly-closed eyes"},{code:"1f61e",desc:"Disappointed face"},{code:"1f61f",desc:"Worried face"},{code:"1f620",desc:"Angry face"},{code:"1f621",desc:"Pouting face"},{code:"1f622",desc:"Crying face"},{code:"1f623",desc:"Persevering face"},{code:"1f624",desc:"Face with look of triumph"},{code:"1f625",desc:"Disappointed but relieved face"},{code:"1f626",desc:"Frowning face with open mouth"},{code:"1f627",desc:"Anguished face"},{code:"1f628",desc:"Fearful face"},{code:"1f629",desc:"Weary face"},{code:"1f62a",desc:"Sleepy face"},{code:"1f62b",desc:"Tired face"},{code:"1f62c",desc:"Grimacing face"},{code:"1f62d",desc:"Loudly crying face"},{code:"1f62e",desc:"Face with open mouth"},{code:"1f62f",desc:"Hushed face"},{code:"1f630",desc:"Face with open mouth and cold sweat"},{code:"1f631",desc:"Face screaming in fear"},{code:"1f632",desc:"Astonished face"},{code:"1f633",desc:"Flushed face"},{code:"1f634",desc:"Sleeping face"},{code:"1f635",desc:"Dizzy face"},{code:"1f636",desc:"Face without mouth"},{code:"1f637",desc:"Face with medical mask"}],emoticonsButtons:["emoticonsBack","|"],emoticonsUseImage:!0}),a.FE.PLUGINS.emoticons=function(b){function c(){var a=b.$tb.find('.fr-command[data-cmd="emoticons"]'),c=b.popups.get("emoticons");if(c||(c=e()),!c.hasClass("fr-active")){b.popups.refresh("emoticons"),b.popups.setContainer("emoticons",b.$tb);var d=a.offset().left+a.outerWidth()/2,f=a.offset().top+(b.opts.toolbarBottom?10:a.outerHeight()-10);b.popups.show("emoticons",d,f,a.outerHeight())}}function d(){b.popups.hide("emoticons")}function e(){var a="";b.opts.toolbarInline&&b.opts.emoticonsButtons.length>0&&(a='<div class="fr-buttons fr-emoticons-buttons">'+b.button.buildList(b.opts.emoticonsButtons)+"</div>");var c={buttons:a,emoticons:f()},d=b.popups.create("emoticons",c);return b.tooltip.bind(d,".fr-emoticon"),d}function f(){for(var a='<div style="text-align: center">',c=0;c<b.opts.emoticonsSet.length;c++)0!==c&&c%b.opts.emoticonsStep===0&&(a+="<br>"),a+='<span class="fr-command fr-emoticon" data-cmd="insertEmoticon" title="'+b.language.translate(b.opts.emoticonsSet[c].desc)+'" data-param1="'+b.opts.emoticonsSet[c].code+'">'+(b.opts.emoticonsUseImage?'<img src="https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/'+b.opts.emoticonsSet[c].code+'.svg"/>':"&#x"+b.opts.emoticonsSet[c].code+";")+"</span>";return b.opts.emoticonsUseImage&&(a+='<p style="font-size: 12px; text-align: center; padding: 0 5px;">Emoji free by <a href="http://emojione.com/" target="_blank" rel="nofollow">Emoji One</a></p>'),a+="</div>"}function g(c,d){b.html.insert('<span class="fr-emoticon'+(d?" fr-emoticon-img":"")+'"'+(d?' style="background: url('+d+')"':"")+">"+(d?"&nbsp;":c)+"</span>"+a.FE.MARKERS,!0)}function h(){b.popups.hide("emoticons"),b.toolbar.showInline()}function i(){b.events.on("html.get",function(c){for(var d=0;d<b.opts.emoticonsSet.length;d++){var e=b.opts.emoticonsSet[d],f=a("<div>").html(e.code).text();c=c.split(f).join(e.code)}return c});var c=function(){if(!b.selection.isCollapsed())return!1;var c=b.selection.element(),d=b.selection.endElement();if(a(c).hasClass("fr-emoticon"))return c;if(a(d).hasClass("fr-emoticon"))return d;var e=b.selection.ranges(0),f=e.startContainer;if(f.nodeType==Node.ELEMENT_NODE&&f.childNodes.length>0&&e.startOffset>0){var g=f.childNodes[e.startOffset-1];if(a(g).hasClass("fr-emoticon"))return g}return!1};b.events.on("keydown",function(d){if(b.keys.isCharacter(d.which)&&b.selection.inEditor()){var e=b.selection.ranges(0),f=c();f&&(0===e.startOffset?a(f).before(a.FE.MARKERS+a.FE.INVISIBLE_SPACE):a(f).after(a.FE.INVISIBLE_SPACE+a.FE.MARKERS),b.selection.restore())}}),b.events.on("keyup",function(){for(var c=b.$el.get(0).querySelectorAll(".fr-emoticon"),d=0;d<c.length;d++)"undefined"!=typeof c[d].textContent&&0===c[d].textContent.replace(/\u200B/gi,"").length&&a(c[d]).remove()})}return{_init:i,insert:g,showEmoticonsPopup:c,hideEmoticonsPopup:d,back:h}},a.FE.DefineIcon("emoticons",{NAME:"smile-o"}),a.FE.RegisterCommand("emoticons",{title:"Emoticons",undo:!1,focus:!0,refreshOnCallback:!1,popup:!0,callback:function(){this.popups.isVisible("emoticons")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("emoticons")):this.emoticons.showEmoticonsPopup()},plugin:"emoticons"}),a.FE.RegisterCommand("insertEmoticon",{callback:function(a,b){this.emoticons.insert("&#x"+b+";",this.opts.emoticonsUseImage?"https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/"+b+".svg":null),this.emoticons.hideEmoticonsPopup()}}),a.FE.DefineIcon("emoticonsBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("emoticonsBack",{title:"Back",undo:!1,focus:!1,back:!0,refreshAfterCallback:!1,callback:function(){this.emoticons.back()}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{entities:"&amp;&lt;&gt;&quot;&apos;&iexcl;&cent;&pound;&curren;&yen;&brvbar;&sect;&uml;&copy;&ordf;&laquo;&not;&shy;&reg;&macr;&deg;&plusmn;&sup2;&sup3;&acute;&micro;&para;&middot;&cedil;&sup1;&ordm;&raquo;&frac14;&frac12;&frac34;&iquest;&Agrave;&Aacute;&Acirc;&Atilde;&Auml;&Aring;&AElig;&Ccedil;&Egrave;&Eacute;&Ecirc;&Euml;&Igrave;&Iacute;&Icirc;&Iuml;&ETH;&Ntilde;&Ograve;&Oacute;&Ocirc;&Otilde;&Ouml;&times;&Oslash;&Ugrave;&Uacute;&Ucirc;&Uuml;&Yacute;&THORN;&szlig;&agrave;&aacute;&acirc;&atilde;&auml;&aring;&aelig;&ccedil;&egrave;&eacute;&ecirc;&euml;&igrave;&iacute;&icirc;&iuml;&eth;&ntilde;&ograve;&oacute;&ocirc;&otilde;&ouml;&divide;&oslash;&ugrave;&uacute;&ucirc;&uuml;&yacute;&thorn;&yuml;&OElig;&oelig;&Scaron;&scaron;&Yuml;&fnof;&circ;&tilde;&Alpha;&Beta;&Gamma;&Delta;&Epsilon;&Zeta;&Eta;&Theta;&Iota;&Kappa;&Lambda;&Mu;&Nu;&Xi;&Omicron;&Pi;&Rho;&Sigma;&Tau;&Upsilon;&Phi;&Chi;&Psi;&Omega;&alpha;&beta;&gamma;&delta;&epsilon;&zeta;&eta;&theta;&iota;&kappa;&lambda;&mu;&nu;&xi;&omicron;&pi;&rho;&sigmaf;&sigma;&tau;&upsilon;&phi;&chi;&psi;&omega;&thetasym;&upsih;&piv;&ensp;&emsp;&thinsp;&zwnj;&zwj;&lrm;&rlm;&ndash;&mdash;&lsquo;&rsquo;&sbquo;&ldquo;&rdquo;&bdquo;&dagger;&Dagger;&bull;&hellip;&permil;&prime;&Prime;&lsaquo;&rsaquo;&oline;&frasl;&euro;&image;&weierp;&real;&trade;&alefsym;&larr;&uarr;&rarr;&darr;&harr;&crarr;&lArr;&uArr;&rArr;&dArr;&hArr;&forall;&part;&exist;&empty;&nabla;&isin;&notin;&ni;&prod;&sum;&minus;&lowast;&radic;&prop;&infin;&ang;&and;&or;&cap;&cup;&int;&there4;&sim;&cong;&asymp;&ne;&equiv;&le;&ge;&sub;&sup;&nsub;&sube;&supe;&oplus;&otimes;&perp;&sdot;&lceil;&rceil;&lfloor;&rfloor;&lang;&rang;&loz;&spades;&clubs;&hearts;&diams;"}),a.FE.PLUGINS.entities=function(b){function c(a){for(var d=b.node.contents(a),e=0;e<d.length;e++)if(d[e].nodeType==Node.TEXT_NODE){var h=d[e].textContent;if(h.match(f)){for(var i="",j=0;j<h.length;j++)i+=g[h[j]]?g[h[j]]:h[j];d[e].textContent=i}}else c(d[e])}function d(a){return 0===a.length?"":b.clean.exec(a,c)}function e(){b.opts.htmlSimpleAmpersand&&(b.opts.entities=b.opts.entities.replace("&amp;",""));var c=a("<div>").html(b.opts.entities).text(),e=b.opts.entities.split(";");g={},f="";for(var h=0;h<c.length;h++){var i=c.charAt(h);g[i]=e[h]+";",f+="\\"+i+(h<c.length-1?"|":"")}f=new RegExp("("+f+")","g"),b.events.on("html.get",d,!0)}var f,g;return{_init:e}}});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{"file.insert":"[_BUTTONS_][_UPLOAD_LAYER_][_PROGRESS_BAR_]"}),a.extend(a.FE.DEFAULTS,{fileUploadURL:"http://i.froala.com/upload",fileUploadParam:"file",fileUploadParams:{},fileUploadToS3:!1,fileUploadMethod:"POST",fileMaxSize:10485760,fileAllowedTypes:["*"],fileInsertButtons:["fileBack","|"],fileUseSelectedText:!1}),a.FE.PLUGINS.file=function(b){function c(){var a=b.$tb.find('.fr-command[data-cmd="insertFile"]'),c=b.popups.get("file.insert");if(c||(c=r()),e(),!c.hasClass("fr-active")){b.popups.refresh("file.insert"),b.popups.setContainer("file.insert",b.$tb);var d=a.offset().left+a.outerWidth()/2,f=a.offset().top+(b.opts.toolbarBottom?0:a.outerHeight());b.popups.show("file.insert",d,f,a.outerHeight())}}function d(){var a=b.popups.get("file.insert");a&&(a.find(".fr-layer.fr-active").removeClass("fr-active").addClass("fr-pactive"),a.find(".fr-file-progress-bar-layer").addClass("fr-active"),a.find(".fr-buttons").hide(),f("Uploading",0))}function e(a){var c=b.popups.get("file.insert");c&&(c.find(".fr-layer.fr-pactive").addClass("fr-active").removeClass("fr-pactive"),c.find(".fr-file-progress-bar-layer").removeClass("fr-active"),c.find(".fr-buttons").show(),a&&b.popups.show("file.insert",null,null))}function f(a,c){var d=b.popups.get("file.insert");if(d){var e=d.find(".fr-file-progress-bar-layer");e.find("h3").text(a+(c?" "+c+"%":"")),e.removeClass("fr-error"),c?(e.find("div").removeClass("fr-indeterminate"),e.find("div > span").css("width",c+"%")):e.find("div").addClass("fr-indeterminate")}}function g(a){var c=b.popups.get("file.insert"),d=c.find(".fr-file-progress-bar-layer");d.addClass("fr-error"),d.find("h3").text(a)}function h(a,c,d){b.edit.on(),b.events.focus(!0),b.selection.restore(),b.html.insert('<a href="'+a+'" id="fr-inserted-file" class="fr-file">'+(c||b.selection.text())+"</a>");var e=b.$el.find("#fr-inserted-file");e.removeAttr("id"),b.popups.hide("file.insert"),b.undo.saveStep(),b.events.trigger("file.inserted",[e,d])}function i(c){try{if(b.events.trigger("file.uploaded",[c],!0)===!1)return b.edit.on(),!1;var d=a.parseJSON(c);return d.link?d:(n(y,c),!1)}catch(e){return n(A,c),!1}}function j(c){try{var d=a(c).find("Location").text(),e=a(c).find("Key").text();return b.events.trigger("file.uploadedToS3",[d,e,c],!0)===!1?(b.edit.on(),!1):d}catch(f){return n(A,c),!1}}function k(a){var c=this.status,d=this.response,e=this.responseXML,f=this.responseText;try{if(b.opts.fileUploadToS3)if(201==c){var g=j(e);g&&h(g,a,d||e)}else n(A,d||e);else if(c>=200&&300>c){var k=i(f);k&&h(k.link,a,d||f)}else n(z,d||f)}catch(l){n(A,d||f)}}function l(){n(A,this.response||this.responseText||this.responseXML)}function m(a){if(a.lengthComputable){var b=a.loaded/a.total*100|0;f("Uploading",b)}}function n(a,c){b.edit.on(),g(b.language.translate("Something went wrong. Please try again.")),b.events.trigger("file.error",[{code:a,message:E[a]},c])}function o(a){if(b.events.trigger("file.beforeUpload",[a])===!1)return!1;if("undefined"!=typeof a&&a.length>0){var c=a[0];if(c.size>b.opts.fileMaxSize)return n(B),!1;if(b.opts.fileAllowedTypes.indexOf("*")<0&&b.opts.fileAllowedTypes.indexOf(c.type.replace(/file\//g,""))<0)return n(C),!1;var e;if(b.drag_support.formdata&&(e=b.drag_support.formdata?new FormData:null),e){var f;if(b.opts.fileUploadToS3!==!1){e.append("key",b.opts.fileUploadToS3.keyStart+(new Date).getTime()+"-"+(c.name||"untitled")),e.append("success_action_status","201"),e.append("X-Requested-With","xhr"),e.append("Content-Type",c.type);for(f in b.opts.fileUploadToS3.params)e.append(f,b.opts.fileUploadToS3.params[f])}for(f in b.opts.fileUploadParams)e.append(f,b.opts.fileUploadParams[f]);e.append(b.opts.fileUploadParam,c);var g=b.opts.fileUploadURL;b.opts.fileUploadToS3&&(g="https://"+b.opts.fileUploadToS3.region+".amazonaws.com/"+b.opts.fileUploadToS3.bucket);var h=b.core.getXHR(g,b.opts.fileUploadMethod);h.onload=function(){k.call(h,[b.opts.fileUseSelectedText?null:c.name])},h.onerror=l,h.upload.onprogress=m,d(),b.edit.off(),h.send(e)}}}function p(c){b.events.$on(c,"dragover dragenter",".fr-file-upload-layer",function(){return a(this).addClass("fr-drop"),!1},!0),b.events.$on(c,"dragleave dragend",".fr-file-upload-layer",function(){return a(this).removeClass("fr-drop"),!1},!0),b.events.$on(c,"drop",".fr-file-upload-layer",function(b){b.preventDefault(),b.stopPropagation(),a(this).removeClass("fr-drop");var c=b.originalEvent.dataTransfer;c&&c.files&&o(c.files)},!0),b.events.$on(c,"change",'.fr-file-upload-layer input[type="file"]',function(){this.files&&o(this.files),a(this).val("")},!0)}function q(){e()}function r(a){if(a)return b.popups.onHide("file.insert",q),!0;var c="";c='<div class="fr-buttons">'+b.button.buildList(b.opts.fileInsertButtons)+"</div>";var d="";d='<div class="fr-file-upload-layer fr-layer fr-active" id="fr-file-upload-layer-'+b.id+'"><strong>'+b.language.translate("Drop file")+"</strong><br>("+b.language.translate("or click")+')<div class="fr-form"><input type="file" name="'+b.opts.fileUploadParam+'" accept="/*" tabIndex="-1"></div></div>';var e='<div class="fr-file-progress-bar-layer fr-layer"><h3 class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command" data-cmd="fileDismissError" tabIndex="2">OK</button></div></div>',f={buttons:c,upload_layer:d,progress_bar:e},g=b.popups.create("file.insert",f);return p(g),g}function s(c){return a(c).hasClass("fr-file")?b.events.trigger("file.unlink",[c]):void 0}function t(c){var e=c.originalEvent.dataTransfer;if(e&&e.files&&e.files.length){var f=e.files[0];if(f&&"undefined"!=typeof f.type&&f.type.indexOf("image")<0&&(b.opts.fileAllowedTypes.indexOf(f.type)>=0||b.opts.fileAllowedTypes.indexOf("*")>=0)){b.markers.remove(),b.markers.insertAtPoint(c.originalEvent),b.$el.find(".fr-marker").replaceWith(a.FE.MARKERS),b.popups.hideAll();var g=b.popups.get("file.insert");return g||(g=r()),b.popups.setContainer("file.insert",a(b.opts.scrollableContainer)),b.popups.show("file.insert",c.originalEvent.pageX,c.originalEvent.pageY),d(),o(e.files),c.preventDefault(),c.stopPropagation(),!1}}}function u(){b.events.on("drop",t)}function v(){b.events.disableBlur(),b.selection.restore(),b.events.enableBlur(),b.popups.hide("file.insert"),b.toolbar.showInline()}function w(){u(),b.events.on("link.beforeRemove",s),r(!0)}var x=1,y=2,z=3,A=4,B=5,C=6,D=7,E={};return E[x]="File cannot be loaded from the passed link.",E[y]="No link in upload response.",E[z]="Error during file upload.",E[A]="Parsing response failed.",E[B]="File is too large.",E[C]="File file type is invalid.",E[D]="Files can be uploaded only to same domain in IE 8 and IE 9.",{_init:w,showInsertPopup:c,upload:o,insert:h,back:v,hideProgressBar:e}},a.FE.DefineIcon("insertFile",{NAME:"file-o"}),a.FE.RegisterCommand("insertFile",{title:"Upload File",undo:!1,focus:!0,refershAfterCallback:!1,popup:!0,callback:function(){this.popups.isVisible("file.insert")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("file.insert")):this.file.showInsertPopup()},plugin:"file"}),a.FE.DefineIcon("fileBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("fileBack",{title:"Back",undo:!1,focus:!1,back:!0,refreshAfterCallback:!1,callback:function(){this.file.back()},refresh:function(a){this.opts.toolbarInline?(a.removeClass("fr-hidden"),a.next(".fr-separator").removeClass("fr-hidden")):(a.addClass("fr-hidden"),a.next(".fr-separator").addClass("fr-hidden"))}}),a.FE.RegisterCommand("fileDismissError",{title:"OK",callback:function(){this.file.hideProgressBar(!0)}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{fontFamily:{"Arial,Helvetica,sans-serif":"Arial","Georgia,serif":"Georgia","Impact,Charcoal,sans-serif":"Impact","Tahoma,Geneva,sans-serif":"Tahoma","Times New Roman,Times,serif":"Times New Roman","Verdana,Geneva,sans-serif":"Verdana"},fontFamilySelection:!1,fontFamilyDefaultSelection:"Font Family"}),a.FE.PLUGINS.fontFamily=function(b){function c(a){b.commands.applyProperty("font-family",a)}function d(a,b){b.find(".fr-command.fr-active").removeClass("fr-active"),b.find('.fr-command[data-param1="'+g()+'"]').addClass("fr-active");var c=b.find(".fr-dropdown-list"),d=b.find(".fr-active").parent();d.length?c.parent().scrollTop(d.offset().top-c.offset().top-(c.parent().outerHeight()/2-d.outerHeight()/2)):c.parent().scrollTop(0)}function e(b){var c=b.replace(/(sans-serif|serif|monospace|cursive|fantasy)/gi,"").replace(/"|'| /g,"").split(",");return a.grep(c,function(a){return a.length>0})}function f(a,b){for(var c=0;c<a.length;c++)for(var d=0;d<b.length;d++)if(a[c]==b[d])return[c,d];return null}function g(){var c=a(b.selection.element()).css("font-family"),d=e(c),g=[];for(var h in b.opts.fontFamily){var i=e(h),j=f(d,i);j&&g.push([h,j])}return 0===g.length?null:(g.sort(function(a,b){var c=a[1][0]-b[1][0];return 0===c?a[1][1]-b[1][1]:c}),g[0][0])}function h(c){if(b.opts.fontFamilySelection){var d=a(b.selection.element()).css("font-family").replace(/(sans-serif|serif|monospace|cursive|fantasy)/gi,"").replace(/"|'|/g,"").split(",");c.find("> span").text(b.opts.fontFamily[g()]||d[0]||b.opts.fontFamilyDefaultSelection)}}return{apply:c,refreshOnShow:d,refresh:h}},a.FE.RegisterCommand("fontFamily",{type:"dropdown",displaySelection:function(a){return a.opts.fontFamilySelection},defaultSelection:function(a){return a.opts.fontFamilyDefaultSelection},displaySelectionWidth:120,html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.fontFamily;for(var c in b)a+='<li><a class="fr-command" data-cmd="fontFamily" data-param1="'+c+'" style="font-family: '+c+'" title="'+b[c]+'">'+b[c]+"</a></li>";return a+="</ul>"},title:"Font Family",callback:function(a,b){this.fontFamily.apply(b)},refresh:function(a){this.fontFamily.refresh(a)},refreshOnShow:function(a,b){this.fontFamily.refreshOnShow(a,b)},plugin:"fontFamily"}),a.FE.DefineIcon("fontFamily",{NAME:"font"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{fontSize:["8","9","10","11","12","14","18","24","30","36","48","60","72","96"],fontSizeSelection:!1,fontSizeDefaultSelection:"12"}),a.FE.PLUGINS.fontSize=function(b){function c(a){b.commands.applyProperty("font-size",a+"px")}function d(c,d){var e=b.helpers.getPX(a(b.selection.element()).css("font-size"));d.find(".fr-command.fr-active").removeClass("fr-active"),d.find('.fr-command[data-param1="'+e+'"]').addClass("fr-active");var f=d.find(".fr-dropdown-list"),g=d.find(".fr-active").parent();g.length?f.parent().scrollTop(g.offset().top-f.offset().top-(f.parent().outerHeight()/2-g.outerHeight()/2)):f.parent().scrollTop(0)}function e(c){if(b.opts.fontSizeSelection){var d=b.helpers.getPX(a(b.selection.element()).css("font-size"));c.find("> span").text(d)}}return{apply:c,refreshOnShow:d,refresh:e}},a.FE.RegisterCommand("fontSize",{type:"dropdown",title:"Font Size",displaySelection:function(a){return a.opts.fontSizeSelection},displaySelectionWidth:30,defaultSelection:function(a){return a.opts.fontSizeDefaultSelection},html:function(){for(var a='<ul class="fr-dropdown-list">',b=this.opts.fontSize,c=0;c<b.length;c++){var d=b[c];a+='<li><a class="fr-command" data-cmd="fontSize" data-param1="'+d+'" title="'+d+'">'+d+"</a></li>"}return a+="</ul>"},callback:function(a,b){this.fontSize.apply(b)},refresh:function(a){this.fontSize.refresh(a)},refreshOnShow:function(a,b){this.fontSize.refreshOnShow(a,b)},plugin:"fontSize"}),a.FE.DefineIcon("fontSize",{NAME:"text-height"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.FE.PLUGINS.fullscreen=function(b){function c(){return b.$box.hasClass("fr-fullscreen")}function d(){i=a(b.o_win).scrollTop(),b.$box.toggleClass("fr-fullscreen"),a("body").toggleClass("fr-fullscreen"),j=a('<div style="display: none;"></div>'),b.$box.after(j),b.helpers.isMobile()&&(b.$tb.data("parent",b.$tb.parent()),b.$tb.prependTo(b.$box),b.$tb.data("sticky-dummy")&&b.$tb.after(b.$tb.data("sticky-dummy"))),k=b.opts.height,l=b.opts.heightMax,b.opts.height=b.o_win.innerHeight-(b.opts.toolbarInline?0:b.$tb.outerHeight()),b.size.refresh(),b.opts.toolbarInline&&b.toolbar.showInline();for(var c=b.$box.parent();!c.is("body");)c.data("z-index",c.css("z-index")).css("z-index","auto"),c=c.parent();b.events.trigger("charCounter.update"),b.$win.trigger("scroll")}function e(){b.$box.toggleClass("fr-fullscreen"),a("body").toggleClass("fr-fullscreen"),b.$tb.prependTo(b.$tb.data("parent")),b.$tb.data("sticky-dummy")&&b.$tb.after(b.$tb.data("sticky-dummy")),b.opts.height=k,b.opts.heightMax=l,b.size.refresh(),a(b.o_win).scrollTop(i),b.opts.toolbarInline&&b.toolbar.showInline(),b.events.trigger("charCounter.update"),b.opts.toolbarSticky&&b.opts.toolbarStickyOffset&&(b.opts.toolbarBottom?b.$tb.css("bottom",b.opts.toolbarStickyOffset).data("bottom",b.opts.toolbarStickyOffset):b.$tb.css("top",b.opts.toolbarStickyOffset).data("top",b.opts.toolbarStickyOffset));for(var c=b.$box.parent();!c.is("body");)c.data("z-index")&&(c.css("z-index",""),c.css("z-index")!=c.data("z-index")&&c.css("z-index",c.data("z-index")),c.removeData("z-index")),c=c.parent();b.$win.trigger("scroll")}function f(){c()?e():d(),g(b.$tb.find('.fr-command[data-cmd="fullscreen"]'))}function g(a){var b=c();a.toggleClass("fr-active",b),a.find("i").toggleClass("fa-expand",!b).toggleClass("fa-compress",b)}function h(){return b.$wp?(b.events.$on(a(b.o_win),"resize",function(){c()&&(e(),d())}),void b.events.on("toolbar.hide",function(){return c()&&b.helpers.isMobile()?!1:void 0})):!1}var i,j,k,l;return{_init:h,toggle:f,refresh:g,isActive:c}},a.FE.RegisterCommand("fullscreen",{title:"Fullscreen",undo:!1,focus:!1,forcedRefresh:!0,callback:function(){this.fullscreen.toggle()},refresh:function(a){this.fullscreen.refresh(a)},plugin:"fullscreen"}),a.FE.DefineIcon("fullscreen",{NAME:"expand"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{"image.insert":"[_BUTTONS_][_UPLOAD_LAYER_][_BY_URL_LAYER_][_PROGRESS_BAR_]","image.edit":"[_BUTTONS_]","image.alt":"[_BUTTONS_][_ALT_LAYER_]","image.size":"[_BUTTONS_][_SIZE_LAYER_]"}),a.extend(a.FE.DEFAULTS,{imageInsertButtons:["imageBack","|","imageUpload","imageByURL"],imageEditButtons:["imageReplace","imageAlign","imageRemove","|","imageLink","linkOpen","linkEdit","linkRemove","-","imageDisplay","imageStyle","imageAlt","imageSize"],imageAltButtons:["imageBack","|"],imageSizeButtons:["imageBack","|"],imageUploadURL:"http://i.froala.com/upload",imageUploadParam:"file",imageUploadParams:{},imageUploadToS3:!1,imageUploadMethod:"POST",imageMaxSize:10485760,imageAllowedTypes:["jpeg","jpg","png","gif","svg+xml"],imageResize:!0,imageResizeWithPercent:!1,imageDefaultWidth:300,imageDefaultAlign:"center",imageDefaultDisplay:"block",imageSplitHTML:!1,imageStyles:{"fr-rounded":"Rounded","fr-bordered":"Bordered"},imageMove:!0,imageMultipleStyles:!0,imageTextNear:!0,imagePaste:!0}),a.FE.PLUGINS.image=function(b){function c(){var a=b.popups.get("image.insert"),c=a.find(".fr-image-by-url-layer input");c.val(""),na&&c.val(na.attr("src")),c.trigger("change")}function d(){var a=b.$tb.find('.fr-command[data-cmd="insertImage"]'),c=b.popups.get("image.insert");if(c||(c=I()),r(),!c.hasClass("fr-active"))if(b.popups.refresh("image.insert"),b.popups.setContainer("image.insert",b.$tb),a.is(":visible")){var d=a.offset().left+a.outerWidth()/2,e=a.offset().top+(b.opts.toolbarBottom?10:a.outerHeight()-10);b.popups.show("image.insert",d,e,a.outerHeight())}else b.position.forSelection(c),b.popups.show("image.insert")}function e(){var c=b.popups.get("image.edit");c||(c=p()),b.popups.setContainer("image.edit",a(b.opts.scrollableContainer)),b.popups.refresh("image.edit");var d=na.offset().left+na.outerWidth()/2,e=na.offset().top+na.outerHeight();b.popups.show("image.edit",d,e,na.outerHeight())}function f(){r()}function g(a){if(!a.hasClass("fr-dii")&&!a.hasClass("fr-dib")){var c=a.css("float");a.css("float","none"),"block"==a.css("display")?(a.css("float",c),0===parseInt(a.css("margin-left"),10)&&(a.attr("style")||"").indexOf("margin-right: auto")>=0?a.addClass("fr-fil"):0===parseInt(a.css("margin-right"),10)&&(a.attr("style")||"").indexOf("margin-left: auto")>=0&&a.addClass("fr-fir"),a.addClass("fr-dib")):(a.css("float",c),"left"==a.css("float")?a.addClass("fr-fil"):"right"==a.css("float")&&a.addClass("fr-fir"),a.addClass("fr-dii")),a.css("margin",""),a.css("float",""),a.css("display",""),a.css("z-index",""),a.css("position",""),a.css("overflow",""),a.css("vertical-align","")}a.attr("width")&&(a.css("width",a.width()),a.removeAttr("width")),b.opts.imageTextNear||a.removeClass("fr-dii").addClass("fr-dib")}function h(){for(var c="IMG"==b.$el.get(0).tagName?[b.$el.get(0)]:b.$el.get(0).querySelectorAll("img"),d=0;d<c.length;d++)g(a(c[d])),b.opts.iframe&&a(c[d]).on("load",b.size.syncIframe)}function i(){var c,d=Array.prototype.slice.call(b.$el.get(0).querySelectorAll("img")),e=[];for(c=0;c<d.length;c++)e.push(d[c].getAttribute("src")),a(d[c]).toggleClass("fr-draggable",b.opts.imageMove);if(Aa)for(c=0;c<Aa.length;c++)e.indexOf(Aa[c].getAttribute("src"))<0&&b.events.trigger("image.removed",[a(Aa[c])]);Aa=d}function j(){oa||U(),(b.$wp||a(b.opts.scrollableContainer)).append(oa),oa.data("instance",b);var c=b.$wp?b.$wp.scrollTop()-(b.$wp.offset().top+1):-1,d=b.$wp?b.$wp.scrollLeft()-(b.$wp.offset().left+1):-1;b.$wp&&(d-=b.helpers.getPX(b.$wp.css("border-left-width"))),oa.css("top",b.opts.iframe?na.offset().top-1:na.offset().top+c).css("left",b.opts.iframe?na.offset().left-1:na.offset().left+d).css("width",na.outerWidth()).css("height",na.outerHeight()).addClass("fr-active")}function k(a){return'<div class="fr-handler fr-h'+a+'"></div>'}function l(c){return b.core.sameInstance(oa)?(c.preventDefault(),c.stopPropagation(),b.$el.find("img.fr-error").left?!1:(b.undo.canDo()||b.undo.saveStep(),pa=a(this),pa.data("start-x",c.pageX||c.originalEvent.touches[0].pageX),pa.data("start-width",na.width()),qa.show(),b.popups.hideAll(),void ba())):!0}function m(c){if(!b.core.sameInstance(oa))return!0;if(pa&&na){if(c.preventDefault(),b.$el.find("img.fr-error").left)return!1;var d=c.pageX||(c.originalEvent.touches?c.originalEvent.touches[0].pageX:null);if(!d)return!1;var e=pa.data("start-x"),f=d-e,g=pa.data("start-width");if((pa.hasClass("fr-hnw")||pa.hasClass("fr-hsw"))&&(f=0-f),b.opts.imageResizeWithPercent){var h=na.parentsUntil(b.$el,b.html.blockTagsQuery()).get(0);na.css("width",((g+f)/a(h).outerWidth()*100).toFixed(2)+"%")}else na.css("width",g+f);na.css("height","").removeAttr("height"),j(),b.events.trigger("image.resize",[la()])}}function n(a){if(!b.core.sameInstance(oa))return!0;if(pa&&na){if(a&&a.stopPropagation(),b.$el.find("img.fr-error").left)return!1;pa=null,qa.hide(),j(),e(),b.undo.saveStep(),b.events.trigger("image.resizeEnd",[la()])}}function o(a,c){b.edit.on(),na&&na.addClass("fr-error"),t(b.language.translate("Something went wrong. Please try again.")),b.events.trigger("image.error",[{code:a,message:za[a]},c])}function p(a){if(a)return b.$wp&&b.events.$on(b.$wp,"scroll",function(){na&&b.popups.isVisible("image.edit")&&e()}),!0;var c="";b.opts.imageEditButtons.length>1&&(c+='<div class="fr-buttons">',c+=b.button.buildList(b.opts.imageEditButtons),c+="</div>");var d={buttons:c},f=b.popups.create("image.edit",d);return f}function q(){var a=b.popups.get("image.insert");a&&(a.find(".fr-layer.fr-active").removeClass("fr-active").addClass("fr-pactive"),a.find(".fr-image-progress-bar-layer").addClass("fr-active"),a.find(".fr-buttons").hide(),s("Uploading",0))}function r(a){var c=b.popups.get("image.insert");c&&(c.find(".fr-layer.fr-pactive").addClass("fr-active").removeClass("fr-pactive"),c.find(".fr-image-progress-bar-layer").removeClass("fr-active"),c.find(".fr-buttons").show(),(a||b.$el.find("img.fr-error").length)&&(b.events.focus(),b.$el.find("img.fr-error").remove(),b.undo.saveStep(),b.undo.run(),b.undo.dropRedo()))}function s(a,c){var d=b.popups.get("image.insert");if(d){var e=d.find(".fr-image-progress-bar-layer");e.find("h3").text(a+(c?" "+c+"%":"")),e.removeClass("fr-error"),c?(e.find("div").removeClass("fr-indeterminate"),e.find("div > span").css("width",c+"%")):e.find("div").addClass("fr-indeterminate")}}function t(a){var c=b.popups.get("image.insert"),d=c.find(".fr-image-progress-bar-layer");d.addClass("fr-error"),d.find("h3").text(a)}function u(){var a=b.popups.get("image.insert"),c=a.find(".fr-image-by-url-layer input");c.val().length>0&&(q(),s("Loading image"),w(b.helpers.sanitizeURL(c.val()),!0,[],na),c.val(""),c.blur())}function v(){var c=a(this);b.popups.hide("image.insert"),c.removeClass("fr-uploading"),c.next().is("br")&&c.next().remove(),c.trigger("click").trigger("touchend"),b.events.trigger("image.loaded",[c])}function w(a,c,d,e,f){b.edit.off(),s("Loading image");var g=new Image;g.onload=function(){var c,g;if(e){var h=e.data("fr-old-src");b.$wp?(c=e.clone().removeData("fr-old-src"),h&&e.attr("src",h),e.removeClass("fr-uploading"),e.replaceWith(c),c.off("load")):c=e;for(var i=c.get(0).attributes,j=0;j<i.length;j++){var k=i[j];0===k.nodeName.indexOf("data-")&&c.removeAttr(k.nodeName)}if("undefined"!=typeof d)for(g in d)"link"!=g&&c.attr("data-"+g,d[g]);c.on("load",v),c.attr("src",a),b.edit.on(),b.undo.saveStep(),b.events.trigger(h?"image.replaced":"image.inserted",[c,f])}else c=C(a,d,v),b.undo.saveStep(),b.events.trigger("image.inserted",[c,f])},g.onerror=function(){o(sa)},g.src=a}function x(c){try{if(b.events.trigger("image.uploaded",[c],!0)===!1)return b.edit.on(),!1;var d=a.parseJSON(c);return d.link?d:(o(ta,c),!1)}catch(e){return o(va,c),!1}}function y(c){try{var d=a(c).find("Location").text(),e=a(c).find("Key").text();return b.events.trigger("image.uploadedToS3",[d,e,c],!0)===!1?(b.edit.on(),!1):d}catch(f){return o(va,c),!1}}function z(a){s("Loading image");var c=this.status,d=this.response,e=this.responseXML,f=this.responseText;try{if(b.opts.imageUploadToS3)if(201==c){var g=y(e);g&&w(g,!1,[],a,d||e)}else o(va,d||e);else if(c>=200&&300>c){var h=x(f);h&&w(h.link,!1,h,a,d||f)}else o(ua,d||f)}catch(i){o(va,d||f)}}function A(){o(va,this.response||this.responseText||this.responseXML)}function B(a){if(a.lengthComputable){var b=a.loaded/a.total*100|0;s("Uploading",b)}}function C(c,d,e){var f,g="";if(d&&"undefined"!=typeof d)for(f in d)"link"!=f&&(g+=" data-"+f+'="'+d[f]+'"');var h=b.opts.imageDefaultWidth||"auto";h&&"auto"!=h&&(""+h).indexOf("px")<0&&(""+h).indexOf("%")<0&&(h+="px");var i=a('<img class="fr-di'+b.opts.imageDefaultDisplay[0]+("center"!=b.opts.imageDefaultAlign?" fr-fi"+b.opts.imageDefaultAlign[0]:"")+'" src="'+c+'"'+g+(h?' style="width: '+h+';"':"")+">");i.on("load",e),b.edit.on(),b.events.focus(!0),b.selection.restore(),b.undo.saveStep(),b.opts.imageSplitHTML?b.markers.split():b.markers.insert();var j=b.$el.find(".fr-marker");return j.replaceWith(i),b.html.wrap(),b.selection.clear(),i}function D(c,d,f){function g(){var f=a(this);f.off("load"),f.addClass("fr-uploading"),f.next().is("br")&&f.next().remove(),b.placeholder.refresh(),f.is(na)||f.trigger("click").trigger("touchend"),j(),e(),ia(),q(),ia(),b.edit.off(),c.onload=function(){z.call(c,f)},c.onerror=A,c.upload.onprogress=B,c.send(d)}var h,i=new FileReader;i.addEventListener("load",function(){for(var a=atob(i.result.split(",")[1]),c=[],d=0;d<a.length;d++)c.push(a.charCodeAt(d));var e=window.URL.createObjectURL(new Blob([new Uint8Array(c)],{type:"image/jpeg"}));na?(na.on("load",g),b.edit.on(),b.undo.saveStep(),na.data("fr-old-src",na.attr("src")),na.attr("src",e)):h=C(e,null,g)},!1),i.readAsDataURL(f)}function E(a){if(b.events.trigger("image.beforeUpload",[a])===!1)return!1;if("undefined"!=typeof a&&a.length>0){var c=a[0];if(c.size>b.opts.imageMaxSize)return o(wa),!1;if(b.opts.imageAllowedTypes.indexOf(c.type.replace(/image\//g,""))<0)return o(xa),!1;var d;if(b.drag_support.formdata&&(d=b.drag_support.formdata?new FormData:null),d){var e;if(b.opts.imageUploadToS3!==!1){d.append("key",b.opts.imageUploadToS3.keyStart+(new Date).getTime()+"-"+(c.name||"untitled")),d.append("success_action_status","201"),d.append("X-Requested-With","xhr"),d.append("Content-Type",c.type);for(e in b.opts.imageUploadToS3.params)d.append(e,b.opts.imageUploadToS3.params[e])}for(e in b.opts.imageUploadParams)d.append(e,b.opts.imageUploadParams[e]);d.append(b.opts.imageUploadParam,c);var f=b.opts.imageUploadURL;b.opts.imageUploadToS3&&(f="https://"+b.opts.imageUploadToS3.region+".amazonaws.com/"+b.opts.imageUploadToS3.bucket);var g=b.core.getXHR(f,b.opts.imageUploadMethod);D(g,d,c)}}}function F(c){b.events.$on(c,"dragover dragenter",".fr-image-upload-layer",function(){return a(this).addClass("fr-drop"),!1}),b.events.$on(c,"dragleave dragend",".fr-image-upload-layer",function(){return a(this).removeClass("fr-drop"),!1}),b.events.$on(c,"drop",".fr-image-upload-layer",function(d){d.preventDefault(),d.stopPropagation(),a(this).removeClass("fr-drop");var e=d.originalEvent.dataTransfer;if(e&&e.files){var f=c.data("instance")||b;f.image.upload(e.files)}}),b.events.$on(c,"change",'.fr-image-upload-layer input[type="file"]',function(){if(this.files){var d=c.data("instance")||b;d.image.upload(this.files)}a(this).val("")})}function G(c){var d=c.originalEvent.dataTransfer;if(d&&d.files&&d.files.length){var e=d.files[0];if(e&&e.type&&b.opts.imageAllowedTypes.indexOf(e.type.replace(/image\//g,""))>=0){b.markers.remove(),b.markers.insertAtPoint(c.originalEvent),b.$el.find(".fr-marker").replaceWith(a.FE.MARKERS),b.popups.hideAll();var f=b.popups.get("image.insert");return f||(f=I()),b.popups.setContainer("image.insert",a(b.opts.scrollableContainer)),b.popups.show("image.insert",c.originalEvent.pageX,c.originalEvent.pageY),q(),b.popups.show("image.insert",c.originalEvent.pageX,c.originalEvent.pageY),E(d.files),c.preventDefault(),c.stopPropagation(),!1}}}function H(){b.events.$on(b.$el,b._mousedown,"IMG"==b.$el.get(0).tagName?null:"img",function(a){b.selection.clear(),ra=!0,b.browser.msie&&(b.events.disableBlur(),b.$el.attr("contenteditable",!1)),b.draggable||a.preventDefault(),a.stopPropagation()}),b.events.$on(b.$el,b._mouseup,"IMG"==b.$el.get(0).tagName?null:"img",function(a){ra&&(ra=!1,a.stopPropagation(),b.browser.msie&&(b.$el.attr("contenteditable",!0),b.events.enableBlur()))}),b.events.on("drop",G),b.events.on("mousedown window.mousedown",aa),b.events.on("window.touchmove",ba),b.events.on("mouseup window.mouseup",_),b.events.on("commands.mousedown",function(a){a.parents(".fr-toolbar").length>0&&_()}),b.events.on("blur image.hideResizer commands.undo commands.redo element.dropped",function(){ra=!1,_(!0)})}function I(a){if(a)return b.popups.onRefresh("image.insert",c),b.popups.onHide("image.insert",f),!0;var d,e="";b.opts.imageInsertButtons.length>1&&(e='<div class="fr-buttons">'+b.button.buildList(b.opts.imageInsertButtons)+"</div>");var g=b.opts.imageInsertButtons.indexOf("imageUpload"),h=b.opts.imageInsertButtons.indexOf("imageByURL"),i="";g>=0&&(d=" fr-active",h>=0&&g>h&&(d=""),i='<div class="fr-image-upload-layer'+d+' fr-layer" id="fr-image-upload-layer-'+b.id+'"><strong>'+b.language.translate("Drop image")+"</strong><br>("+b.language.translate("or click")+')<div class="fr-form"><input type="file" accept="image/*" tabIndex="-1"></div></div>');var j="";h>=0&&(d=" fr-active",g>=0&&h>g&&(d=""),j='<div class="fr-image-by-url-layer'+d+' fr-layer" id="fr-image-by-url-layer-'+b.id+'"><div class="fr-input-line"><input type="text" placeholder="http://" tabIndex="1"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageInsertByURL" tabIndex="2">'+b.language.translate("Insert")+"</button></div></div>");var k='<div class="fr-image-progress-bar-layer fr-layer"><h3 class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-back" data-cmd="imageDismissError" tabIndex="2">OK</button></div></div>',l={buttons:e,upload_layer:i,by_url_layer:j,progress_bar:k},m=b.popups.create("image.insert",l);return b.$wp&&b.events.$on(b.$wp,"scroll",function(){na&&b.popups.isVisible("image.insert")&&ia()}),F(m),m}function J(){if(na){var a=b.popups.get("image.alt");a.find("input").val(na.attr("alt")||"").trigger("change")}}function K(){var c=b.popups.get("image.alt");c||(c=L()),r(),b.popups.refresh("image.alt"),b.popups.setContainer("image.alt",a(b.opts.scrollableContainer));var d=na.offset().left+na.width()/2,e=na.offset().top+na.height();b.popups.show("image.alt",d,e,na.outerHeight())}function L(a){if(a)return b.popups.onRefresh("image.alt",J),!0;var c="";c='<div class="fr-buttons">'+b.button.buildList(b.opts.imageAltButtons)+"</div>";var d="";d='<div class="fr-image-alt-layer fr-layer fr-active" id="fr-image-alt-layer-'+b.id+'"><div class="fr-input-line"><input type="text" placeholder="'+b.language.translate("Alternate Text")+'" tabIndex="1"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageSetAlt" tabIndex="2">'+b.language.translate("Update")+"</button></div></div>";var e={buttons:c,alt_layer:d},f=b.popups.create("image.alt",e);return b.$wp&&b.events.$on(b.$wp,"scroll.image-alt",function(){na&&b.popups.isVisible("image.alt")&&K()}),f}function M(a){if(na){var c=b.popups.get("image.alt");na.attr("alt",a||c.find("input").val()||""),c.find("input").blur(),setTimeout(function(){na.trigger("click").trigger("touchend")},b.helpers.isAndroid()?50:0)}}function N(){if(na){var a=b.popups.get("image.size");a.find('input[name="width"]').val(na.get(0).style.width).trigger("change"),a.find('input[name="height"]').val(na.get(0).style.height).trigger("change")}}function O(){var c=b.popups.get("image.size");c||(c=P()),r(),b.popups.refresh("image.size"),b.popups.setContainer("image.size",a(b.opts.scrollableContainer));var d=na.offset().left+na.width()/2,e=na.offset().top+na.height();b.popups.show("image.size",d,e,na.outerHeight())}function P(a){if(a)return b.popups.onRefresh("image.size",N),!0;var c="";c='<div class="fr-buttons">'+b.button.buildList(b.opts.imageSizeButtons)+"</div>";var d="";d='<div class="fr-image-size-layer fr-layer fr-active" id="fr-image-size-layer-'+b.id+'"><div class="fr-image-group"><div class="fr-input-line"><input type="text" name="width" placeholder="'+b.language.translate("Width")+'" tabIndex="1"></div><div class="fr-input-line"><input type="text" name="height" placeholder="'+b.language.translate("Height")+'" tabIndex="1"></div></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageSetSize" tabIndex="2">'+b.language.translate("Update")+"</button></div></div>";var e={buttons:c,size_layer:d},f=b.popups.create("image.size",e);return b.$wp&&b.events.$on(b.$wp,"scroll.image-size",function(){na&&b.popups.isVisible("image.size")&&O()}),f}function Q(a,c){if(na){var d=b.popups.get("image.size");na.css("width",a||d.find('input[name="width"]').val()),na.css("height",c||d.find('input[name="height"]').val()),d.find("input").blur(),setTimeout(function(){na.trigger("click").trigger("touchend")},b.helpers.isAndroid()?50:0)}}function R(a){var c,d,e=b.popups.get("image.insert");if(na||b.opts.toolbarInline)na&&(d=na.offset().top+na.outerHeight());else{var f=b.$tb.find('.fr-command[data-cmd="insertImage"]');c=f.offset().left+f.outerWidth()/2,d=f.offset().top+(b.opts.toolbarBottom?10:f.outerHeight()-10)}!na&&b.opts.toolbarInline&&(d=e.offset().top-b.helpers.getPX(e.css("margin-top")),e.hasClass("fr-above")&&(d+=e.outerHeight())),e.find(".fr-layer").removeClass("fr-active"),e.find(".fr-"+a+"-layer").addClass("fr-active"),b.popups.show("image.insert",c,d,na?na.outerHeight():0)}function S(a){var c=b.popups.get("image.insert");c.find(".fr-image-upload-layer").hasClass("fr-active")&&a.addClass("fr-active")}function T(a){var c=b.popups.get("image.insert");c.find(".fr-image-by-url-layer").hasClass("fr-active")&&a.addClass("fr-active")}function U(){var c;b.shared.$image_resizer?(oa=b.shared.$image_resizer,qa=b.shared.$img_overlay,b.events.on("destroy",function(){oa.removeClass("fr-active").appendTo(a("body"))},!0)):(b.shared.$image_resizer=a('<div class="fr-image-resizer"></div>'),oa=b.shared.$image_resizer,b.events.$on(oa,"mousedown",function(a){a.stopPropagation()},!0),b.opts.imageResize&&(oa.append(k("nw")+k("ne")+k("sw")+k("se")),b.shared.$img_overlay=a('<div class="fr-image-overlay"></div>'),qa=b.shared.$img_overlay,c=oa.get(0).ownerDocument,a(c).find("body").append(qa))),b.events.on("shared.destroy",function(){oa.html("").removeData().remove(),b.opts.imageResize&&qa.remove()},!0),b.helpers.isMobile()||b.events.$on(a(b.o_win),"resize.image",function(){_(!0)}),b.opts.imageResize&&(c=oa.get(0).ownerDocument,b.events.$on(oa,b._mousedown,".fr-handler",l),b.events.$on(a(c),b._mousemove,m),b.events.$on(a(c.defaultView||c.parentWindow),b._mouseup,n),b.events.$on(qa,"mouseleave",n))}function V(c){c=c||na,c&&b.events.trigger("image.beforeRemove",[c])!==!1&&(b.popups.hideAll(),_(!0),c.get(0)==b.$el.get(0)?c.removeAttr("src"):("A"==c.get(0).parentNode.tagName?(b.selection.setBefore(c.get(0).parentNode)||b.selection.setAfter(c.get(0).parentNode),a(c.get(0).parentNode).remove()):(b.selection.setBefore(c.get(0))||b.selection.setAfter(c.get(0)),c.remove()),b.selection.restore(),b.html.fillEmptyBlocks()),b.undo.saveStep())}function W(){H(),"IMG"==b.$el.get(0).tagName&&b.$el.addClass("fr-view"),b.events.$on(b.$el,b.helpers.isMobile()&&!b.helpers.isWindowsPhone()?"touchend":"click","IMG"==b.$el.get(0).tagName?null:"img",$),b.helpers.isMobile()&&(b.events.$on(b.$el,"touchstart","IMG"==b.$el.get(0).tagName?null:"img",function(){Ba=!1}),b.events.$on(b.$el,"touchmove",function(){Ba=!0})),b.events.on("window.keydown",function(c){var d=c.which;return!na||d!=a.FE.KEYCODE.BACKSPACE&&d!=a.FE.KEYCODE.DELETE?na&&d==a.FE.KEYCODE.ESC?(_(!0),c.preventDefault(),!1):na&&!b.keys.ctrlKey(c)?(c.preventDefault(),!1):void 0:(c.preventDefault(),V(),!1)},!0),b.events.$on(a(b.o_win),"keydown",function(b){var c=b.which;return na&&c==a.FE.KEYCODE.BACKSPACE?(b.preventDefault(),!1):void 0}),b.events.on("paste.before",Y),b.events.on("paste.beforeCleanup",Z),b.events.on("paste.after",X),b.events.on("html.set",h),h(),b.events.on("html.get",function(a){return a=a.replace(/<(img)((?:[\w\W]*?))class="([\w\W]*?)(fr-uploading|fr-error)([\w\W]*?)"((?:[\w\W]*?))>/g,"")}),b.opts.iframe&&b.events.on("image.loaded",b.size.syncIframe),b.$wp&&(i(),b.events.on("contentChanged",i)),b.events.$on(a(b.o_win),"orientationchange.image."+b.id,function(){setTimeout(function(){var a=la();a&&a.trigger("click").trigger("touchend")},0)}),p(!0),I(!0),P(!0),L(!0),b.events.on("node.remove",function(a){return"IMG"==a.get(0).tagName?(V(a),!1):void 0})}function X(){b.opts.imagePaste?b.$el.find("img[data-fr-image-pasted]").each(function(c,d){if(0===d.src.indexOf("data:")){if(b.events.trigger("image.beforePasteUpload",[d])===!1)return!1;var f=b.opts.imageDefaultWidth||"auto";"auto"!=f&&(f+=b.opts.imageResizeWithPercent?"%":"px"),a(d).css("width",f),a(d).addClass("fr-dib"),na=a(d),j(),e(),ia(),q(),b.edit.off();for(var g=atob(a(d).attr("src").split(",")[1]),h=[],i=0;i<g.length;i++)h.push(g.charCodeAt(i));var k=new Blob([new Uint8Array(h)],{type:"image/jpeg"});E([k]),a(d).removeAttr("data-fr-image-pasted")}else 0!==d.src.indexOf("http")?(b.selection.save(),a(d).remove(),b.selection.restore()):a(d).removeAttr("data-fr-image-pasted")}):b.$el.find("img[data-fr-image-pasted]").remove()}function Y(a){if(a&&a.clipboardData&&a.clipboardData.items&&a.clipboardData.items[0]){var c=a.clipboardData.items[0].getAsFile();if(c){var d=new FileReader;return d.onload=function(a){var c=a.target.result,d=b.opts.imageDefaultWidth||"auto";d&&"auto"!=d&&(""+d).indexOf("px")<0&&(""+d).indexOf("%")<0&&(d+="px"),b.html.insert('<img data-fr-image-pasted="true" class="fr-di'+b.opts.imageDefaultDisplay[0]+("center"!=b.opts.imageDefaultAlign?" fr-fi"+b.opts.imageDefaultAlign[0]:"")+'" src="'+c+'"'+(d?' style="width: '+d+';"':"")+">"),b.events.trigger("paste.after")},d.readAsDataURL(c),!1}}}function Z(a){return a=a.replace(/<img /gi,'<img data-fr-image-pasted="true" ')}function $(c){if(c&&"touchend"==c.type&&Ba)return!0;if(b.edit.isDisabled())return c.stopPropagation(),c.preventDefault(),!1;for(var d=0;d<a.FE.INSTANCES.length;d++)a.FE.INSTANCES[d]!=b&&a.FE.INSTANCES[d].events.trigger("image.hideResizer");b.toolbar.disable(),c.stopPropagation(),c.preventDefault(),b.helpers.isMobile()&&(b.events.disableBlur(),b.$el.blur(),b.events.enableBlur()),b.opts.iframe&&b.size.syncIframe(),na=a(this),ja(),j(),e(),b.selection.clear(),b.button.bulkRefresh(),b.events.trigger("video.hideResizer"),b.helpers.isIOS()&&setTimeout(e,100)}function _(a){na&&(ca()||a===!0)&&(b.toolbar.enable(),oa.removeClass("fr-active"),b.popups.hide("image.edit"),na=null,ba())}function aa(){Ca=!0}function ba(){Ca=!1}function ca(){return Ca}function da(a){na.removeClass("fr-fir fr-fil"),"left"==a?na.addClass("fr-fil"):"right"==a&&na.addClass("fr-fir"),j(),e()}function ea(a){na&&(na.hasClass("fr-fil")?a.find("> *:first").replaceWith(b.icon.create("align-left")):na.hasClass("fr-fir")?a.find("> *:first").replaceWith(b.icon.create("align-right")):a.find("> *:first").replaceWith(b.icon.create("align-justify")))}function fa(a,b){if(na){var c="justify";na.hasClass("fr-fil")?c="left":na.hasClass("fr-fir")&&(c="right"),b.find('.fr-command[data-param1="'+c+'"]').addClass("fr-active")}}function ga(a){na.removeClass("fr-dii fr-dib"),"inline"==a?na.addClass("fr-dii"):"block"==a&&na.addClass("fr-dib"),j(),e()}function ha(a,b){var c="block";na.hasClass("fr-dii")&&(c="inline"),b.find('.fr-command[data-param1="'+c+'"]').addClass("fr-active")}function ia(){var c=b.popups.get("image.insert");c||(c=I()),b.popups.isVisible("image.insert")||(r(),b.popups.refresh("image.insert"),b.popups.setContainer("image.insert",a(b.opts.scrollableContainer)));var d=na.offset().left+na.width()/2,e=na.offset().top+na.height();b.popups.show("image.insert",d,e,na.outerHeight())}function ja(){if(na){b.selection.clear();var a=b.doc.createRange();a.selectNode(na.get(0));var c=b.selection.get();c.addRange(a)}}function ka(){na?na.trigger("click").trigger("touchend"):(b.events.disableBlur(),b.selection.restore(),b.events.enableBlur(),b.popups.hide("image.insert"),b.toolbar.showInline())}function la(){return na}function ma(a){if(!na)return!1;if(!b.opts.imageMultipleStyles){var c=Object.keys(b.opts.imageStyles);c.splice(c.indexOf(a),1),na.removeClass(c.join(" "))}na.toggleClass(a),na.trigger("click").trigger("touchend")}var na,oa,pa,qa,ra=!1,sa=1,ta=2,ua=3,va=4,wa=5,xa=6,ya=7,za={};za[sa]="Image cannot be loaded from the passed link.",za[ta]="No link in upload response.",za[ua]="Error during file upload.",za[va]="Parsing response failed.",za[wa]="File is too large.",za[xa]="Image file type is invalid.",za[ya]="Files can be uploaded only to same domain in IE 8 and IE 9.";var Aa,Ba,Ca=!1;return{_init:W,showInsertPopup:d,showLayer:R,refreshUploadButton:S,refreshByURLButton:T,upload:E,insertByURL:u,align:da,refreshAlign:ea,refreshAlignOnShow:fa,display:ga,refreshDisplayOnShow:ha,replace:ia,back:ka,get:la,insert:w,showProgressBar:q,remove:V,hideProgressBar:r,applyStyle:ma,showAltPopup:K,showSizePopup:O,setAlt:M,setSize:Q,exitEdit:_}},a.FE.DefineIcon("insertImage",{NAME:"image"}),a.FE.RegisterShortcut(80,"insertImage"),a.FE.RegisterCommand("insertImage",{title:"Insert Image",undo:!1,focus:!0,refershAfterCallback:!1,popup:!0,callback:function(){this.popups.isVisible("image.insert")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("image.insert")):this.image.showInsertPopup()},plugin:"image"}),a.FE.DefineIcon("imageUpload",{NAME:"upload"}),a.FE.RegisterCommand("imageUpload",{title:"Upload Image",undo:!1,focus:!1,callback:function(){this.image.showLayer("image-upload")},refresh:function(a){this.image.refreshUploadButton(a)}}),a.FE.DefineIcon("imageByURL",{NAME:"link"}),a.FE.RegisterCommand("imageByURL",{title:"By URL",undo:!1,focus:!1,callback:function(){this.image.showLayer("image-by-url")},refresh:function(a){this.image.refreshByURLButton(a)}}),a.FE.RegisterCommand("imageInsertByURL",{title:"Insert Image",undo:!0,refreshAfterCallback:!1,callback:function(){this.image.insertByURL()},refresh:function(a){var b=this.image.get();b?a.text("Replace"):a.text(this.language.translate("Insert"))}}),a.FE.DefineIcon("imageDisplay",{NAME:"star"}),a.FE.RegisterCommand("imageDisplay",{title:"Display",type:"dropdown",options:{inline:"Inline",block:"Break Text"},callback:function(a,b){this.image.display(b)},refresh:function(a){this.opts.imageTextNear||a.addClass("fr-hidden")},refreshOnShow:function(a,b){this.image.refreshDisplayOnShow(a,b)}}),a.FE.DefineIcon("imageAlign",{NAME:"align-center"}),a.FE.RegisterCommand("imageAlign",{type:"dropdown",title:"Align",options:{left:"Align Left",justify:"None",right:"Align Right"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.imageAlign.options;for(var d in c)b+='<li><a class="fr-command fr-title" data-cmd="imageAlign" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.icon.create("align-"+d)+"</a></li>";return b+="</ul>"},callback:function(a,b){this.image.align(b)},refresh:function(a){this.image.refreshAlign(a)},refreshOnShow:function(a,b){this.image.refreshAlignOnShow(a,b)}}),a.FE.DefineIcon("imageReplace",{NAME:"exchange"}),a.FE.RegisterCommand("imageReplace",{title:"Replace",undo:!1,focus:!1,refreshAfterCallback:!1,callback:function(){this.image.replace()}}),a.FE.DefineIcon("imageRemove",{NAME:"trash"}),a.FE.RegisterCommand("imageRemove",{title:"Remove",callback:function(){this.image.remove()}}),a.FE.DefineIcon("imageBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("imageBack",{title:"Back",undo:!1,focus:!1,back:!0,callback:function(){this.image.back()},refresh:function(a){var b=this.image.get();b||this.opts.toolbarInline?(a.removeClass("fr-hidden"),a.next(".fr-separator").removeClass("fr-hidden")):(a.addClass("fr-hidden"),a.next(".fr-separator").addClass("fr-hidden"))}}),a.FE.RegisterCommand("imageDismissError",{title:"OK",undo:!1,callback:function(){this.image.hideProgressBar(!0)}}),a.FE.DefineIcon("imageStyle",{NAME:"magic"}),a.FE.RegisterCommand("imageStyle",{title:"Style",type:"dropdown",html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.imageStyles;for(var c in b)a+='<li><a class="fr-command" data-cmd="imageStyle" data-param1="'+c+'">'+this.language.translate(b[c])+"</a></li>";return a+="</ul>"},callback:function(a,b){this.image.applyStyle(b)},refreshOnShow:function(b,c){var d=this.image.get();d&&c.find(".fr-command").each(function(){var b=a(this).data("param1");a(this).toggleClass("fr-active",d.hasClass(b))})}}),a.FE.DefineIcon("imageAlt",{NAME:"info"}),a.FE.RegisterCommand("imageAlt",{undo:!1,focus:!1,title:"Alternate Text",callback:function(){this.image.showAltPopup()}}),a.FE.RegisterCommand("imageSetAlt",{undo:!0,focus:!1,title:"Update",refreshAfterCallback:!1,callback:function(){this.image.setAlt()}}),a.FE.DefineIcon("imageSize",{NAME:"arrows-alt"}),a.FE.RegisterCommand("imageSize",{undo:!1,focus:!1,title:"Change Size",callback:function(){this.image.showSizePopup()}}),a.FE.RegisterCommand("imageSetSize",{undo:!0,focus:!1,callback:function(){this.image.setSize()}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{inlineStyles:{"Big Red":"font-size: 20px; color: red;","Small Blue":"font-size: 14px; color: blue;"}}),a.FE.PLUGINS.inlineStyle=function(b){function c(c){""!==b.selection.text()?b.html.insert(a.FE.START_MARKER+'<span style="'+c+'">'+b.selection.text()+"</span>"+a.FE.END_MARKER):b.html.insert('<span style="'+c+'">'+a.FE.INVISIBLE_SPACE+a.FE.MARKERS+"</span>")}return{apply:c}},a.FE.RegisterCommand("inlineStyle",{type:"dropdown",html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.inlineStyles;for(var c in b)a+='<li><span style="'+b[c]+'"><a class="fr-command" data-cmd="inlineStyle" data-param1="'+b[c]+'" title="'+this.language.translate(c)+'">'+this.language.translate(c)+"</a></span></li>";return a+="</ul>"},title:"Inline Style",callback:function(a,b){this.inlineStyle.apply(b)},plugin:"inlineStyle"}),a.FE.DefineIcon("inlineStyle",{NAME:"paint-brush"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{lineBreakerTags:["table","hr","iframe","form","dl"],lineBreakerOffset:15}),a.FE.PLUGINS.lineBreaker=function(b){function c(c,d){var e,f,g,h,i,j,k,l;if(null==c)h=d.parent(),i=h.offset().top,k=d.offset().top,e=k-Math.min((k-i)/2,b.opts.lineBreakerOffset),g=h.outerWidth(),f=h.offset().left;else if(null==d)h=c.parent(),j=h.offset().top+h.outerHeight(),l=c.offset().top+c.outerHeight(),e=l+Math.min((j-l)/2,b.opts.lineBreakerOffset),g=h.outerWidth(),f=h.offset().left;else{h=c.parent();var m=c.offset().top+c.height(),o=d.offset().top;if(m>o)return!1;e=(m+o)/2,g=h.outerWidth(),f=h.offset().left}b.opts.iframe&&(f+=b.$iframe.offset().left-a(b.o_win).scrollLeft(),e+=b.$iframe.offset().top-a(b.o_win).scrollTop()),b.$box.append(n),n.css("top",e-b.win.pageYOffset),n.css("left",f-b.win.pageXOffset),n.css("width",g),n.data("tag1",c),n.data("tag2",d),n.addClass("fr-visible").data("instance",b)}function d(a,d){var f,g,h=a.offset().top,i=a.offset().top+a.outerHeight();if(Math.abs(i-d)<=b.opts.lineBreakerOffset||Math.abs(d-h)<=b.opts.lineBreakerOffset)if(Math.abs(i-d)<Math.abs(d-h)){g=a.get(0);for(var j=g.nextSibling;j&&j.nodeType==Node.TEXT_NODE&&0===j.textContent.length;)j=j.nextSibling;if(!j)return c(a,null),!0;if(f=e(j))return c(a,f),!0}else{if(g=a.get(0),!g.previousSibling)return c(null,a),!0;if(f=e(g.previousSibling))return c(f,a),!0}n.removeClass("fr-visible").removeData("instance")}function e(c){if(c){var d=a(c);if(0===b.$el.find(d).length)return null;if(c.nodeType!=Node.TEXT_NODE&&b.opts.lineBreakerTags.indexOf(c.tagName.toLowerCase())>=0)return d;if(d.parents(b.opts.lineBreakerTags.join(",")).length>0)return c=d.parents(b.opts.lineBreakerTags.join(",")).get(0),a(c)}return null}function f(c){p=null;var f,g,h,i=null,j=b.doc.elementFromPoint(c.pageX-b.win.pageXOffset,c.pageY-b.win.pageYOffset);if(j&&("HTML"==j.tagName||"BODY"==j.tagName||b.node.isElement(j)))for(f=1;f<=b.opts.lineBreakerOffset;f++){if(g=b.doc.elementFromPoint(c.pageX-b.win.pageXOffset,c.pageY-b.win.pageYOffset-f),g&&!b.node.isElement(g)&&g!=b.$wp.get(0)&&a(g).parents(b.$wp).length){i=e(g);break}if(h=b.doc.elementFromPoint(c.pageX-b.win.pageXOffset,c.pageY-b.win.pageYOffset+f),h&&!b.node.isElement(h)&&h!=b.$wp.get(0)&&a(h).parents(b.$wp).length){i=e(h);break}}else i=e(j);i?d(i,c.pageY):b.core.sameInstance(n)&&n.removeClass("fr-visible").removeData("instance")}function g(a){return n.hasClass("fr-visible")&&!b.core.sameInstance(n)?!1:b.popups.areVisible()||b.$el.get(0).querySelectorAll(".fr-selected-cell").length?(n.removeClass("fr-visible"),!0):void(o===!1&&(p&&clearTimeout(p),p=setTimeout(f,30,a)))}function h(){p&&clearTimeout(p),n.hasClass("fr-visible")&&n.removeClass("fr-visible").removeData("instance")}function i(){o=!0,h()}function j(){o=!1}function k(c){if(!b.core.sameInstance(n))return!0;c.preventDefault(),n.removeClass("fr-visible").removeData("instance");var d=n.data("tag1"),e=n.data("tag2"),f=b.html.defaultTag();null==d?f&&"TD"!=e.parent().get(0).tagName?e.before("<"+f+">"+a.FE.MARKERS+"<br></"+f+">"):e.before(a.FE.MARKERS+"<br>"):f&&"TD"!=d.parent().get(0).tagName?d.after("<"+f+">"+a.FE.MARKERS+"<br></"+f+">"):d.after(a.FE.MARKERS+"<br>"),b.selection.restore()}function l(){b.shared.$line_breaker||(b.shared.$line_breaker=a('<div class="fr-line-breaker"><a class="fr-floating-btn" role="button" tabindex="-1" title="'+b.language.translate("Break")+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="21" y="11" width="2" height="8"/><rect x="14" y="17" width="7" height="2"/><path d="M14.000,14.000 L14.000,22.013 L9.000,18.031 L14.000,14.000 Z"/></svg></a></div>')),n=b.shared.$line_breaker,b.events.on("shared.destroy",function(){n.html("").removeData().remove()},!0),b.events.on("destroy",function(){n.removeData("instance").removeClass("fr-visible").appendTo("body")},!0),b.events.$on(n,"mouseleave",h,!0),b.events.$on(n,"mousemove",function(a){a.stopPropagation()},!0),b.events.$on(n,"mousedown","a",function(a){a.stopPropagation()},!0),b.events.$on(n,"click","a",k,!0)}function m(){return b.$wp?(l(),o=!1,b.events.$on(b.$win,"mousemove",g),b.events.$on(a(b.win),"scroll",h),b.events.on("popups.show.table.edit",h),b.events.$on(a(b.win),"mousedown",i),void b.events.$on(a(b.win),"mouseup",j)):!1}var n,o,p;return{_init:m}}});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{"link.edit":"[_BUTTONS_]","link.insert":"[_BUTTONS_][_INPUT_LAYER_]"}),a.extend(a.FE.DEFAULTS,{linkEditButtons:["linkOpen","linkStyle","linkEdit","linkRemove"],linkInsertButtons:["linkBack","|","linkList"],linkAttributes:{},linkAutoPrefix:"http://",linkStyles:{"fr-green":"Green","fr-strong":"Thick"},linkMultipleStyles:!0,linkConvertEmailAddress:!0,linkAlwaysBlank:!1,linkAlwaysNoFollow:!1,linkList:[{text:"Froala",href:"https://froala.com",target:"_blank"},{text:"Google",href:"https://google.com",target:"_blank"},{displayText:"Facebook",href:"https://facebook.com"}],linkText:!0}),a.FE.PLUGINS.link=function(b){function c(){var c=b.image?b.image.get():null;if(!c&&b.$wp){var d=b.selection.element(),e=b.selection.endElement();return"A"!=d.tagName&&(d=a(d).parents("a:first").get(0)),"A"!=e.tagName&&(e=a(e).parents("a:first").get(0)),e&&e==d?d:null}return"A"==b.$el.get(0).tagName&&b.core.hasFocus()?b.$el:c&&c.get(0).parentNode&&"A"==c.get(0).parentNode.tagName?c.get(0).parentNode:void 0}function d(){var a=b.image?b.image.get():null,c=[];if(a)"A"==a.get(0).parentNode.tagName&&c.push(a.get(0).parentNode);else{var d,e,f,g;if(b.win.getSelection){var h=b.win.getSelection();if(h.getRangeAt&&h.rangeCount){g=b.doc.createRange();for(var i=0;i<h.rangeCount;++i)if(d=h.getRangeAt(i),e=d.commonAncestorContainer,e&&1!=e.nodeType&&(e=e.parentNode),e&&"a"==e.nodeName.toLowerCase())c.push(e);else{f=e.getElementsByTagName("a");for(var j=0;j<f.length;++j)g.selectNodeContents(f[j]),g.compareBoundaryPoints(d.END_TO_START,d)<1&&g.compareBoundaryPoints(d.START_TO_END,d)>-1&&c.push(f[j])}}}else if(b.doc.selection&&"Control"!=b.doc.selection.type)if(d=b.doc.selection.createRange(),e=d.parentElement(),"a"==e.nodeName.toLowerCase())c.push(e);else{f=e.getElementsByTagName("a"),g=b.doc.body.createTextRange();for(var k=0;k<f.length;++k)g.moveToElementText(f[k]),g.compareEndPoints("StartToEnd",d)>-1&&g.compareEndPoints("EndToStart",d)<1&&c.push(f[k])}}return c}function e(d){b.popups.hide("link.edit"),setTimeout(function(){if(!d||d&&(1==d.which||"mouseup"!=d.type)){var e=c(),g=b.image?b.image.get():null;if(e&&!g){if(b.image){var h=b.node.contents(e);if(1==h.length&&"IMG"==h[0].tagName)return a(h[0]).trigger("click"),!1}d&&d.stopPropagation(),f(e)}}},b.helpers.isIOS()?100:0)}function f(c){var d=b.popups.get("link.edit");d||(d=h());var e=a(c);b.popups.isVisible("link.edit")||b.popups.refresh("link.edit"),b.popups.setContainer("link.edit",a(b.opts.scrollableContainer));var f=e.offset().left+a(c).outerWidth()/2,g=e.offset().top+e.outerHeight();b.popups.show("link.edit",f,g,e.outerHeight())}function g(){b.popups.hide("link.edit")}function h(){var a="";b.opts.linkEditButtons.length>1&&("A"==b.$el.get(0).tagName&&b.opts.linkEditButtons.indexOf("linkRemove")>=0&&b.opts.linkEditButtons.splice(b.opts.linkEditButtons.indexOf("linkRemove"),1),a='<div class="fr-buttons">'+b.button.buildList(b.opts.linkEditButtons)+"</div>");var d={buttons:a},e=b.popups.create("link.edit",d);return b.$wp&&b.events.$on(b.$wp,"scroll.link-edit",function(){c()&&b.popups.isVisible("link.edit")&&f(c())}),e}function i(){}function j(){var d=b.popups.get("link.insert"),e=c();if(e){var f,g,h=a(e),i=d.find('input.fr-link-attr[type="text"]'),j=d.find('input.fr-link-attr[type="checkbox"]');for(f=0;f<i.length;f++)g=a(i[f]),g.val(h.attr(g.attr("name")||""));for(j.prop("checked",!1),f=0;f<j.length;f++)g=a(j[f]),h.attr(g.attr("name"))==g.data("checked")&&g.prop("checked",!0);d.find('input.fr-link-attr[type="text"][name="text"]').val(h.text())}else d.find('input.fr-link-attr[type="text"]').val(""),d.find('input.fr-link-attr[type="checkbox"]').prop("checked",!1),d.find('input.fr-link-attr[type="text"][name="text"]').val(b.selection.text());d.find("input.fr-link-attr").trigger("change");var k=b.image?b.image.get():null;k?d.find('.fr-link-attr[name="text"]').parent().hide():d.find('.fr-link-attr[name="text"]').parent().show()}function k(){var c=b.$tb.find('.fr-command[data-cmd="insertLink"]'),d=b.popups.get("link.insert");if(d||(d=l()),!d.hasClass("fr-active"))if(b.popups.refresh("link.insert"),b.popups.setContainer("link.insert",b.$tb||a(b.opts.scrollableContainer)),c.is(":visible")){var e=c.offset().left+c.outerWidth()/2,f=c.offset().top+(b.opts.toolbarBottom?10:c.outerHeight()-10);b.popups.show("link.insert",e,f,c.outerHeight())}else b.position.forSelection(d),b.popups.show("link.insert")}function l(a){if(a)return b.popups.onRefresh("link.insert",j),b.popups.onHide("link.insert",i),!0;var d="";b.opts.linkInsertButtons.length>=1&&(d='<div class="fr-buttons">'+b.button.buildList(b.opts.linkInsertButtons)+"</div>");var e='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 32 32"><path d="M27 4l-15 15-7-7-5 5 12 12 20-20z" fill="#FFF"></path></svg>',f="",g=0;f='<div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-'+b.id+'">',f+='<div class="fr-input-line"><input name="href" type="text" class="fr-link-attr" placeholder="URL" tabIndex="'+ ++g+'"></div>',b.opts.linkText&&(f+='<div class="fr-input-line"><input name="text" type="text" class="fr-link-attr" placeholder="'+b.language.translate("Text")+'" tabIndex="'+ ++g+'"></div>');for(var h in b.opts.linkAttributes){var k=b.opts.linkAttributes[h];f+='<div class="fr-input-line"><input name="'+h+'" type="text" class="fr-link-attr" placeholder="'+b.language.translate(k)+'" tabIndex="'+ ++g+'"></div>'}b.opts.linkAlwaysBlank||(f+='<div class="fr-checkbox-line"><span class="fr-checkbox"><input name="target" class="fr-link-attr" data-checked="_blank" type="checkbox" id="fr-link-target-'+b.id+'" tabIndex="'+ ++g+'"><span>'+e+'</span></span><label for="fr-link-target-'+b.id+'">'+b.language.translate("Open in new tab")+"</label></div>"),f+='<div class="fr-action-buttons"><button class="fr-command fr-submit" data-cmd="linkInsert" href="#" tabIndex="'+ ++g+'" type="button">'+b.language.translate("Insert")+"</button></div></div>";var l={buttons:d,input_layer:f},m=b.popups.create("link.insert",l);return b.$wp&&b.events.$on(b.$wp,"scroll.link-insert",function(){var a=b.image?b.image.get():null;a&&b.popups.isVisible("link.insert")&&u(),c&&b.popups.isVisible("link.insert")&&s()}),m}function m(){var d=c(),e=b.image?b.image.get():null;return b.events.trigger("link.beforeRemove",[d])===!1?!1:void(e&&d?(e.unwrap(),e.trigger("click")):d&&(b.selection.save(),a(d).replaceWith(a(d).html()),b.selection.restore(),g()))}function n(){b.events.on("keyup",function(b){b.which!=a.FE.KEYCODE.ESC&&e(b)}),b.events.on("window.mouseup",e),l(!0),"A"==b.$el.get(0).tagName&&b.$el.addClass("fr-view")}function o(c){var d,e,f=b.opts.linkList[c],g=b.popups.get("link.insert"),h=g.find('input.fr-link-attr[type="text"]'),i=g.find('input.fr-link-attr[type="checkbox"]');for(e=0;e<h.length;e++)d=a(h[e]),f[d.attr("name")]?d.val(f[d.attr("name")]):d.val("");for(e=0;e<i.length;e++)d=a(i[e]),d.prop("checked",d.data("checked")==f[d.attr("name")])}function p(){var c,d,e=b.popups.get("link.insert"),f=e.find('input.fr-link-attr[type="text"]'),g=e.find('input.fr-link-attr[type="checkbox"]'),h=f.filter('[name="href"]').val(),i=f.filter('[name="text"]').val(),j={};for(d=0;d<f.length;d++)c=a(f[d]),["href","text"].indexOf(c.attr("name"))<0&&(j[c.attr("name")]=c.val());for(d=0;d<g.length;d++)c=a(g[d]),c.is(":checked")?j[c.attr("name")]=c.data("checked"):j[c.attr("name")]=c.data("unchecked");var k=a(b.o_win).scrollTop();r(h,i,j),a(b.o_win).scrollTop(k)}function q(){if(!b.selection.isCollapsed()){b.selection.save();for(var c=b.$el.find(".fr-marker").addClass("fr-unprocessed").toArray();c.length;){var d=a(c.pop());d.removeClass("fr-unprocessed");var e=b.node.deepestParent(d.get(0));if(e){var f=d.get(0),g="",h="";do f=f.parentNode,b.node.isBlock(f)||(g+=b.node.closeTagString(f),h=b.node.openTagString(f)+h);while(f!=e);var i=b.node.openTagString(d.get(0))+d.html()+b.node.closeTagString(d.get(0));d.replaceWith('<span id="fr-break"></span>');var j=a(e).html();j=j.replace(/<span id="fr-break"><\/span>/g,g+i+h),a(e).html(j)}c=b.$el.find(".fr-marker.fr-unprocessed").toArray()}b.selection.restore()}}function r(f,g,h){"undefined"==typeof h&&(h={});var i=b.image?b.image.get():null;i||"A"==b.$el.get(0).tagName?"A"==b.$el.get(0).tagName&&b.$el.focus():(b.selection.restore(),b.popups.hide("link.insert"));var j=f;if(b.opts.linkConvertEmailAddress){var k=/^[\w._]+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/i;k.test(f)&&0!==f.indexOf("mailto:")&&(f="mailto:"+f)}if(0===f.indexOf("tel:")||0===f.indexOf("sms:")||0===f.indexOf("mailto:")||0===f.indexOf("notes:")||0===f.indexOf("data:image")||""===b.opts.linkAutoPrefix||/^(https?:|ftps?:|)\/\//.test(f)||(f=b.opts.linkAutoPrefix+f),f=b.helpers.sanitizeURL(f),b.opts.linkAlwaysBlank&&(h.target="_blank"),b.opts.linkAlwaysNoFollow&&(h.rel="nofollow"),g=g||"",f===b.opts.linkAutoPrefix){var l=b.popups.get("link.insert");return l.find('input[name="href"]').addClass("fr-error"),b.events.trigger("link.bad",[j]),!1}var m,n=c();if(n){m=a(n);var o=b.node.rawAttributes(n);for(var p in o)"class"!=p&&"style"!=p&&m.removeAttr(p);m.attr("href",f),g.length>0&&m.text()!=g&&!i&&m.text(g),i||m.prepend(a.FE.START_MARKER).append(a.FE.END_MARKER),m.attr(h),i||b.selection.restore()}else{i?i.wrap('<a href="'+f+'"></a>'):(b.doc.execCommand("unlink",!1,!1),b.selection.isCollapsed()?(g=0===g.length?j:g,b.html.insert('<a href="'+f+'">'+a.FE.START_MARKER+g+a.FE.END_MARKER+"</a>"),b.selection.restore()):g.length>0&&g!=b.selection.text()?(b.selection.remove(),b.html.insert('<a href="'+f+'">'+a.FE.START_MARKER+g+a.FE.END_MARKER+"</a>"),b.selection.restore()):(q(),b.doc.execCommand("createLink",!1,f)));for(var r=d(),s=0;s<r.length;s++)m=a(r[s]),m.attr(h),m.removeAttr("_moz_dirty");1==r.length&&b.$wp&&!i&&(a(r[0]).prepend(a.FE.START_MARKER).append(a.FE.END_MARKER),b.selection.restore())}i?(i.trigger("touchstart"),i.trigger(b.helpers.isMobile()?"touchend":"click")):(b.popups.get("link.insert"),e())}function s(){g();var d=c();if(d){var e=b.popups.get("link.insert");e||(e=l()),b.popups.isVisible("link.insert")||(b.popups.refresh("link.insert"),b.selection.save(),b.helpers.isMobile()&&(b.events.disableBlur(),b.$el.blur(),b.events.enableBlur())),b.popups.setContainer("link.insert",a(b.opts.scrollableContainer));var f=(b.image?b.image.get():null)||a(d),h=f.offset().left+f.outerWidth()/2,i=f.offset().top+f.outerHeight();b.popups.show("link.insert",h,i,f.outerHeight())}}function t(){var a=b.image?b.image.get():null;if(a)a.trigger("click").trigger("touchend");else{b.events.disableBlur(),b.selection.restore(),b.events.enableBlur();var d=c();d&&b.$wp?(b.selection.restore(),g(),e()):"A"==b.$el.get(0).tagName?(b.$el.focus(),e()):(b.popups.hide("link.insert"),b.toolbar.showInline())}}function u(){var c=b.image?b.image.get():null;if(c){var d=b.popups.get("link.insert");d||(d=l()),j(!0),b.popups.setContainer("link.insert",a(b.opts.scrollableContainer));var e=c.offset().left+c.outerWidth()/2,f=c.offset().top+c.outerHeight();b.popups.show("link.insert",e,f,c.outerHeight())}}function v(d){var e=c();if(!e)return!1;if(!b.opts.linkMultipleStyles){var f=Object.keys(b.opts.linkStyles);f.splice(f.indexOf(d),1),a(e).removeClass(f.join(" "))}a(e).toggleClass(d)}return{_init:n,remove:m,showInsertPopup:k,usePredefined:o,insertCallback:p,insert:r,update:s,get:c,allSelected:d,back:t,imageLink:u,applyStyle:v}},a.FE.DefineIcon("insertLink",{NAME:"link"}),a.FE.RegisterShortcut(75,"insertLink"),a.FE.RegisterCommand("insertLink",{title:"Insert Link",undo:!1,focus:!0,refreshOnCallback:!1,popup:!0,callback:function(){this.popups.isVisible("link.insert")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("link.insert")):this.link.showInsertPopup()},plugin:"link"}),a.FE.DefineIcon("linkOpen",{NAME:"external-link"}),a.FE.RegisterCommand("linkOpen",{title:"Open Link",undo:!1,refresh:function(a){var b=this.link.get();b?a.removeClass("fr-hidden"):a.addClass("fr-hidden")},callback:function(){var a=this.link.get();a&&this.o_win.open(a.href)}}),a.FE.DefineIcon("linkEdit",{NAME:"edit"}),a.FE.RegisterCommand("linkEdit",{title:"Edit Link",undo:!1,refreshAfterCallback:!1,callback:function(){this.link.update()},refresh:function(a){var b=this.link.get();b?a.removeClass("fr-hidden"):a.addClass("fr-hidden")}}),a.FE.DefineIcon("linkRemove",{NAME:"unlink"}),a.FE.RegisterCommand("linkRemove",{title:"Unlink",callback:function(){this.link.remove()},refresh:function(a){var b=this.link.get();b?a.removeClass("fr-hidden"):a.addClass("fr-hidden")}}),a.FE.DefineIcon("linkBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("linkBack",{title:"Back",undo:!1,focus:!1,back:!0,refreshAfterCallback:!1,callback:function(){this.link.back()},refresh:function(a){var b=this.link.get(),c=this.image?this.image.get():null;c||b||this.opts.toolbarInline?(a.removeClass("fr-hidden"),a.next(".fr-separator").removeClass("fr-hidden")):(a.addClass("fr-hidden"),a.next(".fr-separator").addClass("fr-hidden"))}}),a.FE.DefineIcon("linkList",{NAME:"search"}),a.FE.RegisterCommand("linkList",{title:"Choose Link",type:"dropdown",focus:!1,undo:!1,refreshAfterCallback:!1,html:function(){for(var a='<ul class="fr-dropdown-list">',b=this.opts.linkList,c=0;c<b.length;c++)a+='<li><a class="fr-command" data-cmd="linkList" data-param1="'+c+'">'+(b[c].displayText||b[c].text)+"</a></li>";return a+="</ul>"},callback:function(a,b){this.link.usePredefined(b)}}),a.FE.RegisterCommand("linkInsert",{focus:!1,refreshAfterCallback:!1,callback:function(){this.link.insertCallback()},refresh:function(a){var b=this.link.get();b?a.text(this.language.translate("Update")):a.text(this.language.translate("Insert"))}}),a.FE.DefineIcon("imageLink",{NAME:"link"}),a.FE.RegisterCommand("imageLink",{title:"Insert Link",undo:!1,focus:!1,callback:function(){this.link.imageLink()},refresh:function(a){var b,c=this.link.get();c?(b=a.prev(),b.hasClass("fr-separator")&&b.removeClass("fr-hidden"),a.addClass("fr-hidden")):(b=a.prev(),b.hasClass("fr-separator")&&b.addClass("fr-hidden"),a.removeClass("fr-hidden"))}}),a.FE.DefineIcon("linkStyle",{NAME:"magic"}),a.FE.RegisterCommand("linkStyle",{title:"Style",type:"dropdown",html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.linkStyles;for(var c in b)a+='<li><a class="fr-command" data-cmd="linkStyle" data-param1="'+c+'">'+this.language.translate(b[c])+"</a></li>";return a+="</ul>"},callback:function(a,b){this.link.applyStyle(b)},refreshOnShow:function(b,c){var d=this.link.get();if(d){var e=a(d);c.find(".fr-command").each(function(){var b=a(this).data("param1");a(this).toggleClass("fr-active",e.hasClass(b))})}}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.FE.PLUGINS.lists=function(b){function c(a){return'<span class="fr-open-'+a.toLowerCase()+'"></span>'}function d(a){return'<span class="fr-close-'+a.toLowerCase()+'"></span>'}function e(b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e].parentNode;"LI"==b[e].tagName&&f.tagName!=c&&d.indexOf(f)<0&&d.push(f)}for(e=d.length-1;e>=0;e--){var g=a(d[e]);g.replaceWith("<"+c.toLowerCase()+">"+g.html()+"</"+c.toLowerCase()+">")}}function f(c,d){e(c,d);for(var f=b.html.defaultTag(),g=0;g<c.length;g++)"LI"!=c[g].tagName&&(f&&c[g].tagName.toLowerCase()==f?a(c[g]).replaceWith("<"+d+"><li"+b.node.attributes(c[g])+">"+a(c[g]).html()+"</li></"+d+">"):a(c[g]).wrap("<"+d+"><li></li></"+d+">"));b.clean.lists()}function g(e){var f,g;for(f=e.length-1;f>=0;f--)for(g=f-1;g>=0;g--)if(a(e[g]).find(e[f]).length||e[g]==e[f]){e.splice(f,1);break}var h=[];for(f=0;f<e.length;f++){var i=a(e[f]),j=e[f].parentNode;i.before(d(j.tagName)),"LI"==j.parentNode.tagName?(i.before(d("LI")),i.after(c("LI"))):(b.node.isEmpty(i.get(0),!0)||0!==i.find(b.html.blockTagsQuery()).length||i.append("<br>"),i.append(c("LI")),i.prepend(d("LI"))),i.after(c(j.tagName)),"LI"==j.parentNode.tagName&&(j=j.parentNode.parentNode),h.indexOf(j)<0&&h.push(j)}for(f=0;f<h.length;f++){var k=a(h[f]),l=k.html();l=l.replace(/<span class="fr-close-([a-z]*)"><\/span>/g,"</$1>"),l=l.replace(/<span class="fr-open-([a-z]*)"><\/span>/g,"<$1>"),k.replaceWith(b.node.openTagString(k.get(0))+l+b.node.closeTagString(k.get(0)))}b.$el.find("li:empty").remove(),b.$el.find("ul:empty, ol:empty").remove(),b.clean.lists(),b.html.wrap()}function h(a,b){for(var c=!0,d=0;d<a.length;d++){if("LI"!=a[d].tagName)return!1;a[d].parentNode.tagName!=b&&(c=!1)}return c}function i(a){b.selection.save(),b.html.wrap(!0,!0),b.selection.restore();for(var c=b.selection.blocks(),d=0;d<c.length;d++)"LI"!=c[d].tagName&&"LI"==c[d].parentNode.tagName&&(c[d]=c[d].parentNode);b.selection.save(),h(c,a)?g(c):f(c,a),b.html.unwrap(),b.selection.restore()}function j(c,d){var e=a(b.selection.element());if(e.get(0)!=b.$el.get(0)){var f=e.get(0);"LI"!=f.tagName&&(f=e.parents("li").get(0)),f&&f.parentNode.tagName==d&&b.$el.get(0).contains(f.parentNode)&&c.addClass("fr-active")}}function k(c){b.selection.save();for(var d=0;d<c.length;d++){var e=c[d].previousSibling;if(e){var f=a(c[d]).find("> ul, > ol").get(0);if(f){for(var g=a("<li>").prependTo(a(f)),h=b.node.contents(c[d])[0];h&&!b.node.isList(h);){var i=h.nextSibling;g.append(h),h=i}a(e).append(a(f)),a(c[d]).remove()}else{var j=a(e).find("> ul, > ol").get(0);if(j)a(j).append(a(c[d]));else{var k=a("<"+c[d].parentNode.tagName+">");a(e).append(k),k.append(a(c[d]))}}}}b.clean.lists(),b.selection.restore()}function l(a){b.selection.save(),g(a),b.selection.restore()}function m(a){if("indent"==a||"outdent"==a){for(var c=!1,d=b.selection.blocks(),e=[],f=0;f<d.length;f++)"LI"==d[f].tagName?(c=!0,e.push(d[f])):"LI"==d[f].parentNode.tagName&&(c=!0,e.push(d[f].parentNode));c&&("indent"==a?k(e):l(e))}}function n(){b.events.on("commands.after",m),b.events.on("keydown",function(c){if(c.which==a.FE.KEYCODE.TAB){for(var d,e=b.selection.blocks(),f=[],g=0;g<e.length;g++)"LI"==e[g].tagName?(d=!0,f.push(e[g])):"LI"==e[g].parentNode.tagName&&(d=!0,f.push(e[g].parentNode));if(d)return c.preventDefault(),c.stopPropagation(),c.shiftKey?l(f):k(f),!1}},!0)}return{_init:n,format:i,refresh:j}},a.FE.RegisterCommand("formatUL",{title:"Unordered List",refresh:function(a){this.lists.refresh(a,"UL")},callback:function(){this.lists.format("UL")},plugin:"lists"}),a.FE.RegisterCommand("formatOL",{title:"Ordered List",refresh:function(a){this.lists.refresh(a,"OL")},callback:function(){this.lists.format("OL")},plugin:"lists"}),a.FE.DefineIcon("formatUL",{NAME:"list-ul"}),a.FE.DefineIcon("formatOL",{NAME:"list-ol"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{paragraphFormat:{N:"Normal",H1:"Heading 1",H2:"Heading 2",H3:"Heading 3",H4:"Heading 4",PRE:"Code"},paragraphFormatSelection:!1}),a.FE.PLUGINS.paragraphFormat=function(b){function c(c,d){var e=b.html.defaultTag();if(d&&d.toLowerCase()!=e)if(c.find("ul, ol").length>0){var f=a("<"+d+">");c.prepend(f);for(var g=b.node.contents(c.get(0))[0];g&&["UL","OL"].indexOf(g.tagName)<0;){var h=g.nextSibling;f.append(g),g=h}}else c.html("<"+d+">"+c.html()+"</"+d+">")}function d(c,d){var e=b.html.defaultTag();d||(d='div class="fr-temp-div" data-empty="true"'),d.toLowerCase()==e?c.replaceWith(c.html()):c.replaceWith(a("<"+d+">").html(c.html()))}function e(c,d){var e=b.html.defaultTag();d||(d='div class="fr-temp-div"'+(b.node.isEmpty(c.get(0),!0)?' data-empty="true"':"")),d.toLowerCase()==e?(b.node.isEmpty(c.get(0),!0)||c.append("<br/>"),c.replaceWith(c.html())):c.replaceWith(a("<"+d+">").html(c.html()))}function f(c,d){d||(d='div class="fr-temp-div"'+(b.node.isEmpty(c.get(0),!0)?' data-empty="true"':"")),c.replaceWith(a("<"+d+" "+b.node.attributes(c.get(0))+">").html(c.html()))}function g(g){"N"==g&&(g=b.html.defaultTag()),b.selection.save(),b.html.wrap(!0,!0,!0),b.selection.restore();var h=b.selection.blocks();b.selection.save(),b.$el.find("pre").attr("skip",!0);for(var i=0;i<h.length;i++)if(h[i].tagName!=g&&!b.node.isList(h[i])){var j=a(h[i]);"LI"==h[i].tagName?c(j,g):"LI"==h[i].parentNode.tagName&&h[i]?d(j,g):["TD","TH"].indexOf(h[i].parentNode.tagName)>=0?e(j,g):f(j,g)}b.$el.find('pre:not([skip="true"]) + pre:not([skip="true"])').each(function(){a(this).prev().append("<br>"+a(this).html()),a(this).remove()}),b.$el.find("pre").removeAttr("skip"),b.html.unwrap(),b.selection.restore()}function h(a,c){var d=b.selection.blocks();if(d.length){var e=d[0],f="N",g=b.html.defaultTag();e.tagName.toLowerCase()!=g&&e!=b.$el.get(0)&&(f=e.tagName),c.find('.fr-command[data-param1="'+f+'"]').addClass("fr-active")}else c.find('.fr-command[data-param1="N"]').addClass("fr-active")}function i(a){if(b.opts.paragraphFormatSelection){var c=b.selection.blocks();if(c.length){var d=c[0],e="N",f=b.html.defaultTag();d.tagName.toLowerCase()!=f&&d!=b.$el.get(0)&&(e=d.tagName),["LI","TD","TH"].indexOf(e)>=0&&(e="N"),a.find("> span").text(b.opts.paragraphFormat[e])}else a.find("> span").text(edior.opts.paragraphFormat.N)}}return{apply:g,refreshOnShow:h,refresh:i}},a.FE.RegisterCommand("paragraphFormat",{type:"dropdown",displaySelection:function(a){return a.opts.paragraphFormatSelection},defaultSelection:"Normal",displaySelectionWidth:100,html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.paragraphFormat;for(var c in b)a+="<li><"+c+' style="padding: 0 !important; margin: 0 !important;"><a class="fr-command" data-cmd="paragraphFormat" data-param1="'+c+'" title="'+this.language.translate(b[c])+'">'+this.language.translate(b[c])+"</a></"+c+"></li>";return a+="</ul>"},title:"Paragraph Format",callback:function(a,b){this.paragraphFormat.apply(b)},refresh:function(a){this.paragraphFormat.refresh(a)},refreshOnShow:function(a,b){this.paragraphFormat.refreshOnShow(a,b)},plugin:"paragraphFormat"}),a.FE.DefineIcon("paragraphFormat",{NAME:"paragraph"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{paragraphStyles:{"fr-text-gray":"Gray","fr-text-bordered":"Bordered","fr-text-spaced":"Spaced","fr-text-uppercase":"Uppercase"},paragraphMultipleStyles:!0}),a.FE.PLUGINS.paragraphStyle=function(b){function c(c){var d="";b.opts.paragraphMultipleStyles||(d=Object.keys(b.opts.paragraphStyles),d.splice(d.indexOf(c),1),d=d.join(" ")),b.selection.save(),b.html.wrap(!0,!0,!0),b.selection.restore();var e=b.selection.blocks();b.selection.save();for(var f=0;f<e.length;f++)a(e[f]).removeClass(d).toggleClass(c),a(e[f]).hasClass("fr-temp-div")&&a(e[f]).removeClass("fr-temp-div"),""===a(e[f]).attr("class")&&a(e[f]).removeAttr("class");b.html.unwrap(),b.selection.restore()}function d(c,d){var e=b.selection.blocks();if(e.length){var f=a(e[0]);d.find(".fr-command").each(function(){var b=a(this).data("param1");a(this).toggleClass("fr-active",f.hasClass(b))})}}function e(){}return{_init:e,apply:c,refreshOnShow:d}},a.FE.RegisterCommand("paragraphStyle",{type:"dropdown",html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.paragraphStyles;for(var c in b)a+='<li><a class="fr-command '+c+'" data-cmd="paragraphStyle" data-param1="'+c+'" title="'+this.language.translate(b[c])+'">'+this.language.translate(b[c])+"</a></li>";return a+="</ul>"},title:"Paragraph Style",callback:function(a,b){this.paragraphStyle.apply(b)},refreshOnShow:function(a,b){this.paragraphStyle.refreshOnShow(a,b)},plugin:"paragraphStyle"}),a.FE.DefineIcon("paragraphStyle",{NAME:"magic"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{quickInsertButtons:["image","table","ul","ol","hr"],quickInsertTags:["p","div","h1","h2","h3","h4","h5","h6","pre","blockquote"]}),a.FE.QUICK_INSERT_BUTTONS={image:{icon:"insertImage",callback:function(){var b=this;b.shared.$qi_image_input||(b.shared.$qi_image_input=a('<input accept="image/*" name="quickInsertImage'+this.id+'" style="display: none;" type="file">'),a("body").append(b.$qi_image_input)),b.$qi_image_input=b.shared.$qi_image_input,b.events.$on(b.$qi_image_input,"change",function(){var b=a(this).data("inst");if(this.files){b.quickInsert.hide(),b.image.showInsertPopup();var c=b.popups.get("image.insert");b.position.forSelection(c),b.image.upload(this.files),a(this).val(""),a(this).blur()}},!0),b.$qi_image_input.data("inst",b).trigger("click")},requiredPlugin:"image",title:"Insert Image"},table:{icon:"insertTable",callback:function(){this.quickInsert.hide(),this.table.insert(2,2),this.undo.saveStep()},requiredPlugin:"table",title:"Insert Table"},ol:{icon:"formatOL",callback:function(){this.quickInsert.hide(),this.lists.format("OL"),this.undo.saveStep()},requiredPlugin:"lists",title:"Ordered List"},ul:{icon:"formatUL",callback:function(){this.quickInsert.hide(),this.lists.format("UL"),this.undo.saveStep()},requiredPlugin:"lists",title:"Unordered List"},hr:{icon:"insertHR",callback:function(){this.quickInsert.hide(),this.commands.insertHR(),this.undo.saveStep()},title:"Insert Horizontal Line"}},a.FE.RegisterQuickInsertCommand=function(b,c){a.FE.QUICK_INSERT_BUTTONS[b]=c},a.FE.PLUGINS.quickInsert=function(b){function c(c){j||h(),b.$box.append(j);var d,e;d=c.offset().top-b.$box.offset().top-(j.outerHeight()-c.outerHeight())/2,e=0-j.outerWidth(),b.opts.iframe&&(d+=b.$iframe.offset().top-a(b.o_win).scrollTop()),j.css("top",d),j.css("left",e),j.data("tag",c),j.addClass("fr-visible")}function d(){var d=b.selection.element();b.node.isBlock(d)||(d=b.node.blockParent(d)),d&&b.node.isEmpty(d)&&b.node.isElement(d.parentNode)?d&&b.selection.isCollapsed()&&c(a(d)):e()}function e(){j&&(b.html.checkIfEmpty(),j.hasClass("fr-on")&&g(),j.removeClass("fr-visible fr-on"),j.css("left",-9999).css("top",-9999))}function f(c){if(c.preventDefault(),j.hasClass("fr-on"))g();else{if(!b.shared.$qi_helper){for(var d=b.opts.quickInsertButtons,e='<div class="fr-qi-helper">',f=0,h=0;h<d.length;h++){var i=a.FE.QUICK_INSERT_BUTTONS[d[h]];i&&(!i.requiredPlugin||a.FE.PLUGINS[i.requiredPlugin]&&b.opts.pluginsEnabled.indexOf(i.requiredPlugin)>=0)&&(e+='<a class="fr-btn fr-floating-btn" role="button" title="'+b.language.translate(i.title)+'" tabindex="-1" data-cmd="'+d[h]+'" style="transition-delay: '+.025*f++ +'s;">'+b.icon.create(i.icon)+"</a>")}e+="</div>",b.shared.$qi_helper=a(e),b.tooltip.bind(b.shared.$qi_helper,".fr-qi-helper > a.fr-btn")}k=b.shared.$qi_helper,k.appendTo(b.$box),setTimeout(function(){k.css("top",parseFloat(j.css("top"))),k.css("left",parseFloat(j.css("left"))+j.outerWidth()),k.find("a").addClass("fr-size-1"),j.addClass("fr-on")},10)}}function g(){var a=b.$box.find(".fr-qi-helper");a.length&&(a.find("a").removeClass("fr-size-1"),a.css("left",-9999),j.removeClass("fr-on"))}function h(){b.shared.$quick_insert||(b.shared.$quick_insert=a('<div class="fr-quick-insert"><a class="fr-floating-btn" role="button" tabindex="-1" title="'+b.language.translate("Quick Insert")+'"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22,16.75 L16.75,16.75 L16.75,22 L15.25,22.000 L15.25,16.75 L10,16.75 L10,15.25 L15.25,15.25 L15.25,10 L16.75,10 L16.75,15.25 L22,15.25 L22,16.75 Z"/></svg></a></div>')),j=b.shared.$quick_insert,b.tooltip.bind(b.$box,".fr-quick-insert > a.fr-floating-btn"),b.events.on("destroy",function(){j.removeClass("fr-on").appendTo(a("body")).css("left",-9999).css("top",-9999),k&&(g(),k.appendTo(a("body")))},!0),b.events.on("shared.destroy",function(){j.html("").removeData().remove(),k&&k.html("").removeData().remove()},!0),b.events.on("commands.before",e),b.events.on("commands.after",function(){b.popups.areVisible()||d()}),b.events.bindClick(b.$box,".fr-quick-insert > a",f),b.events.bindClick(b.$box,".fr-qi-helper > a.fr-btn",function(c){var d=a(c.currentTarget).data("cmd");a.FE.QUICK_INSERT_BUTTONS[d].callback.apply(b,[c.currentTarget])})}function i(){return b.$wp?(b.opts.iframe&&b.$el.parent("html").find("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.4.0/css/font-awesome.min.css">'),b.popups.onShow("image.edit",e),b.events.on("mouseup",d),b.events.on("blur",e),void b.events.on("keyup",d)):!1}var j,k;return{_init:i,hide:e}}});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.FE.PLUGINS.quote=function(b){function c(a){for(;a.parentNode&&a.parentNode!=b.$el.get(0);)a=a.parentNode;return a}function d(){var d,e=b.selection.blocks();for(d=0;d<e.length;d++)e[d]=c(e[d]);b.selection.save();var f=a("<blockquote>");for(f.insertBefore(e[0]),d=0;d<e.length;d++)f.append(e[d]);b.html.unwrap(),b.selection.restore()}function e(){var c,d=b.selection.blocks();for(c=0;c<d.length;c++)"BLOCKQUOTE"!=d[c].tagName&&(d[c]=a(d[c]).parentsUntil(b.$el,"BLOCKQUOTE").get(0));for(b.selection.save(),c=0;c<d.length;c++)d[c]&&a(d[c]).replaceWith(d[c].innerHTML);b.html.unwrap(),b.selection.restore()}function f(a){b.selection.save(),b.html.wrap(!0,!0),b.selection.restore(),"increase"==a?d():"decrease"==a&&e()}return{apply:f}},a.FE.RegisterShortcut(222,"quote","increase"),a.FE.RegisterShortcut(222,"quote","decrease",!0),a.FE.RegisterCommand("quote",{title:"Quote",type:"dropdown",options:{increase:"Increase",decrease:"Decrease"},callback:function(a,b){this.quote.apply(b)},plugin:"quote"}),a.FE.DefineIcon("quote",{NAME:"quote-left"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{saveInterval:1e4,saveURL:null,saveParams:{},saveParam:"body",saveMethod:"POST"}),a.FE.PLUGINS.save=function(b){function c(a,c){b.events.trigger("save.error",[{code:a,message:n[a]},c])}function d(d){if("undefined"==typeof d&&(d=b.html.get()),b.events.trigger("save.before")===!1)return!1;if(b.opts.saveURL){var e={};for(var f in b.opts.saveParams){var g=b.opts.saveParams[f];"function"==typeof g?e[f]=g.call(this):e[f]=g}var h={};h[b.opts.saveParam]=d,a.ajax({type:b.opts.saveMethod,url:b.opts.saveURL,data:a.extend(h,e),crossDomain:b.opts.requestWithCORS,xhrFields:{withCredentials:b.opts.requestWithCORS},headers:b.opts.requestHeaders}).done(function(a){b.events.trigger("save.after",[a])}).fail(function(a){c(m,a.response)})}else c(l)}function e(){clearTimeout(i),i=setTimeout(function(){var a=b.html.get();(j!=a||k)&&(j=a,k=!1,d(a))},b.opts.saveInterval)}function f(){e(),k=!1}function g(){k=!0}function h(){b.opts.saveInterval&&(j=b.html.get(),b.events.on("contentChanged",e),b.events.on("keydown",function(){clearTimeout(i)}))}var i=null,j=null,k=!1,l=1,m=2,n={};return n[l]="Missing saveURL option.",n[m]="Something went wrong during save.",{_init:h,save:d,reset:f,force:g}},a.FE.DefineIcon("save",{NAME:"floppy-o"}),a.FE.RegisterCommand("save",{title:"Save",undo:!1,focus:!1,refreshAfterCallback:!1,callback:function(){this.save.save()},plugin:"save"})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.POPUP_TEMPLATES,{"table.insert":"[_BUTTONS_][_ROWS_COLUMNS_]","table.edit":"[_BUTTONS_]","table.colors":"[_BUTTONS_][_COLORS_]"}),a.extend(a.FE.DEFAULTS,{tableInsertMaxSize:10,tableEditButtons:["tableHeader","tableRemove","|","tableRows","tableColumns","tableStyle","-","tableCells","tableCellBackground","tableCellVerticalAlign","tableCellHorizontalAlign","tableCellStyle"],tableInsertButtons:["tableBack","|"],tableResizerOffset:5,tableResizingLimit:30,tableColorsButtons:["tableBack","|"],tableColors:["#61BD6D","#1ABC9C","#54ACD2","#2C82C9","#9365B8","#475577","#CCCCCC","#41A85F","#00A885","#3D8EB9","#2969B0","#553982","#28324E","#000000","#F7DA64","#FBA026","#EB6B56","#E25041","#A38F84","#EFEFEF","#FFFFFF","#FAC51C","#F37934","#D14841","#B8312F","#7C706B","#D1D5D8","REMOVE"],tableColorsStep:7,tableCellStyles:{"fr-highlighted":"Highlighted","fr-thick":"Thick"},tableStyles:{"fr-dashed-borders":"Dashed Borders","fr-alternate-rows":"Alternate Rows"},tableCellMultipleStyles:!0,tableMultipleStyles:!0,tableInsertHelper:!0,tableInsertHelperOffset:15}),a.FE.PLUGINS.table=function(b){function c(){var a=b.$tb.find('.fr-command[data-cmd="insertTable"]'),c=b.popups.get("table.insert");if(c||(c=g()),!c.hasClass("fr-active")){b.popups.refresh("table.insert"),b.popups.setContainer("table.insert",b.$tb);var d=a.offset().left+a.outerWidth()/2,e=a.offset().top+(b.opts.toolbarBottom?10:a.outerHeight()-10);b.popups.show("table.insert",d,e,a.outerHeight())}}function d(){var c=B();if(c){var d=b.popups.get("table.edit");d||(d=i()),b.popups.setContainer("table.edit",a(b.opts.scrollableContainer));var e=I(c),f=(e.left+e.right)/2,g=e.bottom;if(b.popups.show("table.edit",f,g,e.bottom-e.top),b.$el.find(".fr-selected-cell").length>1){b.toolbar.disable(),b.$el.removeClass("fr-no-selection"),b.edit.on();var h=a(b.o_win).scrollTop();b.$el.focus(),b.selection.setAtEnd(b.$el.find(".fr-selected-cell:last").get(0)),b.selection.restore(),a(b.o_win).scrollTop(h),b.button.bulkRefresh()}}}function e(){var c=B();if(c){var d=b.popups.get("table.colors");d||(d=j()),b.popups.setContainer("table.colors",a(b.opts.scrollableContainer));var e=I(c),f=(e.left+e.right)/2,g=e.bottom;l(),b.popups.show("table.colors",f,g,e.bottom-e.top)}}function f(){0===b.$el.get(0).querySelectorAll(".fr-selected-cell").length&&b.toolbar.enable()}function g(c){if(c)return b.popups.onHide("table.insert",function(){b.popups.get("table.insert").find('.fr-table-size .fr-select-table-size > span[data-row="1"][data-col="1"]').trigger("mouseenter")}),!0;var d="";b.opts.tableInsertButtons.length>0&&(d='<div class="fr-buttons">'+b.button.buildList(b.opts.tableInsertButtons)+"</div>");var e={buttons:d,rows_columns:h()},f=b.popups.create("table.insert",e);return b.events.$on(f,"mouseenter",".fr-table-size .fr-select-table-size .fr-table-cell",function(c){var d=a(c.currentTarget),e=d.data("row"),f=d.data("col"),g=d.parent();g.siblings(".fr-table-size-info").html(e+" &times; "+f),g.find("> span").removeClass("hover");for(var h=1;h<=b.opts.tableInsertMaxSize;h++)for(var i=0;i<=b.opts.tableInsertMaxSize;i++){var j=g.find('> span[data-row="'+h+'"][data-col="'+i+'"]');e>=h&&f>=i?j.addClass("hover"):e+1>=h||2>=h&&!b.helpers.isMobile()?j.css("display","inline-block"):h>2&&!b.helpers.isMobile()&&j.css("display","none")}},!0),f}function h(){for(var a='<div class="fr-table-size"><div class="fr-table-size-info">1 &times; 1</div><div class="fr-select-table-size">',c=1;c<=b.opts.tableInsertMaxSize;c++){for(var d=1;d<=b.opts.tableInsertMaxSize;d++){var e="inline-block";c>2&&!b.helpers.isMobile()&&(e="none");var f="fr-table-cell ";1==c&&1==d&&(f+=" hover"),a+='<span class="fr-command '+f+'" data-cmd="tableInsert" data-row="'+c+'" data-col="'+d+'" data-param1="'+c+'" data-param2="'+d+'" style="display: '+e+';"><span></span></span>'}a+='<div class="new-line"></div>'}return a+="</div></div>"}function i(a){if(a)return b.popups.onHide("table.edit",f),!0;var c="";b.opts.tableEditButtons.length>0&&(c='<div class="fr-buttons">'+b.button.buildList(b.opts.tableEditButtons)+"</div>");var e={buttons:c},g=b.popups.create("table.edit",e);return b.events.$on(b.$wp,"scroll.table-edit",function(){b.popups.isVisible("table.edit")&&d()}),g}function j(){var a="";b.opts.tableColorsButtons.length>0&&(a='<div class="fr-buttons fr-table-colors-buttons">'+b.button.buildList(b.opts.tableColorsButtons)+"</div>");var c={buttons:a,colors:k()},d=b.popups.create("table.colors",c);return b.events.$on(b.$wp,"scroll.table-colors",function(){b.popups.isVisible("table.colors")&&e()}),d}function k(){for(var a='<div class="fr-table-colors">',c=0;c<b.opts.tableColors.length;c++)0!==c&&c%b.opts.tableColorsStep===0&&(a+="<br>"),a+="REMOVE"!=b.opts.tableColors[c]?'<span class="fr-command" style="background: '+b.opts.tableColors[c]+';" data-cmd="tableCellBackgroundColor" data-param1="'+b.opts.tableColors[c]+'"></span>':'<span class="fr-command" data-cmd="tableCellBackgroundColor" data-param1="REMOVE" title="'+b.language.translate("Clear Formatting")+'"><i class="fa fa-eraser"></i></span>';return a+="</div>"}function l(){var a=b.popups.get("table.colors"),c=b.$el.find(".fr-selected-cell:first");a.find(".fr-selected-color").removeClass("fr-selected-color"),a.find('span[data-param1="'+b.helpers.RGBToHex(c.css("background-color"))+'"]').addClass("fr-selected-color")}function m(c,d){var e,f,g='<table style="width: 100%;"><tbody>',h=100/d;for(e=0;c>e;e++){for(g+="<tr>",f=0;d>f;f++)g+='<td style="width: '+h.toFixed(4)+'%;">',0===e&&0===f&&(g+=a.FE.MARKERS),g+="<br></td>";g+="</tr>"}g+="</tbody></table>",b.html.insert(g),b.selection.restore()}function n(){if(b.$el.find(".fr-selected-cell").length>0){var a=b.$el.find(".fr-selected-cell").closest("table");b.selection.setBefore(a.get(0))||b.selection.setAfter(a.get(0)),b.selection.restore(),b.popups.hide("table.edit"),a.remove()}}function o(){var c=b.$el.find(".fr-selected-cell").closest("table");if(c.length>0&&0===c.find("th").length){var e,f="<thead><tr>",g=0;for(c.find("tr:first > td").each(function(){var b=a(this);g+=parseInt(b.attr("colspan"),10)||1}),e=0;g>e;e++)f+="<th><br></th>";f+="</tr></thead>",c.prepend(f),d()}}function p(){var a=b.$el.find(".fr-selected-cell").closest("table"),c=a.find("thead");if(c.length>0)if(0===a.find("tbody tr").length)n();else if(c.remove(),b.$el.find(".fr-selected-cell").length>0)d();else{b.popups.hide("table.edit");var e=a.find("tbody tr:first td:first").get(0);e&&(b.selection.setAtEnd(e),b.selection.restore())}}function q(c){var e=b.$el.find(".fr-selected-cell").closest("table");if(e.length>0){if(b.$el.find("th.fr-selected-cell").length>0&&"above"==c)return;var f,g,h=B(),i=G(h);g="above"==c?i.min_i:i.max_i;var j="<tr>";for(f=0;f<h[g].length;f++)if("below"==c&&g<h.length-1&&h[g][f]==h[g+1][f]||"above"==c&&g>0&&h[g][f]==h[g-1][f]){if(0===f||f>0&&h[g][f]!=h[g][f-1]){var k=a(h[g][f]);k.attr("rowspan",parseInt(k.attr("rowspan"),10)+1)}}else j+="<td><br></td>";j+="</tr>";var l=a(e.find("tr").not(e.find("table tr")).get(g));"below"==c?l.after(j):"above"==c&&(l.before(j),b.popups.isVisible("table.edit")&&d())}}function r(){var c=b.$el.find(".fr-selected-cell").closest("table");if(c.length>0){var d,e,f,g=B(),h=G(g);if(0===h.min_i&&h.max_i==g.length-1)n();else{for(d=h.max_i;d>=h.min_i;d--){for(f=a(c.find("tr").not(c.find("table tr")).get(d)),e=0;e<g[d].length;e++)if(0===e||g[d][e]!=g[d][e-1]){var i=a(g[d][e]);if(parseInt(i.attr("rowspan"),10)>1){var j=parseInt(i.attr("rowspan"),10)-1;1==j?i.removeAttr("rowspan"):i.attr("rowspan",j)}if(d<g.length-1&&g[d][e]==g[d+1][e]&&(0===d||g[d][e]!=g[d-1][e])){for(var k=g[d][e],l=e;l>0&&g[d][l]==g[d][l-1];)l--;0===l?a(c.find("tr").not(c.find("table tr")).get(d+1)).prepend(k):a(g[d+1][l-1]).after(k)}}var m=f.parent();f.remove(),0===m.find("tr").length&&m.remove(),g=B(c)}h.min_i>0?b.selection.setAtEnd(g[h.min_i-1][0]):b.selection.setAtEnd(g[0][0]),b.selection.restore(),b.popups.hide("table.edit")}}}function s(c){var e=b.$el.find(".fr-selected-cell").closest("table");if(e.length>0){var f,g=B(),h=G(g);f="before"==c?h.min_j:h.max_j;var i,j=100/g[0].length,k=100/(g[0].length+1);e.find("th, td").each(function(){i=a(this),i.data("old-width",i.outerWidth()/e.outerWidth()*100)}),e.find("tr").not(e.find("table tr")).each(function(b){for(var d,e=a(this),h=0,i=0;f>h-1;){if(d=e.find("> th, > td").get(i),!d){d=null;break}d==g[b][h]?(h+=parseInt(a(d).attr("colspan"),10)||1,i++):(h+=parseInt(a(g[b][h]).attr("colspan"),10)||1,"after"==c&&(d=0===i?-1:e.find("> th, > td").get(i-1)))}var l=a(d);if("after"==c&&h-1>f||"before"==c&&f>0&&g[b][f]==g[b][f-1]){if(0===b||b>0&&g[b][f]!=g[b-1][f]){var m=parseInt(l.attr("colspan"),10)+1;l.attr("colspan",m),l.css("width",(l.data("old-width")*k/j+k).toFixed(4)+"%"),l.removeData("old-width")}}else{var n;n=e.find("th").length>0?'<th style="width: '+k.toFixed(4)+'%;"><br></th>':'<td style="width: '+k.toFixed(4)+'%;"><br></td>',-1==d?e.prepend(n):null==d?e.append(n):"before"==c?l.before(n):"after"==c&&l.after(n)}}),e.find("th, td").each(function(){i=a(this),i.data("old-width")&&(i.css("width",(i.data("old-width")*k/j).toFixed(4)+"%"),i.removeData("old-width"))}),b.popups.isVisible("table.edit")&&d()}}function t(){var c=b.$el.find(".fr-selected-cell").closest("table");if(c.length>0){var d,e,f,g=B(),h=G(g);if(0===h.min_j&&h.max_j==g[0].length-1)n();else{var i=100/g[0].length,j=100/(g[0].length-h.max_j+h.min_j-1);for(c.find("th, td").each(function(){f=a(this),f.hasClass("fr-selected-cell")||f.data("old-width",f.outerWidth()/c.outerWidth()*100)}),e=h.max_j;e>=h.min_j;e--)for(d=0;d<g.length;d++)if(0===d||g[d][e]!=g[d-1][e])if(f=a(g[d][e]),parseInt(f.attr("colspan"),10)>1){var k=parseInt(f.attr("colspan"),10)-1;1==k?f.removeAttr("colspan"):f.attr("colspan",k),f.css("width",((f.data("old-width")-Z(e,g))*j/i).toFixed(4)+"%"),f.removeData("old-width")}else{var l=a(f.parent().get(0));f.remove(),0===l.find("> th, > td").length&&(0===l.prev().length||0===l.next().length||l.prev().find("> th[rowspan], > td[rowspan]").length<l.prev().find("> th, > td").length)&&l.remove()}h.min_j>0?b.selection.setAtEnd(g[h.min_i][h.min_j-1]):b.selection.setAtEnd(g[h.min_i][0]),b.selection.restore(),b.popups.hide("table.edit"),c.find("th, td").each(function(){f=a(this),f.data("old-width")&&(f.css("width",(f.data("old-width")*j/i).toFixed(4)+"%"),f.removeData("old-width"))})}}}function u(){if(b.$el.find(".fr-selected-cell").length>1&&(0===b.$el.find("th.fr-selected-cell").length||0===b.$el.find("td.fr-selected-cell").length)){var c,e,f,g=B(),h=G(g),i=b.$el.find(".fr-selected-cell"),j=a(i[0]),k=j.parent(),l=k.find(".fr-selected-cell"),m=j.closest("table"),n=j.html(),o=0;for(c=0;c<l.length;c++)o+=a(l[c]).outerWidth();for(j.css("width",(o/k.outerWidth()*100).toFixed(4)+"%"),h.min_j<h.max_j&&j.attr("colspan",h.max_j-h.min_j+1),h.min_i<h.max_i&&j.attr("rowspan",h.max_i-h.min_i+1),c=1;c<i.length;c++)e=a(i[c]),"<br>"!=e.html()&&""!==e.html()&&(n+="<br>"+e.html()),e.remove();j.html(n),b.selection.setAtEnd(j.get(0)),b.selection.restore(),b.toolbar.enable();var p=m.find("tr:empty");for(c=p.length-1;c>=0;c--)f=a(p[c]),(0===f.prev().length||0===f.next().length||f.prev().find("> th[rowspan], > td[rowspan]").length<f.prev().find("> th, > td").length)&&f.remove();d()}}function v(){if(1==b.$el.find(".fr-selected-cell").length){var c=b.$el.find(".fr-selected-cell"),d=c.parent(),e=c.closest("table"),f=parseInt(c.attr("rowspan"),10),g=B(),h=C(c.get(0),g),i=c.clone().html("<br>");if(f>1){var j=Math.ceil(f/2);j>1?c.attr("rowspan",j):c.removeAttr("rowspan"),f-j>1?i.attr("rowspan",f-j):i.removeAttr("rowspan");for(var k=h.row+j,l=0===h.col?h.col:h.col-1;l>=0&&(g[k][l]==g[k][l-1]||k>0&&g[k][l]==g[k-1][l]);)l--;-1==l?a(e.find("tr").not(e.find("table tr")).get(k)).prepend(i):a(g[k][l]).after(i)}else{var m,n=a("<tr>").append(i);for(m=0;m<g[0].length;m++)if(0===m||g[h.row][m]!=g[h.row][m-1]){var o=a(g[h.row][m]);o.is(c)||o.attr("rowspan",(parseInt(o.attr("rowspan"),10)||1)+1)}d.after(n)}E(),b.popups.hide("table.edit")}}function w(){if(1==b.$el.find(".fr-selected-cell").length){var c=b.$el.find(".fr-selected-cell"),d=parseInt(c.attr("colspan"),10)||1,e=c.parent().outerWidth(),f=c.outerWidth(),g=c.clone().html("<br>"),h=B(),i=C(c.get(0),h);if(d>1){var j=Math.ceil(d/2);f=$(i.col,i.col+j-1,h)/e*100;var k=$(i.col+j,i.col+d-1,h)/e*100;j>1?c.attr("colspan",j):c.removeAttr("colspan"),d-j>1?g.attr("colspan",d-j):g.removeAttr("colspan"),c.css("width",f.toFixed(4)+"%"),g.css("width",k.toFixed(4)+"%")}else{var l;for(l=0;l<h.length;l++)if(0===l||h[l][i.col]!=h[l-1][i.col]){var m=a(h[l][i.col]);if(!m.is(c)){var n=(parseInt(m.attr("colspan"),10)||1)+1;m.attr("colspan",n)}}f=f/e*100/2,c.css("width",f.toFixed(4)+"%"),g.css("width",f.toFixed(4)+"%")}c.after(g),E(),b.popups.hide("table.edit")}}function x(a){"REMOVE"!=a?b.$el.find(".fr-selected-cell").css("background-color",b.helpers.HEXtoRGB(a)):b.$el.find(".fr-selected-cell").css("background-color","")}function y(a){b.$el.find(".fr-selected-cell").css("vertical-align",a)}function z(a){b.$el.find(".fr-selected-cell").css("text-align",a)}function A(a,b,c,d){if(b.length>0){if(!c){var e=Object.keys(d);e.splice(e.indexOf(a),1),b.removeClass(e.join(" "))}b.toggleClass(a)}}function B(c){c=c||null;var d=[];if(null==c&&b.$el.find(".fr-selected-cell").length>0&&(c=b.$el.find(".fr-selected-cell").closest("table")),c){var e=a(c);return e.find("tr").not(e.find("table tr")).each(function(b,c){var e=a(c),f=0;e.find("> th, > td").each(function(c,e){for(var g=a(e),h=parseInt(g.attr("colspan"),10)||1,i=parseInt(g.attr("rowspan"),10)||1,j=b;b+i>j;j++)for(var k=f;f+h>k;k++)d[j]||(d[j]=[]),d[j][k]?f++:d[j][k]=e;f+=h})}),d}}function C(a,b){for(var c=0;c<b.length;c++)for(var d=0;d<b[c].length;d++)if(b[c][d]==a)return{row:c,col:d}}function D(a,b,c){for(var d=a+1,e=b+1;d<c.length;){if(c[d][b]!=c[a][b]){d--;break}d++}for(d==c.length&&d--;e<c[a].length;){if(c[a][e]!=c[a][b]){e--;break}e++}return e==c[a].length&&e--,{row:d,col:e}}function E(){var c=b.$el.find(".fr-selected-cell");c.length>0&&c.each(function(){var b=a(this);b.removeClass("fr-selected-cell"),""===b.attr("class")&&b.removeAttr("class")})}function F(){setTimeout(function(){b.selection.clear(),b.$el.addClass("fr-no-selection"),b.edit.off(),b.$el.blur()},0)}function G(a){var c,d=a.length,e=0,f=a[0].length,g=0,h=b.$el.find(".fr-selected-cell");for(c=0;c<h.length;c++){var i=C(h[c],a),j=D(i.row,i.col,a);d=Math.min(i.row,d),e=Math.max(j.row,e),f=Math.min(i.col,f),g=Math.max(j.col,g)}return{min_i:d,max_i:e,min_j:f,max_j:g}}function H(b,c,d,e,f){var g,h,i,j,k=b,l=c,m=d,n=e;for(g=k;l>=g;g++)((parseInt(a(f[g][m]).attr("rowspan"),10)||1)>1||(parseInt(a(f[g][m]).attr("colspan"),10)||1)>1)&&(i=C(f[g][m],f),j=D(i.row,i.col,f),k=Math.min(i.row,k),l=Math.max(j.row,l),m=Math.min(i.col,m),n=Math.max(j.col,n)),((parseInt(a(f[g][n]).attr("rowspan"),10)||1)>1||(parseInt(a(f[g][n]).attr("colspan"),10)||1)>1)&&(i=C(f[g][n],f),j=D(i.row,i.col,f),k=Math.min(i.row,k),l=Math.max(j.row,l),m=Math.min(i.col,m),n=Math.max(j.col,n));for(h=m;n>=h;h++)((parseInt(a(f[k][h]).attr("rowspan"),10)||1)>1||(parseInt(a(f[k][h]).attr("colspan"),10)||1)>1)&&(i=C(f[k][h],f),j=D(i.row,i.col,f),k=Math.min(i.row,k),l=Math.max(j.row,l),m=Math.min(i.col,m),n=Math.max(j.col,n)),((parseInt(a(f[l][h]).attr("rowspan"),10)||1)>1||(parseInt(a(f[l][h]).attr("colspan"),10)||1)>1)&&(i=C(f[l][h],f),j=D(i.row,i.col,f),k=Math.min(i.row,k),l=Math.max(j.row,l),m=Math.min(i.col,m),n=Math.max(j.col,n));return k==b&&l==c&&m==d&&n==e?{min_i:b,max_i:c,min_j:d,max_j:e}:H(k,l,m,n,f)}function I(b){var c=G(b),d=a(b[c.min_i][c.min_j]),e=a(b[c.min_i][c.max_j]),f=a(b[c.max_i][c.min_j]),g=d.offset().left,h=e.offset().left+e.outerWidth(),i=d.offset().top,j=f.offset().top+f.outerHeight();return{left:g,right:h,top:i,bottom:j}}function J(b,c){if(a(b).is(c))E(),a(b).addClass("fr-selected-cell");else{F();var d=B(),e=C(b,d),f=C(c,d),g=H(Math.min(e.row,f.row),Math.max(e.row,f.row),Math.min(e.col,f.col),Math.max(e.col,f.col),d);E();for(var h=g.min_i;h<=g.max_i;h++)for(var i=g.min_j;i<=g.max_j;i++)a(d[h][i]).addClass("fr-selected-cell")}}function K(c){var d=null,e=a(c.target);return"TD"==c.target.tagName||"TH"==c.target.tagName?d=c.target:e.closest("td").length>0?d=e.closest("td").get(0):e.closest("th").length>0&&(d=e.closest("th").get(0)),0===b.$el.find(d).length?null:d}function L(c){if(b.$el.find(".fr-selected-cell").length>0&&!c.shiftKey&&(E(),b.$el.removeClass("fr-no-selection"),b.edit.on()),1==c.which){ia=!0;var d=K(c);if(d){b.popups.hide("table.edit"),c.stopPropagation(),b.events.trigger("image.hideResizer"),b.events.trigger("video.hideResizer"),ha=!0;var e=d.tagName.toLowerCase();c.shiftKey&&b.$el.find(e+".fr-selected-cell").length>0?a(b.$el.find(e+".fr-selected-cell").closest("table")).is(a(d).closest("table"))?J(ja,d):F():((b.keys.ctrlKey(c)||c.shiftKey)&&F(),ja=d,J(ja,ja))}}}function M(c){if(1==c.which){if(ia=!1,ha){ha=!1;var e=K(c);e||1!=b.$el.find(".fr-selected-cell").length?b.$el.find(".fr-selected-cell").length>0&&(b.selection.isCollapsed()?d():E()):E()}else b.$tb.is(c.target)||b.$tb.is(a(c.target).closest(b.$tb.get(0)))||(b.$el.get(0).querySelectorAll(".fr-selected-cell").length>0&&b.toolbar.enable(),E());if(la){la=!1,fa.removeClass("fr-moving"),b.$el.removeClass("fr-no-selection"),b.edit.on();var f=parseFloat(fa.css("left"))+b.opts.tableResizerOffset;b.opts.iframe&&(f-=b.$iframe.offset().left),fa.data("release-position",f),fa.removeData("max-left"),fa.removeData("max-right"),Y(c),Q()}}}function N(c){if(ha===!0){var d=a(c.currentTarget);if(d.closest("table").is(b.$el.find(".fr-selected-cell").closest("table"))){if("TD"==c.currentTarget.tagName&&0===b.$el.find("th.fr-selected-cell").length)return void J(ja,c.currentTarget);if("TH"==c.currentTarget.tagName&&0===b.$el.find("td.fr-selected-cell").length)return void J(ja,c.currentTarget)}F()}}function O(a){(37==a.which||38==a.which||39==a.which||40==a.which)&&b.$el.find(".fr-selected-cell").length>0&&(E(),b.popups.hide("table.edit"))}function P(){b.shared.$table_resizer||(b.shared.$table_resizer=a('<div class="fr-table-resizer"><div></div></div>')),fa=b.shared.$table_resizer,b.events.$on(fa,"mousedown",function(){return b.core.sameInstance(fa)?(la=!0,fa.addClass("fr-moving"),E(),F(),fa.find("div").css("opacity",1),!1):!0}),b.events.$on(fa,"mousemove",function(a){return b.core.sameInstance(fa)?void(la&&(b.opts.iframe&&(a.pageX-=b.$iframe.offset().left),_(a))):!0}),b.events.on("shared.destroy",function(){fa.html("").removeData().remove()},!0),b.events.on("destroy",function(){b.$el.find(".fr-selected-cell").removeClass("fr-selected-cell"),fa.hide().appendTo(a("body"))},!0)}function Q(){fa&&(fa.find("div").css("opacity",0),fa.css("top",0),fa.css("left",0),fa.css("height",0),fa.find("div").css("height",0),fa.hide())}function R(){ga&&ga.removeClass("fr-visible").css("left","-9999px")}function S(c,d){var e=a(d),f=e.closest("table");if(d&&"TD"!=d.tagName&&"TH"!=d.tagName&&(e.closest("td").length>0?d=e.closest("td"):e.closest("th").length>0&&(d=e.closest("th"))),!d||"TD"!=d.tagName&&"TH"!=d.tagName)fa&&e.get(0)!=fa.get(0)&&e.parent().get(0)!=fa.get(0)&&b.core.sameInstance(fa)&&Q();else{if(e=a(d),0===b.$el.find(e).length)return!1;var g=e.offset().left-1,h=g+e.outerWidth();if(Math.abs(c.pageX-g)<=b.opts.tableResizerOffset||Math.abs(h-c.pageX)<=b.opts.tableResizerOffset){var i,j,k,l,m,n=B(f),o=C(d,n),p=D(o.row,o.col,n),q=f.offset().top,r=f.outerHeight()-1;if(o.col>0&&c.pageX-g<=b.opts.tableResizerOffset){k=g;var s=a(n[o.row][o.col-1]);l=1==(parseInt(s.attr("colspan"),10)||1)?s.offset().left-1+b.opts.tableResizingLimit:g-Z(o.col-1,n)+b.opts.tableResizingLimit,m=1==(parseInt(e.attr("colspan"),10)||1)?g+e.outerWidth()-b.opts.tableResizingLimit:g+Z(o.col,n)-b.opts.tableResizingLimit,i=o.col-1,j=o.col}else if(h-c.pageX<=b.opts.tableResizerOffset)if(k=h,p.col<n[p.row].length&&n[p.row][p.col+1]){var t=a(n[p.row][p.col+1]);l=1==(parseInt(e.attr("colspan"),10)||1)?g+b.opts.tableResizingLimit:h-Z(p.col,n)+b.opts.tableResizingLimit,m=1==(parseInt(t.attr("colspan"),10)||1)?h+t.outerWidth()-b.opts.tableResizingLimit:h+Z(o.col+1,n)-b.opts.tableResizingLimit,i=p.col,j=p.col+1}else{i=p.col,j=null;var u=f.parent();l=f.offset().left-1+n[0].length*b.opts.tableResizingLimit,m=u.offset().left-1+u.width()+parseFloat(u.css("padding-left"))}fa||P(),fa.data("table",f),fa.data("first",i),fa.data("second",j),fa.data("instance",b),b.$wp.append(fa);var v=k-b.win.pageXOffset-b.opts.tableResizerOffset,w=q-b.win.pageYOffset;b.opts.iframe&&(v+=b.$iframe.offset().left-a(b.o_win).scrollLeft(),w+=b.$iframe.offset().top-a(b.o_win).scrollTop(),l+=b.$iframe.offset().left,m+=b.$iframe.offset().left),fa.data("max-left",l),fa.data("max-right",m),fa.data("origin",k-b.win.pageXOffset),fa.css("top",w),fa.css("left",v),fa.css("height",r),fa.find("div").css("height",r),fa.css("padding-left",b.opts.tableResizerOffset),fa.css("padding-right",b.opts.tableResizerOffset),fa.show()}else b.core.sameInstance(fa)&&Q()}}function T(c,d){if(b.$box.find(".fr-line-breaker").is(":visible"))return!1;ga||ca(),b.$box.append(ga),ga.data("instance",b);var e=a(d),f=e.find("tr:first"),g=c.pageX,h=0,i=0;b.opts.iframe&&(h+=b.$iframe.offset().left-a(b.o_win).scrollLeft(),i+=b.$iframe.offset().top-a(b.o_win).scrollTop());var j;f.find("th, td").each(function(){var c=a(this);return c.offset().left<=g&&g<c.offset().left+c.outerWidth()/2?(j=parseInt(ga.find("a").css("width"),10),ga.css("top",i+c.offset().top-b.win.pageYOffset-j-5),ga.css("left",h+c.offset().left-b.win.pageXOffset-j/2),ga.data("selected-cell",c),ga.data("position","before"),ga.addClass("fr-visible"),!1):c.offset().left+c.outerWidth()/2<=g&&g<c.offset().left+c.outerWidth()?(j=parseInt(ga.find("a").css("width"),10),ga.css("top",i+c.offset().top-b.win.pageYOffset-j-5),ga.css("left",h+c.offset().left+c.outerWidth()-b.win.pageXOffset-j/2),ga.data("selected-cell",c),ga.data("position","after"),ga.addClass("fr-visible"),!1):void 0})}function U(c,d){if(b.$box.find(".fr-line-breaker").is(":visible"))return!1;ga||ca(),b.$box.append(ga),ga.data("instance",b);var e=a(d),f=c.pageY,g=0,h=0;b.opts.iframe&&(g+=b.$iframe.offset().left-a(b.o_win).scrollLeft(),h+=b.$iframe.offset().top-a(b.o_win).scrollTop());var i;e.find("tr").each(function(){var c=a(this);return c.offset().top<=f&&f<c.offset().top+c.outerHeight()/2?(i=parseInt(ga.find("a").css("width"),10),ga.css("top",h+c.offset().top-b.win.pageYOffset-i/2),ga.css("left",g+c.offset().left-b.win.pageXOffset-i-5),ga.data("selected-cell",c.find("td:first")),ga.data("position","above"),ga.addClass("fr-visible"),!1):c.offset().top+c.outerHeight()/2<=f&&f<c.offset().top+c.outerHeight()?(i=parseInt(ga.find("a").css("width"),10),ga.css("top",h+c.offset().top+c.outerHeight()-b.win.pageYOffset-i/2),ga.css("left",g+c.offset().left-b.win.pageXOffset-i-5),ga.data("selected-cell",c.find("td:first")),ga.data("position","below"),ga.addClass("fr-visible"),!1):void 0})}function V(c,d){if(0===b.$el.find(".fr-selected-cell").length){var e,f,g;if(d&&("HTML"==d.tagName||"BODY"==d.tagName||b.node.isElement(d)))for(e=1;e<=b.opts.tableInsertHelperOffset;e++){if(f=b.doc.elementFromPoint(c.pageX-b.win.pageXOffset,c.pageY-b.win.pageYOffset+e),a(f).hasClass("fr-tooltip"))return!0;if(f&&("TH"==f.tagName||"TD"==f.tagName||"TABLE"==f.tagName)&&a(f).parents(b.$wp).length)return T(c,f.closest("table")),!0;if(g=b.doc.elementFromPoint(c.pageX-b.win.pageXOffset+e,c.pageY-b.win.pageYOffset),a(g).hasClass("fr-tooltip"))return!0;if(g&&("TH"==g.tagName||"TD"==g.tagName||"TABLE"==g.tagName)&&a(g).parents(b.$wp).length)return U(c,g.closest("table")),!0}b.core.sameInstance(ga)&&R()}}function W(a){ka=null;var c=b.doc.elementFromPoint(a.pageX-b.win.pageXOffset,a.pageY-b.win.pageYOffset);(!b.popups.areVisible()||b.popups.areVisible()&&b.popups.isVisible("table.edit"))&&S(a,c),b.popups.areVisible()||b.$tb.hasClass("fr-inline")&&b.$tb.is(":visible")||V(a,c)}function X(){if(la){var c=fa.data("table"),d=c.offset().top-b.win.pageYOffset;b.opts.iframe&&(d+=b.$iframe.offset().top-a(b.o_win).scrollTop()),fa.css("top",d)}}function Y(){var c=fa.data("origin"),d=fa.data("release-position");if(c!==d){var e=fa.data("first"),f=fa.data("second"),g=fa.data("table"),h=g.outerWidth();if(null!==e&&null!==f){var i,j,k,l=B(g),m=[],n=[],o=[],p=[];for(i=0;i<l.length;i++)j=a(l[i][e]),k=a(l[i][f]),m[i]=j.outerWidth(),o[i]=k.outerWidth(),n[i]=m[i]/h*100,p[i]=o[i]/h*100;for(i=0;i<l.length;i++){j=a(l[i][e]),k=a(l[i][f]);var q=(n[i]*(m[i]+d-c)/m[i]).toFixed(4);j.css("width",q+"%"),k.css("width",(n[i]+p[i]-q).toFixed(4)+"%")}}else{var r,s=g.parent(),t=h/s.width()*100;r=null==e?(h-d+c)/h*t:(h+d-c)/h*t,g.css("width",Math.round(r).toFixed(4)+"%")}}fa.removeData("origin"),fa.removeData("release-position"),fa.removeData("first"),fa.removeData("second"),fa.removeData("table"),b.undo.saveStep()}function Z(b,c){var d,e=a(c[0][b]).outerWidth();for(d=1;d<c.length;d++)e=Math.min(e,a(c[d][b]).outerWidth());return e}function $(a,b,c){var d,e=0;for(d=a;b>=d;d++)e+=Z(d,c);return e}function _(a){if(b.$el.find(".fr-selected-cell").length>1&&ia&&F(),ia===!1&&ha===!1&&la===!1)ka&&clearTimeout(ka),ka=setTimeout(W,30,a);else if(la){var c=a.pageX-b.win.pageXOffset;b.opts.iframe&&(c+=b.$iframe.offset().left);var d=fa.data("max-left"),e=fa.data("max-right");c>=d&&e>=c?fa.css("left",c-b.opts.tableResizerOffset):d>c&&parseFloat(fa.css("left"),10)>d-b.opts.tableResizerOffset?fa.css("left",d-b.opts.tableResizerOffset):c>e&&parseFloat(fa.css("left"),10)<e-b.opts.tableResizerOffset&&fa.css("left",e-b.opts.tableResizerOffset)}else ia&&R()}function aa(c){b.node.isEmpty(c.get(0))?c.prepend(a.FE.MARKERS):c.prepend(a.FE.START_MARKER).append(a.FE.END_MARKER)}function ba(c){var d=c.which;if(d==a.FE.KEYCODE.TAB&&0===b.opts.tabSpaces){var e;if(b.$el.find(".fr-selected-cell").length>0)e=b.$el.find(".fr-selected-cell:last");else{var f=b.selection.element();"TD"==f.tagName||"TH"==f.tagName?e=a(f):a(f).closest("td").length>0?e=a(f).closest("td"):a(f).closest("th").length>0&&(e=a(f).closest("th"))}e&&(c.preventDefault(),E(),b.popups.hide("table.edit"),c.shiftKey?e.prev().length>0?aa(e.prev()):e.closest("tr").length>0&&e.closest("tr").prev().length>0?aa(e.closest("tr").prev().find("td:last")):e.closest("tbody").length>0&&e.closest("table").find("thead tr").length>0&&aa(e.closest("table").find("thead tr th:last")):e.next().length>0?aa(e.next()):e.closest("tr").length>0&&e.closest("tr").next().length>0?aa(e.closest("tr").next().find("td:first")):e.closest("thead").length>0&&e.closest("table").find("tbody tr").length>0?aa(e.closest("table").find("tbody tr td:first")):(e.addClass("fr-selected-cell"),q("below"),E(),aa(e.closest("tr").next().find("td:first"))),b.selection.restore())}}function ca(){b.shared.$ti_helper||(b.shared.$ti_helper=a('<div class="fr-insert-helper"><a class="fr-floating-btn" role="button" tabindex="-1" title="'+b.language.translate("Insert")+'"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22,16.75 L16.75,16.75 L16.75,22 L15.25,22.000 L15.25,16.75 L10,16.75 L10,15.25 L15.25,15.25 L15.25,10 L16.75,10 L16.75,15.25 L22,15.25 L22,16.75 Z"/></svg></a></div>'),b.events.bindClick(b.shared.$ti_helper,"a",function(){var a=ga.data("selected-cell"),c=ga.data("position"),d=ga.data("instance")||b;"before"==c?(a.addClass("fr-selected-cell"),d.table.insertColumn(c),a.removeClass("fr-selected-cell")):"after"==c?(a.addClass("fr-selected-cell"),d.table.insertColumn(c),a.removeClass("fr-selected-cell")):"above"==c?(a.addClass("fr-selected-cell"),d.table.insertRow(c),a.removeClass("fr-selected-cell")):"below"==c&&(a.addClass("fr-selected-cell"),d.table.insertRow(c),a.removeClass("fr-selected-cell")),R()})),ga=b.shared.$ti_helper,b.tooltip.bind(b.$box,".fr-insert-helper > a.fr-floating-btn"),b.events.on("shared.destroy",function(){ga.html("").removeData().remove()},!0),b.events.$on(ga,"mousemove",function(a){a.stopPropagation()},!0),b.events.$on(a(b.win),"scroll",function(){R()},!0)}function da(){if(!b.$wp)return!1;if(!b.helpers.isMobile()){ia=!1,ha=!1,la=!1,b.events.$on(b.$el,"mousedown",L),b.popups.onShow("image.edit",function(){E(),ia=!1,ha=!1}),b.popups.onShow("link.edit",function(){E(),ia=!1,ha=!1}),b.events.on("commands.mousedown",function(a){a.parents(".fr-toolbar").length>0&&E()}),b.events.$on(b.$el,"mouseenter","th, td",N),b.events.$on(b.$win,"mouseup",M),b.opts.iframe&&b.events.$on(a(b.o_win),"mouseup",M),b.events.$on(b.$el,"keydown",O),b.events.$on(b.$win,"mousemove",_),b.events.$on(a(b.o_win),"scroll",X),b.events.on("contentChanged",function(){b.$el.find(".fr-selected-cell").length>0&&(d(),b.$el.find("img").on("load.selected-cells",function(){a(this).off("load.selected-cells"),b.$el.find(".fr-selected-cell").length>0&&d()}))}),b.events.$on(a(b.o_win),"resize",function(){E()}),b.events.on("keydown",function(c){if(b.$el.find(".fr-selected-cell").length>0){if(c.which==a.FE.KEYCODE.ESC&&b.popups.isVisible("table.edit"))return E(),b.popups.hide("table.edit"),c.preventDefault(),c.stopPropagation(),c.stopImmediatePropagation(),!1;if(b.$el.find(".fr-selected-cell").length>1)return c.preventDefault(),!1}},!0),b.events.$on(a(b.win),"keydown input keyup",d);var c;b.events.on("html.beforeGet",function(){c=b.$el.find(".fr-selected-cell"),c.removeClass("fr-selected-cell")}),b.events.on("html.get",function(a){return a=a.replace(/<(td|th)((?:[\w\W]*?)) class=""((?:[\w\W]*?))>((?:[\w\W]*?))<\/(td|th)>/g,"<$1$2$3>$4</$5>")}),b.events.on("html.afterGet",function(){c.addClass("fr-selected-cell")}),g(!0),i(!0)}b.events.on("keydown",ba,!0)}function ea(){b.$el.find(".fr-selected-cell").length>0?d():(b.popups.hide("table.insert"),b.toolbar.showInline())}var fa,ga,ha,ia,ja,ka,la;return{_init:da,insert:m,remove:n,insertRow:q,deleteRow:r,insertColumn:s,deleteColumn:t,mergeCells:u,splitCellVertically:w,splitCellHorizontally:v,addHeader:o,removeHeader:p,setBackground:x,showInsertPopup:c,showEditPopup:d,showColorsPopup:e,back:ea,verticalAlign:y,horizontalAlign:z,applyStyle:A}},a.FE.DefineIcon("insertTable",{NAME:"table"}),a.FE.RegisterCommand("insertTable",{title:"Insert Table",undo:!1,focus:!0,refreshOnCallback:!1,popup:!0,callback:function(){this.popups.isVisible("table.insert")?(this.$el.find(".fr-marker")&&(this.events.disableBlur(),this.selection.restore()),this.popups.hide("table.insert")):this.table.showInsertPopup()},plugin:"table"}),a.FE.RegisterCommand("tableInsert",{callback:function(a,b,c){this.table.insert(b,c),this.popups.hide("table.insert")}}),a.FE.DefineIcon("tableHeader",{NAME:"header"}),a.FE.RegisterCommand("tableHeader",{title:"Table Header",focus:!1,callback:function(){var a=this.popups.get("table.edit").find('.fr-command[data-cmd="tableHeader"]');a.hasClass("fr-active")?this.table.removeHeader():this.table.addHeader()},refresh:function(a){var b=this.$el.find(".fr-selected-cell").closest("table");b.length>0&&(0===b.find("th").length?a.removeClass("fr-active"):a.addClass("fr-active"))}}),a.FE.DefineIcon("tableRows",{NAME:"bars"}),a.FE.RegisterCommand("tableRows",{type:"dropdown",focus:!1,title:"Row",options:{above:"Insert row above",below:"Insert row below","delete":"Delete row"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.tableRows.options;for(var d in c)b+='<li><a class="fr-command" data-cmd="tableRows" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.language.translate(c[d])+"</a></li>";return b+="</ul>"},callback:function(a,b){"above"==b||"below"==b?this.table.insertRow(b):this.table.deleteRow()}}),a.FE.DefineIcon("tableColumns",{NAME:"bars fa-rotate-90"}),a.FE.RegisterCommand("tableColumns",{type:"dropdown",focus:!1,title:"Column",options:{before:"Insert column before",after:"Insert column after","delete":"Delete column"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.tableColumns.options;
for(var d in c)b+='<li><a class="fr-command" data-cmd="tableColumns" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.language.translate(c[d])+"</a></li>";return b+="</ul>"},callback:function(a,b){"before"==b||"after"==b?this.table.insertColumn(b):this.table.deleteColumn()}}),a.FE.DefineIcon("tableCells",{NAME:"square-o"}),a.FE.RegisterCommand("tableCells",{type:"dropdown",focus:!1,title:"Cell",options:{merge:"Merge cells","vertical-split":"Vertical split","horizontal-split":"Horizontal split"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.tableCells.options;for(var d in c)b+='<li><a class="fr-command" data-cmd="tableCells" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.language.translate(c[d])+"</a></li>";return b+="</ul>"},callback:function(a,b){"merge"==b?this.table.mergeCells():"vertical-split"==b?this.table.splitCellVertically():this.table.splitCellHorizontally()},refreshOnShow:function(a,b){this.$el.find(".fr-selected-cell").length>1?(b.find('a[data-param1="vertical-split"]').addClass("fr-disabled"),b.find('a[data-param1="horizontal-split"]').addClass("fr-disabled"),b.find('a[data-param1="merge"]').removeClass("fr-disabled")):(b.find('a[data-param1="merge"]').addClass("fr-disabled"),b.find('a[data-param1="vertical-split"]').removeClass("fr-disabled"),b.find('a[data-param1="horizontal-split"]').removeClass("fr-disabled"))}}),a.FE.DefineIcon("tableRemove",{NAME:"trash"}),a.FE.RegisterCommand("tableRemove",{title:"Remove Table",focus:!1,callback:function(){this.table.remove()}}),a.FE.DefineIcon("tableStyle",{NAME:"paint-brush"}),a.FE.RegisterCommand("tableStyle",{title:"Table Style",type:"dropdown",focus:!1,html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.tableStyles;for(var c in b)a+='<li><a class="fr-command" data-cmd="tableStyle" data-param1="'+c+'" title="'+this.language.translate(b[c])+'">'+this.language.translate(b[c])+"</a></li>";return a+="</ul>"},callback:function(a,b){this.table.applyStyle(b,this.$el.find(".fr-selected-cell").closest("table"),this.opts.tableMultipleStyles,this.opts.tableStyles)},refreshOnShow:function(b,c){var d=this.$el.find(".fr-selected-cell").closest("table");d&&c.find(".fr-command").each(function(){var b=a(this).data("param1");a(this).toggleClass("fr-active",d.hasClass(b))})}}),a.FE.DefineIcon("tableCellBackground",{NAME:"tint"}),a.FE.RegisterCommand("tableCellBackground",{title:"Cell Background",focus:!1,callback:function(){this.table.showColorsPopup()}}),a.FE.RegisterCommand("tableCellBackgroundColor",{undo:!0,focus:!1,callback:function(a,b){this.table.setBackground(b)}}),a.FE.DefineIcon("tableBack",{NAME:"arrow-left"}),a.FE.RegisterCommand("tableBack",{title:"Back",undo:!1,focus:!1,back:!0,callback:function(){this.table.back()},refresh:function(a){0!==this.$el.find(".fr-selected-cell").length||this.opts.toolbarInline?(a.removeClass("fr-hidden"),a.next(".fr-separator").removeClass("fr-hidden")):(a.addClass("fr-hidden"),a.next(".fr-separator").addClass("fr-hidden"))}}),a.FE.DefineIcon("tableCellVerticalAlign",{NAME:"arrows-v"}),a.FE.RegisterCommand("tableCellVerticalAlign",{type:"dropdown",focus:!1,title:"Vertical Align",options:{Top:"Align Top",Middle:"Align Middle",Bottom:"Align Bottom"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.tableCellVerticalAlign.options;for(var d in c)b+='<li><a class="fr-command" data-cmd="tableCellVerticalAlign" data-param1="'+d.toLowerCase()+'" title="'+this.language.translate(c[d])+'">'+this.language.translate(d)+"</a></li>";return b+="</ul>"},callback:function(a,b){this.table.verticalAlign(b)},refreshOnShow:function(a,b){b.find('.fr-command[data-param1="'+this.$el.find(".fr-selected-cell").css("vertical-align")+'"]').addClass("fr-active")}}),a.FE.DefineIcon("tableCellHorizontalAlign",{NAME:"align-left"}),a.FE.DefineIcon("align-left",{NAME:"align-left"}),a.FE.DefineIcon("align-right",{NAME:"align-right"}),a.FE.DefineIcon("align-center",{NAME:"align-center"}),a.FE.DefineIcon("align-justify",{NAME:"align-justify"}),a.FE.RegisterCommand("tableCellHorizontalAlign",{type:"dropdown",focus:!1,title:"Horizontal Align",options:{left:"Align Left",center:"Align Center",right:"Align Right",justify:"Align Justify"},html:function(){var b='<ul class="fr-dropdown-list">',c=a.FE.COMMANDS.tableCellHorizontalAlign.options;for(var d in c)b+='<li><a class="fr-command fr-title" data-cmd="tableCellHorizontalAlign" data-param1="'+d+'" title="'+this.language.translate(c[d])+'">'+this.icon.create("align-"+d)+"</a></li>";return b+="</ul>"},callback:function(a,b){this.table.horizontalAlign(b)},refresh:function(a){a.find("> *:first").replaceWith(this.icon.create("align-"+this.helpers.getAlignment(this.$el.find(".fr-selected-cell:first"))))},refreshOnShow:function(a,b){b.find('.fr-command[data-param1="'+this.helpers.getAlignment(this.$el.find(".fr-selected-cell:first"))+'"]').addClass("fr-active")}}),a.FE.DefineIcon("tableCellStyle",{NAME:"magic"}),a.FE.RegisterCommand("tableCellStyle",{title:"Cell Style",type:"dropdown",focus:!1,html:function(){var a='<ul class="fr-dropdown-list">',b=this.opts.tableCellStyles;for(var c in b)a+='<li><a class="fr-command" data-cmd="tableCellStyle" data-param1="'+c+'" title="'+this.language.translate(b[c])+'">'+this.language.translate(b[c])+"</a></li>";return a+="</ul>"},callback:function(a,b){this.table.applyStyle(b,this.$el.find(".fr-selected-cell"),this.opts.tableCellMultipleStyles,this.opts.tableCellStyles)},refreshOnShow:function(b,c){var d=this.$el.find(".fr-selected-cell:first");d&&c.find(".fr-command").each(function(){var b=a(this).data("param1");a(this).toggleClass("fr-active",d.hasClass(b))})}})});
/*!
 * froala_editor v2.2.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms
 * Copyright 2014-2016 Froala Labs
 */

!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=function(b,c){return void 0===c&&(c="undefined"!=typeof window?require("jquery"):require("jquery")(b)),a(c),c}:a(jQuery)}(function(a){"use strict";a.extend(a.FE.DEFAULTS,{}),a.FE.URLRegEx=/(\s|^|>)((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,3})?(:\d*)?(\/[^\s<]*)?)(\s|$|<)/gi,a.FE.PLUGINS.url=function(b){function c(d){d.each(function(){if("IFRAME"!=this.tagName)if(3==this.nodeType){var d=this.textContent.replace(/&nbsp;/gi,"");a.FE.URLRegEx.test(d)&&(a(this).before(d.replace(a.FE.URLRegEx,'$1<a href="$2">$2</a>$7')),a(this).remove())}else 1==this.nodeType&&["A","BUTTON","TEXTAREA"].indexOf(this.tagName)<0&&c(b.node.contents(this))})}function d(){b.events.on("paste.afterCleanup",function(b){return a.FE.URLRegEx.test(b)?b.replace(a.FE.URLRegEx,'$1<a href="$2">$2</a>$7'):void 0}),b.events.on("keyup",function(d){var e=d.which;(e==a.FE.KEYCODE.ENTER||e==a.FE.KEYCODE.SPACE)&&c(b.node.contents(b.$el.get(0)))}),b.events.on("keydown",function(c){var d=c.which;if(d==a.FE.KEYCODE.ENTER){var e=b.selection.element();if(("A"==e.tagName||a(e).parents("a").length)&&b.selection.info(e).atEnd)return c.stopImmediatePropagation(),"A"!==e.tagName&&(e=a(e).parents("a")[0]),a(e).after("&nbsp;"+a.FE.MARKERS),b.selection.restore(),!1}})}return{_init:d}}});
/*
 * jQuery File Download Plugin v1.4.3
 *
 * http://www.johnculviner.com
 *
 * Copyright (c) 2013 - John Culviner
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * !!!!NOTE!!!!
 * You must also write a cookie in conjunction with using this plugin as mentioned in the orignal post:
 * http://johnculviner.com/jquery-file-download-plugin-for-ajax-like-feature-rich-file-downloads/
 * !!!!NOTE!!!!
 */

(function($, window){
    // i'll just put them here to get evaluated on script load
    var htmlSpecialCharsRegEx = /[<>&\r\n"']/gm;
    var htmlSpecialCharsPlaceHolders = {
        '<': 'lt;',
        '>': 'gt;',
        '&': 'amp;',
        '\r': "#13;",
        '\n': "#10;",
        '"': 'quot;',
        "'": '#39;' /*single quotes just to be safe, IE8 doesn't support &apos;, so use &#39; instead */
    };

    $.extend({
        //
        //$.fileDownload('/path/to/url/', options)
        //  see directly below for possible 'options'
        fileDownload: function (fileUrl, options) {

            //provide some reasonable defaults to any unspecified options below
            var settings = $.extend({

                //
                //Requires jQuery UI: provide a message to display to the user when the file download is being prepared before the browser's dialog appears
                //
                preparingMessageHtml: null,

                //
                //Requires jQuery UI: provide a message to display to the user when a file download fails
                //
                failMessageHtml: null,

                //
                //the stock android browser straight up doesn't support file downloads initiated by a non GET: http://code.google.com/p/android/issues/detail?id=1780
                //specify a message here to display if a user tries with an android browser
                //if jQuery UI is installed this will be a dialog, otherwise it will be an alert
                //Set to null to disable the message and attempt to download anyway
                //
                androidPostUnsupportedMessageHtml: "Unfortunately your Android browser doesn't support this type of file download. Please try again with a different browser.",

                //
                //Requires jQuery UI: options to pass into jQuery UI Dialog
                //
                dialogOptions: { modal: true },

                //
                //a function to call while the dowload is being prepared before the browser's dialog appears
                //Args:
                //  url - the original url attempted
                //
                prepareCallback: function (url) { },

                //
                //a function to call after a file download dialog/ribbon has appeared
                //Args:
                //  url - the original url attempted
                //
                successCallback: function (url) { },

                //
                //a function to call after a file download dialog/ribbon has appeared
                //Args:
                //  responseHtml    - the html that came back in response to the file download. this won't necessarily come back depending on the browser.
                //                      in less than IE9 a cross domain error occurs because 500+ errors cause a cross domain issue due to IE subbing out the
                //                      server's error message with a "helpful" IE built in message
                //  url             - the original url attempted
                //
                failCallback: function (responseHtml, url) { },

                //
                // the HTTP method to use. Defaults to "GET".
                //
                httpMethod: "GET",

                //
                // if specified will perform a "httpMethod" request to the specified 'fileUrl' using the specified data.
                // data must be an object (which will be $.param serialized) or already a key=value param string
                //
                data: null,

                //
                //a period in milliseconds to poll to determine if a successful file download has occured or not
                //
                checkInterval: 100,

                //
                //the cookie name to indicate if a file download has occured
                //
                cookieName: "fileDownload",

                //
                //the cookie value for the above name to indicate that a file download has occured
                //
                cookieValue: "true",

                //
                //the cookie path for above name value pair
                //
                cookiePath: "/",

                //
                //if specified it will be used when attempting to clear the above name value pair
                //useful for when downloads are being served on a subdomain (e.g. downloads.example.com)
                //
                cookieDomain: null,

                //
                //the title for the popup second window as a download is processing in the case of a mobile browser
                //
                popupWindowTitle: "Initiating file download...",

                //
                //Functionality to encode HTML entities for a POST, need this if data is an object with properties whose values contains strings with quotation marks.
                //HTML entity encoding is done by replacing all &,<,>,',",\r,\n characters.
                //Note that some browsers will POST the string htmlentity-encoded whilst others will decode it before POSTing.
                //It is recommended that on the server, htmlentity decoding is done irrespective.
                //
                encodeHTMLEntities: true

            }, options);

            var deferred = new $.Deferred();

            //Setup mobile browser detection: Partial credit: http://detectmobilebrowser.com/
            var userAgent = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();

            var isIos;                  //has full support of features in iOS 4.0+, uses a new window to accomplish this.
            var isAndroid;              //has full support of GET features in 4.0+ by using a new window. Non-GET is completely unsupported by the browser. See above for specifying a message.
            var isOtherMobileBrowser;   //there is no way to reliably guess here so all other mobile devices will GET and POST to the current window.

            if (/ip(ad|hone|od)/.test(userAgent)) {

                isIos = true;

            } else if (userAgent.indexOf('android') !== -1) {

                isAndroid = true;

            } else {

                isOtherMobileBrowser = /avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|playbook|silk|iemobile|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));

            }

            var httpMethodUpper = settings.httpMethod.toUpperCase();

            if (isAndroid && httpMethodUpper !== "GET" && settings.androidPostUnsupportedMessageHtml) {
                //the stock android browser straight up doesn't support file downloads initiated by non GET requests: http://code.google.com/p/android/issues/detail?id=1780

                if ($().dialog) {
                    $("<div>").html(settings.androidPostUnsupportedMessageHtml).dialog(settings.dialogOptions);
                } else {
                    alert(settings.androidPostUnsupportedMessageHtml);
                }

                return deferred.reject();
            }

            var $preparingDialog = null;

            var internalCallbacks = {

                onPrepare: function (url) {

                    //wire up a jquery dialog to display the preparing message if specified
                    if (settings.preparingMessageHtml) {

                        $preparingDialog = $("<div>").html(settings.preparingMessageHtml).dialog(settings.dialogOptions);

                    } else if (settings.prepareCallback) {

                        settings.prepareCallback(url);

                    }

                },

                onSuccess: function (url) {

                    //remove the perparing message if it was specified
                    if ($preparingDialog) {
                        $preparingDialog.dialog('close');
                    }

                    settings.successCallback(url);

                    deferred.resolve(url);
                },

                onFail: function (responseHtml, url) {

                    //remove the perparing message if it was specified
                    if ($preparingDialog) {
                        $preparingDialog.dialog('close');
                    }

                    //wire up a jquery dialog to display the fail message if specified
                    if (settings.failMessageHtml) {
                        $("<div>").html(settings.failMessageHtml).dialog(settings.dialogOptions);
                    }

                    settings.failCallback(responseHtml, url);

                    deferred.reject(responseHtml, url);
                }
            };

            internalCallbacks.onPrepare(fileUrl);

            //make settings.data a param string if it exists and isn't already
            if (settings.data !== null && typeof settings.data !== "string") {
                settings.data = $.param(settings.data);
            }


            var $iframe,
                downloadWindow,
                formDoc,
                $form;

            if (httpMethodUpper === "GET") {

                if (settings.data !== null) {
                    //need to merge any fileUrl params with the data object

                    var qsStart = fileUrl.indexOf('?');

                    if (qsStart !== -1) {
                        //we have a querystring in the url

                        if (fileUrl.substring(fileUrl.length - 1) !== "&") {
                            fileUrl = fileUrl + "&";
                        }
                    } else {

                        fileUrl = fileUrl + "?";
                    }

                    fileUrl = fileUrl + settings.data;
                }

                if (isIos || isAndroid) {

                    downloadWindow = window.open(fileUrl);
                    downloadWindow.document.title = settings.popupWindowTitle;
                    window.focus();

                } else if (isOtherMobileBrowser) {

                    window.location(fileUrl);

                } else {

                    //create a temporary iframe that is used to request the fileUrl as a GET request
                    $iframe = $("<iframe>")
                        .hide()
                        .prop("src", fileUrl)
                        .appendTo("body");
                }

            } else {

                var formInnerHtml = "";

                if (settings.data !== null) {

                    $.each(settings.data.replace(/\+/g, ' ').split("&"), function () {

                        var kvp = this.split("=");

                        var key = settings.encodeHTMLEntities ? htmlSpecialCharsEntityEncode(decodeURIComponent(kvp[0])) : decodeURIComponent(kvp[0]);
                        if (key) {
                            var value = settings.encodeHTMLEntities ? htmlSpecialCharsEntityEncode(decodeURIComponent(kvp[1])) : decodeURIComponent(kvp[1]);
                            formInnerHtml += '<input type="hidden" name="' + key + '" value="' + value + '" />';
                        }
                    });
                }

                if (isOtherMobileBrowser) {

                    $form = $("<form>").appendTo("body");
                    $form.hide()
                        .prop('method', settings.httpMethod)
                        .prop('action', fileUrl)
                        .html(formInnerHtml);

                } else {

                    if (isIos) {

                        downloadWindow = window.open("about:blank");
                        downloadWindow.document.title = settings.popupWindowTitle;
                        formDoc = downloadWindow.document;
                        window.focus();

                    } else {

                        $iframe = $("<iframe style='display: none' src='about:blank'></iframe>").appendTo("body");
                        formDoc = getiframeDocument($iframe);
                    }

                    formDoc.write("<html><head></head><body><form method='" + settings.httpMethod + "' action='" + fileUrl + "'>" + formInnerHtml + "</form>" + settings.popupWindowTitle + "</body></html>");
                    $form = $(formDoc).find('form');
                }

                $form.submit();
            }


            //check if the file download has completed every checkInterval ms
            setTimeout(checkFileDownloadComplete, settings.checkInterval);


            function checkFileDownloadComplete() {
                //has the cookie been written due to a file download occuring?

                var cookieValue = settings.cookieValue;
                if(typeof cookieValue == 'string') {
                    cookieValue = cookieValue.toLowerCase();
                }

                var lowerCaseCookie = settings.cookieName.toLowerCase() + "=" + cookieValue;

                if (document.cookie.toLowerCase().indexOf(lowerCaseCookie) > -1) {

                    //execute specified callback
                    internalCallbacks.onSuccess(fileUrl);

                    //remove cookie
                    var cookieData = settings.cookieName + "=; path=" + settings.cookiePath + "; expires=" + new Date(0).toUTCString() + ";";
                    if (settings.cookieDomain) cookieData += " domain=" + settings.cookieDomain + ";";
                    document.cookie = cookieData;

                    //remove iframe
                    cleanUp(false);

                    return;
                }

                //has an error occured?
                //if neither containers exist below then the file download is occuring on the current window
                if (downloadWindow || $iframe) {

                    //has an error occured?
                    try {

                        var formDoc = downloadWindow ? downloadWindow.document : getiframeDocument($iframe);

                        if (formDoc && formDoc.body !== null && formDoc.body.innerHTML.length) {

                            var isFailure = true;

                            if ($form && $form.length) {
                                var $contents = $(formDoc.body).contents().first();

                                try {
                                    if ($contents.length && $contents[0] === $form[0]) {
                                        isFailure = false;
                                    }
                                } catch (e) {
                                    if (e && e.number == -2146828218) {
                                        // IE 8-10 throw a permission denied after the form reloads on the "$contents[0] === $form[0]" comparison
                                        isFailure = true;
                                    } else {
                                        throw e;
                                    }
                                }
                            }

                            if (isFailure) {
                                // IE 8-10 don't always have the full content available right away, they need a litle bit to finish
                                setTimeout(function () {
                                    internalCallbacks.onFail(formDoc.body.innerHTML, fileUrl);
                                    cleanUp(true);
                                }, 100);

                                return;
                            }
                        }
                    }
                    catch (err) {

                        //500 error less than IE9
                        internalCallbacks.onFail('', fileUrl);

                        cleanUp(true);

                        return;
                    }
                }


                //keep checking...
                setTimeout(checkFileDownloadComplete, settings.checkInterval);
            }

            //gets an iframes document in a cross browser compatible manner
            function getiframeDocument($iframe) {
                var iframeDoc = $iframe[0].contentWindow || $iframe[0].contentDocument;
                if (iframeDoc.document) {
                    iframeDoc = iframeDoc.document;
                }
                return iframeDoc;
            }

            function cleanUp(isFailure) {

                setTimeout(function() {

                    if (downloadWindow) {

                        if (isAndroid) {
                            downloadWindow.close();
                        }

                        if (isIos) {
                            if (downloadWindow.focus) {
                                downloadWindow.focus(); //ios safari bug doesn't allow a window to be closed unless it is focused
                                if (isFailure) {
                                    downloadWindow.close();
                                }
                            }
                        }
                    }

                    //iframe cleanup appears to randomly cause the download to fail
                    //not doing it seems better than failure...
                    //if ($iframe) {
                    //    $iframe.remove();
                    //}

                }, 0);
            }


            function htmlSpecialCharsEntityEncode(str) {
                return str.replace(htmlSpecialCharsRegEx, function(match) {
                    return '&' + htmlSpecialCharsPlaceHolders[match];
                });
            }
            var promise = deferred.promise();
            promise.abort = function() {
                cleanUp();
                $iframe.remove();
            };
            return promise;
        }
    });

})(jQuery, this);

/**
 * jQuery Lined Textarea Plugin 
 *   http://alan.blog-city.com/jquerylinedtextarea.htm
 *
 * Copyright (c) 2010 Alan Williamson
 * 
 * Version: 
 *    $Id: jquery-linedtextarea.js 464 2010-01-08 10:36:33Z alan $
 *
 * Released under the MIT License:
 *    http://www.opensource.org/licenses/mit-license.php
 * 
 * Usage:
 *   Displays a line number count column to the left of the textarea
 *   
 *   Class up your textarea with a given class, or target it directly
 *   with JQuery Selectors
 *   
 *   $(".lined").linedtextarea({
 *   	selectedLine: 10,
 *    selectedClass: 'lineselect'
 *   });
 *
 * History:
 *   - 2010.01.08: Fixed a Google Chrome layout problem
 *   - 2010.01.07: Refactored code for speed/readability; Fixed horizontal sizing
 *   - 2010.01.06: Initial Release
 *
 */
(function($) {

	$.fn.linedtextarea = function(options) {
		
		// Get the Options
		var opts = $.extend({}, $.fn.linedtextarea.defaults, options);
		
		
		/*
		 * Helper function to make sure the line numbers are always
		 * kept up to the current system
		 */
		var fillOutLines = function(codeLines, h, lineNo){
			while ( (codeLines.height() - h ) <= 0 ){
				if ( lineNo == opts.selectedLine )
					codeLines.append("<div class='lineno lineselect'>" + lineNo + "</div>");
				else
					codeLines.append("<div class='lineno'>" + lineNo + "</div>");
				
				lineNo++;
			}
			return lineNo;
		};
		
		
		/*
		 * Iterate through each of the elements are to be applied to
		 */
		return this.each(function() {
			var lineNo = 1;
			var textarea = $(this);
			
			/* Turn off the wrapping of as we don't want to screw up the line numbers */
			textarea.attr("wrap", "off");
			textarea.css({resize:'none'});
			var originalTextAreaWidth	= textarea.outerWidth();

			/* Wrap the text area in the elements we need */
			textarea.wrap("<div class='linedtextarea'></div>");
			var linedTextAreaDiv	= textarea.parent().wrap("<div class='linedwrap' style='width:" + originalTextAreaWidth + "px'></div>");
			var linedWrapDiv 			= linedTextAreaDiv.parent();
			
			linedWrapDiv.prepend("<div class='lines' style='width:50px'></div>");
			
			var linesDiv	= linedWrapDiv.find(".lines");
			linesDiv.height( textarea.height() + 6 );
			
			
			/* Draw the number bar; filling it out where necessary */
			linesDiv.append( "<div class='codelines'></div>" );
			var codeLinesDiv	= linesDiv.find(".codelines");
			lineNo = fillOutLines( codeLinesDiv, linesDiv.height(), 1 );

			/* Move the textarea to the selected line */ 
			if ( opts.selectedLine != -1 && !isNaN(opts.selectedLine) ){
				var fontSize = parseInt( textarea.height() / (lineNo-2) );
				var position = parseInt( fontSize * opts.selectedLine ) - (textarea.height()/2);
				textarea[0].scrollTop = position;
			}

			
			/* Set the width */
			var sidebarWidth					= linesDiv.outerWidth();
			var paddingHorizontal 		= parseInt( linedWrapDiv.css("border-left-width") ) + parseInt( linedWrapDiv.css("border-right-width") ) + parseInt( linedWrapDiv.css("padding-left") ) + parseInt( linedWrapDiv.css("padding-right") );
			var linedWrapDivNewWidth 	= originalTextAreaWidth - paddingHorizontal;
			var textareaNewWidth			= originalTextAreaWidth - sidebarWidth - paddingHorizontal - 20;

			textarea.width( textareaNewWidth );
			linedWrapDiv.width( linedWrapDivNewWidth );
			

			
			/* React to the scroll event */
			textarea.scroll( function(tn){
				var domTextArea		= $(this)[0];
				var scrollTop 		= domTextArea.scrollTop;
				var clientHeight 	= domTextArea.clientHeight;
				codeLinesDiv.css( {'margin-top': (-1*scrollTop) + "px"} );
				lineNo = fillOutLines( codeLinesDiv, scrollTop + clientHeight, lineNo );
			});


			/* Should the textarea get resized outside of our control */
			textarea.resize( function(tn){
				var domTextArea	= $(this)[0];
				linesDiv.height( domTextArea.clientHeight + 6 );
			});

		});
	};

  // default options
  $.fn.linedtextarea.defaults = {
  	selectedLine: -1,
  	selectedClass: 'lineselect'
  };
})(jQuery);
/******************************************************************************
 * jquery.i18n.properties
 * 
 * Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
 * MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
 * 
 * @version     1.0.x
 * @author      Nuno Fernandes
 * @url         www.codingwithcoffee.com
 * @inspiration Localisation assistance for jQuery (http://keith-wood.name/localisation.html)
 *              by Keith Wood (kbwood{at}iinet.com.au) June 2007
 * 
 *****************************************************************************/

(function($) {
$.i18n = {};

/** Map holding bundle keys (if mode: 'map') */
$.i18n.map = {};
    
/**
 * Load and parse message bundle files (.properties),
 * making bundles keys available as javascript variables.
 * 
 * i18n files are named <name>.js, or <name>_<language>.js or <name>_<language>_<country>.js
 * Where:
 *      The <language> argument is a valid ISO Language Code. These codes are the lower-case, 
 *      two-letter codes as defined by ISO-639. You can find a full list of these codes at a 
 *      number of sites, such as: http://www.loc.gov/standards/iso639-2/englangn.html
 *      The <country> argument is a valid ISO Country Code. These codes are the upper-case,
 *      two-letter codes as defined by ISO-3166. You can find a full list of these codes at a
 *      number of sites, such as: http://www.iso.ch/iso/en/prods-services/iso3166ma/02iso-3166-code-lists/list-en1.html
 * 
 * Sample usage for a bundles/Messages.properties bundle:
 * $.i18n.properties({
 *      name:      'Messages', 
 *      language:  'en_US',
 *      path:      'bundles'
 * });
 * @param  name			(string/string[], optional) names of file to load (eg, 'Messages' or ['Msg1','Msg2']). Defaults to "Messages"
 * @param  language		(string, optional) language/country code (eg, 'en', 'en_US', 'pt_PT'). if not specified, language reported by the browser will be used instead.
 * @param  path			(string, optional) path of directory that contains file to load
 * @param  mode			(string, optional) whether bundles keys are available as JavaScript variables/functions or as a map (eg, 'vars' or 'map')
 * @param  cache        (boolean, optional) whether bundles should be cached by the browser, or forcibly reloaded on each page load. Defaults to false (i.e. forcibly reloaded)
 * @param  encoding 	(string, optional) the encoding to request for bundles. Property file resource bundles are specified to be in ISO-8859-1 format. Defaults to UTF-8 for backward compatibility.
 * @param  callback     (function, optional) callback function to be called after script is terminated
 */
$.i18n.properties = function(settings) {
	// set up settings
    var defaults = {
        name:           'Messages',
        language:       '',
        path:           '',  
        mode:           'vars',
        cache:			false,
        encoding:       'UTF-8',
        callback:       null
    };
    settings = $.extend(defaults, settings);    
    if(settings.language === null || settings.language == '') {
	   settings.language = $.i18n.browserLang();
	}
	if(settings.language === null) {settings.language='';}
	
	// load and parse bundle files
	var files = getFiles(settings.name);
	for(i=0; i<files.length; i++) {
		// 1. load base (eg, Messages.properties)
		loadAndParseFile(settings.path + files[i] + '.properties', settings);
        // 2. with language code (eg, Messages_pt.properties)
		if(settings.language.length >= 2) {
            loadAndParseFile(settings.path + files[i] + '_' + settings.language.substring(0, 2) +'.properties', settings);
		}
		// 3. with language code and country code (eg, Messages_pt_PT.properties)
        if(settings.language.length >= 5) {
            loadAndParseFile(settings.path + files[i] + '_' + settings.language.substring(0, 5) +'.properties', settings);
        }
	}
	
	// call callback
	if(settings.callback){ settings.callback(); }
};


/**
 * When configured with mode: 'map', allows access to bundle values by specifying its key.
 * Eg, jQuery.i18n.prop('com.company.bundles.menu_add')
 */
$.i18n.prop = function(key /* Add parameters as function arguments as necessary  */) {
	var value = $.i18n.map[key];
	if (value == null)
		return '[' + key + ']';
	
//	if(arguments.length < 2) // No arguments.
//    //if(key == 'spv.lbl.modified') {alert(value);}
//		return value;
	
//	if (!$.isArray(placeHolderValues)) {
//		// If placeHolderValues is not an array, make it into one.
//		placeHolderValues = [placeHolderValues];
//		for (var i=2; i<arguments.length; i++)
//			placeHolderValues.push(arguments[i]);
//	}

	// Place holder replacement
	/**
	 * Tested with:
	 *   test.t1=asdf ''{0}''
	 *   test.t2=asdf '{0}' '{1}'{1}'zxcv
	 *   test.t3=This is \"a quote" 'a''{0}''s'd{fgh{ij'
	 *   test.t4="'''{'0}''" {0}{a}
	 *   test.t5="'''{0}'''" {1}
	 *   test.t6=a {1} b {0} c
	 *   test.t7=a 'quoted \\ s\ttringy' \t\t x
	 *
	 * Produces:
	 *   test.t1, p1 ==> asdf 'p1'
	 *   test.t2, p1 ==> asdf {0} {1}{1}zxcv
	 *   test.t3, p1 ==> This is "a quote" a'{0}'sd{fgh{ij
	 *   test.t4, p1 ==> "'{0}'" p1{a}
	 *   test.t5, p1 ==> "'{0}'" {1}
	 *   test.t6, p1 ==> a {1} b p1 c
	 *   test.t6, p1, p2 ==> a p2 b p1 c
	 *   test.t6, p1, p2, p3 ==> a p2 b p1 c
	 *   test.t7 ==> a quoted \ s	tringy 		 x
	 */
	
	var i;
	if (typeof(value) == 'string') {
        // Handle escape characters. Done separately from the tokenizing loop below because escape characters are 
		// active in quoted strings.
        i = 0;
        while ((i = value.indexOf('\\', i)) != -1) {
 		   if (value[i+1] == 't')
 			   value = value.substring(0, i) + '\t' + value.substring((i++) + 2); // tab
 		   else if (value[i+1] == 'r')
 			   value = value.substring(0, i) + '\r' + value.substring((i++) + 2); // return
 		   else if (value[i+1] == 'n')
 			   value = value.substring(0, i) + '\n' + value.substring((i++) + 2); // line feed
 		   else if (value[i+1] == 'f')
 			   value = value.substring(0, i) + '\f' + value.substring((i++) + 2); // form feed
 		   else if (value[i+1] == '\\')
 			   value = value.substring(0, i) + '\\' + value.substring((i++) + 2); // \
 		   else
 			   value = value.substring(0, i) + value.substring(i+1); // Quietly drop the character
        }
		
		// Lazily convert the string to a list of tokens.
		var arr = [], j, index;
		i = 0;
		while (i < value.length) {
			if (value[i] == '\'') {
				// Handle quotes
				if (i == value.length-1)
					value = value.substring(0, i); // Silently drop the trailing quote
				else if (value[i+1] == '\'')
					value = value.substring(0, i) + value.substring(++i); // Escaped quote
				else {
					// Quoted string
					j = i + 2;
					while ((j = value.indexOf('\'', j)) != -1) {
						if (j == value.length-1 || value[j+1] != '\'') {
							// Found start and end quotes. Remove them
							value = value.substring(0,i) + value.substring(i+1, j) + value.substring(j+1);
							i = j - 1;
							break;
						}
						else {
							// Found a double quote, reduce to a single quote.
							value = value.substring(0,j) + value.substring(++j);
						}
					}
					
					if (j == -1) {
						// There is no end quote. Drop the start quote
						value = value.substring(0,i) + value.substring(i+1);
					}
				}
			}
			else if (value[i] == '{') {
				// Beginning of an unquoted place holder.
				j = value.indexOf('}', i+1);
				if (j == -1)
					i++; // No end. Process the rest of the line. Java would throw an exception
				else {
					// Add 1 to the index so that it aligns with the function arguments.
					index = parseInt(value.substring(i+1, j));
					if (!isNaN(index) && index >= 0) {
						// Put the line thus far (if it isn't empty) into the array
						var s = value.substring(0, i);
						if (s != "")
							arr.push(s);
						// Put the parameter reference into the array
						arr.push(index);
						// Start the processing over again starting from the rest of the line.
						i = 0;
						value = value.substring(j+1);
					}
					else
						i = j + 1; // Invalid parameter. Leave as is.
				}
			}
			else
				i++;
		}
		
		// Put the remainder of the no-empty line into the array.
		if (value != "")
			arr.push(value);
		value = arr;
		
		// Make the array the value for the entry.
		$.i18n.map[key] = arr;
	}
	
	if (value.length == 0)
		return "";
	if (value.lengh == 1 && typeof(value[0]) == "string")
		return value[0];
	
	var s = "";
	for (i=0; i<value.length; i++) {
		if (typeof(value[i]) == "string")
			s += value[i];
		// Must be a number
		else if (value[i] + 1 < arguments.length)
			s += arguments[value[i] + 1];
		else
			s += "{"+ value[i] +"}";
	}
	
	return s;
};

/** Language reported by browser, normalized code */
$.i18n.browserLang = function() {
	return normaliseLanguageCode(navigator.language /* Mozilla */ || navigator.userLanguage /* IE */);
}


/** Load and parse .properties files */
function loadAndParseFile(filename, settings) {
	$.ajax({
        url:        filename,
        async:      false,
        cache:		settings.cache,
        contentType:'text/plain;charset='+ settings.encoding,
        dataType:   'text',
        success:    function(data, status) {
        				parseData(data, settings.mode); 
					}
    });
}

/** Parse .properties files */
function parseData(data, mode) {
   var parsed = '';
   var parameters = data.split( /\n/ );
   var regPlaceHolder = /(\{\d+\})/g;
   var regRepPlaceHolder = /\{(\d+)\}/g;
   var unicodeRE = /(\\u.{4})/ig;
   for(var i=0; i<parameters.length; i++ ) {
       parameters[i] = parameters[i].replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
       if(parameters[i].length > 0 && parameters[i].match("^#")!="#") { // skip comments
           var pair = parameters[i].split('=');
           if(pair.length > 0) {
               /** Process key & value */
               var name = unescape(pair[0]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               var value = pair.length == 1 ? "" : pair[1];
               // process multi-line values
               while(value.match(/\\$/)=="\\") {
               		value = value.substring(0, value.length - 1);
               		value += parameters[++i].replace( /\s\s*$/, '' ); // right trim
               }               
               // Put values with embedded '='s back together
               for(var s=2;s<pair.length;s++){ value +='=' + pair[s]; }
               value = value.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               
               /** Mode: bundle keys in a map */
               if(mode == 'map' || mode == 'both') {
                   // handle unicode chars possibly left out
                   var unicodeMatches = value.match(unicodeRE);
                   if(unicodeMatches) {
                     for(var u=0; u<unicodeMatches.length; u++) {
                        value = value.replace( unicodeMatches[u], unescapeUnicode(unicodeMatches[u]));
                     }
                   }
                   // add to map
                   $.i18n.map[name] = value;
               }
               
               /** Mode: bundle keys as vars/functions */
               if(mode == 'vars' || mode == 'both') {
                   value = value.replace( /"/g, '\\"' ); // escape quotation mark (")
                   
                   // make sure namespaced key exists (eg, 'some.key') 
                   checkKeyNamespace(name);
                   
                   // value with variable substitutions
                   if(regPlaceHolder.test(value)) {
                       var parts = value.split(regPlaceHolder);
                       // process function args
                       var first = true;
                       var fnArgs = '';
                       var usedArgs = [];
                       for(var p=0; p<parts.length; p++) {
                           if(regPlaceHolder.test(parts[p]) && (usedArgs.length == 0 || usedArgs.indexOf(parts[p]) == -1)) {
                               if(!first) {fnArgs += ',';}
                               fnArgs += parts[p].replace(regRepPlaceHolder, 'v$1');
                               usedArgs.push(parts[p]);
                               first = false;
                           }
                       }
                       parsed += name + '=function(' + fnArgs + '){';
                       // process function body
                       var fnExpr = '"' + value.replace(regRepPlaceHolder, '"+v$1+"') + '"';
                       parsed += 'return ' + fnExpr + ';' + '};';
                       
                   // simple value
                   }else{
                       parsed += name+'="'+value+'";';
                   }
               } // END: Mode: bundle keys as vars/functions
           } // END: if(pair.length > 0)
       } // END: skip comments
   }
   eval(parsed);
}

/** Make sure namespace exists (for keys with dots in name) */
// TODO key parts that start with numbers quietly fail. i.e. month.short.1=Jan
function checkKeyNamespace(key) {
	var regDot = /\./;
	if(regDot.test(key)) {
		var fullname = '';
		var names = key.split( /\./ );
		for(var i=0; i<names.length; i++) {
			if(i>0) {fullname += '.';}
			fullname += names[i];
			if(eval('typeof '+fullname+' == "undefined"')) {
				eval(fullname + '={};');
			}
		}
	}
}

/** Make sure filename is an array */
function getFiles(names) {
	return (names && names.constructor == Array) ? names : [names];
}

/** Ensure language code is in the format aa_AA. */
function normaliseLanguageCode(lang) {
    lang = lang.toLowerCase();
    if(lang.length > 3) {
        lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
    }
    return lang;
}

/** Unescape unicode chars ('\u00e3') */
function unescapeUnicode(str) {
  // unescape unicode codes
  var codes = [];
  var code = parseInt(str.substr(2), 16);
  if (code >= 0 && code < Math.pow(2, 16)) {
     codes.push(code);
  }
  // convert codes to text
  var unescaped = '';
  for (var i = 0; i < codes.length; ++i) {
    unescaped += String.fromCharCode(codes[i]);
  }
  return unescaped;
}

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */
var cbSplit;
// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {    
  cbSplit = function(str, separator, limit) {
      // if `separator` is not a regex, use the native `split`
      if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        if(typeof cbSplit._nativeSplit == "undefined")
          return str.split(separator, limit);
        else
          return cbSplit._nativeSplit.call(str, separator, limit);
      }
  
      var output = [],
          lastLastIndex = 0,
          flags = (separator.ignoreCase ? "i" : "") +
                  (separator.multiline  ? "m" : "") +
                  (separator.sticky     ? "y" : ""),
          separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
          separator2, match, lastIndex, lastLength;
  
      str = str + ""; // type conversion
      if (!cbSplit._compliantExecNpcg) {
          separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
      }
  
      /* behavior for `limit`: if it's...
      - `undefined`: no limit.
      - `NaN` or zero: return an empty array.
      - a positive number: use `Math.floor(limit)`.
      - a negative number: no limit.
      - other: type-convert, then use the above rules. */
      if (limit === undefined || +limit < 0) {
          limit = Infinity;
      } else {
          limit = Math.floor(+limit);
          if (!limit) {
              return [];
          }
      }
  
      while (match = separator.exec(str)) {
          lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser
  
          if (lastIndex > lastLastIndex) {
              output.push(str.slice(lastLastIndex, match.index));
  
              // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
              if (!cbSplit._compliantExecNpcg && match.length > 1) {
                  match[0].replace(separator2, function () {
                      for (var i = 1; i < arguments.length - 2; i++) {
                          if (arguments[i] === undefined) {
                              match[i] = undefined;
                          }
                      }
                  });
              }
  
              if (match.length > 1 && match.index < str.length) {
                  Array.prototype.push.apply(output, match.slice(1));
              }
  
              lastLength = match[0].length;
              lastLastIndex = lastIndex;
  
              if (output.length >= limit) {
                  break;
              }
          }
  
          if (separator.lastIndex === match.index) {
              separator.lastIndex++; // avoid an infinite loop
          }
      }
  
      if (lastLastIndex === str.length) {
          if (lastLength || !separator.test("")) {
              output.push("");
          }
      } else {
          output.push(str.slice(lastLastIndex));
      }
  
      return output.length > limit ? output.slice(0, limit) : output;
  };
  
  cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
  cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};

})(jQuery);
                
// Todo:
// 1) Make the button prettier
// 2) add a config option for IE users which takes a URL.  That URL should accept a POST request with a
//    JSON encoded object in the payload and return a CSV.  This is necessary because IE doesn't let you
//    download from a data-uri link
//
// Notes:  This has not been adequately tested and is very much a proof of concept at this point
function ngGridCsvExportPlugin (opts) {
    var self = this;
    self.grid = null;
    self.scope = null;
    self.services = null;
    self.init = function(scope, grid, services) {
        self.grid = grid;
        self.scope = scope;
        self.services = services;
        function showDs() {
            var keys = [];
            for (var f in grid.config.columnDefs) { keys.push(grid.config.columnDefs[f].field);}
            var csvData = '';
            function csvStringify(str) {
                if (str == null) { // we want to catch anything null-ish, hence just == not ===
                    return '';
                }
                if (typeof(str) === 'number') {
                    return '' + str;
                }
                if (typeof(str) === 'boolean') {
                    return (str ? 'TRUE' : 'FALSE') ;
                }
                if (typeof(str) === 'string') {
                    return str.replace(/"/g,'""');
                }

                return JSON.stringify(str).replace(/"/g,'""');
            }
            function swapLastCommaForNewline(str) {
                var newStr = str.substr(0,str.length - 1);
                return newStr + "\n";
            }
            // FIX to use display name headers
//            for (var k in keys) {
//                csvData += '"' + csvStringify(keys[k]) + '",';
//            }
            for (var f in grid.config.columnDefs) {
                csvData += '"' + csvStringify(grid.config.columnDefs[f].displayName) + '",';
            }
            csvData = swapLastCommaForNewline(csvData);
            var gridData = grid.data;
            for (var gridRow in gridData) {
                for ( k in keys) {
                    var curCellRaw;
                    if (opts != null && opts.columnOverrides != null && opts.columnOverrides[keys[k]] != null) {
                        // FIX line below to handle nested properties
//                        curCellRaw = opts.columnOverrides[keys[k]](gridData[gridRow][keys[k]]);
                        curCellRaw = opts.columnOverrides[keys[k]](services.UtilityService.evalProperty(gridData[gridRow],keys[k]));
                    }
                    else {
//                        // FIX line below to handle nested properties
//                        curCellRaw = gridData[gridRow][keys[k]];
                        curCellRaw = services.UtilityService.evalProperty(gridData[gridRow],keys[k]);
                    }
                    csvData += '"' + csvStringify(curCellRaw) + '",';
                }
                csvData = swapLastCommaForNewline(csvData);
            }
            var fp = grid.$root.find(".ngFooterPanel");
            var csvDataLinkPrevious = grid.$root.find('.ngFooterPanel .csv-data-link-span');
            if (csvDataLinkPrevious != null) {csvDataLinkPrevious.remove() ; }
            var csvDataLinkHtml = "<div class=\"csv-data-link-span\">";
            csvDataLinkHtml += "<br><a href=\"data:text/csv;charset=UTF-8,";
            csvDataLinkHtml += encodeURIComponent(csvData);
            csvDataLinkHtml += "\" download=\"Export.csv\">CSV Export</a></br></div>" ;
            fp.append(csvDataLinkHtml);
        }
        setTimeout(showDs, 0);
        scope.catHashKeys = function() {
            var hash = '';
            for (var idx in scope.renderedRows) {
                hash += scope.renderedRows[idx].$$hashKey;
            }
            return hash;
        };
        if (opts.customDataWatcher) {
            scope.$watch(opts.customDataWatcher, showDs);
        } else {
            scope.$watch(scope.catHashKeys, showDs);
        }
    };
}

/**
 * Created by haffo on 6/9/14.
 */


if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
}


if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str) {
        return this.slice(-str.length) == str;
    };
}


var waitingDialog = (function ($) {
    // Creating modal dialog's DOM
    var $dialog = $(
            '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
            '<div class="modal-dialog modal-m">' +
            '<div class="modal-content">' +
            '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
            '<div class="modal-body">' +
            '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
            '</div>' +
            '</div></div></div>');

    return {
        /**
         * Opens our dialog
         * @param message Custom message
         * @param options Custom options:
         * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
         * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
         */
        show: function (message, options) {
            // Assigning defaults
            var settings = $.extend({
                dialogSize: 'xs',
                progressType: ''
            }, options);
            if (typeof message === 'undefined') {
                message = 'Loading';
            }
            if (typeof options === 'undefined') {
                options = {};
            }
            // Configuring dialog
            $dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
            $dialog.find('.progress-bar').attr('class', 'progress-bar');
            if (settings.progressType) {
                $dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
            }
            $dialog.find('h3').text(message);
            // Opening dialog
            $dialog.modal();
        },
        /**
         * Closes dialog
         */
        hide: function () {
            $dialog.modal('hide');
        }
    }

})(jQuery);

'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module oƒf the application.
 */
var app = angular
    .module('tcl', [
        'ngAnimate',
        'LocalStorageModule',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ngIdle',
        'ui.bootstrap',
        'smart-table',
        'ngTreetable',
        'restangular',
        'angularjs-dropdown-multiselect',
        'dndLists',
        'froala',
        'ngNotificationsBar',
        'ngDragDrop',
        'ui.tree', 
        'ui.bootstrap.contextMenu',
        'ui.bootstrap',
        'ui.codemirror'
    ]);

var
//the HTTP headers to be used by all requests
    httpHeaders,

//the message to show on the login popup page
    loginMessage,

//the spinner used to show when we are still waiting for a server answer
    spinner,

//The list of messages we don't want to displat
    mToHide = ['usernameNotFound', 'emailNotFound', 'usernameFound', 'emailFound', 'loginSuccess', 'userAdded', 'igDocumentNotSaved', 'igDocumentSaved', 'uploadImageFailed'];

//the message to be shown to the user
var msg = {};

app.config(["$routeProvider", "RestangularProvider", "$httpProvider", "KeepaliveProvider", "IdleProvider", "notificationsConfigProvider", function ($routeProvider, RestangularProvider, $httpProvider, KeepaliveProvider, IdleProvider, notificationsConfigProvider) {


    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html'
        })
        .when('/home', {
            templateUrl: 'views/home.html'
        })
        .when('/tp', {
            templateUrl: 'views/tp.html'
        })
        .when('/masterDTLib', {
            templateUrl: 'views/masterDTLib.html',
            controller: 'DatatypeLibraryCtl'
        })
        .when('/doc', {
            templateUrl: 'views/doc.html'
        })
        .when('/setting', {
            templateUrl: 'views/setting.html'
        })
        .when('/about', {
            templateUrl: 'views/about.html'
        })
        .when('/contact', {
            templateUrl: 'views/contact.html'
        })
        .when('/forgotten', {
            templateUrl: 'views/account/forgotten.html',
            controller: 'ForgottenCtrl'
        })
        .when('/issue', {
            templateUrl: 'views/issue.html',
            controller: 'IssueCtrl'
        })
        .when('/registration', {
            templateUrl: 'views/account/registration.html',
            controller: 'RegistrationCtrl'
        }).when('/useraccount', {
            templateUrl: 'views/account/userAccount.html'
        }) .when('/glossary', {
            templateUrl: 'views/glossary.html'
        })
//        .when('/account', {
//            templateUrl: 'views/account/account.html',
//            controller: 'AccountCtrl',
//            resolve: {
//                login: ['LoginService', function(LoginService){
//                    return LoginService();
//                }]
//            }
//        })
        .when('/registerResetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return true;
                }
            }
        })
        .when('/resetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return false;
                }
            }
        })
        .when('/registrationSubmitted', {
            templateUrl: 'views/account/registrationSubmitted.html'
        })
        .when('/masterDTLib', {
            templateUrl: 'views/edit/masterDTLib.html'
        })
        .otherwise({
            redirectTo: '/'
        });


//    $http.defaults.headers.post['X-CSRFToken'] = $cookies['csrftoken'];

    $httpProvider.interceptors.push(["$q", function ($q) {
        return {
            request: function (config) {
//            	console.log(config.url);
//                return "http://localhost:8080/igamt"+ value;
//                if(config.url.startsWith("api")){
//                   config.url = "http://localhost:8080/igamt/"+  config.url;
//                   console.log("config.url=" + config.url);
//                }
                return config || $q.when(config);
            }
        }
    }]);


    $httpProvider.interceptors.push(["$rootScope", "$q", function ($rootScope, $q) {
        var setMessage = function (response) {
            //if the response has a text and a type property, it is a message to be shown
            if (response.data && response.data.text && response.data.type) {
                if (response.status === 401) {
//                        console.log("setting login message");
                    loginMessage = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };

                } else if (response.status === 503) {
                    msg = {
                        text: "server.down",
                        type: "danger",
                        show: true,
                        manualHandle: true
                    };
                } else {
                    msg = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };
                    var found = false;
                    var i = 0;
                    while (i < mToHide.length && !found) {
                        if (msg.text === mToHide[i]) {
                            found = true;
                        }
                        i++;
                    }
                    if (found === true) {
                        msg.show = false;
                    } else {
//                        //hide the msg in 5 seconds
//                                                setTimeout(
//                                                    function() {
//                                                        msg.show = false;
//                                                        //tell angular to refresh
//                                                        $rootScope.$apply();
//                                                    },
//                                                    10000
//                                                );
                    }
                 }
            }
        };

        return {
            response: function (response) {
                setMessage(response);
                return response || $q.when(response);
            },

            responseError: function (response) {
                setMessage(response);
                return $q.reject(response);
            }
        };

    }]);

    //configure $http to show a login dialog whenever a 401 unauthorized response arrives
    $httpProvider.interceptors.push(["$rootScope", "$q", function ($rootScope, $q) {
        return {
            response: function (response) {
                return response || $q.when(response);
            },
            responseError: function (response) {
                if (response.status === 401) {
                    //We catch everything but this one. So public users are not bothered
                    //with a login windows when browsing home.
                    if (response.config.url !== 'api/accounts/cuser') {
                        //We don't intercept this request
                        if (response.config.url !== 'api/accounts/login') {
                            var deferred = $q.defer(),
                                req = {
                                    config: response.config,
                                    deferred: deferred
                                };
                            $rootScope.requests401.push(req);
                        }
                        $rootScope.$broadcast('event:loginRequired');
//                        return deferred.promise;

                        return  $q.when(response);
                    }
                }
                return $q.reject(response);
            }
        };
    }]);

    //intercepts ALL angular ajax http calls
    $httpProvider.interceptors.push(["$q", function ($q) {
        return {
            response: function (response) {
                //hide the spinner
                spinner = false;
                return response || $q.when(response);
            },
            responseError: function (response) {
                //hide the spinner
                spinner = false;
                return $q.reject(response);
            }
        };


    }]);


    IdleProvider.idle(7200);
    IdleProvider.timeout(30);
    KeepaliveProvider.interval(60);

    // auto hide
    notificationsConfigProvider.setAutoHide(true);

    // delay before hide
    notificationsConfigProvider.setHideDelay(30000);

    // delay between animation and removing the nofitication
    notificationsConfigProvider.setAutoHideAnimationDelay(1200);

    var spinnerStarter = function (data, headersGetter) {
        spinner = true;
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerStarter);

    httpHeaders = $httpProvider.defaults.headers;


}]);


app.run(["$rootScope", "$location", "Restangular", "$modal", "$filter", "base64", "userInfoService", "$http", "AppInfo", "StorageService", "$templateCache", "$window", "notifications", function ($rootScope, $location, Restangular, $modal, $filter, base64, userInfoService, $http, AppInfo, StorageService, $templateCache, $window, notifications) {
    $rootScope.appInfo = {};
    //Check if the login dialog is already displayed.
    $rootScope.loginDialogShown = false;
    $rootScope.subActivePath = null;

    // load app info
    AppInfo.get().then(function (appInfo) {
        $rootScope.appInfo = appInfo;
        $rootScope.froalaEditorOptions = {
            placeholderText: '',
            toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|', 'color', 'emoticons', 'inlineStyle', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-', 'undo', 'redo', 'clearFormatting', 'selectAll', 'insertTable', 'insertLink', 'insertImage', 'insertFile'],
            imageUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
            fileUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            fileAllowedTypes: ['application/pdf', 'application/msword', 'application/x-pdf', 'text/plain', 'application/xml','text/xml'],
            charCounterCount: false,
            quickInsertTags: 8,
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
            key: 'Rg1Wb2KYd1Td1WIh1CVc2F=='
        };
        httpHeaders.common['appVersion'] = appInfo.version;
        var prevVersion = StorageService.getAppVersion(StorageService.APP_VERSION);
        StorageService.setAppVersion(appInfo.version);

        if (prevVersion == null || prevVersion !== appInfo.version) {
            $rootScope.clearAndReloadApp();
        }
    }, function (error) {
        $rootScope.appInfo = {};
        $rootScope.openErrorDlg("Sorry we could not communicate with the server. Please try again");
    });


    //make current message accessible to root scope and therefore all scopes
    $rootScope.msg = function () {
        return msg;
    };

    //make current loginMessage accessible to root scope and therefore all scopes
    $rootScope.loginMessage = function () {
//            console.log("calling loginMessage()");
        return loginMessage;
    };

    //showSpinner can be referenced from the view
    $rootScope.showSpinner = function () {
        return spinner;
    };

    /**
     * Holds all the requests which failed due to 401 response.
     */
    $rootScope.requests401 = [];

    $rootScope.$on('event:loginRequired', function () {
//            console.log("in loginRequired event");
        $rootScope.showLoginDialog();
    });

    /**
     * On 'event:loginConfirmed', resend all the 401 requests.
     */
    $rootScope.$on('event:loginConfirmed', function () {
        var i,
            requests = $rootScope.requests401,
            retry = function (req) {
                $http(req.config).then(function (response) {
                    req.deferred.resolve(response);
                });
            };

        for (i = 0; i < requests.length; i += 1) {
            retry(requests[i]);
        }
        $rootScope.requests401 = [];

        $location.url('/ig');
    });

    /*jshint sub: true */
    /**
     * On 'event:loginRequest' send credentials to the server.
     */
    $rootScope.$on('event:loginRequest', function (event, username, password) {
        httpHeaders.common['Accept'] = 'application/json';
        httpHeaders.common['Authorization'] = 'Basic ' + base64.encode(username + ':' + password);
//        httpHeaders.common['withCredentials']=true;
//        httpHeaders.common['Origin']="http://localhost:9000";
        $http.get('api/accounts/login').success(function () {
            //If we are here in this callback, login was successfull
            //Let's get user info now
            httpHeaders.common['Authorization'] = null;
            $http.get('api/accounts/cuser').then(function (result) {
                if (result.data && result.data != null) {
                    var rs = angular.fromJson(result.data);
                    userInfoService.setCurrentUser(rs);
                    $rootScope.$broadcast('event:loginConfirmed');
                } else {
                    userInfoService.setCurrentUser(null);
                }
            }, function () {
                userInfoService.setCurrentUser(null);
            });
        });
    });

    /**
     * On 'logoutRequest' invoke logout on the server.
     */
    $rootScope.$on('event:logoutRequest', function () {
        httpHeaders.common['Authorization'] = null;
        userInfoService.setCurrentUser(null);
        $http.get('j_spring_security_logout');
    });

    /**
     * On 'loginCancel' clears the Authentication header
     */
    $rootScope.$on('event:loginCancel', function () {
        httpHeaders.common['Authorization'] = null;
    });

    $rootScope.$on('$routeChangeStart', function (next, current) {
//            console.log('route changing');
        // If there is a message while change Route the stop showing the message
        if (msg && msg.manualHandle === 'false') {
//                console.log('detected msg with text: ' + msg.text);
            msg.show = false;
        }
    });

    $rootScope.$watch(function(){
        return $rootScope.msg().text;
    }, function (value) {
        $rootScope.showNotification($rootScope.msg());
    });

    $rootScope.$watch('language()', function (value) {
        $rootScope.showNotification($rootScope.msg());
    });

    $rootScope.loadUserFromCookie = function () {
        if (userInfoService.hasCookieInfo() === true) {
            //console.log("found cookie!")
            userInfoService.loadFromCookie();
            httpHeaders.common['Authorization'] = userInfoService.getHthd();
        }
        else {
            //console.log("cookie not found");
        }
    };


    $rootScope.isSubActive = function (path) {
        return path === $rootScope.subActivePath;
    };

    $rootScope.setSubActive = function (path) {
        $rootScope.subActivePath = path;
    };

    $rootScope.getFullName = function () {
        if (userInfoService.isAuthenticated() === true) {
            return userInfoService.getFullName();
        }
        return '';
    };
    $rootScope.clearAndReloadApp = function () {
        $rootScope.clearTemplate();
        $rootScope.reloadPage();
    };

    $rootScope.openErrorDlg = function (errorMessage) {
        StorageService.clearAll();
        if (!$rootScope.errorModalInstance || $rootScope.errorModalInstance === null || !$rootScope.errorModalInstance.opened) {
            $rootScope.errorModalInstance = $modal.open({
                templateUrl: 'CriticalError.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return errorMessage;
                    }
                }
            });
            $rootScope.errorModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.openSessionExpiredDlg = function () {
        if (!$rootScope.sessionExpiredModalInstance || $rootScope.sessionExpiredModalInstance === null || !$rootScope.sessionExpiredModalInstance.opened) {
            $rootScope.sessionExpiredModalInstance = $modal.open({
                templateUrl: 'timedout-dialog.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return "";
                    }
                }
            });
            $rootScope.sessionExpiredModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.clearTemplate = function () {
        $templateCache.removeAll();
    };

    $rootScope.reloadPage = function () {
        $window.location.reload();
    };

    $rootScope.showNotification = function (m) {
        if(m != undefined && m.show && m.text != null && m.text) {
            var msg = angular.copy(m);
            var message = $.i18n.prop(msg.text);
            var type = msg.type;
            notifications.closeAll();
            if (type === "danger") {
                notifications.showError({message: message});
            } else if (type === 'warning') {
                notifications.showWarning({message: message});
            } else if (type === 'success') {
                notifications.showSuccess({message: message});
            }
            //reset
            m.text = null;
            m.type = null;
            m.show = false;
        }
    };

    $rootScope.scrollbarWidth = 0;

    $rootScope.getScrollbarWidth = function () {
        if ($rootScope.scrollbarWidth == 0) {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

            document.body.appendChild(outer);

            var widthNoScroll = outer.offsetWidth;
            // force scrollbars
            outer.style.overflow = "scroll";

            // add innerdiv
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);

            var widthWithScroll = inner.offsetWidth;

            // remove divs
            outer.parentNode.removeChild(outer);

            $rootScope.scrollbarWidth = widthNoScroll - widthWithScroll;
        }

        return $rootScope.scrollbarWidth;
    };





}]);




'use strict';

angular.module('tcl').factory('userInfo', ['$resource',
    function ($resource) {
        return $resource('api/accounts/cuser');
    }
]);

angular.module('tcl').factory('userLoaderService', ['userInfo', '$q',
    function (userInfo, $q) {
        var load = function() {
            var delay = $q.defer();
            userInfo.get({},
                function(theUserInfo) {
                    delay.resolve(theUserInfo);
                },
                function() {
                    delay.reject('Unable to fetch user info');
                }
            );
            return delay.promise;
        };
        return {
            load: load
        };
    }
]);

angular.module('tcl').factory('userInfoService', ['StorageService', 'userLoaderService',
    function(StorageService,userLoaderService) {
        var currentUser = null;
        var supervisor = false,
        author = false,
        admin = false,
        id = null,
        username = '',
        fullName= '';

        //console.log("USER ID=", StorageService.get('userID'));
       
        var loadFromCookie = function() {
            //console.log("UserID=", StorageService.get('userID'));

            id = StorageService.get('userID');
            username = StorageService.get('username');
            author = StorageService.get('author');
            supervisor = StorageService.get('supervisor');
            admin = StorageService.get('admin');
        };

        var saveToCookie = function() {
            StorageService.set('accountID', id);
            StorageService.set('username', username);
            StorageService.set('author', author);
            StorageService.set('supervisor', supervisor);
            StorageService.set('admin', admin);
            StorageService.set('fullName', fullName);
        };

        var clearCookie = function() {
            StorageService.remove('accountID');
            StorageService.remove('username');
            StorageService.remove('author');
            StorageService.remove('supervisor');
            StorageService.remove('admin');
            StorageService.remove('hthd');
            StorageService.remove('fullName');

        };

        var saveHthd = function(header) {
            StorageService.set('hthd', header);
        };

        var getHthd = function(header) {
            return StorageService.get('hthd');
        };

        var hasCookieInfo =  function() {
            if ( StorageService.get('username') === '' ) {
                return false;
            }
            else {
                return true;
            }
        };

        var getAccountID = function() {
            if ( isAuthenticated() ) {
                return currentUser.accountId.toString();
            }
            return '0';
        };

        var isAdmin = function() {
            return admin;
        };

        var isAuthor = function() {
            return author;
        };

//        var isAuthorizedVendor = function() {
//            return authorizedVendor;
//        };
//
//        var isCustomer = function() {
//            return (author || authorizedVendor);
//        };

        var isSupervisor = function() {
            return supervisor;
        };

        var isPending = function() {
            return isAuthenticated() && currentUser != null ? currentUser.pending: false;
        };

        var isAuthenticated = function() {
        	var res =  currentUser !== undefined && currentUser != null && currentUser.authenticated === true;
             return res;
        };

        var loadFromServer = function() {
            if ( !isAuthenticated() ) {
                userLoaderService.load().then(setCurrentUser);
            }
        };

        var setCurrentUser = function(newUser) {
            currentUser = newUser;
            if ( currentUser !== null && currentUser !== undefined ) {
                username = currentUser.username;
                id = currentUser.accountId;
                fullName = currentUser.fullName;
                if ( angular.isArray(currentUser.authorities)) {
                    angular.forEach(currentUser.authorities, function(value, key){
                        switch(value.authority)
                        {
                        case 'user':
                             break;
                        case 'admin':
                            admin = true;
                             break;
                        case 'author':
                            author = true;
                             break;
                        case 'supervisor':
                            supervisor = true;
                             break;
                        default:
                         }
                    });
                }
                //saveToCookie();
            }
            else {
                supervisor = false;
                author = false;
                admin = false;
                username = '';
                id = null;
                fullName = '';
                //clearCookie();
            }
        };

        var getUsername = function() {
            return username;
        };

        var getFullName = function() {
            return fullName;
        };

        return {
            saveHthd: saveHthd,
            getHthd: getHthd,
            hasCookieInfo: hasCookieInfo,
            loadFromCookie: loadFromCookie,
            getAccountID: getAccountID,
            isAdmin: isAdmin,
            isAuthor: isAuthor,
            isAuthenticated: isAuthenticated,
            isPending: isPending,
            isSupervisor: isSupervisor,
            setCurrentUser: setCurrentUser,
            loadFromServer: loadFromServer,
            getUsername: getUsername,
            getFullName: getFullName

        };
    }
]);

'use strict';

angular.module('tcl').factory('Account', ['$resource',
    function ($resource) {
        return $resource('api/accounts/:id', {id: '@id'});
    }
]);

angular.module('tcl').factory('LoginService', ['$resource', '$q',
    function ($resource, $q) {
        return function() {
            var myRes = $resource('api/accounts/login');
            var delay = $q.defer();
            myRes.get({},
                function(res) {
                    delay.resolve(res);
                }
            );
            return delay.promise;
        };
    }
]);

angular.module('tcl').factory('AccountLoader', ['Account', '$q',
    function (Account, $q) {
        return function(acctID) {
            var delay = $q.defer();
            Account.get({id: acctID},
                function(account) {
                    delay.resolve(account);
                },
                function() {
                    delay.reject('Unable to fetch account');
                }
            );
            return delay.promise;
        };
    }
]);

/**
 * Created by haffo on 3/3/16.
 */

angular.module('tcl').factory('AppInfo', ['$http', '$q', function ($http, $q) {
    return {
        get: function () {
            var delay = $q.defer();
            $http.get('api/appInfo').then(
                function (object) {
                    delay.resolve(angular.fromJson(object.data));
                },
                function (response) {
                    delay.reject(response.data);
                }
            );
            return delay.promise;
        }
    };
}]);
/**
 * Created by haffo on 3/18/16.
 */
angular.module('tcl').factory('AutoSaveService',
    ["$interval", "IgDocumentService", "$rootScope", "StorageService", function ($interval, IgDocumentService,$rootScope,StorageService) {
        var AutoSaveService = {
            value: undefined,
            interval: "60000", // every 60s
            start: function () {
                if (angular.isDefined(this.value)) {
                    this.stop();
                }
                this.value = $interval(this.saveDoc, this.interval);
            },
            stop: function () {
                if (angular.isDefined(this.value)) {
                    $interval.cancel(this.value);
                    this.value = undefined;
                }
            },
            saveDoc: function () {
                if ($rootScope.igdocument != null && $rootScope.hasChanges()) {
                    $rootScope.autoSaving = true;
                    $rootScope.saved = false;
                    $rootScope.clearChanges();
                    IgDocumentService.save($rootScope.igdocument).then(function(){
                        $rootScope.autoSaving = false;
                        $rootScope.saved = true;
                        StorageService.setIgDocument($rootScope.igdocument);
                        $rootScope.msg().text = null;
                        $rootScope.msg().type =null;
                        $rootScope.msg().show = false;
                    },function(){
                        $rootScope.autoSaving = false;
                        $rootScope.saved = false;
                        $rootScope.msg().text = null;
                        $rootScope.msg().type =null;
                        $rootScope.msg().show = false;
                    });
                }
            }
        };
        return AutoSaveService;
    }]);


angular.module('tcl').factory(
		'CloneDeleteSvc',
		["$rootScope", "$modal", "ProfileAccessSvc", "$cookies", function($rootScope, $modal, ProfileAccessSvc, $cookies) {

			var svc = this;
			
			svc.copySection = function(section) {
				var newSection = angular.copy(section.reference);
				newSection.id = new ObjectId();
				var rand = Math.floor(Math.random() * 100);
				if (!$rootScope.igdocument.profile.metaData.ext) {
					$rootScope.igdocument.profile.metaData.ext = "";
				}
				newSection.sectionTitle = section.reference.sectionTitle + "-"
				+ $rootScope.igdocument.profile.metaData.ext + "-"
				+ rand;
				newSection.label = newSection.sectionTitle;
				section.parent.childSections.splice(0, 0, newSection);
				section.parent.childSections = positionElements(section.parent.childSections);
				$rootScope.$broadcast('event:SetToC');	
				$rootScope.$broadcast('event:openSection', newSection);	
			}
			
			svc.copySegment = function(segment) {

		          var newSegment = angular.copy(segment);
		            newSegment.id = new ObjectId().toString();
		            newSegment.label = $rootScope.createNewFlavorName(segment.label);
		            if (newSegment.fields != undefined && newSegment.fields != null && newSegment.fields.length != 0) {
		                for (var i = 0; i < newSegment.fields.length; i++) {
		                    newSegment.fields[i].id = new ObjectId().toString();
		                }
		            }
		            var dynamicMappings = newSegment['dynamicMappings'];
		            if (dynamicMappings != undefined && dynamicMappings != null && dynamicMappings.length != 0) {
		                angular.forEach(dynamicMappings, function (dynamicMapping) {
		                	dynamicMapping.id = new ObjectId().toString();
		                		angular.forEach(dynamicMapping.mappings, function (mapping) {
		                			mapping.id = new ObjectId().toString();
//			                		angular.forEach(mapping.cases, function (case) {
//			                			case.id = new ObjectId().toString();
//			                		});
		                		});
		                });
		            }
		            $rootScope.segments.push(newSegment);
		            $rootScope.igdocument.profile.segments.children.splice(0, 0, newSegment);
		            $rootScope.igdocument.profile.segments.children = positionElements($rootScope.igdocument.profile.segments.children);
		            $rootScope.segment = newSegment;
		            $rootScope.segmentsMap[newSegment.id] = newSegment;
		            $rootScope.recordChanged();
					$rootScope.$broadcast('event:SetToC');	
					$rootScope.$broadcast('event:openSegment', newSegment);	
			}
			
			svc.copyDatatype = function(datatype) {

		          var newDatatype = angular.copy(datatype);
		            newDatatype.id = new ObjectId().toString();
		            newDatatype.label = $rootScope.createNewFlavorName(datatype.label);
		            if (newDatatype.components != undefined && newDatatype.components != null && newDatatype.components.length != 0) {
		                for (var i = 0; i < newDatatype.components.length; i++) {
		                    newDatatype.components[i].id = new ObjectId().toString();
		                }
		            }
		            var predicates = newDatatype['predicates'];
		            if (predicates != undefined && predicates != null && predicates.length != 0) {
		                angular.forEach(predicates, function (predicate) {
		                    predicate.id = new ObjectId().toString();
		                });
		            }
		            var conformanceStatements = newDatatype['conformanceStatements'];
		            if (conformanceStatements != undefined && conformanceStatements != null && conformanceStatements.length != 0) {
		                angular.forEach(conformanceStatements, function (conformanceStatement) {
		                    conformanceStatement.id = new ObjectId().toString();
		                });
		            }
		            $rootScope.igdocument.profile.datatypes.children.splice(0, 0, newDatatype);
		            $rootScope.igdocument.profile.datatypes.children = positionElements($rootScope.igdocument.profile.datatypes.children);
		            $rootScope.datatype = newDatatype;
		            $rootScope.datatypesMap[newDatatype.id] = newDatatype;
		            $rootScope.recordChanged();
					$rootScope.$broadcast('event:SetToC');	
					$rootScope.$broadcast('event:openDatatype', newDatatype);	
			}

			svc.copyTable = function(table) {

	          var newTable = angular.copy(table);
	          newTable.id = new ObjectId().toString();
		        newTable.bindingIdentifier = $rootScope.createNewFlavorName(table.bindingIdentifier);

		        newTable.codes = [];
		        for (var i = 0, len1 = table.codes.length; i < len1; i++) {
		            var newValue = {
		                    id: new ObjectId().toString(),
		                    type: 'value',
		                    value: table.codes[i].value,
		                    label: table.codes[i].label,
		                    codeSystem: table.codes[i].codeSystem,
		                    codeUsage: table.codes[i].codeUsage
		                };
		            
		            newTable.codes.push(newValue);
		        }

		        $rootScope.table = newTable;
		        $rootScope.tablesMap[newTable.id] = newTable;
		        
		        $rootScope.codeSystems = [];
		        
		        for (var i = 0; i < $rootScope.table.codes.length; i++) {
		        	if($rootScope.codeSystems.indexOf($rootScope.table.codes[i].codeSystem) < 0) {
		        		if($rootScope.table.codes[i].codeSystem && $rootScope.table.codes[i].codeSystem !== ''){
		        			$rootScope.codeSystems.push($rootScope.table.codes[i].codeSystem);
		        		}
					}
		    	}
		     
		        $rootScope.igdocument.profile.tables.children.splice(0, 0, newTable);
	            $rootScope.igdocument.profile.tables.children = positionElements($rootScope.igdocument.profile.tables.children);
	            $rootScope.recordChanged();
				$rootScope.$broadcast('event:SetToC');	
				$rootScope.$broadcast('event:openTable', newTable);	
			}
			
			svc.copyMessage = function(message) {
				// TODO gcr: Need to include the user identifier in the
				// new label.
				// $rootScope.igdocument.metaData.ext should be just that,
				// but is currently
				// unpopulated in the profile.
				var newMessage = angular.copy(message);
				newMessage.id = new ObjectId().toString();
				var groups = ProfileAccessSvc.Messages().getGroups(newMessage);
				angular.forEach(groups, function(group) {
					group.id = new ObjectId().toString();
				});
				newMessage.name = $rootScope.createNewFlavorName(message.name);
				$rootScope.igdocument.profile.messages.children.splice(0, 0, newMessage);
				$rootScope.$broadcast('event:SetToC');	
				return newMessage;
			}
						
			svc.deleteValueSet = function(table) {
		        $rootScope.references = [];
		        angular.forEach($rootScope.segments, function (segment) {
		            $rootScope.findTableRefs(table, segment);
		        });
		        if ($rootScope.references != null && $rootScope.references.length > 0) {
		        		abortValueSetDelete(table);
		        } else {
		        		confirmValueSetDelete(table);
		        }
			}
			
			svc.exportDisplayXML = function(messageID) {
				var form = document.createElement("form");
		     	form.action = $rootScope.api('api/igdocuments/' + $rootScope.igdocument.id + '/export/Display/' + messageID);
		     	form.method = "POST";
		     	form.target = "_target";
		     	var csrfInput = document.createElement("input");
		     	csrfInput.name = "X-XSRF-TOKEN";
		     	csrfInput.value = $cookies['XSRF-TOKEN'];
		     	form.appendChild(csrfInput);
		     	form.style.display = 'none';
		     	document.body.appendChild(form);
		     	form.submit();
			}
			
		    function abortValueSetDelete(table) {
		        var modalInstance = $modal.open({
		            templateUrl: 'ValueSetReferencesCtrl.html',
		            controller: 'ValueSetReferencesCtrl',
		            resolve: {
		                tableToDelete: function () {
		                    return table;
		                }
		            }
		        });
		        modalInstance.result.then(function (table) {
		            $scope.tableToDelete = table;
		        }, function () {
		        });
		    };
		    
		    function confirmValueSetDelete(table) {
		        var modalInstance = $modal.open({
		            templateUrl: 'ConfirmValueSetDeleteCtrl.html',
		            controller: 'ConfirmValueSetDeleteCtrl',
		            resolve: {
		                tableToDelete: function () {
		                    return table;
		                }
		            }
		        });
		        modalInstance.result.then(function (table) {
		            tableToDelete = table;
		        }, function () {
		        });
		    };
			
			function deleteValueSets(vssIdsSincerelyDead) {
//				console.log("deleteValueSets: vssIdsSincerelyDead=" + vssIdsSincerelyDead.length);
				return ProfileAccessSvc.ValueSets().removeDead(vssIdsSincerelyDead);		
			}
						
			svc.deleteDatatype = function(datatype) {
					$rootScope.references = [];
		            angular.forEach($rootScope.segments, function (segment) {
		                $rootScope.findDatatypeRefs(datatype, segment);
		            });
		            if ($rootScope.references != null && $rootScope.references.length > 0) {
		            		abortDatatypeDelete(datatype);
		            } else {
		            		confirmDatatypeDelete(datatype);
		            }
			}
			
			function abortDatatypeDelete(datatype) {
				var dtToDelete;
	            var modalInstance = $modal.open({
	                templateUrl: 'DatatypeReferencesCtrl.html',
	                controller: 'DatatypeReferencesCtrl',
	                resolve: {
	                    dtToDelete: function () {
	                        return datatype;
	                    }
	                }
	            });
	            modalInstance.result.then(function (datatype) {
	                dtToDelete = datatype;
	            }, function () {
	            });
	        };

	        function confirmDatatypeDelete(datatype) {
				var dtToDelete;
	            var modalInstance = $modal.open({
	                templateUrl: 'ConfirmDatatypeDeleteCtrl.html',
	                controller: 'ConfirmDatatypeDeleteCtrl',
	                resolve: {
	                    dtToDelete: function () {
	                        return datatype;
	                    }
	                }
	            });
	            modalInstance.result.then(function (datatype) {
	                dtToDelete = datatype;
	            }, function () {
	            });
	        };	
	        
	        
			function deleteDatatypes(dtIdsLive, dtsIdsSincerelyDead) {

				// Get all value sets that are contained in the sincerely dead datatypes.
				var vssIdsMerelyDead = ProfileAccessSvc.Datatypes().findValueSetsFromDatatypeIds(dtsIdsSincerelyDead);
				// then all value sets that are contained in the live datatypes.
				var vssIdsLive = ProfileAccessSvc.Datatypes().findValueSetsFromDatatypeIds(dtIdsLive);
				var vssIdsSincerelyDead = ProfileAccessSvc.ValueSets().findDead(vssIdsMerelyDead, vssIdsLive);		
				deleteValueSets(vssIdsSincerelyDead);
				
				var rval = ProfileAccessSvc.Datatypes().removeDead(dtsIdsSincerelyDead);		

//				console.log("deleteDatatypes: vssIdsMerelyDead=" + vssIdsMerelyDead.length);
//				console.log("deleteDatatypes: vssIdsLive=" + vssIdsLive.length);
//				console.log("deleteDatatypes: vssIdsSincerelyDead=" + vssIdsSincerelyDead.length);
				
				return rval;
			}

			svc.deleteSegment = function(segment) {
				$rootScope.references = ProfileAccessSvc.Segments().getParentalDependencies(segment);
	            if ($rootScope.references != null && $rootScope.references.length > 0) {
	            		abortSegmentDelete(segment);
	            } else {
	            		confirmSegmentDelete(segment);
	            }
			}
			
			function abortSegmentDelete(segment) {
				var segToDelete;
	            var modalInstance = $modal.open({
	                templateUrl: 'SegmentReferencesCtrl.html',
	                controller: 'SegmentReferencesCtrl',
	                resolve: {
	                		segToDelete: function () {
	                        return segment;
	                    }
	                }
	            });
	            modalInstance.result.then(function (segment) {
	            		segToDelete = segment;
	            }, function () {
	            });
	        };

	        function confirmSegmentDelete(segment) {
				var segToDelete;
	            var modalInstance = $modal.open({
	                templateUrl: 'ConfirmSegmentDeleteCtrl.html',
	                controller: 'ConfirmSegmentDeleteCtrl',
	                resolve: {
	                		segToDelete: function () {
	                        return segment;
	                    }
	                }
	            });
	            modalInstance.result.then(function (segment) {
	            		segToDelete = segment;
	            }, function () {
	            });
	        };	

			function deleteSegments(segmentRefsLive, segmentRefsSincerelyDead) {

				// Get all datatypes that are contained in the sincerely dead segments.
				var dtIdsMerelyDead = ProfileAccessSvc.Segments().findDatatypesFromSegmentRefs(segmentRefsSincerelyDead);

				// then all datatypes that are contained in the live segments.				
				var dtIdsLive = ProfileAccessSvc.Segments().findDatatypesFromSegmentRefs(segmentRefsLive);
				var dtsIdsSincerelyDead = ProfileAccessSvc.Datatypes().findDead(dtIdsMerelyDead, dtIdsLive);
				deleteDatatypes(dtIdsLive, dtsIdsSincerelyDead);
				
				var rval = ProfileAccessSvc.Segments().removeDead(segmentRefsSincerelyDead);				

//				console.log("deleteSegments: dtIdsMerelyDead=" + dtIdsMerelyDead.length);
//				console.log("deleteSegments: dtIdsLive=" + dtIdsLive.length);
//				console.log("deleteSegments: dtsIdsSincerelyDead=" + dtsIdsSincerelyDead.length);

				return rval;
			}

			svc.deleteMessage = function(message) {
				// We do the delete in pairs: dead and live.  dead = things we are deleting and live = things we are keeping. 
				
				// We are deleting the message so it's dead.
				// The message there is from the ToC so what we need is its reference,
				// and it must be an array of one.
				var msgDead = [message.id];
				// We are keeping the children so their live.
				var msgLive = ProfileAccessSvc.Messages().messages();
				
				// We remove the dead message from the living.
				var idxP = _.findIndex(msgLive, function (
						child) {
					return child.id === msgDead[0];
				});
				
				msgLive.splice(idxP, 1);
				if (0 === ProfileAccessSvc.Messages().messages().length) {
					ProfileAccessSvc.ValueSets().truncate();
					ProfileAccessSvc.Datatypes().truncate();
					ProfileAccessSvc.Segments().truncate();
					return;
				}
				// We get all segment refs that are contained in the dead message.
				var segmentRefsMerelyDead = ProfileAccessSvc.Messages()
						.getAllSegmentRefs(msgDead);
				// We get all segment refs that are contained in the live messages.
				var segmentRefsLive = ProfileAccessSvc.Messages()
				.getAllSegmentRefs(msgLive);
				// Until now, dead meant mearly dead.  We now remove those that are most sincerely dead.
				var segmentRefsSincerelyDead = ProfileAccessSvc.Segments().findDead(segmentRefsMerelyDead, segmentRefsLive);
				if (segmentRefsSincerelyDead.length === 0) {
//					console.log("Zero dead==>");			
					return;
				}
				
				var rval = deleteSegments(segmentRefsLive, segmentRefsSincerelyDead);
				
//				console.log("svc.deleteMessage: segmentRefsMerelyDead=" + segmentRefsMerelyDead.length);
//				console.log("svc.deleteMessage: segmentRefsLive=" + segmentRefsLive.length);
//				console.log("svc.deleteMessage: segmentRefsSincerelyDead=" + segmentRefsSincerelyDead.length);
//
//				console.log("svc.deleteMessage: aMsgs=" + ProfileAccessSvc.Messages().messages().length);
//				console.log("svc.deleteMessage: aSegs=" + ProfileAccessSvc.Segments().segments().length);
//				console.log("svc.deleteMessage: aDts=" + ProfileAccessSvc.Datatypes().datatypes().length);
//				console.log("svc.deleteMessage: aVss=" + ProfileAccessSvc.ValueSets().valueSets().length);
				
				return rval;
			}
			
			svc.deleteSection = function(section) {

				var secLive = section.parent.childSections;
				
				var idxP = _.findIndex(secLive, function (
						child) {
					return child.id === section.reference.id;
				});
				section.parent.childSections.splice(idxP, 1);
			}
	      
	        svc.findMessageIndex = function(messages, id) {
				var idxT = _.findIndex(messages.children, function(child) {
					return child.reference.id === id;
				})
				return idxT;
			}
			
			function positionElements(chidren) {
				var sorted = _.sortBy(chidren, "sectionPosition");
				var start = sorted[0].sectionPosition;
				_.each(sorted, function(sortee) {
					sortee.sectionPosition = start++;
				});
				return sorted;
			}

			return svc;
		}]);
'use strict';

/**
 * @ngdoc function
 * @description
 *
 * This service is used to tranfer the state of a context menu selection between controllers.  
 * The state can be accessed but once.  It is left in its inital state. 
 */

angular.module('tcl').factory('ContextMenuSvc', function () {
	
	var svc = {};
    
    svc.item = null;
    
    svc.ext = null;
    
    svc.get = function() {
    	var tmp = svc.item;
    	svc.item = null;
    	return tmp;
    };
    
    svc.put = function(item) {
    	svc.item = item;
    };
    
    return svc;
});





/**
 * http://usejsdoc.org/
 */
angular.module('tcl').factory('DTLibSvc', ["$http", "ngTreetableParams", function($http, ngTreetableParams) {
	
	var svc = this;
	
	var dtLib = {};
	
	svc.getDTLib = function(scope) {
		return new ngTreetableParams({
			getNodes : function(parent) {
				return dtLib(scope);
			},
	        getTemplate : function(node) {
	            return 'DTLibNode.html';
	        },
	        options : {
	            onNodeExpand: function() {
	                console.log('A node was expanded!');
	            }
	        }
		});
	};
	
	function dtLib(scope) {
		console.log("dtLib scope=" + JSON.stringify(scope));
		var dtlrw = {
			"scope" : scope,
			"dtLib" : svc.dtLib
		}
		return $http.post(
				'api/master-dt-lib', dtlrw)
				.then(function(response) {
					svc.dtLib = response.data;
				return angular.fromJson(dtLib.children)});
	};

	svc.save = function(dtLib) {
		return $http.post(
				'api/master-dt-lib', dtLib).then(function(response) {
				return angular.fromJson(response.data.children)});
	};
	
	return svc;
}]);
/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('DatatypeService',
    ['$rootScope', 'ViewSettings', 'ElementUtils', function ($rootScope, ViewSettings, ElementUtils) {
        var DatatypeService = {
            getNodes: function (parent) {
                if (parent && parent != null) {
                    if (parent.datatype) {
                        var dt = $rootScope.datatypesMap[parent.datatype];
                        return dt.components;
                    } else {
                        return parent.components;
                    }
                } else {
                    if ($rootScope.datatype != null) {
                        return $rootScope.datatype.components;
                    } else {
                        return [];
                    }
                }
            },
            getParent: function (child) {
                return $rootScope.parentsMap[child.id] ? $rootScope.parentsMap[child.id] : null;
            },
            getTemplate: function (node) {
                if (ViewSettings.tableReadonly) {
                    return node.type === 'Datatype' ? 'DatatypeReadTree.html' : node.type === 'component' && !DatatypeService.isDatatypeSubDT(node) ? 'DatatypeComponentReadTree.html' : node.type === 'component' && DatatypeService.isDatatypeSubDT(node) ? 'DatatypeSubComponentReadTree.html' : '';
                } else {
                    return node.type === 'Datatype' ? 'DatatypeEditTree.html' : node.type === 'component' && !DatatypeService.isDatatypeSubDT(node) ? 'DatatypeComponentEditTree.html' : node.type === 'component' && DatatypeService.isDatatypeSubDT(node) ? 'DatatypeSubComponentEditTree.html' : '';
                }
            },
            isDatatypeSubDT: function (component) {
                if ($rootScope.datatype != null) {
                    for (var i = 0, len = $rootScope.datatype.components.length; i < len; i++) {
                        if ($rootScope.datatype.components[i].id === component.id)
                            return false;
                    }
                }
                return true;
            },
            isBranch: function (node) {
                var children = DatatypeService.getNodes(node);
                return children != null && children.length > 0;
            },
            isVisible: function (node) {
                return  node ? DatatypeService.isRelevant(node) ? DatatypeService.isVisible(DatatypeService.getParent(node)) : false : true;
            },
            isRelevant: function (node) {
                if (node === undefined || !ViewSettings.tableRelevance)
                    return true;
                if (node.hide == undefined || !node.hide || node.hide === false) {
                    var predicates = DatatypeService.getDatatypeLevelPredicates(node);
                    return ElementUtils.isRelevant(node, predicates);
                } else {
                    return false;
                }
            },
            getDatatypeLevelConfStatements: function (element) {
                var datatype = DatatypeService.getParent(element);
                var confStatements = [];
                if (datatype && datatype != null && datatype.conformanceStatements.length > 0) {
                    return ElementUtils.filterConstraints(element, datatype.conformanceStatements);
                }
                return confStatements;
            },

            getDatatypeLevelPredicates: function (element) {
                var datatype = DatatypeService.getParent(element);
                var predicates = [];
                if (datatype && datatype != null && datatype.predicates.length > 0) {
                    return ElementUtils.filterConstraints(element, datatype.predicates);
                }
                return predicates;
            }
        };
        return DatatypeService;
    }]);

/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('ElementUtils',
    ['$rootScope', 'ViewSettings', function ($rootScope, ViewSettings) {
        var ElementUtils = {
            filterConstraints: function (node, constraints) {
                if (constraints) {
                    return $filter('filter')(constraints, {constraintTarget: node.position + '[1]'}, true);
                }
                return null;
            },
            isRelevant: function (node, predicates) {
                if (predicates && predicates != null && predicates.length > 0) {
                    return  predicates[0].trueUsage === "R" || predicates[0].trueUsage === "RE" || predicates[0].falseUsage === "R" || predicates[0].falseUsage === "RE";
                } else {
                    return node.usage == null || !node.usage || node.usage === "R" || node.usage === "RE" || node.usage === "C";
                }
            },
            setUsage: function (node) {
                if( node.usage && node.min) {
                    if( node.usage === "R" && node.min == 0){
                        node.min = 1;
                    }
                    if( node.usage === "0"){
                        node.min = 0;
                    }
                }
            }
        };
        return ElementUtils;
    }]);

/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('IdleService',
    ["$http", function ($http) {
        var IdleService = {
            keepAlive: function () {
                 return $http.get(
                    'api/session/keepAlive');
            }
        };
        return IdleService;
    }]);

/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('IgDocumentMapping',
    ['$rootScope', 'ViewSettings', '$q', 'userInfoService', '$http', 'StorageService', function ($rootScope, ViewSettings, $q, userInfoService, $http,StorageService) {
        var IgDocumentMapping = {
            createMapping : function(){

            }
        };
        return IgDocumentMapping;
    }]);

/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('IgDocumentService',
    ['$rootScope', 'ViewSettings', '$q', 'userInfoService', '$http', 'StorageService', '$cookies',function ($rootScope, ViewSettings, $q, userInfoService, $http,StorageService,$cookies) {
        var IgDocumentService = {
            save: function (igDocument) {
                $rootScope.saved = false;
                var delay = $q.defer();
                var changes = angular.toJson([]);
                igDocument.accountId = userInfoService.getAccountID();
                var data = angular.fromJson({"changes": changes, "igDocument": igDocument});
                $http.post('api/igdocuments/save', data).then(function (response) {
                    var saveResponse = angular.fromJson(response.data);
                    igDocument.metaData.date = saveResponse.date;
                    igDocument.metaData.version = saveResponse.version;
                    $rootScope.saved = true;
                    delay.resolve(saveResponse);
                }, function (error) {
                    delay.reject(error);
                    $rootScope.saved = false;
                });
                return delay.promise;
            },
            exportAs: function(igDocument,format){
                var form = document.createElement("form");
                form.action = $rootScope.api('api/igdocuments/' + igDocument.id + '/export/' + format);
                form.method = "POST";
                form.target = "_target";
                var csrfInput = document.createElement("input");
                csrfInput.name = "X-XSRF-TOKEN";
                csrfInput.value = $cookies['XSRF-TOKEN'];
                form.appendChild(csrfInput);
                form.style.display = 'none';
                document.body.appendChild(form);
                form.submit();
            }
        };
        return IgDocumentService;
    }]);

'use strict';

/**
 * @ngdoc function
 * @description
 * 
 * This service enables the MessageEvents structure to be accessed from both the
 * controllers of the Create IG Dialog.
 */

angular.module('tcl').factory('MessageEventsSvc', ["$http", "ngTreetableParams", function($http, ngTreetableParams) {
	
	var svc = this;
	
//	svc.messagesByVersion = {};
	
//	svc.state = {};
//	
//	svc.getState = function() {
//		return svc.state; 
//	}
//	
//	svc.putState = function(state) {
//		svc.state = state; 
//	}
	
	svc.getMessageEvents = function(hl7Version) {
		return new ngTreetableParams( {
			getNodes: function(parent) {
				return parent ? parent.children : mes(hl7Version)
			},
	        getTemplate: function(node) {
	            return 'MessageEventsNode.html';
	        },
	        options: {
	            onNodeExpand: function() {
	                console.log('A node was expanded!');
	            }
	        }
		});
	};
	
function mes(hl7Version) {
	console.log("hl7Version=" + JSON.stringify(hl7Version));
	return $http.post(
			'api/igdocuments/messageListByVersion', hl7Version).then(function(response) {
				var messageEvents = angular.fromJson(response.data);
				return _.sortBy(messageEvents, function(messageEvent) { return messageEvent.name; });
			});
		};

	return svc;
}]);
'use strict';

angular.module('tcl').factory('Authors', ['$resource',
    function ($resource) {
        return $resource('api/shortaccounts', {filter:'accountType::author'});
    }
]);

angular.module('tcl').factory('Supervisors', ['$resource',
    function ($resource) {
        return $resource('api/shortaccounts', {filter:'accountType::supervisor'});
    }
]);


angular.module('tcl').factory('MultiAuthorsLoader', ['Authors', '$q',
    function (Authors, $q) {
        return function() {
            var delay = $q.defer();
            Authors.query(
                function(auth) {
                    delay.resolve(auth);
                },
                function() {
                    delay.reject('Unable to fetch list of authors');
                }
            );
            return delay.promise;
        };
    }
]);

angular.module('tcl').factory('MultiSupervisorsLoader', ['Supervisors', '$q',
    function (Supervisors, $q) {
        return function() {
            var delay = $q.defer();
            Supervisors.query(
                function(res) {
                    delay.resolve(res);
                },
                function() {
                    delay.reject('Unable to fetch list of supervisors');
                }
            );
            return delay.promise;
        };
    }
]);

angular.module('tcl').factory ('ProfileAccessSvc', ["$rootScope", function($rootScope) {

	var svc = this;

	svc.Version = function() {
		return $rootScope.igdocument.profile.metaData.hl7Version;
	}

	svc.Messages = function() {
	
		var msgs = this;
	
		msgs.messages = function() {
			return $rootScope.igdocument.profile.messages.children;
		};
		
		msgs.findById = function(id) {
			return _.find(msgs.messages(), function(message) {
				return message.id === id;
			});
		}
		
		msgs.getMessageIds = function() {

			var rval = [];

			_.each($rootScope.igdocument.profile.messages.children, function(message) {
				rval.push(message.id);
			});

			return rval;
		}
		
		msgs.getAllSegmentRefs = function(messages) {

			var segRefs = [];
			
			_.each(messages, function(message) {
				var refs = msgs.getSegmentRefs(message);
				_.each(refs, function(ref){
					segRefs.push(ref);
				});
			});
			
			return _.uniq(segRefs);
		}
	
		msgs.getSegmentRefs = function(message) {
			
			var segRefs = [];
			
			_.each(message.children, function(groupORsegment) {
				var refs = fetchSegmentRefs(groupORsegment);
				_.each(refs, function(ref){
					segRefs.push(ref);
				});
			});
			
		  return _.uniq(segRefs);
		}
		
		msgs.getGroups = function(message) {
			
			var groups = [];
			
			_.each(message.children, function(groupORsegment) {
//				console.log("Was a what? groupORsegment.type="
//						+ groupORsegment.type + " name=" + message.name);
				var grps = fetchGroups(groupORsegment);
				_.each(grps, function(grp){
					groups.push(grp);
				});
			});
			
		  return groups;
		}
		
		function fetchGroups(groupORsegment) {

			var groups = [];
			
			if (groupORsegment.type === "group") {
				console.log("Was a group groupORsegment.type="
						+ groupORsegment.type);
				groups.push(groupORsegment);
				_.each(groupORsegment.children, function(groupORsegment1) {
					var grps = fetchGroups(groupORsegment1);
					_.each(grps, function(grp){
						groups.push(grp);
					});
				});
			} else {
				console.log("Was a segmentRef groupORsegment.type="
								+ groupORsegment.type);
			}
			
			return groups;
		}
	
		function fetchSegmentRefs(groupORsegment) {

			var segRefs = [];
			
			if (groupORsegment.type === "group") {
				_.each(groupORsegment.children, function(groupORsegment1) {
					var refs = fetchSegmentRefs(groupORsegment1);
					_.each(refs, function(ref){
						segRefs.push(ref);
					});
				});
			} else if (groupORsegment.type === "segmentRef") {
				segRefs.push(groupORsegment.ref);
			} else {
				console.log("Was neither group nor segmentRef groupORsegment.type="
								+ groupORsegment.type);
			}
			
			return segRefs;
		}
	
		return msgs;
	}

	svc.Segments = function() {
	
		var segs = this;
	
		segs.segments = function() {
			return $rootScope.igdocument.profile.segments.children;
		}
		
		segs.truncate = function() {
			segs.segments().length = 0;
		}
		
		segs.getAllSegmentIds = function() {
			var rval = [];
			_.each(segs.segments(), function(seg){
				rval.push(seg.id);
			});
			return rval;
		}
		
		segs.findByIds = function(ids) {
			var segments = [];
			_.each(ids, function(id){
				var segment = segs.findById(id);
				if (segment) {
					segments.push(segment);
				}
			});
			return segments;
		}
		
		segs.findById = function(segId) {
//			console.log("segIds=" + segs.getAllSegmentIds());
			var segments = segs.segments();
			
			var segment = _.find(segments, function(segment1) {
				return segment1.id === segId;
			});
			
			if (!segment) {
				console.log("segs.findById: segment not found, segId=" + segId);
			}
			return segment;
		}
		
		segs.findDead = function(idsDead, idsLive) {
			var segIds = _.difference(idsDead, idsLive);
			return segIds;
		}
		
		segs.removeDead = function(segIds) {
			var segments = segs.segments();
			var i = -1;
		
			_.each(ensureArray(segIds), function(id) {
				i = _.findIndex(segments, { 'id' : id });
				if (i > -1) {
					segments.splice(i, 1);
				}
			});
			
			return segments.length;
		}
		
		segs.getParentalDependencies = function(segment) {
			var messages = svc.Messages().messages();
			var rval = _.filter(messages, function(message) {
				var segRefs= svc.Messages().getSegmentRefs(message);
				return _.indexOf(segRefs, segment.id) >= 0;
			});
			return rval;
		}
		
		segs.findDatatypesFromSegmentRefs  = function(segRefs) {
			
			var dtIds = [];
			
			_.each(segRefs, function(segRef) {
				var segment = segs.findById(segRef);
				if (segment) {
					dtIds.push(segs.findDatatypesFromSegment(segment));
				} else {
					console.log("segs.findDatatypesFromSegmentRefs: Did not find seg for segRef=" + segRef);
				}
			});
			
			return _.uniq(_.flatten(dtIds));
		}
		
		segs.findDatatypesFromSegment = function(segment) {
			
			var dtIds = [];
			
			_.each(segment.fields, function(field) {
				dtIds.push(field.datatype);
			});
			
			return _.uniq(dtIds);
		}

		return segs;
	}

	svc.Datatypes = function() {
	
		var dts = this;
	
		dts.datatypes = function() {
			return $rootScope.igdocument.profile.datatypes.children;
		}
		
		dts.truncate = function() {
			dts.datatypes().length = 0;
		}
		
		dts.getAllDatatypeIds = function() {
			
			var dtIds = [];
			
			_.each(dts.datatypes(), function(datatype) {
				dtIds.push(datatype.id);
			});
			
			return dtIds;
		}
		
		dts.findById = function(id) {
			var datatype = _.find(dts.datatypes(), function(datatype) {
				return datatype.id === id;
			});
			if (!datatype) {
				console.log("dts.findById: datatype not found id=" + id);
			}
			return datatype;
		}						
		
		dts.findDead = function(idsDead, idsLive) {
			var dtIds = _.difference(idsDead, idsLive);
			return dtIds;
		}
				
		dts.removeDead = function(dtIds) {
			var datatypes = dts.datatypes();
			var i = 0;
			
			_.each(ensureArray(dtIds), function(id) {
				i = _.findIndex(datatypes, { 'id' : id });
				if (i > -1) {
					datatypes.splice(i, 1);
				}
			});
			
			return datatypes.length;
		}
		
		dts.findValueSetsFromDatatypeIds = function(dtIds) {
			
			var vsIds = [];
			
			_.each(dtIds, function(dtId) {
				var datatype = dts.findById(dtId);
				if (datatype) {
					var rvals = dts.findValueSetsFromDatatype(datatype);
					_.each(rvals, function(rval) {
						vsIds.push(rval);
					});
				} else {
					console.log("dts.findValueSetsFromDatatypeIds: Did not find dt for dtId=" + dtId);
				}
			});
			
			return _.uniq(vsIds);
		}
		
		dts.findValueSetsFromDatatype = function(datatype) {
			
			vsIds = [];
			
			_.each(datatype.components, function(component) {
				if (component.table.trim()) {
					vsIds.push(component.table);
				}
			});
			
			return _.uniq(vsIds);
		}
		
		return dts;
	}
	
	svc.ValueSets = function() {
		
		var vss = this;
		
		vss.valueSets = function() {
			return $rootScope.igdocument.profile.tables.children;
		};
				
		vss.truncate = function() {
			vss.valueSets().length = 0;
		};
		
		vss.getAllValueSetIds = function() {
			
			var vsIds = [];
			var valueSets = vss.valueSets();
			var i = 0;
			_.each(valueSets, function(valueSet) {
				if (valueSet) {
					vsIds.push(valueSet.id);
				}
			});
			
			return vsIds;
		}
		
		vss.findById = function(id) {
			var valueSet =  _.find(vss.valueSets(), function(vs) {
				return vs.id === id;
			});
			if (!valueSet) {
				console.log("vss.findById:: Did not find vs for vsId=" + dtId);
			}
			return valueSet;
		}
		
		vss.findDead = function(idsDead, idsLive) {
			var vsIds = _.difference(idsDead, idsLive);
			return vsIds;
		}
		
		vss.removeDead = function(vsIds) {			
			var valueSets = vss.valueSets();
//			console.log("b vss.removeDead=" + valueSets.length);
			
			_.each(ensureArray(vsIds), function(vsId) {
				var i = 0;
				_.each(valueSets, function(valueSet) {
					i = _.findIndex(valueSets, { 'id' : vsId });
					if (i > -1) {
						valueSets.splice(i, 1);
					}
				});
			});
			
			return valueSets.length;
		}
		
		return vss;
	}
	
	function ensureArray(possibleArray) {
		if(angular.isArray(possibleArray)) {
			return possibleArray;
		} else {
			console.log("Array ensured.");
			return [possibleArray];
		}
	}
	
	return svc;
}]);
/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('SegmentService',
    ['$rootScope', 'ViewSettings', 'ElementUtils', function ($rootScope, ViewSettings,ElementUtils) {
        var SegmentService = {
            getNodes: function (parent) {
                return parent ? parent.fields ? parent.fields : parent.datatype ? $rootScope.datatypesMap[parent.datatype].components : parent.children : $rootScope.segment != null ? $rootScope.segment.fields : [];
            },
            getParent: function (child) {
                return $rootScope.parentsMap && $rootScope.parentsMap[child.id] ? $rootScope.parentsMap[child.id] : null;
            },
            getTemplate: function (node) {
                if (ViewSettings.tableReadonly) {
                    return node.type === 'segment' ? 'SegmentReadTree.html' : node.type === 'field' ? 'SegmentFieldReadTree.html' : 'SegmentComponentReadTree.html';
                } else {
                    return node.type === 'segment' ? 'SegmentEditTree.html' : node.type === 'field' ? 'SegmentFieldEditTree.html' : 'SegmentComponentEditTree.html';
                }
            },
            getSegmentLevelConfStatements: function (element) {
                var parent = SegmentService.getParent(element.id);
                var conformanceStatements = [];
                if (parent && parent != null && parent.conformanceStatements.length > 0) {
                    return ElementUtils.filterConstraints(element, parent.conformanceStatements);
                }
                return conformanceStatements;
            },

            getSegmentLevelPredicates: function (element) {
                var parent = SegmentService.getParent(element.id);
                var predicates = [];
                if (parent && parent != null && parent.predicates.length > 0) {
                    return ElementUtils.filterConstraints(element, parent.predicates);
                }
                return predicates;
            },

            isBranch: function (node) {
                var children = SegmentService.getNodes(node);
                return children != null && children.length > 0;
            },
            isVisible: function (node) {
                return  node ? SegmentService.isRelevant(node) ? SegmentService.isVisible(SegmentService.getParent(node)) : false : true;
            },
            isRelevant: function (node) {
                if (node === undefined || !ViewSettings.tableRelevance)
                    return true;
                if (node.hide == undefined || !node.hide || node.hide === false) {
                    var predicates = SegmentService.getSegmentLevelPredicates(node);
                    return ElementUtils.isRelevant(node,predicates);
                } else {
                    return false;
                }
            }

        };
        return SegmentService;
    }]);

'use strict';
angular.module('tcl').factory('StorageService',
    ['localStorageService', function (localStorageService) {
        var service = {
            TABLE_COLUMN_SETTINGS_KEY: 'SETTINGS_KEY',
            SELECTED_IG_DOCUMENT_TYPE:'SelectedIgDocumentType',
            SELECTED_IG_DOCUMENT_ID:'SelectedIgDocumentId',
            APP_VERSION:'APP_VERSION',
            TABLE_CONCISE_SETTINGS:'TABLE_CONCISE_SETTINGS',
            TABLE_RELEVANCE_SETTINGS:'TABLE_RELEVANCE_SETTINGS',
            TABLE_COLLAPSE_SETTINGS:'TABLE_COLLAPSE_SETTINGS',
            TABLE_READONLY_SETTINGS:'TABLE_READONLY_SETTINGS',
            IG_DOCUMENT:'IG_DOCUMENT',
            remove: function (key) {
                return localStorageService.remove(key);
            },

            removeList: function removeItems(key1, key2, key3) {
                return localStorageService.remove(key1, key2, key3);
            },

            clearAll: function () {
                return localStorageService.clearAll();
            },
            set: function (key, val) {
                return localStorageService.set(key, val);
            },
            get: function (key) {
                return localStorageService.get(key);
            },
            setSelectedIgDocumentType: function (val) {
                this.set(this.SELECTED_IG_DOCUMENT_TYPE,val);
            },
            getSelectedIgDocumentType: function () {
                return this.get(this.SELECTED_IG_DOCUMENT_TYPE);
            },
            setAppVersion: function (version) {
                this.set(this.APP_VERSION,version);
            },
            getAppVersion: function () {
                return this.get(this.APP_VERSION);
            },
            getIgDocument: function () {
                return this.get(this.IG_DOCUMENT) != null ? angular.fromJson(this.get(this.IG_DOCUMENT)):null;
            },
            setIgDocument: function (igDocument) {
                this.set(this.IG_DOCUMENT,igDocument != null ?  angular.toJson(igDocument):null);
            }
        };
        return service;
    }]
);

angular
		.module('tcl')
		.factory(
				'ToCSvc',
				function() {

					var svc = this;

					function entry(id, label, position, type, parent, reference) {
						this.id = id;
						this.label = label;
						this.selected = false;
						this.position = position;
						this.type = type;
						this.parent = parent;
						this.reference = reference;
					}
					;

					svc.currentLeaf = {
						selected : false
					};

					svc.findEntryFromRefId = function(refId, entries) {
						var rval = undefined;
						if (angular.isArray(entries)) {
							_.each(entries, function(entry) {
								if (entry.reference && entry.reference.id) {
									if (entry.reference.id === refId) {
										rval = entry;
									} else {
										if (rval) {
											return rval;
										}
										rval = svc.findEntryFromRefId(refId,
												entry.children);
									}
								}
							});
						}
						return rval;
					};

					svc.getToC = function(igdocument) {
						console.log("Getting toc... version="
								+ igdocument.profile.metaData.hl7Version + " "
								+ igdocument.id);
						toc = [];

						// console.log("childSections=" +
						// igdocument.childSections.length);
						var documentMetadata = getMetadata(igdocument,
								"documentMetadata");
						toc.push(documentMetadata);
						var sections = getSections(igdocument.childSections,
								igdocument.type, igdocument);
						_.each(sections, function(section) {
							toc.push(section);
						});
						var conformanceProfile = getMessageInfrastructure(igdocument);
						toc.push(conformanceProfile);
						return toc;
					};

					function getMetadata(parent, type) {
						var rval = new entry(type, "Metadata", 0, type, parent,
								parent.metaData);
						return rval;
					}
					;

					function getSections(childSections, parentType, parent) {

						var rval = [];

						_.each(childSections, function(childSection) {
							var section = new entry(childSection.id,
									childSection.sectionTitle,
									childSection.sectionPosition,
									childSection.type, parent, childSection);
							rval.push(section);
							var sections1 = getSections(
									childSection.childSections,
									childSection.type, childSection);
							_.each(sections1, function(section1) {
								if (!section.children) {
									section.children = [];
								}
								section.children.push(section1);
							});
						});
						var section2 = _.sortBy(rval, "position");
						rval = section2;
						return rval;
					}
					;

					function getMessageInfrastructure(igdocument) {
						var rval = new entry(igdocument.profile.id,
								igdocument.profile.sectionTitle,
								igdocument.profile.sectionPosition,
								igdocument.profile.type, 0, igdocument.profile);
						var children = [];
						children.push(getMetadata(igdocument.profile,
								"profileMetadata"));
						children.push(getTopEntry(igdocument.profile.messages,
								igdocument.profile));
						children.push(getTopEntry(igdocument.profile.segments,
								igdocument.profile));
						children.push(getTopEntry(igdocument.profile.datatypes,
								igdocument.profile));
						children.push(getTopEntry(igdocument.profile.tables,
								igdocument.profile));
						rval.children = children;
						return rval;
					}
					;

					// Returns a top level entry. It can be dropped on, but
					// cannot be
					// dragged.
					function getTopEntry(child, parent) {
						// console.log("getTopEntry sectionTitle=" +
						// child.sectionTitle);
						// console.log("getTopEntry type=" + child.type);
						var children = [];
						var rval = new entry(child.id, child.sectionTitle,
								child.sectionPosition, child.type, parent,
								child);
						if (child) {
							rval["reference"] = child;
							if (angular.isArray(child.children)
									&& child.children.length > 0) {
								rval["children"] = createEntries(
										child.children[0].type, child,
										child.children);
							}
						}
						return rval;
					}
					;

					// Returns a second level set entries, These are draggable.
					// "drag"
					function createEntries(parentType, parent, children) {
						var rval = [];
						var entry = {};
						_
								.each(
										children,
										function(child) {
											if (parentType === "message") {
												entry = createEntry(child,
														child.name, parent);
//												console
//														.log("createEntries entry.reference.id="
//																+ entry.reference.id
//																+ " entry.reference.name="
//																+ entry.reference.name
//																+ "entry.parent="
//																+ rval.parent);
											} else if (parentType === "table") {
												entry = createEntry(
														child,
														child.bindingIdentifier,
														parent);
											} else {
												entry = createEntry(child,
														child.label, parent);
											}
											rval.push(entry);
										});
						return _.sortBy(rval, "reference.position");
					}
					;

					function createEntry(child, label, parent) {

						var rval = new entry(child.id, label,
								child.sectionPosition, child.type, parent,
								child);
						return rval;
					}
					;

					return svc;
				})
/**
 * Created by haffo on 5/4/15.
 */

angular.module('tcl').factory('ViewSettings',
    ['StorageService', function (StorageService) {
        var columnOptions = [
            { id: "usage", label: "Usage"},
            { id: "cardinality", label: "Cardinality"},
            { id: "length", label: "Length"},
            { id: "confLength", label: "Conf. Length"},
            { id: "datatype", label: "Datatype"},
            { id: "valueSet", label: "Value Set"},
            { id: "predicate", label: "Predicate"},
            { id: "confStatement", label: "Conf. Statement"},
            { id: "defText", label: "Defin. Text"},
            { id: "comment", label: "Comment"}
        ];
        var visibleColumns = StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY) == null ? angular.copy(columnOptions) : angular.fromJson(StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY));
        var ViewSettings = {
            columnOptions: columnOptions,
            visibleColumns: visibleColumns,
            translations: {buttonDefaultText: 'Visible Columns'},
            extra: {displayProp: 'label', buttonClasses: 'btn btn-xs btn-primary', showCheckAll: false, showUncheckAll: false, scrollable: false},
            tableRelevance:StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS),
            tableConcise:StorageService.get(StorageService.TABLE_CONCISE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_CONCISE_SETTINGS),
            tableCollapse:StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS) == null ? true : StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS),
            tableReadonly:StorageService.get(StorageService.TABLE_READONLY_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_READONLY_SETTINGS),
            events: {
                onItemSelect: function (item) {
                    ViewSettings.setVisibleColumns();
                },
                onItemDeselect: function (item) {
                    ViewSettings.setVisibleColumns();
                }
            },

            setVisibleColumns: function () {
                StorageService.set(StorageService.TABLE_COLUMN_SETTINGS_KEY, angular.toJson(ViewSettings.visibleColumns));
            },
            setTableConcise: function (concise) {
                ViewSettings.tableConcise = concise;
                StorageService.set(StorageService.TABLE_CONCISE_SETTINGS, ViewSettings.tableConcise);
            },
            setTableRelevance: function (relevance) {
                ViewSettings.tableRelevance = relevance;
                StorageService.set(StorageService.TABLE_RELEVANCE_SETTINGS, ViewSettings.tableRelevance);
            },
            setTableCollapse: function (collapse) {
                ViewSettings.tableCollapse = collapse;
                StorageService.set(StorageService.TABLE_COLLAPSE_SETTINGS, ViewSettings.tableCollapse);
            },
            setTableReadonly: function (value) {
                ViewSettings.tableReadonly = value;
                StorageService.set(StorageService.TABLE_READONLY_SETTINGS, ViewSettings.tableReadonly);
            },
            isVisibleColumn: function (column) {
                for (var i = 0; i < ViewSettings.visibleColumns.length; i++) {
                    if (ViewSettings.visibleColumns[i].id === column) {
                        return true;
                    }
                }
                return false;
            }
        };
        return ViewSettings;
    }]);


'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('AboutService', ["$scope", function ($scope) {

  }]);

/*jshint bitwise: false*/

'use strict';

angular.module('tcl')
	.service('base64', function base64() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    this.encode = function (input) {
        var output = '',
            chr1, chr2, chr3 = '',
            enc1, enc2, enc3, enc4 = '',
            i = 0;

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
        }

        return output;
    };

    this.decode = function (input) {
        var output = '',
            chr1, chr2, chr3 = '',
            enc1, enc2, enc3, enc4 = '',
            i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
        }
    };
});

'use strict';

angular.module('tcl').factory('i18n', function() {
    // AngularJS will instantiate a singleton by calling "new" on this function   
    var language;
    var setLanguage = function (theLanguage) {
        $.i18n.properties({
            name: 'messages',
            path: 'lang/',
            mode: 'map',
            language: theLanguage,
            callback: function () {
                language = theLanguage;
            }
        });
    };
    setLanguage('en');
    return {
        setLanguage: setLanguage
    };
});

/*angular.module('ehrRandomizerApp')
  .service('i18n', function i18n() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var self = this;
    this.setLanguage = function (language) {
        $.i18n.properties({
            name: 'messages',
            path: 'lang/',
            mode: 'map',
            language: language,
            callback: function () {
                self.language = language;
            }
        });
    };
    this.setLanguage('en');
  });*/
'use strict';

/**
 * @ngdoc function
 * @description
 * # AboutCtrl
 * Controller of the clientApp
 */
//
//// Declare factory
//angular.module('tcl').factory('Profiles', function(Restangular) {
//     return Restangular.service('profiles');
//});



angular.module('tcl').factory('Section', ["$http", "$q", function ($http, $q) {
    var Section = function () {
        this.data = null;
        this.type = null;
        this.sections = [];
    };
    return Section;
}]);





'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('MainService', ["$scope", function ($scope) {
  }]);

/**
 * Created by haffo on 2/6/15.
 */

//
//
//// Declare factory
//angular.module('tcl').factory('Users', function(Restangular) {
//    return Restangular.service('users');
//});
//


'use strict';

angular.module('tcl').filter('bytes', [
    function () {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) { return '-'; }
            if (typeof precision === 'undefined') { precision = 1; }
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        };
    }
]);

/**
 * Created by haffo on 3/3/16.
 */

angular.module('tcl').filter('flavors',function(){
    return function(inputArray,name){
        return inputArray.filter(function(item){
            return item.name === name || angular.equals(item.name,name);
        });
    };
});
'use strict';

angular.module('tcl').filter('yesno', [ function () {
    return function (input) {
        return input ? 'YES' : 'NO';
    };
}]);
angular.module('tcl').directive('preventRightClick', [

function() {
	return {
		restrict : 'A',
		link : function($scope, $ele) {
			$ele.bind("contextmenu", function(e) {
				e.preventDefault();
			});
		}
	};
} ])
angular
		.module('tcl')
		.directive(
				'trunk',
				function() {
//					console.log("trunk");

					var template = "<ul class='trunk'><branch ng-repeat='branch in trunk track by trackBy()' branch='branch'></branch></ul>";

					return {
						restrict : "E",
						replace : true,
						controller : "ToCCtl",
						scope : {
							trunk : '='
						},
						template : template
					}
				})
		.directive(
				'drop',
				function() {
//					console.log("drop");

					var template = "<ul dnd-list='drop'>"
							+ "<branch ng-repeat='branch in drop track by $index' index='$index' branch='branch' drop='drop'></branch>"
							+ "</ul>";

					return {
						restrict : "E",
						replace : true,
						scope : {
							drop : '='
						},
						template : template
					}
				})
		.directive(
				"branch",
				["$compile", function($compile) {
					var branchNoCtxTemplate = "<li class='branch' prevent-right-click>"
						+ "<label for='{{branch.id}}' class='fa fa-lg' ng-class=\" {'fa-caret-right': branch.selected,'fa-caret-down': !branch.selected} \" />"
						+ "</label>"
						+ "<input type='checkbox' id='{{branch.id}}' ng-model='branch.selected'/>"
						+ "<a ng-click='tocSelection(branch)' ng-class=\" {'toc-selected' : branch.highlight, 'selected': models.selected === branch} \" >{{branch.label}}</a>"
						+ "<trunk trunk='branch.children'></trunk>"
						+ "</li>";
					var branchTemplate = "<li class='branch'"
						+ " context-menu context-menu-close='closedCtxSubMenu(branch)' data-target='contextDiv.html''> "
						+ "<label for='{{branch.id}}' class='fa fa-lg' ng-class=\" {'fa-caret-right': branch.selected,'fa-caret-down': !branch.selected} \" />"
						+ "</label>"
						+ "<input type='checkbox' id='{{branch.id}}' ng-model='branch.selected'/>"
						+ "<a ng-click='tocSelection(branch)' ng-class=\" {'toc-selected' : branch.highlight, 'selected': models.selected === branch} \" >{{branch.label}}</a>"
						+ "<trunk trunk='branch.children'></trunk>"
						+ "</li>";
					var branchMessagesTemplate = "<li class='branch'"
						+ " context-menu context-menu-close='closedCtxSubMenu(branch)' data-target='messageHeadContextDiv.html'>"
						+ "<label for='{{branch.id}}' class='fa fa-lg' ng-class=\" {'fa-caret-right': branch.selected,'fa-caret-down': !branch.selected} \" />"
						+ "<input type='checkbox' id='{{branch.id}}'ng-model='branch.selected'/>"
						+ "<a ng-click='tocSelection(branch)' ng-class=\" {'toc-selected' : branch.highlight, 'selected': models.selected === branch} \" >{{branch.label}}</a>"
						+ "<drop drop='branch.children'></drop>"
						+ "</li>";
					var branchTablesTemplate = "<li class='branch'"
						+ " context-menu context-menu-close='closedCtxSubMenu(branch)' data-target='tableHeadContextDiv.html'>"
						+ "<label for='{{branch.id}}' class='fa fa-lg' ng-class=\" {'fa-caret-right': branch.selected,'fa-caret-down': !branch.selected} \" />"
						+ "</label>"
						+ "<input type='checkbox' id='{{branch.id}}' ng-model='branch.selected'/>"
						+ "<a ng-click='tocSelection(branch)' ng-class=\" {'toc-selected' : branch.highlight, 'selected': models.selected === branch} \" >{{branch.label}}</a>"
						+ "<drop drop='branch.children'></drop>"
						+ "</li>";
					var leafTemplate = "<leaf leaf='branch' index='index'></leaf>";

					var linker = function(scope, element, attrs) {
//						console.log("<=label=" + scope.branch.label);
						if (angular.isArray(scope.branch.children)) {
//							 console.log("branch id=" + scope.branch.id + " branch type=" + scope.branch.type +
//							 " label=" + scope.branch.label + " children=" +
//							 scope.branch.children.length);
							if ( _.indexOf(["profile", "segments", "datatypes"], scope.branch.type) > -1) {
								element.append(branchNoCtxTemplate);
							} else if (scope.branch.type === "messages") {
								element.append(branchMessagesTemplate);
							} else if (scope.branch.type === "tables") {
								element.append(branchTablesTemplate);
							} else {
								element.append(branchTemplate);
							}
							$compile(element.contents())(scope);

						} else {
//							console.log("leaf id=" + scope.branch.id + " leaf type="  + scope.branch.type + " leaf label="  + scope.branch.label + " parent=" + scope.branch.parent.type);
							element.append(leafTemplate).show();
							$compile(element.contents())(scope);
						}
					};

					return {
						restrict : "E",
						replace : true,
						controller : "ToCCtl",
						scope : {
							index : '=',
							drop : '=',
							branch : '='
						},
						link : linker
					}
				}])
		.directive(
				"leaf",
				["$compile", function($compile) {

					var leafMetadata = "<li class='point leaf'"
						+ "  prevent-right-click> "
						+ "<a ng-click='tocSelection(leaf)' ng-class=\" {'toc-selected' : leaf.highlight, 'selected': models.selected === leaf} \" >{{leaf.label}}</a>" 
						+ "</li>";
					
					var leafMessage = "<li class='point leaf'"
			            + " dnd-draggable='leaf'"
			            + " dnd-effect-allowed='move'"
			            + " dnd-moved='moved(index, leaf)'"
			            + " dnd-selected='models.selected = leaf'"
						+ " context-menu context-menu-close='closedCtxSubMenu(leaf)' data-target='messageContextDiv.html'> "
						+ "<a ng-click='tocSelection(leaf)' ng-class=\" {'toc-selected' : leaf.highlight, 'selected': models.selected === leaf} \" >{{leaf.reference.name}} - {{leaf.reference.description}}</a>" 
						+ "</li>";
					
					var leafValueSet = "<li class='point leaf'"
						+ " context-menu context-menu-close='closedCtxSubMenu(leaf)' data-target='contextDiv.html'> "
						+ "<a ng-click='tocSelection(leaf)' ng-class=\" {'toc-selected' : leaf.highlight, 'selected': models.selected === leaf} \" >{{leaf.reference.bindingIdentifier}} - {{leaf.reference.name}}</a>" 
						+ "</li>";

					var leafSection = "<li class='point leaf'"
						+ " context-menu context-menu-close='closedCtxSubMenu(leaf)' data-target='contextDiv.html'> "
						+ "<a ng-click='tocSelection(leaf)' ng-class=\" {'toc-selected' : leaf.highlight, 'selected': models.selected === leaf} \" >{{leaf.reference.sectionTitle}}</a>" 

					var leafDefault = "<li class='point leaf'"
						+ " context-menu context-menu-close='closedCtxSubMenu(leaf)' data-target='contextDiv.html'> "
						+ "<a ng-click='tocSelection(leaf)' ng-class=\" {'toc-selected' : leaf.highlight, 'selected': models.selected === leaf} \" >{{leaf.reference.label}} - {{leaf.reference.description}}</a>" 
						+ "</li>";

					var linker = function(scope, element, attrs) {
						if (_.indexOf(["documentMetadata", "profileMetadata"] ,scope.leaf.type) > -1) {
							element.html(leafMetadata).show();
//							console.log("leafMeta=" + scope.leaf.label + " type=" + scope.leaf.type + " parent=" + scope.leaf.parent);
						} else if (scope.leaf.type === "section") {
							element.html(leafSection).show();
//							console.log("leafSection=" + scope.leaf.label + " type=" + scope.leaf.type  + " parent=" + scope.leaf.parent);
						} else if (scope.leaf.type === "message") {
							element.html(leafMessage).show();
//							console.log("leafMessage=" + scope.leaf.label + " type=" + scope.leaf.type  + " parent=" + scope.leaf.parent + " leaf.reference.id=" + scope.leaf.reference.id + " leaf.reference.position=" + scope.leaf.reference.position);
						} else if (scope.leaf.type === "table") {
							element.html(leafValueSet).show();
//								console.log("leafTable=" + scope.leaf.label + " type=" + scope.leaf.type  + " parent=" + scope.leaf.parent);
						} else {
							element.html(leafDefault).show();
//							console.log("leafDefault=" + scope.leaf.label + " parent=" + scope.leaf.parent);
						}
						$compile(element.contents())(scope);
					};

					return {
						restrict : "E",
						replace : true,
						controller : "ToCCtl",
						scope : {
							index : '=',
							leaf : '=',
							drop : '='
						},
						link : linker
					}
				}]);

/**
 * Created by haffo on 4/5/15.
 */
angular.module('tcl').directive('click', ['$location', function($location) {
        return {
            link: function(scope, element, attrs) {
                element.on('click', function() {
                    scope.$apply(function() {
                        $location.path(attrs.clickGo);
                    });
                });
            }
        }
    }]);


//angular.module('tcl').directive('csSelect', function () {
//    return {
//        require: '^stTable',
//        template: '',
//        scope: {
//            row: '=csSelect'
//        },
//        link: function (scope, element, attr, ctrl) {
//
//            element.bind('change', function (evt) {
//                scope.$apply(function () {
//                    ctrl.select(scope.row, 'single');
//                });
//            });
//
//            scope.$watch('row.isSelected', function (newValue, oldValue) {
//                if (newValue === true) {
//                    element.parent().addClass('st-selected');
//                } else {
//                    element.parent().removeClass('st-selected');
//                }
//            });
//        }
//    };
//});

/**
 * Created by haffo on 10/20/15.
 */
angular.module('tcl').directive('compile', ["$compile", function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            },
            function(value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);

                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            }
        );
    };
}]);
/**
 * Created by haffo on 2/13/15.
 */


angular.module('tcl').directive('csSelect', function () {
    return {
        require: '^stTable',
        template: '',
        scope: {
            row: '=csSelect'
        },
        link: function (scope, element, attr, ctrl) {

            element.bind('change', function (evt) {
                scope.$apply(function () {
                    ctrl.select(scope.row, 'single');
                });
            });

            scope.$watch('row.isSelected', function (newValue, oldValue) {
                if (newValue === true) {
                    element.parent().addClass('st-selected');
                } else {
                    element.parent().removeClass('st-selected');
                }
            });
        }
    };
});
angular.module('tcl').directive('windowExit', ["$window", "$templateCache", "$http", "$rootScope", "StorageService", "IgDocumentService", "ViewSettings", "AutoSaveService", function($window, $templateCache,$http, $rootScope,StorageService,IgDocumentService,ViewSettings,AutoSaveService) {
    return {
        restrict: 'AE',
        //performance will be improved in compile
        compile: function(element, attrs){
            var myEvent = $window.attachEvent || $window.addEventListener,
                chkevent = $window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compatable
            myEvent(chkevent, function (e) { // For >=IE7, Chrome, Firefox
                AutoSaveService.stop();
                if($rootScope.igdocument != null) {
                    if (!ViewSettings.tableReadonly) {
                        IgDocumentService.save($rootScope.igdocument).then(function (result) {
                            StorageService.setIgDocument($rootScope.igdocument);
                        });
                    } else {
                        StorageService.setIgDocument($rootScope.igdocument);
                    }
                }
                $templateCache.removeAll();
            });
        }
    };
}]);
'use strict';

angular.module('tcl')
.directive('focus', [function () {
    return {
        restrict: 'EAC',
        link: function(scope, element, attrs) {
//            element[0].focus();
        }
    };
}]);

'use strict';

angular.module('tcl').directive('igCheckEmail', [ '$resource',
    function ($resource) {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                var Email = $resource('api/sooa/emails/:email', {email: '@email'});

                var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

                element.on('keyup', function() {
                    if ( element.val().length !== 0 && EMAIL_REGEXP.test(element.val()) ) {
                        var emailToCheck = new Email({email:element.val()});
                        emailToCheck.$get(function() {
                            scope.emailUnique  = ((emailToCheck.text === 'emailNotFound') ? 'valid' : undefined);
                            scope.emailValid = (EMAIL_REGEXP.test(element.val()) ? 'valid' : undefined);
                            if(scope.emailUnique && scope.emailValid) {
                                ctrl.$setValidity('email', true);
                            } else {
                                ctrl.$setValidity('email', false);
                            }

                        }, function() {
//                            console.log('FAILURE to check email address');
                        });
                    }
                    else {
                        scope.emailUnique  = undefined;
                        scope.emailValid = undefined;
                        ctrl.$setValidity('email', false);
                    }
                });
            }
        };
    }
]);

'use strict';

//This directive is used to make sure both passwords match
angular.module('tcl').directive('igCheckEmployer', [
    function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var employer = '#' + attrs.igCheckEmployer;
                elem.add(employer).on('keyup', function () {
                    scope.$apply(function () {
//                        console.log('Pass1=', elem.val(), ' Pass2=', $(firstPassword).val());
                        var v = elem.val()===$(firstPassword).val();
                        ctrl.$setValidity('noMatch', v);
                    });
                });
            }
        };
    }
]);
'use strict';

//This directive is used to make sure both passwords match
angular.module('tcl').directive('igCheckPassword', [
    function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.igCheckPassword;
                elem.add(firstPassword).on('keyup', function () {
                    scope.$apply(function () {
//                        console.log('Pass1=', elem.val(), ' Pass2=', $(firstPassword).val());
                        var v = elem.val()===$(firstPassword).val();
                        ctrl.$setValidity('noMatch', v);
                    });
                });
            }
        };
    }
]);
'use strict';

angular.module('tcl').directive('igCheckPhone', [
    function () {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                var NUMBER_REGEXP = /[0-9]*/;
                element.on('keyup', function() {
                     if ( element.val() &&  element.val() != null && element.val() != "") {
                             scope.phoneIsNumber  =  (NUMBER_REGEXP.test(element.val()))   && element.val() > 0 ? 'valid' : undefined;
                             scope.phoneValidLength  = element.val().length >= 7 ? 'valid' : undefined;
                             if(scope.phoneIsNumber && scope.phoneValidLength ) {
                                 ctrl.$setValidity('phone', true);
                             } else {
                                 ctrl.$setValidity('phone', false);
                             }
                     }
                     else {
                         scope.phoneIsNumber = undefined;
                         scope.phoneValidLength = undefined;
                         ctrl.$setValidity('phone', true);
                     }
                 });
            }
        };
    }
]);

'use strict';

angular.module('tcl').directive('igCheckPoaDate', [
    function () {
        return {
            replace: true,
            link: function (scope, elem, attrs, ctrl) {
                var startElem = elem.find('#inputStartDate');
                var endElem = elem.find('#inputEndDate');

                var ctrlStart = startElem.inheritedData().$ngModelController;
                var ctrlEnd = endElem.inheritedData().$ngModelController;

                var checkDates = function() {
                    var sDate = new Date(startElem.val());
                    var eDate = new Date(endElem.val());
                    if ( sDate < eDate ) {
                        //console.log("Good!");
                        ctrlStart.$setValidity('datesOK', true);
                        ctrlEnd.$setValidity('datesOK', true);
                    }
                    else {
                        //console.log(":(");
                        ctrlStart.$setValidity('datesOK', false);
                        ctrlEnd.$setValidity('datesOK', false);
                    }
                };

                startElem.on('change', checkDates);
                endElem.on('change', checkDates);
            }
        };
    }
]);
'use strict';

//This directive is used to make sure the start hour of a timerange is < of the end hour 
angular.module('tcl').directive('igCheckTimerange', [
    function () {
        return {
            replace: true,
            link: function (scope, elem, attrs, ctrl) {
                //elem is a div element containing all the select input
                //each one of them has a class for easy selection
                var myElem = elem.children();
                var sh = myElem.find('.shour');
                var sm = myElem.find('.sminute');
                var eh = myElem.find('.ehour');
                var em = myElem.find('.eminute');

                var ctrlSH, ctrlSM, ctrlEH, ctrlEM;
                ctrlSH = sh.inheritedData().$ngModelController;
                ctrlSM = sm.inheritedData().$ngModelController;
                ctrlEH = eh.inheritedData().$ngModelController;
                ctrlEM = em.inheritedData().$ngModelController;
               
                var newnew = true;

                var checkTimeRange = function() {
                    if ( newnew ) {
                        //We only do that once to set the $pristine field to false
                        //Because if $pristine==true, and $valid=false, the visual feedback 
                        //are not displayed
                        ctrlSH.$setViewValue(ctrlSH.$modelValue);
                        ctrlSM.$setViewValue(ctrlSM.$modelValue);
                        ctrlEH.$setViewValue(ctrlEH.$modelValue);
                        ctrlEM.$setViewValue(ctrlEM.$modelValue);
                        newnew = false;
                    }
                    //Getting a date object
                    var tmpDate = new Date();
                    //init the start time with the dummy date
                    var startTime = angular.copy(tmpDate);
                    //init the end time with the same dummy date
                    var endTime =  angular.copy(tmpDate);

                    startTime.setHours(sh.val());
                    startTime.setMinutes(sm.val());
                    endTime.setHours(eh.val());
                    endTime.setMinutes(em.val());
                    
                    if ( startTime < endTime ) {
                        //console.log("Excellent!");
                        ctrlSH.$setValidity('poaOK', true);
                        ctrlSM.$setValidity('poaOK', true);
                        ctrlEH.$setValidity('poaOK', true);
                        ctrlEM.$setValidity('poaOK', true);
                    }
                    else {
                        //console.log("Bad... :(");
                        ctrlSH.$setValidity('poaOK', false);
                        ctrlSM.$setValidity('poaOK', false);
                        ctrlEH.$setValidity('poaOK', false);
                        ctrlEM.$setValidity('poaOK', false);
                    }
                };

                sh.on('change', checkTimeRange);
                sm.on('change', checkTimeRange);
                eh.on('change', checkTimeRange);
                em.on('change', checkTimeRange);
            }
        };
    }
]);
'use strict';

angular.module('tcl').directive('igCheckUsername', [ '$resource',
	function ($resource) {
	    return {
	        restrict: 'AC',
	        require: 'ngModel',
	        link: function (scope, element, attrs, ctrl) {
	            var Username = $resource('api/sooa/usernames/:username', {username: '@username'});

	            element.on('keyup', function() {
	                if ( element.val().length >= 4 ) {
	                    var usernameToCheck = new Username({username:element.val()});
	                    //var delay = $q.defer();
	                    usernameToCheck.$get(function() {
	                        scope.usernameValidLength  = (element.val() && element.val().length >= 4 && element.val().length <= 20 ? 'valid' : undefined);
	                        scope.usernameUnique  = ((usernameToCheck.text === 'usernameNotFound') ? 'valid' : undefined);

	                        if(scope.usernameValidLength && scope.usernameUnique ) {
	                            ctrl.$setValidity('username', true);
	                        } else {
	                            ctrl.$setValidity('username', false);
	                        }

	                    }, function() {
	                        //console.log("FAILURE", usernameToCheck);
	                    });
	                }
	                else {
	                    scope.usernameValidLength = undefined;
	                    scope.usernameUnique = undefined;
	                    ctrl.$setValidity('username', false);
	                }
	            });
	        }
	    };
	}
]);

'use strict';

//This directive is used to check password to make sure they meet the minimum requirements
angular.module('tcl').directive('igPasswordValidate', [
	function () {
	    return {
	        require: 'ngModel',
	        link: function(scope, elm, attrs, ctrl) {
	            ctrl.$parsers.unshift(function(viewValue) {

	                scope.pwdValidLength = (viewValue && viewValue.length >= 7 ? 'valid' : undefined);
	                scope.pwdHasLowerCaseLetter = (viewValue && /[a-z]/.test(viewValue)) ? 'valid' : undefined;
	                scope.pwdHasUpperCaseLetter = (viewValue && /[A-Z]/.test(viewValue)) ? 'valid' : undefined;
	                scope.pwdHasNumber = (viewValue && /\d/.test(viewValue)) ? 'valid' : undefined;

	                if(scope.pwdValidLength && scope.pwdHasLowerCaseLetter && scope.pwdHasUpperCaseLetter && scope.pwdHasNumber) {
	                    ctrl.$setValidity('pwd', true);
	                    return viewValue;
	                } else {
	                    ctrl.$setValidity('pwd', false);
	                    return undefined;
	                }
	            });
	        }
	    };
	}
]);

'use strict';

//This directive is used to highlight the cehrt that is active
angular.module('tcl').directive('ehrbold', [
    function () {
        return {
            restrict: 'C',
            link: function(scope, element, attrs) {
//                element.on('click', function() {
//                    element.siblings().removeClass('cehrtactive');
//                    element.siblings().children().removeClass('cehrtDeleteButtonActive');
//                    element.siblings().children().addClass('cehrtDeleteButtonNotActive');
//
//                    element.addClass('cehrtactive');
//                    element.children().removeClass('cehrtDeleteButtonNotActive');
//                    element.children().addClass('cehrtDeleteButtonActive');
//                });
            }
        };
    }
]);

'use strict';

angular.module('tcl')
.directive('msg', [function () {
    return {
        restrict: 'EA',
        replace: true,
        link: function (scope, element, attrs) {
            //console.log("Dir");
            var key = attrs.key;
            if (attrs.keyExpr) {
                scope.$watch(attrs.keyExpr, function (value) {
                    key = value;
                    element.text($.i18n.prop(value));
                });
            }
            scope.$watch('language()', function (value) {
                element.text($.i18n.prop(key));
            });
        }
    };
}]);

/**
 * Created by haffo on 2/13/15.
 */
angular.module('tcl').directive('stRatio',function(){
    return {
        link:function(scope, element, attr){
            var ratio=+(attr.stRatio);
            element.css('width',ratio+'%');
        }
    };
});

'use strict';

//Angular doesn't perform any validation on file input.
//We bridge the gap by linking the required directive to the
//presence of a value on the input.
angular.module('tcl').directive('validTrustDocument', [
    function () {
        return {
            require:'ngModel',
            link:function(scope,el,attrs,ngModel){
                //change event is fired when file is selected
                el.bind('change', function() {
                    scope.$apply( function() {
                        ngModel.$setViewValue(el.val());
                        //console.log("validTrustDocument Val=", el.val());
                        //ngModel.$render();
                    });
                });
            }
        };
    }
]);

angular.module('tcl').controller('ContextMenuCtl', ["$scope", "$rootScope", "ContextMenuSvc", function ($scope, $rootScope, ContextMenuSvc) {

    $scope.clicked = function (item) {
        ContextMenuSvc.put(item);
    };
}]);
/**
 * http://usejsdoc.org/
 */
angular.module('tcl').controller('DatatypeLibraryCtl',
		["$scope", "$rootScope", "$filter", "$http", function($scope, $rootScope, $filter, $http) {

			$scope.initDatatypeLibrary = function() {
				$scope.start = false;
				$http.get('api/datatype-library', {
					timeout : 60000
				}).then(function(response) {
					$scope.datatypeLibrary = angular.fromJson(response.data);
				});
			};
		}]);

angular.module('tcl')
    .controller('SectionsListCtrl', ["$scope", "$rootScope", "CloneDeleteSvc", "ToCSvc", function ($scope, $rootScope, CloneDeleteSvc, ToCSvc) {
        $scope.fixedSectionTitles = [
            'Message Infrastructure','Metadata','Introduction','Conformance Profiles','Segments and Field Descriptions','Datatypes','Value Sets'
        ];

	    	$scope.copy = function(section) {
	    		var tocSection = ToCSvc.findEntryFromRefId(section.id, $rootScope.tocData);
        		CloneDeleteSvc.copySection(tocSection);
	    	};
	    	
        $scope.close = function () {
            $rootScope.section = null;
            $scope.refreshTree();
            $scope.loadingSelection = false;
        };
        
        $scope.delete = function(section) {
    			var tocSection = ToCSvc.findEntryFromRefId(section.id, $rootScope.tocData);
        		CloneDeleteSvc.deleteSection(tocSection);
			$rootScope.$broadcast('event:SetToC');
        };

        $scope.isFixedSectionTitle = function(section){
            return $scope.fixedSectionTitles.indexOf(section.sectionTitle) >= 0;
        };
}]);
/**
 * Created by haffo on 3/3/16.
 */
angular.module('tcl').controller('ErrorDetailsCtrl', ["$scope", "$modalInstance", "error", function ($scope, $modalInstance, error) {
    $scope.error = error;
    $scope.ok = function () {
        $modalInstance.close($scope.error);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('ErrorCtrl', [ '$scope', '$modalInstance', 'StorageService', '$window',
    function ($scope, $modalInstance, StorageService, $window) {
        $scope.refresh = function () {
            $modalInstance.close($window.location.reload());
        };
    }
]);

app.controller('FailureCtrl', [ '$scope', '$modalInstance', 'StorageService', '$window', 'error',
    function ($scope, $modalInstance, StorageService, $window, error) {
        $scope.error = error;
        $scope.close = function () {
            $modalInstance.close();
        };
    }
]);
angular
		.module('tcl')
		.controller(
				'ToCCtl',
				[
						'$scope',
						'$rootScope',
						'$timeout',
						'ToCSvc',
						'ContextMenuSvc',
						'CloneDeleteSvc',
						function($scope, $rootScope, $timeout, ToCSvc,
								ContextMenuSvc, CloneDeleteSvc) {
							var ctl = this;
							$scope.collapsed = [];
							$scope.yesDrop = false;
							$scope.noDrop = true;
//							$scope.$watch('tocData', function(newValue,
//									oldValue) {
//								if (!oldValue && newValue) {
//									_.each($scope.tocData, function(head) {
//										$scope.collapsed[head] = false;
//									});
//								}
//							});
							
							$scope.moved = function (index, leaf) {
								var idx = _.findLastIndex($scope.$parent.drop, function(leaf1) {
									return leaf.id === leaf1.id;
								});
							
								if (index === idx) {
									$scope.$parent.drop.splice(index + 1, 1);
								} else {
									$scope.$parent.drop.splice(index, 1);
								}
								$timeout(function(){
									var pos = 0;
									_.each($scope.$parent.drop, function(child){
										pos++;							
										var igdMsg = _.find($rootScope.igdocument.profile.messages.children, function(msg) {
											return msg.id === child.reference.id;
										})
										igdMsg.position = pos;
									});
								}, 100);
							};
							
							$scope.calcOffset = function(level) {
								return "margin-left : " + level + "em";
							};

							$scope.trackBy = function() {
								return new ObjectId().toString();
							}
							
							$scope.tocSelection = function(entry) {
								// TODO gcr: See about refactoring this to
								// eliminate the switch.
								// One could use entry.reference.type to assemble
								// the $emit string.
								// Doing so would require maintaining a sync
								// with the ProfileListController.
								entry.highlight = true;
								ToCSvc.currentLeaf.highlight = false;
								ToCSvc.currentLeaf = entry;
//								console.log("entry=" + entry.reference.sectionTitle);
								switch (entry.type) {
								case "documentMetadata": {
									$scope.$emit('event:openDocumentMetadata',
											entry.reference);
									break;
								}
								case "profileMetadata": {
									$scope.$emit('event:openProfileMetadata',
											entry.reference);
									break;
								}
								case "message": {
									$scope.$emit('event:openMessage',
											entry.reference);
									break;
								}
								case "segment": {
									$scope.$emit('event:openSegment',
											entry.reference);
									break;
								}
								case "datatype": {
									$scope.$emit('event:openDatatype',
											entry.reference);
									break;
								}
								case "table": {
									$scope.$emit('event:openTable',
											entry.reference);
									break;
								}
								default: {
									$scope.$emit('event:openSection',
											entry.reference);
									break;
								}
								}
								return $scope.subview;
							};
							
							$scope.closedCtxSubMenu = function(node, $index) {
								var ctxMenuSelection = ContextMenuSvc.get();
//								console.log("ctxMenuSelection=" + ctxMenuSelection);
								switch (ctxMenuSelection) {
								case "Add":
									console.log("Add==> node=" + node);
									break;
								case "Copy":
									console.log("Copy==> node=" + node + " node.reference.type=" + node.reference.type);
									if (node.reference.type === 'section') {
					        				CloneDeleteSvc.copySection(node);
									} else if (node.reference.type === 'segment') {
						        			CloneDeleteSvc.copySegment(node.reference);
									}  else if (node.reference.type === 'datatype') {
						        			CloneDeleteSvc.copyDatatype(node.reference);
									} else if (node.reference.type === 'table') {
										CloneDeleteSvc.copyTable(node.reference);
									} else if (node.reference.type === 'message') {
										CloneDeleteSvc.copyMessage(node.reference);
									}
									break;
								case "Delete":
									console.log("Copy==> node=" + node);
									if (node.reference.type === 'section') {
					        				CloneDeleteSvc.deleteSection(node);
									} else if (node.reference.type === 'segment') {
						        			CloneDeleteSvc.deleteSegment(node.reference);
									}  else if (node.reference.type === 'datatype') {
						        			CloneDeleteSvc.deleteDatatype(node.reference);
									} else if (node.reference.type === 'table') {
										CloneDeleteSvc.deleteValueSet(node.reference);
									} else if (node.reference.type === 'message') {
										CloneDeleteSvc.deleteMessage(node.reference);
									}
									break;
								case "Export":
									if (node.reference.type === 'message') {
										console.log("Export==> node=" + node);
										console.log("IG document ID  : " +  $rootScope.igdocument.id);
										console.log("Selected Message ID  : " +  node.reference.id);
										CloneDeleteSvc.exportDisplayXML(node.reference.id);
									}
									break;
								default:
									console
											.log("Context menu defaulted with "
													+ ctxMenuSelection
													+ " Should be Add, Copy, or Delete.");
								}
								$rootScope.$broadcast('event:SetToC');	
							};
						} ])
'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('AboutCtrl', ["$scope", "$rootScope", function ($scope, $rootScope) {

   $scope.releaseNotes = [
        {
            "version":$rootScope.appInfo.version,
            "date":$rootScope.appInfo.date,
            updates:[
                'Update License for Editor',' Update Select IG Document Types Buttons','Update Create IG Document dialog',' Update Export as Dialog'
            ]
        },
        {
            "version":'1.0.0-beta-2',
            "date":'03/07/2016',
            updates:[
                'Display the left side table of contents for HTML export','Add Image (pfg,gif,jpeg,jpg) upload feature',' Add File (word, html,pdf) Upload feature','Export IG Document as Word Document',
                'Display the list message events by version for the creation of a new IG Document','Handle the message level predicates and conformance statements','Added Issue and About Tabs'
            ]
        }
    ];



  }]);

'use strict';

/* "newcap": false */

angular.module('tcl')
.controller('UserProfileCtrl', ['$scope', '$resource', 'AccountLoader', 'Account', 'userInfoService', '$location',
    function ($scope, $resource, AccountLoader, Account, userInfoService, $location) {
        var PasswordChange = $resource('api/accounts/:id/passwordchange', {id:'@id'});

        $scope.accountpwd = {};

        $scope.initModel = function(data) {
            $scope.account = data;
            $scope.accountOrig = angular.copy($scope.account);
        };

        $scope.updateAccount = function() {
            //not sure it is very clean...
            //TODO: Add call back?
            new Account($scope.account).$save();

            $scope.accountOrig = angular.copy($scope.account);
        };

        $scope.resetForm = function() {
            $scope.account = angular.copy($scope.accountOrig);
        };

        //TODO: Change that: formData is only supported on modern browsers
        $scope.isUnchanged = function(formData) {
            return angular.equals(formData, $scope.accountOrig);
        };


        $scope.changePassword = function() {
            var user = new PasswordChange();
            user.username = $scope.account.username;
            user.password = $scope.accountpwd.currentPassword;
            user.newPassword = $scope.accountpwd.newPassword;
            user.id = $scope.account.id;
            //TODO: Check return value???
            user.$save().then(function(result){
                $scope.msg = angular.fromJson(result);
            });
        };

        $scope.deleteAccount = function () {
            var tmpAcct = new Account();
            tmpAcct.id = $scope.account.id;

            tmpAcct.$remove(function() {
                //console.log("Account removed");
                //TODO: Add a real check?
                userInfoService.setCurrentUser(null);
                $scope.$emit('event:logoutRequest');
                $location.url('/home');
            });
        };

        /*jshint newcap:false */
        AccountLoader(userInfoService.getAccountID()).then(
            function(data) {
                $scope.initModel(data);
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            },
            function() {
//                console.log('Error fetching account information');
            }
        );
    }
]);


angular.module('tcl')
    .controller('UserAccountCtrl', ['$scope', '$resource', 'AccountLoader', 'Account', 'userInfoService', '$location', '$rootScope',
        function ($scope, $resource, AccountLoader, Account, userInfoService, $location,$rootScope) {


            $scope.accordi = { account : true, accounts:false};
            $scope.setSubActive = function (id) {
                if(id && id != null) {
                    $rootScope.setSubActive(id);
                    $('.accountMgt').hide();
                    $('#' + id).show();
                }
            };
            $scope.initAccount = function(){
                if($rootScope.subActivePath == null){
                    $rootScope.subActivePath = "account";
                }
                $scope.setSubActive($rootScope.subActivePath);
            };


        }
    ]);

'use strict';

angular.module('tcl')
    .controller('AccountsListCtrl', ['$scope', 'MultiAuthorsLoader', 'MultiSupervisorsLoader','Account', '$modal', '$resource','AccountLoader','userInfoService','$location',
        function ($scope, MultiAuthorsLoader, MultiSupervisorsLoader, Account, $modal, $resource, AccountLoader, userInfoService, $location) {

            //$scope.accountTypes = [{ 'name':'Author', 'type':'author'}, {name:'Supervisor', type:'supervisor'}];
            //$scope.accountType = $scope.accountTypes[0];
            $scope.tmpAccountList = [].concat($scope.accountList);
            $scope.account = null;
            $scope.accountOrig = null;
            $scope.accountType = "author";
            $scope.scrollbarWidth = $scope.getScrollbarWidth();

//        var PasswordChange = $resource('api/accounts/:id/passwordchange', {id:'@id'});
            var PasswordChange = $resource('api/accounts/:id/userpasswordchange', {id:'@id'});
            var ApproveAccount = $resource('api/accounts/:id/approveaccount', {id:'@id'});
            var SuspendAccount = $resource('api/accounts/:id/suspendaccount', {id:'@id'});
            $scope.msg = null;

            $scope.accountpwd = {};

            $scope.updateAccount = function() {
                //not sure it is very clean...
                //TODO: Add call back?
                new Account($scope.account).$save();
                $scope.accountOrig = angular.copy($scope.account);
            };

            $scope.resetForm = function() {
                $scope.account = angular.copy($scope.accountOrig);
            };

            //TODO: Change that: formData is only supported on modern browsers
            $scope.isUnchanged = function(formData) {
                return angular.equals(formData, $scope.accountOrig);
            };

            $scope.changePassword = function() {
                var user = new PasswordChange();
                user.username = $scope.account.username;
                user.password = $scope.accountpwd.currentPassword;
                user.newPassword = $scope.accountpwd.newPassword;
                user.id = $scope.account.id;
                //TODO: Check return value???
                user.$save().then(function(result){
                    $scope.msg = angular.fromJson(result);
                });
            };

            $scope.loadAccounts = function(){
                if (userInfoService.isAuthenticated() && userInfoService.isAdmin()) {
                    $scope.msg = null;
                    new MultiAuthorsLoader().then(function (response) {
                        $scope.accountList = response;
                        $scope.tmpAccountList = [].concat($scope.accountList);
                    });
                }
            };

            $scope.initManageAccounts = function(){
                $scope.loadAccounts();
            };

            $scope.selectAccount = function(row) {
                $scope.accountpwd = {};
                $scope.account = row;
                $scope.accountOrig = angular.copy($scope.account);
            };

            $scope.deleteAccount = function() {
                $scope.confirmDelete($scope.account);
            };

            $scope.confirmDelete = function (accountToDelete) {
                var modalInstance = $modal.open({
                    templateUrl: 'ConfirmAccountDeleteCtrl.html',
                    controller: 'ConfirmAccountDeleteCtrl',
                    resolve: {
                        accountToDelete: function () {
                            return accountToDelete;
                        },
                        accountList: function () {
                            return $scope.accountList;
                        }
                    }
                });
                modalInstance.result.then(function (accountToDelete,accountList ) {
                    $scope.accountToDelete = accountToDelete;
                    $scope.accountList = accountList;
                }, function () {
                });
            };

            $scope.approveAccount = function() {
                var user = new ApproveAccount();
                user.username = $scope.account.username;
                user.id = $scope.account.id;
                user.$save().then(function(result){
                    $scope.account.pending = false;
                    $scope.msg = angular.fromJson(result);
                });
            };

            $scope.suspendAccount = function(){
                var user = new SuspendAccount();
                user.username = $scope.account.username;
                user.id = $scope.account.id;
                user.$save().then(function(result){
                    $scope.account.pending = true;
                    $scope.msg = angular.fromJson(result);
                });
            };


        }
    ]);



angular.module('tcl').controller('ConfirmAccountDeleteCtrl', ["$scope", "$modalInstance", "accountToDelete", "accountList", "Account", function ($scope, $modalInstance, accountToDelete,accountList,Account) {

    $scope.accountToDelete = accountToDelete;
    $scope.accountList = accountList;
    $scope.delete = function () {
        //console.log('Delete for', $scope.accountList[rowIndex]);
        Account.remove({id:accountToDelete.id},
            function() {
                var rowIndex = $scope.accountList.indexOf(accountToDelete);
                if(index !== -1){
                    $scope.accountList.splice(rowIndex,1);
                }
                $modalInstance.close($scope.accountToDelete);
            },
            function() {
//                            console.log('There was an error deleting the account');
            }
        );
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);






/**
 * Created by Jungyub on 4/01/15.
 */

angular.module('tcl').controller('ConstraintsListCtrl',["$scope", "$rootScope", "Restangular", "$filter", function($scope, $rootScope, Restangular, $filter) {
	$scope.loading = false;
	$scope.tmpSegmentPredicates = [].concat($rootScope.segmentPredicates);
	$scope.tmpSegmentConformanceStatements = [].concat($rootScope.segmentConformanceStatements);
	$scope.tmpDatatypePredicates = [].concat($rootScope.datatypePredicates);
	$scope.tmpDatatypeConformanceStatements = [].concat($rootScope.datatypeConformanceStatements);
	 
	
	
	$scope.init = function() {
	};
	
}]);
/**
 * Created by haffo on 2/13/15.
 */
angular.module('tcl')
    .controller('DatatypeListCtrl', ["$scope", "$rootScope", "Restangular", "ngTreetableParams", "$filter", "$http", "$modal", "$timeout", "CloneDeleteSvc", "ViewSettings", "DatatypeService", function ($scope, $rootScope, Restangular, ngTreetableParams, $filter, $http, $modal, $timeout, CloneDeleteSvc, ViewSettings,DatatypeService) {
        $scope.readonly = false;
        $scope.saved = false;
        $scope.message = false;
        $scope.datatypeCopy = null;
        $scope.viewSettings = ViewSettings;

        $scope.init = function () {
       };

        $scope.copy = function (datatype) {
        		CloneDeleteSvc.copyDatatype(datatype);
        };

        $scope.recordDatatypeChange = function (type, command, id, valueType, value) {
            var datatypeFromChanges = $rootScope.findObjectInChanges("datatype", "add", $rootScope.datatype.id);
            if (datatypeFromChanges === undefined) {
                $rootScope.recordChangeForEdit2(type, command, id, valueType, value);
            }
        };

        $scope.close = function () {
            $rootScope.datatype = null;
            $scope.refreshTree();
            $scope.loadingSelection = false;
        };

        $scope.delete = function (datatype) {
        		CloneDeleteSvc.deleteDatatype(datatype);
			$rootScope.$broadcast('event:SetToC');
       };

        $scope.hasChildren = function (node) {
            return node && node != null && node.datatype && $rootScope.getDatatype(node.datatype) != undefined && $rootScope.getDatatype(node.datatype).components != null && $rootScope.getDatatype(node.datatype).components.length > 0;
        };

        $scope.validateLabel = function (label, name) {
            if (label && !label.startsWith(name)) {
                return false;
            }
            return true;
        };

        $scope.onDatatypeChange = function (node) {
            $rootScope.recordChangeForEdit2('component', 'edit', node.id, 'datatype', node.datatype);
            $scope.refreshTree(); // TODO: Refresh only the node
        };

        $scope.refreshTree = function () {
            if ($scope.datatypesParams)
                $scope.datatypesParams.refresh();
        };

        $scope.goToTable = function (table) {
            $scope.$emit('event:openTable', table);
        };

        $scope.deleteTable = function (node) {
            node.table = null;
            $rootScope.recordChangeForEdit2('component', 'edit', node.id, 'table', null);
        };

        $scope.mapTable = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'TableMappingDatatypeCtrl.html',
                controller: 'TableMappingDatatypeCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.managePredicate = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'PredicateDatatypeCtrl.html',
                controller: 'PredicateDatatypeCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.manageConformanceStatement = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'ConformanceStatementDatatypeCtrl.html',
                controller: 'ConformanceStatementDatatypeCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.isSubDT = function (component) {
            if ($rootScope.datatype != null) {
                for (var i = 0, len = $rootScope.datatype.components.length; i < len; i++) {
                    if ($rootScope.datatype.components[i].id === component.id)
                        return false;
                }
            }
            return true;
        };

        $scope.findDTByComponentId = function (componentId) {
            return $rootScope.parentsMap[componentId] ? $rootScope.parentsMap[componentId] : null;
        };

        $scope.countConformanceStatements = function (position) {
            var count = 0;
            if ($rootScope.datatype != null)
                for (var i = 0, len1 = $rootScope.datatype.conformanceStatements.length; i < len1; i++) {
                    if ($rootScope.datatype.conformanceStatements[i].constraintTarget.indexOf(position + '[') === 0)
                        count = count + 1;
                }

            return count;
        };

        $scope.countPredicate = function (position) {
            if ($rootScope.datatype != null)
                for (var i = 0, len1 = $rootScope.datatype.predicates.length; i < len1; i++) {
                    if ($rootScope.datatype.predicates[i].constraintTarget.indexOf(position + '[') === 0)
                        return 1;
                }

            return 0;
        };
        
        $scope.countPredicateOnSubComponent = function (position, componentId) {
        	var dt = $scope.findDTByComponentId(componentId);
        	if (dt != null)
                for (var i = 0, len1 = dt.predicates.length; i < len1; i++) {
                    if (dt.predicates[i].constraintTarget.indexOf(position + '[') === 0)
                        return 1;
                }

            return 0;
        };


        $scope.isRelevant = function (node) {
            return DatatypeService.isRelevant(node);
        };

        $scope.isBranch = function (node) {
            return DatatypeService.isBranch(node);
        };


        $scope.isVisible = function (node) {
            return DatatypeService.isVisible(node);
         };

        $scope.children = function (node) {
            return DatatypeService.getNodes(node);
        };

        $scope.getParent = function (node) {
            return DatatypeService.getParent(node);
        };

        $scope.getDatatypeLevelConfStatements = function (element) {
            return DatatypeService.getDatatypeLevelConfStatements(element);
        };

        $scope.getDatatypeLevelPredicates = function (element) {
            return DatatypeService.getDatatypeLevelPredicates(element);
        };

    }]);


angular.module('tcl')
    .controller('DatatypeRowCtrl', ["$scope", "$filter", function ($scope, $filter) {
        $scope.formName = "form_" + new Date().getTime();
    }]);


angular.module('tcl').controller('ConfirmDatatypeDeleteCtrl', ["$scope", "$modalInstance", "dtToDelete", "$rootScope", function ($scope, $modalInstance, dtToDelete, $rootScope) {
    $scope.dtToDelete = dtToDelete;
    $scope.loading = false;
    $scope.delete = function () {
        $scope.loading = true;
        // We must delete from two collections.
        var index = $rootScope.datatypes.indexOf($scope.dtToDelete);
       if (index > -1) $rootScope.datatypes.splice(index, 1);
        if ($rootScope.datatype === $scope.dtToDelete) {
            $rootScope.datatype = null;
        }
        var index = $rootScope.igdocument.profile.datatypes.children.indexOf($scope.dtToDelete);
        if (index > -1) $rootScope.igdocument.profile.datatypes.children.splice(index, 1);
        $rootScope.datatypesMap[$scope.dtToDelete.id] = null;
        $rootScope.references = [];
        if ($scope.dtToDelete.id < 0) { //datatype flavor
//            var index = $rootScope.changes["datatype"]["add"].indexOf($scope.dtToDelete);
//            if (index > -1) $rootScope.changes["datatype"]["add"].splice(index, 1);
//            if ($rootScope.changes["datatype"]["add"] && $rootScope.changes["datatype"]["add"].length === 0) {
//                delete  $rootScope.changes["datatype"]["add"];
//            }
//            if ($rootScope.changes["datatype"] && Object.getOwnPropertyNames($rootScope.changes["datatype"]).length === 0) {
//                delete  $rootScope.changes["datatype"];
//            }
        } else {
            $rootScope.recordDelete("datatype", "edit", $scope.dtToDelete.id);
            if ($scope.dtToDelete.components != undefined && $scope.dtToDelete.components != null && $scope.dtToDelete.components.length > 0) {

                //clear components changes
                angular.forEach($scope.dtToDelete.components, function (component) {
                    $rootScope.recordDelete("component", "edit", component.id);
//                    $rootScope.removeObjectFromChanges("component", "delete", component.id);
                });
//                if ($rootScope.changes["component"]["delete"] && $rootScope.changes["component"]["delete"].length === 0) {
//                    delete  $rootScope.changes["component"]["delete"];
//                }

//                if ($rootScope.changes["component"] && Object.getOwnPropertyNames($rootScope.changes["component"]).length === 0) {
//                    delete  $rootScope.changes["component"];
//                }

            }

            if ($scope.dtToDelete.predicates != undefined && $scope.dtToDelete.predicates != null && $scope.dtToDelete.predicates.length > 0) {
                //clear predicates changes
                angular.forEach($scope.dtToDelete.predicates, function (predicate) {
                    $rootScope.recordDelete("predicate", "edit", predicate.id);
//                    $rootScope.removeObjectFromChanges("predicate", "delete", predicate.id);
                });
//                if ($rootScope.changes["predicate"]["delete"] && $rootScope.changes["predicate"]["delete"].length === 0) {
//                    delete  $rootScope.changes["predicate"]["delete"];
//                }

//                if ($rootScope.changes["predicate"] && Object.getOwnPropertyNames($rootScope.changes["predicate"]).length === 0) {
//                    delete  $rootScope.changes["predicate"];
//                }

            }

            if ($scope.dtToDelete.conformanceStatements != undefined && $scope.dtToDelete.conformanceStatements != null && $scope.dtToDelete.conformanceStatements.length > 0) {
                //clear conforamance statement changes
                angular.forEach($scope.dtToDelete.conformanceStatements, function (confStatement) {
                    $rootScope.recordDelete("conformanceStatement", "edit", confStatement.id);
//                    $rootScope.removeObjectFromChanges("conformanceStatement", "delete", confStatement.id);
                });
//                if ($rootScope.changes["conformanceStatement"]["delete"] && $rootScope.changes["conformanceStatement"]["delete"].length === 0) {
//                    delete  $rootScope.changes["conformanceStatement"]["delete"];
//                }

//                if ($rootScope.changes["conformanceStatement"] && Object.getOwnPropertyNames($rootScope.changes["conformanceStatement"]).length === 0) {
//                    delete  $rootScope.changes["conformanceStatement"];
//                }
            }
        }
        $rootScope.msg().text = "dtDeleteSuccess";
        $rootScope.msg().type = "success";
        $rootScope.msg().show = true;
        $rootScope.manualHandle = true;
		$rootScope.$broadcast('event:SetToC');
        $modalInstance.close($scope.dtToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


angular.module('tcl').controller('DatatypeReferencesCtrl', ["$scope", "$modalInstance", "dtToDelete", function ($scope, $modalInstance, dtToDelete) {

    $scope.dtToDelete = dtToDelete;

    $scope.ok = function () {
        $modalInstance.close($scope.dtToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('tcl').controller('TableMappingDatatypeCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.changed = false;
    $scope.selectedNode = selectedNode;
    $scope.selectedTable = null;
    if (selectedNode.table != undefined) {
        $scope.selectedTable = $rootScope.tablesMap[selectedNode.table];
    }

    $scope.selectTable = function (table) {
    	$scope.changed = true;
        $scope.selectedTable = table;
    };

    $scope.mappingTable = function () {
        $scope.selectedNode.table = $scope.selectedTable.id;
        $rootScope.recordChangeForEdit2('component', 'edit', $scope.selectedNode.id, 'table', $scope.selectedTable.id);
        $scope.ok();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

}]);

angular.module('tcl').controller('ConformanceStatementDatatypeCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.constraintType = 'Plain';
	$scope.selectedNode = selectedNode;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = $rootScope.calNextCSID();
    $scope.newComplexConstraint = [];
    
    $scope.changed = false;
    $scope.tempComformanceStatements = [];
    angular.copy($rootScope.datatype.conformanceStatements, $scope.tempComformanceStatements);
    
    
    $scope.setChanged = function () {
    	$scope.changed = true;
    }
    
    $scope.initConformanceStatement = function () {
    	$scope.newConstraint = angular.fromJson({
    		position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            datatype: '',
            component_1: null,
            subComponent_1: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            constraintId: $rootScope.calNextCSID(),
            contraintType: null,
            value: null,
            value2: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });
        $scope.newConstraint.datatype = $rootScope.datatype.name;
    }
    
    $scope.initComplexStatement = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.newComplexConstraintId = $rootScope.calNextCSID();
    }
    
    $scope.initConformanceStatement();

    $scope.deleteConformanceStatement = function (conformanceStatement) {
    	$scope.tempComformanceStatements.splice($scope.tempComformanceStatements.indexOf(conformanceStatement), 1);
        $scope.changed = true;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.genLocation = function (datatype, component, subComponent) {
        var location = null;
        if (component != null && subComponent == null) {
        	location = datatype + '.' + component.position + "(" + component.name +")";
        } else if (component != null && subComponent != null) {
        	location = datatype + '.' + component.position + '.' + subComponent.position  + "(" + subComponent.name +")";
        }

        return location;
    };

    $scope.genPosition = function (component, subComponent) {
        var position = null;
        if (component != null && subComponent == null) {
        	position = component.position + '[1]';
        } else if (component != null && subComponent != null) {
        	Position = component.position + '[1]' + '.' + subComponent.position + '[1]';
        }

        return position;
    };
    
    $scope.addComplexConformanceStatement = function(){
    	$scope.complexConstraint = $rootScope.generateCompositeConformanceStatement($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
    	$scope.complexConstraint.constraintId = $scope.newComplexConstraintId;
    	if($rootScope.conformanceStatementIdList.indexOf($scope.complexConstraint.constraintId) == -1) $rootScope.conformanceStatementIdList.push($scope.complexConstraint.constraintId);
    	$scope.tempComformanceStatements.push($scope.complexConstraint);
    	$scope.initComplexStatement();
        $scope.changed = true;
    };

    $scope.addConformanceStatement = function () {
        $scope.newConstraint.position_1 = $scope.genPosition($scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.position_2 = $scope.genPosition($scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        $scope.newConstraint.location_1 = $scope.genLocation($scope.newConstraint.datatype, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.location_2 = $scope.genLocation($scope.newConstraint.datatype, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);

        if ($scope.newConstraint.position_1 != null) {
        	$rootScope.newConformanceStatementFakeId = $rootScope.newConformanceStatementFakeId - 1;
        	var cs = null;
        	if($scope.selectedNode === null) {
        		var cs = $rootScope.generateConformanceStatement(".", $scope.newConstraint);
        	}else {
        		var cs = $rootScope.generateConformanceStatement($scope.selectedNode.position + '[1]', $scope.newConstraint);
        	}
            $scope.tempComformanceStatements.push(cs);
            $scope.changed = true;
            if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
        }
        $scope.initConformanceStatement();
        
        
    };

    $scope.ok = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		$rootScope.conformanceStatementIdList.splice($rootScope.conformanceStatementIdList.indexOf(cs.constraintId), 1);
    	});
    	
    	angular.forEach($rootScope.datatype.conformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.saveclose = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	angular.copy($scope.tempComformanceStatements, $rootScope.datatype.conformanceStatements);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };
}]);


angular.module('tcl').controller('PredicateDatatypeCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.constraintType = 'Plain';
	$scope.selectedNode = selectedNode;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.complexConstraintTrueUsage = null;
    $scope.complexConstraintFalseUsage = null;
    
    $scope.changed = false;
    $scope.tempPredicates = [];
    angular.copy($rootScope.datatype.predicates, $scope.tempPredicates);

    
    $scope.setChanged = function () {
    	$scope.changed = true;
    }

    $scope.initPredicate = function () {
    	$scope.newConstraint = angular.fromJson({
    		position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            datatype: '',
            component_1: null,
            subComponent_1: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            contraintType: null,
            value: null,
            value2: null,
            trueUsage: null,
            falseUsage: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });
        $scope.newConstraint.datatype = $rootScope.datatype.name;
    }
    
    $scope.initComplexPredicate = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.complexConstraintTrueUsage = null;
        $scope.complexConstraintFalseUsage = null;
    }
    
    $scope.initPredicate();
    
    
    $scope.deletePredicate = function (predicate) {
    	$scope.tempPredicates.splice($scope.tempPredicates.indexOf(predicate), 1);
        $scope.changed = true;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };

    
    $scope.genLocation = function (datatype, component, subComponent) {
        var location = null;
        if (component != null && subComponent == null) {
        	location = datatype + '.' + component.position + "(" + component.name +")";
        } else if (component != null && subComponent != null) {
        	location = datatype + '.' + component.position + '.' + subComponent.position  + "(" + subComponent.name +")";
        }

        return location;
    };

    $scope.genPosition = function (component, subComponent) {
        var position = null;
        if (component != null && subComponent == null) {
        	position = component.position + '[1]';
        } else if (component != null && subComponent != null) {
            position = component.position + '[1]' + '.' + subComponent.position + '[1]';
        }

        return position;
    };
    

    $scope.deletePredicateByTarget = function () {
        for (var i = 0, len1 = $scope.tempPredicates.length; i < len1; i++) {
            if ($scope.tempPredicates[i].constraintTarget.indexOf($scope.selectedNode.position + '[') === 0) {
                $scope.deletePredicate($scope.tempPredicates[i]);
                return true;
            }
        }
        return false;
    };
    
    $scope.addComplexPredicate = function(){
        $scope.complexConstraint = $rootScope.generateCompositePredicate($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
        $scope.complexConstraint.trueUsage = $scope.complexConstraintTrueUsage;
        $scope.complexConstraint.falseUsage = $scope.complexConstraintFalseUsage;
        
        if($scope.selectedNode === null) {
        	$scope.complexConstraint.constraintId = '.';
    	}else {
    		$scope.complexConstraint.constraintId = $scope.newConstraint.datatype + '-' + $scope.selectedNode.position;
    	}
        
    	$scope.tempPredicates.push($scope.complexConstraint);
    	$scope.initComplexPredicate();
        $scope.changed = true;
    };
    
    $scope.addPredicate = function () {
        $rootScope.newPredicateFakeId = $rootScope.newPredicateFakeId - 1;
        
        $scope.newConstraint.position_1 = $scope.genPosition($scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.position_2 = $scope.genPosition($scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        $scope.newConstraint.location_1 = $scope.genLocation($scope.newConstraint.datatype, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.location_2 = $scope.genLocation($scope.newConstraint.datatype, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);

        if ($scope.newConstraint.position_1 != null) {
        	var cp = null;
        	if($scope.selectedNode === null) {
        		var cp = $rootScope.generatePredicate(".", $scope.newConstraint);
        	}else {
        		var cp = $rootScope.generatePredicate($scope.selectedNode.position + '[1]', $scope.newConstraint);
        	}
            $scope.tempPredicates.push(cp);
            $scope.changed = true;
        }
        $scope.initPredicate();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

    $scope.saveclose = function () {
    	angular.copy($scope.tempPredicates, $rootScope.datatype.predicates);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };
}]);

/**
 * Created by haffo on 1/12/15.
 */

'use strict';

angular.module('tcl')
.controller('ForgottenCtrl', ['$scope', '$resource',
    function ($scope, $resource) {
        var ForgottenRequest = $resource('api/sooa/accounts/passwordreset', {username:'@username'});

        $scope.requestResetPassword =  function() {
            var resetReq = new ForgottenRequest();
            resetReq.username = $scope.username;
            resetReq.$save(function() {
                if ( resetReq.text === 'resetRequestProcessed' ) {
                    $scope.username = '';
                }
            });
        };
    }
]);

angular.module('tcl').controller(
		'HL7VersionsDlgCtrl',
		["$scope", "$rootScope", "$modal", "$log", "$http", "$httpBackend", "userInfoService", function($scope, $rootScope, $modal, $log, $http, $httpBackend,
				userInfoService) {

			$rootScope.clickSource = {};

            $rootScope.scrollbarWidth = $rootScope.getScrollbarWidth();
		
			$scope.hl7Versions = function(clickSource) {
				console.log("$scope.hl7Versions  clickSource=" + clickSource);
				$rootScope.clickSource = clickSource;
				if ($rootScope.hasChanges()) {
					$scope.confirmOpen($rootScope.igdocument);
				} else {
					$rootScope.hl7Versions = false;
					$scope.hl7VersionsInstance();
				}
			};
			
	        $scope.confirmOpen = function (igdocument) {
	            return $modal.open({
	                templateUrl: 'ConfirmIGDocumentOpenCtrl.html',
	                controller: 'ConfirmIGDocumentOpenCtrl',
	                resolve: {
	                    igdocumentToOpen: function () {
	                        return igdocument;
	                    }
	                }
	            }).result.then(function (igdocument) {
	                $rootScope.clearChanges();
	                $scope.hl7VersionsInstance();
	            }, function () {
	            		console.log("Changes discarded.");
	            });
	        };
			
			$scope.hl7VersionsInstance = function() {
				return $modal.open({
					templateUrl : 'hl7VersionsDlg.html',
					controller : 'HL7VersionsInstanceDlgCtrl',
                    windowClass: 'hl7-versions-modal',
					resolve : {
						hl7Versions : function() {
							return $scope.listHL7Versions();
						}
					}
				}).result.then(function(result) {
					switch ($rootScope.clickSource) {
					case "btn": {
						$scope.createIGDocument($rootScope.hl7Version, result);
						break;
					}
					case "ctx": {
						$scope.updateIGDocument(result);
						break;
					}
					}
				});			
			};

			$scope.listHL7Versions = function() {
				return $http.get('api/igdocuments/findVersions', {
					timeout : 60000
				}).then(function(response) {
					var hl7Versions = [];
					if ($rootScope.clickSource !== "ctx") {
						$rootScope.hl7Version = $scope.hl7Version = false;
						$rootScope.igdocument = false;
					}
					var length = response.data.length;
					for (var i = 0; i < length; i++) {
						hl7Versions.push(response.data[i]);
					}
					return hl7Versions;
				});
			};

			/**
			 * TODO: Handle error from server
			 * 
			 * @param msgIds
			 */
			$scope.createIGDocument = function(hl7Version, msgEvts) {
				console.log("Creating IGDocument...");
				console.log("msgEvts=" + msgEvts);
				var iprw = {
					"hl7Version" : hl7Version,
					"msgEvts" : msgEvts,
					"accountID" : userInfoService.getAccountID(), 
					"timeout" : 60000
				};
				$http.post('api/igdocuments/createIntegrationProfile', iprw)
						.then(
								function(response) {
									var igdocument = angular
											.fromJson(response.data);
									$rootScope
											.$broadcast(
													'event:openIGDocumentRequest',
													igdocument);
									$rootScope.$broadcast('event:IgsPushed',
											igdocument);
								});
				return $rootScope.igdocument;
			};

			/**
			 * TODO: Handle error from server
			 * 
			 * @param msgIds
			 */
			$scope.updateIGDocument = function(msgEvts) {
				console.log("Updating igdocument...");
				console.log("$scope.updateIGDocumentmsgEvts=" + JSON.stringify(msgEvts));
				var iprw = {
					"igdocument" : $rootScope.igdocument,
					"msgEvts" : msgEvts,
					"timeout" : 60000
				};
				$http.post('api/igdocuments/updateIntegrationProfile', iprw)
						.then(
								function(response) {
									var igdocument = angular
											.fromJson(response.data);
									$rootScope
											.$broadcast(
													'event:openIGDocumentRequest',
													igdocument);
									$rootScope.$broadcast('event:IgsPushed',
											igdocument);
								});
			};

			$scope.closedCtxMenu = function(node, $index) {
				console.log("closedCtxMenu");
			};

		}]);

angular.module('tcl').controller(
		'HL7VersionsInstanceDlgCtrl',
		["$scope", "$rootScope", "$modalInstance", "$http", "hl7Versions", "ProfileAccessSvc", "MessageEventsSvc", "$timeout", function($scope, $rootScope, $modalInstance, $http, hl7Versions,
				ProfileAccessSvc, MessageEventsSvc, $timeout) {

			$scope.hl7Versions = hl7Versions;
			$scope.hl7Version = $rootScope.hl7Version;
			$scope.okDisabled = true;
			$scope.messageIds = [];
			$scope.messageEvents = [];
            $scope.loading = false;
			var messageEvents = [];
            $scope.messageEventsParams = null;
            $scope.scrollbarWidth = $rootScope.getScrollbarWidth();

            $scope.loadIGDocumentsByVersion = function() {
                $scope.loading = true;
                $timeout(function() {
                    $rootScope.hl7Version = $scope.hl7Version;
                    $scope.messageEventsParams = MessageEventsSvc.getMessageEvents($rootScope.hl7Version);
                    $scope.loading = false;
                });
			};
			
			$scope.isBranch = function(node) {
				var rval = false;
				if (node.type === "message") {
					rval = true;
					MessageEventsSvc.putState(node);
				}
				return rval;
			};
			
			$scope.trackSelections = function(bool, event) {
				if (bool) {
					messageEvents.push({ "id" : event.id, "children" : [{"name" : event.name}]});
				} else {
					for (var i = 0; i < messageEvents.length; i++) {
						if (messageEvents[i].id == event.id) {
							messageEvents.splice(i, 1);
						}
					}
				}
				$scope.okDisabled = messageEvents.length === 0;
			};


			$scope.$watch(function() {
				return $rootScope.igdocument.id;
			}, function(newValue, oldValue) {
				if ($rootScope.clickSource === "ctx") {
					$scope.hl7Version = $rootScope.hl7Version;
					$scope.messageIds = ProfileAccessSvc.Messages().getMessageIds();
					$scope.loadIGDocumentsByVersion();
				}
			});

			$scope.ok = function() {
				$scope.messageEvents = messageEvents;
				$modalInstance.close(messageEvents);
			};
			
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}]);

'use strict';

/* "newcap": false */

angular.module('tcl')
    .controller('IdleCtrl', ["$scope", "Idle", "Keepalive", "$modal", "IdleService", function($scope, Idle, Keepalive, $modal,IdleService){
//        $scope.started = false;
//
//        function closeModals() {
//            if ($scope.warning) {
//                $scope.warning.close();
//                $scope.warning = null;
//            }
//
//            if ($scope.timedout) {
//                $scope.timedout.close();
//                $scope.timedout = null;
//            }
//        }
//
//        $scope.$on('IdleStart', function() {
//            closeModals();
//
//            $scope.warning = $modal.open({
//                templateUrl: 'warning-dialog.html',
//                windowClass: 'modal-danger'
//            });
//        });
//
//        $scope.$on('IdleEnd', function() {
//            closeModals();
//        });
//
//        $scope.$on('IdleTimeout', function() {
//            closeModals();
//            $scope.timedout = $modal.open({
//                templateUrl: 'timedout-dialog.html',
//                windowClass: 'modal-danger'
//            });
//        });
//
//        $scope.$on('Keepalive', function() {
//            IdleService.keepAlive();
//        });
//
//
//        $scope.start = function() {
//            closeModals();
//            Idle.watch();
//            $scope.started = true;
//        };
//
//        $scope.stop = function() {
//            closeModals();
//            Idle.unwatch();
//            $scope.started = false;
//
//        };
    }]);


'use strict';

angular.module('tcl').controller('IssueCtrl', ['$scope', '$resource',
    function ($scope, $resource) {
        var Issue = $resource('api/sooa/issues/:id');

        $scope.clearIssue = function() {
            $scope.issue.title = '';
            $scope.issue.description = '';
            $scope.issue.email = '';
        };

        $scope.submitIssue = function() {
            var issueToReport = new Issue($scope.issue);
            issueToReport.$save(function() {
                if ( issueToReport.text === '') {
                    $scope.clearIssue();
                }
            });
        };
    }
]);

'use strict';

angular.module('tcl').controller('MainCtrl', ['$scope', '$rootScope', 'i18n', '$location', 'userInfoService', '$modal', 'Restangular', '$filter', 'base64', '$http', 'Idle', 'notifications', 'IdleService','AutoSaveService','StorageService',
    function ($scope, $rootScope, i18n, $location, userInfoService, $modal, Restangular, $filter, base64, $http, Idle,notifications,IdleService,AutoSaveService,StorageService) {
        userInfoService.loadFromServer();
        $rootScope.loginDialog = null;

        $scope.language = function () {
            return i18n.language;
        };

        $scope.setLanguage = function (lang) {
            i18n.setLanguage(lang);
        };

        $scope.activeWhen = function (value) {
            return value ? 'active' : '';
        };

        $scope.activeIfInList = function (value, pathsList) {
            var found = false;
            if (angular.isArray(pathsList) === false) {
                return '';
            }
            var i = 0;
            while ((i < pathsList.length) && (found === false)) {
                if (pathsList[i] === value) {
                    return 'active';
                }
                i++;
            }
            return '';
        };

        $scope.path = function () {
            return $location.url();
        };

        $scope.login = function () {
//        console.log("in login");
            $scope.$emit('event:loginRequest', $scope.username, $scope.password);
        };

        $scope.loginReq = function () {
//        console.log("in loginReq");
            if ($rootScope.loginMessage()) {
                $rootScope.loginMessage().text = "";
                $rootScope.loginMessage().show = false;
            }
            $scope.$emit('event:loginRequired');
        };

        $scope.logout = function () {
            if ($rootScope.igdocument && $rootScope.igdocument != null && $rootScope.hasChanges()) {
                var modalInstance = $modal.open({
                    templateUrl: 'ConfirmLogout.html',
                    controller: 'ConfirmLogoutCtrl'
                });
                modalInstance.result.then(function () {
                    $scope.execLogout();
                }, function () {
                });
            } else {
                $scope.execLogout();
            }
        };

        $scope.execLogout = function () {
            userInfoService.setCurrentUser(null);
            $scope.username = $scope.password = null;
            $scope.$emit('event:logoutRequest');
            StorageService.remove(StorageService.IG_DOCUMENT);
            $rootScope.initMaps();
            $rootScope.igdocument = null;
            AutoSaveService.stop();
            $location.url('/tp');
        };

        $scope.cancel = function () {
            $scope.$emit('event:loginCancel');
        };

        $scope.isAuthenticated = function () {
            return userInfoService.isAuthenticated();
        };

        $scope.isPending = function () {
            return userInfoService.isPending();
        };


        $scope.isSupervisor = function () {
            return userInfoService.isSupervisor();
        };

        $scope.isVendor = function () {
            return userInfoService.isAuthorizedVendor();
        };

        $scope.isAuthor = function () {
            return userInfoService.isAuthor();
        };

        $scope.isCustomer = function () {
            return userInfoService.isCustomer();
        };

        $scope.isAdmin = function () {
            return userInfoService.isAdmin();
        };

        $scope.getRoleAsString = function () {
            if ($scope.isAuthor() === true) {
                return 'author';
            }
            if ($scope.isSupervisor() === true) {
                return 'Supervisor';
            }
            if ($scope.isAdmin() === true) {
                return 'Admin';
            }
            return 'undefined';
        };

        $scope.getUsername = function () {
            if (userInfoService.isAuthenticated() === true) {
                return userInfoService.getUsername();
            }
            return '';
        };

        $rootScope.showLoginDialog = function (username, password) {

            if ($rootScope.loginDialog && $rootScope.loginDialog != null && $rootScope.loginDialog.opened) {
                $rootScope.loginDialog.dismiss('cancel');
            }

            $rootScope.loginDialog = $modal.open({
                backdrop: 'static',
                keyboard: 'false',
                controller: 'LoginCtrl',
                size: 'lg',
                templateUrl: 'views/account/login.html',
                resolve: {
                    user: function () {
                        return {username: $scope.username, password: $scope.password};
                    }
                }
            });

            $rootScope.loginDialog.result.then(function (result) {
                if (result) {
                    $scope.username = result.username;
                    $scope.password = result.password;
                    $scope.login();
                } else {
                    $scope.cancel();
                }
            });
        };

        $rootScope.started = false;

        Idle.watch();

        $rootScope.$on('IdleStart', function () {
            closeModals();
            $rootScope.warning = $modal.open({
                templateUrl: 'warning-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $rootScope.$on('IdleEnd', function () {
            closeModals();
        });

        $rootScope.$on('IdleTimeout', function () {
            closeModals();
            if ($scope.isAuthenticated()) {
                if ($rootScope.igdocument && $rootScope.igdocument != null && $rootScope.hasChanges()) {
                    $rootScope.$emit('event:saveAndExecLogout');
                }else {
                    $rootScope.$emit('event:execLogout');
                }
            }
            $rootScope.timedout = $modal.open({
                templateUrl: 'timedout-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $scope.$on('Keepalive', function() {
            if ($scope.isAuthenticated()) {
                IdleService.keepAlive();
            }
        });

        $rootScope.$on('event:execLogout', function () {
            $scope.execLogout();
        });

        function closeModals() {
            if ($rootScope.warning) {
                $rootScope.warning.close();
                $rootScope.warning = null;
            }

            if ($rootScope.timedout) {
                $rootScope.timedout.close();
                $rootScope.timedout = null;
            }
        };

        $rootScope.start = function () {
            closeModals();
            Idle.watch();
            $rootScope.started = true;
        };

        $rootScope.stop = function () {
            closeModals();
            Idle.unwatch();
            $rootScope.started = false;

        };


        $scope.checkForIE = function () {
            var BrowserDetect = {
                init: function () {
                    this.browser = this.searchString(this.dataBrowser) || 'An unknown browser';
                    this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
                    this.OS = this.searchString(this.dataOS) || 'an unknown OS';
                },
                searchString: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        var dataString = data[i].string;
                        var dataProp = data[i].prop;
                        this.versionSearchString = data[i].versionSearch || data[i].identity;
                        if (dataString) {
                            if (dataString.indexOf(data[i].subString) !== -1) {
                                return data[i].identity;
                            }
                        }
                        else if (dataProp) {
                            return data[i].identity;
                        }
                    }
                },
                searchVersion: function (dataString) {
                    var index = dataString.indexOf(this.versionSearchString);
                    if (index === -1) {
                        return;
                    }
                    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
                },
                dataBrowser: [
                    {
                        string: navigator.userAgent,
                        subString: 'Chrome',
                        identity: 'Chrome'
                    },
                    {   string: navigator.userAgent,
                        subString: 'OmniWeb',
                        versionSearch: 'OmniWeb/',
                        identity: 'OmniWeb'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Apple',
                        identity: 'Safari',
                        versionSearch: 'Version'
                    },
                    {
                        prop: window.opera,
                        identity: 'Opera',
                        versionSearch: 'Version'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'iCab',
                        identity: 'iCab'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'KDE',
                        identity: 'Konqueror'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Firefox',
                        identity: 'Firefox'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Camino',
                        identity: 'Camino'
                    },
                    {       // for newer Netscapes (6+)
                        string: navigator.userAgent,
                        subString: 'Netscape',
                        identity: 'Netscape'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'MSIE',
                        identity: 'Explorer',
                        versionSearch: 'MSIE'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Gecko',
                        identity: 'Mozilla',
                        versionSearch: 'rv'
                    },
                    {       // for older Netscapes (4-)
                        string: navigator.userAgent,
                        subString: 'Mozilla',
                        identity: 'Netscape',
                        versionSearch: 'Mozilla'
                    }
                ],
                dataOS: [
                    {
                        string: navigator.platform,
                        subString: 'Win',
                        identity: 'Windows'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Mac',
                        identity: 'Mac'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'iPhone',
                        identity: 'iPhone/iPod'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Linux',
                        identity: 'Linux'
                    }
                ]

            };
            BrowserDetect.init();

            if (BrowserDetect.browser === 'Explorer') {
                var title = 'You are using Internet Explorer';
                var msg = 'This site is not yet optimized with Internet Explorer. For the best user experience, please use Chrome, Firefox or Safari. Thank you for your patience.';
                var btns = [
                    {result: 'ok', label: 'OK', cssClass: 'btn'}
                ];

                //$dialog.messageBox(title, msg, btns).open();


            }
        };


        $rootScope.readonly = false;
        $rootScope.igdocument = null; // current igdocument
        $rootScope.message = null; // current message
        $rootScope.datatype = null; // current datatype

        $rootScope.pages = ['list', 'edit', 'read'];
        $rootScope.context = {page: $rootScope.pages[0]};
        $rootScope.messagesMap = {}; // Map for Message;key:id, value:object
        $rootScope.segmentsMap = {};  // Map for Segment;key:id, value:object
        $rootScope.datatypesMap = {}; // Map for Datatype; key:id, value:object
        $rootScope.tablesMap = {};// Map for tables; key:id, value:object
        $rootScope.segments = [];// list of segments of the selected messages
        $rootScope.datatypes = [];// list of datatypes of the selected messages
        $rootScope.segmentPredicates = [];// list of segment level predicates of the selected messages
        $rootScope.segmentConformanceStatements = [];// list of segment level Conformance Statements of the selected messages
        $rootScope.datatypePredicates = [];// list of segment level predicates of the selected messages
        $rootScope.datatypeConformanceStatements = [];// list of segment level Conformance Statements of the selected messages
        $rootScope.tables = [];// list of tables of the selected messages
        $rootScope.postfixCloneTable = 'CA';
        $rootScope.newCodeFakeId = 0;
        $rootScope.newTableFakeId = 0;
        $rootScope.newPredicateFakeId = 0;
        $rootScope.newConformanceStatementFakeId = 0;
        $rootScope.segment = null;
        $rootScope.config = null;
        $rootScope.messagesData = [];
        $rootScope.messages = [];// list of messages
        $rootScope.customIgs = [];
        $rootScope.preloadedIgs = [];
        $rootScope.changes = {};
        $rootScope.generalInfo = {type: null, 'message': null};
        $rootScope.references = []; // collection of element referencing a datatype to delete
        $rootScope.section = {};
        $rootScope.conformanceStatementIdList = [];
        $rootScope.parentsMap = {};
        $rootScope.igChanged = false;


        $rootScope.messageTree = null;

        $scope.scrollbarWidth = 0;


        // TODO: remove
        $rootScope.selectIGDocumentTab = function (value) {
//        $rootScope.igdocumentTabs[0] = false;
//        $rootScope.igdocumentTabs[1] = false;
//        $rootScope.igdocumentTabs[2] = false;
//        $rootScope.igdocumentTabs[3] = false;
//        $rootScope.igdocumentTabs[4] = false;
//        $rootScope.igdocumentTabs[5] = false;
//        $rootScope.igdocumentTabs[value] = true;
        };

        $scope.getScrollbarWidth = function () {
            if ($scope.scrollbarWidth == 0) {
                var outer = document.createElement("div");
                outer.style.visibility = "hidden";
                outer.style.width = "100px";
                outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

                document.body.appendChild(outer);

                var widthNoScroll = outer.offsetWidth;
                // force scrollbars
                outer.style.overflow = "scroll";

                // add innerdiv
                var inner = document.createElement("div");
                inner.style.width = "100%";
                outer.appendChild(inner);

                var widthWithScroll = inner.offsetWidth;

                // remove divs
                outer.parentNode.removeChild(outer);

                $scope.scrollbarWidth = widthNoScroll - widthWithScroll;
            }

            return $scope.scrollbarWidth;
        };
        $rootScope.initMaps = function () {
            $rootScope.segment = null;
            $rootScope.datatype = null;
            $rootScope.message = null;
            $rootScope.table = null;
            $rootScope.codeSystems = [];
            $rootScope.messagesMap = {};
            $rootScope.segmentsMap = {};
            $rootScope.datatypesMap = {};
            $rootScope.tablesMap = {};
            $rootScope.segments = [];
            $rootScope.tables = [];
            $rootScope.segmentPredicates = [];
            $rootScope.segmentConformanceStatements = [];
            $rootScope.datatypePredicates = [];
            $rootScope.datatypeConformanceStatements = [];
            $rootScope.datatypes = [];
            $rootScope.messages = [];
            $rootScope.messagesData = [];
            $rootScope.newCodeFakeId = 0;
            $rootScope.newTableFakeId = 0;
            $rootScope.newPredicateFakeId = 0;
            $rootScope.newConformanceStatementFakeId = 0;
            $rootScope.clearChanges();
            $rootScope.parentsMap = [];
            $rootScope.conformanceStatementIdList = [];

            $rootScope.messageTree = null;
        };

        $rootScope.$watch(function () {
            return $location.path();
        }, function (newLocation, oldLocation) {
            $rootScope.setActive(newLocation);
        });


        $rootScope.api = function (value) {
            return  value;
        };


        $rootScope.isActive = function (path) {
            return path === $rootScope.activePath;
        };

        $rootScope.setActive = function (path) {
            if (path === '' || path === '/') {
                $location.path('/home');
            } else {
                $rootScope.activePath = path;
            }
        };

        $rootScope.clearChanges = function (path) {
//        $rootScope.changes = {};
            $rootScope.igChanged = false;
        };

        $rootScope.hasChanges = function () {
            //return Object.getOwnPropertyNames($rootScope.changes).length !== 0;
            return $rootScope.igChanged;
        };

        $rootScope.findObjectInChanges = function (type, command, id) {
            if ($rootScope.changes[type] !== undefined && $rootScope.changes[type][command] !== undefined) {
                for (var i = 0; i < $rootScope.changes[type][command].length; i++) {
                    var tmp = $rootScope.changes[type][command][i];
                    if (tmp.id === id) {
                        return tmp;
                    }
                }
            }
            return undefined;
        };


        $rootScope.isNewObject = function (type, command, id) {
            if ($rootScope.changes[type] !== undefined && $rootScope.changes[type][command] !== undefined) {
                for (var i = 0; i < $rootScope.changes[type][command].length; i++) {
                    var tmp = $rootScope.changes[type][command][i];
                    if (tmp.id === id) {
                        return true;
                    }
                }
            }
            return false;
        };


        $rootScope.removeObjectFromChanges = function (type, command, id) {
            if ($rootScope.changes[type] !== undefined && $rootScope.changes[type][command] !== undefined) {
                for (var i = 0; i < $rootScope.changes[type][command].length; i++) {
                    var tmp = $rootScope.changes[type][command][i];
                    if (tmp.id === id) {
                        $rootScope.changes[type][command].splice(i, 1);
                    }
                }
            }
            return undefined;
        };


        Restangular.setBaseUrl('api/');
//    Restangular.setResponseExtractor(function(response, operation) {
//        return response.data;
//    });

        $rootScope.showError = function (error) {
            var modalInstance = $modal.open({
                templateUrl: 'ErrorDlgDetails.html',
                controller: 'ErrorDetailsCtrl',
                resolve: {
                    error: function () {
                        return error;
                    }
                }
            });
            modalInstance.result.then(function (error) {
                $rootScope.error = error;
            }, function () {
            });
        };


        $rootScope.apply = function (label) { //FIXME. weak check
            return label != undefined && label != null && (label.indexOf('_') !== -1 || label.indexOf('-') !== -1);
        };

        $rootScope.isFlavor = function (label) { //FIXME. weak check
            return label != undefined && label != null && (label.indexOf('_') !== -1 || label.indexOf('-') !== -1);
        };

        $rootScope.getDatatype = function (id) {
            return $rootScope.datatypesMap && $rootScope.datatypesMap[id];
        };

        $rootScope.calNextCSID = function () {
        	if($rootScope.igdocument.metaData.ext != null){
        		var maxIDNum = Number(0);
        		angular.forEach($rootScope.conformanceStatementIdList, function (id) {
        			var tempID = parseInt(id.replace($rootScope.igdocument.metaData.ext + "-", ""));
        			
        			if(tempID > maxIDNum) maxIDNum = tempID;
        		});
        		
        		return $rootScope.igdocument.metaData.ext + "-" + (maxIDNum + 1);
        	}else {
        		return "";
        	}
        }
        $rootScope.processElement = function (element, parent) {
            try {
                if(element != undefined && element != null) {
                    if (element.type === "message") {
                        element.children = $filter('orderBy')(element.children, 'position');
                        angular.forEach(element.conformanceStatements, function (cs) {
                        	if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
                        });
                        angular.forEach(element.children, function (segmentRefOrGroup) {
                            $rootScope.processElement(segmentRefOrGroup, element);
                        });
                    } else if (element.type === "group" && element.children) {
                        if (parent) {
                            $rootScope.parentsMap[element.id] = parent;
                        }
                        element.children = $filter('orderBy')(element.children, 'position');
                        angular.forEach(element.children, function (segmentRefOrGroup) {
                            $rootScope.processElement(segmentRefOrGroup, element);
                        });
                    } else if (element.type === "segmentRef") {
                        if (parent) {
                            $rootScope.parentsMap[element.id] = parent;
                        }
                        $rootScope.processElement($rootScope.segmentsMap[element.ref], element);
                    } else if (element.type === "segment") {
                        element.fields = $filter('orderBy')(element.fields, 'position');
                        angular.forEach(element.conformanceStatements, function (cs) {
                        	if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
                        });
                        angular.forEach(element.fields, function (field) {
                            $rootScope.processElement(field, element);
                        });
                    } else if (element.type === "field") {
                        $rootScope.parentsMap[element.id] = parent;
                        $rootScope.processElement($rootScope.datatypesMap[element.datatype], element);
                    } else if (element.type === "component") {
                        $rootScope.parentsMap[element.id] = parent;
                        $rootScope.processElement($rootScope.datatypesMap[element.datatype], element);
                    } else if (element.type === "datatype") {
                        element.components = $filter('orderBy')(element.components, 'position');
                        angular.forEach(element.conformanceStatements, function (cs) {
                        	if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
                        });
                        angular.forEach(element.components, function (component) {
                            $rootScope.processElement(component, element);
                        });
                    }
                }
            } catch (e) {
                throw e;
            }
        };


        $rootScope.processMessageTree = function (element, parent) {

            try {
                if(element != undefined && element != null) {
                    if (element.type === "message") {
                        var m = new Object();
                        m.children = [];
                        $rootScope.messageTree = m;

                        element.children = $filter('orderBy')(element.children, 'position');
                        angular.forEach(element.children, function (segmentRefOrGroup) {
                            $rootScope.processMessageTree(segmentRefOrGroup, m);
                        });

                    } else if (element.type === "group" && element.children) {
                        var g = new Object();
                        g.path = element.position + "[1]";
                        g.obj = element;
                        g.children = [];
                        if (parent.path) {
                            g.path = parent.path + "." + element.position + "[1]";
                        }
                        parent.children.push(g);
                        element.children = $filter('orderBy')(element.children, 'position');
                        angular.forEach(element.children, function (segmentRefOrGroup) {
                            $rootScope.processMessageTree(segmentRefOrGroup, g);
                        });
                    } else if (element.type === "segmentRef") {
                        var s = new Object();
                        s.path = element.position + "[1]";
                        s.obj = element;
                        s.children = [];
                        if (parent.path) {
                            s.path = parent.path + "." + element.position + "[1]";
                        }
                        parent.children.push(s);

                        var ref = $rootScope.segmentsMap[element.ref];
                        $rootScope.processMessageTree(ref, s);

                    } else if (element.type === "segment") {
                        element.fields = $filter('orderBy')(element.fields, 'position');
                        angular.forEach(element.fields, function (field) {
                            $rootScope.processMessageTree(field, parent);
                        });
                    } else if (element.type === "field") {
                        var f = new Object();
                        f.obj = element;
                        f.path = parent.path + "." + element.position + "[1]";
                        f.children = [];
                        parent.children.push(f);
                        $rootScope.processMessageTree($rootScope.datatypesMap[element.datatype], f);
                    } else if (element.type === "component") {
                        var c = new Object();
                        c.obj = element;
                        c.path = parent.path + "." + element.position + "[1]";
                        c.children = [];
                        parent.children.push(c);
                        $rootScope.processMessageTree($rootScope.datatypesMap[element.datatype], c);
                    } else if (element.type === "datatype") {
                        element.components = $filter('orderBy')(element.components, 'position');
                        angular.forEach(element.components, function (component) {
                            $rootScope.processMessageTree(component, parent);
                        });
                    }
                }
            } catch (e) {
                throw e;
            }
        };

        $rootScope.createNewFlavorName = function (label) {
            if ($rootScope.igdocument != null) {
            	if($rootScope.igdocument.metaData["ext"] === null){
            		return label + "_" + (Math.floor(Math.random() * 10000000) + 1);
            	}else {
            		return label + "_" + $rootScope.igdocument.metaData["ext"] + "_" + (Math.floor(Math.random() * 10000000) + 1);
            	}
            } else {
                return null;
            }
        };


        $rootScope.isSubComponent = function (node) {
            node.type === 'component' && $rootScope.parentsMap[node.id] && $rootScope.parentsMap[node.id].type === 'component';
        };

        $rootScope.findDatatypeRefs = function (datatype, obj) {
            if (angular.equals(obj.type, 'field') || angular.equals(obj.type, 'component')) {
                if ($rootScope.datatypesMap[obj.datatype] === datatype && $rootScope.references.indexOf(obj) === -1) {
                    $rootScope.references.push(obj);
                }
                $rootScope.findDatatypeRefs(datatype, $rootScope.datatypesMap[obj.datatype]);
            } else if (angular.equals(obj.type, 'segment')) {
                angular.forEach($rootScope.segments, function (segment) {
                    angular.forEach(segment.fields, function (field) {
                        $rootScope.findDatatypeRefs(datatype, field);
                    });
                });
            } else if (angular.equals(obj.type, 'datatype')) {
                if (obj.components != undefined && obj.components != null && obj.components.length > 0) {
                    angular.forEach(obj.components, function (component) {
                        $rootScope.findDatatypeRefs(datatype, component);
                    });
                }
            }
        };

        $rootScope.findTableRefs = function (table, obj) {
            if (angular.equals(obj.type, 'field') || angular.equals(obj.type, 'component')) {
                if (obj.table != undefined) {
                    if (obj.table === table.id && $rootScope.references.indexOf(obj) === -1) {
                        $rootScope.references.push(obj);
                    }
                }
                $rootScope.findTableRefs(table, $rootScope.datatypesMap[obj.datatype]);
            } else if (angular.equals(obj.type, 'segment')) {
                angular.forEach($rootScope.segments, function (segment) {
                    angular.forEach(segment.fields, function (field) {
                        $rootScope.findTableRefs(table, field);
                    });
                });
            } else if (angular.equals(obj.type, 'datatype')) {
                if (obj.components != undefined && obj.components != null && obj.components.length > 0) {
                    angular.forEach(obj.components, function (component) {
                        $rootScope.findTableRefs(table, component);
                    });
                }
            }
        };

        $rootScope.genRegex = function (format) {
            if (format === 'YYYY') {
                return '(([0-9]{4})|(([0-9]{4})((0[1-9])|(1[0-2])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMM') {
                return '((([0-9]{4})((0[1-9])|(1[0-2])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMMDD') {
                return '((([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMMDDhh') {
                return '((([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMMDDhhmm') {
                return '((([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMMDDhhmmss') {
                return '((([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]))|(([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYYMMDDhhmmss.sss') {
                return '((([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]))';
            } else if (format === 'YYYY+-ZZZZ') {
                return '([0-9]{4}).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMM+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2])).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMMDD+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1])).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMMDDhh+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMMDDhhmm+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9]).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMMDDhhmmss+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9]).*((\\+|\\-)[0-9]{4})';
            } else if (format === 'YYYYMMDDhhmmss.sss+-ZZZZ') {
                return '([0-9]{4})((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3]))([0-5][0-9])([0-5][0-9])\\.[0-9][0-9][0-9][0-9]((\\+|\\-)[0-9]{4})';
            } else if (format === 'ISO-compliant OID') {
                return '[0-2](\\.(0|[1-9][0-9]*))*';
            } else if (format === 'Alphanumeric') {
                return '^[a-zA-Z0-9]*$';
            }

            return format;
        };

        $rootScope.isAvailableDTForTable = function (dt) {
            if (dt != undefined) {
                if (dt.name === 'IS' || dt.name === 'ID' || dt.name === 'CWE' || dt.name === 'CNE' || dt.name === 'CE') return true;

                if (dt.components != undefined && dt.components.length > 0) return true;

            }
            return false;
        };

        $rootScope.validateNumber = function (event) {
            var key = window.event ? event.keyCode : event.which;
            if (event.keyCode == 8 || event.keyCode == 46
                || event.keyCode == 37 || event.keyCode == 39) {
                return true;
            }
            else if (key < 48 || key > 57) {
                return false;
            }
            else return true;
        };

        $rootScope.generateCompositeConformanceStatement = function (compositeType, firstConstraint, secondConstraint) {
        	var firstConstraintAssertion = firstConstraint.assertion.replace("<Assertion>", "");
        	firstConstraintAssertion = firstConstraintAssertion.replace("</Assertion>", "");
        	var secondConstraintAssertion = secondConstraint.assertion.replace("<Assertion>", "");
        	secondConstraintAssertion = secondConstraintAssertion.replace("</Assertion>", "");
        	
            var cs = null;
            if (compositeType === 'AND') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'AND(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: '[' + firstConstraint.description + '] ' + 'AND' + ' [' + secondConstraint.description + ']',
                    assertion: '<Assertion><AND>' + firstConstraintAssertion + secondConstraintAssertion + '</AND></Assertion>'
                };
            } else if (compositeType === 'OR') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'OR(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: '[' + firstConstraint.description + '] ' + 'OR' + ' [' + secondConstraint.description + ']',
                    assertion: '<Assertion><OR>' + firstConstraintAssertion + secondConstraintAssertion + '</OR></Assertion>'
                };
            } else if (compositeType === 'IFTHEN') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'IFTHEN(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: 'IF [' + firstConstraint.description + '] ' + 'THEN ' + ' [' + secondConstraint.description + ']',
                    assertion: '<Assertion><IMPLY>' + firstConstraintAssertion + secondConstraintAssertion + '</IMPLY></Assertion>'
                };
            }
            return cs;
        }


        $rootScope.generateCompositePredicate = function (compositeType, firstConstraint, secondConstraint) {
        	var firstConstraintAssertion = firstConstraint.assertion.replace("<Condition>", "");
        	firstConstraintAssertion = firstConstraintAssertion.replace("</Condition>", "");
        	var secondConstraintAssertion = secondConstraint.assertion.replace("<Condition>", "");
        	secondConstraintAssertion = secondConstraintAssertion.replace("</Condition>", "");
        	
            var cp = null;
            if (compositeType === 'AND') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'AND(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: '[' + firstConstraint.description + '] ' + 'AND' + ' [' + secondConstraint.description + ']',
                    trueUsage: '',
                    falseUsage: '',
                    assertion: '<Condition><AND>' + firstConstraintAssertion + secondConstraintAssertion + '</AND></Condition>'
                };
            } else if (compositeType === 'OR') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'OR(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: '[' + firstConstraint.description + '] ' + 'OR' + ' [' + secondConstraint.description + ']',
                    trueUsage: '',
                    falseUsage: '',
                    assertion: '<Condition><OR>' + firstConstraintAssertion + secondConstraintAssertion + '</OR></Condition>'
                };
            } else if (compositeType === 'IFTHEN') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'IFTHEN(' + firstConstraint.constraintId + ',' + secondConstraint.constraintId + ')',
                    constraintTarget: firstConstraint.constraintTarget,
                    description: 'IF [' + firstConstraint.description + '] ' + 'THEN ' + ' [' + secondConstraint.description + ']',
                    trueUsage: '',
                    falseUsage: '',
                    assertion: '<Condition><IMPLY>' + firstConstraintAssertion + secondConstraintAssertion + '</IMPLY></Condition>'
                };
            }
            return cp;
        }

        $rootScope.generateConformanceStatement = function (positionPath, newConstraint) {
            var cs = null;
            if (newConstraint.contraintType === 'valued') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType + '.',
                    assertion: '<Assertion><Presence Path=\"' + newConstraint.position_1 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'a literal value') {
            	if(newConstraint.value.indexOf("^") == -1){
            		cs = {
                            id: new ObjectId().toString(),
                            constraintId: newConstraint.constraintId,
                            constraintTarget: positionPath,
                            description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' \'' + newConstraint.value + '\'.',
                            assertion: '<Assertion><PlainText Path=\"' + newConstraint.position_1 + '\" Text=\"' + newConstraint.value + '\" IgnoreCase="false"/></Assertion>'
                        };
            	}else {
            		
            		var componetsList = newConstraint.value.split("^");
            		var assertionScript = "";
            		var componentPosition = 0;
            		
            		angular.forEach(componetsList, function(componentValue){
            			componentPosition = componentPosition + 1;
            			var script = '<PlainText Path=\"' + newConstraint.position_1 + "." + componentPosition + "[1]" + '\" Text=\"' + componentValue + '\" IgnoreCase="false"/>';
            			if(assertionScript === ""){
            				assertionScript = script;
            			}else {
            				assertionScript = "<AND>" + assertionScript + script + "</AND>";				
            			}
            		});
            		
            		
            		
            		cs = {
                            id: new ObjectId().toString(),
                            constraintId: newConstraint.constraintId,
                            constraintTarget: positionPath,
                            description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' \'' + newConstraint.value + '\'.',
                            assertion: '<Assertion>' + assertionScript + '</Assertion>'
                    };
            	}
            } else if (newConstraint.contraintType === 'one of list values') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType + ': ' + newConstraint.value + '.',
                    assertion: '<Assertion><StringList Path=\"' + newConstraint.position_1 + '\" CSV=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'one of codes in ValueSet') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType + ': ' + newConstraint.valueSetId + '.',
                    assertion: '<Assertion><ValueSet Path=\"' + newConstraint.position_1 + '\" ValueSetID=\"' + newConstraint.valueSetId + '\" BindingStrength=\"' + newConstraint.bindingStrength + '\" BindingLocation=\"' + newConstraint.bindingLocation + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'formatted value') {
            	if(newConstraint.value === 'Regular expression'){
            		cs = {
                            id: new ObjectId().toString(),
                            constraintId: newConstraint.constraintId,
                            constraintTarget: positionPath,
                            description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' valid in format: \'' + newConstraint.value2 + '\'.',
                            assertion: '<Assertion><Format Path=\"' + newConstraint.position_1 + '\" Regex=\"' + newConstraint.value2 + '\"/></Assertion>'
            		};
            	}else {
            		cs = {
                            id: new ObjectId().toString(),
                            constraintId: newConstraint.constraintId,
                            constraintTarget: positionPath,
                            description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' valid in format: \'' + newConstraint.value + '\'.',
                            assertion: '<Assertion><Format Path=\"' + newConstraint.position_1 + '\" Regex=\"' + $rootScope.genRegex(newConstraint.value) + '\"/></Assertion>'
                    };
            	}
            } else if (newConstraint.contraintType === 'identical to another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' identical to the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="EQ" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="EQ" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'not-equal to another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' different with the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="NE" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'greater than another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' greater than the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="GT" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to or greater than another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or greater than the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="GE" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'less than another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' less than the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="LT" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to or less than another node') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or less than the value of ' + newConstraint.location_2 + '.',
                    assertion: '<Assertion><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="LE" Path2=\"' + newConstraint.position_2 + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="EQ" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'not-equal to') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' different with ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="NE" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'greater than') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' greater than ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="GT" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to or greater than') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or greater than ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="GE" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'less than') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' less than ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="LT" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === 'equal to or less than') {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or less than ' + newConstraint.value + '.',
                    assertion: '<Assertion><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="LE" Value=\"' + newConstraint.value + '\"/></Assertion>'
                };
            } else if (newConstraint.contraintType === "valued sequentially starting with the value '1'") {
                cs = {
                    id: new ObjectId().toString(),
                    constraintId: newConstraint.constraintId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + " valued sequentially starting with the value '1'.",
                    assertion: '<Assertion><SetID Path=\"' + newConstraint.position_1 + '\"/></Assertion>'
                };
            }

            return cs;
        }

        $rootScope.generatePredicate = function (positionPath, newConstraint) {
            var cp = null;
            if (newConstraint.contraintType === 'valued') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType,
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><Presence Path=\"' + newConstraint.position_1 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'a literal value') {
                if(newConstraint.value.indexOf("^") == -1){
                	cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                            constraintTarget: positionPath,
                            description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' \'' + newConstraint.value + '\'.',
                            trueUsage: newConstraint.trueUsage,
                            falseUsage: newConstraint.falseUsage,
                            assertion: '<Condition><PlainText Path=\"' + newConstraint.position_1 + '\" Text=\"' + newConstraint.value + '\" IgnoreCase="false"/></Condition>'
                    };
            	}else {
            		var componetsList = newConstraint.value.split("^");
            		var assertionScript = "";
            		var componentPosition = 0;
            		
            		angular.forEach(componetsList, function(componentValue){
            			componentPosition = componentPosition + 1;
            			var script = '<PlainText Path=\"' + newConstraint.position_1 + "." + componentPosition + "[1]" + '\" Text=\"' + componentValue + '\" IgnoreCase="false"/>';
            			if(assertionScript === ""){
            				assertionScript = script;
            			}else {
            				assertionScript = "<AND>" + assertionScript + script + "</AND>";				
            			}
            		});
            		cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                            constraintTarget: positionPath,
                            description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' \'' + newConstraint.value + '\'.',
                            trueUsage: newConstraint.trueUsage,
                            falseUsage: newConstraint.falseUsage,
                            assertion: '<Condition>' + assertionScript + '</Condition>'
                    };
            	}
            } else if (newConstraint.contraintType === 'one of list values') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType + ': ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><StringList Path=\"' + newConstraint.position_1 + '\" CSV=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'one of codes in ValueSet') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' ' + newConstraint.contraintType + ': ' + newConstraint.valueSetId + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><ValueSet Path=\"' + newConstraint.position_1 + '\" ValueSetID=\"' + newConstraint.valueSetId + '\" BindingStrength=\"' + newConstraint.bindingStrength + '\" BindingLocation=\"' + newConstraint.bindingLocation + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'formatted value') {
            	if(newConstraint.value === 'Regular expression'){
            		cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                            constraintTarget: positionPath,
                            description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' valid in format: \'' + newConstraint.value2 + '\'.',
                            trueUsage: newConstraint.trueUsage,
                            falseUsage: newConstraint.falseUsage,
                            assertion: '<Condition><Format Path=\"' + newConstraint.position_1 + '\" Regex=\"' + newConstraint.value2 + '\"/></Condition>'
                        };
            	}else{
            		cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                            constraintTarget: positionPath,
                            description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' valid in format: \'' + newConstraint.value + '\'.',
                            trueUsage: newConstraint.trueUsage,
                            falseUsage: newConstraint.falseUsage,
                            assertion: '<Condition><Format Path=\"' + newConstraint.position_1 + '\" Regex=\"' + $rootScope.genRegex(newConstraint.value) + '\"/></Condition>'
                        };
            	}
            } else if (newConstraint.contraintType === 'identical to another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'The value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' identical to the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="EQ" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="EQ" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'not-equal to another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' different with the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="NE" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'greater than another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' greater than the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="GT" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to or greater than another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or greater than the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="GE" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'less than another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' less than the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="LT" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to or less than another node') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or less than the value of ' + newConstraint.location_2 + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><PathValue Path1=\"' + newConstraint.position_1 + '\" Operator="LE" Path2=\"' + newConstraint.position_2 + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="EQ" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'not-equal to') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' different with ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="NE" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'greater than') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' greater than ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="GT" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to or greater than') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or greater than ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="GE" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'less than') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' less than ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="LT" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === 'equal to or less than') {
                cp = {
                    id: new ObjectId().toString(),
                    constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                    constraintTarget: positionPath,
                    description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + ' equal to or less than ' + newConstraint.value + '.',
                    trueUsage: newConstraint.trueUsage,
                    falseUsage: newConstraint.falseUsage,
                    assertion: '<Condition><SimpleValue Path=\"' + newConstraint.position_1 + '\" Operator="LE" Value=\"' + newConstraint.value + '\"/></Condition>'
                };
            } else if (newConstraint.contraintType === "valued sequentially starting with the value '1'") {
                cp = {
                        id: new ObjectId().toString(),
                        constraintId: 'CP_' + positionPath + '_' + $rootScope.newPredicateFakeId,
                        constraintTarget: positionPath,
                        description: 'If the value of ' + newConstraint.location_1 + ' ' + newConstraint.verb + " valued sequentially starting with the value '1'.",
                        trueUsage: newConstraint.trueUsage,
                        falseUsage: newConstraint.falseUsage,
                        assertion: '<Condition><SetID Path=\"' + newConstraint.position_1 + '\"/></Condition>'
                };
            }

            return cp;
        };
        
        
        $rootScope.erorrForComplexConfStatement = function (newComplexConstraintId, targetComplexId, compositeType, firstConstraint, secondConstraint) {
        	if($rootScope.isEmptyComplexConstraintID(newComplexConstraintId)) return true;
        	if($rootScope.isDuplicatedComplexConstraintID(newComplexConstraintId, targetComplexId))  return true;
        	if($rootScope.isEmptyCompositeType(compositeType))  return true;
        	if(firstConstraint == null) return true;
        	if(secondConstraint == null) return true;
        	 return false;
        };
        
        $rootScope.erorrForComplexPredicate = function (compositeType, firstConstraint, secondConstraint, complexConstraintTrueUsage, complexConstraintFalseUsage) {
        	if($rootScope.isEmptyCompositeType(compositeType)) return true;
        	if(firstConstraint == null) return true;
        	if(secondConstraint == null) return true;
        	if(complexConstraintTrueUsage == null) return true;
        	if(complexConstraintFalseUsage == null) return true;
        	return false;
        };
        
        $rootScope.erorrForPredicate = function (newConstraint, type) {
        	if($rootScope.isEmptyConstraintNode(newConstraint, type)) return true;
        	if($rootScope.isEmptyConstraintVerb(newConstraint)) return true;
        	if($rootScope.isEmptyConstraintPattern(newConstraint)) return true;
        	if(newConstraint.contraintType == 'a literal value' || 
			   newConstraint.contraintType == 'equal to' ||
			   newConstraint.contraintType == 'not-equal to' ||
			   newConstraint.contraintType == 'greater than' ||
			   newConstraint.contraintType == 'equal to or greater than' ||
			   newConstraint.contraintType == 'less than' ||
			   newConstraint.contraintType == 'equal to or less than' ||
			   newConstraint.contraintType == 'one of list values' ||
			   newConstraint.contraintType == 'formatted value'){
        		if($rootScope.isEmptyConstraintValue(newConstraint)) return true;
        		if(newConstraint.value == 'Regular expression'){
        			if($rootScope.isEmptyConstraintValue2(newConstraint)) return true;
        		}
        	}else if(newConstraint.contraintType == 'identical to another node' ||
			   newConstraint.contraintType == 'equal to another node' ||
			   newConstraint.contraintType == 'not-equal to another node' ||
			   newConstraint.contraintType == 'greater than another node' ||
			   newConstraint.contraintType == 'equal to or greater than another node' ||
			   newConstraint.contraintType == 'less than another node' ||
			   newConstraint.contraintType == 'equal to or less than another node'){
        		if($rootScope.isEmptyConstraintAnotherNode(newConstraint)) return true;
        	}else if(newConstraint.contraintType == 'one of codes in ValueSet'){
        		if($rootScope.isEmptyConstraintValueSet(newConstraint, type)) return true;
        	}
        	if(newConstraint.trueUsage == null) return true;
        	if(newConstraint.falseUsage == null) return true;
        	
        	return false;
        }
        
        
        $rootScope.erorrForConfStatement = function (newConstraint, targetId, type) {
        	if($rootScope.isEmptyConstraintID(newConstraint)) return true;
        	if($rootScope.isDuplicatedConstraintID(newConstraint, targetId)) return true;
        	if($rootScope.isEmptyConstraintNode(newConstraint, type)) return true;
        	if($rootScope.isEmptyConstraintVerb(newConstraint)) return true;
        	if($rootScope.isEmptyConstraintPattern(newConstraint)) return true;
        	if(newConstraint.contraintType == 'a literal value' || 
			   newConstraint.contraintType == 'equal to' ||
			   newConstraint.contraintType == 'not-equal to' ||
			   newConstraint.contraintType == 'greater than' ||
			   newConstraint.contraintType == 'equal to or greater than' ||
			   newConstraint.contraintType == 'less than' ||
			   newConstraint.contraintType == 'equal to or less than' ||
			   newConstraint.contraintType == 'one of list values' ||
			   newConstraint.contraintType == 'formatted value'){
        		if($rootScope.isEmptyConstraintValue(newConstraint)) return true;
        		if(newConstraint.value == 'Regular expression'){
        			if($rootScope.isEmptyConstraintValue2(newConstraint)) return true;
        		}
        	}else if(newConstraint.contraintType == 'identical to another node' ||
			   newConstraint.contraintType == 'equal to another node' ||
			   newConstraint.contraintType == 'not-equal to another node' ||
			   newConstraint.contraintType == 'greater than another node' ||
			   newConstraint.contraintType == 'equal to or greater than another node' ||
			   newConstraint.contraintType == 'less than another node' ||
			   newConstraint.contraintType == 'equal to or less than another node'){
        		if($rootScope.isEmptyConstraintAnotherNode(newConstraint)) return true;
        	}else if(newConstraint.contraintType == 'one of codes in ValueSet'){
        		if($rootScope.isEmptyConstraintValueSet(newConstraint, type)) return true;
        	}
        	return false;
        };
        
        $rootScope.isEmptyConstraintID = function (newConstraint) {
        	if(newConstraint.constraintId === null) return true;
        	if(newConstraint.constraintId === '') return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyComplexConstraintID = function (id) {
        	if(id === null) return true;
        	if(id === '') return true;
        	
        	return false;
        }
        
        $rootScope.isDuplicatedConstraintID = function (newConstraint, targetId) {
        	if($rootScope.conformanceStatementIdList.indexOf(newConstraint.constraintId) != -1 && targetId == newConstraint.constraintId) return true;
        	
        	return false;
        }
        
        $rootScope.isDuplicatedComplexConstraintID = function (newComplexConstraintId, targetComplexId) {
        	if($rootScope.conformanceStatementIdList.indexOf(newComplexConstraintId) != -1 && targetComplexId == newComplexConstraintId) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintNode = function (newConstraint, type) {
        	if(type == 'datatype'){
        		if(newConstraint.component_1 === null) return true;
        	}else if(type == 'segment'){
        		if(newConstraint.field_1 === null) return true;
        	}else if(type == 'message'){
        		if(newConstraint.position_1 === null) return true;
        	}
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintVerb = function (newConstraint) {
        	if(newConstraint.verb === null) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintPattern = function (newConstraint) {
        	if(newConstraint.contraintType === null) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintValue = function (newConstraint) {
        	if(newConstraint.value === null) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintValue2 = function (newConstraint) {
        	if(newConstraint.value2 === null) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyConstraintAnotherNode = function (newConstraint, type) {
        	if(type == 'datatype'){
        		if(newConstraint.component_2 === null) return true;
        	}else if(type == 'segment'){
        		if(newConstraint.field_2 === null) return true;
        	}else if(type == 'message'){
        		if(newConstraint.position_2 === null) return true;
        	}

        	return false;
        }
        
        $rootScope.isEmptyConstraintValueSet = function (newConstraint) {
        	if(newConstraint.valueSetId === null) return true;
        	
        	return false;
        }
        
        $rootScope.isEmptyCompositeType = function (compositeType) {
        	if(compositeType === null) return true;
        	
        	return false;
        }
        
        

        //We check for IE when the user load the main page.
        //TODO: Check only once.
//    $scope.checkForIE();


        $rootScope.openRichTextDlg = function (obj, key, title, disabled) {
            var modalInstance = $modal.open({
                templateUrl: 'RichTextCtrl.html',
                controller: 'RichTextCtrl',
                windowClass: 'app-modal-window',
                backdrop: true,
                keyboard: true,
                backdropClick: false,
                resolve: {
                    editorTarget: function () {
                        return {
                            key: key,
                            obj: obj,
                            disabled: disabled,
                            title: title
                        };
                    }
                }
            });
        };

        $rootScope.openInputTextDlg = function (obj, key, title, disabled) {
            var modalInstance = $modal.open({
                templateUrl: 'InputTextCtrl.html',
                controller: 'InputTextCtrl',
                backdrop: true,
                keyboard: true,
                windowClass: 'app-modal-window',
                backdropClick: false,
                resolve: {
                    editorTarget: function () {
                        return {
                            key: key,
                            obj: obj,
                            disabled: disabled,
                            title: title
                        };
                    }
                }
            });
        };


        $rootScope.isDuplicated = function (obj, context, list) {
            if (obj == null || obj == undefined) return false;

            return _.find(_.without(list, obj), function (item) {
                return item[context] == obj[context];
            });
        };
        
        $rootScope.isDuplicatedTwoContexts = function (obj, context1, context2,  list) {
            if (obj == null || obj == undefined) return false;

            return _.find(_.without(list, obj), function (item) {
            	if(item[context1] == obj[context1]){
            		return item[context2] == obj[context2];
            	}else {
            		return false
            	}
            });
        };

        $scope.init = function () {
//        $http.get('api/igdocuments/config', {timeout: 60000}).then(function (response) {
//            $rootScope.config = angular.fromJson(response.data);
//        }, function (error) {
//        });
        };

        $scope.getFullName = function () {
            if (userInfoService.isAuthenticated() === true) {
                return userInfoService.getFullName();
            }
            return '';
        };

    }]);

angular.module('tcl').controller('LoginCtrl', ['$scope', '$modalInstance', 'user', function ($scope, $modalInstance, user) {
    $scope.user = user;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.login = function () {
//        console.log("logging in...");
        $modalInstance.close($scope.user);
    };
}]);


angular.module('tcl').controller('RichTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);


angular.module('tcl').controller('InputTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);

angular.module('tcl').controller('ConfirmLogoutCtrl', ["$scope", "$modalInstance", "$rootScope", "$http", function ($scope, $modalInstance, $rootScope, $http) {
    $scope.logout = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);



/**
 * Created by haffo on 2/17/16.
 */



angular.module('tcl')
    .controller('MasterDatatypeLibraryCtrl', ["$scope", "$rootScope", "Restangular", "$http", "$filter", "$modal", "$cookies", "$timeout", "userInfoService", "ToCSvc", "ContextMenuSvc", "ProfileAccessSvc", "ngTreetableParams", "$interval", "ViewSettings", "StorageService", function ($scope, $rootScope, Restangular, $http, $filter, $modal, $cookies, $timeout, userInfoService, ToCSvc, ContextMenuSvc, ProfileAccessSvc, ngTreetableParams, $interval, ViewSettings, StorageService) {
        $scope.loading = false;

        $scope.initMasterLibrary = function() {

        };


    }]);
/**
 * Created by haffo on 2/13/15.
 */

angular.module('tcl')
    .controller('MessageListCtrl', ["$scope", "$rootScope", "Restangular", "ngTreetableParams", "$filter", "$http", "$modal", "$timeout", "CloneDeleteSvc", function ($scope, $rootScope, Restangular, ngTreetableParams, $filter, $http, $modal, $timeout, CloneDeleteSvc) {

    	$scope.init = function () {
        };
        
        $scope.copy = function(message) {
        		CloneDeleteSvc.copyMessage(message);
    			$rootScope.$broadcast('event:SetToC');
        }
        
        $scope.close = function () {
            $rootScope.message = null;
            if ($scope.messagesParams)
                $scope.messagesParams.refresh();
        };

        $scope.delete = function(message) {
    			CloneDeleteSvc.deleteMessage(message);
			$rootScope.$broadcast('event:SetToC');
         }
        
        $scope.goToSegment = function (segmentId) {
            $scope.$emit('event:openSegment', $rootScope.segmentsMap[segmentId]);
        };
        
        $scope.goToDatatype = function (datatype) {
            $scope.$emit('event:openDatatype', datatype);
        };
        
        $scope.goToTable = function (table) {
            $scope.$emit('event:openTable', table);
        };

        $scope.hasChildren = function (node) {
          if(node && node != null){
          	if(node.type === 'group'){
          		return node.children && node.children.length > 0;
          	}else if(node.type === 'segmentRef'){
          		return $rootScope.segmentsMap[node.ref].fields && $rootScope.segmentsMap[node.ref].fields.length > 0;
          	}else if(node.type === 'field' || node.type === 'component'){
          		return $rootScope.datatypesMap[node.datatype].components && $rootScope.datatypesMap[node.datatype].components.length > 0;
          	}
          	return false;
          }else {
          	return false;
          }
          
        };
        
        $scope.isSub = function (component) {
            return $scope.isSubDT(component);
        };

        $scope.isSubDT = function (component) {
            return component.type === 'component' && $rootScope.parentsMap && $rootScope.parentsMap[component.id] && $rootScope.parentsMap[component.id].type === 'component';
        };

        $scope.manageConformanceStatement = function (node, message) {
            var modalInstance = $modal.open({
                templateUrl: 'ConformanceStatementMessageCtrl.html',
                controller: 'ConformanceStatementMessageCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedMessage: function () {
                        return message;
                    },
            		selectedNode: function () {
            			return node;
            		}
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.managePredicate = function (node, message) {
            var modalInstance = $modal.open({
                templateUrl: 'PredicateMessageCtrl.html',
                controller: 'PredicateMessageCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                	selectedMessage: function () {
                        return message;
                    },
            		selectedNode: function () {
            			return node;
            		}
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };
        
        $scope.countPredicate = function (position) {
            if ($rootScope.message != null) {
                for (var i = 0, len1 = $rootScope.message.predicates.length; i < len1; i++) {
                    if ($rootScope.message.predicates[i].constraintTarget.indexOf(position) === 0)
                        return 1;
                }
            }
            return 0;
        };
    }]);


angular.module('tcl')
    .controller('MessageRowCtrl', ["$scope", "$filter", function ($scope, $filter) {
        $scope.formName = "form_" + new Date().getTime();
    }]);


angular.module('tcl')
    .controller('MessageViewCtrl', ["$scope", "$rootScope", "Restangular", function ($scope, $rootScope, Restangular) {
        $scope.loading = false;
        $scope.msg = null;
        $scope.messageData = [];
        $scope.setData = function (node) {
            if (node) {
                if (node.type === 'message') {
                    angular.forEach(node.children, function (segmentRefOrGroup) {
                        $scope.setData(segmentRefOrGroup);
                    });
                } else if (node.type === 'group') {
                    $scope.messageData.push({ name: "-- " + node.name + " begin"});
                    if (node.children) {
                        angular.forEach(node.children, function (segmentRefOrGroup) {
                            $scope.setData(segmentRefOrGroup);
                        });
                    }
                    $scope.messageData.push({ name: "-- " + node.name + " end"});
                } else if (node.type === 'segment') {
                    $scope.messageData.push + (node);
                }
            }
        };


        $scope.init = function (message) {
            $scope.loading = true;
            $scope.msg = message;
            console.log(message.id);
            $scope.setData($scope.msg);
            $scope.loading = false;
        };

//        $scope.hasChildren = function (node) {
//            return node && node != null && node.type !== 'segment' && node.children && node.children.length > 0;
//        };

    }]);

angular.module('tcl').controller('PredicateMessageCtrl', ["$scope", "$modalInstance", "selectedNode", "selectedMessage", "$rootScope", function ($scope, $modalInstance, selectedNode, selectedMessage, $rootScope) {
	$scope.constraintType = 'Plain';
    $scope.selectedNode = selectedNode;
    $scope.selectedMessage = selectedMessage;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.complexConstraintTrueUsage = null;
    $scope.complexConstraintFalseUsage = null;
    
    $scope.changed = false;
    $scope.tempPredicates = [];
    angular.copy($scope.selectedMessage.predicates, $scope.tempPredicates);
    
    $scope.setChanged = function () {
    	$scope.changed = true;
    }
       
    $scope.initPredicate = function(){
    	$scope.newConstraint = angular.fromJson({
            position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            currentNode_1: null,
            currentNode_2: null,
            childNodes_1: [],
            childNodes_2: [],
            verb: null,
            contraintType: null,
            value: null,
            value2: null,
            trueUsage: null,
            falseUsage: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });

        for (var i = 0, len1 = $scope.selectedMessage.children.length; i < len1; i++) {
            if ($scope.selectedMessage.children[i].type === 'group') {
                var groupModel = {
                    name: $scope.selectedMessage.children[i].name,
                    position: $scope.selectedMessage.children[i].position,
                    type: 'group',
                    node: $scope.selectedMessage.children[i]
                };
                $scope.newConstraint.childNodes_1.push(groupModel);
                $scope.newConstraint.childNodes_2.push(groupModel);
            } else if ($scope.selectedMessage.children[i].type === 'segmentRef') {
                var segmentModel = {
                    name: $rootScope.segmentsMap[$scope.selectedMessage.children[i].ref].name,
                    position: $scope.selectedMessage.children[i].position,
                    type: 'segment',
                    node: $rootScope.segmentsMap[$scope.selectedMessage.children[i].ref]
                };
                $scope.newConstraint.childNodes_1.push(segmentModel);
                $scope.newConstraint.childNodes_2.push(segmentModel);
            }
        }
    }
    
    $scope.initComplexPredicate = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.complexConstraintTrueUsage = null;
        $scope.complexConstraintFalseUsage = null;
    }

    $scope.deletePredicate = function (predicate) {
        $scope.tempPredicates.splice($scope.tempPredicates.indexOf(predicate), 1);
        $scope.changed = true;
    };
    
    
    $scope.deletePredicateByTarget = function () {
        for (var i = 0, len1 = $scope.tempPredicates.length; i < len1; i++) {
            if ($scope.tempPredicates[i].constraintTarget === $scope.selectedNode.path) {
                $scope.deletePredicate($scope.tempPredicates[i]);
                return true;
            }
        }
        return false;
    };

    $scope.updateLocation1 = function () {
        $scope.newConstraint.location_1 = $scope.newConstraint.currentNode_1.name;
        if ($scope.newConstraint.position_1 != null) {
            $scope.newConstraint.position_1 = $scope.newConstraint.position_1 + '.' + $scope.newConstraint.currentNode_1.position + '[1]';
        } else {
            $scope.newConstraint.position_1 = $scope.newConstraint.currentNode_1.position + '[1]';
        }

        $scope.newConstraint.childNodes_1 = [];

        if ($scope.newConstraint.currentNode_1.type === 'group') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.children.length; i < len1; i++) {
                if ($scope.newConstraint.currentNode_1.node.children[i].type === 'group') {
                    var groupModel = {
                        name: $scope.newConstraint.currentNode_1.node.children[i].name,
                        position: $scope.newConstraint.currentNode_1.node.children[i].position,
                        type: 'group',
                        node: $scope.newConstraint.currentNode_1.node.children[i]
                    };
                    $scope.newConstraint.childNodes_1.push(groupModel);
                } else if ($scope.newConstraint.currentNode_1.node.children[i].type === 'segmentRef') {
                    var segmentModel = {
                        name: $scope.newConstraint.location_1 + '.' + $rootScope.segmentsMap[$scope.newConstraint.currentNode_1.node.children[i].ref].name,
                        position: $scope.newConstraint.currentNode_1.node.children[i].position,
                        type: 'segment',
                        node: $rootScope.segmentsMap[$scope.newConstraint.currentNode_1.node.children[i].ref]
                    };
                    $scope.newConstraint.childNodes_1.push(segmentModel);
                }
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'segment') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.fields.length; i < len1; i++) {
                var fieldModel = {
                    name: $scope.newConstraint.location_1 + '-' + $scope.newConstraint.currentNode_1.node.fields[i].position,
                    position: $scope.newConstraint.currentNode_1.node.fields[i].position,
                    type: 'field',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_1.node.fields[i].datatype]
                };
                $scope.newConstraint.childNodes_1.push(fieldModel);
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'field') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_1 + '.' + $scope.newConstraint.currentNode_1.node.components[i].position,
                    position: $scope.newConstraint.currentNode_1.node.components[i].position,
                    type: 'subComponent',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_1.node.components[i].datatype]
                };
                $scope.newConstraint.childNodes_1.push(componentModel);
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'subComponent') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_1 + '.' + $scope.newConstraint.currentNode_1.node.components[i].position,
                    position: $scope.newConstraint.currentNode_1.node.components[i].position,
                    type: 'subComponent',
                    node: null
                };
                $scope.newConstraint.childNodes_1.push(componentModel);
            }
        }

        $scope.newConstraint.currentNode_1 = null;

    };

    $scope.updateLocation2 = function () {
        $scope.newConstraint.location_2 = $scope.newConstraint.currentNode_2.name;
        if ($scope.newConstraint.position_2 != null) {
            $scope.newConstraint.position_2 = $scope.newConstraint.position_2 + '.' + $scope.newConstraint.currentNode_2.position + '[1]';
        } else {
            $scope.newConstraint.position_2 = $scope.newConstraint.currentNode_2.position + '[1]';
        }

        $scope.newConstraint.childNodes_2 = [];

        if ($scope.newConstraint.currentNode_2.type === 'group') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.children.length; i < len1; i++) {
                if ($scope.newConstraint.currentNode_2.node.children[i].type === 'group') {
                    var groupModel = {
                        name: $scope.newConstraint.currentNode_2.node.children[i].name,
                        position: $scope.newConstraint.currentNode_2.node.children[i].position,
                        type: 'group',
                        node: $scope.newConstraint.currentNode_2.node.children[i]
                    };
                    $scope.newConstraint.childNodes_2.push(groupModel);
                } else if ($scope.newConstraint.currentNode_2.node.children[i].type === 'segmentRef') {
                    var segmentModel = {
                        name: $scope.newConstraint.location_2 + '.' + $rootScope.segmentsMap[$scope.newConstraint.currentNode_2.node.children[i].ref].name,
                        position: $scope.newConstraint.currentNode_2.node.children[i].position,
                        type: 'segment',
                        node: $rootScope.segmentsMap[$scope.newConstraint.currentNode_2.node.children[i].ref]
                    };
                    $scope.newConstraint.childNodes_2.push(segmentModel);
                }
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'segment') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.fields.length; i < len1; i++) {
                var fieldModel = {
                    name: $scope.newConstraint.location_2 + '-' + $scope.newConstraint.currentNode_2.node.fields[i].position,
                    position: $scope.newConstraint.currentNode_2.node.fields[i].position,
                    type: 'field',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_2.node.fields[i].datatype]
                };
                $scope.newConstraint.childNodes_2.push(fieldModel);
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'field') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_2 + '.' + $scope.newConstraint.currentNode_2.node.components[i].position,
                    position: $scope.newConstraint.currentNode_2.node.components[i].position,
                    type: 'subComponent',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_2.node.components[i].datatype]
                };
                $scope.newConstraint.childNodes_2.push(componentModel);
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'subComponent') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_2 + '.' + $scope.newConstraint.currentNode_2.node.components[i].position,
                    position: $scope.newConstraint.currentNode_2.node.components[i].position,
                    type: 'subComponent',
                    node: null
                };
                $scope.newConstraint.childNodes_2.push(componentModel);
            }
        }

        $scope.newConstraint.currentNode_2 = null;

    };
    
    $scope.addComplexPredicate = function(){
        $scope.complexConstraint = $rootScope.generateCompositePredicate($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
        $scope.complexConstraint.trueUsage = $scope.complexConstraintTrueUsage;
        $scope.complexConstraint.falseUsage = $scope.complexConstraintFalseUsage;
    	$scope.complexConstraint.constraintId = $scope.newConstraint.datatype + '-' + $scope.selectedNode.position;
    	$scope.tempPredicates.push($scope.complexConstraint);
    	$scope.initComplexPredicate();
        $scope.changed = true;
    };
    

    $scope.addPredicate = function () {
        if ($scope.newConstraint.position_1 != null) {
        	$rootScope.newPredicateFakeId = $rootScope.newPredicateFakeId - 1;
        	var positionPath = selectedNode.path;
        	var cp = $rootScope.generatePredicate(positionPath, $scope.newConstraint);
            $scope.tempPredicates.push(cp);
            $scope.changed = true;
        }
        $scope.initPredicate();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.saveclose = function () {
    	angular.copy($scope.tempPredicates, $scope.selectedMessage.predicates);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.initPredicate();

}]);


angular.module('tcl').controller('ConformanceStatementMessageCtrl', ["$scope", "$modalInstance", "selectedMessage", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedMessage, selectedNode, $rootScope) {
	$scope.constraintType = 'Plain';
    $scope.selectedNode = selectedNode;
    $scope.selectedMessage = selectedMessage;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = $rootScope.calNextCSID();
    
    $scope.changed = false;
    $scope.tempComformanceStatements = [];
    angular.copy($scope.selectedMessage.conformanceStatements, $scope.tempComformanceStatements);
    
    $scope.setChanged = function () {
    	$scope.changed = true;
    }
    
    $scope.initComplexStatement = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.newComplexConstraintId = $rootScope.calNextCSID();
    }
    
    $scope.initConformanceStatement = function (){
    	$scope.newConstraint = angular.fromJson({
            position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            currentNode_1: null,
            currentNode_2: null,
            childNodes_1: [],
            childNodes_2: [],
            verb: null,
            constraintId: $rootScope.calNextCSID(),
            contraintType: null,
            value: null,
            value2: null,
	        valueSetId: null,
	        bindingStrength: 'R',
	        bindingLocation: '1'
        });

    	for (var i = 0, len1 = $scope.selectedMessage.children.length; i < len1; i++) {
            if ($scope.selectedMessage.children[i].type === 'group') {
                var groupModel = {
                    name: $scope.selectedMessage.children[i].name,
                    position: $scope.selectedMessage.children[i].position,
                    type: 'group',
                    node: $scope.selectedMessage.children[i]
                };
                $scope.newConstraint.childNodes_1.push(groupModel);
                $scope.newConstraint.childNodes_2.push(groupModel);
            } else if ($scope.selectedMessage.children[i].type === 'segmentRef') {
                var segmentModel = {
                    name: $rootScope.segmentsMap[$scope.selectedMessage.children[i].ref].name,
                    position: $scope.selectedMessage.children[i].position,
                    type: 'segment',
                    node: $rootScope.segmentsMap[$scope.selectedMessage.children[i].ref]
                };
                $scope.newConstraint.childNodes_1.push(segmentModel);
                $scope.newConstraint.childNodes_2.push(segmentModel);
            }
        }
    }
    
    $scope.initConformanceStatement();
    
    $scope.updateLocation1 = function () {
        $scope.newConstraint.location_1 = $scope.newConstraint.currentNode_1.name;
        if ($scope.newConstraint.position_1 != null) {
            $scope.newConstraint.position_1 = $scope.newConstraint.position_1 + '.' + $scope.newConstraint.currentNode_1.position + '[1]';
        } else {
            $scope.newConstraint.position_1 = $scope.newConstraint.currentNode_1.position + '[1]';
        }

        $scope.newConstraint.childNodes_1 = [];

        if ($scope.newConstraint.currentNode_1.type === 'group') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.children.length; i < len1; i++) {
                if ($scope.newConstraint.currentNode_1.node.children[i].type === 'group') {
                    var groupModel = {
                        name: $scope.newConstraint.currentNode_1.node.children[i].name,
                        position: $scope.newConstraint.currentNode_1.node.children[i].position,
                        type: 'group',
                        node: $scope.newConstraint.currentNode_1.node.children[i]
                    };
                    $scope.newConstraint.childNodes_1.push(groupModel);
                } else if ($scope.newConstraint.currentNode_1.node.children[i].type === 'segmentRef') {
                    var segmentModel = {
                        name: $scope.newConstraint.location_1 + '.' + $rootScope.segmentsMap[$scope.newConstraint.currentNode_1.node.children[i].ref].name,
                        position: $scope.newConstraint.currentNode_1.node.children[i].position,
                        type: 'segment',
                        node: $rootScope.segmentsMap[$scope.newConstraint.currentNode_1.node.children[i].ref]
                    };
                    $scope.newConstraint.childNodes_1.push(segmentModel);
                }
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'segment') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.fields.length; i < len1; i++) {
                var fieldModel = {
                    name: $scope.newConstraint.location_1 + '-' + $scope.newConstraint.currentNode_1.node.fields[i].position,
                    position: $scope.newConstraint.currentNode_1.node.fields[i].position,
                    type: 'field',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_1.node.fields[i].datatype]
                };
                $scope.newConstraint.childNodes_1.push(fieldModel);
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'field') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_1 + '.' + $scope.newConstraint.currentNode_1.node.components[i].position,
                    position: $scope.newConstraint.currentNode_1.node.components[i].position,
                    type: 'component',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_1.node.components[i].datatype]
                };
                $scope.newConstraint.childNodes_1.push(componentModel);
            }
        } else if ($scope.newConstraint.currentNode_1.type === 'component') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_1.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_1 + '.' + $scope.newConstraint.currentNode_1.node.components[i].position,
                    position: $scope.newConstraint.currentNode_1.node.components[i].position,
                    type: 'subComponent',
                    node: null
                };
                $scope.newConstraint.childNodes_1.push(componentModel);
            }
        }

        $scope.newConstraint.currentNode_1 = null;

    };

    $scope.updateLocation2 = function () {
        $scope.newConstraint.location_2 = $scope.newConstraint.currentNode_2.name;
        if ($scope.newConstraint.position_2 != null) {
            $scope.newConstraint.position_2 = $scope.newConstraint.position_2 + '.' + $scope.newConstraint.currentNode_2.position + '[1]';
        } else {
            $scope.newConstraint.position_2 = $scope.newConstraint.currentNode_2.position + '[1]';
        }

        $scope.newConstraint.childNodes_2 = [];

        if ($scope.newConstraint.currentNode_2.type === 'group') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.children.length; i < len1; i++) {
                if ($scope.newConstraint.currentNode_2.node.children[i].type === 'group') {
                    var groupModel = {
                        name: $scope.newConstraint.currentNode_2.node.children[i].name,
                        position: $scope.newConstraint.currentNode_2.node.children[i].position,
                        type: 'group',
                        node: $scope.newConstraint.currentNode_2.node.children[i]
                    };
                    $scope.newConstraint.childNodes_2.push(groupModel);
                } else if ($scope.newConstraint.currentNode_2.node.children[i].type === 'segmentRef') {
                    var segmentModel = {
                        name: $scope.newConstraint.location_2 + '.' + $rootScope.segmentsMap[$scope.newConstraint.currentNode_2.node.children[i].ref].name,
                        position: $scope.newConstraint.currentNode_2.node.children[i].position,
                        type: 'segment',
                        node: $rootScope.segmentsMap[$scope.newConstraint.currentNode_2.node.children[i].ref]
                    };
                    $scope.newConstraint.childNodes_2.push(segmentModel);
                }
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'segment') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.fields.length; i < len1; i++) {
                var fieldModel = {
                    name: $scope.newConstraint.location_2 + '-' + $scope.newConstraint.currentNode_2.node.fields[i].position,
                    position: $scope.newConstraint.currentNode_2.node.fields[i].position,
                    type: 'field',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_2.node.fields[i].datatype]
                };
                $scope.newConstraint.childNodes_2.push(fieldModel);
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'field') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_2 + '.' + $scope.newConstraint.currentNode_2.node.components[i].position,
                    position: $scope.newConstraint.currentNode_2.node.components[i].position,
                    type: 'component',
                    node: $rootScope.datatypesMap[$scope.newConstraint.currentNode_2.node.components[i].datatype]
                };
                $scope.newConstraint.childNodes_2.push(componentModel);
            }
        } else if ($scope.newConstraint.currentNode_2.type === 'component') {
            for (var i = 0, len1 = $scope.newConstraint.currentNode_2.node.components.length; i < len1; i++) {
                var componentModel = {
                    name: $scope.newConstraint.location_2 + '.' + $scope.newConstraint.currentNode_2.node.components[i].position,
                    position: $scope.newConstraint.currentNode_2.node.components[i].position,
                    type: 'subComponent',
                    node: null
                };
                $scope.newConstraint.childNodes_2.push(componentModel);
            }
        }

        $scope.newConstraint.currentNode_2 = null;

    };

    $scope.deleteConformanceStatement = function (conformanceStatement) {
    	$scope.tempComformanceStatements.splice($scope.tempComformanceStatements.indexOf(conformanceStatement), 1);
        $scope.changed = true;
    };
    
    $scope.addComplexConformanceStatement = function(){
        $scope.complexConstraint = $rootScope.generateCompositeConformanceStatement($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
    	$scope.complexConstraint.constraintId = $scope.newComplexConstraintId;
    	if($rootScope.conformanceStatementIdList.indexOf($scope.complexConstraint.constraintId) == -1) $rootScope.conformanceStatementIdList.push($scope.complexConstraint.constraintId);
    	$scope.tempComformanceStatements.push($scope.complexConstraint);
    	$scope.initComplexStatement();
        $scope.changed = true;
    };
    
    $scope.addConformanceStatement = function () {
        if ($scope.newConstraint.position_1 != null) {
        	$rootScope.newConformanceStatementFakeId = $rootScope.newConformanceStatementFakeId - 1;
        	var positionPath = selectedNode.path;
        	var cs = $rootScope.generateConformanceStatement(positionPath, $scope.newConstraint);
            $scope.tempComformanceStatements.push(cs);
            if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
            $scope.changed = true;
        }
        
        $scope.initConformanceStatement();
    };

    $scope.ok = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		$rootScope.conformanceStatementIdList.splice($rootScope.conformanceStatementIdList.indexOf(cs.constraintId), 1);
    	});
    	
    	angular.forEach($scope.selectedMessage.conformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.saveclose = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	angular.copy($scope.tempComformanceStatements, $scope.selectedMessage.conformanceStatements);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };
}]);




'use strict';

angular.module('tcl')
.controller('RegisterResetPasswordCtrl', ['$scope', '$resource', '$modal', '$routeParams', 'isFirstSetup',
    function ($scope, $resource, $modal, $routeParams, isFirstSetup) {
        $scope.agreed = false;
        $scope.displayForm = true;
        $scope.isFirstSetup = isFirstSetup;

        if ( !angular.isDefined($routeParams.username) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.username === '' ) {
            $scope.displayForm = false;
        }
        if ( !angular.isDefined($routeParams.token) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.token === '' ) {
            $scope.displayForm = false;
        }
        if ( !angular.isDefined($routeParams.userId) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.userId === '' ) {
            $scope.displayForm = false;
        }

        //to register an account for the first time
        var AcctInitPassword = $resource('api/sooa/accounts/register/:userId/passwordreset', {userId:'@userId', token:'@token'});
        //to reset the password  
        var AcctResetPassword = $resource('api/sooa/accounts/:id/passwordreset', {id:'@userId', token:'@token'});

        $scope.user = {};
        $scope.user.username = $routeParams.username;
        $scope.user.newUsername = $routeParams.username;
        $scope.user.userId = $routeParams.userId;
        $scope.user.token = $routeParams.token;



//        $scope.confirmRegistration = function() {
//            var modalInstance = $modal.open({
//                backdrop: true,
//                keyboard: true,
//                backdropClick: false,
//                controller: 'AgreementCtrl',
//                templateUrl: 'views/agreement.html'
//            });
//            modalInstance.result.then(function (result) {
//                if(result) {
//                    var initAcctPass = new AcctInitPassword($scope.user);
//                    initAcctPass.signedConfidentialityAgreement = true;
//                    initAcctPass.$save(function() {
//                        $scope.user.password = '';
//                        $scope.user.passwordConfirm = '';
//                    });
//                }
//                else {
//                    //console.log("Agreement not accepted");
//                }
//            });
//        };

        $scope.changePassword = function() {
            if($scope.agreed) {
                var resetAcctPass = new AcctResetPassword($scope.user);
                resetAcctPass.$save(function () {
                    $scope.user.password = '';
                    $scope.user.passwordConfirm = '';
                });
            }
        };
    }
]);

'use strict';

angular.module('tcl')
.controller('RegistrationCtrl', ['$scope', '$resource', '$modal', '$location',
    function ($scope, $resource, $modal, $location) {
        $scope.account = {};
        $scope.registered = false;
        $scope.agreed = false;

        //Creating a type to check with the server if a username already exists.
        var Username = $resource('api/sooa/usernames/:username', {username: '@username'});
        var Email = $resource('api/sooa/emails/:email', {email: '@email'});

        var NewAccount = $resource('api/sooa/accounts/register');

        $scope.registerAccount = function() {
            if($scope.agreed) {
                //console.log("Creating account");
                var acctToRegister = new NewAccount();
                acctToRegister.accountType = 'author';
                acctToRegister.employer =  $scope.account.employer;
                acctToRegister.fullName =  $scope.account.fullName;
                acctToRegister.phone =  $scope.account.phone;
                acctToRegister.title =  $scope.account.title;
                acctToRegister.juridiction =  $scope.account.juridiction;
                acctToRegister.username =  $scope.account.username;
                acctToRegister.password =  $scope.account.password;
                acctToRegister.email =  $scope.account.email;
                acctToRegister.signedConfidentialityAgreement = true;
                acctToRegister.$save(
                    function() {
                        if (acctToRegister.text ===  'userAdded') {
                            $scope.account = {};
                            //should unfreeze the form
                            $scope.registered = true;
                            $location.path('/registrationSubmitted');
                        }else{
                            $scope.registered = false;
                        }
                    },
                    function() {
                        $scope.registered = false;
                    }
                );
                //should freeze the form - at least the button
                $scope.registered = true;
            }
        };

//        $scope.registerAccount = function() {
//            /* Check for username already in use
//               Verify email not already associated to an account
//               Will need to send an email if success
//               */
//            var modalInstance = $modal.open({
//                backdrop: true,
//                keyboard: true,
//                backdropClick: false,
//                controller: 'AgreementCtrl',
//                templateUrl: 'views/account/agreement.html'
//            });
//
//            modalInstance.result.then(function(result) {
//                if(result) {
//                    //console.log("Creating account");
//                    var acctToRegister = new NewAccount();
//                    acctToRegister.accountType = 'provider';
//                    acctToRegister.company =  $scope.account.company;
//                    acctToRegister.firstname =  $scope.account.firstname;
//                    acctToRegister.lastname =  $scope.account.lastname;
//                    acctToRegister.username =  $scope.account.username;
//                    acctToRegister.password =  $scope.account.password;
//                    acctToRegister.email =  $scope.account.email;
//                    acctToRegister.signedConfidentialityAgreement = true;
//
//                    acctToRegister.$save(
//                        function() {
//                            if (acctToRegister.text ===  'userAdded') {
//                                $scope.account = {};
//                                //should unfreeze the form
//                                $scope.registered = true;
//                                $location.path('/home');
//                            }
//                        },
//                        function() {
//                            $scope.registered = false;
//                        }
//                    );
//                    //should freeze the form - at least the button
//                    $scope.registered = true;
//                }
//                else {
//                    //console.log('Account not created');
//                }
//            });
//        };
    }
]);
//
//angular.module('tcl').controller('AgreementCtrl', ['$scope', '$modalInstance',
//    function ($scope, $modalInstance) {
//
//        $scope.acceptAgreement =  function() {
//            var res = true;
//            $modalInstance.close(res);
//        };
//
//        $scope.doNotAcceptAgreement =  function() {
//            var res = false;
//            $modalInstance.close(res);
//        };
//    }
//]);

/**
 * Created by haffo on 2/13/15.
 */

angular.module('tcl')
    .controller('SegmentListCtrl', ["$scope", "$rootScope", "Restangular", "ngTreetableParams", "CloneDeleteSvc", "$filter", "$http", "$modal", "$timeout", "SegmentService", function ($scope, $rootScope, Restangular, ngTreetableParams, CloneDeleteSvc, $filter, $http, $modal, $timeout,SegmentService) {
//        $scope.loading = false;
        $scope.readonly = false;
        $scope.saved = false;
        $scope.message = false;
        $scope.segmentCopy = null;

        $scope.reset = function () {
//            $scope.loadingSelection = true;
//            $scope.message = "Segment " + $scope.segmentCopy.label + " reset successfully";
//            angular.extend($rootScope.segment, $scope.segmentCopy);
//             $scope.loadingSelection = false;
        };

        $scope.close = function () {
            $rootScope.segment = null;
            $scope.refreshTree();
            $scope.loadingSelection = false;
        };
        
        $scope.copy = function(segment) {
        		CloneDeleteSvc.copySegment(segment);
        }

        $scope.delete = function (segment) {
        		CloneDeleteSvc.deleteSegment(segment);
			$rootScope.$broadcast('event:SetToC');
        };
        
        $scope.hasChildren = function (node) {
            return node && node != null && ((node.fields && node.fields.length > 0 ) || (node.datatype && $rootScope.getDatatype(node.datatype) && $rootScope.getDatatype(node.datatype).components && $rootScope.getDatatype(node.datatype).components.length > 0));
        };


        $scope.validateLabel = function (label, name) {
            if (label && !label.startsWith(name)) {
                return false;
            }
            return true;
        };

        $scope.onDatatypeChange = function (node) {
            $rootScope.recordChangeForEdit2('field', 'edit', node.id, 'datatype', node.datatype);
            $scope.refreshTree();
        };

        $scope.refreshTree = function () {
            if ($scope.segmentsParams)
                $scope.segmentsParams.refresh();
        };

        $scope.goToTable = function (table) {
            $scope.$emit('event:openTable', table);
        };

        $scope.goToDatatype = function (datatype) {
            $scope.$emit('event:openDatatype', datatype);
        };

        $scope.deleteTable = function (node) {
            node.table = null;
            $rootScope.recordChangeForEdit2('field', 'edit', node.id, 'table', null);
        };

        $scope.mapTable = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'TableMappingSegmentCtrl.html',
                controller: 'TableMappingSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.findDTByComponentId = function (componentId) {
            return $rootScope.parentsMap && $rootScope.parentsMap[componentId] ? $rootScope.parentsMap[componentId] : null;
        };

        $scope.isSub = function (component) {
            return $scope.isSubDT(component);
        };

        $scope.isSubDT = function (component) {
            return component.type === 'component' && $rootScope.parentsMap && $rootScope.parentsMap[component.id] && $rootScope.parentsMap[component.id].type === 'component';
        };

        $scope.managePredicate = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'PredicateSegmentCtrl.html',
                controller: 'PredicateSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.manageConformanceStatement = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'ConformanceStatementSegmentCtrl.html',
                controller: 'ConformanceStatementSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.show = function (segment) {
            return true;
        };

        $scope.countConformanceStatements = function (position) {
            var count = 0;
            if ($rootScope.segment != null) {
                for (var i = 0, len1 = $rootScope.segment.conformanceStatements.length; i < len1; i++) {
                    if ($rootScope.segment.conformanceStatements[i].constraintTarget.indexOf(position + '[') === 0)
                        count = count + 1;
                }
            }
            return count;
        };

        $scope.countPredicate = function (position) {
            if ($rootScope.segment != null) {
                for (var i = 0, len1 = $rootScope.segment.predicates.length; i < len1; i++) {
                    if ($rootScope.segment.predicates[i].constraintTarget.indexOf(position + '[') === 0)
                        return 1;
                }
            }
            return 0;
        };
        
        $scope.countPredicateOnComponent = function (position, componentId) {
        	var dt = $scope.findDTByComponentId(componentId);
        	if (dt != null)
                for (var i = 0, len1 = dt.predicates.length; i < len1; i++) {
                    if (dt.predicates[i].constraintTarget.indexOf(position + '[') === 0)
                        return 1;
                }

            return 0;
        };

        $scope.isRelevant = function (node) {
           return SegmentService.isRelevant(node);
        };

        $scope.isBranch = function (node) {
            SegmentService.isBranch(node);
        };

        $scope.isVisible = function (node) {
            return SegmentService.isVisible(node);
        };

        $scope.children = function (node) {
            return SegmentService.getNodes(node);
        };

        $scope.getParent = function (node) {
            return SegmentService.getParent(node);
        };

        $scope.getSegmentLevelConfStatements = function (element) {
             return SegmentService.getSegmentLevelConfStatements(element);
        };

        $scope.getSegmentLevelPredicates = function (element) {
            return SegmentService.getSegmentLevelPredicates(element);
        };

    }]);

angular.module('tcl')
    .controller('SegmentRowCtrl', ["$scope", "$filter", function ($scope, $filter) {
        $scope.formName = "form_" + new Date().getTime();
    }]);

angular.module('tcl').controller('TableMappingSegmentCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.changed = false;
    $scope.selectedNode = selectedNode;
    $scope.selectedTable = null;
    if (selectedNode.table != undefined) {
        $scope.selectedTable = $rootScope.tablesMap[selectedNode.table];
    }

    $scope.selectTable = function (table) {
        $scope.selectedTable = table;
        $scope.changed = true;
    };

    $scope.mappingTable = function () {
        $scope.selectedNode.table = $scope.selectedTable.id;
        $rootScope.recordChangeForEdit2('field', 'edit', $scope.selectedNode.id, 'table', $scope.selectedNode.table);
        $scope.ok();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

}]);

angular.module('tcl').controller('PredicateSegmentCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.constraintType = 'Plain';
    $scope.selectedNode = selectedNode;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.complexConstraintTrueUsage = null;
    $scope.complexConstraintFalseUsage = null;
    
    $scope.changed = false;
    $scope.tempPredicates = [];
    angular.copy($rootScope.segment.predicates, $scope.tempPredicates);

    $scope.setChanged = function () {
    	$scope.changed = true;
    }
    
    $scope.initPredicate = function () {
    	$scope.newConstraint = angular.fromJson({
    		position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
        	segment: '',
            field_1: null,
            component_1: null,
            subComponent_1: null,
            field_2: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            contraintType: null,
            value: null,
            value2: null,
            trueUsage: null,
            falseUsage: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });
        $scope.newConstraint.segment = $rootScope.segment.name;
    }
    
    $scope.initComplexPredicate = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.complexConstraintTrueUsage = null;
        $scope.complexConstraintFalseUsage = null;
    }
    
    $scope.initPredicate();
    
    $scope.deletePredicate = function (predicate) {
    	$scope.tempPredicates.splice($scope.tempPredicates.indexOf(predicate), 1);
        $scope.changed = true;
    };

    $scope.updateField_1 = function () {
        $scope.newConstraint.component_1 = null;
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateField_2 = function () {
        $scope.newConstraint.component_2 = null;
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };


    $scope.deletePredicateByTarget = function () {
        for (var i = 0, len1 = $scope.tempPredicates.length; i < len1; i++) {
            if ($scope.tempPredicates[i].constraintTarget.indexOf($scope.selectedNode.position + '[') === 0) {
                $scope.deletePredicate($scope.tempPredicates[i]);
                return true;
            }
        }
        return false;
    };
    
    $scope.addComplexPredicate = function(){
        $scope.complexConstraint = $rootScope.generateCompositePredicate($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
        $scope.complexConstraint.trueUsage = $scope.complexConstraintTrueUsage;
        $scope.complexConstraint.falseUsage = $scope.complexConstraintFalseUsage;
        
        if($scope.selectedNode === null) {
        	$scope.complexConstraint.constraintId = '.';
    	}else {
    		$scope.complexConstraint.constraintId = $scope.newConstraint.segment + '-' + $scope.selectedNode.position;
    	}
    	$scope.tempPredicates.push($scope.complexConstraint);
    	$scope.initComplexPredicate();
        $scope.changed = true;
    };
    
    $scope.addPredicate = function () {
        $rootScope.newPredicateFakeId = $rootScope.newPredicateFakeId - 1;

        $scope.newConstraint.position_1 = $scope.genPosition($scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.position_2  = $scope.genPosition($scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        $scope.newConstraint.location_1 = $scope.genLocation($scope.newConstraint.segment, $scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.location_2 = $scope.genLocation($scope.newConstraint.segment, $scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        
        if ($scope.newConstraint.position_1 != null) {
        	var cp = null;
        	if($scope.selectedNode === null) {
        		var cp = $rootScope.generatePredicate(".", $scope.newConstraint);
        	}else {
        		var cp = $rootScope.generatePredicate($scope.selectedNode.position + '[1]', $scope.newConstraint);
        	}
        	$scope.tempPredicates.push(cp);
            $scope.changed = true;
        }
        $scope.initPredicate();
    };

    $scope.genLocation= function (segment, field, component, subComponent) {
        var location = null;
        if (field != null && component == null && subComponent == null) {
        	location = segment + '-' + field.position + "(" + field.name + ")";
        } else if (field != null && component != null && subComponent == null) {
        	location = segment + '-' + field.position + '.' + component.position + "(" + component.name + ")";
        } else if (field != null && component != null && subComponent != null) {
        	location = segment + '-' + field.position + '.' + component.position + '.' + subComponent.position + "(" + subComponent.name + ")";
        }

        return location;
    };

    $scope.genPosition = function (field, component, subComponent) {
        var position = null;
        if (field != null && component == null && subComponent == null) {
        	position = field.position + '[1]';
        } else if (field != null && component != null && subComponent == null) {
        	position = field.position + '[1].' + component.position + '[1]';
        } else if (field != null && component != null && subComponent != null) {
        	position = field.position + '[1].' + component.position + '[1].' + subComponent.position + '[1]';
        }

        return position;
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.saveclose = function () {
    	angular.copy($scope.tempPredicates, $rootScope.segment.predicates);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };

}]);

angular.module('tcl').controller('ConformanceStatementSegmentCtrl', ["$scope", "$modalInstance", "selectedNode", "$rootScope", function ($scope, $modalInstance, selectedNode, $rootScope) {
	$scope.constraintType = 'Plain';
    $scope.selectedNode = selectedNode;
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = $rootScope.calNextCSID();
    $scope.newComplexConstraint = [];
    
    $scope.changed = false;
    $scope.tempComformanceStatements = [];
    angular.copy($rootScope.segment.conformanceStatements, $scope.tempComformanceStatements);
    
    $scope.setChanged = function () {
    	$scope.changed = true;
    }
    
    $scope.initConformanceStatement = function () {
    	$scope.newConstraint = angular.fromJson({
    		position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            segment: '',
            field_1: null,
            component_1: null,
            subComponent_1: null,
            field_2: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            constraintId: $rootScope.calNextCSID(),
            contraintType: null,
            value: null,
            value2: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });
        $scope.newConstraint.segment = $rootScope.segment.name;
    }
    
    $scope.initComplexStatement = function () {
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.newComplexConstraintId = $rootScope.calNextCSID();
    }
    
    $scope.initConformanceStatement();

    $scope.deleteConformanceStatement = function (conformanceStatement) {
        $scope.tempComformanceStatements.splice($scope.tempComformanceStatements.indexOf(conformanceStatement), 1);
        $scope.changed = true;
    };
    
    $scope.updateField_1 = function () {
        $scope.newConstraint.component_1 = null;
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateField_2 = function () {
        $scope.newConstraint.component_2 = null;
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.genLocation= function (segment, field, component, subComponent) {
        var location = null;
        if (field != null && component == null && subComponent == null) {
        	location = segment + '-' + field.position + "(" + field.name + ")";
        } else if (field != null && component != null && subComponent == null) {
        	location = segment + '-' + field.position + '.' + component.position + "(" + component.name + ")";
        } else if (field != null && component != null && subComponent != null) {
        	location = segment + '-' + field.position + '.' + component.position + '.' + subComponent.position + "(" + subComponent.name + ")";
        }

        return location;
    };

    $scope.genPosition = function (field, component, subComponent) {
        var position = null;
        if (field != null && component == null && subComponent == null) {
        	position = field.position + '[1]';
        } else if (field != null && component != null && subComponent == null) {
        	position = field.position + '[1].' + component.position + '[1]';
        } else if (field != null && component != null && subComponent != null) {
        	position = field.position + '[1].' + component.position + '[1].' + subComponent.position + '[1]';
        }

        return position;
    };
    
    $scope.addComplexConformanceStatement = function(){
    	$scope.complexConstraint = $rootScope.generateCompositeConformanceStatement($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint);
    	$scope.complexConstraint.constraintId = $scope.newComplexConstraintId;
    	if($rootScope.conformanceStatementIdList.indexOf($scope.complexConstraint.constraintId) == -1) $rootScope.conformanceStatementIdList.push($scope.complexConstraint.constraintId);
    	$scope.tempComformanceStatements.push($scope.complexConstraint);
    	$scope.initComplexStatement();
        $scope.changed = true;
    };
    

    $scope.addConformanceStatement = function () {
        $scope.newConstraint.position_1 = $scope.genPosition($scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.position_2 = $scope.genPosition($scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        $scope.newConstraint.location_1 = $scope.genLocation($scope.newConstraint.segment, $scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        $scope.newConstraint.location_2 = $scope.genLocation($scope.newConstraint.segment, $scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);

        if ($scope.newConstraint.position_1 != null) {
        	$rootScope.newConformanceStatementFakeId = $rootScope.newConformanceStatementFakeId - 1;
        	if($scope.selectedNode === null) {
        		var cs = $rootScope.generateConformanceStatement(".", $scope.newConstraint);
        	}else {
        		var cs = $rootScope.generateConformanceStatement($scope.selectedNode.position + '[1]', $scope.newConstraint);
        	}
            $scope.tempComformanceStatements.push(cs);
            if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
            $scope.changed = true;
        }
        $scope.initConformanceStatement();
    };

    $scope.ok = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		$rootScope.conformanceStatementIdList.splice($rootScope.conformanceStatementIdList.indexOf(cs.constraintId), 1);
    	});
    	
    	angular.forEach($rootScope.segment.conformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	
        $modalInstance.close($scope.selectedNode);
    };
    
    $scope.saveclose = function () {
    	angular.forEach($scope.tempComformanceStatements, function (cs) {
    		if($rootScope.conformanceStatementIdList.indexOf(cs.constraintId) == -1) $rootScope.conformanceStatementIdList.push(cs.constraintId);
    	});
    	angular.copy($scope.tempComformanceStatements, $rootScope.segment.conformanceStatements);
    	$rootScope.recordChanged();
        $modalInstance.close($scope.selectedNode);
    };

}]);


angular.module('tcl').controller('ConfirmSegmentDeleteCtrl', ["$scope", "$modalInstance", "segToDelete", "$rootScope", function ($scope, $modalInstance, segToDelete, $rootScope) {
    $scope.segToDelete = segToDelete;
    $scope.loading = false;
    
    $scope.delete = function () {
        $scope.loading = true;
        // Contrary to popular belief, we must remove the segment from both places.
        var index = _.findIndex($rootScope.igdocument.profile.segments.children, function(child) {
        		return child.id === $scope.segToDelete.id;
	    });
	    if (index > -1) $rootScope.igdocument.profile.segments.children.splice(index, 1);
        var index = _.findIndex($rootScope.segments, function(child) {
        		return child.id === $scope.segToDelete.id;
        });        
        if (index > -1) $rootScope.segments.splice(index, 1);
        
        if ($rootScope.segment === $scope.segToDelete) {
            $rootScope.segment = null;
        }
        $rootScope.segmentsMap[$scope.segToDelete.id] = null;
        $rootScope.references = [];
        if ($scope.segToDelete.id < 0) {
//            var index = $rootScope.changes["segment"]["add"].indexOf($scope.segToDelete);
//            if (index > -1) $rootScope.changes["segment"]["add"].splice(index, 1);
//            if ($rootScope.changes["segment"]["add"] && $rootScope.changes["segment"]["add"].length === 0) {
//                delete  $rootScope.changes["segment"]["add"];
//            }
//            if ($rootScope.changes["segment"] && Object.getOwnPropertyNames($rootScope.changes["segment"]).length === 0) {
//                delete  $rootScope.changes["segment"];
//            }
        } else {
            $rootScope.recordDelete("segment", "edit", $scope.segToDelete.id);
//            if ($scope.segToDelete.components != undefined && $scope.segToDelete.components != null && $scope.segToDelete.components.length > 0) {
//
//                //clear components changes
//                angular.forEach($scope.dtToDelete.components, function (component) {
//                    $rootScope.recordDelete("component", "edit", component.id);
//                    $rootScope.removeObjectFromChanges("component", "delete", component.id);
//                });
//                if ($rootScope.changes["component"]["delete"] && $rootScope.changes["component"]["delete"].length === 0) {
//                    delete  $rootScope.changes["component"]["delete"];
//                }
//
//                if ($rootScope.changes["component"] && Object.getOwnPropertyNames($rootScope.changes["component"]).length === 0) {
//                    delete  $rootScope.changes["component"];
//                }
//
//            }
//
//            if ($scope.segToDelete.predicates != undefined && $scope.segToDelete.predicates != null && $scope.segToDelete.predicates.length > 0) {
//                //clear predicates changes
//                angular.forEach($scope.segToDelete.predicates, function (predicate) {
//                    $rootScope.recordDelete("predicate", "edit", predicate.id);
//                    $rootScope.removeObjectFromChanges("predicate", "delete", predicate.id);
//                });
//                if ($rootScope.changes["predicate"]["delete"] && $rootScope.changes["predicate"]["delete"].length === 0) {
//                    delete  $rootScope.changes["predicate"]["delete"];
//                }
//
//                if ($rootScope.changes["predicate"] && Object.getOwnPropertyNames($rootScope.changes["predicate"]).length === 0) {
//                    delete  $rootScope.changes["predicate"];
//                }
//
//            }
//
//            if ($scope.dtToDelete.conformanceStatements != undefined && $scope.dtToDelete.conformanceStatements != null && $scope.dtToDelete.conformanceStatements.length > 0) {
//                //clear conforamance statement changes
//                angular.forEach($scope.dtToDelete.conformanceStatements, function (confStatement) {
//                    $rootScope.recordDelete("conformanceStatement", "edit", confStatement.id);
//                    $rootScope.removeObjectFromChanges("conformanceStatement", "delete", confStatement.id);
//                });
//                if ($rootScope.changes["conformanceStatement"]["delete"] && $rootScope.changes["conformanceStatement"]["delete"].length === 0) {
//                    delete  $rootScope.changes["conformanceStatement"]["delete"];
//                }
//
//                if ($rootScope.changes["conformanceStatement"] && Object.getOwnPropertyNames($rootScope.changes["conformanceStatement"]).length === 0) {
//                    delete  $rootScope.changes["conformanceStatement"];
//                }
//            }
        }


        $rootScope.msg().text = "segDeleteSuccess";
        $rootScope.msg().type = "success";
        $rootScope.msg().show = true;
        $rootScope.manualHandle = true;
		$rootScope.$broadcast('event:SetToC');
        $modalInstance.close($scope.segToDelete);

    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('tcl').controller('SegmentReferencesCtrl', ["$scope", "$modalInstance", "segToDelete", function ($scope, $modalInstance, segToDelete) {

    $scope.segToDelete = segToDelete;

    $scope.ok = function () {
        $modalInstance.close($scope.segToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

/**
 * Created by Jungyub on 4/01/15.
 */

angular.module('tcl').controller('TableListCtrl', ["$scope", "$rootScope", "Restangular", "$filter", "$http", "$modal", "$timeout", "CloneDeleteSvc", function ($scope, $rootScope, Restangular, $filter, $http, $modal, $timeout, CloneDeleteSvc) {
    $scope.readonly = false;
    $scope.codeSysEditMode = false;
    $scope.codeSysForm = {};
    $scope.saved = false;
    $scope.message = false;
    $scope.params = null;
    $scope.init = function () {
        $rootScope.$on('event:cloneTableFlavor', function(event, table) {
        	$scope.copyTable(table);
      });
    };

    $scope.addTable = function () {
        $rootScope.newTableFakeId = $rootScope.newTableFakeId - 1;
        var newTable = angular.fromJson({
            id: new ObjectId().toString(),
            type: 'table',
            bindingIdentifier: '',
            name: '',
            version: '',
            oid: '',
            tableType: '',
            stability: '',
            extensibility: '',
            codes: []
        });
        $rootScope.tables.push(newTable);
        $rootScope.tablesMap[newTable.id] = newTable;
        $rootScope.table = newTable;
        $rootScope.recordChangeForEdit2('table', "add", newTable.id,'table', newTable);
    };
    
    
    $scope.makeCodeSystemEditable = function () {
    	$scope.codeSysEditMode = true;
    };
    
    
    $scope.addCodeSystem = function () {
    	if($rootScope.codeSystems.indexOf($scope.codeSysForm.str) < 0){
    		if($scope.codeSysForm.str && $scope.codeSysForm.str !== ''){
    			$rootScope.codeSystems.push($scope.codeSysForm.str);
    		}
		}
    	$scope.codeSysForm.str = '';
    	$scope.codeSysEditMode = false;
    };
    
    $scope.delCodeSystem = function (value) {
    	$rootScope.codeSystems.splice($rootScope.codeSystems.indexOf(value), 1);
    }
    
    $scope.updateCodeSystem = function (table,codeSystem) {
    	for (var i = 0; i < $rootScope.table.codes.length; i++) {
    		$rootScope.table.codes[i].codeSystem = codeSystem;
    		$scope.recordChangeValue($rootScope.table.codes[i],'codeSystem',$rootScope.table.codes[i].codeSystem,table.id);
    	}
    }

    $scope.addValue = function () {
        $rootScope.newValueFakeId = $rootScope.newValueFakeId ?  $rootScope.newValueFakeId - 1: -1;
        var newValue = {
            id: new ObjectId().toString(),
            type: 'value',
            value: '',
            label: '',
            codeSystem: null,
            codeUsage: 'R'
        };


        $rootScope.table.codes.unshift(newValue);
        var newValueBlock = {targetType:'table', targetId:$rootScope.table.id, obj:newValue};
        if(!$scope.isNewObject('table', 'add', $rootScope.table.id)){
        	$rootScope.recordChangeForEdit2('value', "add", null,'value', newValueBlock);
        }
    };

    $scope.deleteValue = function (value) {
        if (!$scope.isNewValueThenDelete(value.id)) {
            $rootScope.recordChangeForEdit2('value', "delete", value.id,'id', value.id);
        }
        $rootScope.table.codes.splice($rootScope.table.codes.indexOf(value), 1);
    };

    $scope.isNewValueThenDelete = function (id) {
    	if($rootScope.isNewObject('value', 'add',id)){
    		if($rootScope.changes['value'] !== undefined && $rootScope.changes['value']['add'] !== undefined) {
    			for (var i = 0; i < $rootScope.changes['value']['add'].length; i++) {
        			var tmp = $rootScope.changes['value']['add'][i];
        			if (tmp.obj.id === id) {
                        $rootScope.changes['value']['add'].splice(i, 1);
                        if ($rootScope.changes["value"]["add"] && $rootScope.changes["value"]["add"].length === 0) {
                            delete  $rootScope.changes["value"]["add"];
                        }

                        if ($rootScope.changes["value"] && Object.getOwnPropertyNames($rootScope.changes["value"]).length === 0) {
                            delete  $rootScope.changes["value"];
                        }
                        return true;
                   }
        		}
    		}
    		return true;
    	}
    	if($rootScope.changes['value'] !== undefined && $rootScope.changes['value']['edit'] !== undefined) {
    		for (var i = 0; i < $rootScope.changes['value']['edit'].length; i++) {
    			var tmp = $rootScope.changes['value']['edit'][i];
    			if (tmp.id === id) {
                    $rootScope.changes['value']['edit'].splice(i, 1);
                    if ($rootScope.changes["value"]["edit"] && $rootScope.changes["value"]["edit"].length === 0) {
                        delete  $rootScope.changes["value"]["edit"];
                    }

                    if ($rootScope.changes["value"] && Object.getOwnPropertyNames($rootScope.changes["value"]).length === 0) {
                        delete  $rootScope.changes["value"];
                    }
                    return false;
               }
    		}
    		return false;
    	}
        return false;
    };
    
    $scope.isNewValue = function (id) {
        return $scope.isNewObject('value', 'add', id);
    };

    $scope.isNewTable = function (id) {
        return $scope.isNewObject('table', 'add',id);
    };

    $scope.close = function () {
        $rootScope.table = null;
    };

    $scope.copyTable = function (table) {
		CloneDeleteSvc.copyTable(table);
		$rootScope.$broadcast('event:SetToC');
    };

    $scope.recordChangeValue = function (value, valueType, tableId) {
        if (!$scope.isNewTable(tableId)) {
            if (!$scope.isNewValue(value.id)) {
            	$rootScope.recordChangeForEdit2('value', 'edit',value.id,valueType,value);  
            }
        }
    };

    $scope.recordChangeTable = function (table, valueType, value) {
        if (!$scope.isNewTable(table.id)) {
            $rootScope.recordChangeForEdit2('table', 'edit',table.id,valueType,value);            
        }
    };

    $scope.setAllCodeUsage = function (table, usage) {
        for (var i = 0, len = table.codes.length; i < len; i++) {
            if (table.codes[i].codeUsage !== usage) {
                table.codes[i].codeUsage = usage;
                if (!$scope.isNewTable(table.id) && !$scope.isNewValue(table.codes[i].id)) {
                    $rootScope.recordChangeForEdit2('value','edit',table.codes[i].id,'codeUsage',usage);  
                }
            }
        }
    };

    $scope.delete = function (table) {
    		CloneDeleteSvc.deleteValueSet(table);
   };
}]);

angular.module('tcl').controller('TableModalCtrl', ["$scope", function ($scope) {
    $scope.showModal = false;
    $scope.toggleModal = function () {
        $scope.showModal = !$scope.showModal;
    };
}]);

angular.module('tcl').controller('ConfirmValueSetDeleteCtrl', ["$scope", "$modalInstance", "tableToDelete", "$rootScope", function ($scope, $modalInstance, tableToDelete, $rootScope) {
    $scope.tableToDelete = tableToDelete;
    $scope.loading = false;
    $scope.delete = function () {
        $scope.loading = true;

        if (!$scope.isNewTableThenDelete(tableToDelete.id)) {
//        	$rootScope.recordChangeForEdit2('table', "delete", tableToDelete.id,'id', tableToDelete.id);
        }
        // We must delete from two collections.
        var index = $rootScope.tables.indexOf(tableToDelete)
        $rootScope.tables.splice(index, 1);
        var index = $rootScope.igdocument.profile.tables.children.indexOf($scope.tableToDelete);
        if (index > -1) $rootScope.igdocument.profile.tables.children.splice(index, 1);
        $rootScope.tablesMap[tableToDelete.id] = undefined;
        
        $rootScope.generalInfo.type = 'info';
        $rootScope.generalInfo.message = "Table " + $scope.tableToDelete.bindingIdentifier + " deleted successfully";

        if ($rootScope.table === $scope.tableToDelete) {
            $rootScope.table = null;
        }

        $rootScope.references = [];
		$rootScope.$broadcast('event:SetToC');
        $modalInstance.close($scope.tableToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };




    $scope.isNewTableThenDelete = function (id) {
    	if($rootScope.isNewObject('table', 'add', id)){
    		if($rootScope.changes['table'] !== undefined && $rootScope.changes['table']['add'] !== undefined) {
    			for (var i = 0; i < $rootScope.changes['table']['add'].length; i++) {
        			var tmp = $rootScope.changes['table']['add'][i];
        			if (tmp.id == id) {
                        $rootScope.changes['table']['add'].splice(i, 1);
                        if ($rootScope.changes["table"]["add"] && $rootScope.changes["table"]["add"].length === 0) {
                            delete  $rootScope.changes["table"]["add"];
                        }

                        if ($rootScope.changes["table"] && Object.getOwnPropertyNames($rootScope.changes["table"]).length === 0) {
                            delete  $rootScope.changes["table"];
                        }
                        return true;
                   }
        		}
    		}
    		return true;
    	}
    	if($rootScope.changes['table'] !== undefined && $rootScope.changes['table']['edit'] !== undefined) {
    		for (var i = 0; i < $rootScope.changes['table']['edit'].length; i++) {
    			var tmp = $rootScope.changes['table']['edit'][i];
    			if (tmp.id === id) {
                    $rootScope.changes['table']['edit'].splice(i, 1);
                    if ($rootScope.changes["table"]["edit"] && $rootScope.changes["table"]["edit"].length === 0) {
                        delete  $rootScope.changes["table"]["edit"];
                    }

                    if ($rootScope.changes["table"] && Object.getOwnPropertyNames($rootScope.changes["table"]).length === 0) {
                        delete  $rootScope.changes["table"];
                    }
                    return false;
               }
    		}
    		return false;
    	}
        return false;
    };
}]);

angular.module('tcl').controller('ValueSetReferencesCtrl', ["$scope", "$modalInstance", "tableToDelete", function ($scope, $modalInstance, tableToDelete) {

    $scope.tableToDelete = tableToDelete;

    $scope.ok = function () {
        $modalInstance.close($scope.tableToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
/**
 * Created by Jungyub on 5/12/16.
 */

angular.module('tcl').controller('TestPlanCtrl', ["$scope", "$rootScope", "$templateCache", "Restangular", "$http", "$filter", "$modal", "$cookies", "$timeout", "userInfoService", "ToCSvc", "ContextMenuSvc", "ProfileAccessSvc", "ngTreetableParams", "$interval", "ViewSettings", "StorageService", "$q", "notifications", "DatatypeService", "SegmentService", "IgDocumentService", "ElementUtils", "AutoSaveService", function ($scope, $rootScope, $templateCache, Restangular, $http, $filter, $modal, $cookies, $timeout, userInfoService, ToCSvc, ContextMenuSvc, ProfileAccessSvc, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, DatatypeService, SegmentService, IgDocumentService, ElementUtils,AutoSaveService) {
	$scope.loading = false;
	$rootScope.tps = [];
	$scope.testPlanOptions=[];
	$scope.accordi = {metaData: false, definition: true, igList: true, igDetails: false};
	$rootScope.usageViewFilter = 'All';
    
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
		if($rootScope.selectedTestStep.integrationProfileId != undefined && $rootScope.selectedTestStep.integrationProfileId !== ''){
			$http.get('api/integrationprofiles/' + $rootScope.selectedTestStep.integrationProfileId).then(function (response) {
				$rootScope.selectedIntegrationProfile = angular.fromJson(response.data);
			}, function (error) {
				$rootScope.selectedIntegrationProfile = null;
			});
		}else {
			$rootScope.selectedIntegrationProfile = null;
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
				$scope.loadIntegrationProfile();
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
    
    $scope.initTestData = function () {
    	$scope.updateMessage();
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
    					dt: $scope.findDatatype(segment.obj.fields[i].datatype),
    					value: fieldInstanceValues[h],
    					children : []
    			};
        		
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
        					dt: $scope.findDatatype(fieldNode.dt.components[j].datatype),
        					value: componentValues[j],
        					children : []
        			};
        			
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
            					dt: $scope.findDatatype(componentNode.dt.components[k].datatype),
            					value: subComponentValues[k],
            					children : []
            			};
        				componentNode.children.push(subComponentNode);
        			}
        			
        			fieldNode.children.push(componentNode);
        			
        			
        		}
        		
        		$rootScope.selectedSegmentNode.children.push(fieldNode);
    		}
    		
    		
    	}
    	$scope.refreshTree();
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
    
    $scope.findTable = function (ref){
    	return _.find($rootScope.selectedIntegrationProfile.tables.children,function(t){ 
			return t.id == ref
		});
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
    	return $scope.replaceAll(iPath.replace($rootScope.selectedSegmentNode.segment.iPath + "." ,""), "[1]","");
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
    
    
    
    $scope.example13model = [];
    $scope.example13data = [
        {id: 1, label: "David"},
        {id: 2, label: "Jhon"},
        {id: 3, label: "Lisa"},
        {id: 4, label: "Nicole"},
        {id: 5, label: "Danny"}];

    $scope.example13settings = {
        smartButtonMaxItems: 3,
        smartButtonTextConverter: function(itemText, originalItem) {
            if (itemText === 'Jhon') {
            return 'Jhonny!';
            }

            return itemText;
        }
    };
	
	//Tree Functions
	$scope.activeModel={};

    $scope.treeOptions = {

        accept: function(sourceNodeScope, destNodesScope, destIndex) {
            //destNodesScope.expand();
            var dataTypeSource = sourceNodeScope.$element.attr('data-type');
            var dataTypeDest = destNodesScope.$element.attr('data-type');
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
  			$scope.recordChanged();


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
                            	  var clone = {};
                            	  
                                  var name =  $itemScope.$nodeScope.$modelValue.name;
                                  var model =  $itemScope.$nodeScope.$modelValue;
                                  clone.name=name+"(clone)";
                                  
                                  var testcases=[];
                                  
                                  clone.testcases=testcases;
                                  

                      		    for (var i = model.testcases.length - 1; i >= 0; i--){
                      		        var  testcase={};
                      		         testcase.name=model.testcases[i].name;
                      		         testcase.position=model.testcases[i].position;

                      		         testcase.teststeps=[];
                      		         for (var j = model.testcases[i].teststeps.length - 1; j >= 0; j--){
                      		        	 var teststep={};
                      		        	 teststep.name=model.testcases[i].teststeps[j].name;
                      		        	 teststep.position=model.testcases[i].teststeps[j].position;
                      		        	 testcase.teststeps.push(teststep);
                      		         }
         
                      		         testcases.push(testcase);
                      		        }
                      		    	clone.testcases=testcases;
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

    $scope.testCaseOptions =	[
                            	 ['add new teststep', function($itemScope) {

                            		 if( !$itemScope.$nodeScope.$modelValue.teststeps){
                            			 $itemScope.$nodeScope.$modelValue.teststeps=[];
                            		 }
                            		 $itemScope.$nodeScope.$modelValue.teststeps.push({name: "newteststep", position:$itemScope.$nodeScope.$modelValue.teststeps.length+1});

                            		 $scope.recordChanged();

                            	 }],
                            	 null, 
                            	 ['clone', function($itemScope) {
                            		 var clone = {};

                            		 var name =  $itemScope.$nodeScope.$modelValue.name;
                            		 var model =  $itemScope.$nodeScope.$modelValue;
                            		 clone.name=name+"(clone)";

                            		 var teststeps=[];

                            		 clone.teststeps=teststeps;


                            		 for (var i = model.teststeps.length - 1; i >= 0; i--){
                            			 var  teststep={};
                            			 teststep.name=model.teststeps[i].name;
                            			 teststep.position=model.teststeps[i].position;
                            			 teststeps.push(teststep);
                            		 }
                            		 clone.teststeps=teststeps;
                            		 clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
                            		 $itemScope.$nodeScope.$parent.$modelValue.push(clone)


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


}]);

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl', ["$scope", "$modalInstance", "testplanToDelete", "$rootScope", "$http", function ($scope, $modalInstance, testplanToDelete, $rootScope, $http) {
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
}]);