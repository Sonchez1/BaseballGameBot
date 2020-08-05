const { createServer } = require('http');
const express = require('express')
const bodyParser = require('body-parser')
const { createEventAdapter } = require('@slack/events-api')
const { WebClient } = require('@slack/web-api')
const { createMessageAdapter } = require('@slack/interactive-messages')
const port = process.env.PORT || 3000
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
const token = process.env.SLACK_BOT_TOKEN
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET)
const webClient = new WebClient(token)
const app = express()
app.use('/slack/events', slackEvents.requestListener())
app.use('/slack/actions', slackInteractions.requestListener())
app.use(bodyParser());
const server = createServer(app);


server.listen(port, () => {
    console.log(`Listening for events on ${server.address().port}`);
})


// Global variables
const randomNumber = Math.floor(Math.random() * 1000);
let count = 10;
const channel = 'baseball_bot';
console.log(randomNumber);


// Attachments


(async () => {
    const res = await webClient.chat.postMessage({ 
        channel: channel, 
        text: 'Let\'s Play Some Number Baseball game!',
        'attachments': [
            {
                "text": "What side would you like to play",
                "fallback": "You are unable to choose a side",
                "callback_id": "baseball_game",
                "color": "#5AD3E6",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "offenseSide",
                        "text": "Offense",
                        "type": "button",
                        "value": "offense",
                        "action_id": "offense_game"
                    },
                    {
                        "name": "defenseSide",
                        "text": "Defense",
                        "type": "button",
                        "value": "defense",
                        "action_id": "defense_game"
                    },
                    {
                        "name": "help",
                        "text": "I Need Help!",
                        "style": "danger",
                        "type": "button",
                        "value": "help",
                        "confirm": {
                            "title": "To Play The Number Baseball Game",
                            "text": "For Offensive Side, " + 
                            "I would have a three-digit number and you have 10 chances to guess it correctly! " +
                            "For Defensive Side, " +
                            "You would have a three-digit number and I have 10 chances to guess correctly! " +
                            "For either side, if the number is in the right order, it will be a strike, " +
                            "else it would be a ball."
                        }
                    }
                ]
            }
        ]
});
})();

//Lets you decide what side you want to play
slackInteractions.action({ type: 'button' }, (payload, ) => {
    let side = payload.actions[0].value;
    if (side === 'offense') {
        webClient.chat.postMessage({
            channel: channel,
            text: 'I have a three-digit number!\nYou have 10 chances to guess it correctly!'
        })
    } else if (side === 'defense') {
        webClient.chat.postMessage({
            channel: channel,
            text: 'Do you have a number in mind?'
        })
    }
})


slackEvents.on('message', (event) => {
    if (event.type !== 'message') {
        return;
    }
    // Prevents the both from being both the bot and the player
    if (event.user === 'W01502YPRDJ') { 
        return;
    }
    let text = event.text;
    if (text.includes('Yes') || text.includes('ball') 
    || text.includes('strike') || text.includes('No matches') 
    || text.includes('chances') || text.includes('Game over')) {
        checkDefenseNumber(text);
    } else if (typeof Number(text) === 'number') {
        checkOffenseNumber(text);
    }
});

