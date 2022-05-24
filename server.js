'use strict'
import fs from 'fs'
import tgBot from 'node-telegram-bot-api'
import TOKEN from './token.mjs'

const bot = new tgBot(TOKEN, {polling: true})
const TZ = 4
const interval = 1000 * 5 * 60

let users = {}
let workHolidays = {}
const timeRegex = /([01]\d|2[0-3])([:;.,/-\\*\\+]|)([0-5]\d)/
let TODAY = addHours(new Date(), TZ)

onInit()

setInterval(() => {iterate()}, interval)

function iterate() {
    let i = 0
    for (const chatId in users) {
        if (users[chatId]['time'] <= dateToHoursMinutes(TODAY) && users[chatId]['nextDay'] <= dateToApiFormat(TODAY)) {
            bot.sendMessage(chatId, `${sendSerious(7)}`, {parse_mode: 'html'})
            users[chatId]['nextDay'] = dateToApiFormat(addDays(removeTime(TODAY),1))
            i++
        }
    }
    if (i > 0) {writeFileAsync('./users.db', users)}
    TODAY = addHours(new Date(), TZ)
}

function sendSerious(n) {
    let response = ''
    const today = dateToApiFormat(removeTime(TODAY))
    console.log('today',today)
    const tomorrow = dateToApiFormat(addDays(today,1))
    console.log('tomorrow',tomorrow)
    const endDate = dateToApiFormat(addDays(today,n))
    console.log('endDate',endDate)
    for (let i = 0; i < Object.keys(workHolidays).length; i++) {
        let dateFromArr = workHolidays[i][0]
        console.log('dateFromArr',dateFromArr)
        if (dateFromArr === today) {
            const holiday = '❗<b>СЕГОДНЯ - ' + (workHolidays[i][2]).toUpperCase() + '❗</b>'
            response += `${holiday}` + `\n`
        } else if (dateFromArr === tomorrow) {
            const holiday = '⚠️ <b>Завтра - ' + workHolidays[i][2] + '</b>'
            response += `${holiday}` + `\n`
        } else if (dateFromArr > tomorrow && dateFromArr <= endDate) {
            const holiday = '<b>' + workHolidays[i][1] + '</b> - ' + workHolidays[i][2]
            response += `${holiday}` + `\n`
        }
    }
    if (response.length === 0) {response = 'В течение ближайших ${n} дней ничего не намечается... 🥱'}
    return response
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id
    if (msg.text.search(timeRegex) !== -1 && users?.[chatId]?.['time'] !== undefined) {
        let time1 = msg.text.match(timeRegex)[0]
        let time2 = time1.slice(0,2) + '-' + time1.slice(-2)
        users[chatId]['time'] = time2
        users[chatId]['nextDay'] = dateToApiFormat(removeTime(TODAY))
        // bot.sendMessage(chatId, `Вы успешно поменяли время на ${users[chatId]['time']}! ⏰`)
        bot.sendMessage(chatId, `Вы успешно поменяли время на ${prettyTime(users[chatId]['time'])}! ⏰`)
        writeFileAsync('./users.db', users)
    } else if (msg.text === '/main_menu')   {
        const options = optionsMenu()
        bot.sendMessage(chatId, `Смотри, что могу 😜`, options)
    } else if (msg.text === '/time_debug')   {
        bot.sendMessage(chatId, `${TODAY}`)
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
            if (users?.[chatId]?.['time'] !== undefined) {
                bot.sendMessage(chatId, `Вы уже подписаны, так держать! 😊 \nСообщения будут приходить примерно в <b>${prettyTime(users[chatId]['time'])}</b>. \nЕсли вы хотите сменить время подписки, отправьте в ответ время в формате <b>ХХ:ХХ</b>`, {parse_mode: 'html'})
            } else if (users?.[chatId]?.['time'] === undefined) {
                users[chatId] = {}
                users[chatId]['time'] = '12-00'
                users[chatId]['nextDay'] = dateToApiFormat(removeTime(TODAY))
                writeFileAsync('./users.db', users)
                bot.sendMessage(chatId, `Вы успешно подписались! 😊 Сообщения будут приходить примерно в <b>${prettyTime(users[chatId]['time'])}</b>. Если вы хотите сменить время подписки, отправьте в ответ время в формате <b>ХХ:ХХ</b>`, {parse_mode: 'html'})
            }
        }
        if (callbackQuery.data === '/unsubscribe') {
            if (users?.[chatId]?.['time'] !== undefined) {
                users[chatId]['time'] = undefined
                writeFileAsync('./users.db', users)
                bot.sendMessage(chatId, 'Вы успешно отписались... Как Вы могли так поступить? 😭')
            } else if (users?.[chatId]?.['time'] === undefined) {
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
    const inlineKeyboardM = {'inline_keyboard': buttonsM}
    const optionsM = {parse_mode: 'html', reply_markup: inlineKeyboardM}
    return optionsM
}

async function onInit() {
    readFileAsync('./users.db')
    .then( data => {
        users = JSON.parse(data)
        console.log(`Loaded users:`,Object.keys(users).length)
    })
    .catch( err => console.log('err',err))

    readFileAsync('./workholidays.txt')
    .then( data => {
        workHolidays = JSON.parse(data)
        console.log(`Loaded work holidays:`,Object.keys(workHolidays).length)
    })
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
