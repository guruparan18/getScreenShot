var urlToImage = require('url-to-image')
var Twit = require('twit')
var fs   = require('fs')

var T = new Twit({
  consumer_key:         'REPLACETHIS',
  consumer_secret:      'REPLACETHIS',
  access_token:         'REPLACETHIS',
  access_token_secret:  'REPLACETHIS',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
var options = {
    width: 1200,
    height: 800,
    requestTimeout: 100     // Give a short time to load additional resources
}

function make_image_and_tweet(web_url, tweet_text_in, v_id_str_in){
  urlToImage(web_url, 'tweeter.png', options).then(function() {
    var b64content = fs.readFileSync('tweeter.png', { encoding: 'base64' })

    // first we must post the media to Twitter
        T.post('media/upload', { media_data: b64content }, function (err, data, response) {
          // now we can assign alt text to the media, for use by screen readers and
          // other text-based presentations and interpreters
          var mediaIdStr = data.media_id_string
          var altText = "Get.Screen.Shot"
          var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

          T.post('media/metadata/create', meta_params, function (err, data, response) {
            if (!err) {
            // now we can reference the media and post a tweet (media will attach to the tweet)
             var params = { status: tweet_text_in, media_ids: [mediaIdStr], in_reply_to_status_id: v_id_str_in}
             T.post('statuses/update', params, function (err, data, response) {
               console.log('')
              })
            }
          })
        })
    }).catch(function(err) {
      console.error(err);
    });
}

T.get('statuses/mentions_timeline', {since_id: '827948422724481025'}, function(err, data, response) {
  //console.log(data)
  // 1.  Find if the tweet is a reply to another tweet. Use: in_reply_to_status_id_str
  //         If in_reply_to_status_id_str is not null, then use that to fetch build URL.
  if (data.length == 0) {
      console.log('No data retried.')
    } else {
      console.log(data[0].id_str)
      for (var i=0; i < data.length; i++){
          var v_id_str                          = data[i].id_str
          var v_in_reply_to_status_id_str       = data[i].in_reply_to_status_id_str
          var v_in_reply_to_screen_name         = data[i].in_reply_to_screen_name
          var v_user_screen_name                = data[i].user.screen_name
          var v_is_quote_status                 = data[i].is_quote_status
          var url_in                            = 'NO-URL'
          var tweet_text                        = '@'

          if (v_in_reply_to_screen_name) {          
            url_in         = 'https://www.twitter.com/'+ v_in_reply_to_screen_name +'/status/'+ v_in_reply_to_status_id_str
            tweet_text                        = tweet_text+v_in_reply_to_screen_name
            make_image_and_tweet(url_in, tweet_text, v_id_str)
          } else if (v_is_quote_status) {
            var v_quoted_status_id_str            = data[i].quoted_status_id_str
            var v_quoted_status_user_screen_name  = data[i].quoted_status.user.screen_name
            url_in         = 'https://www.twitter.com/'+ v_quoted_status_user_screen_name +'/status/'+ v_quoted_status_id_str
            tweet_text     = tweet_text+v_quoted_status_user_screen_name
            make_image_and_tweet(url_in, tweet_text, v_id_str)
          } else if() {
          }// End of IF-user-replied.
      } // End FOR-LOOP-data[0]
    } // End of IF-ELSE-data.length-0.
})