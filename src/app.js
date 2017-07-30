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
    badge.title = name[0] === 'bits' ? `${name[1]} or more bits donated` : Capitalize(name[0]);
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

function AddChatMessage(message, channel, userstate) {
  if (chat.children.length > 50) {
    var oldMessages = [].slice.call(chat.children).slice(0, 10);
    for (var i in oldMessages) oldMessages[i].remove();
  }

  if (message && channel && userstate) {
    // We have a chat message.
    var name = userstate.username;

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
  channels: ["imaqtpie"]
});

ipc.send('subscribeToConnecting');
ipc.on('connectingReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Connecting to chat...');
})

ipc.send('subscribeToLogon');
ipc.on('logonReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Authenticating...');
})

ipc.send('subscribeToConnected');
ipc.on('connectedReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Connected to chat.');
})

ipc.send('subscribeToJoin');
ipc.on('joinReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    if (args.self)
      AddChatMessage('Welcome to the chat!');
})

ipc.send('subscribeToPart');
ipc.on('partReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    if (args.self)
      AddChatMessage('Left the chat.');
})

ipc.send('subscribeToDisconnected');
ipc.on('disconnectedReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Disconnected from chat: ' + args.reason);
})

ipc.send('subscribeToReconnect');
ipc.on('reconnectReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    AddChatMessage('Reconnecting to chat...');
})

// Interactive subscriptions and handlers.
ipc.send('subscribeToAction');
ipc.on('actionReceived', (sender, args) => {
  // TODO: /me formatting.
  AddChatMessage(args.message, args.channel, args.userstate);
})

ipc.send('subscribeToBan');
ipc.on('banReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
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
    var toHide = document.querySelectorAll('.chat-line');
    for (var i in toHide) {
      var h = toHide[i];
      if (typeof h == 'object') {
        h.className += ' chat-cleared';
      }
    }
    AddChatMessage('The chat was cleared.');
  }
})

ipc.send('subscribeToNotice');
ipc.on('noticeReceived', (sender, args) => {
  AddChatMessage(args.message);
})

ipc.send('subscribeToTimeout');
ipc.on('timeoutReceived', (sender, args) => {
  if (settings.get('chatShowConnectionAnnouncements'))
    if (!args.reason)
      AddChatMessage(`${args.username} was timed out for ${args.duration}.`);
    else
      AddChatMessage(`${args.username} was timed out for ${args.duration}: ${args.reason}`);
})

// Connect to IRC.
ipc.send('executeConnect');
