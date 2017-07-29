const ipc = require('electron').ipcMain;
const irc = require('tmi.js');
const argsplit = require('argsplit');
const settings = require('electron-settings');

import path from 'path';
import url from 'url';
import { app } from 'electron';
import createWindow from './helpers/window';
import env from './env';

if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    show: false
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
});

app.on('window-all-closed', () => {
  app.quit();
});

// Commands stuffs
// To make things easier in the long run, we define all categories here so we can change names in the future, need be.
// var CONST_CATEGORY_COMMANDS = "Commands";
// var CONST_CATEGORY_TIMERS = "Timer";
// var CONST_CATEGORY_QUOTES = "Quotes";
// var CONST_CATEGORY_COUNTERS = "Counters";
// var CONST_CATEGORY_GIVEAWAYS = "Giveaways";
// var CONST_CATEGORY_CURRENCY = "Currency";
// var CONST_CATEGORY_POLLS = "Polls";
// var CONST_CATEGORY_GAMES = "Games";
// var CONST_CATEGORY_EVENTS = "Events";
// var CONST_CATEGORY_QUEUES = "Queues";
// var CONST_CATEGORY_ANNOUNCEMENTS = "Announcements";
// var CONST_CATEGORY_MODERATION = "Moderation";
// var CONST_CATEGORY_OTHER = "Miscellaneous";

import generalCommands from './commands/general';

let Commands = [];
Commands = Commands.concat(generalCommands);

// We expect an array here. We can save time by checking the message has a '!' first this way.
let ProcessCommand = function(userstate, input) {
  for (var c in Commands) {
    var command = Commands[c];
    if (input.length <= command.MaxArgs) {
      if (CompareArrays(command.StaticArgs, input.slice(0, command.StaticArgs.length))) {
        ProcessMessage(command.Action(userstate, input));
        return;
      }
    }
  }
}

