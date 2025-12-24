const gen = require('../src/exporters/html/generate_ppe_log_html.js');
const payload = {
  payload: {
    metadata: {
      companyName: 'BRAVO BRANDS LIMITED',
      companyTagline: 'Food Safety Management System',
      date: '2025-12',
      issueDate: '17/12/2025',
      site: 'Main',
      section: 'Production',
      month: 'December',
      year: '2025',
      hseqManagerSignature: '',
      complexManagerSignature: '',
      financialControllerSignature: ''
    },
    formData: [
      { id: 1, name: 'John Doe', jobTitle: 'Chef', apron: 'tick', cap: 'tick', chefHat: '', trousers: 'tick', safetyBoots: 'tick', shirt: '', golfTShirt: '', workSuit: '', chefCoat: '', staffNrc: '', staffSign: '', supSign: '' }
    ]
  }
};
const out = gen(payload);
console.log(typeof out, out.length);
