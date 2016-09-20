'use strict';



function textEscapeForRE(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\n|\r|\n\r|\r\n/g, '');
}

function filterGeo(geo){

    if(geo!==null &&
        typeof geo === 'object' &&
        geo.hasOwnProperty('type') &&
        geo.type==='Feature' &&
        geo.hasOwnProperty('geometry') &&
        geo.geometry!== null &&
        typeof geo.geometry === 'object' &&
        geo.geometry.hasOwnProperty('type') &&
        geo.geometry.type==='Point' &&
        geo.geometry.hasOwnProperty('coordinates') &&
        Array.isArray(geo.geometry.coordinates) &&
        geo.geometry.coordinates.length===2
    ) {
        return {
            type: 'Feature',
            geometry:
            {
                type: 'Point',
                coordinates: [
                    parseFloat(geo.geometry.coordinates[0]),
                    parseFloat(geo.geometry.coordinates[1])
                ]
            }
        }
    }
    return null;


}

module.exports = {
    textEscapeForRE,
    filterGeo
};