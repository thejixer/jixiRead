export default`
  scalar Date

  type Status {
    message: String!
  }

  type Auth {
    token: String!
  }

  type Follower {
    user: User!
    haveIfollowed: Boolean
  }
  
  type Review {
    user: User!
    review: String!
    point: Int!
  }

  type Tag {
    title: String!
  }

  type SavedArticle {
    article: Article!
  }

  type UserArticle {
    article: Article!
  }

  type User {
    _id: ID!
    email: String!
    firstName: String
    lastName: String
    avatar: String
    bio: String
    fullName: String
    professions: [String]
    following: [Follower]
    follower: [Follower]
    UserArticles: [UserArticle]
    haveIfollowed: Boolean
    isSelf: Boolean
    FavoriteFields: [String]
    Position: String
    SavedArticles: [SavedArticle]
    createdAt: Date!
    updatedAt: Date!
  }

  type Me {
    _id: ID!
    email: String!
    firstName: String
    lastName: String
    avatar: String
    fullName: String
    bio: String
    isSelf: Boolean
    professions: [String]
    following: [Follower]
    follower: [Follower]
    FavoriteFields: [String]
    UserArticles: [UserArticle]
    Position: String
    createdAt: Date!
    updatedAt: Date!
  }

  type Article {
    _id: ID!
    title: String!
    text: String!
    user: User!
    Reviews: [Review]
    Picture: String
    tags: [String]
    haveIcommented: Boolean
    because: [String]
    PointAverage: Float!
    haveIsaved: Boolean
    isAuthor: Boolean
    createdAt: Date!
    updatedAt: Date!
  }

  type Query {
    getArticle(_id: ID!): Article
    getArticles: [Article]
    getUserArticles(_id: ID!): [Article]
    me: Me
    getUser(_id: ID!): User
    getSelectedArticlesbyTags: [Article]
    getSelectedArticlesByUsers: [Article]
    getArticlesBySpeceficTag(tag: String!): [Article]
    getUserFollowers(_id: ID!) : [Follower]
    getUserFollowings(_id: ID!) : [Follower]
    getSavedArticles: [SavedArticle]
  }

  type Mutation {
    createArticle(text: String!, title: String!, tags:[String], Picture:Upload!): Article
    updateArticle(_id: ID!, text: String): Article
    deleteArticle(_id: ID!): Status
    signup(email: String!, firstName: String!,lastName:String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    addReview(_id: ID!,review: String!, point: Int!): Status
    editProfile(firstName: String!, lastName: String!, bio: String!, Position: String!): Status
    singleUpload(file: Upload!): Boolean
    followHandler(_id: ID!): Status
    SetFavoriteFields(tags: [String!]): Status
    tagAutoComplete(text: String!): [Tag]
    HandleSaveArticle(_id: ID!) : Status
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`;