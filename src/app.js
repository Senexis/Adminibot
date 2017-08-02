// Small helpers you might want to keep
import './helpers/external_links';

// All stuff below is just to show you how it works. You can delete all of it.
const settings = require('electron-settings');
const { app } = require('electron')
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;

document.getElementById("min-btn").addEventListener("click", function(e) {
  var window = remote.getCurrentWindow();
  window.minimize();
});

document.getElementById("max-btn").addEventListener("click", function(e) {
  var window = remote.getCurrentWindow();
  if (!window.isMaximized()) {
    window.maximize();
  } else {
    window.unmaximize();
  }
});

document.getElementById("close-btn").addEventListener("click", function(e) {
  var window = remote.getCurrentWindow();
  window.close();
});

settings.deleteAll();

// Set the default settings.
if (!settings.has('_v')) {
  // Last known application version.
  settings.set('_v', '0.1.0');

  // Chat settings.
  settings.set('chatUseUsernameColors', true);
  settings.set('chatShowBadges', true);
  settings.set('chatShowEmotes', true);
  settings.set('chatShowHostingAnnouncements', true);
  settings.set('chatShowConnectionAnnouncements', true);
  settings.set('chatProcessTimeouts', true);
  settings.set('chatProcessClears', true);

  // IRC settings.
  settings.set('ircChannel', 'TwitchPresents');
  settings.set('ircPort', 80);
  settings.set('ircTimeout', 9999);
  settings.set('ircReconnect', true);
  settings.set('ircReconnectDecay', 1.5);
  settings.set('ircReconnectInterval', 1000);
  settings.set('ircMaxReconnectAttempts', Infinity);
  settings.set('ircMaxReconnectInterval', 30000);
  settings.set('ircDebug', false);
}

// IRC stuffs
var chat = document.getElementById('chat'),
  defaultColors = ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 128, 0)', 'rgb(178, 34, 34)', 'rgb(255, 127, 80)', 'rgb(154, 205, 50)', 'rgb(255, 69, 0)', 'rgb(46, 139, 87)', 'rgb(218, 165, 32)', 'rgb(210, 105, 30)', 'rgb(95, 158, 160)', 'rgb(30, 144, 255)', 'rgb(255, 105, 180)', 'rgb(138, 43, 226)', 'rgb(0, 255, 127)'],
  randomColorsChosen = {};

var joinAccounced = [];

function Capitalize(n) {
  return n[0].toUpperCase() + n.substr(1);
}

function SecondsToString(seconds)
{
  var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;

  if (numhours == 0 && numminutes == 0) {
    return `${numseconds} seconds`;
  } else if (numhours == 0 && numminutes > 0) {
    return `${numminutes} minutes and ${numseconds} seconds`;
  } else if (numhours > 0) {
    return `${numhours} hours, ${numminutes} minutes and ${numseconds} seconds`;
  }
}

function HtmlEntities(html) {
  function it() {
    return html.map(function(n, i, arr) {
      if (n.length == 1) {
        return n.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
          return '&#' + i.charCodeAt(0) + ';';
        });
      }
      return n;
    });
  }
  var isArray = Array.isArray(html);
  if (!isArray) {
    html = html.split('');
  }
  html = it(html);
  if (!isArray) html = html.join('');
  return html;
}

function FormatEmotes(text, emotes) {
  var splitText = text.split('');
  for (var i in emotes) {
    var e = emotes[i];
    for (var j in e) {
      var mote = e[j];
      if (typeof mote == 'string') {
        mote = mote.split('-');
        mote = [parseInt(mote[0]), parseInt(mote[1])];
        var length = mote[1] - mote[0],
          empty = Array.apply(null, new Array(length + 1)).map(function() {
            return ''
          });
        splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
        splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/1.0">');
      }
    }
  }
  return HtmlEntities(splitText).join('')
}

function FormatBadges(user) {
  function createBadge(name) {
    var name = name.split('-');
    var badge = document.createElement('div');
    badge.className = 'chat-badge chat-badge-' + name[0] + ' chat-badge-version-' + name[1];
    return badge;
  }

  var chatBadges = document.createElement('span');
  chatBadges.className = 'chat-badges';

  if (user['badges-raw']) {
    user['badges-raw'].replace(new RegExp('/', 'g'), '-').split(',').forEach(function(i) {
      chatBadges.appendChild(createBadge(i));
    })
  }

  return chatBadges;
}

