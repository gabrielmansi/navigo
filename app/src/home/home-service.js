'use strict';

angular.module('voyager.home')
    .service('homeService', function(config, $http, $q, featureQuery, collectionsQuery) {

        //TODO configService should preload on ui route resolve to guarantee its loaded before this

        function _collectionsAction() {
            if(config.homepage && config.homepage.showSidebarLinks) {
                return collectionsQuery.execute();
            } else {
                return $q.when(null);
            }
        }

        function _featuredAction() {
            return featureQuery.execute();
        }

        function _fetchSection(section, action) {
            return action();
        }

        function _fetchODPConfig() {
          var endpoint = config.homepage.odpHomepageConfig;
          return $http.get(endpoint);
        }

        return {
            fetchCollections: function() {
                return _fetchSection('collections', _collectionsAction);
            },
            fetchFeatured: function() {
                return _fetchSection('featured', _featuredAction);
            },
            getFeaturedQuery: function() {
                return featureQuery.getFeatureQuery();
            },
          getODPConfig: function() {
              return _fetchODPConfig();
          }
        };

    });

