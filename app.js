const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
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

// Auth Logic
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

// Global Footer Variable
const footerHTML = `
<footer style="background:#1a1a2e; color:white; padding:40px; margin-top:auto; text-align:center; border-top:3px solid #4ecca3;">
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

// Routes
app.get('/', (req, res) => { res.render('index', { footer: footerHTML }); });

app.get('/shop', (req, res) => {
    // Logic to read products.csv would go here
    res.render('shop', { products: [], footer: footerHTML });
});

app.get('/admin', checkAuth, (req, res) => {
    res.render('admin', { footer: footerHTML });
});

app.get('/login', (req, res) => res.render('login', { footer: footerHTML }));
app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
}));

// --- THE FIX FOR "CANNOT POST" ---
app.post('/admin/add-product', checkAuth, (req, res) => {
    const { name, price, image, desc } = req.body;
    const newProduct = `\n"${name}","${price}","${image}","${desc}"`;
    fs.appendFileSync(path.join(__dirname, 'products.csv'), newProduct);
    res.redirect('/shop'); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