// Checks the offense number
function checkOffenseNumber(num) {
    randstring = randomNumber.toString();
    numString = num.toString();
    let strike = 0;
    let ball = 0;
    let output = '';
    for (let i = 0; i < randstring.length; i++) {
        for (let j = 0; j < numString.length; j++) {
            if (randstring[i] === numString[j]) {
                if (i === j) {
                    strike += 1;
                } else {
                    ball += 1;
                }
            }
        }
    }

    // If strike === 3
    if (strike === 3 && ball === 0) {
        webClient.chat.postMessage({
            channel: channel,
            text: '3 strike! You are a Champion!\nDo you wish to play again?',
            'attachments': [
                {
                    "text": "What side would you like to play",
                    "fallback": "You are unable to choose a side",
                    "callback_id": "baseball_game",
                    "color": "#5AD3E6",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "offenseSide",
                            "text": "Offense",
                            "type": "button",
                            "value": "offense",
                            "action_id": "offense_game"
                        },
                        {
                            "name": "defenseSide",
                            "text": "Defense",
                            "type": "button",
                            "value": "defense",
                            "action_id": "defense_game"
                        },
                        {
                            "name": "help",
                            "text": "I Need Help!",
                            "style": "danger",
                            "type": "button",
                            "value": "help",
                            "confirm": {
                                "title": "To Play The Number Baseball Game",
                                "text": "For Offensive Side, " + 
                                "I would have a three-digit number and you have 10 chances to guess it correctly! " +
                                "For Defensive Side, " +
                                "You would have a three-digit number and I have 10 chances to guess correctly! " +
                                "For either side, if the number is in the right order, it will be a strike, " +
                                "else it would be a ball."
                            }
                        }
                    ]
                }
            ]        
        })
        return;
    }

    // If strike and ball are 0
    else if (strike === 0 && ball === 0) {
        output = 'No matches were found!'
    }

    // If strike > 0 and ball is 0
    else if (strike > 0 && ball === 0) {
        output = `${strike} strike!`;
    }

    // If strike is 0 and ball > 0
    else if (strike === 0 && ball > 0) {
        output = `${ball} ball!`
    }

    // If strike and ball are > 0
    else if (strike > 0 && ball > 0) {
        output = `${strike} strike and ${ball} ball!`;
    }
    count -= 1;
    if (count > 1) {
        webClient.chat.postMessage({
            channel: channel,
            text: output + `\nYou have ${count} more chances!`
        })
    } else if (count === 1) {
        webClient.chat.postMessage({
            channel: channel,
            text: output + '\nYou have only 1 chance left!'
        })
    } else {
        webClient.chat.postMessage({
            channel: channel,
            text: output + `\nGame over! The number was ${randstring}!\nYou can start the game again!`,
            'attachments': [
                {
                    "text": "What side would you like to play",
                    "fallback": "You are unable to choose a side",
                    "callback_id": "baseball_game",
                    "color": "#5AD3E6",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "offenseSide",
                            "text": "Offense",
                            "type": "button",
                            "value": "offense",
                            "action_id": "offense_game"
                        },
                        {
                            "name": "defenseSide",
                            "text": "Defense",
                            "type": "button",
                            "value": "defense",
                            "action_id": "defense_game"
                        },
                        {
                            "name": "help",
                            "text": "I Need Help!",
                            "style": "danger",
                            "type": "button",
                            "value": "help",
                            "confirm": {
                                "title": "To Play The Number Baseball Game",
                                "text": "For Offensive Side, " + 
                                "I would have a three-digit number and you have 10 chances to guess it correctly! " +
                                "For Defensive Side, " +
                                "You would have a three-digit number and I have 10 chances to guess correctly! " +
                                "For either side, if the number is in the right order, it will be a strike, " +
                                "else it would be a ball."
                            }
                        }
                    ]
                }
            ]
    
        })
    }
}

// Checks Defense Number of the bot
function checkDefenseNumber(text) {
    if (text === 'Game over') {
        webClient.chat.postMessage({ 
            channel: channel, 
            text: 'I can\'t believe I lost! Wanna go another round?',
            'attachments': [
                {
                    "text": "What side would you like to play",
                    "fallback": "You are unable to choose a side",
                    "callback_id": "baseball_game",
                    "color": "#5AD3E6",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "offenseSide",
                            "text": "Offense",
                            "type": "button",
                            "value": "offense",
                            "action_id": "offense_game"
                        },
                        {
                            "name": "defenseSide",
                            "text": "Defense",
                            "type": "button",
                            "value": "defense",
                            "action_id": "defense_game"
                        },
                        {
                            "name": "help",
                            "text": "I Need Help!",
                            "style": "danger",
                            "type": "button",
                            "value": "help",
                            "confirm": {
                                "title": "To Play The Number Baseball Game",
                                "text": "For Offensive Side, " + 
                                "I would have a three-digit number and you have 10 chances to guess it correctly! " +
                                "For Defensive Side, " +
                                "You would have a three-digit number and I have 10 chances to guess correctly! " +
                                "For either side, if the number is in the right order, it will be a strike, " +
                                "else it would be a ball."
                            }
                        }
                    ]
                }
            ]
    });    
    } else if (text !== '3 strike') {
        const randNum = Math.floor(Math.random() * 1000);
        webClient.chat.postMessage({
        channel: channel,
        text: randNum
        })
    } else if (text === '3 strike') {
        webClient.chat.postMessage({
            channel: channel,
            text: 'Haha! You thought I was gonna lose? Joke\'s on you! \n Let\'s play another round!',
            'attachments': [
                {
                    "text": "What side would you like to play",
                    "fallback": "You are unable to choose a side",
                    "callback_id": "baseball_game",
                    "color": "#5AD3E6",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "offenseSide",
                            "text": "Offense",
                            "type": "button",
                            "value": "offense",
                            "action_id": "offense_game"
                        },
                        {
                            "name": "defenseSide",
                            "text": "Defense",
                            "type": "button",
                            "value": "defense",
                            "action_id": "defense_game"
                        },
                        {
                            "name": "help",
                            "text": "I Need Help!",
                            "style": "danger",
                            "type": "button",
                            "value": "help",
                            "confirm": {
                                "title": "To Play The Number Baseball Game",
                                "text": "For Offensive Side, " + 
                                "I would have a three-digit number and you have 10 chances to guess it correctly! " +
                                "For Defensive Side, " +
                                "You would have a three-digit number and I have 10 chances to guess correctly! " +
                                "For either side, if the number is in the right order, it will be a strike, " +
                                "else it would be a ball."
                            }
                        }
                    ]
                }
            ]
    
        })

    }
}