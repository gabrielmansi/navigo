'use strict';

angular.module('voyager.tagging').
    factory('tagService', function ($http, $q, $location, queryBuilder, sugar, solrUtil, config, solrGrunt) {

        function _save(field, value, query, mode) {
            if (angular.isUndefined(mode)) {
                mode = 'REPLACE';
            }
            var service = solrUtil.toSolrQuery('solr/v0/usertag',query);
            var val = sugar.toArray(value);
            if(mode === 'REMOVE') {
                val = null;
            }
            var updateMode = 'UPDATE_DOCUMENT';  //update the docs now
            var formBody = {
                'params': {
                    'update': updateMode,
                    'tags': [{'field': field, 'value': val, 'mode': mode}]
                }
            };

            return $http.post(service, formBody).then(function(response) {
                return response.data.tagging;
            });
        }

        function _fetchTags(field) {
            var deferred = $q.defer();
            var service = config.root + 'solr/usertags/select?q=*:*&rows=0&facet=true&facet.field=fss_tag_' + field + '&facet.mincount=1&facet.limit=1000&wt=json&json.wrf=JSON_CALLBACK&rand=' + Math.random();
            $http.jsonp(service).then(function(response) {
                var tags = response.data.facet_counts.facet_fields['fss_tag_' + field];
                tags = _.reject(tags, function(val){ return _.isNumber(val);});
                deferred.resolve(tags);
            });
            return deferred.promise;
        }

        return {

            save: function (id, field, value, action) {
                return _save(field, value, {fq:'id:' + id}, action);
            },

            fetch: function(id) {
                var service = config.root + 'solr/usertags/select?q=*:*&fq=id:' + id + '&sort=when%20desc&wt=json&json.wrf=JSON_CALLBACK&rand=' + Math.random();
                return $http.jsonp(service);
            },

            delete: function(pk) {
                var service = config.root + 'api/rest/tag/remove/' + pk;
                return $http.delete(service);
            },

            lookup: function(id, field) {
                var deferred = $q.defer();

                this.fetch(id).then(function(res) {
                    var tags = res.data.response.docs;
                    deferred.resolve(_.find(tags, {field: field}));
                });

                return deferred.promise;
            },

            deleteByField: function(id, field) {
                return this.save(id, field, '', 'REMOVE');
            },

            saveLabels: function(id, value) {
                if(_.isEmpty(value)) {
                    this.deleteByField(id,'tag_tags');
                } else {
                    return this.save(id, 'tag_tags', value);
                }
            },

            replace: function (id, field, value) {
                return this.save(id, field, value, 'REPLACE');
            },

            fetchTags: function() {
                return _fetchTags('tags');
            },

            fetchFlags: function() {
                return _fetchTags('flags');
            },

            saveBulkField: function(tagValue, field, docId) {
                var query;
                if (angular.isDefined(docId)) {
                    query = {fq:'id:' + docId};
                } else {
                    query = solrGrunt.getSolrParams($location.search());
                }
                return _save(field, tagValue, query);
            },

            removeBulkField: function(field) {
                return _save(field, '', $location.search(), 'REMOVE');
            }
        };

    });
