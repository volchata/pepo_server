function hello (req, res){
    res.send('<a href="/login">LOGIN</a>');
}

module.exports.hello = hello;
