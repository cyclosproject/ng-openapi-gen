module.exports = function(handlebars) {
  // Adding a custom handlebars helper: loud
  handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
  });
};