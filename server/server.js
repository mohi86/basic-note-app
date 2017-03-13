require('./config/config')

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const {ObjectID} = require('mongodb')

const {mongoose} = require('./db/mongoose')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')

var app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())

app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text
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

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({todos})
    }, (e) => {
        res.send(400).send(e);
    })
})

app.get('/todos/:id', (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        console.log('Todo id not valid')
        return res.status(400).send({error: 'Todo id not valid'})
    }
    Todo.findById(id).then((todo) => {
        if(!todo){
            return res.status(404).send({error: 'Todo not found'})
        }
        res.status(200).send({todo})
    }).catch((e) => {
        res.status(400).send({error: 'Bad request'})
    })
})

app.delete('/todos/:id', (req, res) => {
    let id = req.params.id

    if (!ObjectID.isValid(id)) {
        console.log('ID not valid!')
        return res.status(400).send({error: 'Todo id not valid'});
    }
    Todo.findByIdAndRemove(id).then((todo) => {
        if (!todo) {
            return res.status(404).send({error: 'Todo not found'})
        }
        res.status(200).send({todo})
    }).catch((e) => {
        res.status(400).send({error: 'Bad request'})
    })
})

app.patch('/todos/:id', (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['text','completed'])

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

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
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
    let body = _.pick(req.body, ['email','password'])
    let user = new User(body)

    user.save().then(() => {
        return user.generateAuthToken()
    }).then((token) => {
        res.header('x-auth', token).send(user)
    }).catch((e) => {
        res.status(400).send(e)
    })
})

app.listen(PORT, () => {
    console.log(`Started at port ${PORT}`)
})

module.exports = {app}