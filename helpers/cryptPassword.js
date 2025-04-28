const bcrypt = require('bcrypt');

const cryptPassword = async (password) => { 
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = cryptPassword;