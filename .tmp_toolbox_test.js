const gen = require('./src/exporters/html/generate_toolboxtalkregister_html.js');
const payload = {payload:{metadata:{date:'24/12/2025',presenter:'Jane',agenda:'Safety'}, formData:{issues:['Wear PPE','Report hazards'], cells:{left:{1:{name:'Alice',job:'Operator',sign:''}}, right:{11:{name:'Bob',job:'Supervisor',sign:''}}}}}};
const html = gen(payload);
console.log('L:'+html.length);
console.log(html.slice(0,300));
