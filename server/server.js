require('./config/config')

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const {ObjectID} = require('mongodb')

const {mongoose} = require('./db/mongoose')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')
const {authenticate} = require('./middleware/authenticate')

var app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())

app.post('/todos', authenticate, (req, res) => {
    let todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    })
    todo.save().then((doc) => {
            console.log('Todo saved')
            res.send(doc)
        }, (e) => {
            console.log('Unable to save todo')
            res.status(400).send(e)
        }
    )
})

app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
    }).then((todos) => {
        res.send({todos})
    }, (e) => {
        res.send(400).send(e);
    })
})

app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        console.log('Todo id not valid')
        return res.status(400).send({error: 'Todo id not valid'})
    }
    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send({error: 'Todo not found'})
        }
        res.status(200).send({todo})
    }).catch((e) => {
        res.status(400).send({error: 'Bad request'})
    })
})

app.delete('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
        console.log('ID not valid!')
        return res.status(400).send({error: 'Todo id not valid'});
    }
    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send({error: 'Todo not found'})
        }
        res.status(200).send({todo})
    }).catch((e) => {
        res.status(400).send({error: 'Bad request'})
    })
})

app.patch('/todos/:id', authenticate, (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['text', 'completed'])

    if (!ObjectID.isValid(id)) {
        console.log('Todo id not valid')
        return res.status(400).send({error: 'Todo id not valid'})
    }
    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime()
    } else {
        body.completed = false
        body.completedAt = null
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, {$set: body}, {new: true}).then((todo) => {
        if (!todo) {
            return res.status(404).send({error: 'Todo not found'})
        }
        res.send({todo})
    }).catch((e) => {
        res.status(400).send({error: 'Bad request'})
    })
})

//POST /users
app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password'])
    let user = new User(body)

    user.save().then(() => {
        return user.generateAuthToken()
    }).then((token) => {
        res.header('x-auth', token).send(user)
    }).catch((e) => {
        res.status(400).send(e)
    })
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user)
})

app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password'])

    User.findByCredentials(body.email, body.password)
        .then((user) => {
            return user.generateAuthToken().then((token) => {
                res.header('x-auth', token).send(user)
            })
        }).catch((e) => {
        res.status(400).send({error: 'User not found'})
    })
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }, () => {
        res.status(400).send()
    })
})

app.listen(PORT, () => {
    console.log(`Started at port ${PORT}`)
})

module.exports = {app}