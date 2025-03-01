const User = require('../models/userModels.js')
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',  // La tua email
      pass: 'your-email-password',   // La tua password
    },
  });

  const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};




const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const createUser = async (req, res) => {
    const { email, password } = req.body;

    // Controllo email valida
    if (!isValidEmail(email)) {
        return res.status(400).json({ messagge: 'Email non valida, inserisci un formato corretto (es. esempio@email.com)' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ messagge: 'Utente già esistente' });
        }

        // Creazione nuovo utente
        const newUser = new User({ email, password });
        await newUser.save();
        res.status(201).json({ messagge: 'Utente creato con successo' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ messagge: "Errore nel creare l'utente" });
    }
};




const updatePassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Verifica che siano stati forniti sia email che password
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email e nuova password sono richieste'
            });
        }

        // Cerca l'utente nel database
        const user = await User.findOne({ email });
        
        // Se l'utente non esiste
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        // Aggiorna la password
        user.password = newPassword;
        
        // Salva le modifiche nel database
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password aggiornata con successo'
        });

    } catch (error) {
        console.error('Errore durante l\'aggiornamento della password:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento della password'
        });
    }
};




const loginUser = async (req,res) =>{
    const {email,password} = req.body

    if (!isValidEmail(email)) {
        return res.status(400).json({ messagge: "Formato email non valido" });
    }
    
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({messagge:"Utente non trovato"});
        }

        if(user.password !== password){
            return res.status(401).json({message:"Credenziali errate"})
        }

        res.status(200).json({messagge:"Login effettuato con successo"})
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Errore nel login dell'utente"})
    }
}


const verifyEmail = async (req, res) => {
    const { email } = req.body;

    try {
        // Verifica che l'email sia stata fornita
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email richiesta'
            });
        }

        // Cerca l'utente nel database
        const user = await User.findOne({ email });
        
        // Non rivelare esplicitamente se l'email esiste per sicurezza
        return res.status(200).json({
            success: true,
            message: 'Se l\'email è registrata, riceverai un link per modificare la password',
            exists: !!user // Solo per uso interno/debug
        });

    } catch (error) {
        console.error('Errore durante la verifica dell\'email:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore durante la verifica dell\'email'
        });
    }
};




module.exports = {createUser, loginUser, verifyEmail, updatePassword}