const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var express = require('express');
var app = express();
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
let authentication;
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), get_site_info);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    authentication = oAuth2Client;
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

async function getSheet(auth,pageTitle){
    const sheets = google.sheets({version: 'v4', auth});
    let s = await sheets.spreadsheets.values.get({
      spreadsheetId: '1c6A2jXyykKjhi6PNUUsZ1F3RJbyn77rb1X6AjzaB92o',
      range: pageTitle,
    }).catch(error => {console.log(error)});
    //console.log(s);
    let r =s.data;
    return r;
    
}
async function get_site_info(auth){
    let sheet = await getSheet(auth,"Site Information");
    console.log(sheet.values[0]);
    return sheet.values[0]
}
async function get_posts(auth){
  let sheet = await getSheet(auth,"Posts")
  return sheet.values;
}
/*setup templating */
app.set('view engine', 'pug')
app.use(express.static('public'));
/* Routes */
app.get('/', async(req, res) =>{
    let data =  await get_site_info(authentication);
    let posts = await get_posts(authentication);
    posts.shift();
    console.log(posts);
    res.render('index', { title: 'Sheets CMS', message: data[1], posts:posts})
  });

  app.listen(3000, function() {
    console.log("Starting Sheets CMS Server")
  });