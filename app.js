const express = require('express')
const bodyParser = require('body-parser')
const { makeExecutableSchema } = require('graphql-tools')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')

// Step 1: Create schema and sample data
const typeDefs = `
type GeoPosition {
  latitude: Float!
  longitude: Float!
}

type Query {
  geoPositions: [GeoPosition]!
}

# we need to tell the server which types represent the root query
# and root mutation types. We call them RootQuery and RootMutation by convention.
schema {
  query: Query
}
`

// Two sample positions
// https://goo.gl/maps/msLg8uYoxkS2
// https://goo.gl/maps/Dgssc5KBvK62
const geoPositions = [
  { latitude: 40.7848139, longitude: -73.9771623 },
  { latitude: 40.7847102, longitude: 73.977418 }
]

const resolvers = {
  Query: {
    geoPositions: () => {
      return geoPositions;
    },
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
app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// Step 3: Make express server listen requests on port 3000
app.listen(3000, () => console.log('Example app listening on port 3000!'))
