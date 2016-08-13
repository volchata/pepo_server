function fillHellow (limit, offset){
    var helloW = [],
    offset =  offset || 0;
    helloW.length = limit || 10;

    return helloW.fill("Hello world").map((value, index) => {
            return value + '-' + (parseInt(offset) + index + 1);
    })
}

module.exports.fillHellow = fillHellow;
