/*
  This is a file of data and helper functions that we can expose and use in our templating function
*/

// FS is a built in module to node that let's us read files from the system we're running on
const fs = require('fs');

// moment.js is a handy library for displaying dates. We need this in our templates to display things like "Posted 5 minutes ago"
exports.moment = require('moment');

// Dump is a handy debugging function we can use to sort of "console.log" our data
exports.dump = obj => JSON.stringify(obj, null, 2);

// inserting an SVG
exports.icon = name => fs.readFileSync(`./public/images/icons/${name}.svg`);

// Some details about the site
exports.siteName = `Picks for Playoffs`;

// Capatilze the first letter
exports.capIt = s => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

exports.menu = [
  { slug: '/bracket/2018', title: 'Bracket', icon: 'pencil' },
  { slug: '/top', title: 'Top', icon: 'top' },
  { slug: '/how-to-play', title: 'How to Play', icon: 'tag' }
];
