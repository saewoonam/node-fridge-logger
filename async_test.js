const fetch = require('node-fetch');
const url_all = 'http://localhost:5000/fridge/all'
const url_keys = 'http://localhost:5000/fridge/keys'

out = [];

request = async () => {
    response = await fetch(url_keys);
    json = await response.json();
    json = json.map(item=>item.replace(/ /g,'_'))
    console.log(json)
    out = json;
}

// request();
// console.log(out);
// console.log(out.length)

async function retrieve() {
  return await fetch(url_keys).then(res=>res.json())
}

async function example() {
  
  out = await retrieve();
  console.log('out in example', out.length)
  return out;
}

async function example2() {
  
  out = await fetch(url_keys).then(res=>res.json())
  return out
}

(async function () {
out = await example()
})();
console.log('out', out.length)
