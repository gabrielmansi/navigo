/// <reference path="../ts-reference.ts" />

declare var angular;

namespace VoyagerHome {
  export function init() {
    angular.module('voyager.home').component('vsQuickLinks', new QuickLinks());
  }
}

VoyagerHome.init();