
module.exports = function(options){
    var fs = require('fs'),
    request = require('request'),
    Mustache = require('mustache');

    var tileCount = 0;
    var numTiles = 0;

    var tileCoords = {};

    var tileBounds;
    
    options.url = options.url.replace(/[{]/ig, '{{').replace(/[}]/ig, '}}')

    function run(callback) {

        try {fs.mkdirSync(options.rootDir, 0777);}
        catch(err){
            if (err.code !== 'EEXIST') callback(err);
        }
        console.log('getting resources from: ' + options.baseUrl);

        tileCoords.z=options.zoom.min;
        tileBounds=calcMinAndMaxValues(options.bbox, tileCoords.z);
        console.log(tileBounds);
        tileCoords.x=tileBounds.xMin;
        tileCoords.y=tileBounds.yMin;

        getTile();

        // for (var z=options.zoom.min; z<=options.zoom.max; z++){
        //     console.log(z);
        //     // calculate min and max tile values
        //     var tileBounds = calcMinAndMaxValues(options.bbox, z);
        //     console.log(tileBounds);

        //     zoomFilePath = options.rootDir +'/' + z.toString() + '/';
        //     console.log(zoomFilePath)

        //     try{fs.mkdirSync(zoomFilePath, 0777);}
        //     catch (err){
        //         if (err.code !== 'EEXIST') callback(err);
        //     }
           
            

        //     // for (var y=tileBounds.yMin; yIdx<=tileBounds.yMax; y++){
        //     //     for (var x=tileBounds.xMin; x<=minAndMaxValues.xMax; x++){
                    
        //     //         getAndStoreTile(options.baseUrl, z, x, y, options.rootDir);
        //     //         numTiles++;
        //     //     }
        //     // }
        // }
    }

    

    /* Diagram of Vertices
    (xMin, yMax)     (xMax, yMax)
         +-----------------+
         |                 |
         |                 |
         |                 |
         |        *        |
         |     (Center)    |
         |                 |
         |                 |
         +-----------------+
    (xMin, yMin)     (xMax, yMin)

    */
    /* Function Declarations */
    function mkdirErr(err){
        if (err){
            if (err.code !== 'EEXIST'){
                throw err;
            }
        }
    }

    function getTile(){
        console.log('gettile',tileCoords);
        
        //add logic for looping through x, y and z here.

        
        console.log(options.url);
        var url = Mustache.render(options.url,tileCoords);
        console.log(url);

        zPath = options.rootDir +'/' + tileCoords.z.toString() + '/';
        console.log(zPath)

        try{fs.mkdirSync(zPath, 0777);}
        catch (err){
            if (err.code !== 'EEXIST') callback(err);
        }

        xPath = zPath + tileCoords.x.toString();

        try{fs.mkdirSync(xPath, 0777);}
        catch (err){
            if (err.code !== 'EEXIST') callback(err);
        }

        var ws = fs.createWriteStream(xPath + '/' + tileCoords.y + '.png');
        ws.on('error', function(err) { console.log(err); });
        ws.on('finish', function() { //increment y
            tileCoords.y++;
            if(tileCoords.y<=tileBounds.yMax) {
                getTile();
            } else { //increment x
                tileCoords.x++;
                tileCoords.y=tileBounds.yMin;
                if(tileCoords.x<=tileBounds.xMax) {
                    getTile();
                } else { //increment z
                    tileCoords.z++;
                    tileBounds=calcMinAndMaxValues(options.bbox, tileCoords.z);
                    tileCoords.x=tileBounds.xMin;
                    tileCoords.y=tileBounds.yMin;
                    getTile();
                }
            }
        });
        request(url).pipe(ws);

        // return function(){

        //     var http = require('http-get');
            
        //     var fullUrl = buildUrl(baseUrl, zoom, x, y);
        //     var fullPath = buildPath(rootDir, zoom, x, y);
        //     var dirPath = (!newOptions.xBeforeY) ? 
        //         buildDirPath(rootDir, zoom, y) : 
        //         buildDirPath(rootDir, zoom, x);   

        //     fullUrl += newOptions.mapSourceSuffix; 

        //     try {fs.mkdirSync(dirPath, 0777);}
        //     catch(err){
        //         if (err.code !== 'EEXIST') throw err;
        //     } 

        //     http.get(fullUrl, fullPath, function(err){
        //         if (err) throw err; 
        //         tileCount += 1;
        //     });
        // };

    }

    function buildDirPath(rootDir, zoom, secondParam){
        return (rootDir + zoom.toString() + '/' + secondParam.toString() + '/');
    }

    function buildPath(rootDir, zoom, x, y){
        return (rootDir + buildSuffixPath(zoom, x, y));
    }

    function buildUrl(baseUrl, zoom, x, y){
        return (baseUrl + buildSuffixPath(zoom, x, y));
    }

    function buildSuffixPath(zoom, x, y){
        var rtnString;
        if (!newOptions.xBeforeY){
            rtnString = zoom.toString() + '/' + y.toString() + 
            '/' + x.toString();
        }
        else if (newOptions.xBeforeY){
            rtnString = zoom.toString() + '/' + x.toString() + 
            '/' + y.toString();
        }
        return (rtnString);
    }

    //given a bounding box and zoom level, calculate min and max
    function calcMinAndMaxValues(bbox, zoom){
        var tileBounds = {};

        /* Not sure why yMin and yMax are transposed on the tile coordinate system */
        tileBounds.yMax = lat2tile(bbox[0], zoom);
        tileBounds.xMin = long2tile(bbox[1], zoom);
        tileBounds.yMin = lat2tile(bbox[2], zoom);
        tileBounds.xMax = long2tile(bbox[3], zoom);

        return tileBounds;
    }

    function calcRadius(sqKms){
        var radius = Math.sqrt(sqKms);
        return radius;
    }

    function calcEndPoint(startX, startY, distance, bearing){
        var d = distance;
        var brng = bearing;
        var R = 6371; // earth's radius in km
        var endPoint = {};

        endPoint.lat = Math.asin( Math.sin(startX)*Math.cos(d/R) +
            Math.cos(startX)*Math.sin(d/R)*Math.cos(brng) );
        endPoint.lon = startY + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(startX),
            Math.cos(d/R)-Math.sin(startX)*Math.sin(endPoint.lat));

        return endPoint;
    }

    //courtesy of http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Lon..2Flat._to_tile_numbers
    function long2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
    function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }

    function convDecToRad(dec){
        return (dec*Math.PI/180);
    }

    function convRadToDec(rad){
        return (rad*180/Math.PI);
    }

    function convRadToDecCoordinates(coordinates){
        decCoordinates = {};
        decCoordinates.lat = convRadToDec(coordinates.lat);
        decCoordinates.lon = convRadToDec(coordinates.lon);
        return decCoordinates;
    }

    function checkBounds(result) {
        if (result.lat > 90 || result.lat < -90){
            console.log('latitude should be less than 90 and greater than' +
                '-90');
            return false;
        }
        if (result.lng > 180 || result.lng < -180){
            console.log('longitude should be less than 180 and greater than' +
                '-180');
            return false;
        }
        var SURFACE_AREA_OF_EARTH = 509000000;
        if (result.sqKms > SURFACE_AREA_OF_EARTH || result.sqKms < 0){
            console.log('sqKms should be greater than 0 and less than 10');
            return false;
        }
        return true;
    }

    function printVertices(vertices){
        console.log('Upper-right vertex: ', convRadToDecCoordinates(vertices.upperRight));
        console.log('Lower-right vertex: ', convRadToDecCoordinates(vertices.lowerRight));
        console.log('Lower-left vertex: ', convRadToDecCoordinates(vertices.lowerLeft));
        console.log('Upper-left vertex: ', convRadToDecCoordinates(vertices.upperLeft));
    }

    function isDefinedNotNull(inputVar){
        var valid = false;
        if (typeof inputVar !== 'undefined' && inputVar !== null){
            valid = true;
        }
        return valid;
    }

    function validateInputString(inputString){
        var inputValid = false;
        if (isDefinedNotNull(inputString) &&
            typeof inputString === 'string'){ 
            inputValid = true;
        }
        return inputValid;   
    }

    function validateZoom(inputZoom){
        var validParams = false;
        var MAX_ZOOM = 19;
        var MIN_ZOOM = 0;

        if (isDefinedNotNull(inputZoom)){
            if (isDefinedNotNull(inputZoom.max) && isDefinedNotNull(inputZoom.min) &&
                inputZoom.max > inputZoom.min && inputZoom.max <= MAX_ZOOM && inputZoom.max > MIN_ZOOM &&
                inputZoom.min < MAX_ZOOM && inputZoom.min > MIN_ZOOM){
                validParams = true;
            }
        }

        if (!validParams){
            throw new Error('Invalid input zoom parameters (0-19), max greater than min');
        } 
        return validParams;  
    }

    /**
     * If the input coordinates were not set in the constructor, then the user will
     * use this method to do so.  It also provides a way to dynamically set the 
     * coordinates without setting the other properties.  The parameters basically
     * depict a square with sqKms equaling half the length of one side.
     * @param {Number} lat - Latitude 
     * @param {Number} lng - Longitude
     * @param {Number} sqKms - The radius in square kilometers
     */
    function setInputCoordinates(lat, lng, sqKms){
        if (isDefinedNotNull(lat) && isDefinedNotNull(lng) &&
            isDefinedNotNull(sqKms)){
            newOptions.inputCoordinates.lat = lat;
            newOptions.inputCoordinates.lng = lng;
            newOptions.inputCoordinates.sqKms = sqKms;
        }
    }

    /**
     * Convenience method that figures out the advanced properties to generate
     * the correct URLs for downloading.  
     * @param {String} inputMapSource - Input map source. Acceptable values are 
     * 'mapQuestAerial', 'mapQuestOsm' and 'arcGis'
     */
    function setUrlByMapProvider(inputMapSource){
        var inputValid = false;
        if (validateInputString(inputMapSource)){
            newOptions.mapSource = inputMapSource;
            if (inputMapSource == 'mapQuestAerial' || inputMapSource == 'mapQuestOsm'){
                newOptions.baseUrl = (inputMapSource == 'mapQuestAerial') ?
                    defaults.providerUrls.mapQuestAerial :
                    defaults.providerUrls.mapQuestOsm;    
                newOptions.mapSourceSuffix = '.jpg';
                newOptions.xBeforeY = true;  
                inputValid = true;  
            } 
            else if (inputMapSource == 'arcGis'){
                newOptions.baseUrl = defaults.providerUrls.arcGis;
                newOptions.mapSourceSuffix = '';
                newOptions.xBeforeY = false;
                inputValid = true; 
            }
        }

        if (!inputValid){
            throw new Error("Invalid host name (i.e., 'mapQuestAerial','mapQuestOsm)");
        }
    }

    return {
        run: run,
        setInputCoordinates: setInputCoordinates,
        /**
         * Helper method used mainly for testing
         * @returns {CoordinatesObjectType}
         * @public
         */
        getInputCoordinates: function(){
            return newOptions.inputCoordinates;
        },
        /**
         * Set the options for this module.  They will override only the properties
         * that are different
         * @returns {CoordinatesObjectType}
         */
        setOptions: function(inputOptions){
            newOptions = override(newOptions, inputOptions, true);
        },
        /**
         * Helper method used mainly for testing
         * @returns {OptionsObjectType}
         */
        getOptions: function(){
            return newOptions;
        },
        setUrlByMapProvider: setUrlByMapProvider       
    };
};