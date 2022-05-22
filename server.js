const OPTIONS = require('./token/token.js')
const TelegramBot = require('node-telegram-bot-api')
const cron = require('node-cron');
const express = require('express')
const fs = require('fs');

// const Promise = require('bluebird');
// Promise.config({
//   cancellation: true
// });

const app = express()
const bot = new TelegramBot(OPTIONS.TOKEN, {polling: true})
const port = process.env.PORT || 3000
let recipientsList = []

app.listen(port, () => console.log('Eavesdropping at port',port,'🤫'))
app.use(express.static('public'))

// recipientsList = readFileAsync('./subscribers.db')
// console.log(recipientsList)

readFileAsync('./subscribers.db')
.then( (data) => JSON.parse(data))
.then( (data) => recipientsList = data)
.catch( err => console.log('err',err))

// setTimeout(() => {console.log(recipientsList)}, 1000);

bot.on('message', (msg) => {
    const chatId = msg.chat.id
    if (msg.text === '/subscribe') {
        if (recipientsList.indexOf(chatId) !== -1) {
            bot.sendMessage(chatId, 'Already subscribed! 😊')
        } else if (recipientsList.indexOf(chatId) === -1) {
            recipientsList.push(chatId)
            writeFileAsync('./subscribers.db', recipientsList)
            bot.sendMessage(chatId, 'Subscribed successfully! 😊')
        }
    }
    if (msg.text === '/unsubscribe') {
        if (recipientsList.indexOf(chatId) !== -1) {
            recipientsList.splice(recipientsList.indexOf(chatId), 1)
            writeFileAsync('./subscribers.db', recipientsList)
            bot.sendMessage(chatId, 'Unsubscribed successfully! 😭')
        } else if (recipientsList.indexOf(chatId) === -1) {
            bot.sendMessage(chatId, 'You are not subscribed at all! 🤨')
        }
    }
    if (msg.text === '/start') {
        bot.sendMessage(chatId, 'Hello!')
    }
})

cron.schedule('34 21 * * *', () => {
    recipientsList.forEach(chatId => {
        bot.sendMessage(chatId, 'DATAAAAAA! 😲😲😲')
        console.log('sent...')
    });
})

async function readFileAsync (filename) {
    return new Promise( (resolve, reject) => {
        fs.readFile(filename, 'utf-8', (error, data) => {
            if (error) reject(error)
            if (data) {
                // console.log(data)
                resolve(data)
            }
        })
    })
}

async function writeFileAsync (filename, data) {
    return new Promise( (resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(data), (error, data) => {
            if (data) {resolve(data)}
            if (error) {reject(error)}
        })
    })
}

// app.post('/', function(req, res) {
//   console.log('lolchik')
// })

// setInterval(() => {
//     console.log(`😳 I'm not sleeping! 😨`)
// }, 60000);