//downloads rectified aerial photos from NYPL Mapwarper

var options = {
    url: 'http://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    // url: 'http://maps.nypl.org/warper/layers/tile/909/{z}/{x}/{y}.png',
    rootDir: 'tiles',
    bbox: [41.143, 69.097, 41.399, 69.412],
    // bbox: [37.16636,55.97708, 45.598,73.17463],
    zoom: {
        max: 10,
        min: 14
    }
};

var mapDownloader = require('../map-tile-downloader.js');

//execute mapDownloader
mapDownloader.run(options, function (err) {
    console.log(err);
    process.exit();
});