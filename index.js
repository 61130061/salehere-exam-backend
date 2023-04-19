var express = require("express")
var { graphqlHTTP } = require("express-graphql")
var { buildSchema } = require("graphql")
const crypto = require('crypto');
const cors = require('cors');

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
    timestamp: String!
  }
  
  type ChatRoom {
    id: ID!
    name: String!
    messages: [Message!]!
  }
  
  type Query {
    hello: String
    chatRooms: [ChatRoom!]!
    chatRoom(name: String!): ChatRoom!
  }
  
  type Mutation {
    createChatRoom(name: String!): ChatRoom!
    sendMessage(roomId: ID!, senderId: ID!, text: String!): Message!
  }
  
  schema {
    query: Query
    mutation: Mutation
  }
`)

let messages = [];
let chatRooms = [];
let users = [];

// The root provides a resolver function for each API endpoint
var root = {
  hello: () => {
    return crypto.randomUUID()
  },
  chatRooms: () => {
    return chatRooms
  },
  chatRoom: ({ name }) => {
    const results = chatRooms.filter(item => item.name === name);

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

var app = express()

app.use(cors());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
)
app.listen(4000)
console.log("Running a GraphQL API server at http://localhost:4000/graphql")