const express = require('express')
const bodyParser = require('body-parser')
const { makeExecutableSchema } = require('graphql-tools')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const { execute, subscribe } = require('graphql')
const { PubSub, withFilter } = require('graphql-subscriptions')
const { SubscriptionServer } = require('subscriptions-transport-ws')
const { createServer } = require('http')

// Step 1: Create schema and sample data
const typeDefs = `
type GeoPosition {
  latitude: Float!
  longitude: Float!
}

type Query {
  geoPositions: [GeoPosition]!
}

type Mutation {
  addGeoPosition(latitude: Float!, longitude: Float!): GeoPosition!
}

type Subscription {
  geoPositionAdded: GeoPosition!
}

# we need to tell the server which types represent the root query
# and root mutation types. We call them RootQuery and RootMutation by convention.
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}
`

// Two sample positions
// https://goo.gl/maps/msLg8uYoxkS2
// https://goo.gl/maps/Dgssc5KBvK62
const geoPositions = [
  { latitude: 40.7848139, longitude: -73.9771623 },
  { latitude: 40.7847102, longitude: 73.977418 }
]

const pubsub = new PubSub();

const resolvers = {
  Query: {
    geoPositions: () => {
      return geoPositions;
    },
  },
  Mutation: {
    addGeoPosition: (object, variables, context, resolveInfo) => {
      const { latitude, longitude } = variables;
      geoPositions.push({ latitude, longitude });
      pubsub.publish('geoPositionAdded', { geoPositionAdded: { latitude, longitude } });
      return { latitude, longitude };
    }
  },
  Subscription: {
    geoPositionAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator('geoPositionAdded'), (payload, variables) => {
        return true;
      }),
    }
  },
  GeoPosition: {
    latitude: (pos) => pos.latitude,
    longitude: (pos) => pos.longitude,
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Step 2: create server and open graphql and graphiql endpoints

const app = express()
app.get('/', (req, res) => res.send('Hello World!'))

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.get('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: 'ws://localhost:3000/subscriptions',
}));

const server = createServer(app);

server.listen(3000, () => {
  console.log('GraphQL server is now running on port 3000');

  new SubscriptionServer({
    execute,
    subscribe,
    schema,
  }, {
    server,
    path: '/subscriptions',
  });
});
