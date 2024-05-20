const {Client,Events,GatewayIntentBits} = require('discord.js');
const {token, api_key} = require('./config.json');
const axios = require('axios');
const FormData = require('form-data');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.attachments.size > 0) {
        console.log(`[${message.guild.name}] [${message.channel.name}] [${message.author.tag}] File Detected, uploading to Triage...`);
                       
            const attachmentScore = await scanAttachementUsingTriage(message.attachments);
            
            if (attachmentScore) {
                
                message.delete()
                try {
                    if (message.member.bannable) {
                        message.member.ban({
                        
                            deleteMessageSeconds: 60 * 60 * 24 * 7,
                            reason: `Posting malware in ${message.channel.name}`
                        }).then(console.log(`[${message.guild.name}] [${message.channel.name}] [${message.author.tag}] File contained malware - banned user from ${message.guild.name}`))
                    }
                } catch (error) {
                    console.error(error)
                }
            } 
    }
});

client.login(token)

async function scanAttachementUsingTriage(attachments) { // return true if the file is malware

    try {
        attachments.forEach(async attachment => {
          //Upload attachement
            
          let data = new FormData();
          data.append('url', `${attachment.url}`);
          
          let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://tria.ge/api/v0/samples/',
            headers: { 
              'Authorization': `Bearer ${api_key}`, 
              'Content-Type': 'multipart/form-data', 
              ...data.getHeaders()
            },
            data : data
          };
          
          axios.request(config)
          .then((response) => {
            console.log(JSON.stringify(response.data));
            if (response.data.analysis.score > 7) return true;
          })
          .catch((error) => {
            console.log(error);
          });
          


        });
    } catch (error) {
        console.error(error)
    }   
    
    return false;
}

