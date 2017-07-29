// Small helpers you might want to keep
import './helpers/external_links';

// All stuff below is just to show you how it works. You can delete all of it.
const settings = require('electron-settings');
const { app } = require('electron')
const ipc = require('electron').ipcRenderer;

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

console.log(settings.getAll());

// IRC stuffs
var chat = document.getElementById('chat'),
  defaultColors = ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 128, 0)', 'rgb(178, 34, 34)', 'rgb(255, 127, 80)', 'rgb(154, 205, 50)', 'rgb(255, 69, 0)', 'rgb(46, 139, 87)', 'rgb(218, 165, 32)', 'rgb(210, 105, 30)', 'rgb(95, 158, 160)', 'rgb(30, 144, 255)', 'rgb(255, 105, 180)', 'rgb(138, 43, 226)', 'rgb(0, 255, 127)'],
  randomColorsChosen = {};

var joinAccounced = [];

function dehash(channel) {
  return channel.replace(/^#/, '');
}

function capitalize(n) {
  return n[0].toUpperCase() + n.substr(1);
}

function htmlEntities(html) {
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

function formatEmotes(text, emotes) {
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
  return htmlEntities(splitText).join('')
}

function badges(chan, user, isBot) {
  function createBadge(name) {
    var badge = document.createElement('div');
    badge.className = 'chat-badge-' + name;
    return badge;
  }

  var chatBadges = document.createElement('span');
  chatBadges.className = 'chat-badges';

  if (isBot) {
    chatBadges.appendChild(createBadge('bot'));
  }

  if (user['badges-raw']) {
    user['badges-raw'].replace(new RegExp('/', 'g'), '-').split(',').forEach(function (i) {
      chatBadges.appendChild(createBadge(i));
    })
  }

  return chatBadges;
}

function handleChat(channel, user, message, self) {

  var chan = dehash(channel),
    name = user.username,
    chatLine = document.createElement('div'),
    chatName = document.createElement('a'),
    chatMessage = document.createElement('span');

  var color = settings.get('chatUseUsernameColors') ? user.color : 'inherit';
  if (color === null) {
    if (!randomColorsChosen.hasOwnProperty(chan)) {
      randomColorsChosen[chan] = {};
    }
    if (randomColorsChosen[chan].hasOwnProperty(name)) {
      color = randomColorsChosen[chan][name];
    } else {
      color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
      randomColorsChosen[chan][name] = color;
    }
  }

  chatLine.className = 'listview__item chat-line';
  chatLine.dataset.username = name;
  chatLine.dataset.channel = channel;

  if (user['message-type'] == 'action') {
    chatLine.className += ' chat-action';
  }

  chatName.className = 'chat-name js-external-link';
  chatName.style.color = color;
  chatName.href = `https://www.twitch.tv/${name}/`;

  if (user['display-name'] && user['display-name'].toLowerCase() != name.toLowerCase()) {
    chatName.innerHTML = `${user['display-name']} (${name})`;
  } else {
    chatName.innerHTML = user['display-name'] || name;
  }

  chatMessage.appendChild(chatName);

  chatMessage.className = 'chat-message';

  chatMessage.insertAdjacentHTML('beforeend', ': ');
  chatMessage.insertAdjacentHTML('beforeend', settings.get('chatShowEmotes') ? formatEmotes(message, user.emotes) : htmlEntities(message));

  if (settings.get('chatShowBadges')) chatLine.appendChild(badges(chan, user, self));
  chatLine.appendChild(chatMessage);

  chat.appendChild(chatLine);

  if (chat.children.length > 50) {
    var oldMessages = [].slice.call(chat.children).slice(0, 10);
    for (var i in oldMessages) oldMessages[i].remove();
  }

  chat.scrollTop = chat.scrollHeight;
}

function chatNotice(information, level, additionalClasses) {
  var ele = document.createElement('li');

  ele.className = 'listview__item chat-line chat-notice';
  ele.innerHTML = information;

  if (additionalClasses !== undefined) {
    if (Array.isArray(additionalClasses)) {
      additionalClasses = additionalClasses.join(' ');
    }
    ele.className += ' ' + additionalClasses;
  }

  if (typeof level == 'number' && level != 0) {
    ele.dataset.level = level;
  }

  chat.appendChild(ele);

  return ele;
}

var recentTimeouts = {};

function timeout(channel, username) {
  if (!settings.get('chatProcessTimeouts')) return false;
  if (!recentTimeouts.hasOwnProperty(channel)) {
    recentTimeouts[channel] = {};
  }
  if (!recentTimeouts[channel].hasOwnProperty(username) || recentTimeouts[channel][username] + 1000 * 10 < +new Date) {
    recentTimeouts[channel][username] = +new Date;
    chatNotice(capitalize(username) + ' was timed out in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-timeout')
  };
  var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"][data-username="' + username + '"]:not(.chat-timedout) .chat-message');
  for (var i in toHide) {
    var h = toHide[i];
    if (typeof h == 'object') {
      h.parentElement.remove();
    }
  }
}

function clearChat(channel) {
  if (!settings.get('chatProcessClears')) return false;
  var toHide = document.querySelectorAll('.chat-line[data-channel="' + channel + '"]');
  for (var i in toHide) {
    var h = toHide[i];
    if (typeof h == 'object') {
      h.className += ' chat-cleared';
    }
  }
  chatNotice('Chat was cleared in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-clear')
}

function hosting(channel, target, viewers, unhost) {
  if (!settings.get('chatShowHostingAnnouncements')) return false;
  if (viewers == '-') viewers = 0;
  var chan = dehash(channel);
  chan = capitalize(chan);
  if (!unhost) {
    var targ = capitalize(target);
    chatNotice(chan + ' is now hosting ' + targ + ' for ' + viewers + ' viewer' + (viewers !== 1 ? 's' : '') + '.', null, null, 'chat-hosting-yes');
  } else {
    chatNotice(chan + ' is no longer hosting.', null, null, 'chat-hosting-no');
  }
}




function AddChatMessage(message, channel, userstate) {
  if (message && channel && userstate) {
    // We have a chat message.
    var name = userstate.username;

    var chatContainer = document.createElement('div');
    var chatUsernameBody = document.createElement('a');
    var chatMessageBody = document.createElement('p');

    chatContainer.className = 'chat-line listview__item';

    // Setup the username body.
    chatUsernameBody.className = 'chat-name js-external-link';

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
      chatUsernameBody.style.color = color;
    }

    if (userstate['display-name'] && userstate['display-name'].toLowerCase() != name.toLowerCase()) {
      chatUsernameBody.innerHTML = `${userstate['display-name']} (${name})`;
    } else {
      chatUsernameBody.innerHTML = userstate['display-name'] || name;
    }

    chatUsernameBody.href = `https://www.twitch.tv/${name}/`;

    // Setup the message body.
    chatMessageBody.className = 'chat-message';
    chatMessageBody.appendChild(chatUsernameBody);
    chatMessageBody.insertAdjacentHTML('beforeend', ': ');
    chatMessageBody.insertAdjacentHTML('beforeend', settings.get('chatShowEmotes') ? formatEmotes(message, userstate.emotes) : htmlEntities(message));

    chatContainer.appendChild(chatMessageBody);
    chat.appendChild(chatContainer);
    return;
  }
  if (message) {
    var chatContainer = document.createElement('div');
    var chatMessageBody = document.createElement('p');

    chatContainer.className = 'chat-line listview__item';

    chatMessageBody.className = 'chat-message';
    chatMessageBody.innerHTML = message;

    chatContainer.appendChild(chatMessageBody);
    chat.appendChild(chatContainer);
    return;
  }
}

// Status subscriptions and handlers.
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

// client.addListener('hosting', hosting);
// client.addListener('unhost', function(channel, viewers) {
//   hosting(channel, null, viewers, true)
// });