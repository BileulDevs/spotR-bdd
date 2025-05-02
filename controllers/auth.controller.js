const bcrypt = require('bcrypt');
const User = require('../models/user');
const logger = require("../config/logger");
const returnUser = require('../helpers/returnUser');
const generateToken = require('../helpers/generateToken');
const cryptPassword = require('../helpers/cryptPassword');

// Connexion User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`Attempt to login with no matching email : ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            logger.warn(`Invalid password for user : ${email}`);
            return res.status(401).json({ message: 'Invalid password' });
        }

        logger.info(`User connected : ${email}`);

        const token = generateToken(user.toObject());
        res.status(200).json({
            token: token,
            user: returnUser(user)
        });

    } catch (error) {
        logger.error(`Error while logging : ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await cryptPassword(password);

        const userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            logger.warn(`Attempted to register a user with an already registered email : ${email}`);
            return res.status(404).json({ message: 'Email already used' });
        }

        const userUsernameExists = await User.findOne({ username });
        if (userUsernameExists) {
            logger.warn(`Attempted to register a user with an already registered username : ${username}`);
            return res.status(404).json({ message: 'Username already used' });
        }

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        logger.info(`Registered user with id ${user._id}`);
        const token = generateToken(user.toObject());
        res.status(201).json({
            token: token,
            user: returnUser(user)
        });
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};