
'use strict'
process.env.NTBA_FIX_319 = 1;

// import fetch from 'node-fetch'
import TOKEN from './token/token.mjs'
import tgBot from 'node-telegram-bot-api'
// import cron  from 'node-cron'
import express from 'express'
import fs from 'fs'



const app = express()
const bot = new tgBot(TOKEN, {polling: true})
const port = process.env.PORT || 3000
let subscribers = []
let holidays = {}
const TODAY = new Date()
// const TODAY = '2022-06-12'

app.listen(port, () => console.log('Eavesdropping at port',port,'🤫'))
app.use(express.static('public'))

readFileAsync('./subscribers.db')
// .then( data => subscribers = data)
.then( data => subscribers = JSON.parse(data))
.catch( err => console.log('err',err))

// setTimeout(() => {console.log(subscribers)}, 100);

readFileAsync('./przdnki.txt')
.then( data => holidays = JSON.parse(data))
.catch( err => console.log('err',err))

// setTimeout(() => {console.log(holidays)}, 100);

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
            // console.log(dateFromArr)
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
        // console.log(response)
        bot.sendMessage(chatId, `${response}`, {parse_mode: 'HTML'})
    }
    if (msg.text === '/getholidays30') {
        let response = ''
        const today = dateToApiFormat(removeTime(TODAY))
        const tomorrow = dateToApiFormat(addDays(today,1))
        const today30 = dateToApiFormat(addDays(today,30))
        for (let i = 0; i < Object.keys(holidays).length; i++) {
            let dateFromArr = holidays[i][0]
            // console.log(dateFromArr)
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
        // console.log(response)
        bot.sendMessage(chatId, `${response}`, {parse_mode: 'HTML'})
    }
})

// cron.schedule('34 21 * * *', () => {
//     subscribers.forEach(chatId => {
//         bot.sendMessage(chatId, 'TADAAAAAAAAAA! 😲😲😲')
//         console.log('sent...')
//     });
// })

async function readFileAsync(filename) {
    return new Promise( (resolve, reject) => {
        fs.readFile(filename, 'utf-8', (error, data) => {
            if (error) reject(error)
            if (data) {
                // console.log(data)
                resolve(data)
                // resolve(JSON.parse(data))
            }
        })
    })
}

async function writeFileAsync(filename, data) {
    return new Promise( (resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(data), (error, data) => {
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

// app.post('/', function(req, res) {
//   console.log('lolchik')
// })

// setInterval(() => {
//     console.log(`😳 I'm not sleeping! 😨`)
// }, 60000);









// fetch('https://htmlweb.ru/service/api.php?holiday&d_from=2022-05-22&d_to=2022-06-22')
// .then( data => {
//     let a = data.querySelectorAll('tr')
//     console.log(a)
// })
// .then( data => data.text())
// .then( data => parseHtml(data))
// .then( data => {
//     let tmp = {}
//     let parse = document.querySelectorAll('tr')
//     console.log('data', parse)
// })

// function parseHtml(string) {
//     const result = {}
//     let temp = string.slice(string.indexOf('</td></tr>')+10)
//     console.log(temp)
//     // while (temp.indexOf('<tr id=') !== -1) {
//     //     console.log(temp.indexOf('<tr id='))
//     //     temp = temp.slice(temp.indexOf('</td></tr>')+10)
//     // }
// }





// readFileAsync('./przdtext.txt')
// .then(data => {
//     let calend = {
//         '01':'января',
//         '02':'февраля',
//         '03':'марта',
//         '04':'апреля',
//         '05':'мая',
//         '06':'июня',
//         '07':'июля',
//         '08':'августа',
//         '09':'сентября',
//         '10':'октября',
//         '11':'ноября',
//         '12':'декабря',
//     }
//     let tmp = data.split('\r\n')
//     const result = {}
//     let i = 0
//     tmp.forEach(element => {
//         let tmpDate = '2022-'
//         let month = element.slice(element.indexOf('.')+1,element.indexOf(':'))
//         tmpDate += month
//         tmpDate += '-'
//         let day = element.slice(0,element.indexOf('.'))
//         tmpDate += day
//         const tmpDescr = element.slice(element.indexOf(':')+1)
//         result[i] = []
//         result[i].push(tmpDate)
//         result[i].push(day + ' ' + calend[month])
//         result[i].push(tmpDescr)
//         i++
//     });
//     console.log(JSON.stringify(result))
//     return result
// })
// .then( data => writeFileAsync('./pr.txt', data))