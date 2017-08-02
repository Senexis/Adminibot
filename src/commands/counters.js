// Our Command object definition.
const Command = function(category, displayName, description, staticArgs, maxArgs, action) {
  this.Category = category;
  this.DisplayName = displayName;
  this.Description = description;
  this.StaticArgs = staticArgs;
  this.MaxArgs = maxArgs;
  this.Action = action; // action(userstate, messageArray)
};

// Our CommandError object definition.
const CommandError = function(category, displayName, message, exception) {
  this.Category = category;
  this.DisplayName = displayName;
  this.Message = message;
  this.Exception = exception;
};

var CONST_CATEGORY_COUNTERS = 'Counters';

// This is where all the commands go.
var Commands = [];

// Commands.push(new Command(CONST_CATEGORY_COUNTERS, 'Command', 'Description of the command.', ['command'], 1, function(userstate, messageArray) {
//   return `Enter the command response here.`;
// }));

export default Commands;
