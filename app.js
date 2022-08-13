/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '95b982b355254218934f0196bc935241'; // Your client id
var client_secret = '7ff46356a08541e8b8d108f0e2d1f796'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Import the functions you need from the SDKs you need
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase //TODO: uncomment when we migrate to google cloud
// initializeApp({
//   credential: applicationDefault()
// });

const serviceAccount = require('./karaokesonggen-firebase-adminsdk-rli72-eab1e5bc28.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
var stateKey = 'spotify_auth_state';
var app = express();

const router = express.Router();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// app.get('/getSong', function(req, res){
//   res.render('getSong', { songids: []})
// })
app.get('/getSong', async function(req,res){
  const alldata = db.collection('groups').doc('all');
  const doc = await alldata.get();
  prior = {}
  if (!doc.exists) {
    console.log('No such document!');
  } else {
    console.log('Document data:', doc.data());
    var songorder = doc.data().songOrder
  }
  res.json(songorder)
})

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        }; 
        request.get(options, function(error, response, body) {
          console.log(body);
          pushTopSongs(body.email);
        });
        function pushTopSongs(email){
          var searchParams = new URLSearchParams();
          searchParams.append("time_range", "long_term");
          searchParams.append("limit", "50");
  
          var options = {
            url: 'https://api.spotify.com/v1/me/top/tracks',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true,
          };
          
          // use the access token to access the Spotify Web API
          request.get(options, async function(error, response, body) {
            // only allow a email to submit once
            const thisuser = db.collection('user').doc(email)
            const userdoc = await thisuser.get();
            
            if (userdoc.exists) {
              console.log('User Already Loaded Data');
            } else {
              const alldata = db.collection('groups').doc('all');
              const doc = await alldata.get();
              prior = {}
              if (!doc.exists) {
                console.log('No such document!');
              } else {
                console.log('Document data:', doc.data());
                prior = doc.data().songFrequencies
              }
              var topsongs = body.items;
              console.log(body);
              for (var i=0; i < topsongs.length; i++){
                var songid = topsongs[i].id;
                if (prior[songid] == undefined){
                  prior[songid] = 1;
                }else{
                  prior[songid] = prior[songid] + 1;
                }
              }
              var items = Object.keys(prior).map(function(key) {
                return [key, prior[key]];
              });
              console.log(items)
              // Sort the array based on the second element
              items.sort(function(first, second) {
                return second[1] - first[1];
              });
              GenSongOrder = [];
              for (var i = 0; i <items.length; i ++){
                GenSongOrder.push(items[i][0]);
              }
              const data = {
                songFrequencies: prior,
                songOrder: GenSongOrder,
              };
              const res = await db.collection('groups').doc('all').set(data);
              const userres = await db.collection('user').doc(email).set({"inited": true});
            }
            
              

          });
        }
        
        // SUCCESS!!! 
        // we can also pass the token to the browser to make requests from there
        console.log(access_token)
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
