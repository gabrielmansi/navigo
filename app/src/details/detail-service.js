/*global angular */

angular.module('voyager.details').
    factory('detailService', function($http, config, $q, resultsDecorator) {

        'use strict';

        var _type = '&wt=json&json.wrf=JSON_CALLBACK&block=false';
        var _translation = {};
        var _recentViews = [];
        var _fields = {};

        var buildRequest = function(id, displayFields, shard, disp) {
            var service = config.root + 'solr/v0/select?q=id:' + id;
            var fields = '&fl=id,name:[name],fullpath:[absolute],thumb:[thumbURL],preview:[previewURL],download:[downloadURL],bbox,format,hasMetadata,root,tree,tag_tags,links,geo:[geo],hasMissingData,schema,layerURL:[lyrURL]';
            fields += displayFields;
            var shards = '';
            if (angular.isDefined(shard)) {
                shards = '&shards.info=true&shards.tolerant=true&shards=' + shard;
            }

            return service + fields + shards + _type + '&rand=' + Math.random() + '&disp=' + disp; // avoid browser caching?;
        };

        function _buildTreeRequest(id, shard) {
            var service = config.root + 'solr/v0/select?q=id:' + id;
            var fields = '&fl=tree, format, id';
            var shards = '';
            if (angular.isDefined(shard)) {
                shards = '&shards.info=true&shards.tolerant=true&shards=' + shard;
            }
            return service + fields + shards + _type;
        }

        function _buildRelationshipRequest(id, shard, type, direction, displayFields) {
            var service = config.root + 'solr/v0/select?links.' + direction + '=' + id + ':' + type;
            var fields = '&fl=id,name:[name],path:[absolute],thumb:[thumbURL],preview:[previewURL],download:[downloadURL],bbox, format, hasMetadata, root, tree, tag_tags, links, hasMissingData';
            fields += displayFields;
            var shards = '';
            if (angular.isDefined(shard)) {
                shards = '&shards.info=true&shards.tolerant=true&shards=' + shard;
            }
            return service + fields + shards + _type;
        }

        function _fetchTranslation() {
            if (_.isEmpty(_translation)) {
                return $http.get(config.root + 'api/rest/i18n/links?block=false').then(function(res) {
                    _translation = res.data;
                    return _translation;
                });
            } else {
                return $q.when(_translation);
            }
        }

        function _translate(relationships, direction) {
            return _fetchTranslation().then(function(translation) {
                _.each(relationships, function(relationship) {
                    relationship.name = translation[direction][relationship.type];
                });
                return relationships;
            });
        }

        function _fetchToTypes() {
            return _fetchTranslation().then(function(types) {
                return types.to;
            });
        }

        function _fetchRelationship(id, shard, type, direction, fields) {
            var deferred = $q.defer();
            var request = _buildRelationshipRequest(id, shard, type, direction, fields);
            $http.jsonp(request).then(function(res) {
                var docs = res.data.response.docs;
                if(angular.isDefined(docs) && docs.length > 0) {
                    deferred.resolve(res.data.response);
                } else {
                    deferred.reject(id + ' not found');
                }
            });
            return deferred.promise;
        }

        function _fetchLink(relationship, id, shard, type, direction, fields) {
            return _fetchRelationship(id, shard, type, direction, fields).then(function(response) {
                var docs = response.docs;
                resultsDecorator.decorate(docs, []);
                relationship.numFound += response.numFound;
                $.merge(relationship.values,docs);
                return relationship;
            }, function() {  //not found
                return relationship;
            });
        }

        function _getRelationship(relationships, name, type) {
            var relationship = relationships[type];
            if(!relationship) {
                relationship = {name:name, type:type, values:[], numFound:0};
                relationships[type] = relationship;
            }
            return relationship;
        }

        function _getFields() {
            if(_.isEmpty(_fields)) {
                var request = config.root + 'solr/fields/select?fl=name,multivalued,disp:disp_en,stype,displayable' + _type + '&rows=100000';
                return $http.jsonp(request).then(function(res) {
                    _fields = _.indexBy(res.data.response.docs,'name');
                    return _fields;
                });
            } else {
                return $q.when(_fields);
            }
        }

        return {
            lookup: function(id, fields, shard, disp) {
                var promises = [];
                promises.push(_getFields());
                var request = buildRequest(id, fields, shard, disp);
                promises.push($http.jsonp(request));
                return $q.all(promises).then(function(result) {
                    return result[1];
                });
            },
            fetchTree: function(id, shard) {
                var deferred = $q.defer();
                var request = _buildTreeRequest(id, shard);
                $http.jsonp(request).then(function(res) {
                    var docs = res.data.response.docs;
                    if(angular.isDefined(docs) && docs.length > 0) {
                        deferred.resolve(docs[0]);
                    } else {
                        deferred.reject(id + ' not found');
                    }
                });
                return deferred.promise;
            },

            fetchToRelationships: function(id, fields, shard) {
                var relationships = {}, promises = [], deferred = $q.defer();

                _fetchToTypes().then(function(types) {
                    _.each(types, function(name, type) {
                        var relationship = _getRelationship(relationships, name, type);
                        var promise = _fetchLink(relationship, id, shard, type, 'to', fields);
                        promises.push(promise);
                    });

                    $q.all(promises).then(function () {
                        deferred.resolve(relationships);
                    });
                });

                return deferred.promise;
            },

            fetchFromRelationships: function(doc, fields, shard) {
                var relationships = {}, links = [], promises = [];

                if(angular.isDefined(doc.links)) {
                    links = JSON.parse(doc.links).links;
                }
                _.each(links, function(link) {
                    var relationship = _getRelationship(relationships, link.relation, link.relation);
                    var promise = _fetchLink(relationship, doc.id, shard, link.relation, 'from', fields);
                    promises.push(promise);
                });

                return $q.all(promises).then(function () {
                    return _translate(relationships,'from');
                });
            },

            addRecent: function (doc) {
                var exists = _.findIndex(_recentViews, {id:doc.id}) !== -1;

                if (!exists) {
                    _recentViews.push(doc);
                }
                if (_recentViews.length > 5) {
                    _recentViews.splice(0, 1);
                }
            },

            getRecent: function () {
                return _recentViews.slice();
            },

            getFields: function() {
                return _fields;
            }
        };

    });
