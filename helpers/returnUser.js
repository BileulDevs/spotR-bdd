const returnUser = (user) => {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = returnUser;