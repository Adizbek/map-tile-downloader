var fs = require('fs'),
    request = require('request'),
    Mustache = require('mustache');
const download = require('image-downloader')

module.exports = {

    run: async function (options, callback) {
        var tileBounds;

        //turn all single curly braces in the zxy tile URL into double curly braces
        options.url = options.url.replace(/[{]/ig, '{{').replace(/[}]/ig, '}}');

        //create the "root directory" to place downloaded tiles in 
        try {
            fs.mkdirSync(options.rootDir, 0777);
        }
        catch (err) {
            if (err.code !== 'EEXIST') callback(err);
        }
        console.log('Fetching tiles from: ' + options.url);

        for (let z = options.zoom.min; z <= options.zoom.max; z++) {
            tileBounds = calcMinAndMaxValues(options.bbox, z);
            let total = Math.abs(tileBounds.xMin - tileBounds.xMax) * Math.abs(tileBounds.yMin - tileBounds.yMax);
            let curr = 1;
            for (let x = tileBounds.xMin; x < tileBounds.xMax; x++) {
                for (let y = tileBounds.yMin; y < tileBounds.yMax; y++) {
                    try {
                        console.log(`${curr} / ${total}`);
                        await getTile(x, y, z);
                        curr++;
                    } catch (e) {
                        console.log(e);
                        y--;
                    }
                }
            }

        }
        //start the recursive function that fetches tiles

        /* Function Declarations */

        //recursive function to iterate over each z, x, and y tile name
        //
        async function getTile(x, y, z) {
            let tileCoords = {
                s: Math.floor(Math.random() * 4),
                x: x,
                y: y,
                z: z,
            };

            //render the url template
            var url = Mustache.render(options.url, tileCoords);
            console.log('Fetching tile: ' + url);

            //create z directory in the root directory
            zPath = options.rootDir + '/' + tileCoords.z.toString() + '/';
            try {
                fs.mkdirSync(zPath, 0777);
            }
            catch (err) {
                if (err.code !== 'EEXIST') callback(err);
            }

            //create x directory in the z directory
            xPath = zPath + tileCoords.x.toString();
            try {
                fs.mkdirSync(xPath, 0777);
            }
            catch (err) {
                if (err.code !== 'EEXIST') callback(err);
            }

            //create writestream as z/x/y.png
            let file = xPath + '/' + tileCoords.y + '.png';


            if (fs.existsSync(file)) {
                console.log('No need to download ' + url);
                return;
            }

            const {filename, image} = await download.image({
                url: url,
                dest: file,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
                }
            });

            console.log(filename)
        }

        //given a bounding box and zoom level, calculate x and y tile ranges
        function calcMinAndMaxValues(bbox, zoom) {
            var tileBounds = {};

            /* Not sure why yMin and yMax are transposed on the tile coordinate system */
            tileBounds.yMax = lat2tile(bbox[0], zoom);
            tileBounds.xMin = long2tile(bbox[1], zoom);
            tileBounds.yMin = lat2tile(bbox[2], zoom);
            tileBounds.xMax = long2tile(bbox[3], zoom);

            let x = Math.abs(tileBounds.yMax - tileBounds.yMin) * Math.abs(tileBounds.xMax - tileBounds.xMin);

            console.log(`Will be downloaded ${x} tiles`);

            return tileBounds;
        }

        //lookup tile name based on lat/lon, courtesy of http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Lon..2Flat._to_tile_numbers
        function long2tile(lon, zoom) {
            return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
        }

        function lat2tile(lat, zoom) {
            return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
        };

    }
}


