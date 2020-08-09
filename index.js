'use strict';
// Thêm thư viện và thiết lập http server
const
request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // Tạo http server

// Thiết lập port cho Server
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening')); // Server sẽ lắng nghe port qua biến process.env.PORT nếu đã thiết lập, còn nếu không mặc định là 1337

// Tạo webhook, ở đây bạn cứ hiểu đơn giản là 1 API
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Kiểm tra sự kiện có phải từ page hay không.
    if (body.object === 'page') {
  
      // Chạy vòng lặp đối tượng entry
      body.entry.forEach(function(entry) {
  
        // Lấy nội dung tin nhắn. entry.messaging là một mảng, nhưng 
        // nó chỉ bao gồm 1 object nên ta chỉ lấy index = 0
        let webhook_event = entry.messaging[0];
        
         // Lấy id của người dùng
        let sender_psid = webhook_event.sender.id;
        console.log('Sender ID: ' + sender_psid);

        // Kiểm tra nếu tin nhắn là text
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        }
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

  // Thêm webhook với phương thức GET
app.get('/webhook', (req, res) => {

    // Mã xác minh. Chuỗi này có thể đặt tùy ý
    let VERIFY_TOKEN = "HOC_LA_HANH"
      
    // Lấy dữ liệu từ tham số (query param)
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Kiểm tra uri đã bao gồm tham số mode và token
    if (mode && token) {
    
      // Kiểm tra giá trị của tham số (mode và token) đã đúng hay chưa
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Trả dữ liệu lại khi client gọi
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });


// Hàm xử lý dữ liệu trả về từ Your Service
function handleMessage(sender_psid, received_message) {
      // Tạo request tới api 
      request({
        "uri": `https://young-crag-92536.herokuapp.com/fashions/${received_message.text}`,
        "method": "GET",
      }, (err, res, body) => {
        var result = JSON.parse(`${body}`)
        var response = {
            "text": `Mã sản phẩm: ${result.code}\nTên sản phẩm: ${result.name}\nGía sản phẩm: ${result.price}`
        }
        callSendAPI(sender_psid, response);    
      }); 
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": { "access_token": "" },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error("Unable to send message:" + err);
      }
    }); 
  }