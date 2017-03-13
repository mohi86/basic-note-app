const {User} = require('./../models/user')

const authenticate = (req, res, next) => {
    const token = req.header('x-auth')

    User.findByToken(token).then((user) => {
        if(!user) {
            return Promise.reset()
        }
        req.user = user
        req.token = token
        next()
    }).catch((e) => {
        res.status(401).send({error: 'User not authorized'})
    })
}

module.exports = {authenticate}