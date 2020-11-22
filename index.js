const sqlite3 = require('better-sqlite3');
const http = require('http');
const redis = require("redis")
const Fuse = require('fuse.js')
const fetch = require('node-fetch');

redis_client = redis.createClient();
redis_pub = redis.createClient();
const url_all = 'http://localhost:5000/fridge/all'
const url_keys = 'http://localhost:5000/fridge/keys'
let db = new sqlite3('fridge_data.db');

function get_json(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            res.setEncoding('utf-8');
            let body = ''
            res.on("data", data => {body+=data;});
            res.on("end", ()=> {
                body = JSON.parse(body);
                //console.log('done');
                resolve(body)
            });
        });
    });
}

function store_key_list(client, name, keys) {
    client.del(name)
    for (key of keys) {
        client.rpush(name, key, (err, res) => {
          if (err) {console.error(err);}
        })
    }
}

redis_client.on("error", function(error) {
  console.error(error);
});

async function main() {
  //  store keys and create sqlite table if does not exist
  let keys = await get_json(url_keys);
  store_key_list(redis_client, 'temperature_keys', keys)
  let sql_columns = keys.map(item => { 
    item = /^\d/.test(item) ? '_'+item : item;
    item = item.replace(/ /g, '_');
    return item; 
  });
    let columns = sql_columns.join(', ');
    let table_name = 'fridge'
    let sql_create = `CREATE TABLE IF NOT EXISTS ${table_name}(${columns});`
    console.log(sql_create)
    let stmt = db.prepare(sql_create)
    let info = stmt.run();
    console.log(info);
  // log data to database and pub to redis 
    setInterval(log_data, 1000);

    redis_client.quit();
}
let counter = 0;
async function log_data() {
  let temperatures = await get_json(url_all);
  console.log(counter, temperatures['Time'])
  // publish to redis
  redis_pub.publish('temperatures', JSON.stringify(temperatures), ()=>{;})
  // send to sqlite3 database
  let row = Object.values(temperatures)
  row = row.map(item => {
      if (item == 'NaN') {return 'null'}
      else if (/^[0-9,-]/.test(item)) {return item}
      else {return "\'"+item+"\'"}
  });
  row = row.join(', ')
  row_insert = `INSERT INTO fridge VALUES(${row});`
  stmt = db.prepare(row_insert)
  info = stmt.run();
  console.log(info)
  counter++;
}

// main();
// get_temperatures(url).then(res => console.log(res));
main()
// setInterval( main, 100);
console.log('hello')
