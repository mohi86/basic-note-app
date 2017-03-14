const expect = require('expect')
const request = require('supertest')
const {ObjectID} = require('mongodb')

const {app} = require('./../server')
const {Todo} = require('./../models/todo')
const {todos, populateTodos} = require('./seed/seed')
const {users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers)
beforeEach(populateTodos)

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        let text = 'test todo text'

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1)
                    expect(todos[0].text).toBe(text)
                    done()
                }).catch((e) => done(e));
            })
    })

    it('should not create todo with bad request', (done) => {
        let text = 'n'

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({text})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2)
                    done()
                }).catch((e) => {
                    done(e)
                })
            })
    })
})

describe('Get /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(1)
            })
            .end(done)
    })
})

describe('Get todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text)
            })
            .end(done)
    })

    it('should return a 404 if todo not found', (done) => {
        let hexId = new ObjectID().toHexString();

        request(app)
            .get(`/todos/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })

    it('should return 400 for non-object ids', (done) => {
        request(app)
            .get('/todos/1234')
            .set('x-auth', users[0].tokens[0].token)
            .expect(400)
            .end(done)
    })
})

describe('DELETE /todos/:id ', () => {
    it('should delete a todo', (done) => {
        var hexId = todos[1]._id.toHexString()

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(hexId)
            })
            .end((err) => {
                if(err) {
                    return done(err)
                }
                Todo.findById(hexId).then((todo) => {
                    expect(todo).toNotExist()
                    done()
                }).catch((e) => {done(e)})
            })
    })
})

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {
        hexId = todos[1]._id.toHexString()
        let text = "Some changed text"

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(true)
                expect(res.body.todo.completedAt).toBeA('number')
            })
            .end(done)
    })

    it('should clear completedAt when todo is not completed', (done) => {
        hexId = todos[0]._id.toHexString()
        let text = "Some changed text dah"

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
                completed: false,
                text
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(false)
                expect(res.body.todo.completedAt).toNotExist()
            })
            .end(done)
    })
})

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString())
                expect(res.body.email).toBe(users[0].email)
            })
            .end(done)
    })

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', 'ujafghgvabvafyhgbaydhibv4ht63h4ebt63jh45bv63jhg56v')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({error: 'User not authorized'})
            })
            .end(done)
    })
})

describe('POST /users/me', () => {
    it('should create a user', (done) => {
        let email = 'example@test.com'
        let password = 'abcd1234'

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist()
                expect(res.body._id).toExist()
                expect(res.body.email).toBe(email)
            })
            .end(done)
    })

    it('should return validation errors for invalid requests', (done) => {
        request(app)
            .post('/users')
            .send({email: 'invalideEmail', password: 'pass'})
            .expect(400)
            .end(done)
    })

    it('should not create user email is used', (done) => {
        request(app)
            .post('/users')
            .send({email: 'mjkhalili@live.com', password: 'pass'})
            .expect(400)
            .end(done)
    })
})