const { buildSchema } = require('graphql');

const schema = buildSchema(`
  scalar Date
  scalar Decimal

  type Query {
    dashboard: Dashboard!
  }

  type Dashboard {
    accounts: [Account!]!
    forecastSummary: ForecastSummary!
    upcomingRecurringCommitments: [RecurringCommitment!]!
    unreadAlerts: [Alert!]!
  }

  type Account {
    id: ID!
    name: String!
    type: String!
    currentBalance: Decimal!
    currency: String!
  }

  type ForecastSummary {
    ready: Boolean!
    day7Balance: Decimal
    day30Balance: Decimal
    day60Balance: Decimal
    fullSeries: [ForecastDay!]!
  }

  type ForecastDay {
    forecastDate: Date!
    projectedBalance: Decimal!
    confidenceLevel: String!
  }

  type RecurringCommitment {
    id: ID!
    name: String!
    amount: Decimal!
    type: String!
    intervalUnit: String!
    intervalCount: Int!
    nextOccurrenceDate: Date!
    status: String!
    account: Account
  }

  type Alert {
    id: ID!
    type: String!
    message: String!
    severity: String!
    createdAt: Date!
    isRead: Boolean!
  }
`);

module.exports = schema;
