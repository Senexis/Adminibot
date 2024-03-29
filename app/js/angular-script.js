var app = angular.module('adminibot', ["ngRoute"]);

app.config(function($routeProvider, $locationProvider) {
  $routeProvider.
  when('/', {
    templateUrl: 'pages/dashboard.html',
    activetab: "dashboard",
    controller: "dashboardController"
  }).
  when('/announcements', {
    templateUrl: 'pages/announcements.html',
    activetab: "announcements"
  }).
  when('/authorization', {
    templateUrl: 'pages/authorization.html',
    activetab: "authorization"
  }).
  when('/commands', {
    templateUrl: 'pages/commands.html',
    activetab: "commands"
  }).
  when('/counters', {
    templateUrl: 'pages/counters.html',
    activetab: "counters"
  }).
  when('/currency', {
    templateUrl: 'pages/currency.html',
    activetab: "currency"
  }).
  when('/events', {
    templateUrl: 'pages/events.html',
    activetab: "events"
  }).
  when('/games', {
    templateUrl: 'pages/games.html',
    activetab: "games"
  }).
  when('/giveaways', {
    templateUrl: 'pages/giveaways.html',
    activetab: "giveaways"
  }).
  when('/moderation', {
    templateUrl: 'pages/moderation.html',
    activetab: "moderation"
  }).
  when('/polls', {
    templateUrl: 'pages/polls.html',
    activetab: "polls"
  }).
  when('/queues', {
    templateUrl: 'pages/queues.html',
    activetab: "queues"
  }).
  when('/quotes', {
    templateUrl: 'pages/quotes.html',
    activetab: "quotes"
  }).
  when('/settings', {
    templateUrl: 'pages/settings.html',
    activetab: "settings"
  }).
  otherwise({
    redirectTo: '/',
    activetab: "dashboard"
  });
}).run(function($rootScope, $route) {
  $rootScope.$route = $route;
  $rootScope.initialize = function() {
    if ($('select.select2')[0]) {
      var select2parent = $('.select2-parent')[0] ? $('.select2-parent') : $('body');

      $('select.select2').select2({
        dropdownAutoWidth: true,
        width: '100%',
        dropdownParent: select2parent
      });
    }
  }
});

app.controller("dashboardController", function ($scope) {
  var appVersion = require('electron').remote.app.getVersion();
  $scope.test = appVersion;

  $scope.stats = {
    followers: 12345,
    viewers: 1234,
    views: 12345678,
    subscribers: 123
  }

  $scope.stream = {
    title: 'test',
    game: 'test',
    delay: 0,
    channelFeedEnabled: true
  };

  $scope.commercials = {
    autoEnabled: false,
    autoTimeHours: 1,
    autoTimeMinutes: 0,
    autoTimeSeconds: 0,
    autoTimeLength: '30s',
    autoNotifyDesktop: false,
    autoNotifyChat: true
  }
});
