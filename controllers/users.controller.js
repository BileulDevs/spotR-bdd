const cryptPassword = require('../helpers/cryptPassword');
const logger = require("../config/logger");
const User = require('../models/user');

// Create User
exports.createUser = async (req, res) => {
    try {

        const { username, email, password, provider } = req.body;

        let hashedPassword = undefined;

        if (provider === 'local') {
            if (!password) {
                return res.status(400).json({ message: 'Password is required for local provider' });
            }
            hashedPassword = await cryptPassword(password);
        }

        const user = new User({
            username,
            email,
            provider,
            password: hashedPassword
        });

        await user.save();

        logger.info(`User created: ${user._id}`);
        res.status(201).json(user);

    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};
  

// Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        const sanitizedUsers = users.map(user => user);

        logger.info(`Fetched ${sanitizedUsers.length} users.`);
        res.json(sanitizedUsers);
    } catch (error) {
        logger.error(`Error fetching users: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Get One User
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            logger.warn(`User not found: ${req.params.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Fetched user: ${user._id}`);
        res.json(returnUser(user));
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const updateFields = { username, email };
        if (password) {
            updateFields.password = await cryptPassword(password);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );
        if (!user) {
            logger.warn(`User not found for update: ${req.params.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Updated user: ${user._id}`);
        res.json(returnUser(user));
    } catch (error) {
        logger.error(`Error updating user: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            logger.warn(`User not found for deletion: ${req.params.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Deleted user: ${user._id}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting user: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isEmailVerified: true });
        logger.info(`Email vérifié pour id : ${req.params.id}`)
        res.status(200).send({ message: 'Email vérifié.' });
    } catch (err) {
        logger.error(`Erreur lors de la vérification de l'email pour id : ${req.params.id}`)
        res.status(500).send({ message: `Error : ${err.message}`})
    }
};