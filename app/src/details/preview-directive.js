'use strict';
angular.module('voyager.details')
	.directive('vsPreview', function(detailService, $timeout, translateService, loading, detailConfig){
		return {
			restrict: 'A',
			link: function($scope, element) {

				function _lookup(id, shard, el) {
					_positionPreview(el);
					$scope.previewLoading = true;
					loading.show('#previewLoading');
					$scope.node = {};
					detailService.lookup(id, '', shard).then(function (data) {
						$scope.node = data.data.response.docs[0];
						if ($scope.node === undefined) {
							$('#preview').css({'display': 'none'});
							return;
						}

						$scope.previewNodeData = detailConfig.getFields(data.data.response.docs[0], detailService.getFields());
						if(angular.isDefined(data.data.response.docs[0].format)) {
							$scope.node.displayFormat = translateService.getType(data.data.response.docs[0].format);
						}

						$scope.previewLoading = false;
						loading.done();
					});
				}

				function _positionPreview(el) {
					var cp = el.offset(),
						parentOffset = el.parents('.relationship').offset();
					$('#preview').css({'display': 'block', 'left': parseInt(cp.left - parentOffset.left + el.parents('div').width() - 20) + 'px', 'top': parseInt(cp.top - parentOffset.top - 22) + 'px'});
				}

				element.on('mouseenter', '.label a', function(event) {
					$scope.node = {};
					var el = $(event.currentTarget);
					this.timeoutPromise = $timeout(function() {
						_lookup(el.data('id'), el.data('shard'), el);
					}, 100);
				}).on('mouseleave', '.label a', function(){
					if (angular.isDefined(this.timeoutPromise)) {
						$timeout.cancel(this.timeoutPromise);
					}
					$('#preview').css({'display': 'none'});
				});
			}
		};
	});