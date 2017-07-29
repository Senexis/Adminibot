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

const CONST_CATEGORY_GENERAL = 'General';

// This is where all the commands go.
var Commands = [];

Commands.push(new Command(CONST_CATEGORY_GENERAL, 'Help', 'Displays the help message.', ['help'], 1, function(userstate, messageArray) {
  console.log(userstate);
  return `Enter help text here.`;
}));

Commands.push(new Command(CONST_CATEGORY_GENERAL, 'Help2', 'Displays the help message2.', ['help2'], 1, function(userstate, messageArray) {
  console.log(userstate);
  return `Enter help text here.`;
}));

export default Commands;
