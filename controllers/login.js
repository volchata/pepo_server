function login (req, res){
    res.send('<a href="/auth/fb">FB</a>   <a href="/auth/vk">VK</a>');
}

module.exports.login = login;