function LocalizeSubPlan(args) {
  if (typeof args.method == 'object') {
    if (args.method.prime)
      return 'Twitch Prime';
    else if (args.method.plan == '1000')
      return 'a $4.99 sub';
    else if (args.method.plan == '2000')
      return 'a $9.99 sub';
    else if (args.method.plan == '3000')
      return 'a $24.99 sub';
  }

  if (typeof args.methods == 'object') {
    if (args.methods.prime)
      return 'Twitch Prime';
    else if (args.methods.plan == '1000')
      return 'a $4.99 sub';
    else if (args.methods.plan == '2000')
      return 'a $9.99 sub';
    else if (args.methods.plan == '3000')
      return 'a $24.99 sub';
  }

  return 'an unknown sub';
}

function AddChatMessage(message, channel, userstate) {
  if (chat.children.length > 50) {
    var oldMessages = [].slice.call(chat.children).slice(0, 10);
    for (var i in oldMessages) oldMessages[i].remove();
  }

  if (message && channel && userstate) {
    // We have a chat message.
    if (userstate.username !== undefined)
      var name = userstate.username;
    else if (userstate.login !== undefined)
      var name = userstate.login;

    var chatContainer = document.createElement('div');
    var chatUsernameBody = document.createElement('span');
    var chatUsernameLink = document.createElement('a');
    var chatColonBody = document.createElement('span');
    var chatMessageBody = document.createElement('span');

    chatContainer.className = 'chat-line listview__item';

    // Setup the username body.
    chatUsernameBody.className = 'chat-name';

    if (settings.get('chatUseUsernameColors')) {
      var color = userstate.color;
      if (color === null) {
        if (!randomColorsChosen.hasOwnProperty(channel)) {
          randomColorsChosen[channel] = {};
        }

        if (randomColorsChosen[channel].hasOwnProperty(name)) {
          color = randomColorsChosen[channel][name];
        } else {
          color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
          randomColorsChosen[channel][name] = color;
        }
      }
      chatUsernameLink.style.color = color;
    }

    if (userstate['display-name'] && userstate['display-name'].toLowerCase() != name.toLowerCase()) {
      chatUsernameLink.innerHTML = `${userstate['display-name']} (${name})`;
    } else {
      chatUsernameLink.innerHTML = userstate['display-name'] || name;
    }

    chatUsernameLink.href = `https://www.twitch.tv/${name}/`;

    chatUsernameBody.appendChild(chatUsernameLink);

    // Setup the colon body.
    chatColonBody.className = 'chat-colon';
    chatColonBody.innerHTML = ':';

    // Setup the message body.
    chatMessageBody.className = 'chat-message';
    chatMessageBody.appendChild(chatUsernameBody);
    chatMessageBody.innerHTML = settings.get('chatShowEmotes') ? FormatEmotes(message, userstate.emotes) : HtmlEntities(message);

    chatContainer.appendChild(FormatBadges(userstate));
    chatContainer.appendChild(chatUsernameBody);
    chatContainer.appendChild(chatColonBody);
    chatContainer.appendChild(chatMessageBody);
    chat.appendChild(chatContainer);
    return;
  }
  if (message) {
    var chatContainer = document.createElement('div');
    var chatMessageBody = document.createElement('span');

    chatContainer.className = 'chat-line chat-notice listview__item';

    chatMessageBody.className = 'chat-message';
    chatMessageBody.innerHTML = message;

    chatContainer.appendChild(chatMessageBody);
    chat.appendChild(chatContainer);
    return;
  }
}

// Status subscriptions and handlers.

ipc.send('createIrcInstance', {
  connection: {
    reconnect: false
  },
  identity: {
    username: 'adminibot',
    password: 'oauth:2ayszlpa9311ws6n1iyqsq9rnju3cl'
  },
  channels: ["dansgaming"]
});

