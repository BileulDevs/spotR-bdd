const cryptPassword = require('../helpers/cryptPassword');
const comparePassword = require('../helpers/comparePassword');
const logger = require("../config/logger");
const User = require('../models/user');
const Post = require("../models/post");

// Create User
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, provider } = req.body;

        // Vérification unicité du username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
        }

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

        const populatedUser = await User.findById(user._id).populate("subscription");

        logger.info(`User created: ${user._id}`);
        res.status(201).json(populatedUser);

    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate("subscription");
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
        const user = await User.findById(req.params.id).populate("subscription");
        if (!user) {
            logger.warn(`User not found: ${req.params.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Fetched user: ${user._id}`);
        res.json(user);
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Update Password
exports.updateUserPassword = async (req, res) => {
    try {
        const { password } = req.body;

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) {
            logger.warn(`User not found for update: ${req.params.id}`);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: password },
            { new: true }
        ).populate("subscription");

        logger.info(`Updated user password: ${user._id}`);

        res.status(200).send({ success: true, message: "Mot de passe mis à jour avec succès"})
    } catch (error) {
        logger.error(`Error updating user: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { username, password, avatar, isAdmin, isEmailVerified, confirmPassword, currentPassword } = req.body;
        const updateFields = {};

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) {
            logger.warn(`User not found for update: ${req.params.id}`);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérifie le changement de username
        if (username && username !== existingUser.username) {
            const usernameTaken = await User.findOne({ username });
            if (usernameTaken) {
                return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
            }
            updateFields.username = username;
        }

        // Gestion du mot de passe
        if (password || confirmPassword || currentPassword) {
            if (!password || !confirmPassword || !currentPassword) {
                return res.status(400).json({ message: 'Tous les champs de mot de passe sont requis' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
            }

            const isCurrentPasswordValid = await comparePassword(currentPassword, existingUser.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Le mot de passe actuel est incorrect' });
            }

            updateFields.password = await cryptPassword(password);
        }

        if (avatar !== undefined) {
            updateFields.avatar = avatar;
        }

        if (isAdmin !== undefined && req.user.isAdmin) {
            updateFields.isAdmin = isAdmin;
        }

        if (isEmailVerified !== undefined && isEmailVerified !== existingUser.isEmailVerified) {
            updateFields.isEmailVerified = isEmailVerified;

            if (isEmailVerified === true && !existingUser.isEmailVerified) {
                updateFields.emailVerifiedAt = new Date();
            } else if (isEmailVerified === false) {
                updateFields.emailVerifiedAt = null;
            }
        }

        // Mise à jour uniquement si des champs à modifier
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        ).populate("subscription");

        logger.info(`Updated user: ${user._id}`);
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json(userResponse);
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

// Verify Email
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

// Get User's Posts
exports.getUserPosts = async (req, res) => {
    try {
        const userPosts = await Post.find({ user: req.params.id }).populate("user");
        res.status(200).json({ posts: userPosts });
    } catch (err) {
        logger.error(`Erreur lors de la récupération des posts pour : ${req.params.id}`)
        res.status(500).send({ message: `Error : ${err.message}` })
    }
};
