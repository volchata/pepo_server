function fillHellow (limit = 10, offset = 0){
    var helloW = [],
    offset =  offset;
    helloW.length = limit;

    return helloW.fill("Hello world").map((value, index) => {
            return value + '-' + (parseInt(offset) + index + 1);
    })
}

module.exports.fillHellow = fillHellow;
