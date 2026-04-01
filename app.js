const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'reynaldo-secret-key', 
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
    if (username === "admin" && password === "password123") {
        return done(null, { id: 1, name: "Reynaldo" });
    }
    return done(null, false, { message: 'Invalid login' });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id: 1, name: "Reynaldo" }));

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

const footerHTML = `<footer style="background:#1a1a2e; color:white; padding:40px; text-align:center; border-top:3px solid #4ecca3;"><p>&copy; 2026 Reynaldo Colon</p></footer>`;

// --- SAFE ROUTES ---

app.get('/', (req, res) => res.render('index', { footer: footerHTML }));
app.get('/login', (req, res) => res.render('login', { footer: footerHTML }));

app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
}));

app.get('/shop', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'products.csv'), 'utf8');
        const products = data.split('\n').filter(line => line.trim() !== '').map(line => {
            const parts = line.split(',');
            return { name: parts[0], price: parts[1], image: parts[2], desc: parts[3] };
        });
        res.render('shop', { products, footer: footerHTML });
    } catch (err) {
        console.log("CSV Read Error:", err);
        res.render('shop', { products: [], footer: footerHTML });
    }
});

app.get('/admin', checkAuth, (req, res) => {
    res.render('admin', { footer: footerHTML });
});

app.post('/admin/add-product', checkAuth, (req, res) => {
    const { name, price, image, desc } = req.body;
    const newProduct = `\n"${name}","${price}","${image}","${desc}"`;
    fs.appendFileSync(path.join(__dirname, 'products.csv'), newProduct);
    res.redirect('/shop'); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
