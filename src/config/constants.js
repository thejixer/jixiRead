export default {
  PORT: process.env.PORT || 2999,
  DB_URL: 'mongodb://localhost/ArticleReadingIssue',
  DB_SETTINGS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  },
  GRAPHQL_PATH: '/graphql',
  JWT_SECRET: 'thisisasecret123'
}