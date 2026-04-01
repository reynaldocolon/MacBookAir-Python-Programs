const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. SETUP MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// --- 2. SESSION & AUTH SETUP ---
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

// --- 3. FOOTER DATA (The "Fancy" Part) ---
// This variable sends the footer info to every page automatically
const footerHTML = `
<footer style="background:#1a1a2e; color:white; padding:40px; margin-top:50px; text-align:center; border-top:3px solid #4ecca3;">
    <div style="display:flex; justify-content:space-around; flex-wrap:wrap; max-width:1000px; margin:0 auto;">
        <div>
            <h3 style="color:#4ecca3;">Python Journey</h3>
            <p>Coding the future.</p>
        </div>
        <div>
            <h4 style="color:#4ecca3;">Links</h4>
            <a href="/" style="color:white; text-decoration:none;">Home</a> | 
            <a href="/shop" style="color:white; text-decoration:none;">Shop</a>
        </div>
    </div>
    <p style="margin-top:20px; font-size:0.8rem; opacity:0.6;">&copy; 2026 Reynaldo Colon</p>
</footer>`;

// --- 4. ROUTES ---

app.get('/', (req, res) => {
    res.render('index', { footer: footerHTML });
});

app.get('/shop', (req, res) => {
    let products = [];
    const filePath = path.join(__dirname, 'products.csv');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8').trim();
        if (data) {
            products = data.split('\n').map(line => {
                const p = line.split('","').map(x => x.replace(/"/g, ''));
                return { name: p[0], price: p[1], image: p[2], desc: p[3] };
            });
        }
    }
    res.render('shop', { products, footer: footerHTML });
});

app.get('/contact', (req, res) => {
    res.render('contact', { footer: footerHTML });
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    const data = `"${name}","${email}","${message}"\n`;
    fs.appendFileSync(path.join(__dirname, 'leads.csv'), data);
    res.send("<h1>Message Sent!</h1><a href='/'>Go Back</a>");
});

app.get('/login', (req, res) => {
    res.render('login', { error: false, footer: footerHTML });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
}));

app.get('/admin', checkAuth, (req, res) => {
    let leads = [];
    if (fs.existsSync(path.join(__dirname, 'leads.csv'))) {
        const leadData = fs.readFileSync(path.join(__dirname, 'leads.csv'), 'utf8').trim();
        if (leadData) {
            leads = leadData.split('\n').map(line => {
                const p = line.split('","').map(x => x.replace(/"/g, ''));
                return { name: p[0], email: p[1], message: p[2] };
            });
        }
    }
    res.render('admin', { leads, footer: footerHTML });
});

// --- 5. START SERVER (RENDER COMPATIBLE) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
