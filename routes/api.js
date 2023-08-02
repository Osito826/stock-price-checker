"use strict";

const mongodb = require("mongodb");
const mongoose = require("mongoose");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports = function(app) {
  //Connect to database
  let uri = 'mongodb+srv://User1:' + process.env.PW + '@cluster0.ckgo56z.mongodb.net/stock_price_checker?retryWrites=true&w=majority';


  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  //Creating Schema
  let stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    likes: { type: Number, default: 0 },
    ips: [String],
  });
  //Creating Model
  let Stock = mongoose.model("Stock", stockSchema);

  app.route("/api/stock-prices").get(function(req, res) {
    let responseObject = {};
    responseObject["stockData"] = {};

    //Variable to determine number of stocks
    let twoStocks = false;

    /*Output Response*/
    let outputResponse = () => {
      return res.json(responseObject);
    };

    /*Find/Update Stock Document*/
    let findOrUpdateStock = async (stockName, documentUpdate, nextStep) => {
  try {
    const stockDocument = await Stock.findOneAndUpdate(
      { name: stockName },
      documentUpdate,
      { new: true, upsert: true }
    );
    if (stockDocument && !twoStocks) {
      await nextStep(stockDocument, processOneStock);
    }
  } catch (error) {
    console.log(error);
  }
};

    /*Like Stock*/
    let likeStock = (stockName, nextStep) => {
      Stock.findOne({name: stockName}, (error, stockDocument) => {
        if(!error && stockDocument && stockDocument['ips'] && stockDocument['ips'].includes(req.ip)){
          return res.send('Error: Only 1 Like per IP Allowed')
        }else{
          let documentUpdate = {$inc: {likes: 1}, $push: {ips: req.ip}}
          nextStep(stockName, documentUpdate, getPrice)
        }
      })
    };

    /*Get Price*/
    let getPrice = (stockDocument, nextStep) => {
      let xhr = new XMLHttpRequest()
      let requestUrl =
        "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + stockDocument['name'] + "/quote"
      xhr.open("GET", requestUrl, true)
      xhr.onload = () => {
        let apiResponse = JSON.parse(xhr.responseText)
        stockDocument["price"] = apiResponse["latestPrice"].toFixed(2)
        nextStep(stockDocument, outputResponse)
      }
      xhr.send()
    };

    /*Build Response for 1 Stock*/
    let processOneStock = (stockDocument, nextStep) => {
      responseObject["stockData"]["stock"] = stockDocument["name"];
      responseObject["stockData"]["price"] = stockDocument["price"];
      responseObject["stockData"]["likes"] = stockDocument["likes"];
      nextStep()
    };

    let stocks = [];
    /*Build Response for 2 Stocks*/
    let processTwoStocks = (stockDocument, nextStep) => { };

    /*Process Input*/
    if (typeof (req.query.stock) === "string") {
      /*One Stock*/
      let stockName = req.query.stock;

      let documentUpdate = {};
      if(req.query.like && req.query.like === 'true'){
        likeStock(stockName, findOrUpdateStock)
      }else{
        findOrUpdateStock(stockName, documentUpdate, getPrice)
      }
      
    } else if (Array.isArray(req.query.stock)) {
      twoStocks = true;
      /*Stock 1*/

      /*Stock 2*/
    }
  });
};