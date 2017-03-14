const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')
const {Todo} = require('./../../models/todo')
const {User} = require('./../../models/user')

const userOneId = new ObjectID()
const userTwoId = new ObjectID()

const users = [{
    _id: userOneId,
    email: 'mjkhalili@live.com',
    password: 'abcd1234',
    tokens:[{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, 'abc123').toString()
    }]
},{
    _id: userTwoId,
    email: 'jen@live.com',
    password: 'abcd1234',
    tokens:[{
        access: 'auth',
        token: jwt.sign({_id: userTwoId, access: 'auth'}, 'abc123').toString()
    }]
}]

//Seed todos data
const todos = [{
    _id: new ObjectID(),
    text: 'firt items on todos',
    _creator: userOneId
}, {
    _id: new ObjectID(),
    text: 'Second items on todos',
    _creator: userTwoId
}]

const populateTodos = (done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos)
    }).then(() => done())
}

const populateUsers = (done) => {
    User.remove({}).then(() => {
        let user1 = new User(users[0]).save()
        let user2 = new User(users[1]).save()

        return Promise.all([user1, user2])
    }).then(() => done())
}

module.exports= {todos, populateTodos, users, populateUsers}