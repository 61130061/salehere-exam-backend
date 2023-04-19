var express = require("express")
var { graphqlHTTP } = require("express-graphql")
var { buildSchema } = require("graphql")
const crypto = require('crypto');
const cors = require('cors');
const socketIo = require('socket.io');

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type User {
    id: ID!
    name: String!
  }
  
  type Message {
    id: ID!
    text: String!
    sender: User!
    time: String!
  }
  
  type ChatRoom {
    id: ID!
    name: String!
    messages: [Message!]!
  }
  
  type Query {
    hello: String
    getUserById(userId: ID!): User!
    chatRooms: [ChatRoom!]!
    chatRoomByName(name: String!): ChatRoom!
    chatRoomById(id: ID!): ChatRoom!
  }
  
  type Mutation {
    createChatRoom(name: String!): ChatRoom!
    sendMessage(roomId: ID!, senderId: ID!, text: String!): Message!
    user(name: String!): User!
  }
  
  schema {
    query: Query
    mutation: Mutation
  }
`)

let chatRooms = [];
let users = [];

// The root provides a resolver function for each API endpoint
var root = {
  hello: () => {
    return crypto.randomUUID()
  },
  sendMessage: ({ roomId, senderId, text }) => {
    const sender = users.filter(item => item.id === senderId);

    if (sender.length < 1) throw new Error('Sender invalidated');

    const newMessage = {
      id: crypto.randomUUID(),
      sender: sender[0],
      text,
      time: new Date()
    }

    const existRoom = chatRooms.filter(item => item.id === roomId);
    if (existRoom.length < 1) throw new Error('Chatroom not found');

    chatRooms.forEach((d) => {
      if (d.id === roomId) {
        d.messages.push(newMessage);
        return d
      }
    });

    io.emit('chatroom-'+roomId, 'new-message');

    return newMessage;
  },
  getUserById: ({ userId }) => {
    const user = users.filter(item => item.id === id);

    if (user.length < 1) throw new Error('User not found');

    return user[0]
  },
  user: ({ name }) => {
    const user = users.filter(item => item.name === name);

    if (user.length > 0) return user[0]
    else {
      const newUser = {
        id: crypto.randomUUID(),
        name
      }

      users.push(newUser);

      return newUser
    }
  },
  chatRooms: () => {
    return chatRooms
  },
  chatRoomByName: ({ name }) => {
    const results = chatRooms.filter(item => item.name === name);

    if (results.length < 1) throw new Error('Chatroom not found');

    return results[0]
  },
  chatRoomById: ({ id }) => {
    const results = chatRooms.filter(item => item.id === id);

    if (results.length < 1) throw new Error('Chatroom not found');

    return results[0]
  },
  createChatRoom: ({ name }) => {
    const isExist = chatRooms.filter(item => item.name === name)

    if (isExist.length > 0) throw new Error('Chatroom this name is already exist');

    const newRoom = {
      id: crypto.randomUUID(),
      name,
      messages: []
    }

    chatRooms.push(newRoom);

    return newRoom
  }
}

const app = express()
const server = require('http').createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

app.use(cors());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
)

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  })
});

server.listen(4000)
console.log("Running a GraphQL API server at http://localhost:4000/graphql")