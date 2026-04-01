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

// Define Login Logic
passport.use(new LocalStrategy((username, password, done) => {
    // Admin Credentials - Change these as needed!
    if (username === "admin" && password === "password123") {
        return done(null, { id: 1, name: "Reynaldo" });
    }
    return done(null, false, { message: 'Invalid login' });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id: 1, name: "Reynaldo" }));

// Security Gatekeeper Function
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// --- 3. PUBLIC ROUTES ---

// Home Page
app.get('/', (req, res) => {
    res.render('index');
});

// Shop Page (Reads from products.csv)
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
    res.render('shop', { products });
});

// Contact Page
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Handle Contact Form Submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    const data = `"${name}","${email}","${message}"\n`;
    fs.appendFileSync(path.join(__dirname, 'leads.csv'), data);
    res.send("<h1>Message Sent!</h1><a href='/'>Go Back</a>");
});

// --- 4. AUTH ROUTES ---

app.get('/login', (req, res) => {
    res.render('login', { error: false });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
}));

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// --- 5. ADMIN ROUTES (PROTECTED) ---

app.get('/admin', checkAuth, (req, res) => {
    // Read Leads
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
    res.render('admin', { leads });
});

// Handle adding new products from Admin
app.post('/admin/add-product', checkAuth, (req, res) => {
    const { name, price, image, description } = req.body;
    const newLine = `"${name}","${price}","${image || 'https://via.placeholder.com/150'}","${description}"\n`;
    fs.appendFileSync(path.join(__dirname, 'products.csv'), newLine);
    res.redirect('/shop');
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
