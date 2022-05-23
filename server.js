'use strict'
import express from 'express'
import fs from 'fs'
import tgBot from 'node-telegram-bot-api'
import TOKEN from './token/token.mjs'

const app = express()
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Eavesdropping at port',port,'🤫'))

const bot = new tgBot(TOKEN, {polling: true})

let subscribers = []
let holidays = {}
const TODAY = new Date()

readFileAsync('./subscribers.db')
.then( data => subscribers = JSON.parse(data))
.catch( err => console.log('err',err))

readFileAsync('./przdnki.txt')
.then( data => holidays = JSON.parse(data))
.catch( err => console.log('err',err))

bot.on('message', (msg) => {
    const chatId = msg.chat.id
    if (msg.text === '/subscribe') {
        if (subscribers.indexOf(chatId) !== -1) {
            bot.sendMessage(chatId, 'Already subscribed! 😊')
        } else if (subscribers.indexOf(chatId) === -1) {
            subscribers.push(chatId)
            writeFileAsync('./subscribers.db', subscribers)
            bot.sendMessage(chatId, 'Subscribed successfully! 😊')
        }
    }
    if (msg.text === '/unsubscribe') {
        if (subscribers.indexOf(chatId) !== -1) {
            subscribers.splice(subscribers.indexOf(chatId), 1)
            writeFileAsync('./subscribers.db', subscribers)
            bot.sendMessage(chatId, 'Unsubscribed successfully! 😭')
        } else if (subscribers.indexOf(chatId) === -1) {
            bot.sendMessage(chatId, 'You are not subscribed at all! 🤨')
        }
    }
    if (msg.text === '/getholidays7') {
        let response = ''
        const today = dateToApiFormat(removeTime(TODAY))
        const tomorrow = dateToApiFormat(addDays(today,1))
        const today7 = dateToApiFormat(addDays(today,7))
        for (let i = 0; i < Object.keys(holidays).length; i++) {
            let dateFromArr = holidays[i][0]
            if (dateFromArr === today) {
                const holiday = '❗<b>СЕГОДНЯ - ' + (holidays[i][2]).toUpperCase() + '❗</b>'
                response += `${holiday}` + `\n`
            } else if (dateFromArr === tomorrow) {
                const holiday = '⚠️ <b>Завтра - ' + holidays[i][2] + '</b>'
                response += `${holiday}` + `\n`
            } else if (dateFromArr > tomorrow && dateFromArr <= today7) {
                const holiday = '<b>' + holidays[i][1] + '</b> - ' + holidays[i][2]
                response += `${holiday}` + `\n`
            }
        }
        bot.sendMessage(chatId, `${response}`, {parse_mode: 'html'})
    }
    if (msg.text === '/getholidays30') {
        let response = ''
        const today = dateToApiFormat(removeTime(TODAY))
        const tomorrow = dateToApiFormat(addDays(today,1))
        const today30 = dateToApiFormat(addDays(today,30))
        for (let i = 0; i < Object.keys(holidays).length; i++) {
            let dateFromArr = holidays[i][0]
            if (dateFromArr === today) {
                const holiday = '❗<b>СЕГОДНЯ - ' + (holidays[i][2]).toUpperCase() + '❗</b>'
                response += `${holiday}` + `\n`
            } else if (dateFromArr === tomorrow) {
                const holiday = '⚠️ <b>Завтра - ' + holidays[i][2] + '</b>'
                response += `${holiday}` + `\n`
            } else if (dateFromArr > tomorrow && dateFromArr <= today30) {
                const holiday = '<b>' + holidays[i][1] + '</b> - ' + holidays[i][2]
                response += `${holiday}` + `\n`
            }
        }
        bot.sendMessage(chatId, `${response}`, {parse_mode: 'html'})
    }
    if (msg.text === '/start') {
        bot.sendMessage(chatId, `Main Menu`, {parse_mode: 'html', reply_markup: { 'keyboard': [[{text:'AAA', callback_data:'BBB'}]]} })
    }
})

async function readFileAsync(path) {
    return new Promise( (resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, data) => {
            if (error) reject(error)
            if (data) {
                resolve(data)
            }
        })
    })
}

async function writeFileAsync(path, data) {
    return new Promise( (resolve, reject) => {
        fs.writeFile(path, JSON.stringify(data), (error, data) => {
            if (data) {resolve(data)}
            if (error) {reject(error)}
        })
    })
}

////////////////////////////////////////////////////////////////////////////////
function dateToApiFormat(date) {                               // TIME FUNCTIONS
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = (date.getDate()).toString().padStart(2, "0");
    let string = year.toString() + '-' + month.toString() + '-' + day.toString();
    return string;
}

function removeTime(date) {                  // AND CONVERT FROM API TO JS STYLE
    let result = new Date(date)
    return new Date(
      result.getFullYear(),
      result.getMonth(),
      result.getDate()
    );
}

function addDays(date, days = 0) {
    let result = new Date(date);
    return new Date(result.setDate(result.getDate() + days));
}