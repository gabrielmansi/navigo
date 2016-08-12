/*global angular, $, _, console */

angular.module('voyager.filters').
    factory('treeService', function (config, $http, configService, $q, solrGrunt, sugar, facetService) {
        'use strict';
        var _tree= {};
        var _fields = {};
        var _trees = {};

        function _isHierarchy(filter) {
            return filter.style === 'HIERARCHY' || filter.stype === 'hierarchy';
        }

        function _getTreeParams() {
            var configFilters = configService.getFilters(), facetParams = '';
            $.each(configFilters, function (index, filter) {
                if(_isHierarchy(filter)) {
                    facetParams += '&facet.field=' + filter.field + '&f.' + filter.field + '.facet.mincount=1' + '&f.' + filter.field + '.facet.prefix=%s/';
                    _trees[filter.field] = {};
                }
            });
            return facetParams;
        }

        function _hasTreeParam() {
            var configFilters = configService.getFilters();
            var hasTree = false;
            $.each(configFilters, function (index, filter) {
                if(_isHierarchy(filter)) {
                    hasTree = true;
                    return false;
                }
            });
            return hasTree;
        }

        function _getQueryString(params, filterParams, bboxParams) {
            var solrParams = solrGrunt.getSolrParams(params);
            delete solrParams.fq; //filter service will apply filter params below
            solrParams.q = solrGrunt.getInput(solrParams.q); //default to all if no input filter
            var queryString = config.root + 'solr/v0/select?rows=0&block=false&facet=true' + _getTreeParams();
            queryString += '&' + sugar.toQueryString(solrParams);
            queryString += filterParams;
            queryString += bboxParams;
            if(angular.isDefined(configService.getConfigId())) {
                queryString += '&voyager.config.id=' + configService.getConfigId();
            }
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';
            queryString += '&rand=' + Math.random();
            return queryString;
        }

        function _getSelectedLevel(params) {
            var paths, level = 0;
            if (params.fq) {
                paths = _.filter(sugar.toArray(params.fq), function(f) {
                    return f.indexOf('path_path') > -1;
                });
                if(paths.length > 0) {
                    var path = paths[0];
                    path = path.replace(/\\/g, '');
                    level = path.split('/').length;
                }
            }
            return level;
        }

        //query 2 levels so we can get the children of the next level for display of the expand/collapse icon
        function _queryLevels(queryString, level) {
            var deferred = $q.defer();
            var promises = [];
            var level1 = '1', level2 = '2';

            if (level > 0) {  //TODO add path to prefix filter like query node levels?
                level1 = level.toString();
                level2 = (level + 1).toString();
            }

            var queryLevel = _.sprintf(queryString,level1);
            var queryLevel2 = _.sprintf(queryString,level2);
            var queries = [queryLevel, queryLevel2];
            $.each(queries, function(index, query) {
                promises.push($http.jsonp(query));
            });
            $q.all(promises).then(function (response) {
                //console.log("levels");
                $.each(_trees, function(name) {
                    var raw = response[0].data.facet_counts.facet_fields[name]; // jshint ignore:line
                    var tree = facetService.buildFacets(raw,{field:name,style:'HIERARCHY'},{});

                    raw = response[1].data.facet_counts.facet_fields[name]; // jshint ignore:line
                    var next = facetService.buildFacets(raw,{field:name,style:'HIERARCHY'},{});

                    $.merge(tree, next);

                    _trees[name] = tree;
                });
                deferred.resolve(_trees);
            }, function () {
                console.log('failed');
                deferred.reject();
            });
            return deferred.promise;
        }

        //query 2 levels so we can get the children of the next level for display of the expand/collapse icon
        function _queryNodeLevels(queryString, name, level, path) {
            var deferred = $q.defer();
            var promises = [];
            var level1 = level.toString() + '/' + path;
            var level2 = (level + 1).toString() + '/' + path;

            var queryLevel = _.sprintf(queryString,level1);
            var queryLevel2 = _.sprintf(queryString,level2);
            var queries = [queryLevel, queryLevel2];
            $.each(queries, function(index, query) {
                promises.push($http.jsonp(query));
            });
            $q.all(promises).then(function (response) {
                var raw = response[0].data.facet_counts.facet_fields[name]; // jshint ignore:line
                var tree = facetService.buildFacets(raw,{field:name,style:'HIERARCHY'},{});

                raw = response[1].data.facet_counts.facet_fields[name]; // jshint ignore:line
                var next = facetService.buildFacets(raw,{field:name,style:'HIERARCHY'},{});

                $.merge(tree, next);
                deferred.resolve(tree);
            }, function () {
                console.log('failed');
                deferred.reject();
            });
            return deferred.promise;
        }

        function _setTree(params, filterParams, bboxParams) {
            _trees = {};
            var deferred = $q.defer();
            if (_hasTreeParam()) {
                var level = _getSelectedLevel(params);
                var queryString = _getQueryString(params, filterParams, bboxParams);
                _queryLevels(queryString, level).then(function() {
                    deferred.resolve();
                });
            } else {
                deferred.resolve(null);
            }
            return deferred.promise;
        }

        function _addChild(folder, nodes, collapsed, field) {
            var child = nodes[folder.path];
            if(angular.isUndefined(child)) {
                child = {level:folder.level, root:folder.node[0], path:folder.path, children:[], childMap:{}, mime:'application/vnd.voyager.folder', id:folder.path, collapsed:true, field:field};
                nodes[child.path] = child;
            }
            if(angular.isUndefined(nodes[folder.parentPath].childMap[child.path])) {
                nodes[folder.parentPath].children.push(child);
                nodes[folder.parentPath].childMap[child.path] = child;
            }
            if(nodes[folder.parentPath].collapsed === true) { //if flagged as expanded, don't collapse
                nodes[folder.parentPath].collapsed = collapsed;
            }
        }

        function _getFolder(row, index) {
            var folder = {};
            folder.level = row[0];  //TODO set level to actual folder level? not using currently
            folder.node = row.slice(1,index+1);
            folder.name = folder.node[folder.node.length-1];
            folder.path = folder.node.join('/');
            folder.parent = row.slice(1,index);
            folder.parentPath = folder.parent.join('/');
            return folder;
        }

        function _getPathInfo(path) {
            var pathInfo = {};
            pathInfo.value = path.value.replace(/\\/g, '/');  //some contain backslash, make em all forward slash
            pathInfo.name = path.name.replace(/\\/g, '/');
            pathInfo.folders = pathInfo.name.split('/');
            pathInfo.level = pathInfo.folders.length - 1;  //level from the response is incorrect if there are backslashes in the path so doing this instead
            pathInfo.display = pathInfo.value.substring(pathInfo.value.lastIndexOf('/')+1, pathInfo.value.length);
            pathInfo.path = pathInfo.name.substring(pathInfo.name.indexOf('/')+1, pathInfo.name.length);
            pathInfo.count = path.count;
            return pathInfo;
        }

        function _getNode(pathInfo, selected, field) {
            var node = {level:pathInfo.level, root:pathInfo.folders[1], path:pathInfo.path, children:[], display: pathInfo.display, childMap:{}, mime:'application/vnd.voyager.folder', id:pathInfo.path, collapsed:true, field:field};
            if (angular.isDefined(selected[node.path])) {
                //node.collapsed = false;
                node.selected = true;
            }
            return node;
        }

        function _getParentNode(folder, field, pathInfo) {
            var parentNode = {level:folder.parent.length, root:folder.parent[0], path:folder.parentPath, children:[], childMap: {}, mime:'application/vnd.voyager.folder', id: folder.parentPath, collapsed:true, field:field};
            var name = parentNode.path;
            if (name.indexOf('/') !== -1) {
                name = name.split('/');
                name = name[name.length-1];
            }
            parentNode.display = name + ' (' + pathInfo.count + ')';
            return parentNode;
        }

        //structure is a flat hash of all nodes keyed by path, and also a hierarchy.  children reference back to the hash
        function _buildStructure(pathList, selected, field) {
            var nodes = {}, pathInfo;
            $.each(pathList, function(index, path) {
                pathInfo = _getPathInfo(path);
                var node = _getNode(pathInfo, selected, field);
                nodes[pathInfo.path] = node;
                //move backward up this path and build/add each node
                for(var i = pathInfo.folders.length-1; i > 1; i--) {
                    var folder = _getFolder(pathInfo.folders, i);
                    if(angular.isDefined(nodes[folder.parentPath])) {  //parent folder exists, add child
                        _addChild(folder,nodes, !node.selected, field);
                    } else {  //new parent folder
                        var parentNode = _getParentNode(folder, field, pathInfo);
                        nodes[parentNode.path] = parentNode;
                        if(angular.isDefined(selected[parentNode.path])) {
                            parentNode.selected = true;
                        }
                        parentNode.children.push(nodes[folder.path]);  //add the child
                        parentNode.childMap[folder.path] = nodes[folder.path];
                    }
                }
            });
            return nodes;
        }

        function _getSelected(filters) {
            var selected = {};
            filters = sugar.toArray(filters);
            if(angular.isDefined(filters)) {
                $.each(filters, function (key, value) {
                    if (value.indexOf('path_path') !== -1) {
                        var path = value.split(':')[1].replace(/\\/g, '');
                        selected[path] = path;
                    }
                });
            }
            return selected;
        }

        function _getNodesToExpand(name) {
            var path = name.split('/'), key = null, expanded = [];
            $.each(path, function(index, node) {
                if (key === null) {
                    key = node;
                } else {
                    key = key + '/' + node;
                }
                expanded.push(key);
            });
            return expanded;
        }

        //public methods - client interface
        return {

            updateTree: function(params, filterParams, bboxParams, filters) {
                var self = this;
                _setTree(params, filterParams, bboxParams).then(function() {
                    if (!_.isEmpty(_trees)) {
                        $.each(filters, function(index, filter) {
                            if (_isHierarchy(filter)) {
                                //var tree = _getTree(_trees[filter.field], _getSelected(params.fq), filter.field);
                                var structure = _buildStructure(_trees[filter.field], _getSelected(params.fq), filter.field);
                                var expanded = [];
                                $.each(structure, function(name, node) {
                                    if (node.selected && !node.loaded) {
                                        expanded = expanded.concat(_getNodesToExpand(name));
                                        self.loadNode(params, filterParams, bboxParams, filters, node);
                                    }
                                });
                                $.each(expanded, function(index, node) {
                                    structure[node].collapsed = false;
                                });
                                var tree = _.where(structure,{'level':1});
                                filter.values = [{tree:tree, filter: filter.field, style:filter.style}];
                            }
                        });
                    }
                });
            },

            loadNode: function(params, filterParams, bboxParams, filters, node) {
                node.loaded = true;
                var queryString = _getQueryString(params, filterParams, bboxParams);
                _queryNodeLevels(queryString,node.field, node.level + 1, node.path).then(function(data) {
                    var structure = _buildStructure(data,_getSelected(params.fq), node.field);
                    var children = _.where(structure,{'level':node.level + 1});
                    node.children = children;
                });
            },

            setTreeFields: function(fields) {
                _fields = fields;
            },

            getTree: function(filter) {
                return _tree[filter];
            }

        };

    });
