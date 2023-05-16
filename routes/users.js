const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, check, validationResult } = require('express-validator');

const router = express.Router();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
    const users = await User.find();
    const errors = validationResult(req);
    const datos = { name: "", email: "" }
    res.render('index', { users, errors: errors.array(), datos });
});

router.post('/', [
    body('name').notEmpty().withMessage('El campo es requerido'),
    body('email').isEmail().withMessage('El email ingresado no es correcto'),
    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener minimo 6 caracteres')
        .matches(/^(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula y un número'),
], async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { name, email, password } = req.body
        const hash = await bcrypt.hash(password, 10);
        const newUser = new User({
            name, email, password: hash
        });
        await newUser.save();
        res.redirect('/users');
    }
    else {
        const users = await User.find();
        return res.render('index', { users, errors: errors.array(), datos: req.body });
    }
});

router.get('/edit/:id', async (req, res) => {
    const errors = validationResult(req);
    const user = await User.findById(req.params.id);
    res.render('partials/edit', { user, errors: errors.array()});
});

router.post('/update/:id', [
    body('name').notEmpty().withMessage('El campo es requerido'),
    body('email').isEmail().withMessage('El email ingresado no es correcto'),
    body('password')
        .if(check('change').equals('on'))
        .isLength({ min: 6 }).withMessage('La contraseña debe tener minimo 6 caracteres')
        .matches(/^(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula y un número'),
], async (req, res) => {
    const { name, email, change, password } = req.body
    const errors = validationResult(req);
    const user = await User.findById(req.params.id);
    if (errors.isEmpty()) {
        if (change) {
            const hash = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(req.params.id, {
                name, email, password: hash
            });
        }
        else {
            await User.findByIdAndUpdate(req.params.id, req.body)
        }
        res.redirect('/users');
    }else{
        return res.render('partials/edit', { user, errors: errors.array() });
    }
});

router.get('/delete/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/users');
});

module.exports = router;
