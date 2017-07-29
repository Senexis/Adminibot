angular.module('adminibot', ["ngRoute"]).
config(function ($routeProvider, $locationProvider) {
    $routeProvider.
        when('/', { templateUrl: 'pages/dashboard.html', activetab: "dashboard" }).
        when('/commands', { templateUrl: 'pages/commands.html', activetab: "commands" }).
        when('/moderation', { templateUrl: 'pages/moderation.html', activetab: "moderation" }).
        when('/timers', { templateUrl: 'pages/timers.html', activetab: "timers" }).
        when('/quotes', { templateUrl: 'pages/quotes.html', activetab: "quotes" }).
        when('/counters', { templateUrl: 'pages/counters.html', activetab: "counters" }).
        when('/giveaways', { templateUrl: 'pages/giveaways.html', activetab: "giveaways" }).
        when('/currency', { templateUrl: 'pages/currency.html', activetab: "currency" }).
        when('/polls', { templateUrl: 'pages/polls.html', activetab: "polls" }).
        when('/games', { templateUrl: 'pages/games.html', activetab: "games" }).
        when('/events', { templateUrl: 'pages/events.html', activetab: "events" }).
        when('/queues', { templateUrl: 'pages/queues.html', activetab: "queues" }).
        when('/announcements', { templateUrl: 'pages/announcements.html', activetab: "announcements" }).
        otherwise({ redirectTo: '/', activetab: "dashboard"});
}).run(function ($rootScope, $route) {
    $rootScope.$route = $route;
});