// Connected (address, port) - Connected to server.
// Connecting (address, port) - Connecting to a server.
// Disconnected (reason) - Got disconnected from server.
// Join (channel, username, self) - Username has joined a channel.
// Logon () - Connection established, sending informations to server.
// Part (channel, username, self) - User has left a channel.
// Ping () - Received PING from server.
// Pong (latency) - Sent a PING request ? PONG.
// Reconnect () - Trying to reconnect to server.
// Serverchange (channel) - Channel is no longer located on this cluster.

ipc.send('subscribeToConnected');
ipc.on('connectedReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Connected to chat.');
})

ipc.send('subscribeToConnecting');
ipc.on('connectingReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Connecting to chat...');
})

ipc.send('subscribeToDisconnected');
ipc.on('disconnectedReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Disconnected from chat: ' + args.reason);
})

ipc.send('subscribeToJoin');
ipc.on('joinReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    if (args.self)
      AddChatMessage('Welcome to the chat!');
    else
      console.log(`${args.username} joined the chat.`);
})

ipc.send('subscribeToLogon');
ipc.on('logonReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Authenticating...');
})

ipc.send('subscribeToPart');
ipc.on('partReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    if (args.self)
      AddChatMessage('You left the chat.');
    else
      console.log(`${args.username} left the chat.`);
})

ipc.send('subscribeToPing');
ipc.on('pingReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    console.log('Ping!');
})

ipc.send('subscribeToPong');
ipc.on('pongReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    console.log(`Pong! Latency: ${args.latency}.`);
})

ipc.send('subscribeToReconnect');
ipc.on('reconnectReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Reconnecting to chat...');
})

ipc.send('subscribeToServerchange');
ipc.on('serverchangeReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('The channel has changed servers.');
})

// Interactive subscriptions and handlers.

// Action (channel, userstate, message, self) - Received action message on channel.
// Ban (channel, username, reason) - Username has been banned on a channel.
// Chat (channel, userstate, message, self) - Received message on channel.
// Cheer (channel, userstate, message) - Username has cheered to a channel.
// Clearchat (channel) - Chat of a channel got cleared.
// Emoteonly (channel, enabled) - Channel enabled or disabled emote-only mode.
// Emotesets (sets, obj) - Received the emote-sets from Twitch.
// Followersonly (channel, enabled, duration) - Channel enabled or disabled followers-only mode.
// Hosted (channel, username, viewers, autohost) - Channel is now hosted by another broadcaster.
// Hosting (channel, target, viewers) - Channel is now hosting another channel.
// Message (channel, userstate, message, self) - Received a message. This event is fired whenever you receive a chat, action or whisper message.
// Mod (channel, username) - Someone got modded on a channel.
// Mods (channel, mods) - Received the list of moderators of a channel.
// Notice (channel, msgid, message) - Received a notice from server.
// R9kbeta (channel, enabled) - Channel enabled or disabled R9K mode.
// Resub (channel, username, months, message, userstate, methods) - Username has resubbed on a channel.
// Roomstate (channel, state) - The current state of the channel.
// Slowmode (channel, enabled, duration) - Gives you the current state of the channel.
// Subscribers (channel, enabled) - Channel enabled or disabled subscribers-only mode.
// Subscription (channel, username, method, message, userstate) - Username has subscribed to a channel.
// Timeout (channel, username, reason, duration) - Username has been timed out on a channel.
// Unhost (channel, viewers) - Channel ended the current hosting.
// Unmod (channel, username) - Someone got unmodded on a channel.
// Whisper (from, userstate, message, self) - Received a whisper.

ipc.send('subscribeToAction');
ipc.on('actionReceived', (sender, args) => {
  // TODO: /me formatting.
  AddChatMessage(args.message, args.channel, args.userstate);
})

ipc.send('subscribeToBan');
ipc.on('banReceived', (sender, args) => {
  if (!args.reason)
    AddChatMessage(`${args.username} was banned.`);
  else
    AddChatMessage(`${args.username} was banned: ${args.reason}`);
})

ipc.send('subscribeToChat');
ipc.on('chatReceived', (sender, args) => {
  AddChatMessage(args.message, args.channel, args.userstate);
})

