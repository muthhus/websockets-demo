var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8081}),
    i = 0,
    connections = {},
    connect = require('connect'),
    clientServer = connect.createServer(connect.static(__dirname)).listen(8080);

wss.on('connection', function(ws) {
  i++;
  connections[i] = ws;
  ws.id = i;

  ws.on('message', function(message) {
    try {
      var msg = JSON.parse(message);
      msg.sender = ws.id;
      sendToConnections(msg);
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        error: e,
        received: message
      }));
    }
  });

  // Connected event
  ws.send(JSON.stringify({
    type: 'connected',
    id: ws.id
  }));

  // Connection events
  for (var id in connections) {

    // Notify all clients of new connection
    connections[id].send(JSON.stringify({
      type: 'connection',
      id: ws.id,
      clients: Object.keys(connections).length
    }));

    // Notify current client of all existing connections
    if (id < ws.id) {
      ws.send(JSON.stringify({
        type: 'connection',
        id: id,
        clients: Object.keys(connections).length
      }));
    }
  }

  // Closed event
  ws.on('close', function() {
    console.log('deleting ' + ws.id);
    delete connections[ws.id];

    sendToConnections({
      type: 'closed',
      id: ws.id,
      clients: Object.keys(connections).length
    });
  });
});

var sendToConnections = function(obj) {
  var msg = JSON.stringify(obj);
  if (obj.target) {
    console.log('sending from ' + obj.sender + ' to ' + obj.target + ': ' + msg);
    connections[obj.target].send(msg);
  } else {
    console.log('sending from ' + obj.sender + ' to everyone: ' + msg);
    for (var id in connections) {
      connections[id].send(msg);
    }
  }
};
