'use strict';
angular.module('voyager.details')
    .controller('DetailsCtrl', function ($scope, $stateParams, cartService, translateService, authService, config, detailService, mapServiceFactory, leafletData,
                                         usSpinnerService, dialogs, $sce, $q, configService, $timeout, tagService, searchService, $location, $window, urlUtil, resultsDecorator,
                                         loading, detailConfig, $analytics, $uibModal, filterService, detailsActions, $log, converter) {

        var displayParams = '';
        var _layer;

        loading.show('#working');
        $scope.imagePrefix = config.root + 'vres/mime/icon/';
        $scope.showTab = '';

        $scope.demo = config.demo;
        $scope.rate = {};
        $scope.rate.current_rating = 0;
        $scope.rate.total_user = 0;
        $scope.rate.user_rated = false;
        $scope.labels = [];
        $scope.loading = true;
        $scope.disp = $stateParams.disp || 'default';
        $scope.hasRelationships = false;
        $scope.pageFramework = {};

        $scope.uiText = config.ui.details;

        $scope.showPath = detailConfig.showPath();
        $scope.showFormat = detailConfig.showFormat();

        var _tags = [];
        $scope.select2Options = {
            'multiple': true,
            'simple_tags': true
        };

        if (!_.isEmpty(config.homepage.tagValues)) {
            $scope.select2Options.data = converter.toIdTextArray(config.homepage.tagValues);
        } else {
            $scope.select2Options.tags = _tags;
        }

        function _setPermissions() {
            $scope.canEdit = authService.hasPermission('edit_fields') && $scope.isRemote !== true;
            $scope.canTag = authService.hasPermission('tag');
            $scope.canAdmin = authService.hasPermission('manage');
            $scope.canFlag = authService.hasPermission('flag');
            $scope.canViewTags = authService.hasPermission('view_tags');
            $scope.canViewMetadata = authService.hasPermission('show_metadata');
        }

        function _adjustForBanner() {
            $timeout(function() {
                var $banner = angular.element('#top-banner');
                if($banner.outerHeight() > 0) {
                    var $floatingNav = angular.element('.floating-nav');
                    if($floatingNav.length > 0) {
                        $floatingNav.offset({top: $floatingNav.offset().top + $banner.outerHeight()});
                    } else {
                        _adjustForBanner();
                    }
                }
            }, 250);
        }

        function _hasShard(shard) {
            return angular.isDefined(shard) && shard !== '[not a shard request]';
        }

        function _activate() {
            if (_hasShard($stateParams.shard)) {
                $scope.shard = $stateParams.shard;
                $scope.shardParam = '&shard=' + $stateParams.shard;
                $scope.shardsParam = '&shards=' + $stateParams.shard;
            }

            if(!$scope.pageFramework.showHeaderInfo && $location.path().indexOf('/search') > -1){
                angular.element('body').addClass('no-header');
            } else {
                angular.element('body').removeClass('no-header');
            }

            _doLookup($stateParams.id);
            detailService.fetchMetadataStyles($stateParams.id).then(function(styleSheets) {
                $scope.styleSheets = styleSheets;
            });

            _setPermissions();

            tagService.fetchTags().then(function(tags) {
                $.merge(_tags,tags);
            });

            authService.addObserver(_setPermissions);
        }

        _activate();

        // TODO ratings
        //$scope.$watch('rate.user_rating', function(){
        //    if ($scope.rate.user_rating && !$scope.rate.user_rated) {
        //        $scope.rate.user_rated = true;
        //        $scope.rate.total_user += 1;
        //        $scope.rate.current_rating = Math.round(($scope.rate.current_rating + $scope.rate.user_rating) / ($scope.rate.total_user));
        //    }
        //});

        function createFolderLinks(doc, url) {
            $scope.doc_path = {
                url: 'search?disp=' + $scope.disp + '&fq=location:' + doc.location,
                path: doc.fullpath.substring(0, doc.fullpath.indexOf(doc.folder.replace(/\//g, '\\')))
            };

            var tempFolders = doc.folder.split('/');
            _.each(tempFolders, function (item) {
                if (url !== '') {
                    url += '\/';
                }

                url += encodeURI(item);
                $scope.sub_paths.push({
                    path: item + '\\',
                    url: 'search?disp=' + $scope.disp + '&fq=path:' + url + '&fq=location:' + doc.location
                });
            });

            var filename = doc.fullpath.split('\\').pop();
            $scope.sub_paths.push({
                path: filename,
                url: 'search?disp=' + $scope.disp + '&fq=path:' + (url + '\/' + filename) + '&fq=location:' + doc.location
            });
        }

        function createDatasetLinks(doc) {
            var tempFolders = doc.fullpath.split('Dataset');

            if (tempFolders) {
                $scope.doc_path = {
                    url: 'search?disp=' + $scope.disp + '&fq=location:' + doc.location,
                    path: (tempFolders[0] + 'Dataset')
                };

                if (tempFolders[1]) {
                    var path = tempFolders[1].replace(/^[\/\\]/, '').replace(/\s[|]\s/g, '\\').replace(/\\/g, '%255C');
                    $scope.sub_paths.push({
                        path: tempFolders[1],
                        url: 'search?disp=' + $scope.disp + '&fq=location:' + doc.location + '&fq=path:' + path
                    });
                }
            }
        }

        function createPathLinks(doc) {
            $scope.isURL = doc.fullpath.indexOf('http:') === 0 || doc.fullpath.indexOf('https:') === 0;

            if (!$scope.isURL) {
                var url = '';
                $scope.sub_paths = [];

                if (doc.folder) {
                    createFolderLinks(doc, url);
                } else {
                    createDatasetLinks(doc);
                }
            }
        }

        function _doSyncFields(id) {
            detailService.lookup(id, ',*', $stateParams.shard, $stateParams.disp).then(function (data) {
                var doc = data.data.response.docs[0];
                $scope.displayFields = detailConfig.getFields(doc, detailService.getFields());
                $scope.summaryFields = detailConfig.getSummaryFields(doc, detailService.getFields());
            });
        }

        //function _refreshDoc(id) {
        //    detailService.lookup(id, ',*', $stateParams.shard, $stateParams.disp).then(function (data) {
        //        $scope.doc = data.data.response.docs[0];
        //    });
        //}

        function _doLookup(id) {
            detailService.lookup(id, ',*', $stateParams.shard, $stateParams.disp).then(function (data) {
                var doc = data.data.response.docs[0];
                resultsDecorator.decorate([doc], []);

                var shardInfo = data.data['shards.info'];
                if(shardInfo && doc.isRemote) {
                    _.each(shardInfo, function(shard) {
                        doc.remoteDetails = shard.shardAddress;
                        doc.remoteDetails = doc.remoteDetails.substring(0,doc.remoteDetails.indexOf('/solr'));
                        doc.remoteDetails += '/show?id=' + doc.id + '&disp=default';
                    });
                }
                $scope.doc = doc;
                $scope.image = doc.thumb;
                $scope.preview = doc.preview;
                if(angular.isUndefined(doc.preview)) {
                    $scope.preview = $scope.image;
                }

                $scope.download = doc.download;
                if(angular.isDefined(doc.format)) {
                    $scope.format = translateService.getType(doc.format);
                    $scope.doc.displayFormat = $scope.format;
                }

                $scope.displayFields = detailConfig.getFields(doc, detailService.getFields());
                $scope.summaryFields = detailConfig.getSummaryFields(doc, detailService.getFields());
                $scope.pageFramework = detailConfig.getPageFramework();
                $scope.summaryFlags = detailConfig.getSummaryFlags();
                $scope.description = doc.displayDescription;

                if (doc.fullpath) {
                    createPathLinks(doc);
                } else {
                    $scope.isURL = false;
                }

                if (doc.bbox) {
                    $scope.hasBbox = true;
                    //$scope.$broadcast('updateBbox', {'bbox': $scope.doc.bbox});
                }

                doc.hasSchema = angular.isDefined(doc.schema);
                if(doc.hasSchema) {
                    $scope.schema = JSON.parse(doc.schema);
                    $scope.schemaLink = 'search?disp=' + $scope.disp + '&fq=schema_hash:' + $scope.schema.hash;
                }

                $scope.doc.isMappable = mapServiceFactory.isMappable(doc.format);
                $scope.doc.isService = $scope.doc.isMappable;

                $scope.showMap = $scope.hasBbox || $scope.doc.isMappable;

                $scope.getAction = 'Download';

                $scope.recent = detailService.getRecent();
                resultsDecorator.decorate($scope.recent, []);

                detailService.addRecent($scope.doc);

                if(doc.hasMetadata && $scope.canViewMetadata) {
                    _setStyle();
                }

                if(angular.isDefined(doc.tag_tags)) {
                    $scope.select2Options.tags = doc.tag_tags;
                    $scope.labels = doc.tag_tags;
                }

                $scope.getRelationships();
                _setSelectedTab();

                loading.done();
                $timeout(function() {
                    $scope.loading = false;
                    if($scope.doc.isMappable) {
                        // TODO this can cause the page to lock up for large services - example below
                        // https://services1.arcgis.com/IAQQkLXctKHrf8Av/arcgis/rest/services/Designated_Wilderness/FeatureServer/0/query?returnGeometry=true&where=1%3D1&outSr=4326&outFields=*&inSr=4326&geometry=%7B%22xmin%22%3A-180%2C%22ymin%22%3A-85.05112877980659%2C%22xmax%22%3A180%2C%22ymax%22%3A85.0511287798066%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&geometryPrecision=6&f=geojson
                        $scope.addToMap();
                    }
                },100);

                if(angular.isDefined($scope.doc.thumb) && $scope.doc.thumb.indexOf('vres/mime') !== -1) {
                    doc.defaultThumb = true;
                }

                $scope.doc.canCart = authService.hasPermission('process');

                $scope.actions = detailsActions.getActions($scope.doc, $scope);

                var addAction = _.find($scope.actions, {'action': 'add'});
                $scope.canCart = $scope.doc.canCart && !$scope.isRemote && addAction.visible;

                // don't show add action in drop down.  Has its own button.  Visible by canCart above.
                addAction.visible = false;

                cartService.fetchQueued([{id:doc.id}]).then(function(items) {
                    doc.inCart = items.length > 0;
                });

                _adjustForBanner();
            });
        }

        function _setStyle() {
            $scope.theme = {};
            $scope.theme.selected = detailConfig.getDefaultMetadataStylesheet() || config.metadataStyle;
            $scope.$watch('theme.selected', function() {
                // TODO - root was unused below - remove?
                //var shard = $stateParams.shard;
                //var root = config.root;
                //if (_hasShard(shard)) {
                //    root = shard.substring(0,shard.indexOf('solr'));
                //    if (root.indexOf('http') === -1) {  //TODO what if its https? how to determine
                //        root = 'http://' + root;
                //    }
                //}

                $scope.metadataUrl = $scope.doc.content;

                if($scope.metadataUrl) {
                    if (($scope.metadataUrl.indexOf('/', $scope.metadataUrl.length - 1)) === -1) {
                        $scope.metadataUrl += '/';
                    }

                    $scope.metadataUrl += 'meta.xml?style=' + $scope.theme.selected;

                    if (_hasShard($scope.doc.shard)) {
                        $scope.metadataUrl += '&shard=' + $scope.doc.shard;
                    }
                }

            });
        }

        $scope.openOnRemote = function() {
            // TODO what to do here to authenticate to the remote?
            // TODO what about display config?
            $window.open($scope.doc.remoteDetails, '_blank');
        };

        $scope.addToCart = function () {
            $scope.doc.inCart = true;
            cartService.addItem($scope.doc);
        };

        $scope.removeFromCart = function () {
            $scope.doc.inCart = false;
            cartService.remove($scope.doc.id);
        };

        $scope.inCart = function (id) {
            return cartService.isInCart(id);
        };

        $scope.showEditTag = false;
        $scope.toggleEditTag = function() {
            $scope.showEditTag = !$scope.showEditTag;
        };

        function _showError(error) {
            var message = null;
            if(angular.isDefined(error.details)) {
                message = error.details[0];
            }
            dialogs.error(error.message, message);
        }

        $scope.addToMap = function () {
            if($scope.addedToMap) {
                return false;
            }
            $timeout(function() {  //wait for scope to digest so map is ready
                leafletData.getMap('details-map').then(function(map) {
                    var mapInfo = _.clone($scope.doc);
                    var mapService = mapServiceFactory.getMapService(mapInfo);
                    mapService.addToMap(mapInfo, map).then(function(layer) {
                        if(layer.isValid !== false) {
                            layer.on('loading', function() {
                                //if(loaded === false) {
                                usSpinnerService.spin('map-spinner');
                                //}
                            });
                            usSpinnerService.stop('map-spinner');
                            layer.on('load', function() {
                                $scope.addedToMap = true;
                                _layer = layer;
                                usSpinnerService.stop('map-spinner');
                            });

                        } else {
                            usSpinnerService.stop('map-spinner');
                            _showError(layer.error);
                        }
                    }, function(error) {
                        usSpinnerService.stop('map-spinner');
                        _showError(error.error);
                    });
                    map.invalidateSize(false);  //workaround when initially hidden
                });

            });
        };

        $scope.removeFromMap = function() {
            leafletData.getMap('details-map').then(function(map) {
                map.removeLayer(_layer);
                $scope.addedToMap = false;
                _layer = null;
            });
        };

        $scope.trustSrc = function(src) {
            return $sce.trustAsResourceUrl(src);
        };

        $scope.metadataSelect = function() {
            window.scrollTo(0,document.body.scrollHeight);
        };

        function _flagMissing(nodes) {
            var format, node;
            for(var i=0; i<nodes.length; i++) {
                node = nodes[i];
                format = node.mime;
                node.hasMissingData = angular.isDefined(format) && format.indexOf('missing') !== -1;
                if(node.children) {
                    _flagMissing(node.children);
                }
            }
        }

        $scope.getRelationships = function() {
            var root = $scope.doc.id;

            if(angular.isDefined($scope.doc.root)) {
                root = $scope.doc.root;
            }

            detailService.fetchTree(root,$stateParams.shard).then(function(response) {
                if(angular.isDefined(response.tree)) {
                    var tree = JSON.parse(response.tree);
                    if(tree.children) {
                        _flagMissing(tree.children);
                    }
                    $scope.tree = [
                        {
                            //label: tree.name,
                            mime: response.format,
                            name: tree.name,
                            id: tree.id,
                            children: tree.children
                        }
                    ];

                    $scope.hasRelationships = true;
                    _setSelectedTab();
                }
            });

            detailService.fetchToRelationships($scope.doc.id, displayParams, $stateParams.shard).then(function(relationships) {
                _applyRelationships(relationships, 'relationships');
            });

            detailService.fetchFromRelationships($scope.doc, displayParams, $stateParams.shard).then(function(relationships) {
                _applyRelationships(relationships, 'fromRelationships');
            });
        };

        function _applyRelationships(relationships, type) {
            if (!$.isEmptyObject(relationships)) {
                _.each(relationships, function(obj) {
                    if (obj.values && obj.values.length > 0) {
                        $scope[type] = relationships;
                        $scope.hasRelationships = true;
                        _setSelectedTab();
                        return false;
                    }
                });
            } else {
                $log.log('no result');
            }
        }

        function _setSelectedTab() {
            if(!$scope.showTab) {
                if ($scope.displayFields.length) {
                    $scope.showTab = 'summary';
                } else if ($scope.doc.hasMetadata && $scope.canViewMetadata) {
                    $scope.showTab = 'metadata';
                } else if ($scope.hasRelationships) {
                    $scope.showTab = 'relationship';
                }
            }
        }

        $scope.fetchPreview = function(node) {
            $scope.previewVisible = true;
            node.promise = $timeout(function() {
                detailService.fetchTreePreview(node.id, $stateParams.shard).then(function(preview) {
                    $scope.previewNodeData = preview.data.response.docs[0];
                });
            }, 150);
        };

        $scope.cancelPreview = function(node) {
            $scope.previewVisible = false;
            $timeout.cancel(node.promise);
        };

        $scope.changeTab = function(tab) {
            if ($scope.showTab !== tab) {
                $scope.showTab = tab;

                if (tab === 'relationship' && $scope.tree === undefined) {
                    $scope.getRelationships();
                }
            }
        };

        $scope.edit = function(field) {
            field.editing = true;
            field.originalValue = field.value;
            field.originalFormatted = field.formattedValue;
        };

        $scope.append = function(field) {
            field.appending = true;
        };

        $scope.cancel = function(field) {
            field.editing = false;
            field.appending = false;
            field.value = field.originalValue;
            field.formattedValue = field.originalFormatted;
        };

        $scope.isArray = function(data) {
            return _.isArray(data);
        };

        $scope.doSave = function(field) {
            if(field.isArray && !_.isArray(field.value)) {
                var values = field.value.split(','), edits = [];
                _.each(values, function(val) {
                    edits.push(val.trim());
                });
                field.value = edits;
            }
            tagService.replace($scope.doc.id, field.key, field.value).then(function () {
                field.editing = false;

                $timeout(function() {
                    _doSyncFields($scope.doc.id);
                }, 200);
            });
        };

        function _getId() {
            var temp = $location.path().split('/');
            return decodeURIComponent(temp[temp.length-1]);
        }

        function _move(direction, doc) {
            var flag = 'no' + direction;
            if(doc !== null) {
                $scope[flag] = false;
                var encodedId = encodeURIComponent(encodeURIComponent(doc.id));  // TODO it doesn't work with just 1 encode
                var detailsUrl = 'show?id= ' + encodedId + '&disp=' + configService.getConfigId();
                if (_hasShard(doc.shard)) {
                    detailsUrl += '&shard=' + doc.shard;
                }
                $window.location.href = detailsUrl;
                return true;
            } else {
                $scope[flag] = true;
                return false;
            }
        }

        $scope.lastSearch = urlUtil.getLastUrl();
        $scope.hasRecords = searchService.hasRecords();

        $scope.getPrevious = function() {
            var id = searchService.getPreviousId(_getId());
            if (_move('Previous', id)) {
                $scope.noNext = false;
            }
        };

        $scope.getNext = function() {
            usSpinnerService.spin('nav-spinner');
            searchService.getNextId(_getId()).then(function(id) {
                if (_move('Next', id)) {
                    $scope.noPrevious = false;
                }
                usSpinnerService.stop('nav-spinner');
            });
        };

        $scope.showFlagModal = function() {
            var modal = $uibModal.open({
                templateUrl: 'src/bulk-update/flag-all.html',
                controller: 'FlagAllCtrl',
                resolve: {
                    resultData: function () {
                        return {
                            totalItemCount: 1,
                            docId: $scope.doc.id
                        };
                    }
                }
            });

            modal.result.then(function() {
                _doLookup($stateParams.id);
            });
        };

        $scope.removeFlag = function() {
            tagService.deleteByField($scope.doc.id, 'tag_flags').then(function(res) {
                if(res.documents > 0) {
                    delete $scope.doc.tag_flags;
                }
                //_refreshDoc($scope.doc.id); // tagging is async through the pipeline, we need a push notification when it's done
            });
        };

        $scope.searchFlag = function(tag) {
            return _searchTag('tag_flags', tag);
        };

        $scope.searchTag = function(tag) {
            return _searchTag('tag_tags', tag);
        };

        function _searchTag(tagField, value) {
            $location.path('search');
            $location.search('fq', tagField + ':' + value);
            filterService.setFilters({'fq' : tagField + ':' + value});
            $scope.$emit('filterEvent');
            return false;
        }

        $scope.$on('$destroy', function() {
            authService.removeObserver(_setPermissions);
        });
    });