// The following is provided by Tomáš Zato (https://stackoverflow.com/a/14853974). Thanks!
let CompareArrays = function(array1, array2) {
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
let ProcessMessage = function(input) {
  if (typeof input === 'string') {
    console.log(input);
    IrcClient.say("Adminibot", input).catch(function(err) {
        console.error(err);
    });
  } else if (typeof input === 'object' && input.constructor.name === 'CommandError') {
    console.error(`The command "${input.DisplayName}" returned "${input.Message}".`);
    console.error(input.Exception)
    console.error(input);
  } else {
    console.warn("The command didn't return anything?");
    console.warn(typeof input);
    console.warn(input);
  }
}

// Global IRC Stuff
var options = {
    connection: {
        reconnect: true
    },
    channels: ["Adminibot"]
};

let IrcClient = new irc.client(options);

// IRC Functions
ipc.on('executeAction', (event, arg) => {
  IrcClient.action(arg.channel, arg.message);
});

ipc.on('executeBan', (event, arg) => {
  IrcClient.ban(arg.channel, arg.username, arg.reason);
});

ipc.on('executeClear', (event, arg) => {
  IrcClient.clear(arg.channel);
});

ipc.on('executeColor', (event, arg) => {
  IrcClient.color(arg.color);
});

ipc.on('executeCommercial', (event, arg) => {
  IrcClient.commercial(arg.channel, arg.seconds);
});

ipc.on('executeConnect', (event, arg) => {
  IrcClient.connect();
});

ipc.on('executeDisconnect', (event, arg) => {
  IrcClient.disconnect();
});

ipc.on('executeEmoteonly', (event, arg) => {
  IrcClient.emoteonly(arg.channel);
});

ipc.on('executeEmoteonlyoff', (event, arg) => {
  IrcClient.emoteonlyoff(arg.channel);
});

ipc.on('executeFollowersonly', (event, arg) => {
  IrcClient.followersonly(arg.channel, arg.length);
});

ipc.on('executeFollowersonlyoff', (event, arg) => {
  IrcClient.followersonlyoff(arg.channel);
});

ipc.on('executeHost', (event, arg) => {
  IrcClient.host(arg.channel, arg.target);
});

ipc.on('executeJoin', (event, arg) => {
  IrcClient.join(arg.channel);
});

ipc.on('executeMod', (event, arg) => {
  IrcClient.mod(arg.channel, arg.username);
});

ipc.on('executeMods', (event, arg) => {
  IrcClient.mods(arg.channel);
});

ipc.on('executePart', (event, arg) => {
  IrcClient.part(arg.channel);
});

ipc.on('executePing', (event, arg) => {
  IrcClient.ping();
});

ipc.on('executeR9kbeta', (event, arg) => {
  IrcClient.r9kbeta(arg.channel);
});

ipc.on('executeR9kbetaoff', (event, arg) => {
  IrcClient.r9kbetaoff(arg.channel);
});

ipc.on('executeRaw', (event, arg) => {
  IrcClient.raw(arg.message);
});

ipc.on('executeSay', (event, arg) => {
  IrcClient.say(arg.channel, arg.message);
});

ipc.on('executeSlow', (event, arg) => {
  IrcClient.slow(arg.channel, arg.length);
});

ipc.on('executeSlowoff', (event, arg) => {
  IrcClient.slowoff(arg.channel);
});

ipc.on('executeSubscribers', (event, arg) => {
  IrcClient.subscribers(arg.channel);
});

ipc.on('executeSubscribersoff', (event, arg) => {
  IrcClient.subscribersoff(arg.channel);
});

ipc.on('executeTimeout', (event, arg) => {
  IrcClient.timeout(arg.channel, arg.username, arg.length, arg.reason);
});

ipc.on('executeUnban', (event, arg) => {
  IrcClient.unban(arg.channel, arg.username);
});

ipc.on('executeUnhost', (event, arg) => {
  IrcClient.unhost(arg.channel);
});

ipc.on('executeUnmod', (event, arg) => {
  IrcClient.unmod(arg.channel, arg.username);
});

ipc.on('executeWhisper', (event, arg) => {
  IrcClient.whisper(arg.username, arg.message);
});

// IRC Events
ipc.on('subscribeToAction', (event, arg) => {
  IrcClient.on("action", function (channel, userstate, message, self) {
    event.sender.send('actionReceived', {
      channel: channel,
      userstate: userstate,
      message: message,
      self: self
    });
  });
});

ipc.on('subscribeToBan', (event, arg) => {
  IrcClient.on("ban", function (channel, username, reason) {
    event.sender.send('banReceived', {
      channel: channel,
      username: username,
      reason: reason
    });
  });
});

ipc.on('subscribeToChat', (event, arg) => {
  IrcClient.on("chat", function (channel, userstate, message, self) {
    if (message.charAt(0) === '!')
      ProcessCommand(userstate, argsplit(message.substring(1)));

    event.sender.send('chatReceived', {
      channel: channel,
      userstate: userstate,
      message: message,
      self: self
    });
  });
});

ipc.on('subscribeToCheer', (event, arg) => {
  IrcClient.on("cheer", function (channel, userstate, message) {
    event.sender.send('cheerReceived', {
      channel: channel,
      userstate: userstate,
      message: message
    });
  });
});

ipc.on('subscribeToClearchat', (event, arg) => {
  IrcClient.on("clearchat", function (channel) {
    event.sender.send('clearchatReceived', {
      channel: channel
    });
  });
});

ipc.on('subscribeToConnected', (event, arg) => {
  IrcClient.on("connected", function (address, port) {
    event.sender.send('connectedReceived', {
      address: address,
      port: port
    });
  });
});

ipc.on('subscribeToConnecting', (event, arg) => {
  IrcClient.on("connecting", function (address, port) {
    event.sender.send('connectingReceived', {
      address: address,
      port: port
    });
  });
});

ipc.on('subscribeToDisconnected', (event, arg) => {
  IrcClient.on("disconnected", function (reason) {
    event.sender.send('disconnectedReceived', {
      reason: reason
    });
  });
});

ipc.on('subscribeToEmoteonly', (event, arg) => {
  IrcClient.on("emoteonly", function (channel, enabled) {
    event.sender.send('emoteonlyReceived', {
      channel: channel,
      enabled: enabled
    });
  });
});

ipc.on('subscribeToEmotesets', (event, arg) => {
  IrcClient.on("emotesets", function (sets, obj) {
    event.sender.send('emotesetsReceived', {
      sets: sets,
      obj: obj
    });
  });
});

ipc.on('subscribeToFollowersonly', (event, arg) => {
  IrcClient.on("followersonly", function (channel, enabled, length) {
    event.sender.send('followersonlyReceived', {
      channel: channel,
      enabled: enabled,
      length: length
    });
  });
});

ipc.on('subscribeToHosted', (event, arg) => {
  IrcClient.on("hosted", function (channel, username, viewers, autohost) {
    event.sender.send('hostedReceived', {
      channel: channel,
      username: username,
      viewers: viewers,
      autohost: autohost
    });
  });
});

ipc.on('subscribeToHosting', (event, arg) => {
  IrcClient.on("hosting", function (channel, target, viewers) {
    event.sender.send('hostingReceived', {
      channel: channel,
      target: target,
      viewers: viewers
    });
  });
});

ipc.on('subscribeToJoin', (event, arg) => {
  IrcClient.on("join", function (channel, username, self) {
    event.sender.send('joinReceived', {
      channel: channel,
      username: username,
      self: self
    });
  });
});

ipc.on('subscribeToLogon', (event, arg) => {
  IrcClient.on("logon", function () {
    event.sender.send('logonReceived', null);
  });
});

ipc.on('subscribeToMessage', (event, arg) => {
  IrcClient.on("message", function (channel, userstate, message, self) {
    event.sender.send('messageReceived', {
      channel: channel,
      userstate: userstate,
      message: message,
      self: self
    });
  });
});

ipc.on('subscribeToMod', (event, arg) => {
  IrcClient.on("mod", function (channel, username) {
    event.sender.send('modReceived', {
      channel: channel,
      username: username
    });
  });
});

ipc.on('subscribeToMods', (event, arg) => {
  IrcClient.on("mods", function (channel, mods) {
    event.sender.send('modsReceived', {
      channel: channel,
      mods: mods
    });
  });
});

ipc.on('subscribeToNotice', (event, arg) => {
  IrcClient.on("notice", function (channel, msgid, message) {
    event.sender.send('noticeReceived', {
      channel: channel,
      msgid: msgid,
      message: message
    });
  });
});

ipc.on('subscribeToPart', (event, arg) => {
  IrcClient.on("part", function (channel, username, self) {
    event.sender.send('partReceived', {
      channel: channel,
      username: username,
      self: self
    });
  });
});

ipc.on('subscribeToPing', (event, arg) => {
  IrcClient.on("ping", function () {
    event.sender.send('pingReceived', null);
  });
});

ipc.on('subscribeToPong', (event, arg) => {
  IrcClient.on("pong", function (latency) {
    event.sender.send('pongReceived', {
      latency: latency
    });
  });
});

ipc.on('subscribeToR9kbeta', (event, arg) => {
  IrcClient.on("r9kbeta", function (channel, enabled) {
    event.sender.send('r9kbetaReceived', {
      channel: channel,
      enabled: enabled
    });
  });
});

ipc.on('subscribeToReconnect', (event, arg) => {
  IrcClient.on("reconnect", function () {
    event.sender.send('reconnectReceived', null);
  });
});

ipc.on('subscribeToResub', (event, arg) => {
  IrcClient.on("resub", function (channel, username, months, message, userstate, methods) {
    event.sender.send('resubReceived', {
      channel: channel,
      username: username,
      months: months,
      message: message,
      userstate: userstate,
      methods: methods
    });
  });
});

ipc.on('subscribeToRoomstate', (event, arg) => {
  IrcClient.on("roomstate", function (channel, state) {
    event.sender.send('roomstateReceived', {
      channel: channel,
      state: state
    });
  });
});

ipc.on('subscribeToServerchange', (event, arg) => {
  IrcClient.on("serverchange", function () {
    event.sender.send('serverchangeReceived', null);
  });
});

ipc.on('subscribeToSlowmode', (event, arg) => {
  IrcClient.on("slowmode", function (channel, enabled, length) {
    event.sender.send('slowmodeReceived', {
      channel: channel,
      enabled: enabled,
      length: length
    });
  });
});

ipc.on('subscribeToSubscribers', (event, arg) => {
  IrcClient.on("subscribers", function (channel, enabled) {
    event.sender.send('subscribersReceived', {
      channel: channel,
      enabled: enabled
    });
  });
});

ipc.on('subscribeToSubscription', (event, arg) => {
  IrcClient.on("subscription", function (channel, username, method, message, userstate) {
    event.sender.send('subscriptionReceived', {
      channel: channel,
      username: username,
      method: method,
      message: message,
      userstate: userstate
    });
  });
});

ipc.on('subscribeToTimeout', (event, arg) => {
  IrcClient.on("timeout", function (channel, username, reason, duration) {
    event.sender.send('timeoutReceived', {
      channel: channel,
      username: username,
      reason: reason,
      duration: duration
    });
  });
});

ipc.on('subscribeToUnhost', (event, arg) => {
  IrcClient.on("unhost", function (channel, viewers) {
    event.sender.send('unhostReceived', {
      channel: channel,
      viewers: viewers
    });
  });
});

ipc.on('subscribeToUnmod', (event, arg) => {
  IrcClient.on("unmod", function (channel, username) {
    event.sender.send('unmodReceived', {
      channel: channel,
      username: username
    });
  });
});

ipc.on('subscribeToWhisper', (event, arg) => {
  IrcClient.on("whisper", function (from, userstate, message, self) {
    event.sender.send('whisperReceived', {
      from: from,
      userstate: userstate,
      message: message,
      self: self
    });
  });
});
