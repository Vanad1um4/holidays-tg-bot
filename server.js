'use strict'
import fs from 'fs'
import tgBot from 'node-telegram-bot-api'
import TOKEN from './token.mjs'

const bot = new tgBot(TOKEN, {polling: true})
const TZ = 4

let subscribers = {}
let holidays = {}
const timeRegex = /([01]\d|2[0-3])([:;.,/-\\*\\+]|)([0-5]\d)/
let TODAY = new Date()
TODAY = addHours(TODAY, TZ)

onInit()

setInterval(() => {iterate()}, 1000*60*5)

function iterate() {
    let i = 0
    for (const chatId in subscribers) {
        console.log(subscribers[chatId]['time'])
        console.log(dateToHoursMinutes(TODAY))
        console.log(subscribers[chatId]['nextDay'])
        console.log(dateToApiFormat(TODAY))
        console.log(subscribers[chatId]['time'] <= dateToHoursMinutes(TODAY))
        console.log(subscribers[chatId]['nextDay'] <= dateToApiFormat(TODAY))
        if (subscribers[chatId]['time'] <= dateToHoursMinutes(TODAY) && subscribers[chatId]['nextDay'] <= dateToApiFormat(TODAY)) {
            bot.sendMessage(chatId, `${sendSerious(7)}`, {parse_mode: 'html'})
            subscribers[chatId]['nextDay'] = dateToApiFormat(addDays(removeTime(TODAY),1))
            i++
        }
    }
    if (i > 0) {writeFileAsync('./subscribers.db', subscribers)}
    TODAY = new Date()
}

function sendSerious(n) {
    let response = ''
    const today = dateToApiFormat(removeTime(TODAY))
    const tomorrow = dateToApiFormat(addDays(today,1))
    const endDate = dateToApiFormat(addDays(today,n))
    for (let i = 0; i < Object.keys(holidays).length; i++) {
        let dateFromArr = holidays[i][0]
        if (dateFromArr === today) {
            const holiday = '❗<b>СЕГОДНЯ - ' + (holidays[i][2]).toUpperCase() + '❗</b>'
            response += `${holiday}` + `\n`
        } else if (dateFromArr === tomorrow) {
            const holiday = '⚠️ <b>Завтра - ' + holidays[i][2] + '</b>'
            response += `${holiday}` + `\n`
        } else if (dateFromArr > tomorrow && dateFromArr <= endDate) {
            const holiday = '<b>' + holidays[i][1] + '</b> - ' + holidays[i][2]
            response += `${holiday}` + `\n`
        }
    }
    if (response.length === 0) {response = 'В течение ближайших ${n} дней ничего не намечается... 🥱'}
    return response
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id
    if (msg.text.search(timeRegex) !== -1 && subscribers?.[chatId]?.['time'] !== undefined) {
        let time1 = msg.text.match(timeRegex)[0]
        let time2 = time1.slice(0,2) + '-' + time1.slice(-2)
        subscribers[chatId]['time'] = time2
        subscribers[chatId]['nextDay'] = dateToApiFormat(removeTime(TODAY))
        // bot.sendMessage(chatId, `Вы успешно поменяли время на ${subscribers[chatId]['time']}! ⏰`)
        bot.sendMessage(chatId, `Вы успешно поменяли время на ${prettyTime(subscribers[chatId]['time'])}! ⏰`)
        writeFileAsync('./subscribers.db', subscribers)
    } else if (msg.text === '/main_menu')   {
        const options = optionsMenu()
        bot.sendMessage(chatId, `Смотри, что могу 😜`, options)
    } else {
        const buttons = [[{text:'Да!', callback_data:'/main_menu'}]]
        const inlineKeyboard = { 'inline_keyboard': buttons}
        const options = {parse_mode: 'html', reply_markup: inlineKeyboard}
        bot.sendMessage(chatId, `Ничего не понимаю... 😵 Показать меню?`, options)
    }
})

bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id
    bot.answerCallbackQuery(callbackQuery.id)
    .then(() => {
        if (callbackQuery.data === '/main_menu') {
            const options = optionsMenu()
            bot.sendMessage(chatId, `Смотри, что могу 😜`, options)
        }
        if (callbackQuery.data === '/get7daysSeriuos') {
            bot.sendMessage(chatId, `${sendSerious(7)}`, {parse_mode: 'html'})
        }
        if (callbackQuery.data === '/get30daysSeriuos') {
            bot.sendMessage(chatId, `${sendSerious(30)}`, {parse_mode: 'html'})
        }
        if (callbackQuery.data === '/subscribe') {
            if (subscribers?.[chatId]?.['time'] !== undefined) {
                bot.sendMessage(chatId, `Вы уже подписаны, так держать! 😊 \nСообщения будут приходить примерно в <b>${prettyTime(subscribers[chatId]['time'])}</b>. \nЕсли вы хотите сменить время подписки, отправьте в ответ время в формате <b>ХХ:ХХ</b>`, {parse_mode: 'html'})
            } else if (subscribers?.[chatId]?.['time'] === undefined) {
                subscribers[chatId] = {}
                subscribers[chatId]['time'] = '12-00'
                subscribers[chatId]['nextDay'] = dateToApiFormat(removeTime(TODAY))
                writeFileAsync('./subscribers.db', subscribers)
                bot.sendMessage(chatId, `Вы успешно подписались! 😊 Сообщения будут приходить примерно в <b>${prettyTime(subscribers[chatId]['time'])}</b>. Если вы хотите сменить время подписки, отправьте в ответ время в формате <b>ХХ:ХХ</b>`, {parse_mode: 'html'})
            }
        }
        if (callbackQuery.data === '/unsubscribe') {
            if (subscribers?.[chatId]?.['time'] !== undefined) {
                subscribers[chatId]['time'] = undefined
                writeFileAsync('./subscribers.db', subscribers)
                bot.sendMessage(chatId, 'Вы успешно отписались... Как Вы могли так поступить? 😭')
            } else if (subscribers?.[chatId]?.['time'] === undefined) {
                bot.sendMessage(chatId, 'Хм. Вы и так не подписаны... 🤨')
            }
        }
    });
});

function optionsMenu() {
    const buttonsM = [
        [{text:'Гос. и проф. праздники на следующие 7 дней', callback_data:'/get7daysSeriuos'}],
        [{text:'То же, только на месяц вперед', callback_data:'/get30daysSeriuos'}],
        [{text:'Подписаться на ежедневную рассылку', callback_data:'/subscribe'}],
        [{text:'Отписаться от нее', callback_data:'/unsubscribe'}]
    ]
    const inlineKeyboardM = { 'inline_keyboard': buttonsM}
    const optionsM = {parse_mode: 'html', reply_markup: inlineKeyboardM}
    return optionsM
}

async function onInit() {
    readFileAsync('./subscribers.db')
    .then( data => {
        subscribers = JSON.parse(data)
        console.log(subscribers)
    })
    .catch( err => console.log('err',err))

    readFileAsync('./przdnki.txt')
    .then( data => holidays = JSON.parse(data))
    .catch( err => console.log('err',err))
}

async function readFileAsync(path) {
    return new Promise( (resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, data) => {
            if (error) reject(error)
            if (data) resolve(data)
        })
    })
}

async function writeFileAsync(path, data) {
    return new Promise( (resolve, reject) => {
        fs.writeFile(path, JSON.stringify(data), 'utf-8', (error, data) => {
            if (data) resolve(data)
            if (error) reject(error)
        })
    })
}

////////////////////////////////////////////////////////////////////////////////
function dateToApiFormat(date) {                               // TIME FUNCTIONS
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = (date.getDate()).toString().padStart(2, "0")
    const string = year.toString() + '-' + month.toString() + '-' + day.toString()
    return string
}

function dateToHoursMinutes(date) {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const string = hours.toString() + '-' + minutes.toString()
    return string
}

function removeTime(date) {                  // AND CONVERT FROM API TO JS STYLE
    const result = new Date(date)
    return new Date(
      result.getFullYear(),
      result.getMonth(),
      result.getDate(),
    );
}

function addDays(date, days = 0) {
    const result = new Date(date)
    return new Date(result.setDate(result.getDate() + days))
}

function addHours(date, hours = 0) {
    const result = new Date(date)
    return new Date(result.setTime(result.getTime() + hours * 60 * 60 * 1000))
}
  
function prettyTime(input) {
    return input.slice(0,2) + ':' + input.slice(-2)
}