ipc.send('subscribeToClearchat');
ipc.on('clearchatReceived', (sender, args) => {
  if (settings.get('chatProcessClears')) {
    // Clear everything from chat.
    var chatDiv = document.getElementById('chat');
    while (chatDiv.firstChild) {
      chatDiv.removeChild(chatDiv.firstChild);
    }

    AddChatMessage('The chat was cleared.');
  }
})

ipc.send('subscribeToEmoteonly');
ipc.on('emoteonlyReceived', (sender, args) => {
  if (args.enabled)
    AddChatMessage('The chat is now in emote-only mode.');
  else
    AddChatMessage('The chat is no longer in emote-only mode.');
})

ipc.send('subscribeToFollowersonly');
ipc.on('followersonlyReceived', (sender, args) => {
  if (args.enabled)
    AddChatMessage(`The chat is now in followers-only mode for ${args.duration} minutes.`);
  else
    AddChatMessage('The chat is no longer in followers-only mode.');
})

ipc.send('subscribeToHosted');
ipc.on('hostedReceived', (sender, args) => {
  if (args.autohost)
    AddChatMessage(`${args.username} is now auto-hosting you for ${args.viewers} viewers.`);
  else
    AddChatMessage(`${args.username} is now hosting you for ${args.viewers} viewers.`);
})

ipc.send('subscribeToHosting');
ipc.on('hostingReceived', (sender, args) => {
  AddChatMessage(`${args.channel} is now hosting ${args.target} for ${args.viewers} viewers.`);
})

ipc.send('subscribeToMods');
ipc.on('modsReceived', (sender, args) => {
  console.log(`Moderators for ${args.channel}:`);
  console.log(args.mods);
})

ipc.send('subscribeToNotice');
ipc.on('noticeReceived', (sender, args) => {
  AddChatMessage(args.message);
})

ipc.send('subscribeToR9kbeta');
ipc.on('r9kbetaReceived', (sender, args) => {
  if (args.enabled)
    AddChatMessage('The chat is now in R9K-beta mode.');
  else
    AddChatMessage('The chat is no longer in R9K-beta mode.');
})

ipc.send('subscribeToResub');
ipc.on('resubReceived', (sender, args) => {
  AddChatMessage(`${args.username} has subscribed with ${LocalizeSubPlan(args)}. ${args.username} has subscribed for ${args.months} months in a row!`);

  if (args.message && args.message != '')
    AddChatMessage(args.message, args.channel, args.userstate);
})

ipc.send('subscribeToRoomstate');
ipc.on('roomstateReceived', (sender, args) => {
  console.log(args.state);
})

ipc.send('subscribeToSlowmode');
ipc.on('slowmodeReceived', (sender, args) => {
  if (args.enabled)
    AddChatMessage(`The chat is now in slow mode. You may send a message every ${SecondsToString(args.duration)} seconds.`);
  else
    AddChatMessage('The chat is no longer in slow mode.');
})

ipc.send('subscribeToSubscribers');
ipc.on('subscribersReceived', (sender, args) => {
  if (args.enabled)
    AddChatMessage('The chat is now in subscribers-only mode.');
  else
    AddChatMessage('The chat is no longer in subscribers-only mode.');
})

ipc.send('subscribeToSubscription');
ipc.on('subscriptionReceived', (sender, args) => {
  AddChatMessage(`${args.username} has subscribed with ${LocalizeSubPlan(args)}.`);

  if (args.message && args.message != '')
    AddChatMessage(args.message, args.channel, args.userstate);
})

ipc.send('subscribeToTimeout');
ipc.on('timeoutReceived', (sender, args) => {
  if (!args.reason)
    AddChatMessage(`${args.username} was timed out for ${SecondsToString(args.duration)}.`);
  else
    AddChatMessage(`${args.username} was timed out for ${SecondsToString(args.duration)}: ${args.reason}`);
})

ipc.send('subscribeToUnhost');
ipc.on('unhostReceived', (sender, args) => {
  AddChatMessage(`${args.channel} is no longer hosting.`);
})

// Connect to IRC.
ipc.send('executeConnect');
