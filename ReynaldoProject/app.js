const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => res.render('index'));

app.get('/shop', (req, res) => {
    const products = [
        { name: 'SEO E-Book', price: '$19', desc: 'Master search engines.' },
        { name: 'Node Script', price: '$49', desc: 'JS automation.' }
    ];
    res.render('shop', { products });
});

app.get('/contact', (req, res) => res.render('contact', { success: false }));

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    const csvLine = `"${name}","${email}","${message.replace(/\n/g, " ")}"\n`;
    fs.appendFileSync(path.join(__dirname, 'leads.csv'), csvLine);
    res.render('contact', { success: true });
});

app.get('/admin', (req, res) => {
    let leads = [];
    const filePath = path.join(__dirname, 'leads.csv');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8').trim();
        leads = data.split('\n').map(line => {
            const p = line.split('","').map(x => x.replace(/"/g, ''));
            return { name: p[0], email: p[1], message: p[2] };
        });
    }
    res.render('admin', { leads });
});

app.listen(3000, () => console.log('Server: http://localhost:3000'));