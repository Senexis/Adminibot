// Our full list of commands.
var Commands = [];

// Our Command object definition.
var Command = function(category, displayName, description, staticArgs, maxArgs, action) {
  this.Category = category;
  this.DisplayName = displayName;
  this.Description = description;
  this.StaticArgs = staticArgs;
  this.MaxArgs = maxArgs;
  this.Action = action;
};

// Our CommandError object definition.
var CommandError = function(category, displayName, message, exception) {
  this.Category = category;
  this.DisplayName = displayName;
  this.Message = message;
  this.Exception = exception;
};

// To make things easier in the long run, we define all categories here so we can change names in the future, need be.
var CONST_CATEGORY_GENERAL =        "General";
var CONST_CATEGORY_COMMANDS =       "Commands";
var CONST_CATEGORY_TIMERS =         "Timer";
var CONST_CATEGORY_QUOTES =         "Quotes";
var CONST_CATEGORY_COUNTERS =       "Counters";
var CONST_CATEGORY_GIVEAWAYS =      "Giveaways";
var CONST_CATEGORY_CURRENCY =       "Currency";
var CONST_CATEGORY_POLLS =          "Polls";
var CONST_CATEGORY_GAMES =          "Games";
var CONST_CATEGORY_EVENTS =         "Events";
var CONST_CATEGORY_QUEUES =         "Queues";
var CONST_CATEGORY_ANNOUNCEMENTS =  "Announcements";
var CONST_CATEGORY_MODERATION =     "Moderation";
var CONST_CATEGORY_OTHER =          "Miscellaneous";

// We expect an array here. We can save time by checking the message has a '!' first this way.
var ProcessCommand = function(input) {
  for (var c in Commands) {
    var command = Commands[c];
    if (input.length <= command.MaxArgs) {
      if (CompareArrays(command.StaticArgs, input.slice(0, command.StaticArgs.length))) {
        ProcessMessage(command.Action(null, [input]));
      }
    }
  }
}

// The following is provided by Tomáš Zato (https://stackoverflow.com/a/14853974). Thanks!
var CompareArrays = function(array1, array2) {
  // Do both arrays exist?
  if (!array1 || !array2) {
    return false;
  }

  // Are both arrays the same length?
  if (array1.length != array2.length) {
    return false;
  }

  // Iterate over the arrays to check them to be the same.
  for (var i = 0, l = array1.length; i < l; i++) {
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      if (!array1[i].equals(array2[i])) {
        return false;
      }
    } else if (array1[i] != array2[i]) {
      return false;
    }
  }

  // If we didn't return by now, they are most likely the same.
  return true;
}

// This checks whether the message is a string and if so post it to chat. If not, It's probably an error.
var ProcessMessage = function(input) {
  if (typeof input === 'string') {
    console.log(input);
  } else if (typeof input === 'object' && input.constructor.name === 'CommandError') {
    console.error(`The command "${input.DisplayName}" returned "${input.Message}".`);
    console.error(input.Exception)
    console.error(input);
  } else {
    console.warn("The command didn't return anything?");
    console.warn(input);
    console.warn(typeof input);
  }
}
